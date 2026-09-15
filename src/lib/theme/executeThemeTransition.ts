/**
 * executeThemeTransition.ts
 * Awwwards-Grade Seamless Theme Transition Engine
 * Combines View Transition API (Circular Ripple Reveal) + Synchronized Fallback
 */

export function executeThemeTransition(
  nextTheme: "dark" | "light",
  event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }
) {
  const applyTheme = () => {
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("expedient_theme", nextTheme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", nextTheme === "light" ? "#f8fafc" : "#060b14");
    }
  };

  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  // Check if browser supports View Transition API and user hasn't requested reduced motion
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof (document as Document & { startViewTransition?: unknown }).startViewTransition !== "function" || prefersReducedMotion) {
    applyTheme();
    return;
  }

  // Calculate origin coordinates for the circular ripple reveal
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event) {
    if ("currentTarget" in event && event.currentTarget instanceof HTMLElement) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if ("clientX" in event && typeof event.clientX === "number" && event.clientX > 0) {
      x = event.clientX;
      y = event.clientY;
    }
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  try {
    const transition = (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void> } }).startViewTransition(() => {
      applyTheme();
    });

    transition.ready
      .then(() => {
        // Smooth circular clip-path expansion from the click coordinates
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 480,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {
        applyTheme();
      });
  } catch {
    applyTheme();
  }
}
