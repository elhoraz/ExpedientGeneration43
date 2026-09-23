"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "../../admin.css";
import AdminLockBtn from "../../../AdminLockBtn";

export default function CreateAnnouncement() {
  const { t, locale } = useLanguage();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Berita");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { showAlert } = useConfirm();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, isPinned }),
      });

      if (res.ok) {
        router.push("/admin/announcements");
        router.refresh();
      } else {
        const errorData = await res.json();
        await showAlert(
          locale === "ar" ? "فشل" : locale === "en" ? "Failed" : "Gagal",
          errorData.message || (locale === "ar" ? "فشل إنشاء الإعلان" : locale === "en" ? "Failed to create announcement" : "Gagal membuat pengumuman")
        );
      }
    } catch (error) {
      await showAlert(
        locale === "ar" ? "فشل" : locale === "en" ? "Failed" : "Gagal",
        locale === "ar" ? "حدث خطأ في النظام." : locale === "en" ? "System error occurred." : "Terjadi kesalahan sistem."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-wrapper" style={{ maxWidth: "800px" }}>
      <div className="admin-header" style={{ justifyContent: "center", position: "relative" , paddingRight: "160px"}}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ textAlign: "center", width: "100%" }}>
          <h1 className="admin-title">
            {locale === "ar" ? "إنشاء إعلان" : locale === "en" ? "Create Announcement" : "Buat Pengumuman"}
          </h1>
          <p className="admin-subtitle">
            {locale === "ar" ? "نشر المعلومات لجميع خريجي إكسبيدينت ٤٣" : locale === "en" ? "Publish information for all Expedient 43 alumni" : "Publikasikan informasi untuk seluruh alumni Expedient 43"}
          </p>
        </div>
      </div>

      <div className="form-panel">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">{locale === "ar" ? "العنوان" : locale === "en" ? "Title" : "Judul"}</label>
            <input 
              type="text" 
              required 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder={locale === "ar" ? "أدخل عنوان الإعلان..." : locale === "en" ? "Enter announcement title..." : "Masukkan judul pengumuman..."}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{locale === "ar" ? "المحتوى" : locale === "en" ? "Content" : "Konten"}</label>
            <textarea 
              required 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-textarea"
              placeholder={locale === "ar" ? "اكتب تفاصيل الإعلان هنا..." : locale === "en" ? "Write announcement details..." : "Tulis isi pengumuman secara detail..."}
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{locale === "ar" ? "الفئة" : locale === "en" ? "Category" : "Kategori"}</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                <option value="Berita">{locale === "ar" ? "أخبار" : locale === "en" ? "News" : "Berita"}</option>
                <option value="Pengumuman">{locale === "ar" ? "إعلان" : locale === "en" ? "Announcement" : "Pengumuman"}</option>
                <option value="Mosi">{locale === "ar" ? "اقتراح" : locale === "en" ? "Motion" : "Mosi"}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{locale === "ar" ? "تاريخ النشر" : locale === "en" ? "Publication Date" : "Tanggal Publikasi"}</label>
              <input 
                type="date" 
                className="form-input" 
                value={new Date().toISOString().split('T')[0]} 
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-group">
              <input 
                type="checkbox" 
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span className="checkbox-label">
                {locale === "ar" ? "تثبيت في الأعلى (Pinned)" : locale === "en" ? "Pin to top (Pinned)" : "Sematkan di atas (Pinned)"}
              </span>
            </label>
          </div>

          <div className="form-actions">
            <Link href="/admin/announcements" className="btn-cancel hover-trigger">
              {t.common.cancel}
            </Link>
            <button type="submit" className="btn-submit-form hover-trigger" disabled={loading}>
              <i className="fa-solid fa-paper-plane" style={{ marginRight: "8px" }}></i>
              {loading 
                ? (locale === "ar" ? "جارٍ الحفظ..." : locale === "en" ? "Saving..." : "Menyimpan...") 
                : (locale === "ar" ? "نشر الإعلان" : locale === "en" ? "Publish" : "Publikasikan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
