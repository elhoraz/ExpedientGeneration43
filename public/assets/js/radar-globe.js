/**
 * radar-globe.js — All 12 features for Jaringan Silaturahmi
 */
(function initGlobe() {
    if (typeof window.Globe === 'undefined') {
        setTimeout(initGlobe, 100);
        return;
    }
    const elem = document.getElementById('globeViz');
    if (!elem) return;

    const CENTER = { lat: -8.0358875, lng: 111.414528 };
    let alumniData = window.__radarData || [];
    let centerNode = alumniData.find(n => n.type === 'center') || { ...CENTER, type: 'center', name: 'Pondok Modern Arrisalah', city: 'Ponorogo', nick: 'Arrisalah' };
    let agentNodes = alumniData.filter(n => n.type !== 'center');
    let filteredAgents = [...agentNodes];
    let world;

    // ===== UTILS =====
    const haversine = (a, b) => {
        const R = 6371, toR = Math.PI / 180;
        const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
        const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
        return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    };
    const getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
    const getGlobeImg = () => {
        const m = window.__mapStyle;
        if (m === 'night' || m === 'nasamarble') return '/images/earth-night.jpg';
        if (m === 'satellite-3d' || m === 'satellite') return 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
        if (m === 'day') return '/images/earth-day.webp';
        if (m === 'water') return 'https://unpkg.com/three-globe/example/img/earth-water.png';
        if (m === 'topology') return '/images/earth-topology.webp';
        
        return getTheme() === 'light'
            ? '/images/earth-day.webp'
            : '/images/earth-night.jpg';
    };

    // ===== 5. STAR FIELD =====
    const starCanvas = document.getElementById('starField');
    if (starCanvas) {
        const ctx = starCanvas.getContext('2d');
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
        const stars = Array.from({ length: 200 }, () => ({
            x: Math.random() * starCanvas.width,
            y: Math.random() * starCanvas.height,
            r: Math.random() * 1.5 + 0.3,
            o: Math.random()
        }));
        (function drawStars() {
            if (getTheme() === 'light') { ctx.clearRect(0, 0, starCanvas.width, starCanvas.height); requestAnimationFrame(drawStars); return; }
            ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
            stars.forEach(s => {
                s.o += (Math.random() - 0.5) * 0.03;
                s.o = Math.max(0.1, Math.min(1, s.o));
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill();
            });
            requestAnimationFrame(drawStars);
        })();
        window.addEventListener('resize', () => { starCanvas.width = window.innerWidth; starCanvas.height = window.innerHeight; });
    }

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

    // ===== BUILD ARCS =====
    const buildArcs = (agents) => {
        const arcs = agents.map(a => ({
            startLat: centerNode.lat, startLng: centerNode.lng,
            endLat: a.lat, endLng: a.lng,
            color: ['rgba(212,175,55,0.0)', 'rgba(212,175,55,0.9)']
        }));
        for (let i = 0; i < Math.min(20, agents.length - 1); i++) {
            const a = agents[i], b = agents[i + 1];
            if (a && b) arcs.push({ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng, color: ['rgba(255,255,255,.03)', 'rgba(212,175,55,.2)'] });
        }
        return arcs;
    };

    // ===== INIT GLOBE =====
    const isMobile = window.innerWidth <= 768;
    const allNodes = () => [centerNode, ...filteredAgents];

    world = Globe()
        .globeImageUrl(getGlobeImg())
        .bumpImageUrl('/images/earth-topology.webp')
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor(getTheme() === 'light' ? '#a0b8cc' : 'rgba(212,175,55,0.35)')
        .atmosphereAltitude(0.2)
        .arcsData(buildArcs(filteredAgents))
        .arcColor('color').arcDashLength(.18).arcDashGap(2)
        .arcDashInitialGap(() => Math.random() * 5)
        .arcDashAnimateTime(4500).arcStroke(.8)
        .ringsData(allNodes())
        .ringColor(d => d.type === 'center' ? t => `rgba(212,175,55,${1 - t})` : t => `rgba(255,255,255,${1 - t})`)
        .ringMaxRadius(d => d.type === 'center' ? 5 : 2.5)
        .ringPropagationSpeed(d => d.type === 'center' ? 1.5 : 1)
        .ringRepeatPeriod(d => d.type === 'center' ? 1200 : 2800)
        .labelsData(allNodes())
        .labelLat(d => d.lat).labelLng(d => d.lng).labelText(() => '')
        .labelDotRadius(d => d.type === 'center' ? .8 : .4)
        .labelColor(d => d.type === 'center' ? '#d4af37' : '#ffffff')
        .labelResolution(2)
        .labelLabel(d => `<div class="globe-tooltip"><div class="tt-name">${d.name}</div><div class="tt-loc"><i class="fa-solid fa-location-dot" style="color:#d4af37;margin-right:5px;"></i>${d.city}</div></div>`)
        .onLabelClick(d => { if (d.type !== 'center') openDrawer(d); })
        (elem);

    world.width(window.innerWidth);
    world.height(window.innerHeight);
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.45;
    window.addEventListener('resize', () => { world.width(window.innerWidth); world.height(window.innerHeight); });

    // ===== THEME SYNC =====
    new MutationObserver(() => {
        world.globeImageUrl(getGlobeImg());
        world.atmosphereColor(getTheme() === 'light' ? '#a0b8cc' : 'rgba(212,175,55,0.35)');
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // ===== 1. CINEMATIC LOADING =====
    world.pointOfView({ lat: 20, lng: 90, altitude: 4 }); // Start far away
    setTimeout(() => {
        world.pointOfView({ lat: centerNode.lat, lng: centerNode.lng, altitude: isMobile ? 3.5 : 2.2 }, 3000);
        const rl = document.getElementById('radarLoading');
        if (rl) {
            rl.style.opacity = '0';
            setTimeout(() => { if(rl) rl.style.display = 'none'; }, 1500);
        }
        updateStats(agentNodes);
        buildLeaderboard(agentNodes);
    }, 1800);

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
        // 9. FLY + ARC HIGHLIGHT
        world.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.2 }, 2000);
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

    // ===== 6. MAP DROPDOWN (Handled by React) =====

    // ===== 8. FILTER =====
    const refreshGlobe = () => {
        const nodes = allNodes();
        world.arcsData(buildArcs(filteredAgents));
        world.ringsData(nodes);
        world.labelsData(nodes);
        updateStats(filteredAgents);
        buildLeaderboard(filteredAgents);
    };
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
            refreshGlobe();
        });
    });

    // ===== 11. CINEMATIC TOUR =====
    const btnTour = document.getElementById('btnAutoTour');
    const tourOverlay = document.getElementById('tourOverlay');
    let isTouring = false, tourInterval;
    btnTour.addEventListener('click', () => {
        if (isTouring) {
            clearInterval(tourInterval);
            world.controls().autoRotate = true;
            btnTour.innerHTML = '<i class="fa-solid fa-plane-departure"></i> Jelajahi Jaringan';
            tourOverlay.classList.remove('show');
            isTouring = false;
        } else {
            isTouring = true;
            world.controls().autoRotate = false;
            btnTour.innerHTML = '<i class="fa-solid fa-stop"></i> Hentikan Jelajah';
            const nodes = filteredAgents.filter(n => n.lat && n.lng);
            if (!nodes.length) return;
            let idx = 0;
            const fly = () => {
                if (idx >= nodes.length) idx = 0;
                const t = nodes[idx];
                world.pointOfView({ lat: t.lat, lng: t.lng, altitude: 0.8 }, 3000);
                // Tour overlay
                document.getElementById('tourName').textContent = t.name;
                document.getElementById('tourCity').textContent = t.city + ' • ' + haversine(CENTER, t) + ' km dari Pondok';
                tourOverlay.classList.add('show');
                setTimeout(() => tourOverlay.classList.remove('show'), 4500);
                idx++;
            };
            fly();
            tourInterval = setInterval(fly, 6000);
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
                    .catch(err => { console.warn('Geocoding blocked or failed:', err); return {}; })
                    .then(geo => {
                        const city = geo.city || geo.locality || geo.principalSubdivision;
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

    // ===== 10. SUPABASE REALTIME NOTIFICATION =====
    // Supabase Realtime is now handled inside RadarClient.tsx 
    // to maintain React state context and simplify dependencies.
})();
