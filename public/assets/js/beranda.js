/**
 * Expedient Generation 43 - Beranda Engine
 * High-performance 3D sequence renderer, spatial audio, particles & dynamic interactions.
 * Built with full lifecycle management (init / destroy) and asset caching for smooth SPA navigation.
 */

// Global cache for preloaded assets so page transitions and returns are instantaneous
if (typeof window !== 'undefined') {
    window.__BERANDA_ASSET_CACHE = window.__BERANDA_ASSET_CACHE || {
        ready: false,
        fullImages: null,
        shardImages: {}
    };
}

let _berandaTicker = null;
let _berandaListeners = [];
let _berandaScrollTriggers = [];
let _berandaTimeouts = [];
let _berandaLoreInterval = null;
let _berandaStageObserver = null;
let _activeJiwaTl = null;
let _inertiaAnim = null;

const destroyBeranda = () => {
    // 1. Remove GSAP Ticker animation loop
    if (_berandaTicker && typeof gsap !== 'undefined') {
        gsap.ticker.remove(_berandaTicker);
        _berandaTicker = null;
    }

    // 2. Clear intervals and timeouts
    if (_berandaLoreInterval) {
        clearInterval(_berandaLoreInterval);
        _berandaLoreInterval = null;
    }
    _berandaTimeouts.forEach(t => clearTimeout(t));
    _berandaTimeouts = [];

    // 3. Remove all window/document/mediaquery listeners
    _berandaListeners.forEach(cleanup => {
        try { cleanup(); } catch (e) {}
    });
    _berandaListeners = [];

    // 4. Disconnect IntersectionObserver
    if (_berandaStageObserver) {
        _berandaStageObserver.disconnect();
        _berandaStageObserver = null;
    }

    // 5. Kill active animations & timelines
    if (_inertiaAnim) {
        try { _inertiaAnim.kill(); } catch (e) {}
        _inertiaAnim = null;
    }
    if (_activeJiwaTl) {
        try { _activeJiwaTl.kill(); } catch (e) {}
        _activeJiwaTl = null;
    }

    // 6. Kill all Beranda ScrollTriggers
    _berandaScrollTriggers.forEach(st => {
        try { if (st && st.kill) st.kill(); } catch (e) {}
    });
    _berandaScrollTriggers = [];

    if (typeof ScrollTrigger !== 'undefined') {
        try {
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars && (st.vars.scroller === '.main-wrapper' || st.vars.trigger === '#stage')) {
                    st.kill();
                }
            });
        } catch (e) {}
    }

    window.__berandaInitialized = false;
};
window.destroyBeranda = destroyBeranda;

