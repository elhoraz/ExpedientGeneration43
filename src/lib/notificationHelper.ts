import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

export type SystemNotificationOptions = {
  title: string;
  message: string;
  url?: string;
  tag?: string;
  icon?: string;
};

/**
 * Checks if the current environment is running inside the Android APK with Native Bridge
 */
export function isAndroidNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).ExpedientNativeBridge);
}

/**
 * Checks if running inside iOS Native Shell via Capacitor
 */
export function isIosNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

/**
 * Checks if running inside any Native Mobile App (Android APK or iOS)
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return isAndroidNativeApp() || (typeof Capacitor !== "undefined" && Capacitor.isNativePlatform());
}

/**
 * Checks if notification permission is currently granted
 */
export function hasSystemNotificationPermission(): boolean {
  if (typeof window === "undefined") return false;

  if (isAndroidNativeApp()) {
    try {
      return Boolean((window as any).ExpedientNativeBridge?.hasNotificationPermission?.());
    } catch {
      return false;
    }
  }

  if (typeof Capacitor !== "undefined" && Capacitor.isNativePlatform()) {
    // On Capacitor iOS/Android, permission is checked asynchronously or considered granted if registered
    return true;
  }

  if ("Notification" in window) {
    return Notification.permission === "granted";
  }

  return false;
}

/**
 * Initializes iOS Native Push Notifications (APNs) and listeners
 */
export async function initIosPushNotifications(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Request push notification permission
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive === "granted") {
      // 2. Register with Apple Push Notification service (APNs)
      await PushNotifications.register();
    }

    // Also request local notification permissions for offline prayer alerts
    await LocalNotifications.requestPermissions();

    // 3. Listen for device token and propagate to application
    await PushNotifications.addListener("registration", (token) => {
      console.log("[iOS Push] Device token successfully registered:", token.value);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("expedient_fcm_token", { detail: { token: token.value } }));
        if ((window as any).onExpedientFcmToken) {
          (window as any).onExpedientFcmToken(token.value);
        }
      }
    });

    // 4. Handle incoming notification when app is active
    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[iOS Push] Notification received in foreground:", notification);
    });

    // 5. Handle user tap on notification banner
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[iOS Push] User tapped notification:", action);
      const targetUrl = action.notification.data?.url || action.notification.data?.navigate_to;
      if (targetUrl && typeof window !== "undefined") {
        window.location.href = targetUrl;
      }
    });
  } catch (err) {
    console.warn("[iOS Push] Native initialization notice:", err);
  }
}

/**
 * Requests notification permissions from Android Native, iOS Capacitor, or Browser
 */
export async function requestSystemNotificationPermission(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (typeof window === "undefined") return "unsupported";

  // 1. Android APK Native Bridge (Android 13+ runtime dialog)
  if (isAndroidNativeApp()) {
    try {
      (window as any).ExpedientNativeBridge.requestNotificationPermission?.();
      const granted = (window as any).ExpedientNativeBridge.hasNotificationPermission?.();
      return granted ? "granted" : "default";
    } catch (e) {
      console.warn("Native notification permission notice:", e);
    }
  }

  // 2. iOS / Capacitor Native Shell
  if (typeof Capacitor !== "undefined" && Capacitor.isNativePlatform()) {
    try {
      const pushPerm = await PushNotifications.requestPermissions();
      if (pushPerm.receive === "granted") {
        await PushNotifications.register();
        await LocalNotifications.requestPermissions();
        return "granted";
      }
      return pushPerm.receive === "denied" ? "denied" : "default";
    } catch (e) {
      console.warn("Capacitor notification permission notice:", e);
    }
  }

  // 3. Standard Browser / PWA Notification API
  if ("Notification" in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch (e) {
      console.warn("Browser Notification.requestPermission notice:", e);
      return "denied";
    }
  }

  return "unsupported";
}

/**
 * Triggers a real native system notification with sound, vibration, and banner
 */
export async function sendSystemNotification({
  title,
  message,
  url = "/",
  tag,
  icon = "/icon-192.png",
}: SystemNotificationOptions): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Android APK Native Bridge: Instant high-importance native Android Notification
  if ((window as any).ExpedientNativeBridge?.showNotification) {
    try {
      (window as any).ExpedientNativeBridge.showNotification(title, message, url);
      return true;
    } catch (e) {
      console.warn("Failed to trigger Android native notification:", e);
    }
  }

  // 2. iOS & Capacitor Native: Instant UNUserNotificationCenter Local Notification
  if (typeof Capacitor !== "undefined" && Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || "Expedient 43",
            body: message || "",
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
            extra: { url },
            sound: "beep.caf",
          },
        ],
      });
      return true;
    } catch (capErr) {
      console.warn("Capacitor LocalNotification notice:", capErr);
    }
  }

  // 3. Service Worker showNotification (Best for Android Chrome & PWA)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, {
          body: message,
          icon,
          badge: "/icon-192.png",
          tag: tag || "expedient-system-notif",
          vibrate: [100, 50, 100],
          data: { url },
        } as any);
        return true;
      }
    } catch (e) {
      console.warn("ServiceWorker showNotification notice:", e);
    }
  }

  // 4. Fallback to standard window.Notification
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(title, {
        body: message,
        icon,
        tag: tag || "expedient-system-notif",
      });
      n.onclick = () => {
        window.focus();
        if (url && url !== window.location.pathname) {
          window.location.href = url;
        }
      };
      return true;
    } catch (e) {
      console.warn("Window Notification notice:", e);
    }
  }

  return false;
}
