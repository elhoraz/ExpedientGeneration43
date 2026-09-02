const onDOMReady = (fn) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
};

function hapticNav() { if (navigator.vibrate) navigator.vibrate(20); }
window.hapticNav = hapticNav;

window.showToast = function(title, message, isError = false) {
    const aegisToastSys = document.getElementById('aegisToast');
    const radarNameSys = document.getElementById('radarName');
    if(aegisToastSys && radarNameSys) {
        document.querySelector('.aegis-title').innerText = title;
        radarNameSys.innerText = message;
        if(isError) {
            aegisToastSys.style.borderLeft = "4px solid #8b0000";
            document.querySelector('.aegis-title').style.color = "#8b0000";
            document.querySelector('.aegis-icon').style.color = "#8b0000";
        } else {
            aegisToastSys.style.borderLeft = "4px solid #d4af37";
            document.querySelector('.aegis-title').style.color = "var(--text-secondary)";
            document.querySelector('.aegis-icon').style.color = "#d4af37";
        }
        aegisToastSys.classList.add('show');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setTimeout(() => aegisToastSys.classList.remove('show'), 6000);
    }
};

window.showConfirm = function(title, text) {
    return new Promise((resolve) => {
        if (navigator.vibrate) navigator.vibrate(50);
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.backdropFilter = 'blur(10px)';
        overlay.style.zIndex = '100000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';

        const box = document.createElement('div');
        box.style.background = 'rgba(15, 18, 16, 0.9)';
        box.style.border = '1px solid rgba(212, 175, 55, 0.4)';
        box.style.borderRadius = '20px';
        box.style.padding = '35px 30px';
        box.style.maxWidth = '400px';
        box.style.width = '90%';
        box.style.textAlign = 'center';
        box.style.transform = 'translateY(30px)';
        box.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2)';
        box.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8)';
        box.style.fontFamily = "'Inter', sans-serif";

        const iconEl = document.createElement('div');
        iconEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
        iconEl.style.fontSize = '3rem';
        iconEl.style.color = '#d4af37';
        iconEl.style.marginBottom = '15px';

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.color = '#d4af37';
        titleEl.style.fontFamily = "'Playfair Display', serif";
        titleEl.style.marginTop = '0';
        titleEl.style.marginBottom = '15px';
        titleEl.style.fontSize = '1.5rem';

        const textEl = document.createElement('p');
        textEl.textContent = text;
        textEl.style.color = '#ccc';
        textEl.style.fontSize = '0.95rem';
        textEl.style.marginBottom = '30px';
        textEl.style.lineHeight = '1.5';

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '15px';
        btnContainer.style.justifyContent = 'center';

        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'BATAL';
        btnCancel.style.flex = '1';
        btnCancel.style.padding = '12px 15px';
        btnCancel.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        btnCancel.style.background = 'rgba(255, 255, 255, 0.05)';
        btnCancel.style.color = '#fff';
        btnCancel.style.borderRadius = '50px';
        btnCancel.style.cursor = 'pointer';
        btnCancel.style.fontWeight = 'bold';
        btnCancel.style.letterSpacing = '1px';
        btnCancel.style.transition = '0.3s';
        btnCancel.onmouseover = () => btnCancel.style.background = 'rgba(255,255,255,0.1)';
        btnCancel.onmouseout = () => btnCancel.style.background = 'rgba(255,255,255,0.05)';

        const btnOk = document.createElement('button');
        btnOk.textContent = 'YA, LANJUTKAN';
        btnOk.style.flex = '1';
        btnOk.style.padding = '12px 15px';
        btnOk.style.border = 'none';
        btnOk.style.background = 'linear-gradient(135deg, #d4af37, #aa8529)';
        btnOk.style.color = '#000';
        btnOk.style.borderRadius = '50px';
        btnOk.style.cursor = 'pointer';
        btnOk.style.fontWeight = 'bold';
        btnOk.style.letterSpacing = '1px';
        btnOk.style.transition = '0.3s';
        btnOk.style.boxShadow = '0 5px 15px rgba(212, 175, 55, 0.3)';
        btnOk.onmouseover = () => btnOk.style.transform = 'translateY(-2px)';
        btnOk.onmouseout = () => btnOk.style.transform = 'translateY(0)';

        btnContainer.appendChild(btnCancel);
        btnContainer.appendChild(btnOk);

        box.appendChild(iconEl);
        box.appendChild(titleEl);
        box.appendChild(textEl);
        box.appendChild(btnContainer);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = '1';
            box.style.transform = 'translateY(0)';
        }, 10);

        function close(result) {
            overlay.style.opacity = '0';
            box.style.transform = 'translateY(30px)';
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 300);
        }

        btnCancel.onclick = () => { if (navigator.vibrate) navigator.vibrate(20); close(false); };
        btnOk.onclick = () => { if (navigator.vibrate) navigator.vibrate(20); close(true); };
    });
};

