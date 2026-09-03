"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "./syndicate.css";

type SyndicateData = {
  id?: string;
  nama_bisnis: string;
  kategori: string;
  deskripsi: string;
  link_url: string;
  logo_bisnis?: string | null;
};

export default function SyndicateForm({ initialData, userId, userWhatsapp = "" }: { initialData?: SyndicateData; userId: string; userWhatsapp?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { showAlert } = useConfirm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waNumber, setWaNumber] = useState(userWhatsapp);

  useEffect(() => {
    document.body.classList.add("page-syndicate");
    return () => {
      document.body.classList.remove("page-syndicate");
    };
  }, []);
  const [formData, setFormData] = useState<SyndicateData>(
    initialData || {
      nama_bisnis: "",
      kategori: "F&B",
      deskripsi: "",
      link_url: "",
    }
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(
    initialData?.logo_bisnis ? `/uploads/bisnis/${initialData.logo_bisnis}` : null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const categories = ["F&B", "Teknologi", "Jasa", "Kreatif", "Retail"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert("Peringatan", "Ukuran logo maksimal 2MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoName = formData.logo_bisnis;

      // Upload logo via server-side storage API
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);
        uploadData.append("folder", "bisnis");

        const uploadResp = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResp.ok) {
          const errJson = await uploadResp.json().catch(() => ({}));
          throw new Error(errJson.error || "Gagal mengunggah logo bisnis");
        }

        const uploadJson = await uploadResp.json();
        logoName = uploadJson.url;
      }

      const payload = {
        user_id: userId,
        nama_bisnis: formData.nama_bisnis,
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        link_url: formData.link_url,
        ...(logoName ? { logo_bisnis: logoName } : {})
      };

      if (initialData?.id) {
        // Update
        const { error } = await supabase.from("syndicate").update(payload).eq("id", initialData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("syndicate").insert([payload]);
        if (error) throw error;
      }

      // Update WhatsApp in profiles
      if (waNumber && waNumber !== userWhatsapp) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ no_whatsapp: waNumber })
          .eq("id", userId);
        if (profileError) console.error("Gagal update WA:", profileError);
      }

      router.push("/syndicate");
      router.refresh();

    } catch (error: any) {
      showAlert("Gagal", `Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="syndicate-page">
      <div className="syndicate-form-card">
        
        <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)", color: "var(--gold-main, #d4af37)", margin: 0, fontSize: "2rem" }}>
            {initialData ? "Edit Arsip Bisnis" : "Registrasi Bisnis"}
          </h2>
          <Link href="/syndicate" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            <i className="fa-solid fa-times" style={{ fontSize: "1.5rem" }}></i>
          </Link>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Logo Upload */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div 
              style={{ width: "150px", height: "150px", borderRadius: "15px", background: "var(--bg-secondary)", border: "2px dashed var(--gold-main)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", cursor: "pointer", position: "relative" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewLogo ? (
                <img src={previewLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "2.5rem", color: "var(--gold-main)", opacity: 0.6 }}></i>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: "0.7rem", textAlign: "center", padding: "5px 0" }}>
                Upload Logo
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Nama Bisnis</label>
            <input type="text" required value={formData.nama_bisnis} onChange={e => setFormData({...formData, nama_bisnis: e.target.value})} className="syndicate-input" placeholder="Misal: PT Bintang Cemerlang" />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Kategori</label>
            <select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="syndicate-select">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Deskripsi Singkat</label>
            <textarea required rows={4} value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="syndicate-textarea" placeholder="Ceritakan singkat tentang produk/jasa yang ditawarkan..."></textarea>
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Link Website / Instagram (Opsional)</label>
            <input type="url" value={formData.link_url} onChange={e => setFormData({...formData, link_url: e.target.value})} className="syndicate-input" placeholder="https://..." />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Nomor WhatsApp (Aktif)</label>
            <input type="text" required value={waNumber} onChange={e => setWaNumber(e.target.value)} className="syndicate-input" placeholder="Misal: 08123456789" />
          </div>

          <button type="submit" disabled={isSubmitting} style={{ background: "linear-gradient(135deg, #d4af37, #aa8529)", color: "#000", border: "none", padding: "15px", borderRadius: "12px", fontSize: "1rem", fontWeight: 700, cursor: isSubmitting ? "wait" : "pointer", marginTop: "10px", opacity: isSubmitting ? 0.7 : 1, boxShadow: "0 10px 25px rgba(212,175,55,0.25)" }}>
            {isSubmitting ? "Menyimpan..." : "Simpan Arsip"}
          </button>
        </form>

      </div>
    </div>
  );
}
