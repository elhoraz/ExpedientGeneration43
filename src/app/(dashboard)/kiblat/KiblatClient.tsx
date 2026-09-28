"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  POPULAR_CITIES,
  CityPreset,
  calculateQibla,
  calculatePrayerTimes,
  getNextPrayer,
  getCompassDirection,
  PrayerSchedule,
  NextPrayerInfo,
} from "@/lib/prayerTimes";
import "./kiblat.css";

// 12 Degree mark labels every 30 deg
const DEGREE_LABELS = [
  { deg: 0, text: "0°" },
  { deg: 30, text: "30°" },
  { deg: 60, text: "60°" },
  { deg: 90, text: "90°" },
  { deg: 120, text: "120°" },
  { deg: 150, text: "150°" },
  { deg: 180, text: "180°" },
  { deg: 210, text: "210°" },
  { deg: 240, text: "240°" },
  { deg: 270, text: "270°" },
  { deg: 300, text: "300°" },
  { deg: 330, text: "330°" },
];

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
  const [continuousHeading, setContinuousHeading] = useState<number>(0);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [needsIosPermission, setNeedsIosPermission] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());
  const [isPlayingAdzan, setIsPlayingAdzan] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Qibla and Prayer calculations
  const qiblaInfo = calculateQibla(currentLocation.lat, currentLocation.lng);
  const prayerSchedule: PrayerSchedule = calculatePrayerTimes(
    currentLocation.lat,
    currentLocation.lng,
    currentLocation.timezone,
    now
  );
  const nextPrayer: NextPrayerInfo = getNextPrayer(prayerSchedule, now);

  // Direction info for device heading
  const currentDirection = getCompassDirection(heading, locale);

  // Shortest angular turn difference from current heading to target Qibla bearing:
  // Value between -180 and +180:
  // Positive means user should turn RIGHT (Clockwise)
  // Negative means user should turn LEFT (Counter-Clockwise)
  const turnDiff = ((qiblaInfo.bearing - heading + 540) % 360) - 180;
  const absTurnDiff = Math.abs(Math.round(turnDiff));
  const isAligned = absTurnDiff <= 3;
  const prevAlignedRef = useRef<boolean>(false);

  // Smooth continuous heading updater (prevents 360° flip glitch)
  const updateHeading = useCallback((newHeading: number) => {
    const normalized = ((newHeading % 360) + 360) % 360;
    setHeading(Math.round(normalized));

    setContinuousHeading((prev) => {
      // Find shortest delta from prev
      let delta = (normalized - (prev % 360) + 540) % 360 - 180;
      return prev + delta;
    });
  }, []);

  // Haptic feedback when locking onto Ka'bah
  useEffect(() => {
    if (isAligned && !prevAlignedRef.current) {
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate([35, 45, 75]);
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

  // Orientation Event Handler
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    let compass: number | null = null;

    // 1. iOS Safari (native tilt-compensated webkitCompassHeading)
    if ((e as any).webkitCompassHeading !== undefined) {
      compass = (e as any).webkitCompassHeading;
    }
    // 2. Android deviceorientationabsolute or standard absolute
    else if (e.alpha !== null) {
      // If relative orientation event and absolute exists, ignore relative
      if (e.absolute === false && typeof window !== "undefined" && "ondeviceorientationabsolute" in window) {
        return;
      }

      // Android Euler tilt compensation
      if (e.beta !== null && e.gamma !== null) {
        const degToRad = Math.PI / 180;
        const x = e.beta * degToRad; // pitch
        const y = e.gamma * degToRad; // roll
        const z = e.alpha * degToRad; // yaw

        const cX = Math.cos(x);
        const cY = Math.cos(y);
        const cZ = Math.cos(z);
        const sX = Math.sin(x);
        const sY = Math.sin(y);
        const sZ = Math.sin(z);

        // Vector representing device top axis
        const vX = -cZ * sY - sZ * sX * cY;
        const vY = -sZ * sY + cZ * sX * cY;

        let headingRad = Math.atan2(vX, vY);
        if (headingRad < 0) headingRad += 2 * Math.PI;
        compass = headingRad * (180 / Math.PI);
      } else {
        compass = (360 - e.alpha) % 360;
      }
    }

    if (compass !== null && !isNaN(compass)) {
      updateHeading(compass);
      setIsSensorActive(true);
    }
  }, [updateHeading]);

  // Activate Sensor (required user gesture on iOS Safari)
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
    } else if (typeof window !== "undefined") {
      const win = window as any;
      if ("ondeviceorientationabsolute" in win) {
        win.addEventListener("deviceorientationabsolute", handleOrientation, true);
      } else {
        win.addEventListener("deviceorientation", handleOrientation, true);
      }
      setIsSensorActive(true);
    }
  };

  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      setNeedsIosPermission(true);
    } else if (typeof window !== "undefined") {
      const win = window as any;
      if ("ondeviceorientationabsolute" in win) {
        win.addEventListener("deviceorientationabsolute", handleOrientation, true);
      } else {
        win.addEventListener("deviceorientation", handleOrientation, true);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        const win = window as any;
        win.removeEventListener("deviceorientationabsolute", handleOrientation, true);
        win.removeEventListener("deviceorientation", handleOrientation, true);
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
        // Detect accurate timezone offset in hours
        const tzOffset = Math.round(-new Date().getTimezoneOffset() / 60);
        setCurrentLocation({
          name: locale === "ar" ? "موقع GPS الخاص بك" : locale === "en" ? "Your GPS Location" : "Lokasi GPS Anda",
          lat: latitude,
          lng: longitude,
          timezone: tzOffset || 7,
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

  // Interactive Drag-to-Rotate for Desktop & Touch
  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    // Angle clockwise from top (12 o'clock)
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    updateHeading(angle);
  }, [updateHeading]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsSensorActive(false);
    updateFromPointer(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      updateFromPointer(e.clientX, e.clientY);
    };
    const onUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, updateFromPointer]);

  // Cardinal points data on the rotating dial
  const cardinalPoints = [
    { deg: 0, code: locale === "ar" ? "ش" : locale === "en" ? "N" : "U", isPrimary: true, isNorth: true },
    { deg: 45, code: locale === "ar" ? "ش.ق" : locale === "en" ? "NE" : "TL", isPrimary: false },
    { deg: 90, code: locale === "ar" ? "ق" : locale === "en" ? "E" : "T", isPrimary: true },
    { deg: 135, code: locale === "ar" ? "ج.ق" : locale === "en" ? "SE" : "TG", isPrimary: false },
    { deg: 180, code: locale === "ar" ? "ج" : locale === "en" ? "S" : "S", isPrimary: true },
    { deg: 225, code: locale === "ar" ? "ج.غ" : locale === "en" ? "SW" : "BD", isPrimary: false },
    { deg: 270, code: locale === "ar" ? "غ" : locale === "en" ? "W" : "B", isPrimary: true },
    { deg: 315, code: locale === "ar" ? "ش.غ" : locale === "en" ? "NW" : "BL", isPrimary: false },
  ];

  return (
    <div className="kiblat-page-wrapper">
      <div className="kiblat-bg-ambient"></div>

      <div className="kiblat-container">
        {/* Title & Badge */}
        <div className="kiblat-header-box">
          <div className="kiblat-badge-sup">
            <i className="fa-solid fa-compass"></i>{" "}
            {locale === "ar"
              ? "أداة الفلك والملاحة الإسلامية"
              : locale === "en"
              ? "Islamic Astronomical Instrument"
              : "Instrumen Astronomi Islam"}
          </div>
          <h1 className="kiblat-title">{t.kiblat.title}</h1>
          <p className="kiblat-subtitle">{t.kiblat.subtitle}</p>
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
                {currentLocation.lat.toFixed(4)}° S, {currentLocation.lng.toFixed(4)}° E • UTC+
                {currentLocation.timezone}
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
          {/* Bezel housing Forward Lubber Line and Compass */}
          <div
            className="astrolabe-bezel"
            ref={stageRef}
            onPointerDown={handlePointerDown}
            title={
              locale === "ar"
                ? "اسحب لتدوير البوصلة يدوياً"
                : locale === "en"
                ? "Drag to rotate compass manually"
                : "Klik & geser untuk memutar kompas manual"
            }
          >
            {/* Top Lubber Line / Forward Heading Hub (Device Axis) */}
            <div className="astrolabe-lubber-container">
              <div className={`lubber-hud-badge ${isAligned ? "aligned" : ""}`}>
                <span className="hud-deg">{Math.round(heading)}°</span>
                <span className="hud-dir">
                  {currentDirection.code} • {currentDirection.name}
                </span>
              </div>
              <div className={`lubber-pointer-triangle ${isAligned ? "aligned" : ""}`}></div>
            </div>

            {/* The Golden Astrolabe Outer Rim */}
            <div className={`astrolabe-rim ${isAligned ? "aligned" : ""}`}>
              {/* Rotating Astrolabe Rose Plate (Rotates by -continuousHeading) */}
              <div
                className={`astrolabe-dial-plate ${isDragging ? "no-transition" : ""}`}
                style={{
                  transform: `rotate(${-continuousHeading}deg)`,
                }}
              >
                {/* Concentric Islamic geometric rings */}
                <div className="astrolabe-ring-pattern"></div>

                {/* Degree tick markers around perimeter */}
                {DEGREE_LABELS.map((d) => (
                  <span
                    key={d.deg}
                    className="degree-tick-label"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${d.deg}deg) translateY(-145px) rotate(${-d.deg}deg)`,
                    }}
                  >
                    {d.text}
                  </span>
                ))}

                {/* 8 Cardinal & Intercardinal Points on Rotating Dial */}
                {cardinalPoints.map((pt) => (
                  <span
                    key={pt.deg}
                    className={`cardinal-point ${pt.isNorth ? "pt-n" : ""} ${!pt.isPrimary ? "pt-sub" : ""}`}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${pt.deg}deg) translateY(-120px) rotate(${-pt.deg}deg)`,
                    }}
                  >
                    {pt.code}
                  </span>
                ))}

                {/* Rotating Qibla Pointer attached to the dial plate at qiblaInfo.bearing */}
                <div
                  className="astrolabe-qibla-pointer"
                  style={{
                    transform: `rotate(${qiblaInfo.bearing}deg)`,
                  }}
                >
                  <div className="qibla-ray-line"></div>
                  <div className="qibla-target-head">
                    <i className="fa-solid fa-kaaba qibla-kaaba-icon"></i>
                    <div className="qibla-tag-pill">
                      <span>{locale === "ar" ? "القبلة" : locale === "en" ? "Qibla" : "Kiblat"}</span>
                      <strong>{qiblaInfo.bearing}°</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Core Brass Pin with Star and Crescent */}
              <div className="astrolabe-center-core">
                <i className="fa-solid fa-star-and-crescent"></i>
              </div>
            </div>
          </div>

          {/* Alignment Status Banner with Dynamic Left/Right turn directions */}
          <div className={`kiblat-aligned-badge ${isAligned ? "locked" : "searching"}`}>
            {isAligned ? (
              <>
                <i className="fa-solid fa-circle-check" style={{ color: "#2bb97c" }}></i>
                <span>
                  {t.kiblat.aligned_success} ({qiblaInfo.bearing}° {currentDirection.name})
                </span>
              </>
            ) : turnDiff > 0 ? (
              <>
                <i className="fa-solid fa-arrow-rotate-right turn-icon-pulse"></i>
                <span>
                  {t.kiblat.turn_right} <strong>{absTurnDiff}°</strong> {t.kiblat.turn_degrees}
                </span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-rotate-left turn-icon-pulse"></i>
                <span>
                  {t.kiblat.turn_left} <strong>{absTurnDiff}°</strong> {t.kiblat.turn_degrees}
                </span>
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
                {qiblaInfo.distanceKm.toLocaleString(
                  locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID"
                )}{" "}
                <small style={{ fontSize: "0.8rem" }}>KM</small>
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
              style={{
                padding: "12px 28px",
                fontSize: "0.9rem",
                marginTop: "6px",
                boxShadow: "0 0 20px rgba(43, 185, 124, 0.3)",
              }}
            >
              <i className="fa-solid fa-mobile-screen"></i> {t.kiblat.activate_sensor_btn}
            </button>
          )}

          {/* Desktop Simulation & Calibration Controls */}
          <div className="desktop-sim-controls">
            <div className="desktop-sim-header">
              <span>
                <i className="fa-solid fa-sliders"></i> {t.kiblat.sim_slider_label}
              </span>
              <strong style={{ color: "var(--gold-main)" }}>{heading}°</strong>
            </div>

            <input
              type="range"
              min="0"
              max="359"
              value={heading}
              onChange={(e) => {
                setIsSensorActive(false);
                updateHeading(Number(e.target.value));
              }}
              className="kiblat-slider"
            />

            <div className="desktop-presets-row">
              <button
                type="button"
                className={`btn-preset-snap ${isAligned ? "active" : ""}`}
                onClick={() => {
                  setIsSensorActive(false);
                  updateHeading(qiblaInfo.bearing);
                }}
              >
                <i className="fa-solid fa-kaaba"></i> {t.kiblat.snap_qibla} ({qiblaInfo.bearing}°)
              </button>

              <button
                type="button"
                className="btn-preset-snap"
                onClick={() => {
                  setIsSensorActive(false);
                  updateHeading(0);
                }}
              >
                <i className="fa-solid fa-arrow-up"></i> {t.kiblat.snap_north}
              </button>

              <button
                type="button"
                className="btn-preset-snap"
                onClick={() => {
                  setIsSensorActive(false);
                  updateHeading(270);
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>{" "}
                {locale === "ar" ? "الغرب (٢٧٠°)" : locale === "en" ? "West (270°)" : "Barat (270°)"}
              </button>

              <button
                type="button"
                className="btn-preset-snap"
                onClick={() => {
                  setIsSensorActive(false);
                  updateHeading(90);
                }}
              >
                <i className="fa-solid fa-arrow-right"></i>{" "}
                {locale === "ar" ? "الشرق (٩٠°)" : locale === "en" ? "East (90°)" : "Timur (90°)"}
              </button>
            </div>

            <p className="desktop-notice-pill">
              <i className="fa-solid fa-circle-info"></i> {t.kiblat.desktop_mode_note}
            </p>
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
              {
                id: "imsak",
                name: locale === "ar" ? "الإمساك" : "Imsak",
                arabic: "الإمساك",
                time: prayerSchedule.imsak,
              },
              { id: "subuh", name: t.kiblat.prayer_subuh, arabic: "الفجر", time: prayerSchedule.subuh },
              { id: "syuruq", name: t.kiblat.prayer_terbit, arabic: "الشروق", time: prayerSchedule.syuruq },
              { id: "dzuhur", name: t.kiblat.prayer_dzuhur, arabic: "الظهر", time: prayerSchedule.dzuhur },
              { id: "ashar", name: t.kiblat.prayer_ashar, arabic: "العصر", time: prayerSchedule.ashar },
              { id: "maghrib", name: t.kiblat.prayer_maghrib, arabic: "المغرب", time: prayerSchedule.maghrib },
              { id: "isya", name: t.kiblat.prayer_isya, arabic: "العشاء", time: prayerSchedule.isya },
            ].map((p) => {
              const isActive = nextPrayer.name.toLowerCase() === p.id.toLowerCase();
              return (
                <div key={p.id} className={`prayer-card ${isActive ? "is-active-prayer" : ""}`}>
                  {isActive && (
                    <div
                      className="prayer-active-pill"
                      title={
                        locale === "ar"
                          ? "الوقت القادم"
                          : locale === "en"
                          ? "Upcoming prayer"
                          : "Menuju waktu ini"
                      }
                    ></div>
                  )}
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