const initBeranda = () => {
    const stage = document.getElementById('stage');
    const constelCanvas = document.getElementById('constellationCanvas');
    const canvasFull = document.getElementById('fullLogoCanvas');
    const container = document.getElementById('shardsContainer');

    // Pastikan DOM elements beranda tersedia sebelum inisialisasi
    if (!stage || !constelCanvas || !canvasFull || !container) {
        return;
    }

    // Bersihkan instance lama jika ada
    if (window.__berandaInitialized) {
        destroyBeranda();
    }
    window.__berandaInitialized = true;

    if (typeof gsap !== 'undefined') {
        gsap.config({ force3D: true });
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    }

    const addListener = (target, type, listener, options) => {
        if (!target) return;
        target.addEventListener(type, listener, options);
        _berandaListeners.push(() => {
            try { target.removeEventListener(type, listener, options); } catch (e) {}
        });
    };

    const TOTAL_FRAMES = 192;
    let isScattered = false;
    let isAnimating = false;
    let isPlaying = false;

    const frameData = { full: 0, shards: {} };
    const basePath = '/assets/sequence/';

    // =========================================================
    // TRACK MOUSE UNTUK EFEK RIPPLE REPULSE
    // =========================================================
    let mouseX = -1000, mouseY = -1000;
    addListener(window, 'mousemove', (e) => {
        const currentStage = document.getElementById('stage');
        if (currentStage) {
            const rect = currentStage.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }
    });

    // =========================================================
    // SPATIAL CINEMATIC SOUNDSCAPE
    // =========================================================
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    const initAudio = () => {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    };

    const playTick = (velocity) => {
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = 'sine'; osc.frequency.setValueAtTime(400 + velocity * 10, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.03);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
            osc.start(); osc.stop(audioCtx.currentTime + 0.04);
        } catch (e) {}
    };

    const playSwoosh = () => {
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = 'triangle'; osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.25);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {}
    };

    const playBassDrop = () => {
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = 'sine'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 2);
            gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2);
            osc.start(); osc.stop(audioCtx.currentTime + 2);
        } catch (e) {}
    };

    // =========================================================
    // EXPEDIENT CORE (PARTIKEL KRISTAL EMAS)
    // =========================================================
    const mq = window.matchMedia('(max-width: 768px)');

    let coreParticles = [];
    const initCore = () => {
        coreParticles = [];
        const currentStage = document.getElementById('stage');
        const cw = currentStage ? currentStage.offsetWidth : window.innerWidth;
        const ch = currentStage ? currentStage.offsetHeight : window.innerHeight;

        const isMobile = mq.matches;
        const particleCount = isMobile ? 30 : 150;

        for (let i = 0; i < particleCount; i++) {
            let r = Math.random() * 180 + 80;
            let g = Math.random() * 0.5 + 0.2;
            let s = Math.random() * 0.015 + 0.005;
            coreParticles.push({
                baseX: cw / 2, baseY: ch / 2, angle: Math.random() * Math.PI * 2,
                radius: r, baseRadius: r, speed: s, baseSpeed: s, size: Math.random() * 2.5 + 1,
                glow: g, baseGlow: g, offsetX: 0, offsetY: 0
            });
        }
    };
    initCore();
    addListener(window, 'resize', initCore);

    // =========================================================
    // KANVAS CONSTELLATION & PARTIKEL
    // =========================================================
    const ctxConstel = constelCanvas.getContext('2d');

    const resizeCanvas = () => {
        const currentStage = document.getElementById('stage');
        if (currentStage && constelCanvas) {
            constelCanvas.width = currentStage.offsetWidth;
            constelCanvas.height = currentStage.offsetHeight;
        }
    };
    resizeCanvas();
    addListener(window, 'resize', resizeCanvas);

    let _constellationFrame = 0;

    const drawConstellation = () => {
        if (!ctxConstel || !constelCanvas) return;
        _constellationFrame++;
        const isMobileNow = mq.matches;
        if (isMobileNow && (_constellationFrame % 2 !== 0)) return;

        ctxConstel.clearRect(0, 0, constelCanvas.width, constelCanvas.height);
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const time = Date.now();

        // 1. Render Partikel Latar Belakang
        coreParticles.forEach(p => {
            p.angle += p.speed;
            let targetX = p.baseX + Math.cos(p.angle) * p.radius;
            let targetY = p.baseY + Math.sin(p.angle) * (p.radius * 0.5);

            if (isScattered && !isMobileNow) {
                let dx = mouseX - (targetX + p.offsetX);
                let dy = mouseY - (targetY + p.offsetY);
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    let force = (150 - dist) / 150;
                    p.offsetX -= (dx / dist) * force * 15;
                    p.offsetY -= (dy / dist) * force * 15;
                }
            }

            p.offsetX += (0 - p.offsetX) * 0.05;
            p.offsetY += (0 - p.offsetY) * 0.05;

            let drawX = Math.floor(targetX + p.offsetX);
            let drawY = Math.floor(targetY + p.offsetY);

            ctxConstel.beginPath();
            ctxConstel.arc(drawX, drawY, p.size, 0, Math.PI * 2);

            let glowRatio = p.glow / p.baseGlow;

            if (isLight) {
                let shimmer = Math.sin(time / 150 + p.angle) * 0.5 + 0.5;
                let alpha = (0.5 + shimmer * 0.5) * glowRatio;
                ctxConstel.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            } else {
                let alpha = p.glow + (0.3 * glowRatio);
                ctxConstel.fillStyle = `rgba(212, 175, 55, ${alpha})`;
            }
            ctxConstel.fill();
        });

        // 2. Render Garis Konstelasi — Desktop
        if (!isMobileNow && (isScattered || isAnimating)) {
            ctxConstel.strokeStyle = isLight ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.3)';
            ctxConstel.lineWidth = 1.5;
            ctxConstel.lineJoin = "round";
            ctxConstel.beginPath();

            const cx = constelCanvas.width / 2;
            const cy = constelCanvas.height / 2;

            const dynamicPositions = assetsData.shards.map(s => {
                const el = document.getElementById(`shardWrap_${s.id}`);
                const currX = el && typeof gsap !== 'undefined' ? (gsap.getProperty(el, "x") || (isAnimating ? 0 : s.tx)) : s.tx;
                const currY = el && typeof gsap !== 'undefined' ? (gsap.getProperty(el, "y") || (isAnimating ? 0 : s.ty)) : s.ty;
                return { x: cx + currX, y: cy + currY };
            });

            dynamicPositions.forEach((pos, i) => {
                ctxConstel.moveTo(Math.floor(cx), Math.floor(cy));
                ctxConstel.lineTo(Math.floor(pos.x), Math.floor(pos.y));
                if (i > 0) {
                    const prev = dynamicPositions[i - 1];
                    ctxConstel.moveTo(Math.floor(prev.x), Math.floor(prev.y));
                    ctxConstel.lineTo(Math.floor(pos.x), Math.floor(pos.y));
                }
            });

            if (dynamicPositions.length > 1) {
                const first = dynamicPositions[0];
                const last = dynamicPositions[dynamicPositions.length - 1];
                ctxConstel.moveTo(Math.floor(last.x), Math.floor(last.y));
                ctxConstel.lineTo(Math.floor(first.x), Math.floor(first.y));
            }
            ctxConstel.stroke();
        }
    };

    const getLayoutConfig = () => {
        if (mq.matches) {
            return {
                scale: 0.185,
                fullScale: 0.44,
                coords: [
                    { tx: 0, ty: -185 },
                    { tx: -90, ty: -130 },
                    { tx: 90, ty: -130 },
                    { tx: -115, ty: -65 },
                    { tx: 115, ty: -65 },
                    { tx: -125, ty: 0 },
                    { tx: 125, ty: 0 },
                    { tx: -115, ty: 70 },
                    { tx: 90, ty: 135 },
                    { tx: 115, ty: 70 },
                    { tx: -90, ty: 135 },
                    { tx: -40, ty: 185 },
                    { tx: 40, ty: 185 }
                ]
            };
        } else {
            return {
                scale: 0.28,
                fullScale: 0.45,
                coords: [
                    { tx: 0, ty: 0 }, { tx: -280, ty: -160 }, { tx: 0, ty: -180 }, { tx: 280, ty: -160 },
                    { tx: -350, ty: 0 }, { tx: 350, ty: 0 }, { tx: -280, ty: 160 }, { tx: 0, ty: 180 },
                    { tx: 280, ty: 160 }, { tx: -140, ty: -90 }, { tx: 140, ty: -90 }, { tx: -140, ty: 90 },
                    { tx: 140, ty: 90 }
                ]
            };
        }
    };

    let layout = getLayoutConfig();

    const getCmsShard = (idx, prop, fallback) => {
        return (window.BERANDA_CMS && window.BERANDA_CMS.shards && window.BERANDA_CMS.shards[idx])
            ? window.BERANDA_CMS.shards[idx][prop]
            : fallback;
    };

    const assetsData = {
        full: { folder: 'logo_utuh', static: '/images/logo-utuh.webp', images: [] },
        shards: [
            { id: 1, folder: 'shard_1', static: '/images/globe.webp', title: getCmsShard(0, 'title', 'Bumi dengan 2 Lafazd Syahadat, Pena Bulu Emas dan Dua Kitab'), desc: getCmsShard(0, 'desc', 'Melambangkan yang menyiratkan makna QS. Al-Baqarah : 30 sebagai pemimpin di bumi yang mempunyai misi dalam menyebarluaskan ajaran, nilai, dan syariat Islam yang benar ke seluruh jagat raya. Pena bulu emas dan dua kitab melambangkan kewajiban alumni Expedient Generation, dalam menjalankan amanah yang berdasarkan Al-Quran\'an & As - Sunnah.') },
            { id: 2, folder: 'shard_2', static: '/images/teks-gabungan.webp', title: getCmsShard(1, 'title', 'Tulisan Almamater'), desc: getCmsShard(1, 'desc', 'Sebagai doa agar alumni Arrisalah tahun 2025 menjadi alumni yang husnul khotimah dan membangun kejayaan risalah Nabi Muhammad SAW.') },
            { id: 3, folder: 'shard_3', static: '/images/cincin-emas.webp', title: getCmsShard(2, 'title', 'Cincin Emas'), desc: getCmsShard(2, 'desc', 'Cincin emas bermakna kekuatan dan sesuatu yang berharga, melambangkan tekat yang kuat, serta karakter yang visioner.') },
            { id: 4, folder: 'shard_4', static: '/images/pita-putih.webp', title: getCmsShard(3, 'title', 'Selendang Berwarna Putih'), desc: getCmsShard(3, 'desc', 'Selendang melambangkan persaudaraan yang erat dan solid, berdasarkan asas iman dan agama Islam yang harus dijaga kesuciannya.') },
            { id: 5, folder: 'shard_5', static: '/images/perisai-bendera.webp', title: getCmsShard(4, 'title', 'Bendera Pondok Modern'), desc: getCmsShard(4, 'desc', 'Merupakan simbol Pondok Modern sebagai lembaga pendidikan yang selalu berada di atas dan untuk semua golongan.') },
            { id: 6, folder: 'shard_6', static: '/images/tanduk-perak.webp', title: getCmsShard(5, 'title', 'Kelopak Logam Mulia Tungsten'), desc: getCmsShard(5, 'desc', 'Kelopak logam mulia tungsten merupakan material terkuat di dunia yang melambangkan perisai diri yang kuat dari godaan syaitan yang terkutuk.') },
            { id: 7, folder: 'shard_7', static: '/images/segi-delapan-perak.webp', title: getCmsShard(6, 'title', 'Perisai Rub Al-Hizb'), desc: getCmsShard(6, 'desc', 'Bentuk segi delapan ini merepresentasikan Rub Al-Hizb, simbol klasik pembatas ayat Al-Qur\'an, yang melambangkan komitmen alumni sebagai benteng iman dan pengamal kalam suci. Delapan sudutnya melambangkan delapan pintu surga sekaligus kesiapan menyebarkan kemaslahatan rahmatan lil-\'alamin ke delapan penjuru mata angin. Dibalut kilau perak (Al-Fidhdhah) yang terinspirasi dari keindahan perhiasan surga (QS. Al-Insan: 21), simbol ini menegaskan karakter alumni yang tangguh, adaptif, dan berharga tinggi, namun tetap bersahaja dalam kerendahan hati (tawadhu).') },
            { id: 8, folder: 'shard_8', static: '/images/bingkai-kristal-biru.webp', title: getCmsShard(7, 'title', 'Kelopak Blue Marble'), desc: getCmsShard(7, 'desc', 'Merupakan sebutan pertama kali untuk foto bumi yang pertama, yang diambil pada 7 Desember 1972, melambangkan gerakan dalam menjaga dan melestarikan bumi sebagai amanah yang dibebankan kepada seluruh umat manusia sesuai dengan QS. Al-Baqarah: 56. Memicu perlunya pembangkitan berkelanjutan untuk menjaga planet. Kepercayaan, loyalitas, tanggung jawab, keamanan simbol surga spiritualitas. Dan berlist-kan emas melambangkan bahwa alumni Arrisalah tahun 2025 adalah sesuatu yang berharga.') },
            { id: 9, folder: 'shard_9', static: '/images/ornamen-bawah-emas.webp', title: getCmsShard(8, 'title', 'Tanduk Rusa Emas Berlafazkan Muhammad SAW'), desc: getCmsShard(8, 'desc', 'Melambangkan semangat yang tinggi dalam menggapai cita-cita yang mulia, sebagai simbol regenerasi dan kebangkitan risalah Nabi Muhammad SAW. Kehadiran batu rubi merah di poros tengah bawah mengambil makna dari istilah bahasa Sanskerta Ratna yang berarti permata paling berharga. Batu Ratna ini merepresentasikan prinsip ketauhidan sebagai pondasi utama yang tunggal dan utuh. Posisinya yang diletakkan di bagian paling bawah menegaskan bahwa seluruh pergerakan, semangat perjuangan, dan cita-cita alumni harus berakar kuat pada asas tauhid yang kokoh kepada Allah SWT.') },
            { id: 10, folder: 'shard_10', static: '/images/segi-delapan-gelap.webp', title: getCmsShard(9, 'title', 'Perisai Baja Berbentuk Segi 8'), desc: getCmsShard(9, 'desc', 'Menggambarkan asas Islam yang kokoh dan delapan arah mata angin yang memberi dampak pemberdayaan potensi yang memancar ke seluruh penjuru alam (rahmatan lil-alamin), serta menyiratkan makna seperti dalam QS. Al-Baqarah: 115, yakni kemanapun kamu menghadap, disanalah wajah-Nya.') },
            { id: 11, folder: 'shard_11', static: '/images/mahkota-emas.webp', title: getCmsShard(10, 'title', 'Mahkota Emas Berlambangkan Allah SWT'), desc: getCmsShard(10, 'desc', 'Melambangkan kekuasaan, keabadian, kebijaksanaan dan legitimasi. Simbol ini terletak di atas melambangkan bahwa Allah SWT yang Maha Esa dan segala aspek kehidupan ini bermuara kepada-Nya tiada daya dan upaya selain dari kehendak Allah Taala.') },
            { id: 12, folder: 'shard_12', static: '/images/kristal-puncak.webp', title: getCmsShard(11, 'title', 'Lima Permata'), desc: getCmsShard(11, 'desc', 'Lima permata bermakna lima rukun Islam yang mendasari berdirinya agama Islam.') },
            { id: 13, folder: 'shard_13', static: '/images/zamrud-hijau.webp', title: getCmsShard(12, 'title', 'Enam Batu Zamrud'), desc: getCmsShard(12, 'desc', 'Enam batu zamrud sebagai simbol kemakmuran dan kelimpahan yang melambangkan enam rukun iman sebagai asas dasar keyakinan seorang muslim.') }
        ]
    };

    assetsData.shards.forEach((shard, i) => {
        shard.tx = layout.coords[i]?.tx || 0;
        shard.ty = layout.coords[i]?.ty || 0;
        shard.scale = layout.scale;
    });

    const onBreakpointChange = () => {
        layout = getLayoutConfig();
        assetsData.shards.forEach((shard, i) => {
            shard.tx = layout.coords[i]?.tx || 0;
            shard.ty = layout.coords[i]?.ty || 0;
            shard.scale = layout.scale;
        });
        if (isScattered && !isAnimating) {
            assetsData.shards.forEach((shard) => {
                gsap.to(`#shardWrap_${shard.id}`, { x: shard.tx, y: shard.ty, scale: shard.scale, duration: 0.4, ease: "power2.out" });
            });
        } else if (!isScattered && !isAnimating) {
            gsap.to('#fullLogoBox', { scale: layout.fullScale || (layout.scale * 1.5), duration: 0.4, ease: "power2.out" });
        }
    };
    if (mq.addEventListener) {
        mq.addEventListener('change', onBreakpointChange);
        _berandaListeners.push(() => mq.removeEventListener('change', onBreakpointChange));
    }
    addListener(window, 'resize', onBreakpointChange);

    const pad = (num) => num.toString().padStart(3, '0');
    const ctxFull = canvasFull.getContext('2d');
    const shardCanvases = [];

    const lores = (window.BERANDA_CMS && window.BERANDA_CMS.lores) ? window.BERANDA_CMS.lores : [
        '"Dan bersabarlah kamu bersama-sama dengan orang-orang yang menyeru Tuhannya di pagi dan senja hari..." (Al-Kahfi: 28)',
        '"Niscaya Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan..." (Al-Mujadilah: 11)',
        '"Dan berpeganglah kamu semuanya kepada tali (agama) Allah, dan janganlah kamu bercerai berai..." (Ali Imran: 103)',
        '"Maka sesungguhnya sesudah kesulitan itu ada kemudahan..." (Al-Insyirah: 5)',
        '"Bukanlah golongan kami orang yang tidak menyayangi yang muda dan tidak menghormati yang tua." (HR. Tirmidzi)'
    ];

    let currentLoreIndex = -1;
    _berandaLoreInterval = setInterval(() => {
        const loreEl = document.getElementById('loaderLore');
        if (loreEl) {
            currentLoreIndex = (currentLoreIndex + 1) % lores.length;
            loreEl.style.opacity = '0';
            const t = setTimeout(() => {
                if (loreEl) {
                    loreEl.innerText = lores[currentLoreIndex];
                    loreEl.style.opacity = '1';
                }
            }, 500);
            _berandaTimeouts.push(t);
        }
    }, 4000);

    // =========================================================
    // DISMISS LOADER (DENGAN FADE HALUS)
    // =========================================================
    let loaderDismissed = false;
    const dismissLoader = () => {
        if (loaderDismissed) return;
        loaderDismissed = true;

        if (_berandaLoreInterval) {
            clearInterval(_berandaLoreInterval);
            _berandaLoreInterval = null;
        }

        const loader = document.getElementById('loader');
        if (loader) {
            if (typeof gsap !== 'undefined') {
                gsap.to(loader, {
                    duration: 0.4,
                    opacity: 0,
                    ease: "power2.out",
                    onComplete: () => {
                        if (loader) loader.style.display = 'none';
                        if (typeof gsap !== 'undefined') {
                            gsap.set('#fullLogoBox', { scale: layout.fullScale || (layout.scale * 1.5) });
                        }
                        isPlaying = true;
                    }
                });
            } else {
                loader.style.opacity = '0';
                setTimeout(() => { if (loader) loader.style.display = 'none'; isPlaying = true; }, 400);
            }
        } else {
            isPlaying = true;
        }
    };

    // =========================================================
    // SETUP SHARD DOM (CANVAS & EVENT HANDLERS)
    // =========================================================
    const setupShardDOM = () => {
        const shardContainer = document.getElementById('shardsContainer');
        if (!shardContainer) return;
        shardContainer.innerHTML = '';
        shardCanvases.length = 0;

        assetsData.shards.forEach((shard) => {
            frameData.shards[shard.id] = 0;
            const wrap = document.createElement('div');
            wrap.className = 'shard-wrapper hover-trigger cursor-bind';
            wrap.id = `shardWrap_${shard.id}`;

            const c = document.createElement('canvas');
            c.width = 800; c.height = 450;
            c.className = 'shard-canvas';
            c.id = `shardCanvas_${shard.id}`;

            const ctx = c.getContext('2d');
            shardCanvases.push({ ctx: ctx, images: shard.images, id: shard.id });

            const statImg = document.createElement('img');
            statImg.src = shard.static;
            statImg.className = 'shard-static';
            statImg.id = `shardStatic_${shard.id}`;

            wrap.appendChild(c);
            wrap.appendChild(statImg);
            shardContainer.appendChild(wrap);

            wrap.addEventListener('mousedown', (e) => handleDragStart(e, shard.id));
            wrap.addEventListener('touchstart', (e) => handleDragStart(e, shard.id), { passive: false });
            wrap.addEventListener('click', (e) => {
                if (!isScattered || isAnimating || hasDragged) return;
                const mTitle = document.getElementById('modalTitle');
                const mDesc = document.getElementById('modalDesc');
                if (mTitle) mTitle.innerText = shard.title;
                if (mDesc) mDesc.innerText = shard.desc;
                document.getElementById('philModal')?.classList.add('active');
            });
        });

        const fullBox = document.getElementById('fullLogoBox');
        if (fullBox) {
            fullBox.addEventListener('mousedown', (e) => handleDragStart(e, 'full'));
            fullBox.addEventListener('touchstart', (e) => handleDragStart(e, 'full'), { passive: false });
        }
    };

    // =========================================================
    // PRELOAD ENGINE (FAST TRACK + BACKGROUND)
    // =========================================================
    const preloadImages = () => {
        const isMobile = mq.matches;
        assetsData.full.images = new Array(TOTAL_FRAMES).fill(null);
        assetsData.shards.forEach(s => {
            s.images = new Array(TOTAL_FRAMES).fill(null);
        });

        const fastTrackQueue = [];
        const midTrackQueue = [];
        const backgroundQueue = [];

        const step1 = isMobile ? 24 : 16;

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const src = `${basePath}${assetsData.full.folder}/frame_${pad(i)}.webp`;
            const item = { idx: i, src: src, targetArray: assetsData.full.images };
            if (i === 1) fastTrackQueue.push(item);
            else if (i % step1 === 1) midTrackQueue.push(item);
            else backgroundQueue.push(item);
        }

        assetsData.shards.forEach((shard) => {
            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                const src = `${basePath}${shard.folder}/frame_${pad(i)}.webp`;
                const item = { idx: i, src: src, targetArray: shard.images };
                if (i === 1) fastTrackQueue.push(item);
                else if (i % step1 === 1) midTrackQueue.push(item);
                else backgroundQueue.push(item);
            }
        });

        let loadedCount = 0;
        let currentDisplayPct = 0;
        const totalFastTrack = fastTrackQueue.length;

        const processItem = async (item, callback) => {
            try {
                if (window.createImageBitmap) {
                    const response = await fetch(item.src, { mode: 'cors' });
                    if (!response.ok) throw new Error('Fetch failed');
                    const blob = await response.blob();
                    const bitmap = await createImageBitmap(blob);
                    item.targetArray[item.idx - 1] = bitmap;
                } else {
                    throw new Error('Fallback to Image');
                }
            } catch (e) {
                const img = new Image();
                img.onload = () => { item.targetArray[item.idx - 1] = img; };
                img.src = item.src;
            }
            if (callback) callback();
        };

        const updateProgress = () => {
            loadedCount++;
            const pct = Math.floor((loadedCount / totalFastTrack) * 100);
            const percentEl = document.getElementById('loadPercent');
            if (percentEl && pct > currentDisplayPct) {
                if (typeof gsap !== 'undefined') {
                    gsap.to({ val: currentDisplayPct }, {
                        val: pct, duration: 0.2,
                        onUpdate: function () {
                            if (percentEl) percentEl.innerText = Math.floor(this.targets()[0].val) + '%';
                        }
                    });
                } else {
                    percentEl.innerText = pct + '%';
                }
                currentDisplayPct = pct;
            }
        };

        let qIndex = 0;
        const loadFastTrack = () => {
            if (qIndex >= fastTrackQueue.length) {
                // Simpan ke cache global
                window.__BERANDA_ASSET_CACHE.ready = true;
                window.__BERANDA_ASSET_CACHE.fullImages = assetsData.full.images;
                assetsData.shards.forEach(s => {
                    window.__BERANDA_ASSET_CACHE.shardImages[s.id] = s.images;
                });

                renderCurrentFrame();
                const t = setTimeout(() => {
                    dismissLoader();
                    loadBackgroundTracks();
                }, 100);
                _berandaTimeouts.push(t);
                return;
            }
            const item = fastTrackQueue[qIndex++];
            processItem(item, () => {
                updateProgress();
                loadFastTrack();
            });
        };

        const loadBackgroundTracks = () => {
            const fullQueue = [...midTrackQueue, ...backgroundQueue];
            let bgIndex = 0;
            const loadNextBg = () => {
                if (bgIndex >= fullQueue.length) return;
                processItem(fullQueue[bgIndex++], loadNextBg);
            };
            for (let i = 0; i < 8; i++) loadNextBg();
        };

        for (let i = 0; i < 15; i++) loadFastTrack();
    };

    // =========================================================
    // EKSEKUSI INITIAL LOAD / CACHE RESTORATION
    // =========================================================
    setupShardDOM();

    if (window.__BERANDA_ASSET_CACHE && window.__BERANDA_ASSET_CACHE.ready && window.__BERANDA_ASSET_CACHE.fullImages) {
        // --- JALUR CEPAT (INSTAN DARI CACHE) ---
        assetsData.full.images = window.__BERANDA_ASSET_CACHE.fullImages;
        assetsData.shards.forEach(s => {
            s.images = window.__BERANDA_ASSET_CACHE.shardImages[s.id] || [];
        });

        // Update link referensi gambar di shardCanvases
        shardCanvases.forEach(sc => {
            const match = assetsData.shards.find(s => s.id === sc.id);
            if (match) sc.images = match.images;
        });

        const percentEl = document.getElementById('loadPercent');
        if (percentEl) percentEl.innerText = '100%';

        renderCurrentFrame();
        const tDismiss = setTimeout(dismissLoader, 100);
        _berandaTimeouts.push(tDismiss);
    } else {
        // --- JALUR PERTAMA KALI (DOWNLOAD PROGRESSIVE) ---
        preloadImages();
    }

    // SAFETY NET: Pastikan loader HILANG maksimal 2.5 detik apa pun kondisinya
    const safetyNetTimer = setTimeout(() => {
        dismissLoader();
    }, 2500);
    _berandaTimeouts.push(safetyNetTimer);

    // =========================================================
    // PARALLAX
    // =========================================================
    const monuText = document.getElementById('monumentalText');
    const godRays = document.getElementById('godRays');

    const applyParallax = (xNorm, yNorm) => {
        if (isAnimating || typeof gsap === 'undefined') return;
        if (monuText) gsap.to(monuText, { xPercent: -50 + (xNorm * -3), yPercent: -50 + (yNorm * -3), duration: 1, ease: "power2.out", overwrite: "auto" });
        if (godRays) gsap.to(godRays, { rotation: xNorm * 10, duration: 1, ease: "power2.out", overwrite: "auto" });
    };

    addListener(window, 'mousemove', (e) => {
        if (!mq.matches) {
            applyParallax((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
        }
    });

    // =========================================================
    // SAFE RENDER ENGINE
    // =========================================================
    const getClosestImage = (imagesArr, targetIdx) => {
        if (!imagesArr) return null;
        if (imagesArr[targetIdx] && (imagesArr[targetIdx] instanceof ImageBitmap || imagesArr[targetIdx].complete)) return imagesArr[targetIdx];
        let offset = 1;
        while (offset < TOTAL_FRAMES / 2) {
            let checkPrev = targetIdx - offset;
            if (checkPrev < 0) checkPrev += TOTAL_FRAMES;
            if (imagesArr[checkPrev] && (imagesArr[checkPrev] instanceof ImageBitmap || imagesArr[checkPrev].complete)) return imagesArr[checkPrev];

            let checkNext = targetIdx + offset;
            if (checkNext >= TOTAL_FRAMES) checkNext -= TOTAL_FRAMES;
            if (imagesArr[checkNext] && (imagesArr[checkNext] instanceof ImageBitmap || imagesArr[checkNext].complete)) return imagesArr[checkNext];
            offset++;
        }
        return null;
    };

    const renderCurrentFrame = () => {
        if (!isScattered) {
            const fIdx = Math.floor(frameData.full);
            const img = getClosestImage(assetsData.full.images, fIdx);
            if (img && ctxFull && canvasFull) {
                ctxFull.clearRect(0, 0, canvasFull.width, canvasFull.height);
                ctxFull.drawImage(img, 0, 0, canvasFull.width, canvasFull.height);
            }
        } else {
            shardCanvases.forEach(shardObj => {
                const fIdx = Math.floor(frameData.shards[shardObj.id]);
                const img = getClosestImage(shardObj.images, fIdx);
                if (img && shardObj.ctx) {
                    shardObj.ctx.clearRect(0, 0, 800, 450);
                    shardObj.ctx.drawImage(img, 0, 0, 800, 450);
                }
            });
        }
    };

    let isStageVisible = true;
    _berandaStageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isStageVisible = entry.isIntersecting;
        });
    }, { threshold: 0.01 });
    _berandaStageObserver.observe(stage);

    let _autoPlayFrame = 0;
    const autoPlayEngine = () => {
        if (!isPlaying) return;
        _autoPlayFrame++;
        const isMobileNow = mq.matches;
        if (isMobileNow && (_autoPlayFrame % 2 !== 0)) return;

        let needsRender = false;
        if (!isScattered) {
            if (draggedItem !== 'full') { frameData.full = (frameData.full + 0.6) % TOTAL_FRAMES; needsRender = true; }
        } else {
            assetsData.shards.forEach(s => { if (draggedItem !== s.id) { frameData.shards[s.id] = (frameData.shards[s.id] + 0.6) % TOTAL_FRAMES; needsRender = true; } });
        }
        if (needsRender || draggedItem !== null) { renderCurrentFrame(); }
    };

    // =========================================================
    // GSAP TICKER
    // =========================================================
    _berandaTicker = () => {
        if (isStageVisible) {
            autoPlayEngine();
            drawConstellation();
        }
    };
    if (typeof gsap !== 'undefined') {
        gsap.ticker.add(_berandaTicker);
    }

    // =========================================================
    // DRAG & ROTATE ENGINE
    // =========================================================
    let draggedItem = null;
    let hasDragged = false;
    let startX = 0;
    let lastX = 0;
    let frameAtDragStart = 0;
    let lastTickTime = 0;
    let currentVelocity = 0;

    const handleDragStart = (e, id) => {
        if (isAnimating) return;
        e.stopPropagation();
        initAudio();
        if (_inertiaAnim) { _inertiaAnim.kill(); _inertiaAnim = null; }
        currentVelocity = 0;
        draggedItem = id;
        hasDragged = false;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        lastX = startX;
        frameAtDragStart = (id === 'full') ? frameData.full : frameData.shards[id];

        const hudHint = document.getElementById('hudHint');
        if (hudHint) {
            hudHint.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.hint_spin : "MEMUTAR HOLOGRAM...";
            hudHint.style.color = "#d4af37";
        }
        if (document.body.classList.contains('cursor-hovering')) {
            document.body.classList.remove('cursor-hovering');
        }
    };

    const handleDragMove = (e) => {
        if (!draggedItem) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const deltaX = x - startX;
        currentVelocity = x - lastX;
        if (Math.abs(deltaX) > 5) hasDragged = true;

        const now = Date.now();
        if (Math.abs(currentVelocity) > 2 && (now - lastTickTime) > (100 - Math.min(Math.abs(currentVelocity) * 2, 80))) {
            playTick(Math.abs(currentVelocity));
            lastTickTime = now;
        }

        const ghostTarget = draggedItem === 'full' ? document.getElementById('fullLogoBox') : document.getElementById(`shardWrap_${draggedItem}`);
        if (ghostTarget) ghostTarget.style.filter = `none`;

        let frameShift = deltaX / 3;
        let newFrame = frameAtDragStart + frameShift;
        while (newFrame >= TOTAL_FRAMES) newFrame -= TOTAL_FRAMES;
        while (newFrame < 0) newFrame += TOTAL_FRAMES;

        if (draggedItem === 'full') {
            frameData.full = newFrame;
        } else {
            frameData.shards[draggedItem] = newFrame;
        }
        lastX = x;
    };

    const applyInertia = (id, velocity) => {
        if (typeof gsap === 'undefined') return;
        const obj = { v: velocity };
        _inertiaAnim = gsap.to(obj, {
            v: 0,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => {
                if (Math.abs(obj.v) > 0.1) {
                    let newFrame = ((id === 'full') ? frameData.full : frameData.shards[id]) + (obj.v / 3);
                    while (newFrame >= TOTAL_FRAMES) newFrame -= TOTAL_FRAMES;
                    while (newFrame < 0) newFrame += TOTAL_FRAMES;
                    if (id === 'full') { frameData.full = newFrame; } else { frameData.shards[id] = newFrame; }
                }
            }
        });
    };

    const handleDragEnd = () => {
        if (!draggedItem) return;
        const ghostTarget = draggedItem === 'full' ? document.getElementById('fullLogoBox') : document.getElementById(`shardWrap_${draggedItem}`);
        if (ghostTarget) ghostTarget.style.filter = `none`;

        if (Math.abs(currentVelocity) > 2) {
            applyInertia(draggedItem, currentVelocity);
        }

        draggedItem = null;
        const hudHint = document.getElementById('hudHint');
        if (hudHint) {
            if (!isScattered) {
                hudHint.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.hint_drag : "<i class='fa-solid fa-arrows-left-right'></i> Tahan & Geser Untuk Memutar";
            } else {
                hudHint.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.hint_interact : "<i class='fa-solid fa-hand-pointer'></i> Geser Untuk Putar / Klik Untuk Data";
            }
            hudHint.style.color = "var(--text-secondary)";
        }
        const t = setTimeout(() => hasDragged = false, 100);
        _berandaTimeouts.push(t);
    };

    addListener(window, 'mousemove', handleDragMove);
    addListener(window, 'mouseup', handleDragEnd);
    addListener(window, 'touchmove', handleDragMove, { passive: false });
    addListener(window, 'touchend', handleDragEnd);

    // =========================================================
    // HUD ACTION BUTTON (SCATTER & ASSEMBLE)
    // =========================================================
    const btnAction = document.getElementById('btnAction');
    const swapToStatic = () => {
        if (typeof gsap === 'undefined') return;
        gsap.set('.shard-canvas, #fullLogoCanvas', { display: 'none' });
        gsap.set('.shard-static, #fullLogoStatic', { display: 'block', opacity: 1 });
    };
    const swapToSequence = () => {
        if (typeof gsap === 'undefined') return;
        gsap.set('.shard-static, #fullLogoStatic', { display: 'none' });
        gsap.set('.shard-canvas, #fullLogoCanvas', { display: 'block', opacity: 1 });
    };

    if (btnAction) {
        addListener(btnAction, 'click', () => {
            if (isAnimating || typeof gsap === 'undefined') return;
            isAnimating = true;
            initAudio();

            if (!isScattered) {
                isScattered = true;
                const st = document.getElementById('stage');
                if (st) st.classList.add('is-scattered');
                playSwoosh();

                // EFEK SUPERNOVA
                const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
                coreParticles.forEach(p => {
                    gsap.to(p, { speed: p.baseSpeed * 3, duration: 0.5, yoyo: true, repeat: 1, ease: "power2.out" });
                    gsap.to(p, { radius: p.baseRadius + 500 + (Math.random() * 1000), glow: isLightMode ? 0.2 : 0.1, duration: 2.5, ease: "expo.out" });
                });

                gsap.to('#fullLogoBox', { duration: 0.2, scale: 0, opacity: 0 });
                gsap.set('.shard-wrapper', { opacity: 1, x: 0, y: 0, scale: layout.fullScale || (layout.scale * 1.5), rotationY: 0 });
                assetsData.shards.forEach(s => frameData.shards[s.id] = frameData.full);
                renderCurrentFrame();
                swapToStatic();

                btnAction.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.btn_process : '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...';
                if (navigator.vibrate) navigator.vibrate(50);

                const tl = gsap.timeline({
                    onComplete: () => {
                        swapToSequence();
                        const hudHint = document.getElementById('hudHint');
                        if (hudHint) hudHint.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.hint_interact : "<i class='fa-solid fa-hand-pointer'></i> Geser Untuk Putar / Klik Untuk Data";
                        btnAction.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.btn_unite : '<i class="fa-solid fa-compress"></i> Satukan Identitas';
                        isAnimating = false;
                    }
                });
                tl.to('.shard-wrapper', { duration: 0.5, rotationY: -180, ease: "power2.in" });
                assetsData.shards.forEach((shard, index) => {
                    tl.to(`#shardWrap_${shard.id}`, { duration: 2.5, x: shard.tx, y: shard.ty, scale: shard.scale, rotationY: -360, ease: "expo.out" }, 0.4 + (index * 0.02));
                });
                if (godRays) gsap.to(godRays, { opacity: 0.2, duration: 2, ease: "expo.out" });

            } else {
                const st = document.getElementById('stage');
                if (st) st.classList.remove('is-scattered');
                const hudHint = document.getElementById('hudHint');
                if (hudHint) hudHint.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.hint_lock : "MENGUNCI FORMASI...";
                swapToStatic();
                btnAction.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.btn_assemble : '<i class="fa-solid fa-circle-notch fa-spin"></i> Merakit...';
                const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                if (godRays) gsap.to(godRays, { opacity: isLight ? 0.6 : 1, duration: 1.5 });

                // EFEK GRAVITY IMPLOSION
                coreParticles.forEach(p => {
                    gsap.to(p, { speed: p.baseSpeed * 4, duration: 1.5, ease: "expo.in" });
                    gsap.to(p, { radius: p.baseRadius, glow: p.baseGlow, duration: 1.5, ease: "expo.inOut", onComplete: () => p.speed = p.baseSpeed });
                });

                const wrapTargets = assetsData.shards.map(s => `#shardWrap_${s.id}`);
                const tl = gsap.timeline({
                    onComplete: () => {
                        gsap.to('#flashEffect', { duration: 0.15, opacity: 1, yoyo: true, repeat: 1 });
                        playBassDrop();
                        if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
                        gsap.set('.shard-wrapper', { opacity: 0 });
                        gsap.to('#fullLogoBox', { duration: 0.1, scale: layout.fullScale || (layout.scale * 1.5), opacity: 1 });
                        isScattered = false;
                        swapToSequence();
                        if (hudHint) hudHint.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.hint_drag : "<i class='fa-solid fa-arrows-left-right'></i> Tahan & Geser Untuk Memutar";
                        btnAction.innerHTML = (window.BERANDA_CMS && window.BERANDA_CMS.ui) ? window.BERANDA_CMS.ui.btn_scatter : '<i class="fa-solid fa-expand"></i> Pencar Formasi';
                        isAnimating = false;
                    }
                });

                tl.to(wrapTargets, { duration: 1.5, x: 0, y: 0, scale: layout.fullScale || (layout.scale * 1.5), rotationY: 0, ease: "expo.inOut", stagger: { each: 0.03, from: "edges" } });
                tl.to(wrapTargets, { duration: 0.8, rotationY: 360, scale: (layout.fullScale || (layout.scale * 1.5)) * 1.07, ease: "power3.inOut" }, "-=0.5");
                tl.to(wrapTargets, { duration: 0.2, scale: layout.fullScale || (layout.scale * 1.5), rotationY: 720, ease: "expo.out" });
            }
        });
    }

    // =========================================================
    // GSAP SCROLLTRIGGER
    // =========================================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        const scrollContainer = ".main-wrapper";

        const tStage = gsap.to("#fullLogoBox, #shardsContainer, #constellationCanvas", {
            yPercent: 30, ease: "none",
            scrollTrigger: { trigger: "#stage", scroller: scrollContainer, start: "top top", end: "bottom top", scrub: true }
        });
        if (tStage.scrollTrigger) _berandaScrollTriggers.push(tStage.scrollTrigger);

        gsap.set(".monumental-text", { xPercent: -50, yPercent: -50, x: 0, y: 0 });
        const tMonu = gsap.to(".monumental-text", {
            yPercent: -100, ease: "none",
            scrollTrigger: { trigger: "#stage", scroller: scrollContainer, start: "top top", end: "bottom top", scrub: true }
        });
        if (tMonu.scrollTrigger) _berandaScrollTriggers.push(tMonu.scrollTrigger);

        const wrapper = document.querySelector('.main-wrapper');
        if (wrapper) {
            addListener(wrapper, 'scroll', function () {
                const indicator = document.querySelector('.scroll-indicator');
                if (this.scrollTop > 100 && indicator) { indicator.style.opacity = '0'; }
            }, { passive: true });
        }

        gsap.utils.toArray(".reveal-up").forEach((el) => {
            const tween = gsap.fromTo(el,
                { autoAlpha: 0, y: 50 },
                { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, scroller: scrollContainer, start: "top 85%", toggleActions: "play none none reverse" } }
            );
            if (tween.scrollTrigger) _berandaScrollTriggers.push(tween.scrollTrigger);
        });

        gsap.utils.toArray(".gsap-counter").forEach(counter => {
            const target = +counter.getAttribute('data-target');
            if (!isNaN(target) && target > 0) {
                const tween = gsap.fromTo(counter,
                    { innerHTML: 0 },
                    { innerHTML: target, duration: 2.5, ease: "power2.out", snap: { innerHTML: 1 }, scrollTrigger: { trigger: counter.closest(".stats-grid"), scroller: scrollContainer, start: "top 80%" } }
                );
                if (tween.scrollTrigger) _berandaScrollTriggers.push(tween.scrollTrigger);
            }
        });

        gsap.utils.toArray(".panca-jiwa").forEach((jiwa) => {
            const st = ScrollTrigger.create({
                trigger: jiwa, scroller: scrollContainer, start: "top center", end: "bottom center",
                onEnter: () => jiwa.classList.add("is-active"),
                onLeaveBack: () => jiwa.classList.remove("is-active"),
                onEnterBack: () => jiwa.classList.add("is-active"),
                onLeave: () => jiwa.classList.remove("is-active")
            });
            _berandaScrollTriggers.push(st);
        });

        gsap.utils.toArray(".timeline-node").forEach((node) => {
            const tween = gsap.fromTo(node,
                { autoAlpha: 0, y: 50 },
                { autoAlpha: 1, y: 0, duration: 0.8, ease: "back.out(1.7)", scrollTrigger: { trigger: node, scroller: scrollContainer, start: "top 85%" } }
            );
            if (tween.scrollTrigger) _berandaScrollTriggers.push(tween.scrollTrigger);
        });

        const tRefresh = setTimeout(() => {
            try { ScrollTrigger.refresh(); } catch (e) {}
        }, 100);
        _berandaTimeouts.push(tRefresh);
    }

    // =========================================================
    // VVIP MOBILE SWIPE-TO-SEAL (LEDGER FORM)
    // =========================================================
    const knob = document.getElementById('swipeKnob');
    const fill = document.getElementById('swipeFill');
    const swipeContainer = document.getElementById('swipeSealContainer');
    const ledgerForm = document.getElementById('ledgerForm');

    if (knob && swipeContainer && ledgerForm) {
        let isDragging = false;
        let startX = 0;
        let maxDrag = swipeContainer.offsetWidth - knob.offsetWidth - 10;

        const onResize = () => {
            if (swipeContainer && knob) {
                maxDrag = swipeContainer.offsetWidth - knob.offsetWidth - 10;
            }
        };
        addListener(window, 'resize', onResize);

        const onStart = (e) => {
            isDragging = true;
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            knob.style.transition = 'none';
            if (fill) fill.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            let diff = currentX - startX;
            if (diff < 0) diff = 0;
            if (diff > maxDrag) diff = maxDrag;

            knob.style.transform = `translateX(${diff}px)`;
            if (fill) fill.style.width = (diff + 25) + 'px';
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;

            const currentTransform = knob.style.transform;
            const diff = parseFloat(currentTransform.replace('translateX(', '').replace('px)', '')) || 0;

            knob.style.transition = '0.3s ease';
            if (fill) fill.style.transition = '0.3s ease';

            if (diff >= maxDrag * 0.95) {
                knob.style.transform = `translateX(${maxDrag}px)`;
                if (fill) fill.style.width = '100%';
                if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
                const swipeText = document.getElementById('swipeText');
                if (swipeText) swipeText.innerHTML = "PESAN DISEGEL <i class='fa-solid fa-check'></i>";
                const tSubmit = setTimeout(() => {
                    if (typeof ledgerForm.requestSubmit === 'function') {
                        ledgerForm.requestSubmit();
                    } else {
                        ledgerForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                }, 800);
                _berandaTimeouts.push(tSubmit);
            } else {
                knob.style.transform = `translateX(0px)`;
                if (fill) fill.style.width = '0px';
            }
        };

        knob.addEventListener('mousedown', onStart);
        addListener(window, 'mousemove', onMove, { passive: false });
        addListener(window, 'mouseup', onEnd);

        knob.addEventListener('touchstart', onStart, { passive: true });
        addListener(window, 'touchmove', onMove, { passive: false });
        addListener(window, 'touchend', onEnd);
    }
};

