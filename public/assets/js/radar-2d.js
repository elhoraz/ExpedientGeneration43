/**
 * radar-2d.js — Engine untuk 6 Varian Peta Datar (Flat Maps) menggunakan Leaflet.js
 */
function initRadar2D() {
    if (typeof window.L === 'undefined') {
        setTimeout(initRadar2D, 100);
        return;
    }
    const elem = document.getElementById('mapViz');
    if (!elem) {
        setTimeout(initRadar2D, 100);
        return;
    }

    let alumniData = window.__radarData || [];
    if (!Array.isArray(alumniData)) {
        alumniData = Object.values(alumniData);
    }
    const CENTER = { lat: -8.0358875, lng: 111.414528 };
    let centerNode = alumniData.find(n => n.type === 'center') || { ...CENTER, type: 'center', name: 'Pondok Modern Arrisalah', city: 'Ponorogo', nick: 'Arrisalah' };
    let agentNodes = alumniData.filter(n => n.type !== 'center');
    let filteredAgents = [...agentNodes];
    
    // ===== INIT LEAFLET MAP =====
    const isMobile = window.innerWidth <= 768;
    const initialZoom = isMobile ? 4 : 5;
    
    let map;
    try {
        if (window.__leafletMap) {
            try { window.__leafletMap.remove(); } catch(err) {}
            window.__leafletMap = null;
        }
        if (elem && elem._leaflet_id) {
            elem._leaflet_id = null;
        }
        // Matikan zoom control bawaan agar UI lebih bersih seperti globe
        map = L.map('mapViz', { zoomControl: false }).setView([CENTER.lat, CENTER.lng], initialZoom);
        window.__leafletMap = map;
        
        // Opsi untuk menyalakan kembali zoom control tapi di pojok kanan atas
        L.control.zoom({ position: 'topright' }).addTo(map);
    } catch(e) {
        console.error("Leaflet init error:", e);
        // Force remove loading screen if leaflet fails
        const rl = document.getElementById('radarLoading');
        if (rl) rl.style.display = 'none';
        return;
    }

    // ===== MEMILIH TILE LAYER (6 VARIAN) =====
    let tileUrl = '';
    let tileAttribution = '';
    let layerMaxZoom = 19;
    let nativeZoom = 19;
    
    const style = window.__mapStyle || 'classic';
    
    switch(style) {
        case 'natgeo':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri &mdash; National Geographic';
            layerMaxZoom = 16;
            nativeZoom = 16;
            break;
        case 'voyager':
            tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
            tileAttribution = '&copy; CARTO';
            break;
        case 'hybrid': 
            tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
            tileAttribution = '&copy; Google';
            layerMaxZoom = 21;
            nativeZoom = 21;
            break;
        case 'graycanvas':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri';
            layerMaxZoom = 16;
            nativeZoom = 16;
            break;
        case 'hot':
            tileUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
            tileAttribution = '&copy; OpenStreetMap contributors, HOT OSM';
            break;
        case 'googleterrain':
            tileUrl = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
            tileAttribution = '&copy; Google';
            layerMaxZoom = 21;
            nativeZoom = 21;
            break;
        case 'esriclarity':
            tileUrl = 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri';
            layerMaxZoom = 21;
            nativeZoom = 21;
            break;
        case 'nightnav':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri';
            layerMaxZoom = 16;
            nativeZoom = 16;
            break;
        case 'googletransit':
            tileUrl = 'https://mt1.google.com/vt/lyrs=m,r&x={x}&y={y}&z={z}';
            tileAttribution = '&copy; Google';
            layerMaxZoom = 20;
            break;
        case 'physical':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri &mdash; US National Park Service';
            layerMaxZoom = 8;
            nativeZoom = 8;
            break;
        case 'nasamarble':
            tileUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.png';
            tileAttribution = '&copy; NASA Earth Observations (GIBS)';
            layerMaxZoom = 8;
            nativeZoom = 8;
            break;
        case 'googletraffic':
            tileUrl = 'https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}';
            tileAttribution = '&copy; Google';
            layerMaxZoom = 21;
            nativeZoom = 21;
            break;
        case 'navigation':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/World_Navigation_Charts/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri &mdash; Marine & Aviation Charts';
            layerMaxZoom = 10;
            nativeZoom = 10;
            break;
        case 'esristreet':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri';
            layerMaxZoom = 21;
            nativeZoom = 21;
            break;
        case 'toner':
            tileUrl = 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png';
            tileAttribution = '&copy; Stadia Maps, &copy; Stamen Design';
            break;
        case 'minimalist': // Menggantikan flat
            tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            tileAttribution = '&copy; <a href="https://carto.com/attributions">CARTO</a>';
            break;
        case 'satellite':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            tileAttribution = 'Tiles &copy; Esri';
            layerMaxZoom = 21;
            nativeZoom = 21;
            break;
        case 'terrain':
            tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
            tileAttribution = '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
            layerMaxZoom = 17;
            nativeZoom = 17;
            break;
        case 'dark':
            tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            tileAttribution = '&copy; CARTO';
            break;
        case 'google': // Google Streets
            tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
            tileAttribution = '&copy; Google';
            layerMaxZoom = 21;
            nativeZoom = 21;
            break;
        case 'classic': // Default OSM
        default:
            tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            tileAttribution = '&copy; OpenStreetMap';
            layerMaxZoom = 19;
            break;
    }

    // Force map component to limit zooming strictly
    map.options.maxZoom = layerMaxZoom;

    L.tileLayer(tileUrl, {
        attribution: tileAttribution,
        maxZoom: layerMaxZoom,
        maxNativeZoom: nativeZoom
    }).addTo(map);

    // ===== UTILS =====
    const haversine = (a, b) => {
        if (!a || !b || !a.lat || !b.lat) return 0;
        const R = 6371, toR = Math.PI / 180;
        const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
        const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
        return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    };

    // ===== 4. ANIMATED STATS =====
    const animateNum = (el, target, suffix = '') => {
        if (!el) return;
        if (target === 0) { el.innerText = '0' + suffix; return; }
        let cur = 0; const step = Math.max(1, Math.ceil(target / 40));
        const iv = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(iv); } el.innerText = cur + suffix; }, 30);
    };
    const updateStats = (agents) => {
        const uniqueCities = new Set(agents.map(n => n.city)).size;
        let maxDist = 0;
        agents.forEach(a => { const d = haversine(CENTER, a); if (d > maxDist) maxDist = d; });
        animateNum(document.getElementById('sTotal'), agents.length);
        animateNum(document.getElementById('sArea'), uniqueCities);
        animateNum(document.getElementById('sFar'), maxDist);
    };

    // ===== 12. LEADERBOARD =====
    const buildLeaderboard = (agents) => {
        const counts = {};
        agents.forEach(a => { const c = a.city || 'Unknown'; counts[c] = (counts[c] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const max = sorted[0]?.[1] || 1;
        const lbEl = document.getElementById('lbContent');
        lbEl.innerHTML = sorted.map(([city, count], i) =>
            `<div class="lb-row">
                <span class="lb-rank">${i + 1}</span>
                <span class="lb-city">${city.length > 18 ? city.substring(0, 18) + '…' : city}</span>
                <div class="lb-bar-wrap"><div class="lb-bar" style="width:${(count / max) * 100}%"></div></div>
                <span class="lb-count">${count}</span>
            </div>`
        ).join('');
    };

    // ===== RENDERING MARKERS =====
    let markerLayerGroup = L.layerGroup().addTo(map);
    let allMarkers = {}; // Store reference to markers by ID

    const renderMarkers = (agents) => {
        markerLayerGroup.clearLayers();
        allMarkers = {};

        // Render Center Node First
        const centerMarker = L.circleMarker([centerNode.lat, centerNode.lng], {
            radius: 8,
            fillColor: '#d4af37',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(markerLayerGroup);
        
        centerMarker.bindPopup(`<b>${centerNode.name}</b><br/>${centerNode.city}`);

        // Render Agents
        agents.forEach(a => {
            if (!a.lat || !a.lng) return;
            
            // Adjust marker color based on map style for better visibility
            let fillColor = '#ffffff';
            let strokeColor = '#d4af37';
            
            if (style === 'minimalist' || style === 'classic') {
                fillColor = '#d4af37';
                strokeColor = '#ffffff';
            }

            const marker = L.circleMarker([a.lat, a.lng], {
                radius: 5,
                fillColor: fillColor,
                color: strokeColor,
                weight: 1.5,
                opacity: 0.8,
                fillOpacity: 0.8
            }).addTo(markerLayerGroup);

            // Bind tooltip (hover)
            marker.bindTooltip(`<b>${a.name}</b><br/><i class="fa-solid fa-location-dot" style="color:#d4af37;"></i> ${a.city}`, {
                className: 'globe-tooltip', 
                direction: 'top',
                offset: [0, -10]
            });

            // On click
            marker.on('click', () => {
                openDrawer(a);
            });

            allMarkers[a.id] = marker;
        });
    };

    // ===== 1. CINEMATIC LOADING =====
    setTimeout(() => {
        try {
            renderMarkers(filteredAgents);
            updateStats(agentNodes);
            buildLeaderboard(agentNodes);
        } catch (e) {
            console.error("Error rendering markers/stats:", e);
        } finally {
            const rl = document.getElementById('radarLoading');
            if (rl) {
                rl.style.opacity = '0';
                setTimeout(() => { if(rl) rl.style.display = 'none'; }, 400);
            }
        }
    }, 200);

    // ===== 2. INFO DRAWER =====
    const drawer = document.getElementById('infoDrawer');
    const overlay = document.getElementById('idOverlay');
    const openDrawer = (d) => {
        document.getElementById('idAvatar').src = d.foto ? '/uploads/profiles/' + d.foto : '/images/default-avatar.webp';
        document.getElementById('idName').textContent = d.name;
        document.getElementById('idNick').textContent = d.nick ? '"' + d.nick + '"' : '';
        document.getElementById('idCity').textContent = d.city;
        document.getElementById('idGender').textContent = d.gender || '-';
        document.getElementById('idDist').textContent = haversine(CENTER, d) + ' km';
        const waEl = document.getElementById('idWa');
        if (d.wa) { waEl.href = 'https://wa.me/' + d.wa.replace(/^0/, '62'); waEl.style.display = 'flex'; }
        else { waEl.style.display = 'none'; }
        document.getElementById('idProfile').href = '/syndicate';
        
        drawer.classList.add('open');
        overlay.classList.add('open');
        
        // 9. FLY TO MARKER
        map.flyTo([d.lat, d.lng], 12, { animate: true, duration: 1.5 });
    };
    const closeDrawer = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };
    document.getElementById('idClose').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // ===== 3. SEARCH =====
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        if (q.length < 2) { searchResults.classList.remove('open'); return; }
        const matches = agentNodes.filter(n => n.name.toLowerCase().includes(q) || (n.nick && n.nick.toLowerCase().includes(q))).slice(0, 8);
        if (!matches.length) { searchResults.classList.remove('open'); return; }
        searchResults.innerHTML = matches.map(m =>
            `<div class="sr-item" data-id="${m.id}">
                <img class="sr-avatar" src="${m.foto ? '/uploads/profiles/' + m.foto : '/images/default-avatar.webp'}" alt="">
                <div><div class="sr-name">${m.name}</div><div class="sr-city">${m.city}</div></div>
            </div>`
        ).join('');
        searchResults.classList.add('open');
        searchResults.querySelectorAll('.sr-item').forEach(el => {
            el.addEventListener('click', () => {
                const node = agentNodes.find(n => n.id == el.dataset.id);
                if (node) { openDrawer(node); searchResults.classList.remove('open'); searchInput.value = ''; }
            });
        });
    });
    document.addEventListener('click', e => { if (!e.target.closest('.search-pill') && !e.target.closest('.search-results')) searchResults.classList.remove('open'); });

    // ===== 6. MAP DROPDOWN =====
    const btnMap = document.getElementById('btnMapMenu');
    const mapDD = document.getElementById('mapDropdown');
    btnMap.addEventListener('click', () => mapDD.classList.toggle('open'));
    document.addEventListener('click', e => { if (!e.target.closest('.map-dropdown-wrap')) mapDD.classList.remove('open'); });

    // ===== 8. FILTER =====
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const f = chip.dataset.filter;
            if (f === 'lb') {
                document.getElementById('leaderboard').classList.toggle('open');
                chip.classList.toggle('active');
                return;
            }
            document.querySelectorAll('.filter-chip').forEach(c => { if (c.dataset.filter !== 'lb') c.classList.remove('active'); });
            chip.classList.add('active');
            
            if (f === 'all') filteredAgents = [...agentNodes];
            else if (f === 'L') filteredAgents = agentNodes.filter(n => n.gender === 'Laki-laki');
            else if (f === 'P') filteredAgents = agentNodes.filter(n => n.gender === 'Perempuan');
            
            renderMarkers(filteredAgents);
            updateStats(filteredAgents);
            buildLeaderboard(filteredAgents);
            
            // Re-center map to fit all new markers
            if (filteredAgents.length > 0) {
                const group = new L.featureGroup(Object.values(allMarkers));
                if (group.getBounds().isValid()) {
                    map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 8 });
                }
            }
        });
    });

    // ===== 11. CINEMATIC TOUR =====
    const btnTour = document.getElementById('btnAutoTour');
    const tourOverlay = document.getElementById('tourOverlay');
    let isTouring = false, tourInterval;
    btnTour.addEventListener('click', () => {
        if (isTouring) {
            clearInterval(tourInterval);
            map.flyTo([CENTER.lat, CENTER.lng], initialZoom);
            btnTour.innerHTML = '<i class="fa-solid fa-plane-departure"></i> <span class="hide-mobile">Jelajahi </span>Jaringan';
            tourOverlay.classList.remove('show');
            isTouring = false;
        } else {
            isTouring = true;
            btnTour.innerHTML = '<i class="fa-solid fa-stop"></i> <span class="hide-mobile">Hentikan </span>Jelajah';
            const nodes = filteredAgents.filter(n => n.lat && n.lng);
            if (!nodes.length) return;
            let idx = 0;
            const fly = () => {
                if (idx >= nodes.length) idx = 0;
                const t = nodes[idx];
                
                map.flyTo([t.lat, t.lng], 10, { animate: true, duration: 2 });
                
                // Tour overlay
                document.getElementById('tourName').textContent = t.name;
                document.getElementById('tourCity').textContent = t.city + ' • ' + haversine(CENTER, t) + ' km dari Pondok';
                tourOverlay.classList.add('show');
                setTimeout(() => tourOverlay.classList.remove('show'), 4500);
                idx++;
            };
            fly();
            tourInterval = setInterval(fly, 5500);
        }
    });

    // ===== SYNC LOCATION =====
    const btnSync = document.getElementById('btnSyncLocation');
    const statusEl = document.getElementById('syncStatus');
    const showStatus = (msg, color = '#d4af37') => { statusEl.innerText = msg; statusEl.style.color = color; statusEl.style.opacity = 1; };
    const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    btnSync.addEventListener('click', () => {
        if (!('geolocation' in navigator)) { showStatus('GPS tidak didukung.', '#ff3366'); return; }
        btnSync.disabled = true;
        showStatus('Mengakses GPS...');
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude: lat, longitude: lng } = pos.coords;
                showStatus('Menyelaraskan...');
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`)
                    .then(r => r.ok ? r.json() : {})
                    .catch(err => { console.warn('Geocoding blocked or failed:', err); return {}; }) // Fallback API Geolocation
                    .then(geo => {
                        const city = geo.city || geo.locality || geo.principalSubdivision || 'Dari Titik Radar';
                        const payload = { latitude: lat, longitude: lng, city: city };
                        return fetch('/api/radar/update-location', { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify(payload) 
                        });
                    })
                    .then(async r => {
                        const text = await r.text();
                        let data;
                        try { data = JSON.parse(text); } catch(e) { throw new Error('Response tidak valid: ' + text.substring(0, 100)); }
                        if (!r.ok) throw new Error(data.message || data.error || 'Server error ' + r.status);
                        return data;
                    })
                    .then(data => {
                        if (data.status === 'success' || data.success) {
                            showStatus('Berhasil disimpan!', '#4ade80');
                            try {
                                localStorage.setItem('expedient_quest_radar', 'true');
                                window.dispatchEvent(new CustomEvent('expedient-quest-updated'));
                            } catch(e) {}
                            setTimeout(() => location.reload(), 1500);
                        }
                        else throw new Error(data.message || data.error || 'Gagal menyimpan');
                    })
                    .catch(err => { showStatus('Gagal: ' + err.message, '#ff3366'); btnSync.disabled = false; });
            },
            () => { showStatus('Izin lokasi ditolak.', '#ff3366'); btnSync.disabled = false; },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    });

    // ===== 10. PUSHER REALTIME NOTIFICATION =====
    try {
        if (window.Pusher) {
            const pusher = new Pusher(window.__pusherKey || 'app-key', { cluster: window.__pusherCluster || 'ap1', forceTLS: true });
            const ch = pusher.subscribe('radar');
            ch.bind('location-updated', data => {
                if (data && data.name) {
                    const toast = document.getElementById('aegisToast');
                    if (toast) {
                        document.getElementById('radarName').textContent = data.name + ' memperbarui domisili';
                        toast.classList.add('show');
                        setTimeout(() => toast.classList.remove('show'), 5000);
                    }
                }
            });
        }
    } catch (e) { /* Pusher not available, silently ignore */ }
}

window.initRadar2D = initRadar2D;
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRadar2D);
    } else {
        initRadar2D();
    }
}
