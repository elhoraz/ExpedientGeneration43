"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "../../admin.css";
import AdminLockBtn from "../../../AdminLockBtn";

export default function CreateAnnouncement() {
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
        await showAlert("Gagal", errorData.message || "Gagal membuat pengumuman");
      }
    } catch (error) {
      await showAlert("Gagal", "Terjadi kesalahan sistem.");
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
          <h1 className="admin-title">Buat Pengumuman</h1>
          <p className="admin-subtitle">Publikasikan informasi untuk seluruh entitas Expedient</p>
        </div>
      </div>

      <div className="form-panel">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Judul</label>
            <input 
              type="text" 
              required 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Masukkan judul pengumuman..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konten</label>
            <textarea 
              required 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-textarea"
              placeholder="Tulis isi pengumuman secara detail..."
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                <option value="Berita">Berita</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Mosi">Mosi</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Publikasi</label>
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
              <span className="checkbox-label">Sematkan di atas (Pinned)</span>
            </label>
          </div>

          <div className="form-actions">
            <Link href="/admin/announcements" className="btn-cancel hover-trigger">Batal</Link>
            <button type="submit" className="btn-submit-form hover-trigger" disabled={loading}>
              <i className="fa-solid fa-paper-plane" style={{ marginRight: "8px" }}></i>
              {loading ? "Menyimpan..." : "Publikasikan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