onDOMReady(() => {
    // SIDEBAR TOGGLE LOGIC
    const btnMenuOpen = document.getElementById('btnMenuOpen');
    const btnMenuClose = document.getElementById('btnMenuClose');
    const sidebarNav = document.getElementById('sidebarNav');
    
    if (btnMenuOpen && btnMenuClose) {
        btnMenuOpen.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-closed');
            hapticNav();
        });
        
        btnMenuClose.addEventListener('click', () => {
            document.body.classList.add('sidebar-closed');
            hapticNav();
        });

        // P1-6: REACTIVE MOBILE DETECTION (matchMedia instead of static innerWidth)
        // Handles orientation changes, split-screen, and dynamic resizing
        const mobileQuery = window.matchMedia('(max-width: 768px)');
        let mobileHandlersAttached = false;

        // Swipe gesture handlers (defined once, attached/detached reactively)
        let touchStartY = 0;
        const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
        const handleTouchMove = (e) => {
            if (touchStartY === 0) return;
            const deltaY = e.touches[0].clientY - touchStartY;
            if (deltaY > 40 && !document.body.classList.contains('sidebar-closed')) {
                document.body.classList.add('sidebar-closed');
                hapticNav(); touchStartY = 0;
            } else if (deltaY < -40 && document.body.classList.contains('sidebar-closed')) {
                document.body.classList.remove('sidebar-closed');
                hapticNav(); touchStartY = 0;
            }
        };
        const handleTouchEnd = () => { touchStartY = 0; };

        const setupMobileHandlers = (isMobile) => {
            if (isMobile && !mobileHandlersAttached) {
                // Auto-close sidebar on link click
                document.querySelectorAll('.sidebar .nav-item[href^="/"]').forEach(link => {
                    link.addEventListener('click', () => document.body.classList.add('sidebar-closed'));
                });
                // Swipe gestures on drawer handle & sidebar
                btnMenuOpen.addEventListener('touchstart', handleTouchStart, { passive: true });
                btnMenuOpen.addEventListener('touchmove', handleTouchMove, { passive: true });
                btnMenuOpen.addEventListener('touchend', handleTouchEnd, { passive: true });
                if (sidebarNav) {
                    sidebarNav.addEventListener('touchstart', handleTouchStart, { passive: true });
                    sidebarNav.addEventListener('touchmove', handleTouchMove, { passive: true });
                    sidebarNav.addEventListener('touchend', handleTouchEnd, { passive: true });
                }
                mobileHandlersAttached = true;
            } else if (!isMobile && mobileHandlersAttached) {
                // Clean up mobile handlers when switching to desktop
                btnMenuOpen.removeEventListener('touchstart', handleTouchStart);
                btnMenuOpen.removeEventListener('touchmove', handleTouchMove);
                btnMenuOpen.removeEventListener('touchend', handleTouchEnd);
                if (sidebarNav) {
                    sidebarNav.removeEventListener('touchstart', handleTouchStart);
                    sidebarNav.removeEventListener('touchmove', handleTouchMove);
                    sidebarNav.removeEventListener('touchend', handleTouchEnd);
                }
                mobileHandlersAttached = false;
            }
        };

        setupMobileHandlers(mobileQuery.matches);
        mobileQuery.addEventListener('change', (e) => setupMobileHandlers(e.matches));
    } else {
        // Guest mode: no sidebar, so adjust main-wrapper left position
        document.body.classList.add('sidebar-closed');
    }

    // CURSOR LOGIC
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');
    if (window.matchMedia("(pointer: fine)").matches && cursorDot && cursorRing) {
        let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            cursorDot.style.left = `${mouseX}px`; cursorDot.style.top = `${mouseY}px`;
        });
        function animateCursor() {
            ringX += (mouseX - ringX) * 0.15; ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.left = `${ringX}px`; cursorRing.style.top = `${ringY}px`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor();
        const addHover = () => document.body.classList.add('cursor-hovering');
        const removeHover = () => document.body.classList.remove('cursor-hovering');
        // Event Delegation — no more setInterval DOM scan
        document.body.addEventListener('mouseover', (e) => {
            const target = e.target.closest('a, button, .hover-trigger, .shard-wrapper');
            if (target) addHover();
        });
        document.body.addEventListener('mouseout', (e) => {
            const target = e.target.closest('a, button, .hover-trigger, .shard-wrapper');
            if (target) removeHover();
        });
        document.body.classList.add('custom-cursor-ready');
    }

    // THEME SETUP
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themeText = document.getElementById('themeText');
    const toggleIcon = document.getElementById('toggleIcon');
    if (currentTheme === 'light' && themeText && toggleIcon) {
        themeText.innerText = 'Siang';
        toggleIcon.className = 'fa-solid fa-sun';
    }

    const btnTheme = document.getElementById('btnTheme');
    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            hapticNav();
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('expedient_theme', newTheme);
            
            // Dynamic Browser Theme Color update (Force Repaint)
            let metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) metaThemeColor.remove();
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = "theme-color";
            metaThemeColor.content = newTheme === 'light' ? '#fcfbf8' : '#030504';
            document.head.appendChild(metaThemeColor);

            let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
            if (appleMeta) appleMeta.remove();
            appleMeta = document.createElement('meta');
            appleMeta.name = "apple-mobile-web-app-status-bar-style";
            appleMeta.content = newTheme === 'light' ? 'default' : 'black-translucent';
            document.head.appendChild(appleMeta);
            
            if (window.particlesArray && window.Particle) {
                for(let i=0; i<20; i++) window.particlesArray.push(new window.Particle(window.innerWidth - 50, 50, Math.random()*3+1, -(Math.random()*4+2)));
            }
            
            if (newTheme === 'light') { 
                themeText.innerText = 'Siang'; 
                toggleIcon.className = 'fa-solid fa-sun'; 
            } else { 
                themeText.innerText = 'Malam'; 
                toggleIcon.className = 'fa-solid fa-moon'; 
            }
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// P2-14: SCROLL POSITION PRESERVATION
// Simpan & restore posisi scroll per-halaman via sessionStorage
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    const SCROLL_KEY = 'aegis_scroll_' + location.pathname;
    const wrapper = document.querySelector('.main-wrapper');
    if (!wrapper) return;

    // Restore scroll saat halaman load (dengan delay untuk menunggu DOM siap)
    const savedPos = sessionStorage.getItem(SCROLL_KEY);
    if (savedPos) {
        const pos = parseInt(savedPos, 10);
        // Dua kali restore: langsung dan setelah 300ms (untuk DOM dinamis)
        wrapper.scrollTop = pos;
        setTimeout(() => { wrapper.scrollTop = pos; }, 300);
        sessionStorage.removeItem(SCROLL_KEY); // Hapus setelah dipakai
    }

    // Simpan scroll sebelum navigasi
    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
        sessionStorage.setItem(SCROLL_KEY, wrapper.scrollTop);
    }, true); // capture phase agar jalan sebelum transit intercept
})();

