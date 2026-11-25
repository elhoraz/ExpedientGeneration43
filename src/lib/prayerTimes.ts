// src/lib/prayerTimes.ts
// Perhitungan Astronomis Waktu Sholat & Arah Kiblat (Metode Kemenag RI & Spherical Trigonometry)
// Expedient Generation 43

export interface CityPreset {
  name: string;
  lat: number;
  lng: number;
  timezone: number; // UTC offset in hours, e.g. 7 for WIB, 8 for WITA, 9 for WIT
  region: string;
  kemenagCityId?: string; // ID resmi Kemenag RI (Bimas Islam)
}

export const POPULAR_CITIES: CityPreset[] = [
  { name: "Jakarta", lat: -6.2088, lng: 106.8456, timezone: 7, region: "DKI Jakarta (WIB)", kemenagCityId: "1301" },
  { name: "Ponorogo (Arrisalah)", lat: -7.8671, lng: 111.4647, timezone: 7, region: "Jawa Timur (WIB)", kemenagCityId: "1621" },
  { name: "Surabaya", lat: -7.2575, lng: 112.7521, timezone: 7, region: "Jawa Timur (WIB)", kemenagCityId: "1638" },
  { name: "Bandung", lat: -6.9175, lng: 107.6191, timezone: 7, region: "Jawa Barat (WIB)", kemenagCityId: "1219" },
  { name: "Yogyakarta", lat: -7.7956, lng: 110.3695, timezone: 7, region: "D.I. Yogyakarta (WIB)", kemenagCityId: "1505" },
  { name: "Semarang", lat: -6.9667, lng: 110.4167, timezone: 7, region: "Jawa Tengah (WIB)", kemenagCityId: "1433" },
  { name: "Medan", lat: 3.5952, lng: 98.6722, timezone: 7, region: "Sumatera Utara (WIB)", kemenagCityId: "0228" },
  { name: "Padang", lat: -0.9471, lng: 100.4172, timezone: 7, region: "Sumatera Barat (WIB)", kemenagCityId: "0314" },
  { name: "Makassar", lat: -5.1477, lng: 119.4327, timezone: 8, region: "Sulawesi Selatan (WITA)", kemenagCityId: "2622" },
  { name: "Banjarmasin", lat: -3.3194, lng: 114.5908, timezone: 8, region: "Kalimantan Selatan (WITA)", kemenagCityId: "2113" },
  { name: "Denpasar", lat: -8.6705, lng: 115.2126, timezone: 8, region: "Bali (WITA)", kemenagCityId: "1709" },
  { name: "Mekkah Al-Mukarramah", lat: 21.4225, lng: 39.8262, timezone: 3, region: "Arab Saudi (AST)" },
  { name: "Madinah Al-Munawwarah", lat: 24.5247, lng: 39.5692, timezone: 3, region: "Arab Saudi (AST)" },
];

/**
 * Menemukan kota preset terdekat berdasarkan koordinat GPS
 */
export function findNearestCity(lat: number, lng: number): CityPreset {
  let nearestCity = POPULAR_CITIES[0];
  let minDistance = Infinity;

  for (const city of POPULAR_CITIES) {
    if (!city.kemenagCityId) continue;
    const dLat = city.lat - lat;
    const dLng = city.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearestCity = city;
    }
  }

  return nearestCity;
}

export interface QiblaInfo {
  bearing: number; // 0 - 360 deg clockwise from True North
  distanceKm: number;
  angleFromWest: number; // e.g. 24.5° dari Barat ke Utara
  angleFromNorth: number; // e.g. 65.5° dari Utara ke Barat
  dms: string; // e.g. 294° 27' 45"
}

export interface PrayerSchedule {
  imsak: string;
  subuh: string;
  syuruq: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  dateStr: string;
  isKemenagOfficial?: boolean;
  locationName?: string;
}

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

/**
 * Menghitung derajat arah kiblat dan jarak ke Ka'bah (Great-Circle Bearing)
 */
