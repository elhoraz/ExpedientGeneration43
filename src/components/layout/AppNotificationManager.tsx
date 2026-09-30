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
import { useToast } from "./AegisToast";

import { createClient } from "@/lib/supabase/client";

export default function AppNotificationManager() {
  const { showToast } = useToast();
  const initRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || initRef.current) return;
    initRef.current = true;

    const supabase = createClient();

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

        try {
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

        const schedule: PrayerSchedule = calculatePrayerTimes(lat, lng, tzOffset, now);
        const prayerList: Array<{ name: string; time: string; icon: string }> = [
          { name: "Subuh", time: schedule.subuh, icon: "🌅" },
          { name: "Dzuhur", time: schedule.dzuhur, icon: "☀️" },
          { name: "Ashar", time: schedule.ashar, icon: "🌤️" },
          { name: "Maghrib", time: schedule.maghrib, icon: "🌇" },
          { name: "Isya", time: schedule.isya, icon: "🌙" },
        ];

        // Register native Android alarms if running inside APK Native Bridge
        if ((window as any).ExpedientNativeBridge?.schedulePrayerAlarm) {
          try {
            for (const prayer of prayerList) {
              const [pHours, pMins] = prayer.time.split(":").map(Number);
              (window as any).ExpedientNativeBridge.schedulePrayerAlarm(
                prayer.name,
                pHours,
                pMins,
                `🕌 Waktu Shalat ${prayer.name} (${prayer.time} WIB)`,
                `Allahu Akbar, Allahu Akbar... Telah masuk waktu shalat ${prayer.name} untuk wilayah Anda. Mari tunaikan shalat tepat waktu.`
              );
            }
          } catch (bridgeErr) {
            console.warn("Native prayer alarm registration notice:", bridgeErr);
          }
        } else if (Capacitor.isNativePlatform()) {
          // Register native alarms via Capacitor LocalNotifications on iOS
          try {
            const notifs = prayerList.map((prayer, idx) => {
              const [pHours, pMins] = prayer.time.split(":").map(Number);
              return {
                id: 7000 + idx,
                title: `🕌 Waktu Shalat ${prayer.name} (${prayer.time})`,
                body: `Allahu Akbar, Allahu Akbar... Telah masuk waktu shalat ${prayer.name} untuk wilayah Anda. Mari tunaikan shalat tepat waktu.`,
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

        const parseMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(":").map(Number);
          return h * 60 + m;
        };

        const prayerWindows = [
          {
            name: "Subuh",
            time: schedule.subuh,
            startMinutes: parseMinutes(schedule.subuh),
            endMinutes: parseMinutes(schedule.syuruq) + 20,
            icon: "🌅",
          },
          {
            name: "Dzuhur",
            time: schedule.dzuhur,
            startMinutes: parseMinutes(schedule.dzuhur),
            endMinutes: parseMinutes(schedule.ashar),
            icon: "☀️",
          },
          {
            name: "Ashar",
            time: schedule.ashar,
            startMinutes: parseMinutes(schedule.ashar),
            endMinutes: parseMinutes(schedule.maghrib),
            icon: "🌤️",
          },
          {
            name: "Maghrib",
            time: schedule.maghrib,
            startMinutes: parseMinutes(schedule.maghrib),
            endMinutes: parseMinutes(schedule.isya),
            icon: "🌇",
          },
          {
            name: "Isya",
            time: schedule.isya,
            startMinutes: parseMinutes(schedule.isya),
            endMinutes: 24 * 60 - 1, // hingga 23:59
            icon: "🌙",
          },
        ];

        // Active notification check: apakah sekarang berada di dalam waktu shalat aktif
        for (const prayer of prayerWindows) {
          const isWithinWindow =
            currentTotalMinutes >= prayer.startMinutes &&
            currentTotalMinutes < prayer.endMinutes;

          if (isWithinWindow) {
            const notifKey = `prayer_notif_${prayer.name}_${dateStr}`;
            if (!localStorage.getItem(notifKey)) {
              localStorage.setItem(notifKey, "1");

              // In native APK or silent mode, suppress web audio so native receiver handles audio appropriately
              const isNative = Boolean((window as any).ExpedientNativeBridge);
              const isSilent = Boolean((window as any).ExpedientNativeBridge?.isDeviceSilent?.());
              if (!isNative && !isSilent) {
                try {
                  const adzanAudio = new Audio("/assets/audio/adzan_makkah.mp3");
                  adzanAudio.volume = 1.0;
                  adzanAudio.play().catch(() => {});
                } catch {}
              }

              await sendSystemNotification({
                title: `🕌 Waktu Shalat ${prayer.name} (${prayer.time} WIB)`,
                message: `Allahu Akbar, Allahu Akbar... Sedang masuk waktu shalat ${prayer.name} untuk wilayah Anda. Mari tunaikan shalat tepat waktu.`,
                url: "/kiblat",
              });
              break;
            }
          }
        }
      } catch (e) {
        console.warn("Prayer scheduler check notice:", e);
      }
    };

    // Run immediately on app load
    checkPrayerSchedule();

    // Re-check every 30 seconds
    const prayerInterval = setInterval(checkPrayerSchedule, 30000);

    // Re-check immediately when phone screen turns on or user switches back to app
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkPrayerSchedule();
        syncNativeFcmToken();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 4. Global Test Notification Trigger (Custom event & Window helper)
    const handleTriggerTest = async (e?: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      const title = customDetail?.title || "🔔 Uji Notifikasi Melayang";
      const message =
        customDetail?.message ||
        "Notifikasi sistem resmi dengan suara, getaran, dan heads-up banner berfungsi sempurna di HP Anda!";
      const url = customDetail?.url || "/beranda";

      await requestSystemNotificationPermission();
      const success = await sendSystemNotification({ title, message, url });

      showToast(
        success ? "Notifikasi Terkirim" : "Pemberitahuan Sistem",
        success
          ? "Notifikasi melayang telah dikirim ke status bar HP Anda!"
          : "Notifikasi telah dikirim. Pastikan izin notifikasi aktif di pengaturan HP.",
        success ? "success" : "info"
      );
    };

    // 5. Global Adzan Lockscreen Alarm Test Trigger
    const handleTestAdzanAlarm = (seconds: number = 5) => {
      if ((window as any).ExpedientNativeBridge?.testPrayerAlarm) {
        try {
          (window as any).ExpedientNativeBridge.testPrayerAlarm(seconds);
          showToast(
            "Alarm Adzan Diuji",
            `Alarm adzan disetel dalam ${seconds} detik. Anda bisa langsung kunci layar HP sekarang untuk mencoba kumandang adzan di layar kunci!`,
            "success"
          );
          return;
        } catch (e) {
          console.error("Native testPrayerAlarm error:", e);
        }
      }

      // Web Fallback: Play Adzan audio directly
      try {
        const audio = new Audio("/assets/audio/adzan_makkah.mp3");
        audio.volume = 1.0;
        audio.play().catch(() => {});
        sendSystemNotification({
          title: "🕌 Kumandang Adzan Makkah",
          message: "Allahu Akbar, Allahu Akbar... Kumandang adzan shalat berhasil diuji.",
          url: "/kiblat",
        });
        showToast(
          "Kumandang Adzan Berbunyi",
          "Suara adzan Makkah sedang diputar secara real-time.",
          "success"
        );
      } catch (err) {
        console.error("Web audio adzan error:", err);
      }
    };

    (window as any).triggerExpedientNotification = handleTriggerTest;
    (window as any).testAdzanAlarm = handleTestAdzanAlarm;
    window.addEventListener("expedient_trigger_test_notif", handleTriggerTest);
    window.addEventListener("expedient_test_adzan_alarm", () => handleTestAdzanAlarm(5));

    // 6. Automatic Native Android FCM Device Token Registration with User Binding
    const syncNativeFcmToken = async () => {
      try {
        let token = "";
        if ((window as any).ExpedientNativeBridge?.getFcmToken) {
          token = (window as any).ExpedientNativeBridge.getFcmToken();
        }

        if (!token || token.trim().length < 10) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // If not logged in yet, token will be registered once user logs in
          return;
        }

        const userSyncKey = `expedient_synced_fcm_${user.id}`;
        const lastTokenForUser = localStorage.getItem(userSyncKey);

        if (lastTokenForUser === token) {
          return; // Already registered for this user
        }

        console.log("[FCM] Registering device push token for user:", user.id);
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
          console.log("[FCM] Successfully registered device push token to database for user:", user.id);
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

    // Re-sync on auth state changes (login, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncNativeFcmToken();
      }
    });

    const handleFcmTokenEvent = (e: any) => {
      const newToken = e?.detail?.token;
      if (newToken) {
        syncNativeFcmToken();
      }
    };
    window.addEventListener("expedient_fcm_token", handleFcmTokenEvent);
    (window as any).onExpedientFcmToken = (token: string) => {
      syncNativeFcmToken();
    };

    return () => {
      clearInterval(prayerInterval);
      clearTimeout(fcmTimer1);
      clearTimeout(fcmTimer2);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("expedient_trigger_test_notif", handleTriggerTest);
      window.removeEventListener("expedient_fcm_token", handleFcmTokenEvent);
      authListener?.subscription?.unsubscribe();
      delete (window as any).triggerExpedientNotification;
      delete (window as any).testAdzanAlarm;
      delete (window as any).onExpedientFcmToken;
    };
  }, [showToast]);

  return null;
}
