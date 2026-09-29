"use client";

import { useEffect, useRef } from "react";
import {
  isAndroidNativeApp,
  requestSystemNotificationPermission,
  sendSystemNotification,
  hasSystemNotificationPermission,
} from "@/lib/notificationHelper";
import { calculatePrayerTimes, PrayerSchedule } from "@/lib/prayerTimes";
import { useToast } from "./AegisToast";

export default function AppNotificationManager() {
  const { showToast } = useToast();
  const initRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || initRef.current) return;
    initRef.current = true;

    const setupNotifications = async () => {
      try {
        const isApk = isAndroidNativeApp();

        // 1. Request permission if running in APK or permission is default
        if (isApk || ("Notification" in window && Notification.permission === "default")) {
          await requestSystemNotificationPermission();
        }

        // 2. Send instant welcome/heads-up banner notification on first launch or new session
        const sessionKey = "expedient_session_notif_sent";
        const hasSent = sessionStorage.getItem(sessionKey);

        if (!hasSent) {
          sessionStorage.setItem(sessionKey, "1");

          // Delay slightly so app UI is fully painted and visible
          setTimeout(async () => {
            const success = await sendSystemNotification({
              title: "⚜️ Expedient Generation 43",
              message: "Notifikasi melayang aktif! Jadwal shalat, agenda reuni, dan kabar alumni siap dikirimkan.",
              url: "/kiblat",
            });

            if (success && !isApk) {
              showToast(
                "Notifikasi Sistem Aktif",
                "Notifikasi melayang dan pengingat waktu shalat siap berjalan.",
                "success"
              );
            }
          }, 2000);
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
        }

        // Definisi jendela waktu shalat penuh sesuai durasi waktu shalat:
        // - Subuh: Dari masuk Subuh sampai Syuruq (+20 menit toleransi)
        // - Dzuhur: Dari masuk Dzuhur (11:26) sampai masuk Ashar (14:37)
        // - Ashar: Dari masuk Ashar (14:37) sampai masuk Maghrib (17:31)
        // - Maghrib: Dari masuk Maghrib (17:31) sampai masuk Isya (18:40)
        // - Isya: Dari masuk Isya (18:40) sampai tengah malam (23:59)
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

              // Play adzan sound if app is currently in foreground
              try {
                const adzanAudio = new Audio("/assets/audio/adzan_makkah.mp3");
                adzanAudio.volume = 1.0;
                adzanAudio.play().catch(() => {});
              } catch {}

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

    (window as any).triggerExpedientNotification = handleTriggerTest;
    window.addEventListener("expedient_trigger_test_notif", handleTriggerTest);

    return () => {
      clearInterval(prayerInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("expedient_trigger_test_notif", handleTriggerTest);
      delete (window as any).triggerExpedientNotification;
    };
  }, [showToast]);

  return null;
}
