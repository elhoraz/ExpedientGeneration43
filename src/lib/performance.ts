/**
 * lib/performance.ts
 * Adaptive Performance Engine for Expedient Generation 43.
 * Automatically benchmarks and classifies devices into 'high' or 'low' performance tiers.
 * On low-spec devices (<=4 cores, <=4GB RAM, battery saver, slow GPU), heavy 3D, canvas loops,
 * and backdrop blurs are completely disabled to ensure 0 lag and 60 FPS smooth scrolling.
 */

"use client";

import { useState, useEffect } from "react";

export type PerformanceTier = "high" | "low";
export type PerformancePreference = "auto" | "high" | "low";

const STORAGE_KEY = "expedient_perf_tier";

/**
 * Pure heuristic to check if the current device is low-spec.
 */
export function detectLowSpecDevice(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Check user preference for reduced motion
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }

  // 2. Check Data Saver mode
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection?.saveData) {
    return true;
  }

  // 3. Hardware Concurrency (Logical CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 4 && window.innerWidth <= 768) {
    // Budget mobile phone
    return true;
  }

  // 4. Device Memory (RAM in GB, supported in Chrome/Edge/Android)
  const memory = (navigator as any).deviceMemory;
  if (typeof memory === "number" && memory <= 4) {
    return true;
  }

  return false;
}

/**
 * Get current effective tier (checks localStorage override first, then hardware heuristics).
 */
export function getInitialPerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "high";

  try {
    const saved = localStorage.getItem(STORAGE_KEY) as PerformancePreference | null;
    if (saved === "low" || saved === "high") {
      return saved;
    }
  } catch {}

  return detectLowSpecDevice() ? "low" : "high";
}

/**
 * Apply performance tier classes and attributes to <html>
 */
export function applyPerformanceTier(tier: PerformanceTier) {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  html.setAttribute("data-perf-tier", tier);

  if (tier === "low") {
    html.classList.add("low-perf-mode");
    html.classList.remove("high-perf-mode");
  } else {
    html.classList.add("high-perf-mode");
    html.classList.remove("low-perf-mode");
  }
}

/**
 * React hook to observe and control the current performance tier.
 */
export function usePerformanceTier() {
  const [tier, setTier] = useState<PerformanceTier>("high");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialTier = getInitialPerformanceTier();
    setTier(initialTier);
    applyPerformanceTier(initialTier);
    setIsReady(true);

    // Optional quick FPS health check in the first 1.5 seconds
    if (initialTier === "high") {
      let frameCount = 0;
      let startTime = performance.now();
      let animId: number;

      const checkFps = (time: number) => {
        frameCount++;
        if (time - startTime < 1000) {
          animId = requestAnimationFrame(checkFps);
        } else {
          const fps = (frameCount * 1000) / (time - startTime);
          // If frame rate is struggling under 38 FPS during initial idle/render, degrade gracefully to 'low'
          if (fps < 38) {
            console.warn(`[PERF-TIER] Low frame rate detected (${Math.round(fps)} FPS). Gracefully switching to low-spec mode.`);
            setTier("low");
            applyPerformanceTier("low");
          }
        }
      };

      animId = requestAnimationFrame(checkFps);
      return () => cancelAnimationFrame(animId);
    }
  }, []);

  const setManualTier = (pref: PerformancePreference) => {
    try {
      if (pref === "auto") {
        localStorage.removeItem(STORAGE_KEY);
        const autoTier = detectLowSpecDevice() ? "low" : "high";
        setTier(autoTier);
        applyPerformanceTier(autoTier);
      } else {
        localStorage.setItem(STORAGE_KEY, pref);
        setTier(pref);
        applyPerformanceTier(pref);
      }
    } catch {}
  };

  return {
    tier,
    isLowPerf: tier === "low",
    isReady,
    setManualTier,
  };
}
