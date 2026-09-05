/**
 * radar2dEngine.ts — Engine Peta Datar (Flat Maps) berbasis Leaflet.js
 * Diintegrasikan langsung sebagai modul Next.js client-side murni tanpa ketergantungan script eksternal.
 */

import type LType from "leaflet";

let currentMap: LType.Map | null = null;
let currentMarkerGroup: LType.LayerGroup | null = null;
let currentTourInterval: any = null;

const CENTER = { lat: -8.0358875, lng: 111.414528 };

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  if (!a || !b || !a.lat || !b.lat) return 0;
  const R = 6371;
  const toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR;
  const dLng = (b.lng - a.lng) * toR;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

function animateNum(el: HTMLElement | null, target: number, suffix = '') {
  if (!el) return;
  if (target === 0) {
    el.innerText = '0' + suffix;
    return;
  }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const iv = setInterval(() => {
    cur += step;
    if (cur >= target) {
      cur = target;
      clearInterval(iv);
    }
    el.innerText = cur + suffix;
  }, 30);
}

function getTileConfig(style: string) {
  let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  let tileAttribution = '&copy; OpenStreetMap';
  let layerMaxZoom = 19;
  let nativeZoom = 19;

  switch (style) {
    case 'satellite':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      tileAttribution = 'Tiles &copy; Esri';
      layerMaxZoom = 21;
      nativeZoom = 19;
      break;
    case 'minimalist':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      tileAttribution = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
      layerMaxZoom = 16;
      nativeZoom = 16;
      break;
    case 'dark':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      tileAttribution = 'Tiles &copy; Esri';
      layerMaxZoom = 16;
      nativeZoom = 16;
      break;
    case 'terrain':
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      tileAttribution = '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
      layerMaxZoom = 17;
      nativeZoom = 17;
      break;
    case 'google':
      tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      tileAttribution = '&copy; Google';
      layerMaxZoom = 21;
      nativeZoom = 21;
      break;
    case 'natgeo':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}';
      tileAttribution = 'Tiles &copy; Esri &mdash; National Geographic';
      layerMaxZoom = 16;
      nativeZoom = 16;
      break;
    case 'voyager':
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      tileAttribution = 'Tiles &copy; Esri';
      layerMaxZoom = 19;
      nativeZoom = 19;
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
      layerMaxZoom = 19;
      nativeZoom = 19;
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
      nativeZoom = 20;
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
      layerMaxZoom = 19;
      nativeZoom = 19;
      break;
    case 'classic':
    default:
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileAttribution = '&copy; OpenStreetMap';
      layerMaxZoom = 19;
      nativeZoom = 19;
      break;
  }

  return { tileUrl, tileAttribution, layerMaxZoom, nativeZoom };
}

export interface MountRadar2DOptions {
  containerId: string;
  nodes: any[];
  style: string;
}

