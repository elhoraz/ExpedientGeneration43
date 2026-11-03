import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Versi rilis APK terbaru dari Expedient Generation 43 (Build 5 / v1.2.3)
  return NextResponse.json({
    latestVersionCode: 5,
    latestVersionName: "1.2.3",
    releaseDate: "2026-11-03",
    apkUrl: process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "https://github.com/elhoraz/ExpedientGeneration43/releases/download/v1.2.3/Expedient43-v1.2.3.apk",
    ipaUrl: process.env.NEXT_PUBLIC_IPA_DOWNLOAD_URL || "/Expedient43.ipa",
    title: "Expedient 43 v1.2.3 (Pembaruan Adzan Mode Hening & Jangan Ganggu)",
    releaseNotes: [
      "🔕 Mode Hening & DND Mutlak: Integrasi hardware Android (zen_mode, AudioAttributes notification stream, stream mute detection)",
      "🕌 Kumandang Adzan Otomatis saat HP dalam Mode Nada Dering Normal",
      "⏹ Tombol Hentikan Adzan langsung dari Layar Kunci",
      "⚡ Perbaikan deteksi audio dan stabilitas latar belakang"
    ],
    forceUpdate: false,
    minSupportedVersionCode: 1,
  });
}
