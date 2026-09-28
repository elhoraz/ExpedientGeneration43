import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Versi rilis APK terbaru dari Expedient Generation 43
  return NextResponse.json({
    latestVersionCode: 2,
    latestVersionName: "1.1.0",
    releaseDate: "2026-09-28",
    apkUrl: process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "/Expedient43-v1.0.apk",
    title: "Pembaruan Expedient 43 v1.1.0",
    releaseNotes: [
      "Notifikasi Heads-Up Banner melayang dengan suara & getaran resmi",
      "Permintaan izin notifikasi sistem otomatis untuk Android 13+",
      "Peningkatan akurasi sensor arah kiblat & kompas otomatis",
      "Pembaruan audio Adzan Makkah & Madinah durasi penuh",
      "Fitur In-App Auto-Update untuk pembaruan instan"
    ],
    forceUpdate: false,
    minSupportedVersionCode: 1,
  });
}
