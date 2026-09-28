// src/lib/notificationHelper.ts

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

  if ("Notification" in window) {
    return Notification.permission === "granted";
  }

  return false;
}

/**
 * Requests notification permissions from either Android Native or Browser
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

  // 2. Standard Browser / PWA Notification API
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

  // 2. Service Worker showNotification (Best for Android Chrome & PWA)
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

  // 3. Fallback to standard window.Notification
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
