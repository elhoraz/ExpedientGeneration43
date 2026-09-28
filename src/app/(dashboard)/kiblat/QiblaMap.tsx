"use client";

import { useEffect, useRef, useState } from "react";

interface QiblaMapProps {
  userLat: number;
  userLng: number;
  userName: string;
  bearing: number;
  distanceKm: number;
  angleFromWest: number;
  locale: string;
}

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export default function QiblaMap({
  userLat,
  userLng,
  userName,
  bearing,
  distanceKm,
  angleFromWest,
  locale,
}: QiblaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapType, setMapType] = useState<"satellite" | "streets">("satellite");
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const leafletModule = await import("leaflet");
      const L = leafletModule.default || leafletModule;

      if (!isMounted || !mapContainerRef.current) return;

      // Clean up existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      mapContainerRef.current.innerHTML = "";

      // Initialize map centered at user location with close zoom
      const map = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 17,
        zoomControl: true,
        attributionControl: false,
      });
      mapInstanceRef.current = map;

      // Tile layers
      const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      const streetsUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const currentLayer = L.tileLayer(mapType === "satellite" ? satelliteUrl : streetsUrl, {
        maxZoom: 19,
        attribution: "Esri / OpenStreetMap",
      }).addTo(map);
      tileLayerRef.current = currentLayer;

      // Custom User Marker Icon
      const userIcon = L.divIcon({
        className: "qibla-map-user-pin",
        html: `
          <div class="user-pulse-ring"></div>
          <div class="user-center-dot">
            <i class="fa-solid fa-person-praying"></i>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Custom Kaaba Marker Icon
      const kaabaIcon = L.divIcon({
        className: "qibla-map-kaaba-pin",
        html: `
          <div class="kaaba-pin-glow"></div>
          <div class="kaaba-pin-box">
            <i class="fa-solid fa-kaaba"></i>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Add user marker
      const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
      userMarker.bindPopup(`<strong>${userName}</strong><br/>${userLat.toFixed(5)}°, ${userLng.toFixed(5)}°`);

      // Add Kaaba marker
      const kaabaMarker = L.marker([KAABA_LAT, KAABA_LNG], { icon: kaabaIcon }).addTo(map);
      kaabaMarker.bindPopup(`<strong>Ka'bah Al-Mukarramah</strong><br/>Masjidil Haram, Makkah`);

      // Calculate forward direction ray vector (extended 2 km forward from user along bearing)
      // 1 deg latitude is approx 111 km. 2 km is approx 0.018 deg
      const rayDistanceKm = 3;
      const earthRadius = 6371;
      const brngRad = (bearing * Math.PI) / 180;
      const lat1 = (userLat * Math.PI) / 180;
      const lon1 = (userLng * Math.PI) / 180;

      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(rayDistanceKm / earthRadius) +
          Math.cos(lat1) * Math.sin(rayDistanceKm / earthRadius) * Math.cos(brngRad)
      );
      const lon2 =
        lon1 +
        Math.atan2(
          Math.sin(brngRad) * Math.sin(rayDistanceKm / earthRadius) * Math.cos(lat1),
          Math.cos(rayDistanceKm / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
        );

      const rayEndLat = (lat2 * 180) / Math.PI;
      const rayEndLng = (lon2 * 180) / Math.PI;

      // 1. Local direction beam (Thick high-contrast ray for local orientation relative to streets/houses)
      L.polyline([[userLat, userLng], [rayEndLat, rayEndLng]], {
        color: "#ffd700",
        weight: 5,
        opacity: 0.95,
        dashArray: "10, 8",
        lineCap: "round",
      }).addTo(map);

      // 2. Global Great-Circle Line to Kaaba
      L.polyline([[userLat, userLng], [KAABA_LAT, KAABA_LNG]], {
        color: "#2bb97c",
        weight: 3,
        opacity: 0.8,
      }).addTo(map);

      // Invalidate size after mount to ensure smooth render
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLat, userLng, userName, bearing, mapType]);

  const handleCenterUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLat, userLng], 18, { animate: true });
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds([
        [userLat, userLng],
        [KAABA_LAT, KAABA_LNG],
      ], { padding: [50, 50] });
    }
  };

  return (
    <div className="qibla-map-wrapper">
      {/* Map Control Bar */}
      <div className="qibla-map-header">
        <div className="qibla-map-info-badge">
          <i className="fa-solid fa-satellite-dish" style={{ color: "var(--gold-main)" }}></i>
          <span>
            {locale === "ar"
              ? "خط القبلة المباشر نحو الكعبة"
              : locale === "en"
              ? "Direct Geodesic Line to Kaaba"
              : "Garis Geodesik Kiblat ke Ka'bah"}
          </span>
          <strong style={{ color: "#ffd700" }}>{bearing}°</strong>
          <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>({angleFromWest}° U-B)</span>
        </div>

        <div className="qibla-map-actions">
          <button
            type="button"
            className="btn-map-control"
            onClick={() => setMapType(mapType === "satellite" ? "streets" : "satellite")}
            title="Ganti Tampilan Peta Satelit / Jalan"
          >
            <i className={`fa-solid ${mapType === "satellite" ? "fa-map" : "fa-satellite"}`}></i>
            <span>{mapType === "satellite" ? "Peta Jalan" : "Satelit"}</span>
          </button>

          <button
            type="button"
            className="btn-map-control"
            onClick={handleCenterUser}
            title="Pusatkan ke Rumah / Lokasi Anda"
          >
            <i className="fa-solid fa-crosshairs"></i>
            <span>Lokasi Saya (Zoom)</span>
          </button>

          <button
            type="button"
            className="btn-map-control"
            onClick={handleFitAll}
            title="Lihat Garis Penuh ke Makkah"
          >
            <i className="fa-solid fa-earth-asia"></i>
            <span>Jalur ke Makkah</span>
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="qibla-map-canvas" ref={mapContainerRef}></div>

      {/* Explanation Banner */}
      <div className="qibla-map-footer-hint">
        <i className="fa-solid fa-compass-drafting" style={{ color: "var(--gold-main)" }}></i>
        <span>
          {locale === "ar"
            ? "يقدم خط القمر الصناعي الأصفر اتجاهاً ثابتاً لا يتأثر بالتشويش المغناطيسي الداخلي. وجه سجادتك بمحاذاة هذا الخط بالنسبة لمبنى غرفتك أو شارعك."
            : locale === "en"
            ? "The yellow satellite line provides an absolute reference immune to indoor magnetic interference. Align your prayer rug with this line relative to your room walls or street."
            : "Garis kuning satelit adalah acuan visual mutlak yang 100% bebas dari gangguan magnetik dalam ruangan. Sejajarkan sajadah Anda dengan garis kuning ini terhadap dinding kamar atau jalan di depan rumah Anda."}
        </span>
      </div>
    </div>
  );
}
