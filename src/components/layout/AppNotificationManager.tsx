"use client";

import { useEffect, useRef } from "react";
import {
  isAndroidNativeApp,
  isIosNativeApp,
  initIosPushNotifications,
  requestSystemNotificationPermission,
  sendSystemNotification,
  hasSystemNotificationPermission,
} from "@/lib/notificationHelper";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { calculatePrayerTimes, PrayerSchedule } from "@/lib/prayerTimes";
import { getOfficialKemenagSchedule, DEFAULT_KEMENAG_CITY_ID } from "@/lib/kemenagPrayerTimes";
import { useToast } from "./AegisToast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/components/providers/AuthContext";

export default function AppNotificationManager() {
  const { showToast } = useToast();
  const { locale } = useLanguage();
  const { userId } = useAuth();
  const localeRef = useRef(locale);
  const userIdRef = useRef<string | null>(userId);
  const lastNativeSyncKeyRef = useRef<string>("");
  const initRef = useRef(false);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined" || initRef.current) return;
    initRef.current = true;

    const setupNotifications = async () => {
      try {
        const isApk = isAndroidNativeApp();
        const isIos = isIosNativeApp();

        if (isIos) {
          await initIosPushNotifications();
        } else if (isApk || ("Notification" in window && Notification.permission === "default")) {
          await requestSystemNotificationPermission();
        }
      } catch (err) {
        console.warn("Notification manager initialization notice:", err);
      }
    };

    setupNotifications();

    // 3. Automated Prayer Schedule Check with Grace Period Window & Immediate Execution
    const checkPrayerSchedule = async () => {
      try {
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        const dateStr = now.toISOString().slice(0, 10);

        // Default to Arrisalah Slahung Ponorogo coordinates (-7.9866, 111.4328)
        let lat = -7.9866;
        let lng = 111.4328;
        let cityId = DEFAULT_KEMENAG_CITY_ID; // 1621 (KAB. PONOROGO)

        try {
          const savedCityId = localStorage.getItem("expedient_kemenag_city_id");
          if (savedCityId) cityId = savedCityId;

          const savedLoc = localStorage.getItem("expedient_user_location");
          if (savedLoc) {
            const parsed = JSON.parse(savedLoc);
            if (parsed.lat && parsed.lng) {
              lat = parsed.lat;
              lng = parsed.lng;
            }
          }
        } catch {}

        // Calculate dynamic timezone offset from device (e.g. UTC+7 for WIB is 7)
        const tzOffset = -now.getTimezoneOffset() / 60 || 7;

        // Ambil jadwal resmi Kementerian Agama Republik Indonesia (Bimas Islam)
        const schedule: PrayerSchedule = await getOfficialKemenagSchedule(
          cityId,
          now,
          lat,
          lng,
          tzOffset
        );

        const activeLocale = localeRef.current;

        const prayerList: Array<{ name: string; label: string; time: string }> = [
          { name: "Subuh", label: activeLocale === "ar" ? "الفجر" : activeLocale === "en" ? "Fajr" : "Subuh", time: schedule.subuh },
          { name: "Dzuhur", label: activeLocale === "ar" ? "الظهر" : activeLocale === "en" ? "Dhuhr" : "Dzuhur", time: schedule.dzuhur },
          { name: "Ashar", label: activeLocale === "ar" ? "العصر" : activeLocale === "en" ? "Asr" : "Ashar", time: schedule.ashar },
          { name: "Maghrib", label: activeLocale === "ar" ? "المغرب" : activeLocale === "en" ? "Maghrib" : "Maghrib", time: schedule.maghrib },
          { name: "Isya", label: activeLocale === "ar" ? "العشاء" : activeLocale === "en" ? "Isha" : "Isya", time: schedule.isya },
        ];

        const formatPrayerTitle = (label: string, time: string) =>
          activeLocale === "ar"
            ? `حان وقت صلاة ${label} (${time})`
            : activeLocale === "en"
            ? `${label} Prayer Time (${time})`
            : `Waktu Shalat ${label} (${time})`;

        const formatPrayerBody = (label: string) =>
          activeLocale === "ar"
            ? `قد دخل وقت صلاة ${label} حسب التوقيت المحلي.`
            : activeLocale === "en"
            ? `It is now time for ${label} prayer in your local area.`
            : `Telah masuk waktu shalat ${label} sesuai jadwal wilayah Anda.`;

        // Register native Android alarms ONCE per day / schedule change instead of every 30s poll
        const nativeSyncSignature = `${dateStr}|${cityId}|${activeLocale}|${prayerList.map((p) => p.time).join(",")}`;
        if (lastNativeSyncKeyRef.current !== nativeSyncSignature) {
          lastNativeSyncKeyRef.current = nativeSyncSignature;
          if ((window as any).ExpedientNativeBridge?.schedulePrayerAlarm) {
            try {
              if ((window as any).ExpedientNativeBridge?.savePrayerSchedule) {
                (window as any).ExpedientNativeBridge.savePrayerSchedule(JSON.stringify(prayerList));
              }

              for (const prayer of prayerList) {
                const [pHours, pMins] = prayer.time.split(":").map(Number);
                (window as any).ExpedientNativeBridge.schedulePrayerAlarm(
                  prayer.name,
                  pHours,
                  pMins,
                  formatPrayerTitle(prayer.label, prayer.time),
                  formatPrayerBody(prayer.label)
                );
              }
            } catch (bridgeErr) {
              console.warn("Native prayer alarm registration notice:", bridgeErr);
            }
          } else if (Capacitor.isNativePlatform()) {
            try {
              const notifs = prayerList.map((prayer, idx) => {
                const [pHours, pMins] = prayer.time.split(":").map(Number);
                return {
                  id: 7000 + idx,
                  title: formatPrayerTitle(prayer.label, prayer.time),
                  body: formatPrayerBody(prayer.label),
                  schedule: {
                    on: { hour: pHours, minute: pMins },
                    allowWhileIdle: true,
                  },
                  extra: { url: "/kiblat" },
                };
              });
              await LocalNotifications.schedule({ notifications: notifs });
            } catch (capAlarmErr) {
              console.warn("Capacitor prayer alarm notice:", capAlarmErr);
            }
          }
        }

        const parseMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(":").map(Number);
          return h * 60 + m;
        };

        const prayerWindows = [
          {
            name: "Subuh",
            label: prayerList[0].label,
            time: schedule.subuh,
            startMinutes: parseMinutes(schedule.subuh),
            endMinutes: parseMinutes(schedule.syuruq) + 20,
          },
          {
            name: "Dzuhur",
            label: prayerList[1].label,
            time: schedule.dzuhur,
            startMinutes: parseMinutes(schedule.dzuhur),
            endMinutes: parseMinutes(schedule.ashar),
          },
          {
            name: "Ashar",
            label: prayerList[2].label,
            time: schedule.ashar,
            startMinutes: parseMinutes(schedule.ashar),
            endMinutes: parseMinutes(schedule.maghrib),
          },
          {
            name: "Maghrib",
            label: prayerList[3].label,
            time: schedule.maghrib,
            startMinutes: parseMinutes(schedule.maghrib),
            endMinutes: parseMinutes(schedule.isya),
          },
          {
            name: "Isya",
            label: prayerList[4].label,
            time: schedule.isya,
            startMinutes: parseMinutes(schedule.isya),
            endMinutes: 24 * 60 - 1,
          },
        ];

        for (const prayer of prayerWindows) {
          const isEnteringPrayerTime =
            currentTotalMinutes >= prayer.startMinutes &&
            currentTotalMinutes <= prayer.startMinutes + 3;

          if (isEnteringPrayerTime) {
            const notifKey = `prayer_notif_${prayer.name}_${dateStr}`;
            if (!localStorage.getItem(notifKey)) {
              localStorage.setItem(notifKey, "1");

              const isApk = isAndroidNativeApp();
              const isSilent = Boolean((window as any).ExpedientNativeBridge?.isDeviceSilent?.());
              const notifTitle = formatPrayerTitle(prayer.label, prayer.time);
              const notifBody = formatPrayerBody(prayer.label);

              showToast(notifTitle, notifBody, "success");

              const webAutoAudio = typeof window !== "undefined" && localStorage.getItem("expedient_web_adzan_audio") === "true";
              if (!isApk && webAutoAudio && !isSilent) {
                try {
                  const adzanAudio = new Audio("/assets/audio/adzan_makkah.mp3");
                  adzanAudio.volume = 0.8;
                  adzanAudio.play().catch(() => {});
                } catch {}
              }

              if (!isApk) {
                await sendSystemNotification({
                  title: notifTitle,
                  message: notifBody,
                  url: "/kiblat",
                });
              }
              break;
            }
          }
        }
      } catch (e) {
        console.warn("Prayer scheduler check notice:", e);
      }
    };

    checkPrayerSchedule();
    const prayerInterval = setInterval(checkPrayerSchedule, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkPrayerSchedule();
        syncNativeFcmToken();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleTriggerTest = async (e?: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      const activeLocale = localeRef.current;
      const title =
        customDetail?.title ||
        (activeLocale === "ar"
          ? "اختبار إشعارات الجهاز"
          : activeLocale === "en"
          ? "Notification Test"
          : "Uji Notifikasi Sistem");
      const message =
        customDetail?.message ||
        (activeLocale === "ar"
          ? "تم إرسال إشعار تجريبي للتحقق من تنبيهات الجهاز."
          : activeLocale === "en"
          ? "A sample alert has been sent to verify device notification delivery."
          : "Notifikasi percobaan dikirim untuk memastikan izin pemberitahuan aktif.");
      const url = customDetail?.url || "/beranda";

      await requestSystemNotificationPermission();
      const success = await sendSystemNotification({ title, message, url });

      showToast(
        success
          ? (activeLocale === "ar" ? "تم إرسال الإشعار" : activeLocale === "en" ? "Notification Sent" : "Notifikasi Terkirim")
          : (activeLocale === "ar" ? "تنبيه النظام" : activeLocale === "en" ? "System Notice" : "Pemberitahuan Sistem"),
        success
          ? (activeLocale === "ar"
              ? "تحقق من شريط الإشعارات على جهازك."
              : activeLocale === "en"
              ? "Check the notification bar on your device."
              : "Periksa bilah notifikasi pada perangkat Anda.")
          : (activeLocale === "ar"
              ? "تأكد من تفعيل إذن الإشعارات في إعدادات الجهاز."
              : activeLocale === "en"
              ? "Ensure notifications are allowed in device settings."
              : "Pastikan izin notifikasi aktif pada pengaturan perangkat."),
        success ? "success" : "info"
      );
    };

    const handleTestAdzanAlarm = (seconds: number = 5) => {
      const activeLocale = localeRef.current;
      if ((window as any).ExpedientNativeBridge?.testPrayerAlarm) {
        try {
          (window as any).ExpedientNativeBridge.testPrayerAlarm(seconds);
          showToast(
            activeLocale === "ar" ? "جدولة اختبار الأذان" : activeLocale === "en" ? "Adzan Alarm Scheduled" : "Alarm Adzan Dijadwalkan",
            activeLocale === "ar"
              ? `سينطلق تنبيه الأذان التجريبي خلال ${seconds} ثوانٍ حتى عند قفل الشاشة.`
              : activeLocale === "en"
              ? `Test alarm scheduled in ${seconds} seconds and can alert while the screen is locked.`
              : `Alarm uji dijadwalkan dalam ${seconds} detik dan dapat berbunyi saat layar terkunci.`,
            "success"
          );
          return;
        } catch (e) {
          console.error("Native testPrayerAlarm error:", e);
        }
      }

      sendSystemNotification({
        title:
          activeLocale === "ar"
            ? "اختبار تنبيه الصلاة (وضع الويب)"
            : activeLocale === "en"
            ? "Prayer Alert Test (Web Mode)"
            : "Uji Pengingat Shalat (Mode Web)",
        message:
          activeLocale === "ar"
            ? "تنبيهات الصلاة نشطة في المتصفح. يتطلب التحكم التلقائي في الوضع الصامت تطبيق أندرويد."
            : activeLocale === "en"
            ? "Browser prayer alerts are active. Automatic silent-switch detection requires the native Android app."
            : "Notifikasi shalat aktif di peramban. Deteksi mode hening perangkat tersedia di aplikasi Android.",
        url: "/kiblat",
      });
      showToast(
        activeLocale === "ar" ? "وضع المتصفح" : activeLocale === "en" ? "Silent Mode Notice" : "Informasi Mode Hening",
        activeLocale === "ar"
          ? "المتصفحات لا تسمح بقراءة حالة الصامت للهاتف؛ هذه الخاصية تعمل داخل تطبيق أندرويد."
          : activeLocale === "en"
          ? "Web browsers cannot read your phone hardware silent switch; full DND sync works in the Android app."
          : "Peramban web tidak dapat membaca status tombol hening perangkat; fitur tersebut bekerja di aplikasi Android.",
        "info"
      );
    };

    const handleDefaultTestAdzan = () => handleTestAdzanAlarm(5);

    (window as any).triggerExpedientNotification = handleTriggerTest;
    (window as any).testAdzanAlarm = handleTestAdzanAlarm;
    window.addEventListener("expedient_trigger_test_notif", handleTriggerTest);
    window.addEventListener("expedient_test_adzan_alarm", handleDefaultTestAdzan);
    window.addEventListener("expedient_location_updated", checkPrayerSchedule);

    // 6. Automatic Native Android FCM Device Token Registration with User Binding
    const syncNativeFcmToken = async () => {
      try {
        let token = "";
        if ((window as any).ExpedientNativeBridge?.getFcmToken) {
          token = (window as any).ExpedientNativeBridge.getFcmToken();
        }

        if (!token || token.trim().length < 10) return;

        const currentUserId = userIdRef.current;
        if (!currentUserId) {
          // If not logged in yet, token will be synced when AuthContext updates userId
          return;
        }

        const userSyncKey = `expedient_synced_fcm_${currentUserId}`;
        const lastTokenForUser = localStorage.getItem(userSyncKey);

        if (lastTokenForUser === token) {
          return; // Already registered for this user
        }

        console.log("[FCM] Registering device push token for user:", currentUserId);
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "fcm:" + token,
            keys: {
              p256dh: "fcm",
              auth: "fcm",
            },
          }),
        });

        if (res.ok) {
          localStorage.setItem(userSyncKey, token);
          console.log("[FCM] Successfully registered device push token to database for user:", currentUserId);
        } else {
          console.warn("[FCM] Failed to register push token:", res.status);
        }
      } catch (fcmErr) {
        console.warn("[FCM] Token sync notice:", fcmErr);
      }
    };

    // Check token on mount and retry after delay
    syncNativeFcmToken();
    const fcmTimer1 = setTimeout(syncNativeFcmToken, 1500);
    const fcmTimer2 = setTimeout(syncNativeFcmToken, 5000);

    const handleFcmTokenEvent = (e: any) => {
      const newToken = e?.detail?.token;
      if (newToken) {
        syncNativeFcmToken();
      }
    };
    const handleSyncFcmInternal = () => syncNativeFcmToken();
    window.addEventListener("expedient_fcm_token", handleFcmTokenEvent);
    window.addEventListener("expedient_sync_fcm_internal", handleSyncFcmInternal);
    (window as any).onExpedientFcmToken = () => {
      syncNativeFcmToken();
    };

    return () => {
      clearInterval(prayerInterval);
      clearTimeout(fcmTimer1);
      clearTimeout(fcmTimer2);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("expedient_trigger_test_notif", handleTriggerTest);
      window.removeEventListener("expedient_test_adzan_alarm", handleDefaultTestAdzan);
      window.removeEventListener("expedient_fcm_token", handleFcmTokenEvent);
      window.removeEventListener("expedient_sync_fcm_internal", handleSyncFcmInternal);
      window.removeEventListener("expedient_location_updated", checkPrayerSchedule);
      delete (window as any).triggerExpedientNotification;
      delete (window as any).testAdzanAlarm;
      delete (window as any).onExpedientFcmToken;
    };
  }, [showToast]);

  // Trigger FCM sync automatically when AuthContext resolves or updates userId
  useEffect(() => {
    if (userId && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("expedient_sync_fcm_internal"));
    }
  }, [userId]);

  return null;
}
