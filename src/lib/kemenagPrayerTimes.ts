// src/lib/kemenagPrayerTimes.ts
// Integrasi Data Resmi Jadwal Shalat Kementerian Agama Republik Indonesia (Bimas Islam)
// Expedient Generation 43

import { PrayerSchedule, calculatePrayerTimes, findNearestCity } from "./prayerTimes";

export interface KemenagCityItem {
  id: string;
  lokasi: string;
}

export const DEFAULT_KEMENAG_CITY_ID = "1621"; // KAB. PONOROGO (Arrisalah Slahung)

/**
 * Mengambil jadwal shalat resmi Kementerian Agama RI (Kemenag)
 * Dilengkapi offline cache di localStorage sehingga tetap bekerja saat jaringan lambat atau terputus.
 */
export async function getOfficialKemenagSchedule(
  cityId: string = DEFAULT_KEMENAG_CITY_ID,
  date: Date = new Date(),
  fallbackLat: number = -7.8671,
  fallbackLng: number = 111.4647,
  fallbackTimezone: number = 7
): Promise<PrayerSchedule> {
  // If cityId is default Ponorogo, but coordinates indicate another location (e.g. GPS in Jakarta/Surabaya),
  // automatically resolve nearest Kemenag city preset!
  let targetCityId = cityId;
  let targetLocationName = "KAB. PONOROGO";

  if (targetCityId === DEFAULT_KEMENAG_CITY_ID && (Math.abs(fallbackLat - (-7.8671)) > 0.1 || Math.abs(fallbackLng - 111.4647) > 0.1)) {
    const nearest = findNearestCity(fallbackLat, fallbackLng);
    if (nearest?.kemenagCityId) {
      targetCityId = nearest.kemenagCityId;
      targetLocationName = nearest.name;
    }
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;
  const localCacheKey = `kemenag_prayer_schedule_${targetCityId}_${dateKey}`;

  // 1. Coba baca dari localStorage cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.subuh && parsed.maghrib) {
          return parsed as PrayerSchedule;
        }
      }
    } catch {}
  }

  // 2. Fetch jadwal resmi dari API internal /api/prayer-schedule
  try {
    const res = await fetch(`/api/prayer-schedule?cityId=${targetCityId}&date=${dateKey}`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.status && json.schedule) {
        const item = json.schedule;
        const schedule: PrayerSchedule = {
          imsak: item.imsak,
          subuh: item.subuh,
          syuruq: item.terbit,
          dzuhur: item.dzuhur,
          ashar: item.ashar,
          maghrib: item.maghrib,
          isya: item.isya,
          dateStr: item.tanggal || date.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          isKemenagOfficial: true,
          locationName: json.cityName || targetLocationName,
        };

        // Simpan ke localStorage cache
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(localCacheKey, JSON.stringify(schedule));
          } catch {}
        }

        return schedule;
      }
    }
  } catch (err) {
    console.warn("Internal Kemenag API fetch notice:", err);
  }

  // 2b. Direct external fetch fallback if internal API is unreachable
  try {
    const directRes = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${targetCityId}/${year}/${month}/${day}`);
    if (directRes.ok) {
      const directJson = await directRes.json();
      if (directJson.status && directJson.data && directJson.data.jadwal) {
        const item = directJson.data.jadwal;
        const schedule: PrayerSchedule = {
          imsak: item.imsak,
          subuh: item.subuh,
          syuruq: item.terbit,
          dzuhur: item.dzuhur,
          ashar: item.ashar,
          maghrib: item.maghrib,
          isya: item.isya,
          dateStr: item.tanggal || date.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          isKemenagOfficial: true,
          locationName: directJson.data.lokasi || targetLocationName,
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(localCacheKey, JSON.stringify(schedule));
          } catch {}
        }

        return schedule;
      }
    }
  } catch (directErr) {
    console.warn("Direct Kemenag API fetch notice:", directErr);
  }

  // 3. Fallback: Hitung secara astronomis falakiyah standar Kemenag RI (dengan ihtiyat +2 menit)
  const fallback = calculatePrayerTimes(fallbackLat, fallbackLng, fallbackTimezone, date);
  return {
    ...fallback,
    isKemenagOfficial: false,
    locationName: `${targetLocationName} (Akurasi Falakiyah)`,
  };
}

/**
 * Mencari kota/kabupaten di seluruh Indonesia dari basis data Kemenag RI
 */
export async function searchKemenagCities(query: string): Promise<KemenagCityItem[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const json = await res.json();
      if (json.status && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn("Kemenag city search notice:", e);
  }
  return [];
}
