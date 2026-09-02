"use client";

import { useEffect, useState } from "react";

interface ChatImageViewerProps {
  imageUrl: string | null;
  senderName?: string;
  timestamp?: string;
  onClose: () => void;
}

export default function ChatImageViewer({
  imageUrl,
  senderName,
  timestamp,
  onClose,
}: ChatImageViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (imageUrl) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const fileExt = imageUrl.split(".").pop()?.split("?")[0] || "jpg";
      const fileName = `EXPEDIENT_CHAT_${Date.now()}.${fileExt}`;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, opening directly:", error);
      window.open(imageUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="chat-image-viewer-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        background: "rgba(3, 5, 4, 0.95)",
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        animation: "fadeInViewer 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top Bar / Header */}
      <div
        className="chat-viewer-header"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
          background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
          color: "#ffffff",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              transition: "0.2s",
            }}
            title="Kembali (ESC)"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#d4af37" }}>
              {senderName || "Gambar Obrolan"}
            </div>
            {timestamp && (
              <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)", fontFamily: "monospace" }}>
                {timestamp}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1))",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              color: "#d4af37",
              padding: "8px 18px",
              borderRadius: "30px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: isDownloading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "0.2s",
              backdropFilter: "blur(10px)",
            }}
            title="Unduh Gambar"
          >
            {isDownloading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Mengunduh...
              </>
            ) : (
              <>
                <i className="fa-solid fa-download"></i> Unduh
              </>
            )}
          </button>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              textDecoration: "none",
              transition: "0.2s",
            }}
            title="Buka Tab Baru"
          >
            <i className="fa-solid fa-external-link"></i>
          </a>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          overflow: "hidden",
        }}
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt="Chat preview"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "92vw",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: "12px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
            animation: "zoomInImage 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        />
      </div>

      {/* Bottom hint bar */}
      <div
        style={{
          padding: "12px 24px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
          textAlign: "center",
          fontSize: "0.78rem",
          color: "rgba(255, 255, 255, 0.5)",
          background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}
      >
        Klik di luar gambar atau tombol kembali untuk menutup
      </div>

      <style jsx global>{`
        @keyframes fadeInViewer {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomInImage {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