window.initBeranda = initBeranda;

// Auto-init saat pertama kali script di-load jika GSAP sudah siap
const waitForGsapAndInit = () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        initBeranda();
    } else {
        const t = setTimeout(waitForGsapAndInit, 50);
        _berandaTimeouts.push(t);
    }
};
waitForGsapAndInit();

// =========================================================
// MODAL PHILOSOPHY & PANCA JIWA
// =========================================================
window.closeModal = function () {
    const modal = document.getElementById('philModal');
    if (modal) modal.classList.remove('active');
};

window.openJiwa = function (id) {
    const modal = document.getElementById('jiwaModal');
    const animContainer = document.getElementById('jiwaAnimContainer');
    const contentBox = document.getElementById('jiwaContent');
    if (!modal || !animContainer || !contentBox) return;

    if (_activeJiwaTl) { _activeJiwaTl.kill(); _activeJiwaTl = null; }
    animContainer.innerHTML = '';
    contentBox.classList.remove('show');

    const cmsJiwa = window.BERANDA_CMS && window.BERANDA_CMS.jiwa;
    const defaultData = {
        'keikhlasan': {
            title: (cmsJiwa && cmsJiwa.keikhlasan) ? cmsJiwa.keikhlasan.title : '1. Keikhlasan',
            desc: (cmsJiwa && cmsJiwa.keikhlasan) ? cmsJiwa.keikhlasan.desc : '<p>Jiwa yang pertama adalah keikhlasan. Prinsip ini berarti <em>sepi ing pamrih</em>, yakni berbuat sesuatu bukan karena didorong oleh keinginan untuk mendapatkan keuntungan tertentu, melainkan hanya untuk Allah SWT semata. Segala perbuatan dilakukan dengan niat semata-mata untuk ibadah, Lillah. Kiai dan guru ikhlas dalam mendidik, para pembantu Kiai ikhlas dalam membantu menjalankan proses pendidikan, serta para santri yang ikhlas dididik.</p><p>Jiwa ini menciptakan suasana kehidupan pondok yang harmonis antara Kiai yang disegani dengan santri yang taat, cinta dan penuh hormat. Jiwa ini pula yang menjadikan para santri senantiasa siap berjuang di jalan Allah, di manapun dan kapanpun.</p>'
        },
        'kesederhanaan': {
            title: (cmsJiwa && cmsJiwa.kesederhanaan) ? cmsJiwa.kesederhanaan.title : '2. Kesederhanaan',
            desc: (cmsJiwa && cmsJiwa.kesederhanaan) ? cmsJiwa.kesederhanaan.desc : '<p>Kehidupan yang sederhana tentu sangat erat kaitannya dengan pondok pesantren. Kehidupan santri yang tentram bersahaja tentu jauh dari kata berlebihan, mubazir dan lain sebagainya. Sederhana tidak berarti pasif atau menerima begitu saja, tidak juga berarti miskin dan melarat.</p><p>Justru dalam jiwa kesederhanan itu terdapat nilai-nilai kekuatan, kesanggupan, ketabahan dan penguasaan diri dalam menghadapi perjuangan hidup.</p>'
        },
        'kemandirian': {
            title: (cmsJiwa && cmsJiwa.kemandirian) ? cmsJiwa.kemandirian.title : '3. Kemandirian',
            desc: (cmsJiwa && cmsJiwa.kemandirian) ? cmsJiwa.kemandirian.desc : '<p>Kemandirian atau sering disebut juga dengan Berdikari (Berdiri di atas kaki sendiri) adalah kesanggupan menolong diri sendiri. Jiwa tersebut merupakan senjata ampuh yang dibekalkan pesantren kepada para santrinya. Berdikari tidak saja berarti bahwa santri sanggup belajar dan berlatih mengurus segala kepentingannya sendiri, tetapi pondok pesantren itu sendiri sebagai lembaga pendidikan juga harus sanggup berdikari sehingga tidak pernah menyandarkan kehidupannya kepada bantuan atau belas kasihan pihak lain.</p><p>Gontor menerapkan <em>Zelp-Berdruiping Systeem</em> (sama-sama memberikan iuran dan sama-sama memakai). Semua pekerjaan yang ada di dalam pondok dikerjakan oleh Kiai, guru dan para santrinya sendiri.</p>'
        },
        'ukhuwah': {
            title: (cmsJiwa && cmsJiwa.ukhuwah) ? cmsJiwa.ukhuwah.title : '4. Ukhuwwah Islamiyyah',
            desc: (cmsJiwa && cmsJiwa.ukhuwah) ? cmsJiwa.ukhuwah.desc : '<p>Kehidupan di pondok pesantren diliputi suasana persaudaraan yang akrab, sehingga segala suka dan duka dirasakan bersama dalam jalinan ukhuwwah Islamiyyah. Tidak ada dinding pemisah di antara mereka; apapun latarbelakang keluarga, suku, budaya, bahkan bangsa semua larut dalam jalinan ukhuwwah Islamiyyah.</p><p>Ukhuwah ini bukan saja selama mereka di Pondok, tetapi juga mempengaruhi ke arah persatuan umat dalam masyarakat setelah mereka terjun di masyarakat.</p>'
        },
        'kebebasan': {
            title: (cmsJiwa && cmsJiwa.kebebasan) ? cmsJiwa.kebebasan.title : '5. Kebebasan',
            desc: (cmsJiwa && cmsJiwa.kebebasan) ? cmsJiwa.kebebasan.desc : '<p>Bebas dalam berpikir dan berbuat, bebas dalam menentukan masa depan, bebas dalam memilih jalan hidup, dan bahkan bebas dari berbagai pengaruh negatif dari luar dirinya. Jiwa bebas ini akan menjadikan santri berjiwa besar dan optimis dalam menghadapi segala kesulitan.</p><p>Seringkali ditemukan unsur-unsur negatif dari kebebasan yang tak terkontrol, yaitu apabila kebebasan itu disalahgunakan, sehingga terlalu bebas (liberal) dan berakibat hilangnya arah tujuan dan prinsip. Ada pula yang terlalu bebas (untuk tidak mau dipengaruhi), berpegang teguh kepada tradisi yang dianggapnya baik, sehingga tidak mau mengikuti perkembangan zaman.</p><p>Maka kebebasan ini harus dikembalikan ke aslinya, yaitu bebas di dalam garis-garis yang positif, dengan penuh tanggungjawab; baik di dalam kehidupan pondok pesantren itu sendiri, maupun dalam kehidupan masyarakat. Untuk bisa mendapatkan kebebasan, seorang santri haruslah memegang teguh 4 prinsip sebelumnya agar tidak terjerumus ke dalam kebebasan yang salah.</p>'
        }
    };

    const data = defaultData[id];
    if (!data) return;

    const titleEl = document.getElementById('jiwaTitle');
    const descEl = document.getElementById('jiwaDesc');
    if (titleEl) titleEl.innerText = data.title;
    if (descEl) descEl.innerHTML = data.desc;

    modal.classList.add('active');
    if (typeof gsap === 'undefined') return;

    _activeJiwaTl = gsap.timeline();

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const colorMain = isLight ? '#b8860b' : '#d4af37';
    const colorGlow = isLight ? 'rgba(184,134,11,0.5)' : 'rgba(212,175,55,0.8)';
    const colorWhite = isLight ? '#000' : '#fff';

    if (id === 'keikhlasan') {
        const drop = document.createElement('div');
        drop.className = 'god-tier-element';
        drop.style.width = '4px'; drop.style.height = '4px';
        drop.style.background = '#fff'; drop.style.borderRadius = '50%';
        animContainer.appendChild(drop);

        _activeJiwaTl.fromTo(drop, { y: -300, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power2.in" });

        for (let i = 0; i < 3; i++) {
            const ripple = document.createElement('div');
            ripple.className = 'god-tier-element';
            ripple.style.border = `2px solid ${colorMain}`;
            ripple.style.borderRadius = '50%';
            ripple.style.boxShadow = `0 0 20px ${colorGlow}, inset 0 0 10px ${colorGlow}`;
            animContainer.appendChild(ripple);
            _activeJiwaTl.fromTo(ripple,
                { width: 0, height: 0, opacity: 1 },
                { width: 800 + (i * 200), height: 800 + (i * 200), opacity: 0, duration: 4, ease: "power2.out", delay: i * 0.5 }, "-=0.8"
            );
        }
        _activeJiwaTl.to(drop, { scale: 50, background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(212,175,55,0) 70%)', duration: 2, ease: "expo.out" }, "-=3.5");

    } else if (id === 'kesederhanaan') {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "600"); svg.setAttribute("height", "600");
        svg.setAttribute("viewBox", "0 0 600 600");
        svg.className = 'god-tier-svg';

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "300"); circle.setAttribute("cy", "300");
        circle.setAttribute("r", "250");
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", colorMain);
        circle.setAttribute("stroke-width", "2");
        circle.style.filter = `drop-shadow(0 0 10px ${colorGlow})`;

        svg.appendChild(circle);
        animContainer.appendChild(svg);

        const len = circle.getTotalLength();
        _activeJiwaTl.fromTo(circle,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 3, ease: "power4.inOut" }
        );
        _activeJiwaTl.to(circle, { strokeWidth: 1, scale: 0.9, opacity: 0.5, transformOrigin: 'center', duration: 2, ease: "power2.inOut" }, "-=1");

    } else if (id === 'kemandirian') {
        const monolith = document.createElement('div');
        monolith.className = 'god-tier-element';
        monolith.style.width = '80px'; monolith.style.height = '400px';
        monolith.style.background = `linear-gradient(to top, transparent, ${colorMain})`;
        monolith.style.boxShadow = `0 0 50px ${colorGlow}`;
        monolith.style.clipPath = 'polygon(50% 0%, 100% 10%, 100% 100%, 0% 10%)';
        animContainer.appendChild(monolith);

        _activeJiwaTl.fromTo(monolith,
            { scaleY: 0, transformOrigin: "bottom center", opacity: 0, y: 100 },
            { scaleY: 1, opacity: 1, y: 0, duration: 2.5, ease: "elastic.out(1, 0.5)" }
        );

        for (let i = 0; i < 20; i++) {
            const spark = document.createElement('div');
            spark.className = 'god-tier-element';
            spark.style.width = '3px'; spark.style.height = '15px';
            spark.style.background = '#fff';
            spark.style.boxShadow = `0 0 10px ${colorWhite}`;
            animContainer.appendChild(spark);

            const sx = (Math.random() - 0.5) * 100;
            _activeJiwaTl.fromTo(spark,
                { x: sx, y: 200, opacity: 1, scale: 0 },
                { x: sx * 2, y: -300, opacity: 0, scale: Math.random() * 2, duration: 1.5 + Math.random(), ease: "power2.out", delay: Math.random() * 0.5 },
                0.5
            );
        }

    } else if (id === 'ukhuwah') {
        const numNodes = 12;
        const nodes = [];
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "800"); svg.setAttribute("height", "800");
        svg.className = 'god-tier-svg';
        animContainer.appendChild(svg);

        for (let i = 0; i < numNodes; i++) {
            const angle = (i / numNodes) * Math.PI * 2;
            const r = 250;
            const nx = 400 + Math.cos(angle) * r;
            const ny = 400 + Math.sin(angle) * r;

            const node = document.createElement('div');
            node.className = 'god-tier-element';
            node.style.width = '12px'; node.style.height = '12px';
            node.style.background = colorMain;
            node.style.borderRadius = '50%';
            node.style.boxShadow = `0 0 20px ${colorGlow}`;
            animContainer.appendChild(node);

            nodes.push({ el: node, x: nx, y: ny, ix: 400, iy: 400 });
            _activeJiwaTl.fromTo(node,
                { x: 400, y: 400, scale: 0 },
                { x: nx, y: ny, scale: 1, duration: 2, ease: "expo.out" },
                0
            );

            if (i > 0) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("stroke", colorMain);
                line.setAttribute("stroke-width", "2");
                line.setAttribute("opacity", "0");
                svg.appendChild(line);

                const prev = nodes[i - 1];
                _activeJiwaTl.to(line, {
                    attr: { x1: prev.x, y1: prev.y, x2: nx, y2: ny },
                    opacity: 0.6,
                    duration: 1.5,
                    ease: "power2.inOut"
                }, 1);
            }
        }

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("stroke", colorMain); line.setAttribute("stroke-width", "2"); line.setAttribute("opacity", "0");
        svg.appendChild(line);
        _activeJiwaTl.to(line, { attr: { x1: nodes[numNodes - 1].x, y1: nodes[numNodes - 1].y, x2: nodes[0].x, y2: nodes[0].y }, opacity: 0.6, duration: 1.5, ease: "power2.inOut" }, 1.5);
        _activeJiwaTl.to(animContainer, { rotation: 360, duration: 40, ease: "linear", repeat: -1 }, 0);

    } else if (id === 'kebebasan') {
        const shell = document.createElement('div');
        shell.className = 'god-tier-element';
        shell.style.width = '150px'; shell.style.height = '150px';
        shell.style.border = `4px solid ${colorMain}`;
        shell.style.borderRadius = '50%';
        animContainer.appendChild(shell);

        _activeJiwaTl.fromTo(shell, { scale: 0 }, { scale: 1, duration: 1, ease: "back.out(1.5)" });
        _activeJiwaTl.to(shell, { scale: 1.2, opacity: 0, borderWidth: 0, duration: 0.5, ease: "power2.in" }, "+=0.5");

        for (let i = 0; i < 40; i++) {
            const bird = document.createElement('div');
            bird.className = 'god-tier-element';
            bird.style.width = '6px'; bird.style.height = '6px';
            bird.style.background = '#fff';
            bird.style.borderRadius = '50%';
            bird.style.boxShadow = `0 0 15px ${colorGlow}`;
            animContainer.appendChild(bird);

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 500 + 200;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const tz = (Math.random() - 0.5) * 500;

            _activeJiwaTl.fromTo(bird,
                { x: 0, y: 0, z: 0, scale: 0, opacity: 1 },
                { x: tx, y: ty, z: tz, scale: Math.random() * 2 + 0.5, opacity: 0, duration: 3 + Math.random(), ease: "power3.out" },
                1.5
            );
        }
    }

    _activeJiwaTl.add(() => {
        contentBox.classList.add('show');
    }, 2.5);
};

