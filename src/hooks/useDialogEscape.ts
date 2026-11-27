"use client";

import { useEffect, useRef } from "react";

const activeDialogClosers: Array<() => void> = [];

if (typeof window !== "undefined") {
  (window as any).__expedientHandleBack = () => {
    if (activeDialogClosers.length === 0) return false;
    const closeTopDialog = activeDialogClosers[activeDialogClosers.length - 1];
    try {
      closeTopDialog();
      return true;
    } catch {
      return false;
    }
  };
}

/**
 * Attaches an Escape key handler and Android hardware-Back handler while a dialog
 * or modal is open, restoring focus to the trigger element when it closes.
 */
export function useDialogEscape(
  isOpen: boolean,
  onClose: () => void,
  disabled = false
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const closeWrapper = () => {
      if (!disabled) {
        onCloseRef.current();
      }
    };
    activeDialogClosers.push(closeWrapper);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !disabled &&
        activeDialogClosers[activeDialogClosers.length - 1] === closeWrapper
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      const idx = activeDialogClosers.lastIndexOf(closeWrapper);
      if (idx !== -1) activeDialogClosers.splice(idx, 1);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, disabled]);
}
