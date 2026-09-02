"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";

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

      // Upload logo jika ada file baru
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("bisnis")
          .upload(fileName, selectedFile);
          
        if (uploadError) throw uploadError;
        logoName = fileName;
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
    <div style={{
      padding: "120px 5% 50px",
      minHeight: "100vh",
      background: "var(--bg-main)",
      position: "relative",
      zIndex: 1
    }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", background: "var(--glass-bg)", backdropFilter: "blur(20px)", border: "1px solid var(--glass-edge)", borderRadius: "20px", padding: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        
        <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", margin: 0, fontSize: "2rem" }}>
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
              style={{ width: "150px", height: "150px", borderRadius: "15px", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(212,175,55,0.4)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", cursor: "pointer", position: "relative" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewLogo ? (
                <img src={previewLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "2.5rem", color: "rgba(212,175,55,0.5)" }}></i>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "0.7rem", textAlign: "center", padding: "5px 0" }}>
                Upload Logo
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Nama Bisnis</label>
            <input type="text" required value={formData.nama_bisnis} onChange={e => setFormData({...formData, nama_bisnis: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 15px", color: "#fff", outline: "none", fontSize: "1rem" }} placeholder="Misal: PT Bintang Cemerlang" />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Kategori</label>
            <select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 15px", color: "#fff", outline: "none", fontSize: "1rem" }}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Deskripsi Singkat</label>
            <textarea required rows={4} value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 15px", color: "#fff", outline: "none", fontSize: "1rem", resize: "vertical" }} placeholder="Ceritakan singkat tentang produk/jasa yang ditawarkan..."></textarea>
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Link Website / Instagram (Opsional)</label>
            <input type="url" value={formData.link_url} onChange={e => setFormData({...formData, link_url: e.target.value})} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 15px", color: "#fff", outline: "none", fontSize: "1rem" }} placeholder="https://..." />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>Nomor WhatsApp (Aktif)</label>
            <input type="text" required value={waNumber} onChange={e => setWaNumber(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 15px", color: "#fff", outline: "none", fontSize: "1rem" }} placeholder="Misal: 08123456789" />
          </div>

          <button type="submit" disabled={isSubmitting} style={{ background: "linear-gradient(135deg, #d4af37, #aa8529)", color: "#000", border: "none", padding: "15px", borderRadius: "10px", fontSize: "1rem", fontWeight: 700, cursor: isSubmitting ? "wait" : "pointer", marginTop: "10px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Menyimpan..." : "Simpan Arsip"}
          </button>
        </form>

      </div>
    </div>
  );
}
