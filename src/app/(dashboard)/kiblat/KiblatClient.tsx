"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
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

// Dynamic import for Leaflet Qibla Map to prevent SSR errors
const QiblaMap = dynamic(() => import("./QiblaMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "360px",
        borderRadius: "14px",
        background: "rgba(12, 18, 30, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--gold-main)",
        gap: "10px",
      }}
    >
      <i className="fa-solid fa-spinner fa-spin"></i> Memuat Peta Satelit Presisi...
    </div>
  ),
});

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
  const defaultCity = POPULAR_CITIES[1];
  const initialQibla = calculateQibla(defaultCity.lat, defaultCity.lng);

  const [selectedCity, setSelectedCity] = useState<CityPreset>(defaultCity);
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    timezone: number;
    isGps: boolean;
  }>({
    name: defaultCity.name,
    lat: defaultCity.lat,
    lng: defaultCity.lng,
    timezone: defaultCity.timezone,
    isGps: false,
  });

  // Device Mode: "desktop" (Auto-aligned & manual drag) vs "mobile" (Real-time physical sensors)
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");

  // Automatically start locked directly onto Ka'bah for Desktop / default view!
  const [heading, setHeading] = useState<number>(initialQibla.bearing);
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [continuousHeading, setContinuousHeading] = useState<number>(initialQibla.bearing);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [needsIosPermission, setNeedsIosPermission] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"compass" | "map">("compass");

  // Genuine Adzan Audio Player state
  const [adzanVersion, setAdzanVersion] = useState<"makkah" | "madinah">("makkah");
  const [isPlayingAdzan, setIsPlayingAdzan] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [showDoaAdzan, setShowDoaAdzan] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const startPointerAngleRef = useRef<number>(0);
  const startContinuousHeadingRef = useRef<number>(initialQibla.bearing);

  // Auto-detect mobile device on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth < 768 && window.matchMedia("(pointer: coarse)").matches);
    setDeviceMode(isMobile ? "mobile" : "desktop");
  }, []);

  // Qibla calculations (Bearing, Distance, Falak angles, DMS)
  const qiblaInfo = calculateQibla(currentLocation.lat, currentLocation.lng);
  const prayerSchedule: PrayerSchedule = calculatePrayerTimes(
    currentLocation.lat,
    currentLocation.lng,
    currentLocation.timezone,
    now
  );
  const nextPrayer: NextPrayerInfo = getNextPrayer(prayerSchedule, now);

  // Effective Heading taking into account any manual magnetic calibration offset
  const effectiveHeading = (heading + manualOffset + 360) % 360;

  // Direction info for device heading
  const currentDirection = getCompassDirection(effectiveHeading, locale);

  // Shortest angular turn difference from current heading to target Qibla bearing:
  // Positive means user should turn RIGHT (Clockwise)
  // Negative means user should turn LEFT (Counter-Clockwise)
  const turnDiff = ((qiblaInfo.bearing - effectiveHeading + 540) % 360) - 180;
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

  // Auto-align helper: snaps heading directly to accurate Qibla bearing
  const handleAutoAlignQibla = useCallback(() => {
    setIsSensorActive(false);
    updateHeading(qiblaInfo.bearing);
  }, [qiblaInfo.bearing, updateHeading]);

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

  // Setup authentic Adzan Audio (Makkah & Madinah) with local static asset and fallback
  const adzanSources: Record<string, string> = {
    makkah: "/assets/audio/adzan_makkah.mp3",
    madinah: "/assets/audio/adzan_madinah.mp3",
  };

  useEffect(() => {
    const audio = new Audio(adzanSources[adzanVersion]);
    audio.preload = "metadata";

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlayingAdzan(false);
      setAudioCurrentTime(0);
    };
    const onError = () => {
      console.warn("Local adzan playback error, switching to CDN fallback...");
      const fallbackUrl =
        adzanVersion === "makkah"
          ? "https://www.islamcan.com/audio/adhan/azan1.mp3"
          : "https://www.islamcan.com/audio/adhan/azan2.mp3";
      if (audio.src !== fallbackUrl) {
        audio.src = fallbackUrl;
      }
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [adzanVersion]);

  const toggleAdzanAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAdzan) {
      audioRef.current.pause();
      setIsPlayingAdzan(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAdzan(true))
        .catch((e) => {
          console.warn("Audio play prevented:", e);
          setIsPlayingAdzan(false);
        });
    }
  };

  const handleSeekAudio = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAdzan(false);
      setAudioCurrentTime(0);
    }
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec <= 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Robust Device Orientation Event Handler
  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      let compass: number | null = null;

      // 1. iOS Safari (native tilt-compensated webkitCompassHeading 0-360)
      if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
        compass = (e as any).webkitCompassHeading;
      }
      // 2. Android Chrome / Standard DeviceOrientation
      else if (e.alpha !== null && e.alpha !== undefined) {
        // Ignore non-absolute relative events if absolute is supported
        const win = typeof window !== "undefined" ? (window as any) : null;
        if (e.absolute === false && win && "ondeviceorientationabsolute" in win) {
          return;
        }

        // Standard azimuth: alpha is counter-clockwise rotation from North
        let calculatedHeading = (360 - e.alpha) % 360;

        // Apply tilt adjustment if device is pitched (beta) or rolled (gamma) in hand
        if (e.beta !== null && e.gamma !== null) {
          if (Math.abs(e.beta) > 5 || Math.abs(e.gamma) > 5) {
            let comp = -(e.alpha + (e.beta * e.gamma) / 90);
            comp -= Math.floor(comp / 360) * 360;
            calculatedHeading = comp;
          }
        }

        compass = (calculatedHeading + 360) % 360;
      }

      if (compass !== null && !isNaN(compass)) {
        updateHeading(compass);
        setIsSensorActive(true);
      }
    },
    [updateHeading]
  );

  // Activate Sensor (User gesture required on iOS Safari)
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
    if (typeof window === "undefined") return;

    let sensorInstance: any = null;

    // Check Generic Sensor API (AbsoluteOrientationSensor) on modern Android Chrome
    const win = window as any;
    if ("AbsoluteOrientationSensor" in win) {
      try {
        const sensor = new win.AbsoluteOrientationSensor({ frequency: 60 });
        sensor.addEventListener("reading", () => {
          const q = sensor.quaternion;
          if (q && q.length === 4) {
            const [x, y, z, w] = q;
            const siny_cosp = 2 * (w * z + x * y);
            const cosy_cosp = 1 - 2 * (y * y + z * z);
            let yaw = Math.atan2(siny_cosp, cosy_cosp) * (180 / Math.PI);
            yaw = (360 - yaw) % 360;
            updateHeading(yaw);
            setIsSensorActive(true);
          }
        });
        sensor.addEventListener("error", (err: any) => {
          console.log("AbsoluteOrientationSensor fallback to events:", err);
        });
        sensor.start();
        sensorInstance = sensor;
      } catch (e) {
        console.log("AbsoluteOrientationSensor initialization notice:", e);
      }
    }

    // Standard DOM Event listener setup
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      setNeedsIosPermission(true);
    } else {
      if ("ondeviceorientationabsolute" in win) {
        win.addEventListener("deviceorientationabsolute", handleOrientation, true);
      } else {
        win.addEventListener("deviceorientation", handleOrientation, true);
      }
    }

    return () => {
      if (sensorInstance) {
        try {
          sensorInstance.stop();
        } catch (_) {}
      }
      win.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      win.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation, updateHeading]);

  // High-accuracy GPS Geolocation Handler
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
        const tzOffset = Math.round(-new Date().getTimezoneOffset() / 60);
        setCurrentLocation({
          name: locale === "ar" ? "موقع GPS الخاص بك" : locale === "en" ? "Your GPS Location" : "Lokasi GPS Anda",
          lat: latitude,
          lng: longitude,
          timezone: tzOffset || 7,
          isGps: true,
        });
        setIsGpsLoading(false);

        // Auto-align compass to the GPS location's accurate Qibla bearing on desktop!
        if (!isSensorActive) {
          const newQibla = calculateQibla(latitude, longitude);
          updateHeading(newQibla.bearing);
        }
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
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // City Dropdown Change with automatic Qibla auto-alignment on Desktop
  const handleCityChange = (cityName: string) => {
    const city = POPULAR_CITIES.find((c) => c.name === cityName);
    if (city) {
      setSelectedCity(city);
      const newLoc = {
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        timezone: city.timezone,
        isGps: false,
      };
      setCurrentLocation(newLoc);

      // Auto-align compass directly to the chosen city's Qibla bearing if not driven by mobile hardware sensor!
      if (!isSensorActive) {
        const newQibla = calculateQibla(newLoc.lat, newLoc.lng);
        updateHeading(newQibla.bearing);
      }
    }
  };

  // Natural Drag-to-Rotate for Desktop (Drag Right = Turns Right, Drag Left = Turns Left)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!stageRef.current) return;
    setIsDragging(true);
    setIsSensorActive(false);

    const rect = stageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    startPointerAngleRef.current = angle;
    startContinuousHeadingRef.current = continuousHeading;
  };

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;

      let currentPointerAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
      if (currentPointerAngle < 0) currentPointerAngle += 360;

      // Delta of mouse movement clockwise:
      let delta = (currentPointerAngle - startPointerAngleRef.current + 540) % 360 - 180;

      // Because dial plate rotates by (-continuousHeading), to rotate the dial clockwise by delta,
      // continuousHeading must decrease by delta. This ensures 1:1 direct manipulation where the
      // compass turns in the EXACT same direction as the mouse drag!
      const newContinuous = startContinuousHeadingRef.current - delta;
      const normalized = ((newContinuous % 360) + 360) % 360;

      setHeading(Math.round(normalized));
      setContinuousHeading(newContinuous);
    },
    []
  );

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

        {/* Device Mode Switcher Bar: Mode Desktop vs Mode Mobile */}
        <div className="device-mode-switcher-bar">
          <div className="device-mode-pills">
            <button
              type="button"
              className={`device-mode-pill ${deviceMode === "desktop" ? "active" : ""}`}
              onClick={() => {
                setDeviceMode("desktop");
                setIsSensorActive(false);
              }}
            >
              <i className="fa-solid fa-desktop"></i>
              <span>{t.kiblat.mode_desktop}</span>
              <span className="mode-sub-tag">Auto-Lock</span>
            </button>
            <button
              type="button"
              className={`device-mode-pill ${deviceMode === "mobile" ? "active" : ""}`}
              onClick={() => {
                setDeviceMode("mobile");
                if (!isSensorActive) {
                  activateCompassSensor();
                }
              }}
            >
              <i className="fa-solid fa-mobile-screen-button"></i>
              <span>{t.kiblat.mode_mobile}</span>
              <span className="mode-sub-tag">Sensor Fisik</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher: Compass vs Satellite Map */}
        <div className="kiblat-view-tabs">
          <button
            type="button"
            className={`kiblat-tab-btn ${viewMode === "compass" ? "active" : ""}`}
            onClick={() => setViewMode("compass")}
          >
            <i className="fa-solid fa-compass"></i>
            <span>{locale === "ar" ? "بوصلة الأسطرلاب" : locale === "en" ? "Astrolabe Compass" : "Kompas Astrolabe"}</span>
          </button>
          <button
            type="button"
            className={`kiblat-tab-btn ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
          >
            <i className="fa-solid fa-satellite-dish"></i>
            <span>{locale === "ar" ? "خريطة الأقمار الصناعية" : locale === "en" ? "Satellite Qibla Map" : "Peta Garis Kiblat Satelit"}</span>
          </button>
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
            VIEW MODE 1: ASTROLABE COMPASS STAGE
            ========================================================================= */}
        {viewMode === "compass" && (
          <div className="astrolabe-stage">
            {/* 1. Mode Desktop Panel */}
            {deviceMode === "desktop" && (
              <div className="desktop-mode-panel animate-fade-in">
                <div className="desktop-mode-header">
                  <div className="desktop-mode-icon-circle">
                    <i className="fa-solid fa-desktop"></i>
                  </div>
                  <div className="desktop-mode-text">
                    <div className="desktop-mode-badge-title">
                      <strong>Mode Desktop (Auto-Aligned)</strong>
                      <span className="desktop-sensor-note">Sensor magnetik fisik tidak tersedia di PC/Laptop</span>
                    </div>
                    <p className="desktop-mode-desc">
                      Kompas otomatis diselaraskan secara akurat menghadap Ka&apos;bah (<strong>{qiblaInfo.bearing}° {currentDirection.name}</strong>). Anda dapat memutar kompas piringan 360° via drag mouse (kanan = kanan, kiri = kiri) atau menggunakan peta satelit.
                    </p>
                  </div>
                </div>

                <div className="desktop-auto-actions">
                  <button
                    type="button"
                    className={`btn-auto-align ${isAligned ? "is-locked" : ""}`}
                    onClick={handleAutoAlignQibla}
                  >
                    <i className={`fa-solid ${isAligned ? "fa-circle-check" : "fa-crosshairs"}`}></i>
                    <span>
                      {isAligned
                        ? `✓ Terkunci Tepat ke Arah Ka'bah (${qiblaInfo.bearing}° ${currentDirection.name})`
                        : `🎯 Kunci Otomatis ke Kiblat (${qiblaInfo.bearing}°)`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Mode Mobile Panel */}
            {deviceMode === "mobile" && (
              <div className="mobile-mode-panel animate-fade-in">
                <div className="mobile-sensor-status-card">
                  <div className="mobile-status-indicator">
                    <span className={`status-dot ${isSensorActive ? "active-pulse" : "idle"}`}></span>
                    <div className="status-label-group">
                      <strong>
                        {isSensorActive
                          ? "🟢 Sensor Kompas Ponsel Aktif (Real-Time)"
                          : "🔴 Sensor Belum Aktif / Perlu Izin"}
                      </strong>
                      <small>
                        {isSensorActive
                          ? "Kompas bergerak real-time mengikuti orientasi fisik perangkat Anda."
                          : "Ketuk tombol di samping untuk mengaktifkan sensor gerak ponsel Anda."}
                      </small>
                    </div>
                  </div>

                  {!isSensorActive && (
                    <button
                      type="button"
                      className="btn-activate-sensor"
                      onClick={activateCompassSensor}
                    >
                      <i className="fa-solid fa-compass"></i> Aktifkan Sensor HP
                    </button>
                  )}
                </div>

                <div className="mobile-guide-grid">
                  <div className="mobile-guide-item">
                    <i className="fa-solid fa-arrows-down-to-line"></i>
                    <div>
                      <strong>1. Pegang HP Mendatar</strong>
                      <p>Posisikan ponsel sejajar lantai agar jarum kompas tidak terdistorsi gravitasi.</p>
                    </div>
                  </div>
                  <div className="mobile-guide-item">
                    <i className="fa-solid fa-arrows-rotate"></i>
                    <div>
                      <strong>2. Putar Tubuh Anda</strong>
                      <p>Putar perlahan hingga jarum emas sejajar dengan puncak dan bergetar hijau.</p>
                    </div>
                  </div>
                  <div className="mobile-guide-item">
                    <i className="fa-solid fa-infinity"></i>
                    <div>
                      <strong>3. Kalibrasi Angka 8</strong>
                      <p>Ayunkan ponsel membentuk pola angka 8 (∞) di udara jika kompas melenceng.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bezel housing Forward Lubber Line and Compass */}
            <div
              className="astrolabe-bezel"
              ref={stageRef}
              onPointerDown={handlePointerDown}
              title={
                deviceMode === "desktop"
                  ? "Klik & geser mouse untuk memutar kompas"
                  : "Pegang ponsel mendatar sejajar lantai"
              }
            >
              {/* Top Lubber Line / Forward Heading Hub (Device Axis) */}
              <div className="astrolabe-lubber-container">
                <div className={`lubber-hud-badge ${isAligned ? "aligned" : ""}`}>
                  <span className="hud-deg">{Math.round(effectiveHeading)}°</span>
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
                    transform: `rotate(${-continuousHeading - manualOffset}deg)`,
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

            {/* Calibration & Magnetic Offset Adjustment Bar */}
            <div className="calibration-offset-bar">
              <span>
                <i className="fa-solid fa-magnet" style={{ color: "var(--gold-main)" }}></i> Kalibrasi Offset Magnetik:{" "}
                <strong>{manualOffset > 0 ? `+${manualOffset}` : manualOffset}°</strong>
              </span>
              <div className="calibration-buttons">
                <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o - 5)}>
                  -5°
                </button>
                <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o - 1)}>
                  -1°
                </button>
                <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset(0)}>
                  Reset (0°)
                </button>
                <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o + 1)}>
                  +1°
                </button>
                <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o + 5)}>
                  +5°
                </button>
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
                  onClick={handleAutoAlignQibla}
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
        )}

        {/* =========================================================================
            VIEW MODE 2: SATELLITE QIBLA MAP STAGE
            ========================================================================= */}
        {viewMode === "map" && (
          <QiblaMap
            userLat={currentLocation.lat}
            userLng={currentLocation.lng}
            userName={currentLocation.name}
            bearing={qiblaInfo.bearing}
            distanceKm={qiblaInfo.distanceKm}
            angleFromWest={qiblaInfo.angleFromWest}
            locale={locale}
          />
        )}

        {/* =========================================================================
            FALAKIYAH DETAILS & GEODETIC DATA CARDS
            ========================================================================= */}
        <div className="falak-details-grid">
          <div className="falak-detail-box">
            <span className="falak-detail-title">Azimuth Kiblat (Utara Sejati)</span>
            <div className="falak-detail-value">{qiblaInfo.bearing}°</div>
            <span className="falak-detail-sub">{qiblaInfo.dms}</span>
          </div>

          <div className="falak-detail-box">
            <span className="falak-detail-title">Sudut dari Barat (Standar Falak)</span>
            <div className="falak-detail-value">{qiblaInfo.angleFromWest}° U-B</div>
            <span className="falak-detail-sub">Miring ke kanan (Utara) dari Barat</span>
          </div>

          <div className="falak-detail-box">
            <span className="falak-detail-title">Arah Hadap Ponsel Saat Ini</span>
            <div className="falak-detail-value">{effectiveHeading}°</div>
            <span className="falak-detail-sub">
              {currentDirection.code} • {currentDirection.name}
            </span>
          </div>

          <div className="falak-detail-box">
            <span className="falak-detail-title">Jarak Geodesik ke Ka&apos;bah</span>
            <div className="falak-detail-value">
              {qiblaInfo.distanceKm.toLocaleString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID")}{" "}
              <small style={{ fontSize: "0.8rem" }}>KM</small>
            </div>
            <span className="falak-detail-sub">Masjidil Haram, Makkah</span>
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

          </div>

          {/* Authentic Adzan Player Card */}
          <div className="adzan-player-card">
            <div className="adzan-card-header">
              <div className="adzan-badge-title">
                <div className="adzan-pulse-icon">
                  <i className={`fa-solid ${isPlayingAdzan ? "fa-volume-high" : "fa-bell"}`}></i>
                </div>
                <div>
                  <h3 className="adzan-card-title">
                    {locale === "ar" ? "أذان الصلاة الشجي" : locale === "en" ? "Melodious Call to Prayer (Adhan)" : "Kumandang Adzan Merdu"}
                  </h3>
                  <span className="adzan-card-subtitle">
                    {adzanVersion === "makkah" ? t.kiblat.adzan_makkah : t.kiblat.adzan_madinah}
                  </span>
                </div>
              </div>

              {/* Version Selector: Makkah vs Madinah */}
              <div className="adzan-version-pills">
                <button
                  type="button"
                  className={`adzan-pill-btn ${adzanVersion === "makkah" ? "active" : ""}`}
                  onClick={() => {
                    if (adzanVersion !== "makkah") {
                      setAdzanVersion("makkah");
                      setIsPlayingAdzan(false);
                      setAudioCurrentTime(0);
                    }
                  }}
                >
                  🕋 Makkah
                </button>
                <button
                  type="button"
                  className={`adzan-pill-btn ${adzanVersion === "madinah" ? "active" : ""}`}
                  onClick={() => {
                    if (adzanVersion !== "madinah") {
                      setAdzanVersion("madinah");
                      setIsPlayingAdzan(false);
                      setAudioCurrentTime(0);
                    }
                  }}
                >
                  🕌 Madinah
                </button>
              </div>
            </div>

            {/* Audio Controls and Live Wave/Duration */}
            <div className="adzan-player-body">
              <div className="adzan-controls-main">
                <button
                  type="button"
                  className={`adzan-play-btn ${isPlayingAdzan ? "is-playing" : ""}`}
                  onClick={toggleAdzanAudio}
                  aria-label={isPlayingAdzan ? t.kiblat.pause_adzan : t.kiblat.play_adzan}
                  title={isPlayingAdzan ? t.kiblat.pause_adzan : t.kiblat.play_adzan}
                >
                  <i className={`fa-solid ${isPlayingAdzan ? "fa-pause" : "fa-play"}`}></i>
                </button>

                <button
                  type="button"
                  className="adzan-stop-btn"
                  onClick={handleStopAudio}
                  title="Stop / Reset"
                >
                  <i className="fa-solid fa-stop"></i>
                </button>

                <div className="adzan-track-container">
                  <div className="adzan-time-row">
                    <span className="adzan-time-current">{formatAudioTime(audioCurrentTime)}</span>
                    {isPlayingAdzan && (
                      <div className="adzan-wave-bars">
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                      </div>
                    )}
                    <span className="adzan-time-duration">
                      {formatAudioTime(audioDuration || (adzanVersion === "makkah" ? 192 : 165))}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={audioDuration || (adzanVersion === "makkah" ? 192 : 165)}
                    value={audioCurrentTime}
                    onChange={(e) => handleSeekAudio(Number(e.target.value))}
                    className="adzan-seek-bar"
                  />
                </div>
              </div>


              {/* Doa Setelah Adzan Collapsible */}
              <div className="adzan-doa-toggle-wrap">
                <button
                  type="button"
                  className="btn-toggle-doa"
                  onClick={() => setShowDoaAdzan((v) => !v)}
                >
                  <i className="fa-solid fa-hands-praying"></i>
                  <span>{showDoaAdzan ? "Tutup Doa Setelah Adzan" : t.kiblat.doa_after_adzan}</span>
                  <i className={`fa-solid ${showDoaAdzan ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                </button>

                {showDoaAdzan && (
                  <div className="doa-adzan-card animate-fade-in">
                    <div className="doa-arabic" dir="rtl">
                      اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ
                    </div>
                    <div className="doa-latin">
                      &quot;Allaahumma rabba haadzihid-da&apos;watit-taammah, wash-shalaatil qaa-imah, aati muhammadanil wasiilata wal fadhiilah, wab&apos;atshu maqaamam mahmuudanil-ladzii wa&apos;adtah.&quot;
                    </div>
                    <div className="doa-translation">
                      <strong>Artinya:</strong> &quot;Ya Allah, Tuhan Pemilik seruan yang sempurna ini dan shalat yang didirikan, berilah Nabi Muhammad wasilah dan keutamaan, serta tempatkanlah beliau pada kedudukan terpuji yang telah Engkau janjikan.&quot; (HR. Bukhari)
                    </div>
                  </div>
                )}
              </div>
            </div>
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
