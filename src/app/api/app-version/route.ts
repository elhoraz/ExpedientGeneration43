import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Versi rilis APK terbaru dari Expedient Generation 43 (Build 3 / v1.2.1)
  return NextResponse.json({
    latestVersionCode: 3,
    latestVersionName: "1.2.1",
    releaseDate: "2026-09-30",
    apkUrl: process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "https://github.com/elhoraz/ExpedientGeneration43/releases/download/v1.2.1/Expedient43-v1.2.1.apk",
    title: "Expedient 43 v1.2.1 (Panggilan Interaktif & Alarm Layar Kunci)",
    releaseNotes: [
      "📞 Notifikasi Panggilan Telepon Ala WhatsApp: Langsung muncul di layar dengan tombol Terima & Tolak",
      "🕌 Kumandang Adzan Layar Kunci: Layar otomatis menyala, suara adzan keras & tombol Hentikan Adzan",
      "🚀 Navigasi Langsung ke Ruang Telepon saat notifikasi ditekan (tidak tersangkut di beranda/landing page)",
      "🔔 Ringtone nada panggil telepon berulang secara otomatis dan berhenti saat dijawab atau ditolak",
      "⚡ Sinkronisasi otomatis session & keamanan koneksi latar belakang"
    ],
    forceUpdate: true,
    minSupportedVersionCode: 3,
  });
}
