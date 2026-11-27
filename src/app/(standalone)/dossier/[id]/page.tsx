import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DossierClient from "./DossierClient";

export const metadata = {
  title: "Profil Alumni - Expedient 43",
};

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the target user profile
  const { data: rawTargetUser } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, foto_profil, alamat_lengkap, motivasi_hidup, akun_ig, tanggal_lahir")
    .eq("id", id)
    .maybeSingle();

  const targetUser = rawTargetUser
    ? { ...rawTargetUser, kota_domisili: rawTargetUser.alamat_lengkap || null }
    : null;

  if (!targetUser) {
    return (
      <main className="dossier-notfound">
        <style>{`
          .dossier-notfound {
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--bg-main, #060b14);
            color: var(--text-primary, #f2efe9);
          }
          .dossier-notfound-card {
            max-width: 420px;
            width: 100%;
            text-align: center;
            padding: 36px 28px;
            border-radius: 16px;
            background: var(--bg-card, #0f141e);
            border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.25));
            box-shadow: var(--glass-shadow, 0 18px 40px rgba(0, 0, 0, 0.4));
          }
          .dossier-notfound-icon {
            font-size: 2rem;
            color: var(--gold-main, #d4af37);
            margin-bottom: 14px;
          }
          .dossier-notfound h1 {
            font-family: var(--font-playfair, 'Playfair Display', serif);
            font-size: 1.4rem;
            margin: 0 0 8px 0;
          }
          .dossier-notfound p {
            color: var(--text-secondary, #a1a8b5);
            font-size: 0.92rem;
            line-height: 1.55;
            margin: 0 0 22px 0;
          }
          .dossier-notfound-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 44px;
            padding: 10px 22px;
            border-radius: 10px;
            background: var(--gold-main, #d4af37);
            color: #060b14;
            font-weight: 700;
            font-size: 0.9rem;
            text-decoration: none;
          }
          :root[data-theme="light"] .dossier-notfound { background: #f6f5f1; color: #18181b; }
          :root[data-theme="light"] .dossier-notfound-card { background: #ffffff; border-color: rgba(24, 24, 27, 0.14); }
          :root[data-theme="light"] .dossier-notfound-icon { color: #7c520a; }
          :root[data-theme="light"] .dossier-notfound p { color: #52525b; }
          :root[data-theme="light"] .dossier-notfound-btn { background: #7c520a; color: #ffffff; }
        `}</style>
        <div className="dossier-notfound-card">
          <div className="dossier-notfound-icon" aria-hidden="true">
            <i className="fa-solid fa-user-slash"></i>
          </div>
          <h1>Profil Tidak Ditemukan</h1>
          <p>Data alumni tidak tersedia atau akses ke profil ini dibatasi.</p>
          <Link href="/direktori" className="dossier-notfound-btn">
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Kembali ke Direktori
          </Link>
        </div>
      </main>
    );
  }

  // Calculate age safely
  let age: string | number = 'N/A';
  if (targetUser.tanggal_lahir) {
    const parts = targetUser.tanggal_lahir.split(/[-/]/);
    if (parts.length >= 3) {
      let birthYear = parseInt(parts[0], 10);
      let birthMonth = parseInt(parts[1], 10);
      let birthDay = parseInt(parts[2], 10);
      if (parts[2].length === 4) {
        birthYear = parseInt(parts[2], 10);
        birthMonth = parseInt(parts[1], 10);
        birthDay = parseInt(parts[0], 10);
      }
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      let computedAge = now.getFullYear() - birthYear;
      const m = (now.getMonth() + 1) - birthMonth;
      if (m < 0 || (m === 0 && now.getDate() < birthDay)) {
        computedAge--;
      }
      if (computedAge > 0 && computedAge < 120) {
        age = computedAge;
      }
    }
  }

  return <DossierClient targetUser={targetUser} age={age} />;
}
