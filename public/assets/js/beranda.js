/**
 * Expedient Generation 43 - Beranda Museum Halls & Scroll Engine
 * Companion runtime for ScrollTrigger parallax, Panca Jiwa & Archive modals, and Swipe-to-Seal ledger.
 * (Hero 3D emblem rendering is handled directly by React/Three.js in Emblem3DStage.tsx)
 */

let _berandaListeners = [];
let _berandaScrollTriggers = [];
let _berandaTimeouts = [];
let _activeJiwaTl = null;

const destroyBeranda = () => {
    _berandaTimeouts.forEach(t => clearTimeout(t));
    _berandaTimeouts = [];

    _berandaListeners.forEach(cleanup => {
        try { cleanup(); } catch (e) {}
    });
    _berandaListeners = [];

    if (_activeJiwaTl) {
        try { _activeJiwaTl.kill(); } catch (e) {}
        _activeJiwaTl = null;
    }

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
    if (!stage) {
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

    // =========================================================
    // GSAP SCROLLTRIGGER
    // =========================================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        const scrollContainer = ".main-wrapper";

        const tStage = gsap.to("#threeLogoBox", {
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

if (typeof window !== 'undefined' && !window.__berandaRedactedBound) {
    window.__berandaRedactedBound = true;
    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('redacted')) {
            e.target.classList.add('revealed');
        }
    });
}