export function calculateQibla(lat: number, lng: number): QiblaInfo {
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;

  const y = Math.sin(dLng);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLng);

  let q = Math.atan2(y, x) * (180 / Math.PI);
  q = (q + 360) % 360;

  // Jarak ke Ka'bah via Haversine Formula
  const R = 6371; // Earth radius in km
  const dLat = phi2 - phi1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  const dmsDeg = Math.floor(q);
  const dmsMinFloat = (q - dmsDeg) * 60;
  const dmsMin = Math.floor(dmsMinFloat);
  const dmsSec = Math.round((dmsMinFloat - dmsMin) * 60);
  const dms = `${dmsDeg}° ${dmsMin}' ${dmsSec}"`;

  const angleFromWest = Math.round(((q - 270 + 360) % 360) * 10) / 10;
  const angleFromNorth = Math.round(((360 - q + 360) % 360) * 10) / 10;

  return {
    bearing: Math.round(q * 10) / 10,
    distanceKm,
    angleFromWest,
    angleFromNorth,
    dms,
  };
}

/**
 * Menghitung waktu sholat 5 waktu + Imsak + Syuruq berdasarkan koordinat & tanggal
 * Menggunakan Standar Kementerian Agama RI (Fajr -20°, Isya -18°, ihtiyat +2-3 menit)
 */
export function calculatePrayerTimes(
  lat: number,
  lng: number,
  timezone: number = 7,
  date: Date = new Date()
): PrayerSchedule {
  const year = date.getFullYear();

  // Day of year
  const startOfYear = new Date(year, 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Approximate Sun Coordinates
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Solar noon
  const solarNoon = 12 + (timezone * 15 - lng) / 15 - eqTime / 60;

  const latRad = (lat * Math.PI) / 180;

  // Hour angle helper
  const hourAngle = (altDeg: number): number | null => {
    const altRad = (altDeg * Math.PI) / 180;
    const cosH =
      (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decl)) /
      (Math.cos(latRad) * Math.cos(decl));
    if (cosH > 1 || cosH < -1) return null;
    return (Math.acos(cosH) * 180) / Math.PI;
  };

  // Subuh (Kemenag standard -20° + 2 min ihtiyat)
  const hSubuh = hourAngle(-20);
  const subuhHours = (hSubuh !== null ? solarNoon - hSubuh / 15 : 4.5) + 2 / 60;

  // Syuruq (Sunrise -0.833°)
  const hSunrise = hourAngle(-0.833);
  const sunriseHours = hSunrise !== null ? solarNoon - hSunrise / 15 : 5.75;

  // Dzuhur (Solar noon + 2 min ihtiyat)
  const dzuhurHours = solarNoon + 2 / 60;

  // Ashar (Shafi'i shadow ratio k = 1)
  const asharAltRad = Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decl))));
  const hAshar = hourAngle((asharAltRad * 180) / Math.PI);
  const asharHours = hAshar !== null ? solarNoon + hAshar / 15 + 2 / 60 : 15.25;

  // Maghrib (Sunset -0.833° + 2 min ihtiyat)
  const maghribHours = hSunrise !== null ? solarNoon + hSunrise / 15 + 2 / 60 : 18.0;

  // Isya (Kemenag standard -18° + 2 min ihtiyat)
  const hIsya = hourAngle(-18);
  const isyaHours = hIsya !== null ? solarNoon + hIsya / 15 + 2 / 60 : 19.2;

  // Imsak: Subuh - 10 minutes
  const imsakHours = subuhHours - 10 / 60;

  const formatHours = (h: number) => {
    const normalized = (h + 24) % 24;
    const hrs = Math.floor(normalized);
    const mins = Math.round((normalized - hrs) * 60) % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  // Format Arabic/Latin localized calendar date
  const localeTag = "id-ID";
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateStr = date.toLocaleDateString(localeTag, options);

  return {
    imsak: formatHours(imsakHours),
    subuh: formatHours(subuhHours),
    syuruq: formatHours(sunriseHours),
    dzuhur: formatHours(dzuhurHours),
    ashar: formatHours(asharHours),
    maghrib: formatHours(maghribHours),
    isya: formatHours(isyaHours),
    dateStr,
  };
}

