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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Optional: unobserve to lock in reveal state
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const observeElements = () => {
      const targets = document.querySelectorAll(
        ".reveal-on-scroll:not(.is-visible), .reveal-stagger:not(.is-visible)"
      );
      targets.forEach((el) => observer.observe(el));
    };

    observeElements();

    // Re-check briefly after mount to catch components that finish client rendering
    const timer = setTimeout(observeElements, 400);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
