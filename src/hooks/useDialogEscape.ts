"use client";

import { useEffect, useRef } from "react";

/**
 * Attaches an Escape key handler while a dialog or modal is open,
 * and restores focus to the trigger element when it closes.
 */
export function useDialogEscape(
  isOpen: boolean,
  onClose: () => void,
  disabled = false
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose, disabled]);
}