export interface QuadrantOffsetInfo {
  angle: number;
  shortLabel: string;
  description: string;
}

/**
 * Menghitung penyimpangan sudut kiblat sesuai kuadran kompas sebenarnya (N/E/S/W)
 */
export function formatQiblaQuadrant(
  bearing: number,
  distanceKm: number,
  locale: string = "id"
): QuadrantOffsetInfo {
  const b = ((bearing % 360) + 360) % 360;
  if (distanceKm < 2) {
    return {
      angle: 0,
      shortLabel: locale === "ar" ? "الحرم المكي" : locale === "en" ? "Masjid al-Haram" : "Area Masjidil Haram",
      description:
        locale === "ar"
          ? "بجوار الكعبة، مكة"
          : locale === "en"
          ? "Near the Kaaba, Makkah"
          : "Di sekitar Ka'bah, Makkah",
    };
  }

  // Quad IV: West -> North (270..360, e.g. Indonesia 294.5°)
  if (b >= 270) {
    const deg = Math.round((b - 270) * 10) / 10;
    return {
      angle: deg,
      shortLabel: locale === "ar" ? `${deg}° ش.غ` : locale === "en" ? `${deg}° N of W` : `${deg}° U dari Barat`,
      description:
        locale === "ar"
          ? "شمالاً عن جهة الغرب"
          : locale === "en"
          ? "North of due west"
          : "Dari Barat ke arah Utara",
    };
  }
  // Quad III: South -> West (180..270)
  if (b >= 180) {
    const deg = Math.round((270 - b) * 10) / 10;
    return {
      angle: deg,
      shortLabel: locale === "ar" ? `${deg}° ج.غ` : locale === "en" ? `${deg}° S of W` : `${deg}° S dari Barat`,
      description:
        locale === "ar"
          ? "جنوباً عن جهة الغرب"
          : locale === "en"
          ? "South of due west"
          : "Dari Barat ke arah Selatan",
    };
  }
  // Quad II: East -> South (90..180)
  if (b >= 90) {
    const deg = Math.round((180 - b) * 10) / 10;
    return {
      angle: deg,
      shortLabel: locale === "ar" ? `${deg}° ج.ش` : locale === "en" ? `${deg}° E of S` : `${deg}° T dari Selatan`,
      description:
        locale === "ar"
          ? "شرقاً عن جهة الجنوب"
          : locale === "en"
          ? "East of due south"
          : "Dari Selatan ke arah Timur",
    };
  }
  // Quad I: North -> East (0..90)
  const deg = Math.round(b * 10) / 10;
  return {
    angle: deg,
    shortLabel: locale === "ar" ? `${deg}° ش.ش` : locale === "en" ? `${deg}° E of N` : `${deg}° T dari Utara`,
    description:
      locale === "ar"
        ? "شرقاً عن جهة الشمال"
        : locale === "en"
        ? "East of due north"
        : "Dari Utara ke arah Timur",
  };
}

export function formatTimezoneLabel(tzOffsetHours: number): string {
  if (tzOffsetHours === 7) return "WIB";
  if (tzOffsetHours === 8) return "WITA";
  if (tzOffsetHours === 9) return "WIT";
  if (tzOffsetHours === 3) return "AST";
  return `UTC${tzOffsetHours >= 0 ? `+${tzOffsetHours}` : tzOffsetHours}`;
}

export interface NextPrayerInfo {
  id: "subuh" | "dzuhur" | "ashar" | "maghrib" | "isya";
  name: string;
  arabicName: string;
  time: string;
  countdown: string; // e.g. "01:24:35"
  isImminent: boolean; // less than 15 minutes left
}

