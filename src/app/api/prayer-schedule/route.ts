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

    let year: string;
    let month: string;
    let day: string;
    let targetDateStr: string;

    // Timezone-safe parsing: Never use new Date(dateParam) which parses as UTC midnight
    // and causes date-rollback on UTC-n servers!
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parts = dateParam.split("-");
      year = parts[0];
      month = parts[1];
      day = parts[2];
      targetDateStr = dateParam;
    } else {
      // Default to current Indonesian calendar date (Asia/Jakarta, UTC+7)
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      targetDateStr = formatter.format(new Date());
      const parts = targetDateStr.split("-");
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }

    const cacheKey = `${cityId}_${year}_${month}`;
    const now = Date.now();

    let monthData = null;
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      monthData = cached.data;
    } else {
      try {
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
      } catch (fetchErr) {
        console.warn("Monthly schedule fetch error:", fetchErr);
      }
    }

    let todayJadwal = null;
    let jadwalList: any[] = [];

    if (monthData && monthData.jadwal) {
      jadwalList = Array.isArray(monthData.jadwal) ? monthData.jadwal : [];
      const dayNum = parseInt(day, 10);
      todayJadwal =
        jadwalList.find((j: any) => j.date === targetDateStr) ||
        jadwalList[dayNum - 1] ||
        jadwalList[0];
    }

    // Secondary fallback: fetch exact day endpoint if monthly was empty or failed
    if (!todayJadwal) {
      try {
        const dayApiUrl = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;
        const dayRes = await fetch(dayApiUrl, {
          headers: {
            "User-Agent": "ExpedientGeneration43/1.0",
            Accept: "application/json",
          },
        });
        if (dayRes.ok) {
          const dayJson = await dayRes.json();
          if (dayJson.status && dayJson.data && dayJson.data.jadwal) {
            todayJadwal = dayJson.data.jadwal;
            monthData = dayJson.data;
          }
        }
      } catch (dayErr) {
        console.warn("Daily schedule fetch fallback error:", dayErr);
      }
    }

    if (!todayJadwal) {
      return NextResponse.json(
        { error: "Gagal memuat jadwal shalat resmi Kemenag", status: false },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        status: true,
        source: "kemenag_ri",
        cityId,
        cityName: monthData?.lokasi || "KAB. PONOROGO",
        province: monthData?.daerah || "JAWA TIMUR",
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
