"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import { addPrestise } from "@/lib/gamification";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { getAvatarUrl } from "@/lib/avatar";
import "./wasiat.css";

export default function WasiatClient({ currentUser, initialWasiats }: { currentUser: any, initialWasiats: any[] }) {
  const [wasiats, setWasiats] = useState(initialWasiats);
  const [newMessage, setNewMessage] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [isSealing, setIsSealing] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [unlockPassphrase, setUnlockPassphrase] = useState<{ [key: string]: string }>({});
  
  const [unsealModalOpen, setUnsealModalOpen] = useState(false);
  const [unsealContent, setUnsealContent] = useState("");

  const supabase = createClient();
  const { showAlert } = useConfirm();

  // Add page-specific body class for isolated styling
  useEffect(() => {
    document.body.classList.add("page-wasiat");
    return () => { document.body.classList.remove("page-wasiat"); };
  }, []);

  useEffect(() => {
    gsap.from(".legacy-card", { y: 40, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out" });
  }, []);

  // WebCrypto Helpers
  async function deriveKey(passphrase: string, salt: Uint8Array) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw", enc.encode(passphrase), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );
    return await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt as any, iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
  }
  
  async function sha256Hash(text: string) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function base64ToArrayBuffer(base64: string) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // CI4 validation: message min 10 chars, passphrase min 4 chars
    if (!newMessage || newMessage.length < 10) {
      await showAlert("Validasi Gagal", "Pesan harus minimal 10 karakter.");
      return;
    }
    if (!newPassphrase || newPassphrase.length < 4) {
      await showAlert("Validasi Gagal", "Kunci akses harus minimal 4 karakter.");
      return;
    }
    setIsSealing(true);

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const key = await deriveKey(newPassphrase, salt);
      
      const enc = new TextEncoder();
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, key, enc.encode(newMessage)
      );
      
      const payloadBuffer = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
      payloadBuffer.set(salt, 0);
      payloadBuffer.set(iv, salt.byteLength);
      payloadBuffer.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);
      
      const finalPayload = "v3|" + arrayBufferToBase64(payloadBuffer.buffer);
      const authHash = await sha256Hash(newPassphrase);
      
      const { data, error } = await supabase.from("wasiats").insert([
        { user_id: currentUser.id, encrypted_message: finalPayload, passphrase_hash: authHash }
      ]).select("*, profiles!wasiats_user_id_fkey(nama_panggilan, foto_profil)");

      if (!error && data) {
        // Gamifikasi: WASIAT_STORE (+10 poin) — sama seperti CI4
        await addPrestise(supabase as any, currentUser.id, "WASIAT_STORE", 10);

        const formatted = {
          ...data[0],
          author_name: data[0].profiles?.nama_panggilan || "Anonim",
          author_avatar: getAvatarUrl(data[0].profiles?.foto_profil, data[0].profiles?.nama_panggilan || "A")
        };
        setWasiats([formatted, ...wasiats]);
        setNewMessage("");
        setNewPassphrase("");
      } else {
        await showAlert("Gagal", "Gagal menyimpan wasiat: " + error?.message);
      }
    } catch (err: any) {
      await showAlert("Enkripsi Gagal", err.message);
    }
    
    setIsSealing(false);
  };

  const handleUnlock = async (e: React.FormEvent, wasiat: any) => {
    e.preventDefault();
    const pass = unlockPassphrase[wasiat.id] || "";
    if (!pass) return;
    
    setUnlockingId(wasiat.id);

    try {
      const payloadStr = wasiat.encrypted_message;
      if (payloadStr.startsWith("v3|")) {
        const rawB64 = payloadStr.substring(3);
        const buffer = base64ToArrayBuffer(rawB64);
        const bytes = new Uint8Array(buffer);
        
        const salt = bytes.slice(0, 16);
        const iv = bytes.slice(16, 28);
        const ciphertext = bytes.slice(28);

        const key = await deriveKey(pass, salt);
        
        const decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: iv }, key, ciphertext
        );
        
        const dec = new TextDecoder();
        const plaintext = dec.decode(decrypted);

        setUnsealContent(plaintext);
        setUnsealModalOpen(true);
        setUnlockPassphrase({ ...unlockPassphrase, [wasiat.id]: "" });
        
        gsap.fromTo("#unsealPaper", { y: 50, rotationX: -10, opacity: 0 }, { y: 0, rotationX: 0, opacity: 1, duration: 0.8, ease: "power3.out" });

        // Gamifikasi: WASIAT_UNLOCK (+20 poin) via API — deduplicated per wasiat
        // Kirim SHA-256 hash untuk diverifikasi di server
        const authHash = await sha256Hash(pass);
        fetch("/api/wasiat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wasiat_id: wasiat.id, passphrase_hash: authHash }),
        }).catch(() => {}); // fire-and-forget, jangan blokir UX

      } else {
        await showAlert("Tidak Didukung", "Format enkripsi tidak didukung di versi ini.");
      }
    } catch (err) {
      await showAlert("Akses Ditolak", "Gagal membuka segel: Kunci akses tidak cocok.");
    }
    
    setUnlockingId(null);
  };

  const closeUnsealModal = () => {
    gsap.to("#unsealPaper", { y: -30, opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => {
      setUnsealModalOpen(false);
      setUnsealContent("");
    }});
  };

  return (
    <div className="wasiat-page-wrapper">
      <div className="vault-wrapper">
        <header className="vault-header">
          <Link href="/fitur" className="btn-back">
            <i className="fa-solid fa-arrow-left-long"></i> Kembali ke Vault
          </Link>
          <div className="header-titles">
            <h1 className="page-title">Amanah &amp; Wasiat</h1>
            <div className="status-badge"><i className="fa-solid fa-feather-pointed"></i> Arsip Personal Tertutup</div>
          </div>
        </header>

        <div className="wasiat-list">
          {/* Form Tambah Amanah Baru */}
          <div className="legacy-card" style={{ borderColor: "rgba(212,175,55,0.5)" }}>
            <div className="card-header" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
              <div className="author-meta">
                <h2 className="box-title" style={{ color: "var(--gold-main)", fontSize: "1.4rem" }}>Buat Dokumen Segel Baru</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "10px" }}>
                  Tuliskan amanah yang hanya dapat dibaca oleh mereka yang memegang kunci otorisasinya.
                </p>
              </div>
            </div>
            <form style={{ marginTop: "25px" }} onSubmit={handleCreate}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                className="form-input"
                required
                placeholder="Tulis pesan rahasia yang akan disegel..."
                style={{ width: "100%", marginBottom: "20px" }}
              ></textarea>
              <div className="form-row" style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <input
                  type="password"
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  className="form-input"
                  required
                  placeholder="Kunci Akses (Passphrase)"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="seal-btn" disabled={isSealing}>
                  {isSealing
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> MENGAMANKAN...</>
                    : <><i className="fa-solid fa-stamp wax-seal-icon"></i> SEGEL DOKUMEN</>
                  }
                </button>
              </div>
            </form>
          </div>

          {wasiats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <i className="fa-solid fa-box-archive" style={{ fontSize: "3rem", marginBottom: "20px", opacity: 0.5 }}></i><br />
              Belum ada amanah yang diarsipkan di ruang ini.
            </div>
          ) : (
            wasiats.map(w => (
              <div key={w.id} className="legacy-card">
                <div className="card-header">
                  <div className="author-info">
                    <img src={w.author_avatar} alt="Foto" className="author-avatar" />
                    <div className="author-meta">
                      <div className="box-id">Diarsipkan pada: {new Date(w.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <h2 className="box-title">Amanah dari {w.author_name}</h2>
                    </div>
                  </div>
                  <div className="document-meta">
                    <div><i className="fa-solid fa-lock" style={{ color: "var(--gold-main)", fontSize: "0.8rem" }}></i> Terenkripsi Penuh</div>
                    <div style={{ marginTop: "5px" }}>Akses Tertutup</div>
                  </div>
                </div>
                <div className="secret-content">
                  <div className="scramble-text">
                    Amanah ini dalam keadaan tertutup rapat. Hanya otoritas atau pewaris yang memiliki kunci persetujuan yang dapat membaca isi pesan yang terkandung di dalamnya. Menjaga kerahasiaan...
                  </div>
                </div>
                
                <form className="form-row" onSubmit={(e) => handleUnlock(e, w)} style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                  <input
                    type="password"
                    value={unlockPassphrase[w.id] || ""}
                    onChange={(e) => setUnlockPassphrase({ ...unlockPassphrase, [w.id]: e.target.value })}
                    className="form-input"
                    required
                    placeholder="Masukkan Kunci Akses..."
                    style={{ width: "250px" }}
                  />
                  <button type="submit" className="seal-btn unlock-btn" disabled={unlockingId === w.id}>
                    {unlockingId === w.id
                      ? <><i className="fa-solid fa-spinner fa-spin"></i> DEKRIPSI LOKAL...</>
                      : <><i className="fa-solid fa-key" style={{ color: "var(--gold-main)" }}></i> Buka Dokumen</>
                    }
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Wasiat Terbuka */}
      <div className={`elegant-modal${unsealModalOpen ? " open" : ""}`}>
        <div className="modal-paper" id="unsealPaper">
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <i className="fa-solid fa-stamp" style={{ color: "var(--wax-red)", fontSize: "3rem", marginBottom: "15px" }}></i>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", margin: 0 }}>Amanah Terbuka</h2>
            <div style={{ width: "50px", height: "2px", background: "var(--gold-main)", margin: "15px auto" }}></div>
          </div>
          
          <div
            dangerouslySetInnerHTML={{ __html: unsealContent.replace(/\n/g, "<br/>") }}
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", lineHeight: 1.8, wordBreak: "break-word" }}
          ></div>
          
          <div style={{ marginTop: "50px", textAlign: "center", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "20px" }}>
            <button
              onClick={closeUnsealModal}
              className="close-modal-btn"
            >
              Tutup Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
