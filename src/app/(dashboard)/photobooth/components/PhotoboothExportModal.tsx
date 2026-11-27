"use client";

import type { ExportedResultState } from "../photoboothPresets";

interface PhotoboothExportModalProps {
  locale: string;
  closeLabel: string;
  exportedResult: ExportedResultState;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
}

export function PhotoboothExportModal({
  locale,
  closeLabel,
  exportedResult,
  onClose,
  onShare,
  onDownload,
}: PhotoboothExportModalProps) {
  return (
    <div className="export-result-modal-backdrop" onClick={onClose}>
      <div
        className="export-result-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={exportedResult.type === "video" ? "Preview Video" : "Preview Photostrip"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="export-modal-header">
          <div className="export-modal-title-group">
            <div className="export-modal-icon">
              <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
            </div>
            <div>
              <h3 className="export-modal-title">Foto Siap Disimpan!</h3>
              <p className="export-modal-subtitle">
                {exportedResult.type === "video" ? "Format Video Bergerak (HD)" : "Format Foto Photostrip (HD)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="export-modal-close-btn"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="export-modal-body">
          <div className="export-preview-container">
            {exportedResult.type === "video" ? (
              <video
                src={exportedResult.dataUrl}
                controls
                autoPlay
                loop
                playsInline
                className="export-preview-video"
              />
            ) : (
              <img
                src={exportedResult.dataUrl}
                alt="Hasil Foto Photobooth"
                className="export-preview-img"
              />
            )}
          </div>

          <div className="apk-save-hint">
            <i className="fa-solid fa-lightbulb"></i>
            <div>
              <strong>Tips Simpan di Aplikasi HP:</strong>{" "}
              Tekan tombol <strong>Simpan ke Galeri / Bagikan</strong> di bawah untuk langsung menyimpan ke galeri HP tanpa keluar aplikasi. Anda juga bisa <strong>tekan &amp; tahan jari pada foto</strong> di atas lalu pilih <em>&ldquo;Simpan Gambar&rdquo;</em>.
            </div>
          </div>

          <div className="export-modal-actions">
            <button type="button" className="btn-modal-share" onClick={onShare}>
              <i className="fa-solid fa-cloud-arrow-down"></i>
              <span>{locale === "ar" ? "حفظ في المعرض / مشاركة" : locale === "en" ? "Save to Gallery / Share" : "Simpan ke Galeri / Bagikan"}</span>
            </button>

            <button type="button" className="btn-modal-download" onClick={onDownload}>
              <i className="fa-solid fa-download"></i>
              <span>{locale === "ar" ? "حفظ الملف مباشرة" : locale === "en" ? "Direct Download File" : "Simpan File Langsung"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