window.closeJiwa = function () {
    const modal = document.getElementById('jiwaModal');
    const contentBox = document.getElementById('jiwaContent');
    if (contentBox) contentBox.classList.remove('show');
    if (_activeJiwaTl && typeof gsap !== 'undefined') {
        gsap.to('#jiwaAnimContainer', { opacity: 0, duration: 0.5 });
    }
    const t = setTimeout(() => {
        if (modal) modal.classList.remove('active');
        const animContainer = document.getElementById('jiwaAnimContainer');
        if (animContainer) {
            animContainer.innerHTML = '';
            animContainer.style.opacity = 1;
        }
        if (typeof gsap !== 'undefined') {
            gsap.set('#jiwaAnimContainer', { clearProps: "all" });
        }
        if (_activeJiwaTl) { _activeJiwaTl.kill(); _activeJiwaTl = null; }
    }, 500);
    _berandaTimeouts.push(t);
};

// =========================================================
// LOGIK ARSIP SOVEREIGN
// =========================================================
window.openArchive = function (key) {
    const modal = document.getElementById('archiveModal');
    if (!modal) return;
    const cms = window.BERANDA_CMS && window.BERANDA_CMS.archive;
    let data;
    if (key === 'visi') {
        data = {
            date: (cms && cms.visi) ? cms.visi.date : '30 MARET 2026',
            title: (cms && cms.visi) ? cms.visi.title : 'Deklarasi Visi Sovereign',
            content: (cms && cms.visi) ? cms.visi.content : `
                <p>Naskah ini mencatat sumpah agung angkatan Expedient mengenai visi dan arah tujuan masa depan.</p>
                <p>Kami berjanji untuk memelihara warisan <span class="redacted" onclick="revealRedacted(this)">KEISLAMAN</span> dan mengikat erat <span class="redacted" onclick="revealRedacted(this)">PERSAUDARAAN</span>.</p>
                <p>Nilai-nilai ini diukir bukan pada batu, melainkan pada karakter setiap individu.</p>
                <p><em>Selesai.</em></p>
            `
        };
    } else if (key === 'simpul') {
        data = {
            date: (cms && cms.simpul) ? cms.simpul.date : '15 FEBRUARI 2026',
            title: (cms && cms.simpul) ? cms.simpul.title : 'Simpul Kesucian: Menjaga Nilai Arrisalah',
            content: (cms && cms.simpul) ? cms.simpul.content : `
                <p>Manuskrip mengenai pemeliharaan nilai-nilai murni dalam harmoni pasca-kelulusan.</p>
                <p>Di balik kemewahan dunia, pondasi kita tetap bersandar pada <span class="redacted" onclick="revealRedacted(this)">KESEDERHANAAN</span> hati.</p>
                <p>Setiap duta angkatan diharapkan menjadi mercusuar teladan di manapun mereka memijakkan kaki.</p>
                <p><em>Tertanda, Dewan Kehormatan.</em></p>
            `
        };
    }
    if (!data) return;

    const arcDate = document.getElementById('arcDate');
    const arcTitle = document.getElementById('arcTitle');
    const arcBody = document.getElementById('arcBody');
    const paper = document.getElementById('archivePaper');

    if (arcDate) arcDate.innerText = data.date;
    if (arcTitle) arcTitle.innerText = data.title;
    if (arcBody) arcBody.innerHTML = data.content;

    modal.classList.add('active');
    if (paper) paper.scrollTop = 0;
};

window.closeArchive = function () {
    const modal = document.getElementById('archiveModal');
    if (modal) modal.classList.remove('active');
};

window.revealRedacted = function (el) {
    if (el) el.classList.add('revealed');
};

if (typeof window !== 'undefined' && !(window as any).__berandaRedactedBound) {
    (window as any).__berandaRedactedBound = true;
    document.addEventListener('click', function (e) {
        if (e.target && (e.target as HTMLElement).classList && (e.target as HTMLElement).classList.contains('redacted')) {
            (e.target as HTMLElement).classList.add('revealed');
        }
    });
}