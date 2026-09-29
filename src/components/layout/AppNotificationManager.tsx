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
                `${prayer.icon} Waktu Shalat ${prayer.name} (${prayer.time})`,
                `Telah masuk waktu shalat ${prayer.name} untuk wilayah Anda. Mari dirikan shalat tepat waktu.`
              );
            }
          } catch (bridgeErr) {
            console.warn("Native prayer alarm registration notice:", bridgeErr);
          }
        }

        // Active notification check with 50-minute grace period window
        for (const prayer of prayerList) {
          const [pHours, pMins] = prayer.time.split(":").map(Number);
          const prayerTotalMinutes = pHours * 60 + pMins;

          // Grace period window: dari tepat waktu shalat sampai 50 menit setelahnya.
          // Ini memastikan jika layar HP baru dibuka/dinyalakan saat Subuh (meski lewat beberapa menit),
          // notifikasi tidak terlewat dan tetap langsung muncul.
          const isWithinWindow =
            currentTotalMinutes >= prayerTotalMinutes &&
            currentTotalMinutes <= prayerTotalMinutes + 50;

          if (isWithinWindow) {
            const notifKey = `prayer_notif_${prayer.name}_${dateStr}`;
            if (!localStorage.getItem(notifKey)) {
              localStorage.setItem(notifKey, "1");

              await sendSystemNotification({
                title: `${prayer.icon} Waktu Shalat ${prayer.name} (${prayer.time})`,
                message: `Telah masuk waktu shalat ${prayer.name} untuk wilayah Anda. Mari dirikan shalat tepat waktu.`,
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
