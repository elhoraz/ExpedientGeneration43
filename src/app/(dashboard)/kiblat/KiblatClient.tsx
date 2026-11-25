"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  POPULAR_CITIES,
  CityPreset,
  calculateQibla,
  calculatePrayerTimes,
  findNearestCity,
  getNextPrayer,
  getCompassDirection,
  formatQiblaQuadrant,
  formatTimezoneLabel,
  PrayerSchedule,
  NextPrayerInfo,
} from "@/lib/prayerTimes";
import { getOfficialKemenagSchedule, DEFAULT_KEMENAG_CITY_ID } from "@/lib/kemenagPrayerTimes";
import { QiblaMapSkeleton } from "@/components/ui/Skeleton";
import "./kiblat.css";

// Dynamic import for Leaflet Qibla Map to prevent SSR errors
const QiblaMap = dynamic(() => import("./QiblaMap"), {
  ssr: false,
  loading: () => <QiblaMapSkeleton />,
});

const KiblatAstrolabe3D = dynamic(() => import("./KiblatAstrolabe3D"), {
  ssr: false,
  loading: () => (
    <div className="astrolabe-3d-shell astrolabe-3d-skeleton">
      <div className="astrolabe-3d-loader">
        <div className="astrolabe-3d-spinner" />
        <span>Memuat kompas 3D...</span>
      </div>
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

  // Automatically start locked directly onto Ka'bah for Desktop / default view
  const [heading, setHeading] = useState<number>(initialQibla.bearing);
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [continuousHeading, setContinuousHeading] = useState<number>(initialQibla.bearing);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [isSensorListening, setIsSensorListening] = useState<boolean>(false);
  const [sensorUnavailable, setSensorUnavailable] = useState<boolean>(false);
  const [needsIosPermission, setNeedsIosPermission] = useState<boolean>(false);
  const deviceModeRef = useRef<"desktop" | "mobile">("desktop");
  const hasSensorReadingRef = useRef<boolean>(false);
  const sensorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orientListenerAttachedRef = useRef<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<{ type: "error" | "info"; message: string } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"compass" | "map">("compass");
  const [compassStyle, setCompassStyle] = useState<"3d" | "2d">("3d");
  const [cameraPreset, setCameraPreset] = useState<"perspective" | "kaaba" | "top">("perspective");
  const [hasCustomOrbit, setHasCustomOrbit] = useState<boolean>(false);
  const [resetOrbitSignal, setResetOrbitSignal] = useState<number>(0);

  // Genuine Adzan Audio Player state
  const [adzanVersion, setAdzanVersion] = useState<"makkah" | "madinah">("makkah");
  const [isPlayingAdzan, setIsPlayingAdzan] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [showDoaAdzan, setShowDoaAdzan] = useState<boolean>(false);
  const [kemenagSchedule, setKemenagSchedule] = useState<PrayerSchedule | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const startPointerAngleRef = useRef<number>(0);
  const startContinuousHeadingRef = useRef<number>(initialQibla.bearing);

  // Auto-detect mobile device on client mount & restore saved location
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.classList.add("page-kiblat");
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth < 768 && window.matchMedia("(pointer: coarse)").matches);
    const detectedMode = isMobile ? "mobile" : "desktop";
    deviceModeRef.current = detectedMode;
    setDeviceMode(detectedMode);

    try {
      const savedCityId = localStorage.getItem("expedient_kemenag_city_id");
      if (savedCityId) {
        const found = POPULAR_CITIES.find((c) => c.kemenagCityId === savedCityId);
        if (found) {
          setSelectedCity(found);
        }
      }
      const savedLoc = localStorage.getItem("expedient_user_location");
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed.lat && parsed.lng) {
          setCurrentLocation(parsed);
        }
      }
    } catch {}

    return () => {
      document.body.classList.remove("page-kiblat");
    };
  }, []);

  const currentDateKey = now
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : "";

  // Fetch official Kemenag schedule when city, location, or calendar date changes (never per-second)
  useEffect(() => {
    if (!currentDateKey || !now) return;

    const isIndonesiaGps =
      currentLocation.isGps &&
      currentLocation.lat >= -11.5 &&
      currentLocation.lat <= 6.5 &&
      currentLocation.lng >= 94.5 &&
      currentLocation.lng <= 141.5;
    const shouldFetchKemenag = currentLocation.isGps ? isIndonesiaGps : Boolean(selectedCity?.kemenagCityId);

    if (!shouldFetchKemenag) {
      setKemenagSchedule(null);
      setIsScheduleLoading(false);
      return;
    }

    let isMounted = true;
    const fetchOfficialSchedule = async () => {
      const cityId = selectedCity?.kemenagCityId || DEFAULT_KEMENAG_CITY_ID;
      setIsScheduleLoading(true);
      try {
        const sched = await getOfficialKemenagSchedule(
          cityId,
          now,
          currentLocation.lat,
          currentLocation.lng,
          currentLocation.timezone
        );
        if (isMounted) {
          setKemenagSchedule(sched);
          setIsScheduleLoading(false);
          if (typeof window !== "undefined" && selectedCity?.kemenagCityId) {
            localStorage.setItem("expedient_kemenag_city_id", selectedCity.kemenagCityId);
          }
        }
      } catch (e) {
        console.warn("Could not fetch official Kemenag schedule:", e);
        if (isMounted) {
          setKemenagSchedule(null);
          setIsScheduleLoading(false);
        }
      }
    };
    fetchOfficialSchedule();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity?.kemenagCityId, currentLocation.lat, currentLocation.lng, currentLocation.timezone, currentLocation.isGps, currentDateKey]);

  // Qibla calculations (Bearing, Distance, Falak angles, DMS)
  const qiblaInfo = calculateQibla(currentLocation.lat, currentLocation.lng);
  const astronomicalSchedule: PrayerSchedule = now
    ? calculatePrayerTimes(
        currentLocation.lat,
        currentLocation.lng,
        currentLocation.timezone,
        now
      )
    : {
        imsak: "--:--",
        subuh: "--:--",
        syuruq: "--:--",
        dzuhur: "--:--",
        ashar: "--:--",
        maghrib: "--:--",
        isya: "--:--",
        dateStr: "\u00A0",
      };
  // Prioritaskan jadwal resmi Kemenag RI jika tersedia untuk kota tersebut
  const prayerSchedule: PrayerSchedule = kemenagSchedule || astronomicalSchedule;
  const nextPrayer: NextPrayerInfo = now
    ? getNextPrayer(prayerSchedule, now, currentLocation.timezone)
    : {
        id: "subuh",
        name: t.kiblat.prayer_subuh,
        arabicName: "الفجر",
        time: "--:--",
        countdown: "--:--:--",
        isImminent: false,
      };

  const nextPrayerLocalizedName =
    nextPrayer.id === "subuh"
      ? t.kiblat.prayer_subuh
      : nextPrayer.id === "dzuhur"
      ? t.kiblat.prayer_dzuhur
      : nextPrayer.id === "ashar"
      ? t.kiblat.prayer_ashar
      : nextPrayer.id === "maghrib"
      ? t.kiblat.prayer_maghrib
      : t.kiblat.prayer_isya;

  // Target Qibla cardinal direction & quadrant deviation
  const qiblaDirection = getCompassDirection(qiblaInfo.bearing, locale);
  const qiblaQuadrant = formatQiblaQuadrant(qiblaInfo.bearing, qiblaInfo.distanceKm, locale);
  const locationTzLabel = formatTimezoneLabel(currentLocation.timezone);

  // Effective Heading taking into account any manual magnetic calibration offset
  const effectiveHeading = (heading + manualOffset + 360) % 360;
  const displayHeading = Math.round(effectiveHeading * 10) / 10;

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
    setHeading(Math.round(normalized * 10) / 10);

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

  const handle3DDragStart = useCallback(() => {
    setIsDragging(true);
    setIsSensorActive(false);
  }, []);

  const handle3DHeadingDrag = useCallback((newContinuous: number) => {
    const normalized = ((newContinuous % 360) + 360) % 360;
    setHeading(Math.round(normalized));
    setContinuousHeading(newContinuous);
  }, []);

  const handle3DDragEnd = useCallback(() => {
    setIsDragging(false);
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

  // Live 1-second clock (initialized post-mount to avoid SSR hydration mismatch)
  useEffect(() => {
    setNow(new Date());
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
      if (deviceModeRef.current !== "mobile") return;
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
        hasSensorReadingRef.current = true;
        if (sensorTimeoutRef.current) {
          clearTimeout(sensorTimeoutRef.current);
          sensorTimeoutRef.current = null;
        }
        updateHeading(compass);
        setSensorUnavailable(false);
        setIsSensorListening(false);
        setIsSensorActive(true);
      }
    },
    [updateHeading]
  );

  // Activate Sensor (requires user gesture on iOS Safari; verifies real hardware events before marking active)
  const activateCompassSensor = useCallback(async () => {
    if (sensorTimeoutRef.current) {
      clearTimeout(sensorTimeoutRef.current);
      sensorTimeoutRef.current = null;
    }
    hasSensorReadingRef.current = false;
    setSensorUnavailable(false);
    setIsSensorActive(false);

    const startAvailabilityTimer = () => {
      setIsSensorListening(true);
      sensorTimeoutRef.current = setTimeout(() => {
        if (!hasSensorReadingRef.current) {
          setIsSensorListening(false);
          setIsSensorActive(false);
          setSensorUnavailable(true);
        }
      }, 1400);
    };

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const res = await (DeviceOrientationEvent as any).requestPermission();
        if (res === "granted") {
          if (!orientListenerAttachedRef.current) {
            window.addEventListener("deviceorientation", handleOrientation, true);
            orientListenerAttachedRef.current = true;
          }
          setNeedsIosPermission(false);
          startAvailabilityTimer();
        } else {
          setSensorUnavailable(true);
          setIsSensorListening(false);
        }
      } catch (err) {
        console.warn("iOS orientation permission error:", err);
        setSensorUnavailable(true);
        setIsSensorListening(false);
      }
    } else if (typeof window !== "undefined") {
      const win = window as any;
      if (!("DeviceOrientationEvent" in win) && !("AbsoluteOrientationSensor" in win)) {
        setSensorUnavailable(true);
        return;
      }
      if (!orientListenerAttachedRef.current) {
        if ("ondeviceorientationabsolute" in win) {
          win.addEventListener("deviceorientationabsolute", handleOrientation, true);
        } else {
          win.addEventListener("deviceorientation", handleOrientation, true);
        }
        orientListenerAttachedRef.current = true;
      }
      startAvailabilityTimer();
    }
  }, [handleOrientation]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let sensorInstance: any = null;

    // Check Generic Sensor API (AbsoluteOrientationSensor) on modern Android Chrome
    const win = window as any;
    if ("AbsoluteOrientationSensor" in win) {
      try {
        const sensor = new win.AbsoluteOrientationSensor({ frequency: 60 });
        sensor.addEventListener("reading", () => {
          if (deviceModeRef.current !== "mobile") return;
          const q = sensor.quaternion;
          if (q && q.length === 4) {
            const [x, y, z, w] = q;
            const siny_cosp = 2 * (w * z + x * y);
            const cosy_cosp = 1 - 2 * (y * y + z * z);
            let yaw = Math.atan2(siny_cosp, cosy_cosp) * (180 / Math.PI);
            yaw = (360 - yaw) % 360;
            hasSensorReadingRef.current = true;
            if (sensorTimeoutRef.current) {
              clearTimeout(sensorTimeoutRef.current);
              sensorTimeoutRef.current = null;
            }
            updateHeading(yaw);
            setSensorUnavailable(false);
            setIsSensorListening(false);
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
      orientListenerAttachedRef.current = true;
    }

    return () => {
      if (sensorTimeoutRef.current) {
        clearTimeout(sensorTimeoutRef.current);
      }
      if (sensorInstance) {
        try {
          sensorInstance.stop();
        } catch (_) {}
      }
      orientListenerAttachedRef.current = false;
      win.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      win.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation, updateHeading]);

  // High-accuracy GPS Geolocation Handler
  const handleDetectGps = () => {
    setGpsStatus(null);
    if (!navigator.geolocation) {
      setGpsStatus({
        type: "error",
        message:
          locale === "ar"
            ? "متصفحك لا يدعم تحديد الموقع عبر GPS. اختر مدينة من القائمة أعلاه."
            : locale === "en"
            ? "Your browser does not support GPS geolocation. Please select a city from the list."
            : "Browser tidak mendukung GPS. Silakan pilih kota secara manual dari daftar.",
      });
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const tzOffset = Math.round(-new Date().getTimezoneOffset() / 60);
        const nearestCity = findNearestCity(latitude, longitude);

        const newLoc = {
          name: locale === "ar" ? "موقع GPS الخاص بك" : locale === "en" ? "Your GPS Location" : `Lokasi GPS (${nearestCity.name})`,
          lat: latitude,
          lng: longitude,
          timezone: tzOffset || nearestCity.timezone || 7,
          isGps: true,
        };
        setCurrentLocation(newLoc);
        setSelectedCity(nearestCity);
        setIsGpsLoading(false);
        setGpsStatus(null);

        if (typeof window !== "undefined") {
          localStorage.setItem("expedient_user_location", JSON.stringify(newLoc));
          if (nearestCity.kemenagCityId) {
            localStorage.setItem("expedient_kemenag_city_id", nearestCity.kemenagCityId);
          }
          window.dispatchEvent(new CustomEvent("expedient_location_updated"));
        }

        // Auto-align compass to the GPS location's accurate Qibla bearing on desktop!
        if (!isSensorActive) {
          const newQibla = calculateQibla(latitude, longitude);
          updateHeading(newQibla.bearing);
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsGpsLoading(false);
        setGpsStatus({
          type: "error",
          message:
            locale === "ar"
              ? "تعذر الوصول إلى GPS. فعّل إذن الموقع في المتصفح ثم أعد المحاولة أو اختر مدينة يدوياً."
              : locale === "en"
              ? "Unable to access GPS. Enable location permission in your browser and retry, or select a city manually."
              : "Gagal mengakses GPS. Aktifkan izin lokasi di browser lalu coba lagi, atau pilih kota secara manual.",
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // City Dropdown Change with automatic Qibla auto-alignment on Desktop
  const handleCityChange = (cityName: string) => {
    setGpsStatus(null);
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

      if (typeof window !== "undefined") {
        localStorage.setItem("expedient_user_location", JSON.stringify(newLoc));
        if (city.kemenagCityId) {
          localStorage.setItem("expedient_kemenag_city_id", city.kemenagCityId);
        }
        window.dispatchEvent(new CustomEvent("expedient_location_updated"));
      }

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

  const handleTabListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    if (tabs.length < 2) return;
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    e.preventDefault();
    const isRtl = locale === "ar";
    let nextIdx = idx;
    if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = tabs.length - 1;
    else if ((e.key === "ArrowRight" && !isRtl) || (e.key === "ArrowLeft" && isRtl)) {
      nextIdx = (idx + 1) % tabs.length;
    } else {
      nextIdx = (idx - 1 + tabs.length) % tabs.length;
    }
    tabs[nextIdx]?.focus();
  };

  return (
    <div className="kiblat-page-wrapper">
      <div className="kiblat-container">
        {/* Compact Header (No banned eyebrow pill) */}
        <header className="kiblat-header-box">
          <h1 className="kiblat-title">{t.kiblat.title}</h1>
          <p className="kiblat-subtitle">{t.kiblat.subtitle}</p>
        </header>

        {/* Single Unified Toolbar: Location Controls + View Mode + Sensor Mode */}
        <section
          className="kiblat-location-bar"
          aria-label={locale === "ar" ? "إعدادات الموقع والوضع" : locale === "en" ? "Location and mode controls" : "Kontrol lokasi dan mode"}
        >
          <div className="location-current-info">
            <div className="location-icon-badge" aria-hidden="true">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div className="location-text">
              <h2>{currentLocation.isGps ? t.kiblat.gps_my_loc : currentLocation.name}</h2>
              <p className="location-coords-meta">
                {Math.abs(currentLocation.lat).toFixed(4)}°{" "}
                {currentLocation.lat >= 0
                  ? locale === "ar"
                    ? "ش"
                    : locale === "id"
                    ? "LU"
                    : "N"
                  : locale === "ar"
                  ? "ج"
                  : locale === "id"
                  ? "LS"
                  : "S"}
                {", "}
                {Math.abs(currentLocation.lng).toFixed(4)}°{" "}
                {currentLocation.lng >= 0
                  ? locale === "ar"
                    ? "ق"
                    : locale === "id"
                    ? "BT"
                    : "E"
                  : locale === "ar"
                  ? "غ"
                  : locale === "id"
                  ? "BB"
                  : "W"}
                {" · "}
                {locationTzLabel} (UTC{currentLocation.timezone >= 0 ? `+${currentLocation.timezone}` : currentLocation.timezone})
              </p>
            </div>
          </div>

          <div className="location-controls">
            <label htmlFor="kiblat-city-select" className="sr-only">
              {locale === "ar" ? "اختر المدينة" : locale === "en" ? "Select city" : "Pilih kota"}
            </label>
            <select
              id="kiblat-city-select"
              name="city"
              className="city-select"
              value={currentLocation.isGps ? "" : selectedCity.name}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              {currentLocation.isGps && <option value="">{t.kiblat.gps_my_loc}</option>}
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
              <i className={`fa-solid ${isGpsLoading ? "fa-spinner fa-spin" : "fa-crosshairs"}`} aria-hidden="true"></i>
              <span>{isGpsLoading ? t.kiblat.gps_detecting : t.kiblat.gps_detect}</span>
            </button>
          </div>
        </section>

        <div className="kiblat-mode-toolbar">
          <div
            className="kiblat-view-tabs"
            role="tablist"
            onKeyDown={handleTabListKeyDown}
            aria-label={locale === "ar" ? "وضع العرض" : locale === "en" ? "Display mode" : "Mode tampilan"}
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "compass"}
              className={`kiblat-tab-btn ${viewMode === "compass" ? "active" : ""}`}
              onClick={() => setViewMode("compass")}
            >
              <i className="fa-solid fa-compass" aria-hidden="true"></i>
              <span>{locale === "ar" ? "البوصلة" : locale === "en" ? "Compass" : "Kompas"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "map"}
              className={`kiblat-tab-btn ${viewMode === "map" ? "active" : ""}`}
              onClick={() => setViewMode("map")}
            >
              <i className="fa-solid fa-map-location-dot" aria-hidden="true"></i>
              <span>{locale === "ar" ? "خريطة القبلة" : locale === "en" ? "Qibla Map" : "Peta Kiblat"}</span>
            </button>
          </div>

          <div
            className="device-mode-pills"
            role="group"
            aria-label={locale === "ar" ? "مصدر التوجيه" : locale === "en" ? "Orientation source" : "Sumber orientasi"}
          >
            <button
              type="button"
              className={`device-mode-pill ${deviceMode === "desktop" ? "active" : ""}`}
              aria-pressed={deviceMode === "desktop"}
              onClick={() => {
                deviceModeRef.current = "desktop";
                if (sensorTimeoutRef.current) {
                  clearTimeout(sensorTimeoutRef.current);
                  sensorTimeoutRef.current = null;
                }
                setDeviceMode("desktop");
                setIsSensorActive(false);
                setIsSensorListening(false);
                setSensorUnavailable(false);
              }}
            >
              <i className="fa-solid fa-desktop" aria-hidden="true"></i>
              <span>{t.kiblat.mode_desktop}</span>
            </button>
            <button
              type="button"
              className={`device-mode-pill ${deviceMode === "mobile" ? "active" : ""}`}
              aria-pressed={deviceMode === "mobile"}
              onClick={() => {
                deviceModeRef.current = "mobile";
                setDeviceMode("mobile");
                if (!isSensorActive) {
                  activateCompassSensor();
                }
              }}
            >
              <i className="fa-solid fa-mobile-screen-button" aria-hidden="true"></i>
              <span>{t.kiblat.mode_mobile}</span>
            </button>
          </div>
        </div>

        {gpsStatus && (
          <div className="kiblat-inline-alert" role="alert" aria-live="polite">
            <span className="kiblat-inline-alert-text">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
              <span>{gpsStatus.message}</span>
            </span>
            <button
              type="button"
              className="kiblat-inline-alert-close"
              onClick={() => setGpsStatus(null)}
              aria-label={locale === "ar" ? "إغلاق التنبيه" : locale === "en" ? "Dismiss notice" : "Tutup peringatan"}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* =========================================================================
            VIEW MODE 1: ASTROLABE COMPASS STAGE (INSTRUMENT LEADS ABOVE THE FOLD)
            ========================================================================= */}
        {viewMode === "compass" && (
          <div className="astrolabe-stage">
            {compassStyle === "3d" ? (
              <div className="astrolabe-3d-wrapper">
                {/* Clean Heading Readout directly above 3D Instrument */}
                <div className="astrolabe-3d-lubber-top">
                  <div className={`lubber-hud-badge ${isAligned ? "aligned" : ""}`}>
                    <span className="hud-deg">{displayHeading}°</span>
                    <span className="hud-dir">
                      {currentDirection.code} • {currentDirection.name}
                    </span>
                  </div>
                </div>

                <KiblatAstrolabe3D
                  continuousHeading={continuousHeading}
                  manualOffset={manualOffset}
                  qiblaBearing={qiblaInfo.bearing}
                  isAligned={isAligned}
                  deviceMode={deviceMode}
                  locale={locale}
                  preset={cameraPreset}
                  onOrbitChange={setHasCustomOrbit}
                  resetOrbitSignal={resetOrbitSignal}
                  onDragStart={handle3DDragStart}
                  onHeadingDrag={handle3DHeadingDrag}
                  onDragEnd={handle3DDragEnd}
                />

                {/* Single quiet horology control bar */}
                <div className="astrolabe-quiet-bar">
                  <div
                    className="astrolabe-seg-group"
                    role="tablist"
                    onKeyDown={handleTabListKeyDown}
                    aria-label={
                      locale === "ar" ? "زاوية عرض الأسطرلاب" : locale === "en" ? "Astrolabe view options" : "Sudut pandang astrolabe"
                    }
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={cameraPreset === "perspective"}
                      className={`astrolabe-seg-btn ${cameraPreset === "perspective" ? "active" : ""}`}
                      onClick={() => setCameraPreset("perspective")}
                    >
                      {locale === "ar" ? "منظور" : locale === "en" ? "Perspective" : "Perspektif"}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={cameraPreset === "kaaba"}
                      className={`astrolabe-seg-btn ${cameraPreset === "kaaba" ? "active" : ""}`}
                      onClick={() => setCameraPreset("kaaba")}
                    >
                      {locale === "ar" ? "الكعبة" : "Ka'bah"}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={cameraPreset === "top"}
                      className={`astrolabe-seg-btn ${cameraPreset === "top" ? "active" : ""}`}
                      onClick={() => setCameraPreset("top")}
                    >
                      {locale === "ar" ? "أعلى" : locale === "en" ? "Top" : "Atas"}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={false}
                      className="astrolabe-seg-btn"
                      onClick={() => setCompassStyle("2d")}
                    >
                      2D
                    </button>
                  </div>

                  {hasCustomOrbit && (
                    <button
                      type="button"
                      className="astrolabe-reset-link"
                      onClick={() => setResetOrbitSignal((n) => n + 1)}
                    >
                      {locale === "ar" ? "إعادة الزاوية" : locale === "en" ? "Reset angle" : "Reset sudut"}
                    </button>
                  )}
                </div>

                {deviceMode === "desktop" && (
                  <p className="astrolabe-quiet-caption">
                    {locale === "ar"
                      ? "اسحب لتدوير البوصلة، وبالزر الأيمن لتغيير زاوية الكاميرا"
                      : locale === "en"
                      ? "Drag to turn compass, right-drag to orbit camera"
                      : "Geser untuk memutar arah, klik kanan untuk sudut kamera"}
                  </p>
                )}
              </div>
            ) : (
              /* Bezel housing Forward Lubber Line and 2D Classic Compass */
              <>
                <div
                  className="astrolabe-bezel"
                  ref={stageRef}
                  role="slider"
                  tabIndex={0}
                  aria-label={
                    locale === "ar"
                      ? "بوصلة الأسطرلاب ثنائية الأبعاد، استخدم أسهم اليسار واليمين للتدوير"
                      : locale === "en"
                      ? "2D Qibla compass dial, use Left and Right arrow keys to rotate"
                      : "Kompas Astrolabe 2D, gunakan panah Kiri/Kanan atau geser untuk memutar"
                  }
                  aria-valuemin={0}
                  aria-valuemax={359.9}
                  aria-valuenow={displayHeading}
                  aria-valuetext={`${displayHeading}° ${currentDirection.name}`}
                  onPointerDown={handlePointerDown}
                  onKeyDown={(e) => {
                    const step = e.shiftKey ? 15 : 5;
                    if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      setIsSensorActive(false);
                      updateHeading(heading - step);
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      setIsSensorActive(false);
                      updateHeading(heading + step);
                    } else if (e.key === "Home") {
                      e.preventDefault();
                      handleAutoAlignQibla();
                    }
                  }}
                  title={
                    deviceMode === "desktop"
                      ? locale === "ar"
                        ? "اسحب لتدوير البوصلة"
                        : locale === "en"
                        ? "Click and drag to rotate compass"
                        : "Klik & geser mouse untuk memutar kompas"
                      : locale === "ar"
                      ? "أمسك الهاتف أفقياً"
                      : locale === "en"
                      ? "Hold device flat parallel to the ground"
                      : "Pegang ponsel mendatar sejajar lantai"
                  }
                >
                  {/* Top Lubber Line / Forward Heading Hub (Device Axis) */}
                  <div className="astrolabe-lubber-container">
                    <div className={`lubber-hud-badge ${isAligned ? "aligned" : ""}`}>
                      <span className="hud-deg">{displayHeading}°</span>
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

                      {/* Degree tick markers around perimeter (scaled cleanly with --rim-size) */}
                      {DEGREE_LABELS.map((d) => (
                        <span
                          key={d.deg}
                          className="degree-tick-label"
                          style={{ "--deg": `${d.deg}deg` } as React.CSSProperties}
                        >
                          {d.text}
                        </span>
                      ))}

                      {/* 8 Cardinal & Intercardinal Points on Rotating Dial */}
                      {cardinalPoints.map((pt) => (
                        <span
                          key={pt.deg}
                          className={`cardinal-point ${pt.isNorth ? "pt-n" : ""} ${!pt.isPrimary ? "pt-sub" : ""}`}
                          style={{ "--deg": `${pt.deg}deg` } as React.CSSProperties}
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
                          <i className="fa-solid fa-kaaba qibla-kaaba-icon" aria-hidden="true"></i>
                          <div className="qibla-tag-pill">
                            <span>{locale === "ar" ? "القبلة" : locale === "en" ? "Qibla" : "Kiblat"}</span>
                            <strong>{qiblaInfo.bearing}°</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center Core Brass Pin with Star and Crescent */}
                    <div className="astrolabe-center-core" aria-hidden="true">
                      <i className="fa-solid fa-star-and-crescent"></i>
                    </div>
                  </div>
                </div>

                <div className="astrolabe-quiet-bar">
                  <div
                    className="astrolabe-seg-group"
                    role="tablist"
                    onKeyDown={handleTabListKeyDown}
                    aria-label={locale === "ar" ? "نمط البوصلة" : locale === "en" ? "Compass mode" : "Gaya kompas"}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={false}
                      className="astrolabe-seg-btn"
                      onClick={() => setCompassStyle("3d")}
                    >
                      {locale === "ar" ? "عرض ثلاثي الأبعاد" : locale === "en" ? "3D Ka'bah" : "3D Ka'bah"}
                    </button>
                    <button type="button" role="tab" aria-selected={true} className="astrolabe-seg-btn active">
                      2D
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Alignment Status Banner with Dynamic Left/Right turn directions */}
            <div className={`kiblat-aligned-badge ${isAligned ? "locked" : "searching"}`} aria-live="polite">
              {isAligned ? (
                <>
                  <i className="fa-solid fa-circle-check aligned-check-icon" aria-hidden="true"></i>
                  <span>
                    {t.kiblat.aligned_success} ({qiblaDirection.name})
                  </span>
                </>
              ) : turnDiff > 0 ? (
                <>
                  <i className="fa-solid fa-arrow-rotate-right turn-icon-pulse" aria-hidden="true"></i>
                  <span>
                    {deviceMode === "mobile"
                      ? t.kiblat.turn_right
                      : locale === "ar"
                      ? "اسحب لليمين"
                      : locale === "en"
                      ? "Turn right"
                      : "Geser ke kanan"}{" "}
                    <strong>{absTurnDiff}°</strong>
                  </span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-arrow-rotate-left turn-icon-pulse" aria-hidden="true"></i>
                  <span>
                    {deviceMode === "mobile"
                      ? t.kiblat.turn_left
                      : locale === "ar"
                      ? "اسحب لليسار"
                      : locale === "en"
                      ? "Turn left"
                      : "Geser ke kiri"}{" "}
                    <strong>{absTurnDiff}°</strong>
                  </span>
                </>
              )}
            </div>

            {/* Mode Mobile Status & Guide (rendered directly under compass only in mobile sensor mode) */}
            {deviceMode === "mobile" && (
              <div className="mobile-mode-panel">
                <div className="mobile-sensor-status-card" role="status" aria-live="polite">
                  <div className="mobile-status-indicator">
                    <span
                      className={`status-dot ${isSensorActive ? "active" : sensorUnavailable ? "unavailable" : "idle"}`}
                      aria-hidden="true"
                    ></span>
                    <div className="status-label-group">
                      <strong>
                        {isSensorActive
                          ? locale === "ar"
                            ? "مستشعر البوصلة نشط"
                            : locale === "en"
                            ? "Compass sensor active"
                            : "Sensor kompas aktif"
                          : isSensorListening
                          ? locale === "ar"
                            ? "جارٍ فحص المستشعر..."
                            : locale === "en"
                            ? "Checking sensor..."
                            : "Memeriksa sensor..."
                          : sensorUnavailable
                          ? locale === "ar"
                            ? "مستشعر البوصلة غير متوفر على هذا الجهاز"
                            : locale === "en"
                            ? "Compass sensor unavailable on this device"
                            : "Sensor kompas tidak tersedia di perangkat ini"
                          : locale === "ar"
                          ? "المستشعر غير مفعل"
                          : locale === "en"
                          ? "Sensor awaiting activation"
                          : "Sensor belum aktif"}
                      </strong>
                      <small>
                        {isSensorActive
                          ? locale === "ar"
                            ? "تتحرك الإبرة تبعاً لاتجاه هاتفك."
                            : locale === "en"
                            ? "Dial follows your phone orientation."
                            : "Jarum mengikuti arah ponsel secara langsung."
                          : sensorUnavailable
                          ? locale === "ar"
                            ? "استخدم الوضع اليدوي أو افتح خريطة القبلة."
                            : locale === "en"
                            ? "Switch to Manual mode or open Qibla Map."
                            : "Gunakan mode manual atau buka Peta Kiblat."
                          : locale === "ar"
                          ? "اضغط تفعيل لاستخدام مستشعر الهاتف."
                          : locale === "en"
                          ? "Tap activate to use your orientation sensor."
                          : "Ketuk aktifkan untuk memakai sensor kompas."}
                      </small>
                    </div>
                  </div>

                  {!isSensorActive && (
                    <div className="mobile-sensor-actions">
                      <button
                        type="button"
                        className="btn-activate-sensor"
                        onClick={activateCompassSensor}
                        disabled={isSensorListening}
                      >
                        <i className="fa-solid fa-compass" aria-hidden="true"></i>
                        <span>
                          {sensorUnavailable
                            ? locale === "ar"
                              ? "إعادة المحاولة"
                              : locale === "en"
                              ? "Retry sensor"
                              : "Coba ulang sensor"
                            : locale === "ar"
                            ? "تفعيل المستشعر"
                            : locale === "en"
                            ? "Enable sensor"
                            : "Aktifkan sensor"}
                        </span>
                      </button>
                      {sensorUnavailable && (
                        <button
                          type="button"
                          className="btn-fallback-desktop"
                          onClick={() => {
                            deviceModeRef.current = "desktop";
                            setDeviceMode("desktop");
                            setSensorUnavailable(false);
                          }}
                        >
                          {t.kiblat.mode_desktop}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="mobile-guide-note">
                  {locale === "ar"
                    ? "أمسك الهاتف أفقياً وأدر جسمك ببطء نحو المؤشر، أو حركه بشكل ٨ إذا انحرفت القراءة."
                    : locale === "en"
                    ? "Hold phone flat, turn slowly toward the marker, or move in a figure-8 if readings drift."
                    : "Pegang ponsel mendatar, putar badan perlahan mengikuti panah, atau gerakkan pola angka 8 bila arah bergeser."}
                </p>
              </div>
            )}

            {/* Calibration & Magnetic Offset Adjustment Bar (only relevant in mobile sensor mode) */}
            {deviceMode === "mobile" && (
              <div className="calibration-offset-bar">
                <span>
                  <i className="fa-solid fa-magnet" aria-hidden="true"></i>{" "}
                  {locale === "ar"
                    ? "معايرة البوصلة:"
                    : locale === "en"
                    ? "Compass offset:"
                    : "Koreksi kompas:"}{" "}
                  <strong>{manualOffset > 0 ? `+${manualOffset}` : manualOffset}°</strong>
                </span>
                <div className="calibration-buttons">
                  <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o - 5)}>
                    -5°
                  </button>
                  <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o - 1)}>
                    -1°
                  </button>
                  <button
                    type="button"
                    className="btn-calib-nudge"
                    onClick={() => setManualOffset(0)}
                    aria-label={locale === "ar" ? "إعادة الضبط إلى صفر" : locale === "en" ? "Reset offset to 0°" : "Reset koreksi ke 0°"}
                  >
                    0°
                  </button>
                  <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o + 1)}>
                    +1°
                  </button>
                  <button type="button" className="btn-calib-nudge" onClick={() => setManualOffset((o) => o + 5)}>
                    +5°
                  </button>
                </div>
              </div>
            )}

            {/* Manual Rotation & Preset Controls */}
            <div className="desktop-sim-controls">
              <div className="desktop-sim-header">
                <label htmlFor="kiblat-heading-slider">
                  <i className="fa-solid fa-sliders" aria-hidden="true"></i> {t.kiblat.sim_slider_label}
                </label>
                <strong className="sim-heading-val">{displayHeading}°</strong>
              </div>

              <input
                id="kiblat-heading-slider"
                name="heading"
                type="range"
                min="0"
                max="359.9"
                step="0.1"
                value={heading}
                aria-label={t.kiblat.sim_slider_label}
                aria-valuetext={`${displayHeading}° ${currentDirection.name}`}
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
                  <i className="fa-solid fa-kaaba" aria-hidden="true"></i> {t.kiblat.snap_qibla} ({qiblaInfo.bearing}°)
                </button>

                <button
                  type="button"
                  className="btn-preset-snap"
                  onClick={() => {
                    setIsSensorActive(false);
                    updateHeading(0);
                  }}
                >
                  <i className="fa-solid fa-arrow-up" aria-hidden="true"></i> {t.kiblat.snap_north}
                </button>

                <button
                  type="button"
                  className="btn-preset-snap"
                  onClick={() => {
                    setIsSensorActive(false);
                    updateHeading(270);
                  }}
                >
                  <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>{" "}
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
                  <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>{" "}
                  {locale === "ar" ? "الشرق (٩٠°)" : locale === "en" ? "East (90°)" : "Timur (90°)"}
                </button>
              </div>
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
            FALAKIYAH DETAILS & QIBLA DATA CARDS
            ========================================================================= */}
        <div className="falak-details-grid">
          <div className="falak-detail-box is-qibla-focal">
            <span className="falak-detail-title">
              {locale === "ar"
                ? "اتجاه القبلة"
                : locale === "en"
                ? "Qibla bearing"
                : "Arah Kiblat"}
            </span>
            <div className="falak-detail-value">{qiblaInfo.bearing}°</div>
            <span className="falak-detail-sub">{qiblaInfo.dms}</span>
          </div>

          <div className="falak-detail-box">
            <span className="falak-detail-title">
              {locale === "ar" ? "الانحراف" : locale === "en" ? "Angle offset" : "Selisih sudut"}
            </span>
            <div className="falak-detail-value">{qiblaQuadrant.shortLabel}</div>
            <span className="falak-detail-sub">{qiblaQuadrant.description}</span>
          </div>

          <div className="falak-detail-box">
            <span className="falak-detail-title">
              {locale === "ar"
                ? "الاتجاه الحالي"
                : locale === "en"
                ? "Current heading"
                : "Arah hadap"}
            </span>
            <div className="falak-detail-value">{displayHeading}°</div>
            <span className="falak-detail-sub">{currentDirection.name}</span>
          </div>

          <div className="falak-detail-box">
            <span className="falak-detail-title">
              {locale === "ar"
                ? "المسافة إلى مكة"
                : locale === "en"
                ? "Distance to Makkah"
                : "Jarak ke Makkah"}
            </span>
            <div className="falak-detail-value">
              {qiblaInfo.distanceKm.toLocaleString(locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : "id-ID")}{" "}
              <small>km</small>
            </div>
            <span className="falak-detail-sub">
              {locale === "ar" ? "المسجد الحرام" : locale === "en" ? "Masjid al-Haram" : "Masjidil Haram"}
            </span>
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
              <div className="prayer-meta-row">
                <span className="prayer-date-text">{prayerSchedule.dateStr}</span>
                {isScheduleLoading ? (
                  <span className="prayer-source-meta">
                    {locale === "ar" ? "جارٍ التحديث..." : locale === "en" ? "Updating schedule..." : "Memuat jadwal..."}
                  </span>
                ) : prayerSchedule.isKemenagOfficial ? (
                  <span className="kemenag-official-tag">
                    <i className="fa-solid fa-check" aria-hidden="true"></i>
                    <span>
                      {locale === "ar"
                        ? "المصدر: وزارة الشؤون الدينية الإندونيسية"
                        : locale === "en"
                        ? "Source: Kemenag RI (Bimas Islam)"
                        : "Sumber: Bimas Islam Kemenag RI"}
                    </span>
                  </span>
                ) : (
                  <span className="prayer-source-meta">({t.kiblat.standard_kemenag})</span>
                )}
              </div>
            </div>
          </div>

          {/* Adzan Audio Card */}
          <div className="adzan-player-card">
            <div className="adzan-card-header">
              <div className="adzan-badge-title">
                <div className="adzan-pulse-icon" aria-hidden="true">
                  <i className={`fa-solid ${isPlayingAdzan ? "fa-volume-high" : "fa-volume-low"}`}></i>
                </div>
                <div>
                  <h3 className="adzan-card-title">
                    {locale === "ar" ? "تسجيل الأذان" : locale === "en" ? "Adhan audio" : "Rekaman adzan"}
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
                  aria-pressed={adzanVersion === "makkah"}
                  onClick={() => {
                    if (adzanVersion !== "makkah") {
                      setAdzanVersion("makkah");
                      setIsPlayingAdzan(false);
                      setAudioCurrentTime(0);
                    }
                  }}
                >
                  {locale === "ar" ? "مكة المكرمة" : "Makkah"}
                </button>
                <button
                  type="button"
                  className={`adzan-pill-btn ${adzanVersion === "madinah" ? "active" : ""}`}
                  aria-pressed={adzanVersion === "madinah"}
                  onClick={() => {
                    if (adzanVersion !== "madinah") {
                      setAdzanVersion("madinah");
                      setIsPlayingAdzan(false);
                      setAudioCurrentTime(0);
                    }
                  }}
                >
                  {locale === "ar" ? "المدينة المنورة" : "Madinah"}
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
                  aria-label={locale === "ar" ? "إيقاف الأذان" : locale === "en" ? "Stop adhan audio" : "Hentikan audio adzan"}
                  title={locale === "ar" ? "إيقاف" : locale === "en" ? "Stop / Reset" : "Hentikan / Reset"}
                >
                  <i className="fa-solid fa-stop" aria-hidden="true"></i>
                </button>

                <div className="adzan-track-container">
                  <div className="adzan-time-row">
                    <span className="adzan-time-current">{formatAudioTime(audioCurrentTime)}</span>
                    {isPlayingAdzan && (
                      <div className="adzan-wave-bars" aria-hidden="true">
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
                    id="adzan-seek-slider"
                    name="adzanSeek"
                    type="range"
                    min="0"
                    max={audioDuration || (adzanVersion === "makkah" ? 192 : 165)}
                    value={audioCurrentTime}
                    aria-label={locale === "ar" ? "شريط تقدم الأذان" : locale === "en" ? "Adhan audio progress" : "Posisi pemutaran audio adzan"}
                    aria-valuetext={`${formatAudioTime(audioCurrentTime)} / ${formatAudioTime(audioDuration || (adzanVersion === "makkah" ? 192 : 165))}`}
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
                  aria-expanded={showDoaAdzan}
                  aria-controls="doa-adzan-panel"
                  onClick={() => setShowDoaAdzan((v) => !v)}
                >
                  <i className="fa-solid fa-hands-praying" aria-hidden="true"></i>
                  <span>
                    {showDoaAdzan
                      ? locale === "ar"
                        ? "إغلاق دعاء بعد الأذان"
                        : locale === "en"
                        ? "Hide supplication"
                        : "Tutup doa setelah adzan"
                      : t.kiblat.doa_after_adzan}
                  </span>
                  <i className={`fa-solid ${showDoaAdzan ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true"></i>
                </button>

                {showDoaAdzan && (
                  <div id="doa-adzan-panel" className="doa-adzan-card">
                    <div className="doa-arabic" dir="rtl" lang="ar">
                      اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ
                    </div>
                    <div className="doa-latin">
                      &ldquo;Allaahumma rabba haadzihid-da&apos;watit-taammah, wash-shalaatil qaa-imah, aati muhammadanil wasiilata wal fadhiilah, wab&apos;atshu maqaamam mahmuudanil-ladzii wa&apos;adtah.&rdquo;
                    </div>
                    <div className="doa-translation">
                      <strong>
                        {locale === "ar" ? "المعنى:" : locale === "en" ? "Meaning:" : "Artinya:"}
                      </strong>{" "}
                      {locale === "en"
                        ? "O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and eminence, and resurrect him to the praised station You have promised him. (Narrated by al-Bukhari)"
                        : "Ya Allah, Tuhan Pemilik seruan yang sempurna ini dan shalat yang didirikan, berilah Nabi Muhammad wasilah dan keutamaan, serta tempatkanlah beliau pada kedudukan terpuji yang telah Engkau janjikan. (HR. Bukhari)"}
                    </div>
                  </div>
                )}
              </div>

              {/* Uji Alarm Adzan */}
              <div className="adzan-test-alarm-wrap">
                <button
                  type="button"
                  className="btn-test-adzan-alarm"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      if (typeof (window as any).testAdzanAlarm === "function") {
                        (window as any).testAdzanAlarm(5);
                      } else {
                        window.dispatchEvent(new CustomEvent("expedient_test_adzan_alarm"));
                      }
                    }
                  }}
                >
                  <i className="fa-solid fa-bell" aria-hidden="true"></i>
                  <span>
                    {locale === "ar"
                      ? "اختبار تنبيه الأذان"
                      : locale === "en"
                      ? "Test adhan alert"
                      : "Tes notifikasi adzan"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Next Prayer Countdown Banner */}
          <div className="next-prayer-banner">
            <div className="next-prayer-info">
              <span className="next-prayer-lbl">{t.kiblat.countdown_towards}</span>
              <div className="next-prayer-name">
                {nextPrayerLocalizedName} <small>({nextPrayer.time} {locationTzLabel})</small>
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
              const isActive = Boolean(now) && nextPrayer.id === p.id;
              return (
                <div key={p.id} className={`prayer-card ${isActive ? "is-active-prayer" : ""}`}>
                  {isActive && (
                    <span className="prayer-active-pill">
                      {locale === "ar" ? "القادم" : locale === "en" ? "Next" : "Berikutnya"}
                    </span>
                  )}
                  <div className="prayer-card-arabic" lang="ar" dir="rtl">{p.arabic}</div>
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
