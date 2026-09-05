"use client";

import { useEffect, useState, Suspense } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "leaflet/dist/leaflet.css";
import "./radar.css";

function RadarMapContent({ nodes }: { nodes: any[] }) {
  const [isClient, setIsClient] = useState(false);
  const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const mapStyle = searchParams.get("map") || "globe";
  
  const is3DMode = ["globe", "night", "satellite-3d", "day", "water", "topology"].includes(mapStyle);

  const supabase = createClient();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
        if (!(e.target as Element).closest('.map-dropdown-wrap')) {
            setIsMapMenuOpen(false);
        }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsClient(true);
    (window as any).__radarData = nodes;
    (window as any).__mapStyle = mapStyle;

    // Tambah class page-radar ke body agar overflow:hidden hanya aktif di halaman ini
    document.body.classList.add('page-radar');

    // Skip loader instantly if previously loaded
    if (sessionStorage.getItem('aegis_transit')) {
        const loader = document.getElementById('radarLoading');
        if (loader) loader.style.display = 'none';
    }

    // Supabase Realtime for location updates
    const channel = supabase.channel('radar_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        if (payload.new && payload.new.lat && payload.new.lng) {
            if (!payload.old || payload.old.lat !== payload.new.lat || payload.old.lng !== payload.new.lng) {
                const name = payload.new.nama_panggilan || payload.new.nama_lengkap || "Seseorang";
                const toast = document.getElementById('aegisToast');
                if (toast) {
                    const radarNameEl = document.getElementById('radarName');
                    if (radarNameEl) radarNameEl.textContent = name + ' memperbarui domisili';
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 5000);
                }
            }
        }
      })
      .subscribe();

    // Safety failsafe: Ensure radarLoading NEVER gets stuck forever
    const failsafeTimer = setTimeout(() => {
        const loader = document.getElementById('radarLoading');
        if (loader && loader.style.display !== 'none') {
            loader.style.opacity = '0';
            setTimeout(() => { if (loader) loader.style.display = 'none'; }, 400);
        }
    }, 2500);

    // Trigger 2D radar init if already loaded on client
    if (!is3DMode && typeof (window as any).initRadar2D === 'function') {
        (window as any).initRadar2D();
    }

    return () => {
      clearTimeout(failsafeTimer);
      supabase.removeChannel(channel);
      // Hapus class saat keluar halaman radar
      document.body.classList.remove('page-radar');
      if (typeof window !== 'undefined' && (window as any).__leafletMap) {
        try {
          (window as any).__leafletMap.off();
          (window as any).__leafletMap.remove();
        } catch(e) {}
        (window as any).__leafletMap = null;
      }
    };
  }, [nodes, mapStyle, is3DMode]);

  if (!isClient) return null;

  return (
    <>
        <div id="radarLoading" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#030504', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: 'opacity 1.5s ease' }}>
            <div className="rl-ring" style={{ width: '80px', height: '80px', border: '2px solid rgba(212,175,55,0.15)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'rlSpin 1s linear infinite', marginBottom: '30px' }}></div>
            <div className="rl-txt" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', color: '#d4af37', letterSpacing: '6px', textTransform: 'uppercase', animation: 'rlFade 2s ease-in-out infinite' }}>Jaringan Silaturahmi</div>
            <div className="rl-sub" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '3px', marginTop: '10px' }}>Menghubungkan titik-titik persaudaraan...</div>
        </div>

        {is3DMode ? (
            <>
                <canvas id="starField"></canvas>
                <div id="globeViz" style={{ position: 'fixed', inset: 0, zIndex: 2, cursor: 'grab' }}></div>
            </>
        ) : (
            <>
                <div id="mapViz" style={{ position: 'fixed', inset: 0, zIndex: 2, background: '#000', cursor: 'grab' }}></div>
            </>
        )}

        <div className="search-pill" style={{ zIndex: 60 }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="searchInput" placeholder="Cari nama alumni..." autoComplete="off" />
        </div>
        <div className="search-results" id="searchResults" style={{ zIndex: 60 }}></div>

        <div className="radar-hud" style={{ zIndex: 50 }}>
            <div className="hud-title">Jaringan Silaturahmi <span className="status-dot"></span></div>
            <div className="hud-subtitle">Persebaran Alumni Global</div>
            <div className="stats-panel">
                <div className="stat-box"><div className="stat-num" id="sTotal">0</div><div className="stat-label">Total</div></div>
                <div className="stat-box"><div className="stat-num" id="sArea">0</div><div className="stat-label">Area</div></div>
                <div className="stat-box"><div className="stat-num" id="sFar">0</div><div className="stat-label">KM Terjauh</div></div>
            </div>
        </div>

        <div className="tour-overlay" id="tourOverlay" style={{ zIndex: 55 }}>
            <div className="tour-name" id="tourName"></div>
            <div className="tour-city" id="tourCity"></div>
        </div>

        <div className="filter-panel" id="filterPanel" style={{ zIndex: 50 }}>
            <div className="filter-chip active" data-filter="all"><i className="fa-solid fa-globe"></i> Semua</div>
            <div className="filter-chip" data-filter="L"><i className="fa-solid fa-mars"></i> Ikhwan</div>
            <div className="filter-chip" data-filter="P"><i className="fa-solid fa-venus"></i> Akhwat</div>
            <div className="filter-chip" data-filter="lb"><i className="fa-solid fa-trophy"></i> Leaderboard</div>
        </div>

        <div className="leaderboard" id="leaderboard" style={{ zIndex: 49 }}>
            <div className="lb-title"><i className="fa-solid fa-trophy" style={{ marginRight: "6px" }}></i>Top 5 Kota</div>
            <div id="lbContent"></div>
        </div>

        <div className="radar-controls" style={{ zIndex: 50 }}>
            <button className="btn-radar btn-radar-gold" id="btnSyncLocation"><i className="fa-solid fa-location-crosshairs"></i> <span className="hide-mobile">Perbarui </span>Domisili</button>
            <button className="btn-radar btn-radar-glass" id="btnAutoTour"><i className="fa-solid fa-plane-departure"></i> <span className="hide-mobile">Jelajahi </span>Jaringan</button>
            <div className="sync-status" id="syncStatus"></div>
            <div className="map-dropdown-wrap">
                <button 
                  className="btn-radar btn-radar-glass" 
                  id="btnMapMenu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMapMenuOpen(!isMapMenuOpen);
                  }}
                >
                  <i className="fa-solid fa-layer-group"></i> <span className="hide-mobile">Pilih </span>Peta
                </button>
                <div className={`map-dropdown ${isMapMenuOpen ? 'open' : ''}`} id="mapDropdown">
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=globe'; }}><i className="fa-solid fa-earth-asia"></i> Globe 3D</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=minimalist'; }}><i className="fa-solid fa-map"></i> Peta Datar</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=satellite'; }}><i className="fa-solid fa-satellite"></i> Peta Satelit</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=terrain'; }}><i className="fa-solid fa-mountain-sun"></i> Peta Terrain</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=dark'; }}><i className="fa-solid fa-moon"></i> Peta Gelap</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=google'; }}><i className="fa-solid fa-map-location-dot"></i> Peta Google</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=classic'; }}><i className="fa-solid fa-signs-post"></i> Peta Klasik</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=natgeo'; }}><i className="fa-solid fa-compass"></i> Peta NatGeo</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=voyager'; }}><i className="fa-solid fa-paper-plane"></i> Peta Voyager</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=hybrid'; }}><i className="fa-solid fa-satellite-dish"></i> Peta Hybrid</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=graycanvas'; }}><i className="fa-solid fa-palette"></i> Peta Kanvas</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=hot'; }}><i className="fa-solid fa-train-subway"></i> Peta HOT</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=googleterrain'; }}><i className="fa-solid fa-mountain"></i> Peta Rupa Bumi</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=esriclarity'; }}><i className="fa-solid fa-cloud-sun"></i> Peta Satelit Bersih</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=nightnav'; }}><i className="fa-solid fa-car-tunnel"></i> Peta Navigasi Malam</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=googletransit'; }}><i className="fa-solid fa-car"></i> Peta Google Standar</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=physical'; }}><i className="fa-solid fa-mound"></i> Peta Relief</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=nasamarble'; }}><i className="fa-solid fa-star"></i> Peta NASA Malam</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=googletraffic'; }}><i className="fa-solid fa-traffic-light"></i> Peta Lalu Lintas</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=navigation'; }}><i className="fa-solid fa-anchor"></i> Peta Navigasi Laut</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=esristreet'; }}><i className="fa-solid fa-city"></i> Peta Tata Kota</button>
                    <button onClick={() => { setIsMapMenuOpen(false); window.location.href = '/radar?map=toner'; }}><i className="fa-solid fa-microchip"></i> Peta Hacker (Toner)</button>
                </div>
            </div>
        </div>

        <div className="id-overlay" id="idOverlay" style={{ zIndex: 199 }}></div>
        <div className="info-drawer" id="infoDrawer" style={{ zIndex: 200 }}>
            <button className="id-close" id="idClose"><i className="fa-solid fa-xmark"></i></button>
            <div className="id-header">
                <img id="idAvatar" className="id-avatar" src="/images/default-avatar.webp" alt="" />
                <div className="id-name" id="idName"></div>
                <div className="id-nick" id="idNick"></div>
            </div>
            <div className="id-body">
                <div className="id-row"><i className="fa-solid fa-location-dot"></i><div><div className="id-row-label">Domisili</div><div className="id-row-val" id="idCity"></div></div></div>
                <div className="id-row"><i className="fa-solid fa-venus-mars"></i><div><div className="id-row-label">Gender</div><div className="id-row-val" id="idGender"></div></div></div>
                <div className="id-row"><i className="fa-solid fa-ruler"></i><div><div className="id-row-label">Jarak dari Pondok</div><div className="id-row-val" id="idDist"></div></div></div>
            </div>
            <div className="id-actions">
                <a className="id-btn id-btn-wa" id="idWa" href="#" target="_blank" onClick={(e) => {
                    if (e.currentTarget.getAttribute('href') === '#') {
                        e.preventDefault();
                        alert("Nomor WhatsApp tidak tersedia.");
                    }
                }}><i className="fa-brands fa-whatsapp"></i> Hubungi via WhatsApp</a>
                <a className="id-btn id-btn-profile" id="idProfile" href="#"><i className="fa-solid fa-user"></i> Lihat Profil</a>
            </div>
        </div>

        {is3DMode ? (
            <>
                <Script src="/vendor/globe/globe.gl.min.js" strategy="afterInteractive" />
                <Script src="/assets/js/radar-globe.js?v=2.0" strategy="afterInteractive" />
            </>
        ) : (
            <>
                <Script 
                    src="/vendor/leaflet/leaflet.js" 
                    strategy="afterInteractive" 
                />
                <Script 
                    src="/assets/js/radar-2d.js?v=2.2" 
                    strategy="afterInteractive" 
                    onLoad={() => {
                        if (typeof (window as any).initRadar2D === 'function') {
                            (window as any).initRadar2D();
                        }
                    }}
                />
            </>
        )}
    </>
  );
}

export default function RadarClient({ nodes }: { nodes: any[] }) {
    return (
        <Suspense fallback={<div>Loading Radar...</div>}>
            <RadarMapContent nodes={nodes} />
        </Suspense>
    )
}
