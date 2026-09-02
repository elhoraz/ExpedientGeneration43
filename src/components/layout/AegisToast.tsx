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
            background: "var(--glass-bg, rgba(255,255,255,0.02))",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(212,175,55,0.4)",
            borderLeft: `4px solid ${toast.type === "error" ? "#8b0000" : "#d4af37"}`,
            borderRadius: "16px",
            padding: "18px 20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "15px",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
            opacity: toast.visible ? 1 : 0,
          }}
        >
          <i
            className="fa-solid fa-compass-drafting"
            style={{
              fontSize: "1.5rem",
              color: toast.type === "error" ? "#8b0000" : "#d4af37",
              flexShrink: 0,
            }}
          ></i>
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "block",
                fontFamily: "'Courier New', monospace",
                fontSize: "0.65rem",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: toast.type === "error" ? "#8b0000" : "var(--text-secondary, #7b8e9b)",
                marginBottom: "4px",
              }}
            >
              {toast.title}
            </span>
            <strong
              style={{
                display: "block",
                fontFamily: "'Playfair Display', serif",
                fontSize: "0.95rem",
                color: "var(--text-primary, #fff)",
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
