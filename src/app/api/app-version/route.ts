import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Versi rilis APK terbaru dari Expedient Generation 43 (Build 6 / v1.2.4)
  return NextResponse.json(
    {
      latestVersionCode: 6,
      latestVersionName: "1.2.4",
      releaseDate: "2026-11-28",
      apkUrl:
        process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL ||
        "https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/apk-releases/Expedient43-v1.2.4.apk",
      ipaUrl: process.env.NEXT_PUBLIC_IPA_DOWNLOAD_URL || "/download",
      title: "Expedient 43 v1.2.4 (Pembaruan Wajib · Performa, Cloud Sync & Stabilitas)",
      releaseNotes: [
        "Pembaruan Wajib (Build 6): Aplikasi versi lama (v1.2.3/Build 5 ke bawah) wajib memperbarui demi kompatibilitas fitur & sinkronisasi terbaru",
        "Ukuran APK 24x Lebih Ramping (~3,6 MB) sehingga pengunduhan & pembaruan jauh lebih cepat",
        "Perbaikan tombol Back hardware Android agar menutup modal/halaman offline tanpa loop",
        "Optimasi performa 3-tier WebView & PBR 3D, sinkronisasi Ibadah Cloud (/quran & /tasbih), serta perbaikan Radar 3D & Oracle",
      ],
      forceUpdate: true,
      minSupportedVersionCode: 6,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
