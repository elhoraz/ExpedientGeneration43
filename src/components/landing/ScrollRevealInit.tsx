"use client";

import { useEffect } from "react";

export default function ScrollRevealInit() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    // Check for user preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      document.querySelectorAll(".reveal-on-scroll, .reveal-stagger").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }

    // Bidirectional IntersectionObserver with hysteresis buffer.
    // Adds .is-visible when entering viewport.
    // ONLY removes .is-visible when comfortably outside the viewport (120px buffer),
    // which completely eliminates boundary flutter / oscillation loops.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            const rect = entry.boundingClientRect;
            const vh = window.innerHeight || document.documentElement.clientHeight;
            // Only un-reveal when element has cleanly left the viewport with safety margin
            if (rect.top > vh + 120 || rect.bottom < -120) {
              entry.target.classList.remove("is-visible");
            }
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const observeElements = () => {
      const targets = document.querySelectorAll(".reveal-on-scroll, .reveal-stagger");
      targets.forEach((el) => observer.observe(el));
    };

    observeElements();

    // Re-check after dynamic client hydration
    const timer1 = setTimeout(observeElements, 250);
    const timer2 = setTimeout(observeElements, 750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
    };
  }, []);

  return null;
}

