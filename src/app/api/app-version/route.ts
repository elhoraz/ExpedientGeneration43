import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Versi rilis APK terbaru dari Expedient Generation 43 (Build 4 / v1.2.2)
  return NextResponse.json({
    latestVersionCode: 4,
    latestVersionName: "1.2.2",
    releaseDate: "2026-09-30",
    apkUrl: process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "https://github.com/elhoraz/ExpedientGeneration43/releases/download/v1.2.2/Expedient43-v1.2.2.apk",
    title: "Expedient 43 v1.2.2 (Pembaruan Adzan Mode Hening)",
    releaseNotes: [
      "🔕 Mode Hening Otomatis: Suara adzan otomatis hening saat HP dalam mode Silent/Getar (hanya getaran & notifikasi visual)",
      "📞 Notifikasi Panggilan Telepon Ala WhatsApp dengan tombol Terima & Tolak",
      "🕌 Kumandang Adzan Otomatis saat HP dalam Mode Nada Dering Normal",
      "🚀 Navigasi Langsung ke Ruang Telepon saat notifikasi ditekan",
      "⚡ Stabilitas latar belakang dan pembaruan antarmuka"
    ],
    forceUpdate: false,
    minSupportedVersionCode: 1,
  });
}
