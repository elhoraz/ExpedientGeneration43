"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

// Toast context for global access
type ToastType = "success" | "error" | "info";
const ToastContext = createContext<{
  showToast: (title: string, message: string, type?: ToastType) => void;
}>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: ToastType;
    visible: boolean;
  } | null>(null);

  const showToast = useCallback((title: string, message: string, type: ToastType = "success") => {
    setToast({ title, message, type, visible: true });
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 5500);

    setTimeout(() => {
      setToast(null);
    }, 6200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          id="aegisToast"
          className={`aegis-toast ${toast.visible ? 'show' : ''}`}
          style={{
            position: "fixed",
            bottom: "40px",
            left: "50%",
            transform: `translateX(-50%) translateY(${toast.visible ? '0' : '150px'})`,
            width: "90%",
            maxWidth: "420px",
            background: "var(--bg-card, #0f141e)",
            border: "1px solid var(--glass-border, rgba(242, 239, 233, 0.14))",
            borderLeft: `4px solid ${toast.type === "error" ? "var(--ruby-gem, #f87171)" : "var(--gold-main, #d4af37)"}`,
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: "var(--glass-shadow, 0 16px 36px rgba(0, 0, 0, 0.45))",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease",
            opacity: toast.visible ? 1 : 0,
          }}
        >
          <i
            className="fa-solid fa-compass-drafting"
            style={{
              fontSize: "1.35rem",
              color: toast.type === "error" ? "var(--ruby-gem, #f87171)" : "var(--gold-main, #d4af37)",
              flexShrink: 0,
            }}
          ></i>
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: toast.type === "error" ? "var(--ruby-gem, #f87171)" : "var(--text-secondary, #a1a8b5)",
                marginBottom: "3px",
              }}
            >
              {toast.title}
            </span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "0.94rem",
                fontWeight: 600,
                color: "var(--text-primary, #f2efe9)",
              }}
            >
              {toast.message}
            </strong>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
