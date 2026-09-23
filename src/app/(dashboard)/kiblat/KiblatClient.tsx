"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  POPULAR_CITIES,
  CityPreset,
  calculateQibla,
  calculatePrayerTimes,
  getNextPrayer,
  PrayerSchedule,
  NextPrayerInfo,
} from "@/lib/prayerTimes";
import "./kiblat.css";

export default function KiblatClient() {
  const { t, locale } = useLanguage();
  // Default to Ponorogo (Almamater Arrisalah)
  const [selectedCity, setSelectedCity] = useState<CityPreset>(POPULAR_CITIES[1]);
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    timezone: number;
    isGps: boolean;
  }>({
    name: POPULAR_CITIES[1].name,
    lat: POPULAR_CITIES[1].lat,
    lng: POPULAR_CITIES[1].lng,
    timezone: POPULAR_CITIES[1].timezone,
    isGps: false,
  });

  const [heading, setHeading] = useState<number>(0);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [needsIosPermission, setNeedsIosPermission] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());
  const [isPlayingAdzan, setIsPlayingAdzan] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Qibla and Prayer calculations
  const qiblaInfo = calculateQibla(currentLocation.lat, currentLocation.lng);
  const prayerSchedule: PrayerSchedule = calculatePrayerTimes(
    currentLocation.lat,
    currentLocation.lng,
    currentLocation.timezone,
    now
  );
  const nextPrayer: NextPrayerInfo = getNextPrayer(prayerSchedule, now);

  // Alignment detection (within 4 degrees)
  const diffAngle = Math.abs(((heading - qiblaInfo.bearing + 540) % 360) - 180);
  const isAligned = diffAngle <= 4;
  const prevAlignedRef = useRef<boolean>(false);

  // Haptic feedback when locking onto Ka'bah
  useEffect(() => {
    if (isAligned && !prevAlignedRef.current) {
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate([30, 40, 60]);
      }
    }
    prevAlignedRef.current = isAligned;
  }, [isAligned]);

  // Live 1-second clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio setup
  useEffect(() => {
    const audio = new Audio("https://audio.qurancdn.com/Alafasy/mp3/001001.mp3");
    audio.onended = () => setIsPlayingAdzan(false);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleAdzanAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAdzan) {
      audioRef.current.pause();
      setIsPlayingAdzan(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAdzan(true))
        .catch((e) => console.log("Audio play notice:", e));
    }
  };

  // Device Orientation handling
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    let compassHeading: number | null = null;

    // iOS Safari
    if ((e as any).webkitCompassHeading !== undefined) {
      compassHeading = (e as any).webkitCompassHeading;
    } else if (e.alpha !== null) {
      // Android standard: alpha is counter-clockwise 0-360
      compassHeading = (360 - e.alpha) % 360;
    }

    if (compassHeading !== null && !isNaN(compassHeading)) {
      setHeading(Math.round(compassHeading));
      setIsSensorActive(true);
    }
  }, []);

  // Check iOS permission or activate sensor
  const activateCompassSensor = async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const res = await (DeviceOrientationEvent as any).requestPermission();
        if (res === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, true);
          setNeedsIosPermission(false);
          setIsSensorActive(true);
        }
      } catch (err) {
        console.warn("iOS orientation permission error:", err);
      }
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
      window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    }
  };

  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      setNeedsIosPermission(true);
    } else if (typeof window !== "undefined") {
      window.addEventListener("deviceorientation", handleOrientation, true);
      window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true);
        window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      }
    };
  }, [handleOrientation]);

  // GPS Geolocation Handler
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert(
        locale === "ar"
          ? "متصفحك لا يدعم تحديد الموقع عبر GPS."
          : locale === "en"
          ? "Your browser does not support GPS geolocation."
          : "Browser Anda tidak mendukung deteksi lokasi GPS."
      );
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({
          name: locale === "ar" ? "موقع GPS الخاص بك" : locale === "en" ? "Your GPS Location" : "Lokasi GPS Anda",
          lat: latitude,
          lng: longitude,
          timezone: 7, // default Indonesia WIB
          isGps: true,
        });
        setIsGpsLoading(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsGpsLoading(false);
        alert(
          locale === "ar"
            ? "تعذر الوصول إلى GPS. يرجى التأكد من تفعيل إذن الموقع."
            : locale === "en"
            ? "Unable to access GPS. Please ensure location permissions are enabled."
            : "Tidak dapat mengakses GPS. Pastikan izin lokasi telah diaktifkan."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // City Dropdown Change
  const handleCityChange = (cityName: string) => {
    const city = POPULAR_CITIES.find((c) => c.name === cityName);
    if (city) {
      setSelectedCity(city);
      setCurrentLocation({
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        timezone: city.timezone,
        isGps: false,
      });
    }
  };

  // Calculate relative rotation of needle inside rotating compass
  // Needle points towards Qibla relative to device heading:
  const needleRotation = (qiblaInfo.bearing - heading + 360) % 360;

  return (
    <div className="kiblat-page-wrapper">
      <div className="kiblat-bg-ambient"></div>

      <div className="kiblat-container">
        {/* Top Bar */}
        <div className="kiblat-nav-bar">
          <Link href="/fitur" className="btn-back">
            <i className="fa-solid fa-arrow-left"></i> {t.kiblat.back_to_features}
          </Link>
        </div>

        {/* Title & Badge */}
        <div className="kiblat-header-box">
          <div className="kiblat-badge-sup">
            <i className="fa-solid fa-compass"></i> {locale === "ar" ? "أداة الفلك والملاحة الإسلامية" : locale === "en" ? "Islamic Astronomical Instrument" : "Instrumen Astronomi Islam"}
          </div>
          <h1 className="kiblat-title">{t.kiblat.title}</h1>
          <p className="kiblat-subtitle">
            {t.kiblat.subtitle}
          </p>
        </div>

        {/* Location Selector Bar */}
        <div className="kiblat-location-bar">
          <div className="location-current-info">
            <div className="location-icon-badge">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div className="location-text">
              <h4>{currentLocation.isGps ? t.kiblat.gps_my_loc : currentLocation.name}</h4>
              <p>
                {currentLocation.lat.toFixed(4)}° S, {currentLocation.lng.toFixed(4)}° E • UTC+{currentLocation.timezone}
              </p>
            </div>
          </div>

          <div className="location-controls">
            <select
              className="city-select"
              value={currentLocation.isGps ? "" : selectedCity.name}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              {currentLocation.isGps && <option value="">📍 {t.kiblat.gps_my_loc}</option>}
              {POPULAR_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.region})
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn-gps"
              onClick={handleDetectGps}
              disabled={isGpsLoading}
            >
              <i className={`fa-solid ${isGpsLoading ? "fa-spinner fa-spin" : "fa-crosshairs"}`}></i>
              {isGpsLoading ? t.kiblat.gps_detecting : t.kiblat.gps_detect}
            </button>
          </div>
        </div>

        {/* =========================================================================
            ASTROLABE COMPASS STAGE
            ========================================================================= */}
        <div className="astrolabe-stage">
          {/* Outer Rim */}
          <div className={`astrolabe-rim ${isAligned ? "aligned" : ""}`}>
            {/* Concentric Islamic geometric rings */}
            <div className="astrolabe-ring-pattern"></div>

            {/* Fixed Cardinal Marks */}
            <span className="astrolabe-cardinal cardinal-n">{locale === "ar" ? "ش" : locale === "en" ? "N" : "U"}</span>
            <span className="astrolabe-cardinal cardinal-e">{locale === "ar" ? "ق" : locale === "en" ? "E" : "T"}</span>
            <span className="astrolabe-cardinal cardinal-s">{locale === "ar" ? "ج" : locale === "en" ? "S" : "S"}</span>
            <span className="astrolabe-cardinal cardinal-w">{locale === "ar" ? "غ" : locale === "en" ? "W" : "B"}</span>

            {/* Center Core Pin */}
            <div className="astrolabe-center-core">
              <i className="fa-solid fa-star-and-crescent"></i>
            </div>

            {/* Rotating Needle pointing towards Qibla */}
            <div
              className="astrolabe-rotating-dial"
              style={{
                transform: `rotate(${needleRotation}deg)`,
              }}
            >
              <div className="qibla-marker-arrow">
                <i className="fa-solid fa-kaaba qibla-kaaba-icon"></i>
                <span className="qibla-tag">{locale === "ar" ? "القبلة" : locale === "en" ? "Qibla" : "Kiblat"}</span>
              </div>
              <div className="astrolabe-needle-line"></div>
            </div>
          </div>

          {/* Alignment Lock Pill */}
          <div className={`kiblat-aligned-badge ${isAligned ? "locked" : "searching"}`}>
            {isAligned ? (
              <>
                <i className="fa-solid fa-circle-check"></i>
                {t.kiblat.aligned_success}
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrows-spin"></i>
                {t.kiblat.rotate_hint} ({Math.round(diffAngle)}° {locale === "ar" ? "متبقية" : locale === "en" ? "remaining" : "lagi"})
              </>
            )}
          </div>

          {/* Readout Numbers */}
          <div className="kiblat-readout-row">
            <div className="kiblat-readout-box">
              <div className="kiblat-readout-val">{qiblaInfo.bearing}°</div>
              <div className="kiblat-readout-lbl">{t.kiblat.bearing_label}</div>
            </div>
            <div className="kiblat-readout-box">
              <div className="kiblat-readout-val">{heading}°</div>
              <div className="kiblat-readout-lbl">{t.kiblat.phone_heading_label}</div>
            </div>
            <div className="kiblat-readout-box">
              <div className="kiblat-readout-val">
                {qiblaInfo.distanceKm.toLocaleString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID")} <small style={{ fontSize: "0.8rem" }}>KM</small>
              </div>
              <div className="kiblat-readout-lbl">{t.kiblat.distance_to_makkah}</div>
            </div>
          </div>

          {/* iOS Sensor Permission CTA */}
          {needsIosPermission && !isSensorActive && (
            <button
              type="button"
              className="btn-gps"
              onClick={activateCompassSensor}
              style={{ padding: "10px 24px", fontSize: "0.85rem", marginTop: "10px" }}
            >
              <i className="fa-solid fa-mobile-screen"></i> {t.kiblat.activate_sensor_btn}
            </button>
          )}

          {/* Manual Simulation Slider for Laptop / Desktop Without Sensor */}
          <div className="kiblat-sim-box">
            <label>
              <i className="fa-solid fa-sliders"></i> {t.kiblat.sim_slider_label}: <strong>{heading}°</strong>
            </label>
            <input
              type="range"
              min="0"
              max="359"
              value={heading}
              onChange={(e) => {
                setHeading(Number(e.target.value));
                setIsSensorActive(false);
              }}
              className="kiblat-slider"
            />
          </div>
        </div>

        {/* =========================================================================
            PRAYER SCHEDULE & LIVE COUNTDOWN
            ========================================================================= */}
        <div className="prayer-section">
          {/* Header */}
          <div className="prayer-header-row">
            <div>
              <h2 className="prayer-section-title">{t.kiblat.prayer_schedule_title}</h2>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {prayerSchedule.dateStr} • {t.kiblat.standard_kemenag}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleAdzanAudio}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "30px",
                background: isPlayingAdzan ? "rgba(212, 175, 55, 0.22)" : "rgba(255, 255, 255, 0.06)",
                border: isPlayingAdzan ? "1px solid var(--gold-main)" : "1px solid rgba(255, 255, 255, 0.15)",
                color: isPlayingAdzan ? "var(--gold-main)" : "var(--text-primary)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <i className={`fa-solid ${isPlayingAdzan ? "fa-volume-high" : "fa-bell"}`}></i>
              <span>{isPlayingAdzan ? t.kiblat.pause_adzan : t.kiblat.play_adzan}</span>
            </button>
          </div>

          {/* Live Next Prayer Countdown Banner */}
          <div className="next-prayer-banner">
            <div className="next-prayer-info">
              <span className="next-prayer-lbl">{t.kiblat.countdown_towards}</span>
              <div className="next-prayer-name">
                {nextPrayer.name} <small>({nextPrayer.time} WIB)</small>
              </div>
            </div>

            <div className="next-prayer-timer">
              <span className="next-prayer-lbl">{t.kiblat.in_time}</span>
              <div className="timer-countdown">{nextPrayer.countdown}</div>
            </div>
          </div>

          {/* 6 Prayer Times Cards Grid */}
          <div className="prayer-cards-grid">
            {[
              { id: "imsak", name: locale === "ar" ? "الإمساك" : "Imsak", arabic: "الإمساك", time: prayerSchedule.imsak },
              { id: "subuh", name: t.kiblat.prayer_subuh, arabic: "الفجر", time: prayerSchedule.subuh },
              { id: "syuruq", name: t.kiblat.prayer_terbit, arabic: "الشروق", time: prayerSchedule.syuruq },
              { id: "dzuhur", name: t.kiblat.prayer_dzuhur, arabic: "الظهر", time: prayerSchedule.dzuhur },
              { id: "ashar", name: t.kiblat.prayer_ashar, arabic: "العصر", time: prayerSchedule.ashar },
              { id: "maghrib", name: t.kiblat.prayer_maghrib, arabic: "المغرب", time: prayerSchedule.maghrib },
              { id: "isya", name: t.kiblat.prayer_isya, arabic: "العشاء", time: prayerSchedule.isya },
            ].map((p) => {
              const isActive = nextPrayer.name.toLowerCase() === p.id.toLowerCase();
              return (
                <div
                  key={p.id}
                  className={`prayer-card ${isActive ? "is-active-prayer" : ""}`}
                >
                  {isActive && <div className="prayer-active-pill" title={locale === "ar" ? "الوقت القادم" : locale === "en" ? "Upcoming prayer" : "Menuju waktu ini"}></div>}
                  <div className="prayer-card-arabic">{p.arabic}</div>
                  <div className="prayer-card-name">{p.name}</div>
                  <div className="prayer-card-time">{p.time}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
