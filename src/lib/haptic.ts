/**
 * Safe haptic vibration utility for Expedient Generation
 * Prevents Uncaught TypeError or Illegal Invocation on browsers without Vibration API.
 */
export function triggerHaptic(pattern: number | number[] = 15): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // Gracefully ignore on unsupported devices or restricted iframes
  }
}
