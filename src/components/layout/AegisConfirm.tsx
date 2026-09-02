"use client";

import { useState, useCallback, createContext, useContext } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  isAlert?: boolean; // If true, only show OK button
};

const ConfirmContext = createContext<{
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: string) => Promise<void>;
}>({
  showConfirm: async () => false,
  showAlert: async () => {},
});

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (val: boolean) => void }) | null>(null);

  const showConfirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ title, message, isAlert: false, resolve });
      if (navigator.vibrate) navigator.vibrate(50);
    });
  }, []);

  const showAlert = useCallback((title: string, message: string) => {
    return new Promise<void>((resolve) => {
      setDialog({ title, message, isAlert: true, resolve: () => resolve() });
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (navigator.vibrate) navigator.vibrate(20);
    if (dialog) {
      dialog.resolve(result);
      setDialog(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      {dialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              background: "rgba(15, 18, 16, 0.9)",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              borderRadius: "20px",
              padding: "35px 30px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              fontFamily: "'Inter', sans-serif",
              animation: "slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2)",
            }}
          >
            <div style={{ fontSize: "3rem", color: "#d4af37", marginBottom: "15px" }}>
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h3 style={{ color: "#d4af37", fontFamily: "'Playfair Display', serif", margin: "0 0 15px 0", fontSize: "1.5rem" }}>
              {dialog.title}
            </h3>
            <p style={{ color: "#ccc", fontSize: "0.95rem", marginBottom: "30px", lineHeight: "1.5" }}>
              {dialog.message}
            </p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              {!dialog.isAlert && (
                <button
                  onClick={() => handleClose(false)}
                  style={{
                    flex: 1,
                    padding: "12px 15px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    borderRadius: "50px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    transition: "0.3s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                >
                  BATAL
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                style={{
                  flex: 1,
                  padding: "12px 15px",
                  border: "none",
                  background: "linear-gradient(135deg, #d4af37, #aa8529)",
                  color: "#000",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  transition: "0.3s",
                  boxShadow: "0 5px 15px rgba(212, 175, 55, 0.3)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {dialog.isAlert ? "MENGERTI" : "YA, LANJUTKAN"}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(30px); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
