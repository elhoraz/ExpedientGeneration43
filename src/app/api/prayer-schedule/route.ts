import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache for monthly schedules: key `${cityId}_${year}_${month}`
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId") || "1621"; // Default: Kab. Ponorogo
    const dateParam = searchParams.get("date"); // Optional YYYY-MM-DD

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const targetDateStr = `${year}-${month}-${day}`;

    const cacheKey = `${cityId}_${year}_${month}`;
    const now = Date.now();

    let monthData = null;
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      monthData = cached.data;
    } else {
      const apiUrl = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}`;
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "ExpedientGeneration43/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 86400 },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.status && json.data) {
          monthData = json.data;
          cache.set(cacheKey, { data: monthData, timestamp: now });
        }
      }
    }

    if (!monthData || !monthData.jadwal) {
      return NextResponse.json(
        { error: "Gagal memuat jadwal shalat resmi Kemenag", status: false },
        { status: 502 }
      );
    }

    // Find today's schedule from monthData.jadwal
    const jadwalList = Array.isArray(monthData.jadwal) ? monthData.jadwal : [];
    const todayJadwal =
      jadwalList.find((j: any) => j.date === targetDateStr) ||
      jadwalList[targetDate.getDate() - 1] ||
      jadwalList[0];

    return NextResponse.json(
      {
        status: true,
        source: "kemenag_ri",
        cityId,
        cityName: monthData.lokasi || "KAB. PONOROGO",
        province: monthData.daerah || "JAWA TIMUR",
        date: targetDateStr,
        schedule: todayJadwal,
        monthSchedule: jadwalList,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error: any) {
    console.error("Prayer schedule API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error", status: false },
      { status: 500 }
    );
  }
}
