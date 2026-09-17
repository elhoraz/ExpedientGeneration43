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

    const res = await fetch(`https://equran.id/api/v2/tafsir/${surahNum}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil data tafsir dari server pusat (${res.status})`);
    }

    const json = await res.json();

    return NextResponse.json({
      success: true,
      data: json.data,
    });
  } catch (error: any) {
    console.error("API /api/quran/tafsir/[nomor] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Terjadi kesalahan saat memuat tafsir" },
      { status: 500 }
    );
  }
}
