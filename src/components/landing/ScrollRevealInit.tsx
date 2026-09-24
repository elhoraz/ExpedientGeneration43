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

    const wrapper = document.querySelector(".landing-wrapper") as HTMLElement | null;

    // Track scroll direction to enable smart bidirectional animations (up and down)
    let lastScrollTop = 0;
    const handleScrollDir = () => {
      const currentScroll = wrapper ? wrapper.scrollTop : window.scrollY;
      const dir = currentScroll >= lastScrollTop ? "down" : "up";
      document.documentElement.setAttribute("data-scroll-dir", dir);
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };

    if (wrapper) {
      wrapper.addEventListener("scroll", handleScrollDir, { passive: true });
    }
    window.addEventListener("scroll", handleScrollDir, { passive: true, capture: true });
    handleScrollDir();

    // IntersectionObserver that works BIDIRECTIONALLY:
    // When elements enter viewport: add .is-visible.
    // When elements exit viewport: remove .is-visible so that scrolling back
    // towards them (either upwards or downwards) triggers the entrance animation again!
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            // Un-reveal when out of viewport so scrolling in opposite direction re-animates
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        root: null, // Track against browser viewport
        threshold: 0.08,
        rootMargin: "-15px 0px -15px 0px",
      }
    );

    const observeElements = () => {
      const targets = document.querySelectorAll(
        ".reveal-on-scroll, .reveal-stagger, .daily-wisdom-banner, .tuku-stats-ribbon, .tuku-running-ribbon"
      );
      targets.forEach((el) => observer.observe(el));
    };

    observeElements();

    // Re-check after mount for client components
    const timer1 = setTimeout(observeElements, 250);
    const timer2 = setTimeout(observeElements, 800);

    return () => {
      if (wrapper) wrapper.removeEventListener("scroll", handleScrollDir);
      window.removeEventListener("scroll", handleScrollDir, { capture: true });
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
    };
  }, []);

  return null;
}
