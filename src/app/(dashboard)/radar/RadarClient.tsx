"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mountRadar2D, destroyRadar2D } from "./radar2dEngine";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { RadarSkeleton } from "@/components/ui/skeletons/SkeletonMedia";
import "leaflet/dist/leaflet.css";
import "./radar.css";

function RadarMapContent({ nodes }: { nodes: any[] }) {
    const { t } = useLanguage();
    const { showAlert, showConfirm } = useConfirm();
    const [isClient, setIsClient] = useState(false);
    const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const explicitMapParam = searchParams.get("map");
    const isLitePref =
        typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-perf") === "lite";
    const mapStyle = explicitMapParam || (isLitePref ? "minimalist" : "globe");

    const is3DMode = ["globe", "night", "satellite-3d", "day", "water", "topology"].includes(mapStyle);

    const selectMapStyle = (targetStyle: string) => {
        setIsMapMenuOpen(false);
        const targetIs3D = ["globe", "night", "satellite-3d", "day", "water", "topology"].includes(targetStyle);
        // Avoid full reload when switching across Leaflet 2D layers
        if (!is3DMode && !targetIs3D) {
            router.replace(`/radar?map=${targetStyle}`, { scroll: false });
            return;
        }
        window.location.href = `/radar?map=${targetStyle}`;
    };

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        setIsClient(true);
        document.body.classList.add('page-radar');
        return () => {
            document.body.classList.remove('page-radar');
        };
    }, []);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.map-dropdown-wrap')) {
                setIsMapMenuOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMapMenuOpen(false);
                const drawer = document.getElementById('infoDrawer');
                if (drawer?.classList.contains('open')) {
                    document.getElementById('idClose')?.click();
                }
            }
        };
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!isClient) return;

        (window as any).__radarData = nodes;
        (window as any).__mapStyle = mapStyle;

        // Tambah class page-radar ke body agar overflow:hidden hanya aktif di halaman ini
        document.body.classList.add('page-radar');

        // Skip loader instantly if previously loaded
        if (sessionStorage.getItem('aegis_transit')) {
            const loader = document.getElementById('radarLoading');
            if (loader) loader.style.display = 'none';
        }

        // Mount 2D Leaflet map natively if in 2D mode
        const confirmDeleteLoc = () =>
            showConfirm(
                'Hapus Titik Lokasi',
                'Apakah antum yakin ingin menghapus titik koordinat lokasi dari Radar?'
            );
        (window as any).__radarConfirmDeleteLocation = confirmDeleteLoc;

        if (!is3DMode) {
            mountRadar2D({
                containerId: 'mapViz',
                nodes,
                style: mapStyle,
                onConfirmDeleteLocation: confirmDeleteLoc,
            });
        } else if (typeof (window as any).__expedientMountRadarGlobe === 'function') {
            (window as any).__expedientMountRadarGlobe();
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

        return () => {
            clearTimeout(failsafeTimer);
            supabase.removeChannel(channel);
            document.body.classList.remove('page-radar');
            delete (window as any).__radarConfirmDeleteLocation;
            if (!is3DMode) {
                destroyRadar2D();
            } else if (typeof (window as any).__expedientDestroyRadarGlobe === 'function') {
                (window as any).__expedientDestroyRadarGlobe();
            }
        };
    }, [isClient, nodes, mapStyle, is3DMode, showConfirm, supabase]);

    if (!isClient) return null;

    return (
        <>

            <div id="radarLoading" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-main, #060b14)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.6s ease' }}>
                <div className="rl-ring" style={{ width: '80px', height: '80px', border: '2px solid rgba(212,175,55,0.15)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'rlSpin 1s linear infinite', marginBottom: '30px' }}></div>
                <div className="rl-txt" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', color: '#d4af37', letterSpacing: '6px', textTransform: 'uppercase', animation: 'rlFade 2s ease-in-out infinite' }}>{t.radar.network_title}</div>
                <div className="rl-sub" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '3px', marginTop: '10px' }}>{t.radar.network_sub}</div>
            </div>

            {is3DMode ? (
                <>
                    <canvas id="starField"></canvas>
                    <div id="globeViz" style={{ position: 'fixed', inset: 0, zIndex: 2, cursor: 'grab' }}></div>
                </>
            ) : (
                <>
                    <div id="mapViz" style={{ position: 'fixed', inset: 0, zIndex: 2, background: '#080b10', cursor: 'grab', touchAction: 'none' }}></div>
                </>
            )}

            <div className="radar-top-bar">
                <div className="radar-hud" style={{ zIndex: 50 }}>
                    <div className="hud-title">{t.radar.title} <span className="status-dot"></span></div>
                    <div className="hud-subtitle">{t.radar.subtitle}</div>
                    <div className="stats-panel">
                        <div className="stat-box"><div className="stat-num" id="sTotal">0</div><div className="stat-label">{t.radar.stat_points}</div></div>
                        <div className="stat-box"><div className="stat-num" id="sArea">0</div><div className="stat-label">{t.radar.stat_cities}</div></div>
                        <div className="stat-box"><div className="stat-num" id="sFar">0</div><div className="stat-label">{t.radar.stat_countries}</div></div>
                    </div>
                </div>

                <div className="radar-search-wrap">
                    <div className="search-pill" style={{ zIndex: 60 }}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="searchInput" placeholder={t.common.search} autoComplete="off" />
                    </div>
                    <div className="search-results" id="searchResults" style={{ zIndex: 60 }}></div>
                </div>
            </div>

            <div className="tour-overlay" id="tourOverlay" style={{ zIndex: 55 }}>
                <div className="tour-name" id="tourName"></div>
                <div className="tour-city" id="tourCity"></div>
            </div>

            <div className="filter-panel" id="filterPanel" style={{ zIndex: 50 }}>
                <div className="filter-chip active" data-filter="all"><i className="fa-solid fa-globe"></i> {t.common.all}</div>
                <div className="filter-chip" data-filter="L"><i className="fa-solid fa-mars"></i> {t.direktori.filter_gender_male}</div>
                <div className="filter-chip" data-filter="P"><i className="fa-solid fa-venus"></i> {t.direktori.filter_gender_female}</div>
                <div className="filter-chip" data-filter="lb"><i className="fa-solid fa-trophy"></i> Leaderboard</div>
            </div>

            <div className="leaderboard" id="leaderboard" style={{ zIndex: 49 }}>
                <div className="lb-title"><i className="fa-solid fa-trophy" style={{ marginRight: "6px" }}></i>{t.radar.top_cities}</div>
                <div id="lbContent"></div>
            </div>

            <div className="radar-controls" style={{ zIndex: 50 }}>
                <button type="button" className="btn-radar btn-radar-gold" id="btnSyncLocation" title={t.radar.update_loc_title}>
                    <i className="fa-solid fa-location-crosshairs" aria-hidden="true"></i>
                    <span className="btn-radar-text">{t.radar.update_loc}</span>
                </button>
                <button
                    type="button"
                    className="btn-radar btn-radar-glass"
                    id="btnDeleteLocation"
                    title="Hapus lokasi saya dari radar (privasi)"
                    style={{ color: "#f87171" }}
                >
                    <i className="fa-solid fa-location-slash" aria-hidden="true"></i>
                    <span className="btn-radar-text">Sembunyikan Lokasi</span>
                </button>
                <button type="button" className="btn-radar btn-radar-glass" id="btnAutoTour" title={t.radar.tour_map_title}>
                    <i className="fa-solid fa-plane-departure" aria-hidden="true"></i>
                    <span className="btn-radar-text">{t.radar.tour_map}</span>
                </button>
                <div className="sync-status" id="syncStatus"></div>
                <div className="map-dropdown-wrap">
                    <button
                        type="button"
                        className="btn-radar btn-radar-glass"
                        id="btnMapMenu"
                        aria-expanded={isMapMenuOpen}
                        aria-haspopup="menu"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMapMenuOpen(!isMapMenuOpen);
                        }}
                        title={t.radar.change_map}
                    >
                        <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
                        <span className="btn-radar-text">{t.radar.change_map}</span>
                    </button>
                    <div className={`map-dropdown ${isMapMenuOpen ? 'open' : ''}`} id="mapDropdown" role="menu">
                        <button type="button" onClick={() => selectMapStyle('globe')}><i className="fa-solid fa-earth-asia" aria-hidden="true"></i> {t.radar_layers?.globe || "Globe 3D"}</button>
                        <button type="button" onClick={() => selectMapStyle('minimalist')}><i className="fa-solid fa-map" aria-hidden="true"></i> {t.radar_layers?.minimalist || "Peta Datar"}</button>
                        <button type="button" onClick={() => selectMapStyle('satellite')}><i className="fa-solid fa-satellite" aria-hidden="true"></i> {t.radar_layers?.satellite || "Peta Satelit"}</button>
                        <button type="button" onClick={() => selectMapStyle('terrain')}><i className="fa-solid fa-mountain-sun" aria-hidden="true"></i> {t.radar_layers?.terrain || "Peta Terrain"}</button>
                        <button type="button" onClick={() => selectMapStyle('dark')}><i className="fa-solid fa-moon" aria-hidden="true"></i> {t.radar_layers?.dark || "Peta Gelap"}</button>
                        <button type="button" onClick={() => selectMapStyle('google')}><i className="fa-solid fa-map-location-dot" aria-hidden="true"></i> {t.radar_layers?.google || "Peta Google"}</button>
                        <button type="button" onClick={() => selectMapStyle('classic')}><i className="fa-solid fa-signs-post" aria-hidden="true"></i> {t.radar_layers?.classic || "Peta Klasik"}</button>
                        <button type="button" onClick={() => selectMapStyle('natgeo')}><i className="fa-solid fa-compass" aria-hidden="true"></i> {t.radar_layers?.natgeo || "Peta NatGeo"}</button>
                        <button type="button" onClick={() => selectMapStyle('voyager')}><i className="fa-solid fa-paper-plane" aria-hidden="true"></i> {t.radar_layers?.voyager || "Peta Voyager"}</button>
                        <button type="button" onClick={() => selectMapStyle('hybrid')}><i className="fa-solid fa-satellite-dish" aria-hidden="true"></i> {t.radar_layers?.hybrid || "Peta Hybrid"}</button>
                        <button type="button" onClick={() => selectMapStyle('graycanvas')}><i className="fa-solid fa-palette" aria-hidden="true"></i> {t.radar_layers?.graycanvas || "Peta Kanvas"}</button>
                        <button type="button" onClick={() => selectMapStyle('hot')}><i className="fa-solid fa-train-subway" aria-hidden="true"></i> {t.radar_layers?.hot || "Peta HOT"}</button>
                        <button type="button" onClick={() => selectMapStyle('googleterrain')}><i className="fa-solid fa-mountain" aria-hidden="true"></i> {t.radar_layers?.googleterrain || "Peta Rupa Bumi"}</button>
                        <button type="button" onClick={() => selectMapStyle('esriclarity')}><i className="fa-solid fa-cloud-sun" aria-hidden="true"></i> {t.radar_layers?.esriclarity || "Peta Satelit Bersih"}</button>
                        <button type="button" onClick={() => selectMapStyle('nightnav')}><i className="fa-solid fa-car-tunnel" aria-hidden="true"></i> {t.radar_layers?.nightnav || "Peta Navigasi Malam"}</button>
                        <button type="button" onClick={() => selectMapStyle('googletransit')}><i className="fa-solid fa-car" aria-hidden="true"></i> {t.radar_layers?.googletransit || "Peta Google Standar"}</button>
                        <button type="button" onClick={() => selectMapStyle('physical')}><i className="fa-solid fa-mound" aria-hidden="true"></i> {t.radar_layers?.physical || "Peta Relief"}</button>
                        <button type="button" onClick={() => selectMapStyle('nasamarble')}><i className="fa-solid fa-star" aria-hidden="true"></i> {t.radar_layers?.nasamarble || "Peta NASA Malam"}</button>
                        <button type="button" onClick={() => selectMapStyle('googletraffic')}><i className="fa-solid fa-traffic-light" aria-hidden="true"></i> {t.radar_layers?.googletraffic || "Peta Lalu Lintas"}</button>
                        <button type="button" onClick={() => selectMapStyle('navigation')}><i className="fa-solid fa-anchor" aria-hidden="true"></i> {t.radar_layers?.navigation || "Peta Navigasi Laut"}</button>
                        <button type="button" onClick={() => selectMapStyle('esristreet')}><i className="fa-solid fa-city" aria-hidden="true"></i> {t.radar_layers?.esristreet || "Peta Tata Kota"}</button>
                        <button type="button" onClick={() => selectMapStyle('toner')}><i className="fa-solid fa-microchip" aria-hidden="true"></i> {t.radar_layers?.toner || "Peta Kontras Tinggi (Toner)"}</button>
                    </div>
                </div>
            </div>

            <div className="id-overlay" id="idOverlay" style={{ zIndex: 10005 }}></div>
            <div className="info-drawer" id="infoDrawer" role="dialog" aria-modal="true" aria-label={t.radar.view_profile} style={{ zIndex: 10010 }}>
                <button type="button" className="id-close" id="idClose" aria-label={t.common.close}><i className="fa-solid fa-xmark" aria-hidden="true"></i></button>
                <div className="id-header">
                    <img id="idAvatar" className="id-avatar" src="/images/default-avatar.webp" alt="" />
                    <div className="id-name" id="idName"></div>
                    <div className="id-nick" id="idNick"></div>
                </div>
                <div className="id-body">
                    <div className="id-row"><i className="fa-solid fa-location-dot" aria-hidden="true"></i><div><div className="id-row-label">{t.radar.domicile}</div><div className="id-row-val" id="idCity"></div></div></div>
                    <div className="id-row"><i className="fa-solid fa-venus-mars" aria-hidden="true"></i><div><div className="id-row-label">{t.radar.gender}</div><div className="id-row-val" id="idGender"></div></div></div>
                    <div className="id-row"><i className="fa-solid fa-ruler" aria-hidden="true"></i><div><div className="id-row-label">{t.radar.dist_from_pondok}</div><div className="id-row-val" id="idDist"></div></div></div>
                </div>
                <div className="id-actions">
                    <a className="id-btn id-btn-wa" id="idWa" href="#" target="_blank" rel="noopener noreferrer" onClick={(e) => {
                        if (e.currentTarget.getAttribute('href') === '#') {
                            e.preventDefault();
                            void showAlert(t.radar.contact_wa, t.radar.wa_not_available);
                        }
                    }}><i className="fa-brands fa-whatsapp" aria-hidden="true"></i> {t.radar.contact_wa}</a>
                    <a className="id-btn id-btn-profile" id="idProfile" href="#"><i className="fa-solid fa-user" aria-hidden="true"></i> {t.radar.view_profile}</a>
                </div>
            </div>

            {is3DMode && (
                <>
                    <Script src="/vendor/globe/globe.gl.min.js" strategy="afterInteractive" />
                    <Script src="/assets/js/radar-globe.js?v=2.0" strategy="afterInteractive" />
                </>
            )}
        </>
    );
}

export default function RadarClient({ nodes }: { nodes: any[] }) {
    return (
        <Suspense fallback={<RadarSkeleton />}>
            <RadarMapContent nodes={nodes} />
        </Suspense>
    )
}
