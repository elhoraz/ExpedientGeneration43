"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageGuide } from "@/data/guideData";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDialogEscape } from "@/hooks/useDialogEscape";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import "./guide.css";

interface PageGuideModalProps {
  guide: PageGuide | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PageGuideModal({ guide, isOpen, onClose }: PageGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"fungsi" | "cara" | "tombol" | "tips">("fungsi");
  const { t, locale, isRTL } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setActiveTab("fungsi");
    }
  }, [isOpen]);

  useDialogEscape(isOpen && Boolean(guide), onClose);

  if (!isOpen || !guide) return null;

  return (
    <div
      className="guide-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-guide-modal-title"
    >
      <div
        className="guide-modal-card"
        dir={isRTL ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="guide-modal-header">
          <div className="guide-modal-header-icon" aria-hidden="true">
            <i className={guide.icon}></i>
          </div>
          <div className="guide-modal-header-text">
            <div className="guide-modal-badge-row">
              <span className="guide-modal-category">{guide.categoryLabel}</span>
              {guide.badge && <span className="guide-modal-badge">{guide.badge}</span>}
            </div>
            <h2 id="page-guide-modal-title" className="guide-modal-title">{guide.title}</h2>
            <p className="guide-modal-subtitle">{guide.subtitle}</p>
          </div>
          <button
            type="button"
            className="guide-modal-close"
            onClick={onClose}
            title={t.common.close}
            aria-label={t.common.close}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        {/* Quick Language Switcher Bar */}
        <div
          className="guide-lang-bar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            padding: "10px 16px",
            marginInline: "24px",
            marginBottom: "14px",
            background: "var(--surface-raised, #171e2c)",
            border: "1px solid var(--glass-border)",
            borderRadius: "14px",
            fontSize: "0.8rem"
          }}
        >
          <span style={{ color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <i className="fa-solid fa-globe" aria-hidden="true" style={{ color: "var(--gold-main, #d4af37)", fontSize: "0.95rem" }}></i>
            <span>{t.panduan.language_select_label}</span>
          </span>
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Tab Navigation */}
        <div className="guide-modal-tabs" role="tablist" aria-label={guide.title}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "fungsi"}
            className={`guide-tab-btn ${activeTab === "fungsi" ? "active" : ""}`}
            onClick={() => setActiveTab("fungsi")}
          >
            <i className="fa-solid fa-circle-info" aria-hidden="true"></i> {t.panduan.tab_functions}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cara"}
            className={`guide-tab-btn ${activeTab === "cara" ? "active" : ""}`}
            onClick={() => setActiveTab("cara")}
          >
            <i className="fa-solid fa-list-check" aria-hidden="true"></i> {t.panduan.tab_how_to_use}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tombol"}
            className={`guide-tab-btn ${activeTab === "tombol" ? "active" : ""}`}
            onClick={() => setActiveTab("tombol")}
          >
            <i className="fa-solid fa-keyboard" aria-hidden="true"></i> {t.panduan.tab_controls} ({guide.controls.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tips"}
            className={`guide-tab-btn ${activeTab === "tips" ? "active" : ""}`}
            onClick={() => setActiveTab("tips")}
          >
            <i className="fa-solid fa-lightbulb" aria-hidden="true"></i> {t.panduan.tab_tips}
          </button>
        </div>

        {/* Tab Content */}
        <div className="guide-modal-body" role="tabpanel">
          {activeTab === "fungsi" && (
            <div className="guide-tab-pane">
              <h3 className="guide-section-heading">
                <i className="fa-solid fa-bullseye" aria-hidden="true"></i> {locale === "ar" ? "ملخص الصفحة" : locale === "en" ? "Page Summary" : "Ringkasan Halaman"}
              </h3>
              <p className="guide-summary-text">{guide.summary}</p>

              <div className="guide-route-box">
                <span className="route-label">{locale === "ar" ? "مسار الصفحة:" : locale === "en" ? "Page Route:" : "Rute Halaman:"}</span>
                <code className="route-code">{guide.route}</code>
              </div>
            </div>
          )}

          {activeTab === "cara" && (
            <div className="guide-tab-pane">
              <h3 className="guide-section-heading">
                <i className="fa-solid fa-shoe-prints" aria-hidden="true"></i> {locale === "ar" ? "خطوات الاستخدام" : locale === "en" ? "Usage Steps" : "Langkah Penggunaan"}
              </h3>
              <ol className="guide-steps-list">
                {guide.howToUse.map((step, idx) => (
                  <li key={idx} className="guide-step-item">
                    <span className="step-num">{idx + 1}</span>
                    <span className="step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeTab === "tombol" && (
            <div className="guide-tab-pane">
              <h3 className="guide-section-heading">
                <i className="fa-solid fa-gamepad" aria-hidden="true"></i> {locale === "ar" ? "الأزرار وعناصر التحكم الهامة" : locale === "en" ? "Key Buttons & Controls" : "Tombol & Kontrol Penting"}
              </h3>
              <div className="guide-controls-grid">
                {guide.controls.map((ctrl, idx) => (
                  <div key={idx} className="guide-control-item">
                    <div className="guide-control-icon" aria-hidden="true">
                      <i className={ctrl.icon}></i>
                    </div>
                    <div className="guide-control-info">
                      <strong>{ctrl.name}</strong>
                      <p>{ctrl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "tips" && (
            <div className="guide-tab-pane">
              <h3 className="guide-section-heading">
                <i className="fa-solid fa-star" aria-hidden="true"></i> {locale === "ar" ? "نصائح وإرشادات الاستخدام" : locale === "en" ? "Usage Tips & Recommendations" : "Tips & Saran Penggunaan"}
              </h3>
              <ul className="guide-tips-list">
                {guide.tips.map((tip, idx) => (
                  <li key={idx} className="guide-tip-item">
                    <i className="fa-solid fa-circle-check tip-icon" aria-hidden="true"></i>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="guide-modal-footer">
          <Link
            href="/panduan"
            className="btn-all-guides"
            onClick={onClose}
          >
            <i className="fa-solid fa-book-bookmark" aria-hidden="true"></i> {t.panduan.btn_full_guide}
          </Link>
          <button
            type="button"
            className="btn-close-guide"
            onClick={onClose}
          >
            {t.panduan.btn_understand_close}
          </button>
        </div>
      </div>
    </div>
  );
}