export async function mountRadar2D({ containerId, nodes, style }: MountRadar2DOptions) {
  if (typeof window === 'undefined') return;

  // Import Leaflet dynamically to prevent SSR errors
  const leafletModule = await import('leaflet');
  const L = leafletModule.default || leafletModule;
  (window as any).L = L;

  const elem = document.getElementById(containerId);
  if (!elem) {
    console.warn(`[Radar2D] Container #${containerId} not found.`);
    return;
  }

  // Teardown any existing Leaflet map instance
  destroyRadar2D();

  // Reset container attributes
  if ((elem as any)._leaflet_id) {
    delete (elem as any)._leaflet_id;
  }
  elem.innerHTML = '';

  const isMobile = window.innerWidth <= 768;
  const initialZoom = isMobile ? 4 : 5;

  let alumniData = Array.isArray(nodes) ? nodes : Object.values(nodes || {});
  const centerNode = alumniData.find(n => n.type === 'center') || {
    ...CENTER,
    type: 'center',
    name: 'Pondok Modern Arrisalah',
    city: 'Ponorogo',
    nick: 'Arrisalah'
  };
  const agentNodes = alumniData.filter(n => n.type !== 'center');
  let filteredAgents = [...agentNodes];

  // 1. Initialize Leaflet Map with dragging & touch gestures guaranteed
  const map = (L.map as any)(elem, {
    zoomControl: false,
    dragging: true,
    tap: false, // Disables broken tap handler in Leaflet for touch screens
    touchZoom: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    bounceAtZoomLimits: true
  }).setView([CENTER.lat, CENTER.lng], initialZoom) as LType.Map;

  if (map.dragging) {
    map.dragging.enable();
  }

  currentMap = map;
  (window as any).__leafletMap = map;
  (window as any).__currentMapStyle = style;

  // Add zoom control topright
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Invalidate map size after DOM settles to guarantee complete tile coverage
  setTimeout(() => { try { map.invalidateSize(); } catch(e) {} }, 100);
  setTimeout(() => { try { map.invalidateSize(); } catch(e) {} }, 400);

  // 2. Attach Tile Layer
  const { tileUrl, tileAttribution, layerMaxZoom, nativeZoom } = getTileConfig(style);
  map.options.maxZoom = layerMaxZoom;

  const tileLayer = L.tileLayer(tileUrl, {
    attribution: tileAttribution,
    maxZoom: layerMaxZoom,
    maxNativeZoom: nativeZoom
  }).addTo(map);

  // Hide loading spinner as soon as tiles load or after short safety timeout
  const hideLoader = () => {
    const rl = document.getElementById('radarLoading');
    if (rl) {
      rl.style.opacity = '0';
      setTimeout(() => { if (rl) rl.style.display = 'none'; }, 300);
    }
  };

  tileLayer.on('load', hideLoader);
  setTimeout(hideLoader, 400);

  // 3. Render Markers & Layer Group
  const markerGroup = L.layerGroup().addTo(map);
  currentMarkerGroup = markerGroup;
  (window as any).__leafletMarkerGroup = markerGroup;

  const allMarkers: Record<string, LType.CircleMarker> = {};

  const openDrawer = (d: any) => {
    const idAvatar = document.getElementById('idAvatar') as HTMLImageElement | null;
    const idName = document.getElementById('idName');
    const idNick = document.getElementById('idNick');
    const idCity = document.getElementById('idCity');
    const idGender = document.getElementById('idGender');
    const idDist = document.getElementById('idDist');
    const idWa = document.getElementById('idWa') as HTMLAnchorElement | null;
    const idProfile = document.getElementById('idProfile') as HTMLAnchorElement | null;

    if (idAvatar) idAvatar.src = d.foto ? d.foto : '/images/default-avatar.webp';
    if (idName) idName.textContent = d.name;
    if (idNick) idNick.textContent = d.nick ? `"${d.nick}"` : '';
    if (idCity) idCity.textContent = d.city;
    if (idGender) idGender.textContent = d.gender || '-';
    if (idDist) idDist.textContent = `${haversine(CENTER, d)} km`;
    if (idWa) {
      if (d.wa) {
        idWa.href = `https://wa.me/${d.wa.replace(/^0/, '62')}`;
        idWa.style.display = 'flex';
      } else {
        idWa.style.display = 'none';
      }
    }
    if (idProfile) idProfile.href = '/syndicate';

    const drawer = document.getElementById('infoDrawer');
    const overlay = document.getElementById('idOverlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');

    map.flyTo([d.lat, d.lng], 12, { animate: true, duration: 1.5 });
  };

  const closeDrawer = () => {
    const drawer = document.getElementById('infoDrawer');
    const overlay = document.getElementById('idOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  };

  const renderMarkers = (agents: any[]) => {
    markerGroup.clearLayers();
    Object.keys(allMarkers).forEach(k => delete allMarkers[k]);

    // Center marker (Arrisalah Ponorogo)
    const centerMarker = L.circleMarker([centerNode.lat, centerNode.lng], {
      radius: 8,
      fillColor: '#d4af37',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(markerGroup);

    centerMarker.bindPopup(`<b>${centerNode.name}</b><br/>${centerNode.city}`);

    // Agents
    agents.forEach(a => {
      if (!a.lat || !a.lng) return;

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
      }).addTo(markerGroup);

      marker.bindTooltip(`<b>${a.name}</b><br/><i class="fa-solid fa-location-dot" style="color:#d4af37;"></i> ${a.city}`, {
        className: 'globe-tooltip',
        direction: 'top',
        offset: [0, -10]
      });

      marker.on('click', () => {
        openDrawer(a);
      });

      allMarkers[a.id] = marker;
    });
  };

  const updateStats = (agents: any[]) => {
    const uniqueCities = new Set(agents.map(n => n.city)).size;
    let maxDist = 0;
    agents.forEach(a => {
      const d = haversine(CENTER, a);
      if (d > maxDist) maxDist = d;
    });
    animateNum(document.getElementById('sTotal'), agents.length);
    animateNum(document.getElementById('sArea'), uniqueCities);
    animateNum(document.getElementById('sFar'), maxDist);
  };

  const buildLeaderboard = (agents: any[]) => {
    const counts: Record<string, number> = {};
    agents.forEach(a => {
      const c = a.city || 'Unknown';
      counts[c] = (counts[c] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] || 1;
    const lbEl = document.getElementById('lbContent');
    if (lbEl) {
      lbEl.innerHTML = sorted.map(([city, count], i) =>
        `<div class="lb-row">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-city">${city.length > 18 ? city.substring(0, 18) + '…' : city}</span>
            <div class="lb-bar-wrap"><div class="lb-bar" style="width:${(count / max) * 100}%"></div></div>
            <span class="lb-count">${count}</span>
        </div>`
      ).join('');
    }
  };

  // Initial render of markers & statistics
  renderMarkers(filteredAgents);
  updateStats(agentNodes);
  buildLeaderboard(agentNodes);

  // 4. Attach UI event listeners
  const idCloseBtn = document.getElementById('idClose');
  if (idCloseBtn) idCloseBtn.onclick = closeDrawer;
  const overlay = document.getElementById('idOverlay');
  if (overlay) overlay.onclick = closeDrawer;

  // Search
  const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
  const searchResults = document.getElementById('searchResults');
  if (searchInput && searchResults) {
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase().trim();
      if (q.length < 2) {
        searchResults.classList.remove('open');
        return;
      }
      const matches = agentNodes.filter(n =>
        n.name.toLowerCase().includes(q) || (n.nick && n.nick.toLowerCase().includes(q))
      ).slice(0, 8);
      if (!matches.length) {
        searchResults.classList.remove('open');
        return;
      }
      searchResults.innerHTML = matches.map(m =>
        `<div class="sr-item" data-id="${m.id}">
            <img class="sr-avatar" src="${m.foto ? m.foto : '/images/default-avatar.webp'}" alt="">
            <div><div class="sr-name">${m.name}</div><div class="sr-city">${m.city}</div></div>
        </div>`
      ).join('');
      searchResults.classList.add('open');
      searchResults.querySelectorAll('.sr-item').forEach(el => {
        (el as HTMLElement).onclick = () => {
          const targetId = (el as HTMLElement).dataset.id;
          const node = agentNodes.find(n => n.id == targetId);
          if (node) {
            openDrawer(node);
            searchResults.classList.remove('open');
            searchInput.value = '';
          }
        };
      });
    };

    document.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-pill') && !target.closest('.search-results')) {
        searchResults.classList.remove('open');
      }
    };
  }

  // Filter Chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    (chip as HTMLElement).onclick = () => {
      const f = (chip as HTMLElement).dataset.filter;
      if (f === 'lb') {
        const lb = document.getElementById('leaderboard');
        if (lb) lb.classList.toggle('open');
        chip.classList.toggle('active');
        return;
      }
      document.querySelectorAll('.filter-chip').forEach(c => {
        if ((c as HTMLElement).dataset.filter !== 'lb') c.classList.remove('active');
      });
      chip.classList.add('active');

      if (f === 'all') filteredAgents = [...agentNodes];
      else if (f === 'L') filteredAgents = agentNodes.filter(n => n.gender === 'Laki-laki');
      else if (f === 'P') filteredAgents = agentNodes.filter(n => n.gender === 'Perempuan');

      renderMarkers(filteredAgents);
      updateStats(filteredAgents);
      buildLeaderboard(filteredAgents);

      if (filteredAgents.length > 0) {
        const group = L.featureGroup(Object.values(allMarkers));
        if (group.getBounds().isValid()) {
          map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 8 });
        }
      }
    };
  });

  // Cinematic Tour
  const btnTour = document.getElementById('btnAutoTour');
  const tourOverlay = document.getElementById('tourOverlay');
  let isTouring = false;
  if (btnTour) {
    btnTour.onclick = () => {
      if (isTouring) {
        clearInterval(currentTourInterval);
        map.flyTo([CENTER.lat, CENTER.lng], initialZoom);
        btnTour.innerHTML = '<i class="fa-solid fa-plane-departure"></i> <span class="hide-mobile">Jelajahi </span>Jaringan';
        if (tourOverlay) tourOverlay.classList.remove('show');
        isTouring = false;
      } else {
        isTouring = true;
        btnTour.innerHTML = '<i class="fa-solid fa-stop"></i> <span class="hide-mobile">Hentikan </span>Jelajah';
        const nodesWithCoords = filteredAgents.filter(n => n.lat && n.lng);
        if (!nodesWithCoords.length) return;
        let idx = 0;
        const fly = () => {
          if (idx >= nodesWithCoords.length) idx = 0;
          const t = nodesWithCoords[idx];
          map.flyTo([t.lat, t.lng], 10, { animate: true, duration: 2 });
          const tourName = document.getElementById('tourName');
          const tourCity = document.getElementById('tourCity');
          if (tourName) tourName.textContent = t.name;
          if (tourCity) tourCity.textContent = `${t.city} • ${haversine(CENTER, t)} km dari Pondok`;
          if (tourOverlay) {
            tourOverlay.classList.add('show');
            setTimeout(() => tourOverlay && tourOverlay.classList.remove('show'), 4500);
          }
          idx++;
        };
        fly();
        currentTourInterval = setInterval(fly, 5500);
      }
    };
  }

  // Location Sync GPS
  const btnSync = document.getElementById('btnSyncLocation') as HTMLButtonElement | null;
  const statusEl = document.getElementById('syncStatus');
  const showStatus = (msg: string, color = '#d4af37') => {
    if (statusEl) {
      statusEl.innerText = msg;
      statusEl.style.color = color;
      statusEl.style.opacity = '1';
    }
  };

  if (btnSync) {
    btnSync.onclick = () => {
      if (!('geolocation' in navigator)) {
        showStatus('GPS tidak didukung.', '#ff3366');
        return;
      }
      btnSync.disabled = true;
      showStatus('Mengakses GPS...');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          showStatus('Menyelaraskan...');
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`)
            .then(r => r.ok ? r.json() : {})
            .catch(() => ({}))
            .then((geo: any) => {
              const city = geo?.city || geo?.locality || geo?.principalSubdivision || 'Dari Titik Radar';
              const payload = { latitude: lat, longitude: lng, city };
              return fetch('/api/radar/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
            })
            .then(async r => {
              const text = await r.text();
              let data: any;
              try { data = JSON.parse(text); } catch { throw new Error('Response tidak valid'); }
              if (!r.ok) throw new Error(data.message || data.error || 'Server error');
              return data;
            })
            .then(data => {
              if (data.status === 'success' || data.success) {
                showStatus('Berhasil disimpan!', '#4ade80');
                setTimeout(() => location.reload(), 1500);
              } else {
                throw new Error(data.message || 'Gagal menyimpan');
              }
            })
            .catch(err => {
              showStatus('Gagal: ' + err.message, '#ff3366');
              btnSync.disabled = false;
            });
        },
        () => {
          showStatus('Izin lokasi ditolak.', '#ff3366');
          btnSync.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    };
  }
}

export function destroyRadar2D() {
  if (currentTourInterval) {
    clearInterval(currentTourInterval);
    currentTourInterval = null;
  }
  if (currentMarkerGroup) {
    try { currentMarkerGroup.clearLayers(); } catch(e) {}
    currentMarkerGroup = null;
  }
  if (currentMap) {
    try {
      currentMap.off();
      currentMap.remove();
    } catch (e) {
      console.warn('[Radar2D] Map cleanup warning:', e);
    }
    currentMap = null;
  }
  if (typeof window !== 'undefined') {
    (window as any).__leafletMap = null;
    (window as any).__leafletMarkerGroup = null;
  }
}
