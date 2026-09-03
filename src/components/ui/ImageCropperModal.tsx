"use client";

import { useEffect, useRef, useState } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  aspectRatio?: number;
  outputWidth?: number;
  outputHeight?: number;
  onApply: (croppedBlob: Blob, croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  title = "Sesuaikan Presisi Foto",
  aspectRatio = 1,
  outputWidth = 600,
  outputHeight = 600,
  onApply,
  onCancel,
}: ImageCropperModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageSrc) {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
      setIsReady(false);
      return;
    }

    // Small delay to ensure the modal DOM is painted and dimensions are known
    const timer = setTimeout(() => {
      if (imageRef.current) {
        if (cropperRef.current) {
          cropperRef.current.destroy();
        }

        const cropper = new Cropper(imageRef.current, {
          aspectRatio: aspectRatio,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 0.85,
          restore: false,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false,
          background: false,
          ready() {
            setIsReady(true);
          },
        });

        cropperRef.current = cropper;
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
      setIsReady(false);
    };
  }, [isOpen, imageSrc, aspectRatio]);

  if (!isOpen) return null;

  const handleZoomIn = () => cropperRef.current?.zoom(0.15);
  const handleZoomOut = () => cropperRef.current?.zoom(-0.15);
  const handleRotateLeft = () => cropperRef.current?.rotate(-90);
  const handleRotateRight = () => cropperRef.current?.rotate(90);
  const handleReset = () => cropperRef.current?.reset();

  const handleApply = () => {
    if (!cropperRef.current) return;

    const canvas = cropperRef.current.getCroppedCanvas({
      width: outputWidth,
      height: outputHeight,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          onApply(blob, dataUrl);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "cropFadeIn 0.25s ease-out",
      }}
    >
      <style>{`
        @keyframes cropFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .cropper-view-box {
          outline: 2px solid var(--gold-main, #d4af37) !important;
          outline-color: var(--gold-main, #d4af37) !important;
          border-radius: ${aspectRatio === 1 ? "50%" : "8px"};
        }
        .cropper-line, .cropper-point {
          background-color: var(--gold-main, #d4af37) !important;
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "var(--bg-card, #111)",
          border: "1px solid var(--glass-border, rgba(212,175,55,0.3))",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3
              style={{
                margin: 0,
                color: "var(--text-primary, #ffffff)",
                fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                fontSize: "1.3rem",
                fontWeight: 700,
              }}
            >
              {title}
            </h3>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary, #888)", fontSize: "0.75rem" }}>
              Geser, perbesar, dan putar posisi gambar sesuai keinginan Anda
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #aaa)",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Cropper Work Area */}
        <div
          style={{
            width: "100%",
            height: "360px",
            background: "#050505",
            borderRadius: "16px",
            overflow: "hidden",
            position: "relative",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source to crop"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
        </div>

        {/* Interactive Controls Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "var(--bg-secondary, rgba(255,255,255,0.04))",
            padding: "8px 12px",
            borderRadius: "14px",
            border: "1px solid var(--glass-border, rgba(255,255,255,0.06))",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            title="Perbesar (+)"
            style={{
              background: "transparent",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.15))",
              color: "var(--text-primary, #fff)",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i> Zoom +
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            title="Perkecil (-)"
            style={{
              background: "transparent",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.15))",
              color: "var(--text-primary, #fff)",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-magnifying-glass-minus"></i> Zoom -
          </button>

          <button
            type="button"
            onClick={handleRotateLeft}
            title="Putar Kiri 90°"
            style={{
              background: "transparent",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.15))",
              color: "var(--text-primary, #fff)",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-rotate-left"></i> Putar Kiri
          </button>

          <button
            type="button"
            onClick={handleRotateRight}
            title="Putar Kanan 90°"
            style={{
              background: "transparent",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.15))",
              color: "var(--text-primary, #fff)",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-rotate-right"></i> Putar Kanan
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Posisi"
            style={{
              background: "transparent",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.15))",
              color: "var(--text-secondary, #aaa)",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-arrows-rotate"></i> Reset
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "13px",
              background: "transparent",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.2))",
              color: "var(--text-secondary, #aaa)",
              borderRadius: "14px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Batalkan
          </button>

          <button
            type="button"
            onClick={handleApply}
            style={{
              flex: 1.5,
              padding: "13px",
              background: "linear-gradient(135deg, #d4af37, #aa8529)",
              border: "none",
              color: "#000",
              borderRadius: "14px",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(212, 175, 55, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            <i className="fa-solid fa-check"></i> Gunakan Foto Ini
          </button>
        </div>
      </div>
    </div>
  );
}
