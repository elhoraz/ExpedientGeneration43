"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import { getGelar, getBadgeColor, getGelarIcon } from "@/lib/gamification";
import { useCms } from "@/components/layout/CmsProvider";
import "./profil.css";

export default function ProfilClient({ user, initialBiometrics = [] }: { user: any; initialBiometrics?: any[] }) {
  const [isClient, setIsClient] = useState(false);

  // CSS Scoping: body class untuk isolasi CSS halaman ini
  useEffect(() => {
    document.body.classList.add('page-profil');
    return () => { document.body.classList.remove('page-profil'); };
  }, []);

  const [waOptIn, setWaOptIn] = useState(user.wa_notif_opt_in === 1 || user.wa_notif_opt_in === true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [changingPw, setChangingPw] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [biometricsList, setBiometricsList] = useState<any[]>(initialBiometrics);
  const [registeringBio, setRegisteringBio] = useState(false);
  const [deletingBioId, setDeletingBioId] = useState<string | null>(null);
  const [avatarPreviewSrc, setAvatarPreviewSrc] = useState(
    user.foto_profil
      ? (user.foto_profil.startsWith("http") ? user.foto_profil : `/uploads/profiles/${user.foto_profil}`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_panggilan || user.nama_lengkap)}&background=d4af37&color=000`
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useCms();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchBiometrics = async () => {
    try {
      const { data } = await supabase
        .from("user_biometrics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setBiometricsList(data);
      }
    } catch (err) {
      console.error("Error fetching biometrics:", err);
    }
  };

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      (window as any).gsap = gsap;
      (window as any).dbFaceDataRaw = user.face_data || null;
      (window as any).isAdmin = user.role === 'admin';
    }
    fetchBiometrics();
  }, [user]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ========== PROFILE UPDATE ==========
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const updateData: Record<string, any> = {
      nama_panggilan: formData.get("nama_panggilan") as string,
      nama_lengkap: formData.get("nama_lengkap") as string,
      no_whatsapp: formData.get("no_whatsapp") as string,
      motivasi_hidup: formData.get("motivasi_hidup") as string,
      cita_cita: formData.get("cita_cita") as string,
      akun_ig: formData.get("akun_ig") as string,
      akun_tiktok: formData.get("akun_tiktok") as string,
    };

    // Handle photo upload
    const fileInput = fileInputRef.current;
    if (fileInput?.files?.[0]) {
      const file = fileInput.files[0];
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file, { upsert: true });

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(fileName);
        updateData.foto_profil = publicUrl.publicUrl;
      }
    }

    // Update email if changed
    const newEmail = formData.get("email") as string;
    if (newEmail && newEmail !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
      if (emailError) {
        showToast("Gagal mengubah email: " + emailError.message, "error");
        setSaving(false);
        return;
      }
    }

    // Update profile in Supabase
    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      showToast("Gagal menyimpan: " + error.message, "error");
    } else {
      // Log activity
      await supabase.from("activity_logs").insert([{
        user_id: user.id,
        action: "Perbarui Profil",
        details: "Pengguna memperbarui data informasi profil eksekutif."
      }]);
      // Mark quest as complete
      if (typeof window !== "undefined") {
        localStorage.setItem("expedient_quest_profile", "true");
        window.dispatchEvent(new CustomEvent("expedient-quest-updated"));
      }

      showToast("Profil berhasil diperbarui!");
      router.refresh();
    }

    setSaving(false);
  };

  // ========== CHANGE PASSWORD ==========
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangingPw(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPw = formData.get("new_password") as string;
    const confirmPw = formData.get("confirm_password") as string;

    if (newPw.length < 8) {
      showToast("Kata sandi baru minimal 8 karakter.", "error");
      setChangingPw(false);
      return;
    }

    if (newPw !== confirmPw) {
      showToast("Konfirmasi kata sandi tidak cocok.", "error");
      setChangingPw(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });

    if (error) {
      showToast("Gagal mengubah kata sandi: " + error.message, "error");
    } else {
      // Log activity
      await supabase.from("activity_logs").insert([{
        user_id: user.id,
        action: "Ubah Kata Sandi",
        details: "Pengguna memperbarui kata sandi akun eksekutif."
      }]);
      showToast("Kata sandi berhasil diperbarui!");
      form.reset();
    }

    setChangingPw(false);
  };

  // ========== LOGOUT ==========
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // ========== WEBAUTHN / BIOMETRIC ==========
  const handleRegisterBiometric = async () => {
    try {
      setRegisteringBio(true);
      const { startRegistration } = await import("@simplewebauthn/browser");

      // 1. Get options
      const optResp = await fetch("/api/biometric/register-options");
      let options: any = null;
      try {
        options = await optResp.json();
      } catch {
        const errText = await optResp.text().catch(() => "");
        throw new Error(errText || "Gagal mengambil opsi biometrik dari server.");
      }

      if (!optResp.ok || options?.error) {
        throw new Error(options?.error || "Gagal mengambil opsi biometrik.");
      }

      // 2. Start Registration in Browser
      const authResp = await startRegistration({ optionsJSON: options });

      // 3. Verify
      const verifyResp = await fetch("/api/biometric/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResp)
      });

      let verifyJSON: any = null;
      try {
        verifyJSON = await verifyResp.json();
      } catch {
        const errText = await verifyResp.text().catch(() => "");
        throw new Error(errText || "Gagal memverifikasi pendaftaran biometrik.");
      }

      if (verifyJSON?.verified) {
        showToast("Perangkat biometrik berhasil didaftarkan!");
        await fetchBiometrics();
      } else {
        throw new Error(verifyJSON?.error || "Gagal verifikasi perangkat");
      }
    } catch (e: any) {
      console.error(e);
      if (e.name === "NotAllowedError") {
        showToast("Pendaftaran biometrik dibatalkan.", "error");
      } else {
        showToast("Biometrik Error: " + (e.message || "Terjadi kesalahan."), "error");
      }
    } finally {
      setRegisteringBio(false);
    }
  };

  const handleDeleteBiometric = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kredensial biometrik ini dari akun Anda?")) return;
    try {
      setDeletingBioId(id);
      const { error } = await supabase
        .from("user_biometrics")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      showToast("Kredensial biometrik berhasil dihapus.");
      setBiometricsList((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      showToast("Gagal menghapus biometrik: " + err.message, "error");
    } finally {
      setDeletingBioId(null);
    }
  };

  // ========== DELETE ACCOUNT ==========
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      showToast("Sandi konfirmasi harus diisi.", "error");
      return;
    }
    
    setDeletingAccount(true);

    // Verify password first using Supabase signInWithPassword
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });

    if (signInError) {
      showToast("Kata sandi tidak valid. Gagal menonaktifkan akun.", "error");
      setDeletingAccount(false);
      return;
    }

    // Soft delete: deactivate profile
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", user.id);

    if (error) {
      showToast("Gagal menonaktifkan akun: " + error.message, "error");
      setDeletingAccount(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // ========== FILE PREVIEW ==========
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreviewSrc(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isClient) return null;

  const points = user.prestise_points || 0;
  const gelar = getGelar(points);
  const badgeColor = getBadgeColor(points);
  const badgeIcon = getGelarIcon(points);

  return (
    <main className="profil-wrapper">
        {/* TOAST NOTIFICATION */}
        {toast && (
          <div style={{
            position: "fixed", top: "30px", left: "50%", transform: "translateX(-50%)", zIndex: 99999,
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)", border: `1px solid ${toast.type === "error" ? "rgba(255,50,50,0.4)" : "rgba(212,175,55,0.4)"}`,
            borderRadius: "16px", padding: "15px 30px", color: "var(--text-primary)", fontSize: "0.85rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "10px",
            animation: "fadeInUp 0.5s ease-out"
          }}>
            <i className={`fa-solid ${toast.type === "error" ? "fa-circle-exclamation" : "fa-circle-check"}`} style={{ color: toast.type === "error" ? "#ff5555" : "var(--gold-premium, #d4af37)" }}></i>
            {toast.msg}
          </div>
        )}

        {/* FASE 1: BIOMETRIC CONCIERGE */}
        <div className="auth-vault" id="authVault">
            <div className="retina-container" id="retinaContainer">
                <div className="focus-ring" id="focusRing"></div>
                <div className="bracket bracket-tl"></div>
                <div className="bracket bracket-tr"></div>
                <div className="bracket bracket-bl"></div>
                <div className="bracket bracket-br"></div>
                
                <div className="camera-frame">
                    <video id="cameraFeed" className="camera-feed" autoPlay playsInline muted></video>
                    <div className="lens-dust"></div>
                    <div className="scan-line" id="scanLine"></div>
                </div>
            </div>

            <div className="liveness-indicator">
                <div className="live-node" id="step1"></div>
                <div className="live-node" id="step2"></div>
                <div className="live-node" id="step3"></div>
            </div>

            <div className="status-display" id="statusBadge">
                <div className="status-title">Verifikasi Keamanan</div>
                <div className="status-value" id="statusText">Mengkalibrasi optik...</div>
            </div>
        </div>

        {/* FASE 2: PROFIL EKSKLUSIF */}
        <div className="control-panel" id="controlPanel">
            
            <div className="nav-actions stagger-item">
                <Link href="/fitur" className="action-btn cursor-bind"><i className="fa-solid fa-arrow-left-long"></i> {t('profil_btn_back', 'Kembali')}</Link>
                <Link href="/chat" className="action-btn cursor-bind" style={{ background: "rgba(212,175,55,0.1)", borderColor: "var(--gold-premium, #d4af37)", color: "var(--gold-premium, #d4af37)" }}><i className="fa-solid fa-envelope"></i> {t('profil_btn_chat', 'Kotak Pesan')}</Link>
                <button className="action-btn btn-danger cursor-bind" onClick={handleLogout}><i className="fa-solid fa-power-off"></i> {t('profil_btn_logout', 'Keluar')}</button>
            </div>

            <div className="dashboard-header stagger-item">
                <h1 className="dashboard-title">{t('profil_title', 'Profil Eksklusif')}</h1>
                <p className="dashboard-subtitle">{t('profil_subtitle', 'Kelola Data Pribadi Anda')}</p>
                
                <div style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", background: "var(--glass-bg)", padding: "8px 20px", borderRadius: "50px", border: "1px solid var(--glass-border)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                    <div style={{ background: badgeColor, padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", color: "#fff", textTransform: "uppercase", letterSpacing: "1px", marginRight: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                        <i className={badgeIcon} style={{ marginRight: "5px" }}></i> {gelar}
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: "1.1rem", color: "var(--gold-premium, #d4af37)", fontWeight: "bold" }}>
                        {points.toLocaleString()} <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "1px", marginLeft: "3px" }}>PRESTISE</span>
                    </span>
                </div>
            </div>

            <div className="profil-grid tilt-container">
                
                {/* KOLOM KIRI: EDIT PROFIL */}
                <div className="premium-panel stagger-item parallax-card">
                    <h2 className="panel-title"><i className="fa-regular fa-id-card"></i> Identitas Personal</h2>
                    
                    <form onSubmit={handleProfileSubmit} id="formUpdateProfile">

                        <div className="photo-upload-wrapper">
                            <div className="magnetic-avatar cursor-bind" id="magAvatar">
                                <img src={avatarPreviewSrc} className="avatar-preview" id="avatarPreview" alt="Profil" />
                            </div>
                            <div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "15px" }}>Potret Resmi</div>
                                <div className="magnetic-btn-wrap" id="magBtnWrap">
                                    <label className="upload-btn-ui cursor-bind" id="magBtn" htmlFor="inputFileImg">
                                        Pilih Potret
                                    </label>
                                </div>
                                <input type="file" id="inputFileImg" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                                <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "5px" }}>Maksimum resolusi HD disarankan.</div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input type="text" name="nama_panggilan" className="form-input" id="inp_panggilan" placeholder=" " defaultValue={user.nama_panggilan} required />
                                <label className="form-label" htmlFor="inp_panggilan">Nama Sandi / Panggilan</label>
                                <div className="liquid-line"></div>
                            </div>
                            <div className="form-group">
                                <input type="number" name="no_whatsapp" className="form-input" id="inp_wa" placeholder=" " defaultValue={user.no_whatsapp} required />
                                <label className="form-label" htmlFor="inp_wa">Nomor Kontak (WhatsApp)</label>
                                <div className="liquid-line"></div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: "16px", padding: "16px 20px", marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#25d366", fontSize: "1rem", flexShrink: 0 }}>
                                    <i className="fa-brands fa-whatsapp"></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.5px" }}>Notifikasi WhatsApp</div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>Event baru, pengumuman, &amp; alumni bergabung</div>
                                </div>
                            </div>
                            <label className="wa-toggle-switch" style={{ position: "relative", display: "inline-block", width: "48px", height: "26px", flexShrink: 0, cursor: "pointer" }}>
                                <input type="checkbox" name="wa_notif_opt_in" id="waToggle" value="1" style={{ opacity: 0, width: 0, height: 0 }} checked={waOptIn} onChange={(e) => setWaOptIn(e.target.checked)} />
                                <span style={{ position: "absolute", inset: 0, background: waOptIn ? "#25d366" : "var(--glass-border)", borderRadius: "26px", transition: "0.3s", border: "1px solid var(--glass-border)" }} id="waToggleTrack">
                                    <span style={{ position: "absolute", height: "20px", width: "20px", left: "3px", bottom: "2px", background: "var(--bg-main)", borderRadius: "50%", transition: "0.3s", transform: waOptIn ? "translateX(22px)" : "translateX(0)", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }} id="waToggleThumb"></span>
                                </span>
                            </label>
                        </div>

                        <div className="form-group">
                            <input type="text" name="nama_lengkap" className="form-input" id="inp_lengkap" placeholder=" " defaultValue={user.nama_lengkap} required />
                            <label className="form-label" htmlFor="inp_lengkap">Nama Lengkap Resmi</label>
                            <div className="liquid-line"></div>
                        </div>

                        <div className="form-group">
                            <input type="email" name="email" className="form-input" id="inp_email" placeholder=" " defaultValue={user.email} required />
                            <label className="form-label" htmlFor="inp_email">Alamat Surel Utama</label>
                            <div className="liquid-line"></div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input type="text" name="akun_ig" className="form-input" id="inp_ig" placeholder=" " defaultValue={user.akun_ig} />
                                <label className="form-label" htmlFor="inp_ig">Instagram (Opsional)</label>
                                <div className="liquid-line"></div>
                            </div>
                            <div className="form-group">
                                <input type="text" name="akun_tiktok" className="form-input" id="inp_tt" placeholder=" " defaultValue={user.akun_tiktok} />
                                <label className="form-label" htmlFor="inp_tt">TikTok (Opsional)</label>
                                <div className="liquid-line"></div>
                            </div>
                        </div>

                        <div className="form-group">
                            <textarea name="motivasi_hidup" className="form-input" id="inp_motivasi" placeholder=" " defaultValue={user.motivasi_hidup}></textarea>
                            <label className="form-label" htmlFor="inp_motivasi">Visi &amp; Motivasi</label>
                            <div className="liquid-line"></div>
                        </div>
                        
                        <div className="form-group">
                            <input type="text" name="cita_cita" className="form-input" id="inp_cita" placeholder=" " defaultValue={user.cita_cita} />
                            <label className="form-label" htmlFor="inp_cita">Target Pencapaian</label>
                            <div className="liquid-line"></div>
                        </div>

                        <button type="submit" className="btn-submit cursor-bind" disabled={saving}>
                          {saving ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...</> : "Simpan Perubahan"}
                        </button>
                    </form>
                </div>

                {/* KOLOM KANAN: PROTOKOL KEAMANAN */}
                <div className="premium-panel stagger-item parallax-card">
                    <h2 className="panel-title"><i className="fa-solid fa-fingerprint"></i> Akses &amp; Keamanan</h2>
                    
                    <div className="bio-status-box cursor-bind">
                        <i className="fa-solid fa-shield-halved"></i>
                        <div className="bio-status-title">Keamanan Visual Aktif</div>
                        <div className="bio-status-desc">Wajah Anda menjadi kunci tunggal untuk membedah data Sovereign ini. Tingkat akurasi pemindaian telah dimaksimalkan.</div>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "2px", margin: "40px 0 20px 0" }}>Kredensial Fisik (Passkey)</div>
                    
                    {biometricsList.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={{ 
                          background: "rgba(0, 255, 170, 0.06)", 
                          border: "1px solid rgba(0, 255, 170, 0.25)", 
                          borderRadius: "16px", 
                          padding: "18px 20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "15px"
                        }}>
                          <div style={{ 
                            width: "42px", 
                            height: "42px", 
                            borderRadius: "12px", 
                            background: "rgba(0, 255, 170, 0.15)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            color: "#00ffaa",
                            flexShrink: 0
                          }}>
                            <i className="fa-solid fa-circle-check"></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#00ffaa", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.5px" }}>
                              Passkey Biometrik Aktif
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "2px" }}>
                              {biometricsList.length} perangkat terdaftar untuk login instan tanpa sandi.
                            </div>
                          </div>
                        </div>

                        {/* List of devices */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {biometricsList.map((bio, index) => (
                            <div key={bio.id || index} style={{ 
                              background: "rgba(255, 255, 255, 0.03)", 
                              border: "1px solid var(--glass-border)", 
                              borderRadius: "12px", 
                              padding: "12px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <i className="fa-solid fa-fingerprint" style={{ color: "var(--gold-premium, #d4af37)", fontSize: "1.1rem" }}></i>
                                <div>
                                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                    {bio.device_type === "single_device" ? "Platform Authenticator" : "Kredensial Biometrik"} #{index + 1}
                                  </div>
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                                    Terdaftar: {bio.created_at ? new Date(bio.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Aktif"}
                                  </div>
                                </div>
                              </div>

                              <button 
                                type="button"
                                onClick={() => handleDeleteBiometric(bio.id)}
                                disabled={deletingBioId === bio.id}
                                title="Hapus perangkat"
                                style={{
                                  background: "rgba(255, 51, 102, 0.1)",
                                  border: "1px solid rgba(255, 51, 102, 0.3)",
                                  color: "#ff3366",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  fontSize: "0.7rem",
                                  cursor: "pointer",
                                  transition: "0.2s"
                                }}
                              >
                                {deletingBioId === bio.id ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-trash-can" style={{ marginRight: "4px" }}></i> Hapus</>}
                              </button>
                            </div>
                          ))}
                        </div>

                        <button 
                          className="btn-passkey cursor-bind" 
                          onClick={handleRegisterBiometric} 
                          disabled={registeringBio}
                          style={{ marginTop: "10px" }}
                        >
                          {registeringBio ? (
                            <><i className="fa-solid fa-circle-notch fa-spin"></i> Menghubungkan Sensor...</>
                          ) : (
                            <><i className="fa-solid fa-plus" style={{ marginRight: "5px" }}></i> Daftarkan Perangkat Tambahan</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div id="bioOptionsBox">
                        <button 
                          className="btn-passkey cursor-bind" 
                          onClick={handleRegisterBiometric} 
                          disabled={registeringBio}
                        >
                          {registeringBio ? (
                            <><i className="fa-solid fa-circle-notch fa-spin"></i> Menghubungkan Sensor...</>
                          ) : (
                            <><i className="fa-solid fa-key" style={{ marginRight: "5px" }}></i> Autentikasi Perangkat Ini</>
                          )}
                        </button>
                      </div>
                    )}
                    
                    <div id="bioStatus" style={{ marginTop: "20px", fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.6 }}>
                        Gunakan biometrik bawaan (Touch ID/Face ID/Windows Hello) pada gawai Anda sebagai otentikasi lapis kedua tanpa sandi.
                    </div>
                    
                    <div style={{ marginTop: "50px", paddingTop: "30px", borderTop: "1px solid var(--glass-border)", textAlign: "center" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "2px" }}>Identitas Eksekutif</div>
                        <Link href="/sovereign" className="cursor-bind" style={{ color: "var(--gold-premium)", textDecoration: "none", fontSize: "0.85rem", display: "inline-block", marginTop: "15px", fontWeight: 600, letterSpacing: "2px" }}><i className="fa-solid fa-cube" style={{ marginRight: "8px" }}></i> BUKA SOVEREIGN ID 5D</Link>
                    </div>

                    {/* ========= CHANGE PASSWORD SECTION ========= */}
                    <div style={{ marginTop: "50px", paddingTop: "30px", borderTop: "1px solid var(--glass-border)" }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "20px" }}>
                            <i className="fa-solid fa-lock" style={{ marginRight: "8px", color: "var(--gold-premium, #d4af37)" }}></i>
                            Ubah Kata Sandi
                        </h3>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <input type="password" name="new_password" className="form-input" id="inp_new_pw" placeholder=" " required minLength={8} />
                                <label className="form-label" htmlFor="inp_new_pw">Kata Sandi Baru</label>
                                <div className="liquid-line"></div>
                            </div>
                            <div className="form-group">
                                <input type="password" name="confirm_password" className="form-input" id="inp_confirm_pw" placeholder=" " required minLength={8} />
                                <label className="form-label" htmlFor="inp_confirm_pw">Konfirmasi Kata Sandi</label>
                                <div className="liquid-line"></div>
                            </div>
                            <button type="submit" className="btn-submit cursor-bind" disabled={changingPw} style={{ background: "rgba(212,175,55,0.1)", border: "1px solid var(--gold-premium, #d4af37)", color: "var(--gold-premium, #d4af37)" }}>
                                {changingPw ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Memproses...</> : <><i className="fa-solid fa-key" style={{ marginRight: "5px" }}></i> Perbarui Kata Sandi</>}
                            </button>
                        </form>
                    </div>

                    {/* ========= DELETE ACCOUNT SECTION ========= */}
                    <div style={{ marginTop: "50px", paddingTop: "30px", borderTop: "1px solid rgba(139,0,0,0.3)" }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#8b0000", marginBottom: "10px" }}>
                            <i className="fa-solid fa-skull-crossbones" style={{ marginRight: "8px" }}></i>
                            Zona Berbahaya
                        </h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.6 }}>
                            Tindakan ini akan menonaktifkan akun Anda secara permanen dari sistem. Data tidak dapat dipulihkan.
                        </p>
                        {!showDeleteConfirm ? (
                          <button 
                            className="cursor-bind"
                            onClick={() => setShowDeleteConfirm(true)}
                            style={{ background: "rgba(139,0,0,0.1)", border: "1px solid rgba(139,0,0,0.5)", color: "#8b0000", padding: "12px 25px", borderRadius: "10px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "1px", width: "100%", transition: "0.3s" }}
                          >
                            <i className="fa-solid fa-trash" style={{ marginRight: "8px" }}></i> Nonaktifkan Akun
                          </button>
                        ) : (
                          <form onSubmit={handleDeleteAccount} style={{ background: "rgba(139,0,0,0.1)", border: "1px solid rgba(139,0,0,0.3)", borderRadius: "16px", padding: "20px", textAlign: "center" }}>
                            <p style={{ color: "#ff5555", fontSize: "0.85rem", fontWeight: 600, marginBottom: "15px" }}>
                              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "5px" }}></i>
                              Apakah Anda benar-benar yakin?
                            </p>
                            <div className="form-group" style={{ marginBottom: "15px", textAlign: "left" }}>
                              <input type="password" name="password_delete" className="form-input" id="inp_delpass" placeholder=" " required style={{ borderColor: "rgba(255, 51, 102, 0.3)" }} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                              <label className="form-label" htmlFor="inp_delpass" style={{ color: "#ff3366" }}>Konfirmasi Sandi untuk Hapus</label>
                              <div className="liquid-line" style={{ background: "linear-gradient(90deg, transparent, #ff3366, transparent)" }}></div>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                type="button"
                                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem" }}
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                disabled={deletingAccount}
                                style={{ flex: 1, background: "rgba(139,0,0,0.8)", border: "none", color: "#fff", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                              >
                                {deletingAccount ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Ya, Nonaktifkan"}
                              </button>
                            </div>
                          </form>
                        )}
                    </div>

                    {/* Easter Egg / Hidden Admin Access */}
                    <div style={{ marginTop: "60px", fontSize: "0.6rem", color: "var(--glass-border)", textAlign: "justify", lineHeight: 1.8, fontFamily: "'Inter', sans-serif" }}>
                        Expedient bermakna kepraktisan dan ketepatan dalam bertindak. Ia adalah filosofi tentang bagaimana mencapai tujuan dengan cara yang paling efisien dan bijaksana. Generasi yang membawa nama ini tidak terjebak pada hal-hal yang rumit tanpa alasan; mereka berfokus pada apa yang benar-benar bermakna dan membawa kebaikan bersama. Kemampuan untuk menempatkan segala sesuatu pada proporsi yang tepat adalah bentuk kedewasaan. Pada akhirnya, keindahan dari sebuah perjalanan terletak pada kesederhanaan niat dan keyakinan <Link href="/admin" style={{ color: "inherit", textDecoration: "none", cursor: "default", outline: "none" }} className="cursor-bind">utuh</Link> untuk saling melengkapi di setiap langkah.
                    </div>

                </div>

            </div>
        </div>

        <Script src="/vendor/gsap/gsap.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/profil.js" strategy="afterInteractive" />
    </main>
  );
}