/**
 * Menentukan waktu sholat berikutnya dan waktu hitung mundur (countdown) sesuai zona waktu lokasi
 */
export function getNextPrayer(
  schedule: PrayerSchedule,
  now: Date = new Date(),
  targetTimezoneHours?: number
): NextPrayerInfo {
  const tzHours =
    typeof targetTimezoneHours === "number"
      ? targetTimezoneHours
      : -now.getTimezoneOffset() / 60;

  // Shift epoch by target timezone offset so UTC getters reflect wall-clock time at target location
  const targetClock = new Date(now.getTime() + tzHours * 3600000);
  const nowSecOfDay =
    targetClock.getUTCHours() * 3600 +
    targetClock.getUTCMinutes() * 60 +
    targetClock.getUTCSeconds();

  const parseToSec = (timeStr: string): number => {
    const parts = timeStr.split(":").map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    return parts[0] * 3600 + parts[1] * 60;
  };

  const prayers: Array<{
    id: NextPrayerInfo["id"];
    name: string;
    arabic: string;
    time: string;
    secOfDay: number;
  }> = [
    { id: "subuh", name: "Subuh", arabic: "الفجر", time: schedule.subuh, secOfDay: parseToSec(schedule.subuh) },
    { id: "dzuhur", name: "Dzuhur", arabic: "الظهر", time: schedule.dzuhur, secOfDay: parseToSec(schedule.dzuhur) },
    { id: "ashar", name: "Ashar", arabic: "العصر", time: schedule.ashar, secOfDay: parseToSec(schedule.ashar) },
    { id: "maghrib", name: "Maghrib", arabic: "المغرب", time: schedule.maghrib, secOfDay: parseToSec(schedule.maghrib) },
    { id: "isya", name: "Isya", arabic: "العشاء", time: schedule.isya, secOfDay: parseToSec(schedule.isya) },
  ];

  let next = prayers.find((p) => p.secOfDay > nowSecOfDay);
  let diffSec = 0;

  if (next) {
    diffSec = Math.max(0, next.secOfDay - nowSecOfDay);
  } else {
    next = prayers[0];
    diffSec = Math.max(0, 86400 - nowSecOfDay + next.secOfDay);
  }

  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;

  const countdown = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isImminent = diffSec <= 900; // <= 15 minutes

  return {
    id: next.id,
    name: next.name,
    arabicName: next.arabic,
    time: next.time,
    countdown,
    isImminent,
  };
}

export interface CardinalDirection {
  code: string;
  name: string;
}

export function getCompassDirection(deg: number, locale: string = "id"): CardinalDirection {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;

  const namesId = [
    { code: "U", name: "Utara" },
    { code: "TL", name: "Timur Laut" },
    { code: "T", name: "Timur" },
    { code: "TG", name: "Tenggara" },
    { code: "S", name: "Selatan" },
    { code: "BD", name: "Barat Daya" },
    { code: "B", name: "Barat" },
    { code: "BL", name: "Barat Laut" },
  ];

  const namesEn = [
    { code: "N", name: "North" },
    { code: "NE", name: "North East" },
    { code: "E", name: "East" },
    { code: "SE", name: "South East" },
    { code: "S", name: "South" },
    { code: "SW", name: "South West" },
    { code: "W", name: "West" },
    { code: "NW", name: "North West" },
  ];

  const namesAr = [
    { code: "ش", name: "الشمال" },
    { code: "ش.ق", name: "الشمال الشرقي" },
    { code: "ق", name: "الشرق" },
    { code: "ج.ق", name: "الجنوب الشرقي" },
    { code: "ج", name: "الجنوب" },
    { code: "ج.غ", name: "الجنوب الغربي" },
    { code: "غ", name: "الغرب" },
    { code: "ش.غ", name: "الشمال الغربي" },
  ];

  if (locale === "ar") return namesAr[index];
  if (locale === "en") return namesEn[index];
  return namesId[index];
}
