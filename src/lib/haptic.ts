/**
 * Safe haptic vibration utility for Expedient Generation
 * Prevents Uncaught TypeError or Illegal Invocation on browsers without Vibration API.
 */
export type HapticPattern = 
  | number 
  | number[] 
  | "light" 
  | "medium" 
  | "heavy" 
  | "selection" 
  | "notification" 
  | "success" 
  | "error";

const PRESETS: Record<string, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 45,
  selection: 15,
  notification: [50, 50, 100],
  success: [30, 40, 50],
  error: [50, 100, 50, 100],
};

export function triggerHaptic(pattern: HapticPattern = 15): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
      const resolved = typeof pattern === "string" ? (PRESETS[pattern] || 15) : pattern;
      navigator.vibrate(resolved);
    }
  } catch {
    // Gracefully ignore on unsupported devices or restricted iframes
  }
}
