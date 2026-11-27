"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface EditAnnouncementFormProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    category: string;
    is_pinned: boolean;
    published_at: string | null;
  };
}

export default function EditAnnouncementForm({ announcement }: EditAnnouncementFormProps) {
  const { locale } = useLanguage();
  const [title, setTitle] = useState(announcement.title || "");
  const [content, setContent] = useState(announcement.content || "");
  const [category, setCategory] = useState(announcement.category || "Berita");
  const [isPinned, setIsPinned] = useState(Boolean(announcement.is_pinned));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useConfirm();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: announcement.id,
          title,
          content,
          category,
          isPinned,
        }),
      });
      if (res.ok) {
        router.push("/admin/announcements");
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        await showAlert(
          locale === "ar" ? "فشل" : locale === "en" ? "Failed" : "Gagal",
          errorData.message || (locale === "ar" ? "فشل تحديث الإعلان" : locale === "en" ? "Failed to update announcement" : "Gagal memperbarui pengumuman")
        );
      }
    } catch {
      await showAlert(
        locale === "ar" ? "فشل" : locale === "en" ? "Failed" : "Gagal",
        locale === "ar" ? "حدث خطأ في النظام." : locale === "en" ? "System error occurred." : "Terjadi kesalahan sistem."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-panel">
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label className="form-label" htmlFor="edit-ann-title">
            {locale === "ar" ? "العنوان" : locale === "en" ? "Title" : "Judul"}
          </label>
          <input
            id="edit-ann-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder={locale === "ar" ? "أدخل عنوان الإعلان..." : locale === "en" ? "Enter announcement title..." : "Masukkan judul pengumuman..."}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-ann-content">
            {locale === "ar" ? "المحتوى" : locale === "en" ? "Content" : "Konten"}
          </label>
          <textarea
            id="edit-ann-content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-textarea"
            placeholder={locale === "ar" ? "اكتب تفاصيل الإعلان هنا..." : locale === "en" ? "Write announcement details..." : "Tulis isi pengumuman secara detail..."}
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-ann-category">
              {locale === "ar" ? "الفئة" : locale === "en" ? "Category" : "Kategori"}
            </label>
            <select
              id="edit-ann-category"
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
            <label className="form-label" htmlFor="edit-ann-date">
              {locale === "ar" ? "تاريخ النشر" : locale === "en" ? "Publication Date" : "Tanggal Publikasi"}
            </label>
            <input
              id="edit-ann-date"
              type="date"
              className="form-input"
              value={announcement.published_at ? new Date(announcement.published_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
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
              style={{ width: "18px", height: "18px" }}
            />
            <span style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
              {locale === "ar" ? "تثبيت الإعلان في الأعلى" : locale === "en" ? "Pin announcement to top" : "Sematkan (Pin) pengumuman di urutan teratas"}
            </span>
          </label>
        </div>

        <div className="form-actions">
          <Link href="/admin/announcements" className="btn-cancel">
            {locale === "ar" ? "إلغاء" : locale === "en" ? "Cancel" : "Batal"}
          </Link>
          <button type="submit" disabled={loading} className="btn-submit hover-trigger">
            <i className="fa-solid fa-save"></i>{" "}
            {loading
              ? locale === "ar" ? "جارٍ الحفظ..." : locale === "en" ? "Saving..." : "Menyimpan..."
              : locale === "ar" ? "حفظ التغييرات" : locale === "en" ? "Simpan Perubahan" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