// ═══════════════════════════════════════════════════════════════════════════
// AEGIS TRANSIT — Instagram/TikTok-style instant page transitions
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    'use strict';

    const EXCLUDE = ['/chat', '/logout', '/auth/', '/biometric/', '/push/'];
    const prefetched = new Set();

    // ── 1. Progress Bar (top of screen) ──────────────────────────────────
    const bar = document.createElement('div');
    bar.id = 'transit-bar';
    document.body.appendChild(bar);

    const barStyle = document.createElement('style');
    barStyle.textContent = `
        /* Enable Native Hardware-Accelerated Cross-Document View Transitions (Chrome 126+) */
        @view-transition { navigation: auto; }
        
        /* Fallback & Enhancements for Aegis Transit JS System */
        #transit-bar {
            position: fixed; top: 0; left: 0; z-index: 9999999;
            height: 3px; width: 0; opacity: 0; pointer-events: none;
            background: linear-gradient(90deg, #d4af37, #00ff88, #d4af37);
            background-size: 200% auto;
            box-shadow: 0 0 12px rgba(212,175,55,.6);
            transition: width .4s cubic-bezier(.4,0,.2,1), opacity .2s ease;
            animation: transitShimmer 1.2s linear infinite;
        }
        @keyframes transitShimmer { to { background-position: 200% center; } }
        
        /* iOS-style Slide & Cross-fade (Keluar ke Kiri) */
        .transit-fade-out .main-wrapper {
            animation: iosSlideOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards !important;
        }
        @keyframes iosSlideOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0.8; transform: translateX(-15%); }
        }
        
        /* iOS-style Slide & Cross-fade (Masuk dari Kanan) */
        .transit-fade-in .main-wrapper {
            animation: iosSlideIn 0.35s cubic-bezier(0.2, 0.9, 0.1, 1) forwards;
        }
        @keyframes iosSlideIn {
            from { opacity: 0; transform: translateX(30%); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(barStyle);

    function barStart() {
        bar.style.transition = 'width .3s ease, opacity .15s ease';
        bar.style.width = '0'; bar.style.opacity = '1';
        requestAnimationFrame(() => {
            bar.style.width = '30%';
            setTimeout(() => { bar.style.width = '60%'; }, 200);
            setTimeout(() => { bar.style.width = '85%'; }, 500);
        });
    }
    function barDone() {
        bar.style.transition = 'width .12s ease, opacity .4s ease .2s';
        bar.style.width = '100%';
        setTimeout(() => { bar.style.opacity = '0'; bar.style.width = '0'; }, 600);
    }

    // ── 2. Check if navigating from transition ──────────────────────────
    const isTransit = sessionStorage.getItem('aegis_transit');
    const loader = document.getElementById('loadingScreen');

    if (isTransit) {
        // Coming from a click transition — skip loading screen, fade in content
        sessionStorage.removeItem('aegis_transit');
        if (loader) { loader.style.display = 'none'; loader.style.visibility = 'hidden'; loader.style.opacity = '0'; }
        document.body.classList.add('transit-fade-in');
        barDone();
        setTimeout(() => document.body.classList.remove('transit-fade-in'), 300);
    } else {
        // Normal entry (direct URL, refresh) — show fast loader
        const loaderStart = Date.now();
        window.addEventListener('load', () => {
            const elapsed = Date.now() - loaderStart;
            const remaining = Math.max(100 - elapsed, 0);
            setTimeout(() => {
                if (loader) {
                    loader.style.transition = 'opacity 0.3s ease';
                    loader.style.opacity = '0';
                    setTimeout(() => { loader.style.visibility = 'hidden'; loader.style.display = 'none'; }, 320);
                }
            }, remaining);
        });
    }

    // ── 3. Click interceptor — instant visual feedback ───────────────────
    function canIntercept(href) {
        if (!href || href.startsWith('javascript') || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return false;
        try {
            const u = new URL(href, location.origin);
            if (u.origin !== location.origin) return false;
            if (u.pathname === location.pathname) return false;
            return !EXCLUDE.some(p => u.pathname.startsWith(p));
        } catch { return false; }
    }

    document.addEventListener('click', e => {
        // Skip if modifier keys, form submits, or buttons
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!canIntercept(href)) return;
        if (a.getAttribute('target') === '_blank') return;
        if (a.hasAttribute('download')) return;

        e.preventDefault();

        // Instant visual feedback
        sessionStorage.setItem('aegis_transit', '1');
        document.body.classList.add('transit-fade-out');

        // Skip progress bar for key pages — pure fade only
        const dest = new URL(href, location.origin).pathname;
        const NO_BAR = ['/beranda', '/radar'];
        if (!NO_BAR.some(p => dest.startsWith(p))) {
            barStart();
        }

        // Navigate after brief fade (150ms — feels instant to user)
        setTimeout(() => { window.location.href = href; }, 150);
    }, true);

    // ── 4. Prefetch on hover/touch ──────────────────────────────────────
    let hoverTimer = null;

    function canPrefetch(href) {
        if (!href) return false;
        if (EXCLUDE.some(e => href.includes(e))) return false;
        if (href.startsWith('javascript') || href.startsWith('#')) return false;
        try {
            const u = new URL(href, location.origin);
            return u.origin === location.origin && u.pathname !== location.pathname;
        } catch { return false; }
    }

    function doPrefetch(url) {
        if (prefetched.has(url)) return;
        prefetched.add(url);
        const link = document.createElement('link');
        link.rel = 'prefetch'; link.href = url; link.as = 'document';
        document.head.appendChild(link);
    }

    document.addEventListener('mouseover', e => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!canPrefetch(href)) return;
        hoverTimer = setTimeout(() => doPrefetch(new URL(href, location.origin).pathname), 80);
    });
    document.addEventListener('mouseout', () => clearTimeout(hoverTimer));

    document.addEventListener('touchstart', e => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!canPrefetch(href)) return;
        doPrefetch(new URL(href, location.origin).pathname);
    }, { passive: true });

})();

// SW Registration
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
            
            // Tanya izin Push Notification & Subscribe
            if (window.ExpedientConfig && window.ExpedientConfig.userId !== null) {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        subscribeUserToPush(registration);
                    }
                });
            }
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    }
});

// Fungsi untuk konversi VAPID public key
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function subscribeUserToPush(registration) {
    // Ambil VAPID key dari backend
    fetch('/push/public-key')
        .then(res => res.json())
        .then(data => {
            const applicationServerKey = urlB64ToUint8Array(data.publicKey);
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
        })
        .then(subscription => {
            // Kirim ke backend
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfHash = csrfMeta ? csrfMeta.getAttribute('content') : '';
            return fetch('/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfHash
                },
                body: JSON.stringify(subscription)
            });
        })
        .then(result => console.log('[Web Push] Subscribed:', result))
        .catch(err => console.error('[Web Push] Failed to subscribe:', err));
}

// ── ELITE FETCH (OFFLINE BACKGROUND SYNC INTERCEPTOR) ─────────────────
window.eliteFetch = async function(url, options, syncTag = 'default-sync') {
    try {
        // Coba kirim standar (Network First)
        if (!navigator.onLine) throw new Error("Offline");
        const res = await fetch(url, options);
        if (!res.ok) throw new Error("Server Error");
        return res;
    } catch (error) {
        console.warn(`[EliteFetch] Network gagal untuk ${url}. Menyimpan ke IndexedDB untuk Sinkronisasi Latar Belakang...`);
        
        // Simpan ke IndexedDB via Service Worker Message
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            
            // Konversi FormData ke tipe terserialisasi untuk IndexedDB
            let serializedBody = options.body;
            if (options.body instanceof FormData) {
                const plainObj = {};
                options.body.forEach((value, key) => plainObj[key] = value);
                serializedBody = new URLSearchParams(plainObj).toString();
                
                if (!options.headers) options.headers = {};
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }

            navigator.serviceWorker.controller.postMessage({
                type: 'QUEUE_OFFLINE_REQUEST',
                payload: {
                    url: url,
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    body: serializedBody,
                    syncTag: syncTag,
                    timestamp: Date.now()
                }
            });

            // Daftarkan Sync API ke OS (Untuk Chrome/Android)
            try {
                const swRegistration = await navigator.serviceWorker.ready;
                if ('sync' in swRegistration) {
                    await swRegistration.sync.register('expedient-sync');
                }
            } catch (e) {
                console.log('[Elite PWA] Native Sync gagal, menggunakan iOS Fallback.', e);
            }

            // Kembalikan Response Palsu 202 (Accepted) untuk UI (Fatamorgana)
            return new Response(JSON.stringify({
                status: 'success',
                message: 'Tersimpan Offline. Akan disinkronisasi saat sinyal kembali.',
                isOfflinePending: true,
                syncTag: syncTag
            }), {
                status: 202,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        throw error;
    }
};

// Pendengar pesan dari Service Worker (untuk menghapus ikon Jam saat sukses terkirim)
if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SYNC_SUCCESS') {
            console.log(`[Elite PWA] Sinkronisasi Latar Belakang Berhasil: ${event.data.syncTag}`);
            
            // Ubah semua elemen di UI yang memiliki tag pending
            const pendingElements = document.querySelectorAll(`[data-sync-tag="${event.data.syncTag}"]`);
            pendingElements.forEach(el => {
                el.classList.remove('offline-pending');
                el.classList.add('sync-completed');
                
                // Ubah Ikon Jam menjadi Centang
                const icon = el.querySelector('.fa-clock');
                if (icon) {
                    icon.className = 'fa-solid fa-check-double';
                    icon.style.color = '#00ff88';
                }
            });
            
            // Beri tahu script halaman untuk reload jika diperlukan
            window.dispatchEvent(new CustomEvent('eliteSyncSuccess', { detail: event.data }));
        }
    });
}

// Listener saat internet kembali nyala (Khusus iOS Safari / OS lama)
window.addEventListener('online', () => {
    console.log('[Elite PWA] Koneksi kembali! Membangunkan Service Worker...');
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_FLUSH_QUEUE' });
    }
});

// ── ELITE UX: GLOBAL AUTO SKELETON (IMAGE FALLBACK) ──────────────────
onDOMReady(() => {
    // Cari semua gambar di halaman yang belum selesai dimuat oleh browser
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Abaikan gambar logo loader (karena dia bagian dari layar loading utama)
        if (img.classList.contains('loader-logo')) return;
        
        if (!img.complete) {
            // Beri topeng Skeleton Emas
            img.classList.add('skeleton-shimmer');
            
            // Copot topengnya begitu gambar asli selesai didownload
            img.addEventListener('load', () => img.classList.remove('skeleton-shimmer'));
            
            // Copot juga jika gambarnya rusak (404) agar tidak nge-bug
            img.addEventListener('error', () => img.classList.remove('skeleton-shimmer'));
        }
    });
});

// ── AEGIS NATIVE ENGINE (PHASE 1: HAPTIC, RIPPLE, RUBBER BAND) ──────────

// 1. Precise Haptic Engine
window.aegisVibrate = function(type = 'light') {
    if (!navigator.vibrate) return;
    try {
        switch (type) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(25); break;
            case 'heavy': navigator.vibrate([40, 20, 40]); break;
            case 'success': navigator.vibrate([15, 30, 15, 30, 40]); break;
            case 'error': navigator.vibrate([50, 50, 50, 50]); break;
            default: navigator.vibrate(10);
        }
    } catch (e) {}
};

// 2. Global Point-of-Touch Glassmorphic Ripple
document.addEventListener('pointerdown', (e) => {
    // Tembak efek ini ke tombol utama, tombol card, toggle menu, dll
    const target = e.target.closest('button, .btn-prime, .btn-secondary, .card-socials a, .menu-toggle, .nav-item, .soc-btn');
    if (!target) return;

    if (window.getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
    }
    target.style.overflow = 'hidden'; // Agar gelombang tidak meluber keluar tombol

    const ripple = document.createElement('span');
    ripple.classList.add('aegis-ripple');

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = Math.max(rect.width, rect.height) * 1.5; // Agak dibesarkan agar menutup ujung-ujung
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    target.appendChild(ripple);

    // Sensasi klik fisik (mikro)
    window.aegisVibrate('light');

    setTimeout(() => {
        if (ripple.parentNode) ripple.remove();
    }, 600);
}, { passive: true });

// 3. Apple iOS Rubber Banding & Pull-to-Refresh (Phase 1 & 3)
onDOMReady(() => {
    const mainWrapper = document.querySelector('.main-wrapper');
    if (!mainWrapper) return;

    // Exclude specific pages from rubber banding (e.g. maps and galleries)
    const path = window.location.pathname;
    if (path.startsWith('/radar') || path.startsWith('/galeri')) {
        return;
    }

    // Injeksi Elemen Pull-to-Refresh
    const ptrHtml = `<div id="aegisPtr" class="pull-to-refresh-indicator"><div class="ptr-icon"></div></div>`;
    mainWrapper.insertAdjacentHTML('afterbegin', ptrHtml);
    const ptrIndicator = document.getElementById('aegisPtr');
    const ptrIcon = ptrIndicator.querySelector('.ptr-icon');

    let startY = 0;
    let translateY = 0;
    let isPulling = false;
    let isBouncingAtBottom = false;

    mainWrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        startY = e.touches[0].clientY;
        mainWrapper.classList.remove('spring-snap-back');
        isPulling = false;
        isBouncingAtBottom = false;
    }, { passive: true });

    mainWrapper.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1) return;
        
        const y = e.touches[0].clientY;
        const deltaY = y - startY;

        // Tarikan dari Langit-langit (Top)
        if (mainWrapper.scrollTop <= 0 && deltaY > 0) {
            isPulling = true;
            // Fisika Viskositas
            translateY = Math.sqrt(deltaY) * 4; 
            mainWrapper.style.transform = `translateY(${translateY}px)`;
            
            // Logika Pull-to-Refresh
            ptrIndicator.style.opacity = translateY / 50;
            ptrIcon.style.transform = `rotate(${translateY * 5}deg)`;

            if (e.cancelable) e.preventDefault(); 
        } 
        // Tarikan dari Dasar Jurang (Bottom)
        else if ((mainWrapper.scrollTop + mainWrapper.clientHeight >= mainWrapper.scrollHeight - 1) && deltaY < 0) {
            isBouncingAtBottom = true;
            translateY = -Math.sqrt(Math.abs(deltaY)) * 4;
            mainWrapper.style.transform = `translateY(${translateY}px)`;
            
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    mainWrapper.addEventListener('touchend', () => {
        if (isPulling || isBouncingAtBottom) {
            mainWrapper.classList.add('spring-snap-back');
            mainWrapper.style.transform = `translateY(0px)`;
            
            // Eksekusi Pull-to-Refresh jika tarikan cukup kuat (Y > 60)
            if (isPulling && translateY > 60) {
                window.aegisVibrate('success');
                ptrIcon.classList.add('spinning');
                ptrIndicator.style.opacity = '1';
                
                // Minta OS untuk reload halaman (tanpa cache jika memungkinkan)
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                if (Math.abs(translateY) > 30) window.aegisVibrate('medium');
                ptrIndicator.style.opacity = '0';
            }
        }
        isPulling = false;
        isBouncingAtBottom = false;
        translateY = 0;
    }, { passive: true });
});

// 4. Draggable Bottom Sheet Engine (iOS Style Drawer)
window.aegisBottomSheet = function(contentHtml) {
    let overlay = document.getElementById('aegisSheetOverlay');
    let sheet = document.getElementById('aegisBottomSheet');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'aegisSheetOverlay';
        overlay.className = 'aegis-sheet-overlay';
        document.body.appendChild(overlay);

        sheet = document.createElement('div');
        sheet.id = 'aegisBottomSheet';
        sheet.className = 'aegis-bottom-sheet';
        document.body.appendChild(sheet);
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        // Touch Drag Logic (Gestur Tarik)
        sheet.addEventListener('touchstart', (e) => {
            // Izinkan seret laci ke bawah HANYA jika memegang area atas (grabber) 
            // ATAU isi laci sudah di-scroll ke titik paling atas
            if (e.target.closest('.sheet-grabber-area') || sheet.scrollTop <= 0) {
                if (e.touches.length === 1) {
                    startY = e.touches[0].clientY;
                    isDragging = true;
                    sheet.classList.add('dragging');
                }
            }
        }, {passive: true});

        sheet.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const y = e.touches[0].clientY;
            const deltaY = y - startY;
            
            if (deltaY > 0) { // Hanya izinkan seret ke bawah
                currentY = deltaY;
                sheet.style.transform = `translateY(${currentY}px)`;
                if (e.cancelable) e.preventDefault(); // Cegah background scrolling
            }
        }, {passive: false});

        window.closeAegisSheet = () => {
            sheet.classList.remove('show');
            overlay.classList.remove('show');
            window.aegisVibrate('light');
            // Bersihkan konten setelah animasi tertutup penuh
            setTimeout(() => { sheet.style.transform = ''; sheet.innerHTML = ''; }, 600);
        };

        sheet.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            sheet.classList.remove('dragging');
            
            // Evaluasi Fisika: Jika laci ditarik lebih dari 120px, jatuhkan (Tutup)!
            if (currentY > 120) {
                window.closeAegisSheet();
            } else {
                // Tarikan lemah? Pantulkan kembali ke atas (Snap-back)
                sheet.style.transform = `translateY(0px)`;
            }
            currentY = 0;
        }, {passive: true});

        overlay.addEventListener('click', window.closeAegisSheet);
    }
    
    // Inject kerangka HTML beserta area penarik (Grabber)
    sheet.innerHTML = `<div class="sheet-grabber-area" onclick="window.closeAegisSheet()"><div class="sheet-grabber"></div></div>` + contentHtml;
    
    // Panggil efek kemunculan dengan jeda frame agar fisika pegasnya (Spring) tereksekusi
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            sheet.classList.add('show');
            window.aegisVibrate('medium');
        });
    });
};

// 5. Double-Tap Micro-Interaction Engine
document.addEventListener('dblclick', (e) => {
    // Terapkan ke elemen yang relevan (seperti bubble chat, foto profil, dll)
    const target = e.target.closest('.message-bubble, .luminary-card, .gallery-item');
    if (!target) return;

    window.aegisVibrate('success');

    // Spawn 3 Bintang Emas
    for (let i = 0; i < 3; i++) {
        const sparkle = document.createElement('i');
        sparkle.className = 'fa-solid fa-star aegis-sparkle';
        
        // Sedikit acak posisi di sekitar titik klik
        const x = e.clientX + (Math.random() * 40 - 20);
        const y = e.clientY + (Math.random() * 40 - 20);
        
        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        
        // Ubah ukuran sedikit
        sparkle.style.fontSize = `${1.5 + Math.random()}rem`;
        // Delay agar bintang muncul bergantian (0ms, 50ms, 100ms)
        sparkle.style.animationDelay = `${i * 0.05}s`;

        document.body.appendChild(sparkle);

        // Hapus elemen setelah animasi (1 detik)
        setTimeout(() => sparkle.remove(), 1000);
    }
});

// 6. Generic Swipe-to-Action Engine
// Pengembang cukup memberikan class 'swipe-action-wrapper' pada kontainer
onDOMReady(() => {
    const swipeWrappers = document.querySelectorAll('.swipe-action-wrapper');
    
    swipeWrappers.forEach(wrapper => {
        const card = wrapper.querySelector('.swipe-action-card');
        const bg = wrapper.querySelector('.swipe-action-bg');
        if (!card || !bg) return;

        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        card.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            card.classList.remove('spring-snap-back');
            isSwiping = true;
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            const x = e.touches[0].clientX;
            const deltaX = x - startX;
            
            // Izinkan geser kiri-kanan (maksimal 150px)
            if (Math.abs(deltaX) > 10) { 
                // Fisika gesekan saat ditarik
                currentX = deltaX > 0 ? Math.sqrt(deltaX) * 5 : -Math.sqrt(Math.abs(deltaX)) * 5;
                card.style.transform = `translateX(${currentX}px)`;

                // Visual Feedback pada layar background
                if (currentX > 50) {
                    bg.classList.add('left-active');
                    bg.classList.remove('right-active');
                    bg.innerHTML = '<i class="fa-solid fa-reply"></i>'; // Ikon Balas (Kiri)
                } else if (currentX < -50) {
                    bg.classList.add('right-active');
                    bg.classList.remove('left-active');
                    bg.innerHTML = '<i class="fa-solid fa-trash"></i>'; // Ikon Hapus (Kanan)
                } else {
                    bg.classList.remove('left-active', 'right-active');
                    bg.innerHTML = '';
                }
            }
        }, { passive: true }); // Tetap passive agar scroll atas bawah tidak terganggu!

        card.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;

            // Trigger Aksi Jika Melewati Batas (misal: 100px)
            if (currentX > 80) {
                window.aegisVibrate('heavy');
                // Panggil event/trigger fungsi khusus dari luar
                wrapper.dispatchEvent(new CustomEvent('aegis-swipe-right')); 
            } else if (currentX < -80) {
                window.aegisVibrate('heavy');
                wrapper.dispatchEvent(new CustomEvent('aegis-swipe-left'));
            }

            // Kembalikan ke posisi semula dengan efek membal (Spring)
            card.classList.add('spring-snap-back');
            card.style.transform = `translateX(0px)`;
            
            setTimeout(() => {
                bg.classList.remove('left-active', 'right-active');
                bg.innerHTML = '';
            }, 300);

            currentX = 0;
        }, { passive: true });
    });
});

// 7. OS Deep Integration: Native Share API (Apple / Android Share Sheet)
window.aegisNativeShare = async function(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
            window.aegisVibrate('success');
            console.log('[Aegis OS] Berhasil membagikan tautan via Native Share');
        } catch (error) {
            console.log('[Aegis OS] Native share dibatalkan pengguna atau gagal.', error);
        }
    } else {
        // Fallback untuk browser jadul atau PC Desktop
        try {
            await navigator.clipboard.writeText(url);
            window.showToast('Tersalin', 'Tautan berhasil disalin ke papan klip (clipboard).');
            window.aegisVibrate('light');
        } catch (e) {
            console.error('[Aegis OS] Gagal menyalin teks', e);
        }
    }
};

// 8. OS Deep Integration: App Badge API (Notifikasi Ikon Aplikasi)
window.aegisUpdateBadge = async function(count) {
    if ('setAppBadge' in navigator) {
        try {
            if (count > 0) {
                await navigator.setAppBadge(count); // Memasang titik merah berangka di icon HP
                console.log(`[Aegis OS] Badge ikon aplikasi diperbarui: ${count}`);
            } else {
                await navigator.clearAppBadge(); // Menghapus titik merah
                console.log('[Aegis OS] Badge ikon dibersihkan');
            }
        } catch (error) {
            console.error('[Aegis OS] Gagal memperbarui App Badge:', error);
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// P3-17: COMMAND PALETTE (⌘K / Ctrl+K)
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    const PAGES = [
        { title: 'Beranda', subtitle: 'Grand Exhibition', icon: 'fa-landmark', url: '/beranda', shortcut: 'B' },
        { title: 'Direktori', subtitle: 'The Registry', icon: 'fa-address-book', url: '/direktori', shortcut: 'D' },
        { title: 'Galeri', subtitle: 'Arsip Visual', icon: 'fa-film', url: '/galeri' },
        { title: 'Radar', subtitle: 'Peta Persebaran', icon: 'fa-earth-asia', url: '/radar' },
        { title: 'Council', subtitle: 'Berita & Pengumuman', icon: 'fa-chess-knight', url: '/syndicate' },
        { title: 'The Vault', subtitle: 'Fitur Eksekutif', icon: 'fa-gem', url: '/fitur' },
        { title: 'Profil Saya', subtitle: 'Kelola Identitas', icon: 'fa-user', url: '/profil' },
        { title: 'Chat Lounge', subtitle: 'Obrolan Angkatan', icon: 'fa-comment-dots', url: '/chat' },
        { title: 'Oracle', subtitle: 'Tanya Pertanyaan', icon: 'fa-circle-question', url: '/fitur/oracle' },
        { title: 'Celestial', subtitle: 'Kalender Angkatan', icon: 'fa-calendar-days', url: '/fitur/celestial' },
        { title: 'Baitul Maal', subtitle: 'Kas & Keuangan', icon: 'fa-money-bill-wave', url: '/fitur/baitul-maal' },
        { title: 'Majlis', subtitle: 'Ruang Diskusi', icon: 'fa-comments', url: '/fitur/majlis' },
        { title: 'Kontemplasi', subtitle: 'The Sanctuary', icon: 'fa-spa', url: '/fitur/kontemplasi' },
        { title: 'Wasiat Vault', subtitle: 'Manuskrip Rahasia', icon: 'fa-scroll', url: '/fitur/wasiat_vault' },
    ];

    let selectedIdx = 0;
    let filteredItems = [];
    let isOpen = false;

    const overlay = document.getElementById('cmdPalette');
    const input = document.getElementById('cmdInput');
    const results = document.getElementById('cmdResults');
    if (!overlay || !input || !results) return;

    const open = () => {
        isOpen = true;
        overlay.classList.add('open');
        input.value = '';
        input.focus();
        render('');
        window.aegisVibrate('medium');
    };

    const close = () => {
        isOpen = false;
        overlay.classList.remove('open');
        input.blur();
    };

    const fuzzyMatch = (query, text) => {
        if (!query) return true;
        const q = query.toLowerCase();
        const t = text.toLowerCase();
        return t.includes(q);
    };

    const render = (query) => {
        filteredItems = PAGES.filter(p =>
            fuzzyMatch(query, p.title) || fuzzyMatch(query, p.subtitle)
        );
        selectedIdx = 0;

        if (filteredItems.length === 0) {
            results.innerHTML = `<div class="cmd-no-results"><i class="fa-solid fa-circle-xmark" style="font-size:1.5rem;margin-bottom:8px;display:block;color:rgba(212,175,55,0.3)"></i>Tidak ada hasil untuk "<em>${query}</em>"</div>`;
            return;
        }

        results.innerHTML = `<div class="cmd-section-label">${query ? 'Hasil' : 'Navigasi'}</div>` +
            filteredItems.map((p, i) => `
            <a href="${p.url}" class="cmd-item${i === 0 ? ' selected' : ''}" data-idx="${i}">
                <div class="cmd-item-icon"><i class="fa-solid ${p.icon}"></i></div>
                <div class="cmd-item-text">
                    <div class="cmd-item-title">${p.title}</div>
                    <div class="cmd-item-subtitle">${p.subtitle}</div>
                </div>
                ${p.shortcut ? `<span class="cmd-item-shortcut">${p.shortcut}</span>` : ''}
            </a>`).join('');

        results.querySelectorAll('.cmd-item').forEach((el, i) => {
            el.addEventListener('mouseenter', () => { selectIdx(i); });
        });
    };

    const selectIdx = (idx) => {
        results.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('selected'));
        const items = results.querySelectorAll('.cmd-item');
        if (items[idx]) { items[idx].classList.add('selected'); selectedIdx = idx; }
    };

    input.addEventListener('input', () => render(input.value));

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); selectIdx(Math.min(selectedIdx + 1, filteredItems.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); selectIdx(Math.max(selectedIdx - 1, 0)); }
        if (e.key === 'Enter') {
            e.preventDefault();
            const item = results.querySelectorAll('.cmd-item')[selectedIdx];
            if (item) { window.aegisVibrate('light'); item.click(); }
        }
        if (e.key === 'Escape') close();
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Keyboard shortcut: ⌘K or Ctrl+K
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); isOpen ? close() : open(); }
    });

    // Mobile: long press on menu toggle to open command palette
    let longPressTimer;
    const menuToggle = document.getElementById('btnMenuOpen');
    if (menuToggle) {
        menuToggle.addEventListener('touchstart', () => {
            longPressTimer = setTimeout(open, 600);
        }, { passive: true });
        menuToggle.addEventListener('touchend', () => clearTimeout(longPressTimer), { passive: true });
        menuToggle.addEventListener('touchmove', () => clearTimeout(longPressTimer), { passive: true });
    }

    // Expose globally
    window.openCommandPalette = open;
    window.closeCommandPalette = close;
})();

// ═══════════════════════════════════════════════════════════════════════════
// P3-18: ADAPTIVE BOTTOM BAR
// Highlight nav item kontekstual + badge count per-page
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    const path = location.pathname;
    // Map path → contextual label for active nav
    const PAGE_LABELS = {
        '/beranda': 'Museum Angkatan',
        '/direktori': 'Cari Alumni',
        '/galeri': 'Arsip Visual',
        '/radar': 'Sebaran Global',
        '/syndicate': 'Berita Council',
        '/fitur': 'Fitur Eksekutif',
        '/profil': 'Identitas Anda',
        '/chat': 'Obrolan Lounge',
    };

    const matchedLabel = Object.entries(PAGE_LABELS).find(([p]) => path.startsWith(p));
    if (!matchedLabel) return;

    // Update document title tip on active nav item
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
        const label = activeNav.querySelector('.nav-label');
        if (label) {
            label.setAttribute('data-page-context', matchedLabel[1]);
            activeNav.setAttribute('title', matchedLabel[1]);
        }
    }

    // Pulse animation on active nav icon when page loads
    const activeIcon = activeNav ? activeNav.querySelector('i') : null;
    if (activeIcon) {
        activeIcon.style.animation = 'pulseGlow 1.5s ease 2';
        activeIcon.style.borderRadius = '50%';
    }
})();

// ═══════════════════════════════════════════════════════════════════════════
// P3-20: SMART NOTIFICATION GROUPING
// Group notifikasi berdasarkan tipe dan tambahkan swipe-to-dismiss
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    const groupNotifications = (container) => {
        if (!container) return;
        const items = Array.from(container.querySelectorAll('.notif-item, [data-notif-type]'));
        if (items.length < 3) return; // Tidak perlu group jika sedikit

        const groups = {};
        items.forEach(item => {
            const type = item.dataset.notifType || 'general';
            if (!groups[type]) groups[type] = [];
            groups[type].push(item);
        });

        // Collapse groups with > 2 items of same type
        Object.entries(groups).forEach(([type, groupItems]) => {
            if (groupItems.length <= 2) return;
            const [first, second, ...rest] = groupItems;
            const count = rest.length;

            // Create collapse toggle
            const toggle = document.createElement('div');
            toggle.className = 'notif-group-toggle';
            toggle.innerHTML = `<span>+${count} notifikasi ${type} lainnya</span><i class="fa-solid fa-chevron-down"></i>`;
            toggle.style.cssText = 'padding:8px 16px;font-size:0.75rem;color:var(--text-secondary);cursor:pointer;display:flex;justify-content:space-between;align-items:center;';
            let collapsed = true;

            rest.forEach(el => { el.style.display = 'none'; });
            second.after(toggle);

            toggle.addEventListener('click', () => {
                collapsed = !collapsed;
                rest.forEach(el => { el.style.display = collapsed ? 'none' : ''; });
                toggle.querySelector('i').style.transform = collapsed ? '' : 'rotate(180deg)';
                window.aegisVibrate('light');
            });
        });
    };

    // Watch for notification dropdown open
    const notifDropdown = document.querySelector('.notif-dropdown');
    if (notifDropdown) {
        const observer = new MutationObserver(() => groupNotifications(notifDropdown));
        observer.observe(notifDropdown, { childList: true, subtree: false });
    }
})();

// ═══════════════════════════════════════════════════════════════════════════
// P3-22: EXTENDED HAPTIC PATTERN LIBRARY
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    const originalVibrate = window.aegisVibrate;
    window.aegisVibrate = function(type = 'light') {
        if (!navigator.vibrate) return;
        try {
            switch (type) {
                // Existing patterns
                case 'light':   navigator.vibrate(10); break;
                case 'medium':  navigator.vibrate(25); break;
                case 'heavy':   navigator.vibrate([40, 20, 40]); break;
                case 'success': navigator.vibrate([15, 30, 15, 30, 40]); break;
                case 'error':   navigator.vibrate([50, 50, 50, 50]); break;
                // New patterns
                case 'swipe':       navigator.vibrate([8, 4, 8]); break;
                case 'celebration': navigator.vibrate([20,15,20,15,20,15,60]); break;
                case 'notification':navigator.vibrate([10, 50, 10]); break;
                case 'warning':     navigator.vibrate([30, 40, 30]); break;
                case 'tick':        navigator.vibrate(5); break;
                case 'double-tap':  navigator.vibrate([8, 50, 8]); break;
                case 'long-press':  navigator.vibrate(60); break;
                case 'selection':   navigator.vibrate(7); break;
                default: navigator.vibrate(10);
            }
        } catch(e) {}
    };
    // Patch hapticNav to use pattern library
    window.hapticNav = () => window.aegisVibrate('selection');
})();

// ═══════════════════════════════════════════════════════════════════════════
// P3-23: WEB VITALS MONITORING
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    if (!window.PerformanceObserver) return;
    const vitals = {};

    // LCP (Largest Contentful Paint)
    try {
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            vitals.lcp = Math.round(entries[entries.length - 1].startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch(e) {}

    // FID (First Input Delay) / INP
    try {
        new PerformanceObserver((list) => {
            list.getEntries().forEach(e => {
                if (!vitals.fid || e.processingStart - e.startTime < vitals.fid) {
                    vitals.fid = Math.round(e.processingStart - e.startTime);
                }
            });
        }).observe({ type: 'first-input', buffered: true });
    } catch(e) {}

    // CLS (Cumulative Layout Shift)
    try {
        let clsVal = 0;
        new PerformanceObserver((list) => {
            list.getEntries().forEach(e => {
                if (!e.hadRecentInput) clsVal += e.value;
            });
            vitals.cls = Math.round(clsVal * 1000) / 1000;
        }).observe({ type: 'layout-shift', buffered: true });
    } catch(e) {}

    // Expose for debugging
    window.aegisVitals = vitals;

    // Log to console on page hide (non-blocking)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            console.groupCollapsed('[Aegis Web Vitals]');
            console.log('LCP:', vitals.lcp ? `${vitals.lcp}ms` : 'N/A');
            console.log('FID:', vitals.fid ? `${vitals.fid}ms` : 'N/A');
            console.log('CLS:', vitals.cls ?? 'N/A');
            console.groupEnd();
        }
    });
})();

// ═══════════════════════════════════════════════════════════════════════════
// P3-24: DYNAMIC THEME FROM PROFILE PHOTO
// Ekstrak dominant color dari foto profil dan inject sebagai CSS var
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    const profileImg = document.querySelector('.profile-avatar img, .avatar-img, img[id="profileAvatar"]');
    if (!profileImg) return;

    const extract = (img) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1; canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

            // Only apply if color is noticeably different from gold (avoid boring photos)
            const isGoldish = r > 180 && g > 140 && b < 80;
            if (!isGoldish) {
                document.documentElement.style.setProperty('--user-accent', `rgb(${r},${g},${b})`);
                document.documentElement.style.setProperty('--user-accent-glow', `rgba(${r},${g},${b},0.3)`);
            }
        } catch(e) {} // Cross-origin img will throw SecurityError — fail silently
    };

    if (profileImg.complete && profileImg.naturalWidth > 0) {
        extract(profileImg);
    } else {
        profileImg.addEventListener('load', () => extract(profileImg));
    }
})();

// ═══════════════════════════════════════════════════════════════════════════
// P3-25: AMBIENT SOUND DESIGN
// Subtle UI sounds — off by default, user opt-in via localStorage
// ═══════════════════════════════════════════════════════════════════════════
window.AegisSound = (function() {
    let ctx = null;
    let enabled = localStorage.getItem('aegis_sound') === 'on';

    const init = () => {
        if (ctx) return;
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    };

    const play = (type) => {
        if (!enabled || !ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);

        switch(type) {
            case 'nav': // Soft tick
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06);
                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
                osc.start(); osc.stop(ctx.currentTime + 0.06);
                break;
            case 'send': // Whoosh
                osc.type = 'triangle'; osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
                osc.start(); osc.stop(ctx.currentTime + 0.15);
                break;
            case 'notif': // Chime
                osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.06, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start(); osc.stop(ctx.currentTime + 0.4);
                break;
            case 'theme': // Soft switch
                osc.type = 'sine'; osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
                break;
        }
    };

    const toggle = () => {
        init();
        enabled = !enabled;
        localStorage.setItem('aegis_sound', enabled ? 'on' : 'off');
        play('theme'); // Play sound as confirmation
        return enabled;
    };

    // Auto-attach nav sounds
    document.addEventListener('click', (e) => {
        if (!enabled) return;
        const nav = e.target.closest('.nav-item');
        if (nav) { init(); play('nav'); }
    }, { passive: true });

    return { play, toggle, isEnabled: () => enabled, init };
})();

// ═══════════════════════════════════════════════════════════════════════════
// P3-26: SMART SCROLL-TO-TOP BUTTON
// ═══════════════════════════════════════════════════════════════════════════
(function() {
    const btn = document.getElementById('scrollTopBtn');
    const wrapper = document.querySelector('.main-wrapper');
    if (!btn) return;

    let hideTimer = null;
    let lastScrollTop = 0;

    const show = () => {
        btn.classList.add('visible');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => btn.classList.remove('visible'), 3000);
    };

    const handleScroll = (st) => {
        if (st > 300 && st < lastScrollTop) {
            // Scrolling UP — show button
            show();
        } else if (st <= 100) {
            btn.classList.remove('visible');
        }
        lastScrollTop = st;
    };

    // Attach to wrapper if it's the scrolling element
    if (wrapper) {
        wrapper.addEventListener('scroll', () => handleScroll(wrapper.scrollTop), { passive: true });
    }
    // Also attach to window for pages where document.body is the scrolling element
    window.addEventListener('scroll', () => handleScroll(window.scrollY), { passive: true });

    window.aegisScrollTop = () => {
        if (wrapper) wrapper.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.aegisVibrate('light');
        btn.classList.remove('visible');
    };
})();

