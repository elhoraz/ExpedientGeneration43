import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nomor: string }> }
) {
  try {
    const { nomor } = await params;
    const surahNum = parseInt(nomor, 10);

    if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
      return NextResponse.json(
        { success: false, message: "Nomor surah tidak valid (1-114)" },
        { status: 400 }
      );
    }

    const res = await fetch(`https://equran.id/api/v2/surat/${surahNum}`, {
      next: { revalidate: 86400 }, // Cache 24 jam di server Next.js
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil data surah dari server pusat (${res.status})`);
    }

    const json = await res.json();

    return NextResponse.json({
      success: true,
      data: json.data,
    });
  } catch (error: any) {
    console.error("API /api/quran/surat/[nomor] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Terjadi kesalahan saat memuat surah" },
      { status: 500 }
    );
  }
}
