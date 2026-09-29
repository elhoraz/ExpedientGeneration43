import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Versi rilis APK terbaru dari Expedient Generation 43 (Build 2 / v1.2.0)
  return NextResponse.json({
    latestVersionCode: 2,
    latestVersionName: "1.2.0",
    releaseDate: "2026-09-30",
    apkUrl: process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "https://github.com/elhoraz/ExpedientGeneration43/releases/download/v1.2.0/Expedient43-v1.2.0.apk",
    title: "Expedient 43 v1.2.0 (Pembaruan Utama)",
    releaseNotes: [
      "🕌 Kumandang Suara Adzan Makkah & Alarm Shalat Otomatis di Layar Kunci",
      "📞 Notifikasi Panggilan Video & Suara Real-time (Google FCM Cloud)",
      "💬 Notifikasi Pesan Chat Masuk saat Aplikasi Ditutup Total",
      "⚡ Sinkronisasi otomatis token perangkat & peningkatan stabilitas",
      "🔔 Suara notifikasi resmi alumni dengan prioritas sistem tertinggi"
    ],
    forceUpdate: true,
    minSupportedVersionCode: 2,
  });
}
