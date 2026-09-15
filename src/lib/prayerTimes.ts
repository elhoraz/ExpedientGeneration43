// src/lib/prayerTimes.ts
// Perhitungan Astronomis Waktu Sholat & Arah Kiblat (Metode Kemenag RI & Spherical Trigonometry)
// Expedient Generation 43

export interface CityPreset {
  name: string;
  lat: number;
  lng: number;
  timezone: number; // UTC offset in hours, e.g. 7 for WIB, 8 for WITA, 9 for WIT
  region: string;
}

export const POPULAR_CITIES: CityPreset[] = [
  { name: "Jakarta", lat: -6.2088, lng: 106.8456, timezone: 7, region: "DKI Jakarta (WIB)" },
  { name: "Ponorogo (Arrisalah)", lat: -7.8671, lng: 111.4647, timezone: 7, region: "Jawa Timur (WIB)" },
  { name: "Surabaya", lat: -7.2575, lng: 112.7521, timezone: 7, region: "Jawa Timur (WIB)" },
  { name: "Bandung", lat: -6.9175, lng: 107.6191, timezone: 7, region: "Jawa Barat (WIB)" },
  { name: "Yogyakarta", lat: -7.7956, lng: 110.3695, timezone: 7, region: "D.I. Yogyakarta (WIB)" },
  { name: "Semarang", lat: -6.9667, lng: 110.4167, timezone: 7, region: "Jawa Tengah (WIB)" },
  { name: "Medan", lat: 3.5952, lng: 98.6722, timezone: 7, region: "Sumatera Utara (WIB)" },
  { name: "Padang", lat: -0.9471, lng: 100.4172, timezone: 7, region: "Sumatera Barat (WIB)" },
  { name: "Makassar", lat: -5.1477, lng: 119.4327, timezone: 8, region: "Sulawesi Selatan (WITA)" },
  { name: "Banjarmasin", lat: -3.3194, lng: 114.5908, timezone: 8, region: "Kalimantan Selatan (WITA)" },
  { name: "Denpasar", lat: -8.6705, lng: 115.2126, timezone: 8, region: "Bali (WITA)" },
  { name: "Mekkah Al-Mukarramah", lat: 21.4225, lng: 39.8262, timezone: 3, region: "Arab Saudi (AST)" },
  { name: "Madinah Al-Munawwarah", lat: 24.5247, lng: 39.5692, timezone: 3, region: "Arab Saudi (AST)" },
];

export interface QiblaInfo {
  bearing: number; // 0 - 360 deg clockwise from True North
  distanceKm: number;
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

  return {
    bearing: Math.round(q * 10) / 10,
    distanceKm,
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

  // Subuh (Kemenag standard -20°)
  const hSubuh = hourAngle(-20);
  const subuhHours = hSubuh !== null ? solarNoon - hSubuh / 15 : 4.5;

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
    const mins = Math.floor((normalized - hrs) * 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateStr = date.toLocaleDateString("id-ID", options);

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

export interface NextPrayerInfo {
  name: string;
  arabicName: string;
  time: string;
  countdown: string; // e.g. "01:24:35"
  isImminent: boolean; // less than 15 minutes left
}

/**
 * Menentukan waktu sholat berikutnya dan waktu hitung mundur (countdown)
 */
export function getNextPrayer(schedule: PrayerSchedule, now: Date = new Date()): NextPrayerInfo {
  const parseTime = (timeStr: string): Date => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const prayers = [
    { name: "Subuh", arabic: "الفجر", time: schedule.subuh, date: parseTime(schedule.subuh) },
    { name: "Dzuhur", arabic: "الظهر", time: schedule.dzuhur, date: parseTime(schedule.dzuhur) },
    { name: "Ashar", arabic: "العصر", time: schedule.ashar, date: parseTime(schedule.ashar) },
    { name: "Maghrib", arabic: "المغرب", time: schedule.maghrib, date: parseTime(schedule.maghrib) },
    { name: "Isya", arabic: "العشاء", time: schedule.isya, date: parseTime(schedule.isya) },
  ];

  let next = prayers.find((p) => p.date.getTime() > now.getTime());

  if (!next) {
    // If all prayers today have passed, next is tomorrow's Subuh
    const tomorrowSubuh = parseTime(schedule.subuh);
    tomorrowSubuh.setDate(tomorrowSubuh.getDate() + 1);
    next = {
      name: "Subuh",
      arabic: "الفجر",
      time: schedule.subuh,
      date: tomorrowSubuh,
    };
  }

  const diffMs = Math.max(0, next.date.getTime() - now.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;

  const countdown = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isImminent = diffSec <= 900; // <= 15 minutes

  return {
    name: next.name,
    arabicName: next.arabic,
    time: next.time,
    countdown,
    isImminent,
  };
}
