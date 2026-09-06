const initGaleri = () => {
        const gsap = window.gsap || (typeof globalThis !== 'undefined' ? globalThis.gsap : undefined);
        if (!gsap) {
            setTimeout(initGaleri, 50);
            return;
        }
        gsap.config({ force3D: true });

        // DEKLARASI GLOBAL VARIABLE
        const stage = document.getElementById('galleryStage');
        const dimCore = document.getElementById('dimCore');
        const indicator = document.getElementById('pageIndicator');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const btnAutoPlay = document.getElementById('btnAutoPlay');
        const btnWhisper = document.getElementById('btnWhisper');
        const whisperAudio = document.getElementById('whisperAudio');
        const bgMusic = document.getElementById('bgMusic');
        const btnAudio = document.getElementById('btnAudio');
        
        let activeDim = 'putra';
        let isShifting = false;
        let isMusicPlaying = false;
        let autoPlayTimer;
        let isAutoPlaying = false;

        const hapticThrill = () => { if (navigator.vibrate) navigator.vibrate(15); };
        const hapticBoom = () => { if (navigator.vibrate) navigator.vibrate([30, 50, 30]); };

        // =========================================================
        // AUDIO ENGINE
        // =========================================================
        let audioCtx;
        const initAudio = () => {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
        };

        const playPaperFlip = () => {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
            filter.type = 'bandpass'; filter.frequency.value = 1500;
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

            osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.25);
            hapticThrill();
        };

        const playDimensionShift = () => {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 1.5);
            gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
            
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 1.5);
            hapticBoom();
        };

        const stopAutoPlay = () => {
            if(!isAutoPlaying) return;
            isAutoPlaying = false;
            btnAutoPlay.classList.remove('is-playing');
            btnAutoPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
            clearInterval(autoPlayTimer);
        };

        const updatePinUI = () => {
            const savedPin = JSON.parse(localStorage.getItem('expedient_pin'));
            let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            if(savedPin) {
                btnGoToPin.style.display = 'flex';
                if(savedPin.dim === activeDim && savedPin.page === activeEngine.currentSheet) {
                    btnPin.classList.add('is-pinned'); btnPin.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
                } else {
                    btnPin.classList.remove('is-pinned'); btnPin.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
                }
            } else {
                btnGoToPin.style.display = 'none'; btnPin.classList.remove('is-pinned'); btnPin.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
            }
        };

        // =========================================================
        // IDLE MODE (MUSEUM SCREENSAVER)
        // =========================================================
        let idleTimer; let isIdle = false; let parallaxActive = true;
        const resetIdleTimer = () => {
            if (isIdle) {
                isIdle = false; stage.classList.remove('idle-mode');
                gsap.killTweensOf(dimCore, "rotationY");
                gsap.to(dimCore, { rotationY: (activeDim === 'putra' ? 0 : -180), duration: 1, ease: "power2.out" });
                parallaxActive = false; setTimeout(() => { parallaxActive = true; }, 1000);
            }
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (isShifting || bookPutra.isAnimating || bookPutri.isAnimating || bookPutra.isIndexMode || bookPutri.isIndexMode || isAutoPlaying) return;
                isIdle = true; stage.classList.add('idle-mode');
                gsap.to(dimCore, { rotationY: "+=360", duration: 60, ease: "none", repeat: -1 });
            }, 15000); 
        };
        ['mousemove', 'touchstart', 'keydown', 'click'].forEach(evt => window.addEventListener(evt, resetIdleTimer));
        resetIdleTimer();

        // =========================================================
        // DUST RENDERER
        // =========================================================
        const canvas = document.getElementById('dustCanvas'); const ctx = canvas.getContext('2d');
        let particles = []; let warpSpeed = false; let isEpilogueMode = false;
        const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resizeCanvas); resizeCanvas();
        const particleCount = window.innerWidth <= 768 ? 20 : 50;
        for(let i=0; i<particleCount; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2.5, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, alpha: Math.random() });
        const renderDust = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += warpSpeed ? p.vx * 30 : p.vx; p.y += warpSpeed ? p.vy * 30 : (isEpilogueMode ? p.vy * 0.5 + 0.2 : p.vy); 
                if(p.x < 0) p.x = canvas.width; if(p.x > canvas.width) p.x = 0; if(p.y < 0) p.y = canvas.height; if(p.y > canvas.height) p.y = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = isEpilogueMode ? `rgba(255, 215, 0, ${p.alpha})` : `rgba(212,175,55,${p.alpha})`; ctx.fill();
            }); requestAnimationFrame(renderDust);
        }; renderDust();

        // =========================================================
        // AUDIO LISTENERS
        // =========================================================
        btnAudio.addEventListener('click', () => {
            if(!isMusicPlaying) {
                bgMusic.volume = 0.5; let playPromise = bgMusic.play();
                if (playPromise !== undefined) playPromise.then(_ => { isMusicPlaying = true; btnAudio.classList.add('is-playing'); btnAudio.innerHTML = '<i class="fa-solid fa-volume-high"></i>'; }).catch(e => console.error(e));
            } else {
                bgMusic.pause(); isMusicPlaying = false; btnAudio.classList.remove('is-playing'); btnAudio.innerHTML = '<i class="fa-solid fa-music"></i>';
            }
        });

        btnWhisper.addEventListener('click', (e) => {
            e.stopPropagation(); 
            if (!whisperAudio.paused) {
                whisperAudio.pause(); whisperAudio.currentTime = 0; btnWhisper.innerHTML = '<i class="fa-solid fa-microphone-lines"></i>';
                if(isMusicPlaying) gsap.to(bgMusic, { volume: 0.5, duration: 1 });
            } else {
                if(isMusicPlaying) gsap.to(bgMusic, { volume: 0.1, duration: 1 });
                whisperAudio.play().catch(e => console.log(e)); btnWhisper.innerHTML = '<i class="fa-solid fa-stop"></i>';
                whisperAudio.onended = () => { btnWhisper.innerHTML = '<i class="fa-solid fa-microphone-lines"></i>'; if(isMusicPlaying) gsap.to(bgMusic, { volume: 0.5, duration: 1 }); };
            }
        });

        // =========================================================
        // BUKU ENGINE (GSAP ARC PHYSICS & 3D THICKNESS)
        // =========================================================
        class BookEngine {
            constructor(elementId, totalSheetsCount) {
                this.book = document.getElementById(elementId); this.sheets = this.book.querySelectorAll('.sheet');
                this.totalSheets = totalSheetsCount; this.currentSheet = 0; this.isAnimating = false; this.isIndexMode = false;
                this.Z_SPACE = 1.5; // KETEBALAN REALISTIS (PX)
                
                // Inject Light Sweep (VVIP)
                this.sheets.forEach(sheet => {
                    const front = sheet.querySelector('.face.front'); const back = sheet.querySelector('.face.back');
                    if(front) { const l = document.createElement('div'); l.className='light-sweep'; front.appendChild(l); }
                    if(back) { const l = document.createElement('div'); l.className='light-sweep'; back.appendChild(l); }
                });
                
                this.initDepthAndZ(); this.updateVisibility();
            }

            updateVisibility() {
                if(this.isIndexMode) return; // In index mode, visibility is handled by scroll
                this.sheets.forEach((sheet, index) => {
                    if (Math.abs(index - this.currentSheet) <= 3) sheet.style.display = 'block'; else sheet.style.display = 'none';
                    if(index >= this.currentSheet - 2 && index <= this.currentSheet + 3) { 
                        const imgs = sheet.querySelectorAll('img'); 
                        imgs.forEach(img => { 
                            if(img.hasAttribute('data-src')) { 
                                img.src = img.getAttribute('data-src'); 
                                img.removeAttribute('data-src');
                            } 
                        }); 
                    }
                });
            }

            checkVisibilityInIndex(scrollY) {
                // Calculate which row is visible based on scrollY
                // y position of sheet = startY + row * gapY
                // dimCore y = scrollY. Total Y = sheet.y + dimCore.y
                const viewportTop = -window.innerHeight / 2;
                const viewportBottom = window.innerHeight / 2;
                
                this.sheets.forEach(sheet => {
                    const sheetY = parseFloat(gsap.getProperty(sheet, "y")) + scrollY;
                    // If sheet is within 1 screen height above or below
                    if (sheetY > viewportTop - window.innerHeight && sheetY < viewportBottom + window.innerHeight) {
                        const imgs = sheet.querySelectorAll('img');
                        imgs.forEach(img => {
                            if(img.hasAttribute('data-src')) {
                                img.src = img.getAttribute('data-src');
                                img.removeAttribute('data-src');
                            }
                        });
                    }
                });
            }

            initDepthAndZ() {
                if(this.isIndexMode) return;
                this.sheets.forEach((sheet, index) => {
                    const targetRotY = index < this.currentSheet ? -180 : 0;
                    let targetZ = 0;
                    if (index < this.currentSheet) targetZ = -((this.currentSheet - 1) - index) * this.Z_SPACE;
                    else targetZ = -(index - this.currentSheet) * this.Z_SPACE;
                    gsap.set(sheet, { rotationY: targetRotY, z: targetZ });
                    sheet.style.zIndex = index < this.currentSheet ? index : this.totalSheets - index;
                });
            }

            updateDepthOnly(animatingIdx = -1) {
                if(this.isIndexMode) return;
                this.sheets.forEach((sheet, index) => {
                    if (index === animatingIdx) return;
                    const targetRotY = index < this.currentSheet ? -180 : 0;
                    let targetZ = 0;
                    if (index < this.currentSheet) targetZ = -((this.currentSheet - 1) - index) * this.Z_SPACE;
                    else targetZ = -(index - this.currentSheet) * this.Z_SPACE;
                    gsap.to(sheet, { rotationY: targetRotY, z: targetZ, duration: 0.8, ease: "power2.out" });
                });
            }

            updateZIndexOnly() { this.sheets.forEach((sheet, index) => { sheet.style.zIndex = (index < this.currentSheet) ? index : this.totalSheets - index; }); }

            centerBook(indicatorEl, btnPrev, btnNext) {
                if(this.isIndexMode) return;
                if (this.currentSheet === 0) { gsap.to(this.book, { xPercent: -25, duration: 1, ease: "power2.out" }); indicatorEl.innerText = "COVER DEPAN"; } 
                else if (this.currentSheet === this.totalSheets) { gsap.to(this.book, { xPercent: 25, duration: 1, ease: "power2.out" }); indicatorEl.innerText = "COVER BELAKANG"; } 
                else {
                    gsap.to(this.book, { xPercent: 0, duration: 1, ease: "power2.out" });
                    let halKiri = (this.currentSheet - 1) * 2; let halKanan = halKiri + 1; let maxHal = (this.totalSheets - 2) * 2;
                    if(this.currentSheet === 1) indicatorEl.innerText = "SAMPUL DALAM - HAL 1"; 
                    else if(this.currentSheet === this.totalSheets - 1) indicatorEl.innerText = `HAL ${maxHal} - SAMPUL DALAM`; 
                    else indicatorEl.innerText = `HAL ${halKiri} - ${halKanan}`;
                }
                btnPrev.disabled = (this.currentSheet === 0); btnNext.disabled = (this.currentSheet === this.totalSheets);
                updatePinUI();
                
                if (this.currentSheet === 0) btnWhisper.classList.add('is-visible');
                else { btnWhisper.classList.remove('is-visible'); whisperAudio.pause(); whisperAudio.currentTime = 0; btnWhisper.innerHTML = '<i class="fa-solid fa-microphone-lines"></i>'; if(isMusicPlaying) gsap.to(bgMusic, { volume: 0.5, duration: 1 }); }

                // Update Progress Bar
                const progress = (this.currentSheet / this.totalSheets) * 100;
                const pFill = document.getElementById('progressFill');
                if(pFill) pFill.style.width = `${progress}%`;
            }

            flipNext(indicatorEl, btnPrev, btnNext) {
                if (this.isAnimating || this.currentSheet >= this.totalSheets || this.isIndexMode) return;
                this.isAnimating = true; playPaperFlip();
                
                const animatingIdx = this.currentSheet;
                const sheet = this.sheets[animatingIdx];
                sheet.classList.add('flipped'); 
                sheet.style.zIndex = 999; // Anti-glitch Z
                this.currentSheet++;
                
                // VVIP Light sweep animation
                const sweepFront = sheet.querySelector('.face.front .light-sweep');
                if(sweepFront) { sweepFront.style.opacity = '1'; gsap.fromTo(sweepFront, {xPercent: -100}, {xPercent: 100, duration: 1, ease: "sine.inOut", onComplete: () => sweepFront.style.opacity='0'}); }
                
                gsap.to(sheet, {
                    keyframes: [
                        { rotationY: -90, z: 150, scale: 1.05, duration: 0.4, ease: "sine.in" },
                        { rotationY: -180, z: 0, scale: 1, duration: 0.6, ease: "power2.out" }
                    ],
                    onComplete: () => {
                        this.updateZIndexOnly();
                        this.updateVisibility();
                        this.isAnimating = false;
                    }
                });
                
                this.centerBook(indicatorEl, btnPrev, btnNext);
                this.updateDepthOnly(animatingIdx);
            }

            flipPrev(indicatorEl, btnPrev, btnNext) {
                if (this.isAnimating || this.currentSheet <= 0 || this.isIndexMode) return;
                this.isAnimating = true; playPaperFlip(); 
                
                this.currentSheet--;
                const animatingIdx = this.currentSheet;
                const sheet = this.sheets[animatingIdx];
                sheet.classList.remove('flipped'); 
                sheet.style.zIndex = 999; // Anti-glitch Z
                
                // VVIP Light sweep animation
                const sweepBack = sheet.querySelector('.face.back .light-sweep');
                if(sweepBack) { sweepBack.style.opacity = '1'; gsap.fromTo(sweepBack, {xPercent: 100}, {xPercent: -100, duration: 1, ease: "sine.inOut", onComplete: () => sweepBack.style.opacity='0'}); }
                
                gsap.to(sheet, {
                    keyframes: [
                        { rotationY: -90, z: 150, scale: 1.05, duration: 0.4, ease: "sine.in" },
                        { rotationY: 0, z: 0, scale: 1, duration: 0.6, ease: "power2.out" }
                    ],
                    onComplete: () => {
                        this.updateZIndexOnly();
                        this.updateVisibility();
                        this.isAnimating = false;
                    }
                });
                
                this.centerBook(indicatorEl, btnPrev, btnNext);
                this.updateDepthOnly(animatingIdx);
            }

            closeBook(indicatorEl, btnPrev, btnNext) {
                if (this.isAnimating || this.isIndexMode || this.currentSheet === 0) return;
                this.isAnimating = true; playPaperFlip(); this.sheets.forEach(sheet => sheet.style.display = 'block'); this.currentSheet = 0;
                this.sheets.forEach((sheet, index) => {
                    sheet.classList.remove('flipped'); const targetZ = -index * this.Z_SPACE;
                    gsap.to(sheet, { rotationY: 0, z: targetZ, duration: 1.2, ease: "power3.inOut" });
                });
                this.centerBook(indicatorEl, btnPrev, btnNext); setTimeout(() => { this.updateZIndexOnly(); this.updateVisibility(); this.isAnimating = false; }, 1300);
            }

            toggleIndexMode(indicatorEl, btnPrev, btnNext) {
                if(this.isAnimating) return; this.isIndexMode = !this.isIndexMode;
                if(this.isIndexMode) {
                    this.book.classList.add('index-mode'); indicatorEl.innerText = "INDEX MODE"; gsap.to(document.getElementById('etherealText'), { opacity: 0, duration: 0.5 }); btnWhisper.classList.remove('is-visible');
                    
                    const isMobile = window.innerWidth <= 768; 
                    const cols = isMobile ? 2 : 4; 
                    const gapX = isMobile ? window.innerWidth / 2.2 : 320; 
                    const gapY = isMobile ? window.innerWidth / 1.5 : 450; 
                    const scale = isMobile ? 0.35 : 0.65;
                    
                    const totalRows = Math.ceil(this.totalSheets / cols); 
                    this.maxGridHeight = totalRows * gapY;
                    window.indexScrollY = 0; // Reset scroll
                    
                    gsap.to(this.book, { xPercent: 0, duration: 1.5, ease: "power3.inOut" }); 
                    gsap.to(dimCore, { z: 0, y: 0, duration: 1.5, ease: "power3.inOut" });
                    
                    const startX = -(cols - 1) * gapX / 2; 
                    const startY = -(totalRows - 1) * gapY / 2;
                    
                    this.sheets.forEach((sheet, i) => { 
                        sheet.style.display = 'block'; // Make all visible for grid
                        const row = Math.floor(i / cols); const col = i % cols; 
                        gsap.to(sheet, { 
                            x: startX + col * gapX, 
                            y: startY + row * gapY, 
                            z: 0, 
                            rotationX: 0, 
                            rotationY: 0, 
                            rotationZ: 0, 
                            scale: scale, 
                            duration: 1.5 + Math.random() * 0.5, 
                            ease: "expo.inOut", 
                            overwrite: "auto" 
                        }); 
                    });
                    
                    // Initial visibility check after animation
                    setTimeout(() => { this.checkVisibilityInIndex(window.indexScrollY); }, 1500);
                } else {
                    this.book.classList.remove('index-mode'); 
                    gsap.to(dimCore, { z: 0, y: 0, duration: 1.5, ease: "power3.inOut" });
                    
                    this.sheets.forEach((sheet, index) => {
                        const targetRotY = index < this.currentSheet ? -180 : 0; 
                        let targetZ = 0; if (index < this.currentSheet) targetZ = -((this.currentSheet - 1) - index) * this.Z_SPACE; else targetZ = -(index - this.currentSheet) * this.Z_SPACE;
                        if(index < this.currentSheet) sheet.classList.add('flipped'); else sheet.classList.remove('flipped');
                        gsap.to(sheet, { x: 0, y: 0, z: targetZ, rotationX: 0, rotationY: targetRotY, rotationZ: 0, scale: 1, duration: 1.2, ease: "power3.inOut" });
                    });
                    setTimeout(() => { this.updateZIndexOnly(); this.centerBook(indicatorEl, btnPrev, btnNext); this.updateVisibility(); gsap.to(document.getElementById('etherealText'), { opacity: 1, duration: 0.5 }); }, 1200);
                }
            }
            goToPage(targetIdx, indicatorEl, btnPrev, btnNext) { this.currentSheet = targetIdx; this.toggleIndexMode(indicatorEl, btnPrev, btnNext); }
        }

        const bookPutra = new BookEngine('bookPutra', 77); 
        const bookPutri = new BookEngine('bookPutri', 43); 

        // =========================================================
        // HOLOGRAPHIC LIGHTBOX & GOLDEN SIGNATURE
        // =========================================================
        const openLightbox = (e, bookObj) => {
            if(isShifting || bookObj.isAnimating || bookObj.isIndexMode) return;
            const sheet = e.target.closest('.sheet'); if(!sheet) return;
            const isFlipped = sheet.classList.contains('flipped'); const imgTarget = sheet.querySelector(isFlipped ? '.face.back img' : '.face.front img');
            if(!imgTarget || !imgTarget.src) return;
            
            resetIdleTimer(); stopAutoPlay(); 
            
            const overlay = document.createElement('div'); overlay.className = 'lightbox-overlay';
            const wrapper = document.createElement('div'); wrapper.className = 'lightbox-img-wrapper';
            const clone = document.createElement('img'); clone.src = imgTarget.src; clone.className = 'lightbox-img';
            
            const sigContainer = document.createElement('div'); sigContainer.className = 'signature-overlay';
            sigContainer.innerHTML = `
                <svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
                    <text x="150" y="80" text-anchor="middle" class="signature-text">Successor</text>
                </svg>
            `;

            wrapper.appendChild(clone); wrapper.appendChild(sigContainer); overlay.appendChild(wrapper); document.body.appendChild(overlay);
            
            gsap.to(overlay, { opacity: 1, backdropFilter: "blur(25px)", duration: 0.5 });
            gsap.fromTo(wrapper, { scale: 0.8, y: 50 }, { scale: 1, y: 0, duration: 0.6, ease: "expo.out" });
            
            setTimeout(() => {
                sigContainer.style.opacity = '1';
                const path = sigContainer.querySelector('.signature-text');
                path.style.animation = 'drawSignatureAnim 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
            }, 600);
            
            overlay.addEventListener('click', () => {
                gsap.to(wrapper, { scale: 0.9, y: -20, duration: 0.4, ease: "power2.in" });
                gsap.to(overlay, { opacity: 0, backdropFilter: "blur(0px)", duration: 0.4, onComplete: () => overlay.remove() });
            });
        };

        // =========================================================
        // CONTROLS & AUTO-PLAY
        // =========================================================
        btnAutoPlay.addEventListener('click', () => {
            let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            if(activeEngine.isIndexMode) return; 
            if(isAutoPlaying) { stopAutoPlay(); } else {
                isAutoPlaying = true; btnAutoPlay.classList.add('is-playing'); btnAutoPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
                autoPlayTimer = setInterval(() => { if(activeEngine.currentSheet < activeEngine.totalSheets) activeEngine.flipNext(indicator, btnPrev, btnNext); else stopAutoPlay(); }, 4000);
            }
        });

        // =========================================================
        // PIN (BOOKMARK) & EPILOGUE
        // =========================================================
        const btnPin = document.getElementById('btnPin');
        const btnGoToPin = document.getElementById('btnGoToPin');
        btnPin.addEventListener('click', () => {
            let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri; const currentPin = JSON.parse(localStorage.getItem('expedient_pin'));
            if(currentPin && currentPin.dim === activeDim && currentPin.page === activeEngine.currentSheet) { localStorage.removeItem('expedient_pin'); } 
            else { localStorage.setItem('expedient_pin', JSON.stringify({ dim: activeDim, page: activeEngine.currentSheet })); gsap.fromTo(btnPin, {scale: 1.5}, {scale: 1, duration: 0.5, ease: "elastic.out(1, 0.3)"}); }
            updatePinUI();
        });

        btnGoToPin.addEventListener('click', () => {
            const savedPin = JSON.parse(localStorage.getItem('expedient_pin'));
            if(!savedPin || isShifting || bookPutra.isAnimating || bookPutri.isAnimating) return;
            const ethereal = document.getElementById('etherealText');
            ethereal.innerText = "MEMORI DIPULIHKAN"; setTimeout(() => { ethereal.innerText = "THE SYNDICATE"; }, 3000);
            if(savedPin.dim !== activeDim) {
                document.getElementById('btnShift').click();
                setTimeout(() => { let targetEngine = (savedPin.dim === 'putra') ? bookPutra : bookPutri; targetEngine.currentSheet = savedPin.page; targetEngine.initDepthAndZ(); targetEngine.updateVisibility(); targetEngine.centerBook(indicator, btnPrev, btnNext); }, 2100);
            } else {
                let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri; activeEngine.currentSheet = savedPin.page; activeEngine.initDepthAndZ(); activeEngine.updateVisibility(); activeEngine.centerBook(indicator, btnPrev, btnNext);
            }
        });

        const ethereal = document.getElementById('etherealText');
        let lastEtherealTap = 0;
        const toggleEpilogue = (e) => {
            e.preventDefault();
            const now = new Date().getTime();
            if(now - lastEtherealTap < 400 && now - lastEtherealTap > 0) {
                if(!isEpilogueMode) {
                    isEpilogueMode = true; stage.classList.add('epilogue-mode');
                    gsap.to(ethereal, { opacity: 0, scale: 0.9, duration: 1, onComplete: () => { ethereal.innerText = "KENANGAN ABADI"; gsap.to(ethereal, { opacity: 1, scale: 1, duration: 2, ease: "power2.out" }); }});
                    if(isMusicPlaying) gsap.to(bgMusic, { volume: 1, duration: 2 }); hapticBoom();
                } else {
                    isEpilogueMode = false; stage.classList.remove('epilogue-mode');
                    gsap.to(ethereal, { opacity: 0, scale: 1.1, duration: 1, onComplete: () => { ethereal.innerText = "THE SYNDICATE"; gsap.to(ethereal, { opacity: 1, scale: 1, duration: 2, ease: "power2.out" }); }});
                    if(isMusicPlaying) gsap.to(bgMusic, { volume: 0.5, duration: 2 });
                }
            }
            lastEtherealTap = now;
        };
        ethereal.addEventListener('click', toggleEpilogue);
        ethereal.addEventListener('touchstart', toggleEpilogue, {passive: false});

        // =========================================================
        // INIT & OTHER BUTTONS
        // =========================================================
        
        // VVIP KEYBOARD & SCROLL WHEEL NAVIGATION
        window.addEventListener('keydown', (e) => {
            if(isShifting || isAutoPlaying || isSwiping || isIdle) return;
            let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            if(activeEngine.isIndexMode) return;
            if (e.key === 'ArrowRight') activeEngine.flipNext(indicator, btnPrev, btnNext);
            if (e.key === 'ArrowLeft') activeEngine.flipPrev(indicator, btnPrev, btnNext);
        });

        window.indexScrollY = 0;
        window.addEventListener('wheel', (e) => {
            if(isShifting || isAutoPlaying || isSwiping || isIdle) return;
            let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            
            if(activeEngine.isIndexMode) {
                // Custom scroll for Index Mode
                window.indexScrollY -= e.deltaY * 0.8; // Adjust speed
                const maxScroll = Math.max(0, activeEngine.maxGridHeight - window.innerHeight);
                const boundTop = maxScroll / 2;
                const boundBottom = -maxScroll / 2;
                
                if(window.indexScrollY > boundTop) window.indexScrollY = boundTop;
                if(window.indexScrollY < boundBottom) window.indexScrollY = boundBottom;
                
                gsap.to(dimCore, { y: window.indexScrollY, duration: 0.5, ease: "power2.out" });
                activeEngine.checkVisibilityInIndex(window.indexScrollY);
                return;
            }
            
            if(scrollTimeout) return; 
            
            if (e.deltaY > 50) {
                activeEngine.flipNext(indicator, btnPrev, btnNext);
                scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 800);
            } else if (e.deltaY < -50) {
                activeEngine.flipPrev(indicator, btnPrev, btnNext);
                scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 800);
            }
        }, {passive: true});

        bookPutra.centerBook(indicator, btnPrev, btnNext);

        const btnIndex = document.getElementById('btnIndex');
        btnIndex.addEventListener('click', () => {
            if(isShifting) return; stopAutoPlay();
            let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            if(!activeEngine.isIndexMode) btnIndex.classList.add('is-playing'); else btnIndex.classList.remove('is-playing');
            activeEngine.toggleIndexMode(indicator, btnPrev, btnNext);
        });

        const btnCloseBook = document.getElementById('btnCloseBook');
        btnCloseBook.addEventListener('click', () => {
            if(isShifting) return; stopAutoPlay();
            if(activeDim === 'putra') bookPutra.closeBook(indicator, btnPrev, btnNext); else bookPutri.closeBook(indicator, btnPrev, btnNext);
        });

        const btnShift = document.getElementById('btnShift');
        btnShift.addEventListener('click', () => {
            if(isShifting) return; stopAutoPlay();
            let currentEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            if(currentEngine.isIndexMode) btnIndex.click(); 
            isShifting = true; warpSpeed = true; playDimensionShift();
            
            // VVIP Cinematic Glitch & Flash
            const glitch = document.getElementById('glitchOverlay');
            gsap.to(glitch, { opacity: 0.3, duration: 0.1, yoyo: true, repeat: 5 });
            stage.classList.add('glitch-active');
            setTimeout(() => { stage.classList.remove('glitch-active'); }, 500);
            
            const flash = document.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:999999;opacity:0;pointer-events:none;'; document.body.appendChild(flash);
            gsap.to(flash, { opacity: 1, duration: 0.2, onComplete: () => gsap.to(flash, { opacity: 0, duration: 0.8, onComplete: () => flash.remove() }) });

            if(activeDim === 'putra') {
                stage.classList.add('dimensi-putri'); btnShift.innerHTML = '<i class="fa-solid fa-rotate"></i> SHIFT TO ALPHA (PUTRA)';
                gsap.to(dimCore, { rotationX: 0, rotationY: -180, duration: 2, ease: "power3.inOut" });
                document.getElementById('bookPutra').style.pointerEvents = 'none'; setTimeout(() => { document.getElementById('bookPutri').style.pointerEvents = 'auto'; }, 1000);
                activeDim = 'putri'; setTimeout(() => { bookPutri.centerBook(indicator, btnPrev, btnNext); isShifting = false; warpSpeed = false; }, 2000);
            } else {
                stage.classList.remove('dimensi-putri'); btnShift.innerHTML = '<i class="fa-solid fa-rotate"></i> SHIFT TO OMEGA (PUTRI)';
                gsap.to(dimCore, { rotationX: 0, rotationY: 0, duration: 2, ease: "power3.inOut" });
                document.getElementById('bookPutri').style.pointerEvents = 'none'; setTimeout(() => { document.getElementById('bookPutra').style.pointerEvents = 'auto'; }, 1000);
                activeDim = 'putra'; setTimeout(() => { bookPutra.centerBook(indicator, btnPrev, btnNext); isShifting = false; warpSpeed = false; }, 2000);
            }
        });

        btnNext.addEventListener('click', () => { if(isShifting) return; stopAutoPlay(); if(activeDim === 'putra') bookPutra.flipNext(indicator, btnPrev, btnNext); else bookPutri.flipNext(indicator, btnPrev, btnNext); });
        btnPrev.addEventListener('click', () => { if(isShifting) return; stopAutoPlay(); if(activeDim === 'putra') bookPutra.flipPrev(indicator, btnPrev, btnNext); else bookPutri.flipPrev(indicator, btnPrev, btnNext); });

        let clickTimer = null; let isSwiping = false; 
        const handleBookTap = (e, bookObj, bookEl) => {
            if(isShifting || isSwiping) { isSwiping = false; return; }
            if(bookObj.isIndexMode) { const sheet = e.target.closest('.sheet'); if(sheet) { const sheetIdx = parseInt(sheet.getAttribute('data-sheet')); btnIndex.classList.remove('is-playing'); bookObj.goToPage(sheetIdx, indicator, btnPrev, btnNext); } return; }
            if(e.detail === 2) { clearTimeout(clickTimer); openLightbox(e, bookObj); } 
            else if(e.detail === 1) { clickTimer = setTimeout(() => { const rect = bookEl.getBoundingClientRect(); if(bookObj.currentSheet === 0) { bookObj.flipNext(indicator, btnPrev, btnNext); return; } if(bookObj.currentSheet === bookObj.totalSheets) { bookObj.flipPrev(indicator, btnPrev, btnNext); return; } if (e.clientX < (rect.left + rect.width / 2)) bookObj.flipPrev(indicator, btnPrev, btnNext); else bookObj.flipNext(indicator, btnPrev, btnNext); }, 250); }
        };

        document.getElementById('bookPutra').addEventListener('click', (e) => handleBookTap(e, bookPutra, document.getElementById('bookPutra')));
        document.getElementById('bookPutri').addEventListener('click', (e) => handleBookTap(e, bookPutri, document.getElementById('bookPutri')));

        let touchStartY = 0; let touchEndY = 0;
        stage.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; isSwiping = false; }, {passive: true});
        stage.addEventListener('touchmove', e => {
            let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            if(activeEngine.isIndexMode) {
                const currentY = e.changedTouches[0].screenY;
                const deltaY = currentY - touchStartY;
                window.indexScrollY += deltaY;
                
                const maxScroll = Math.max(0, activeEngine.maxGridHeight - window.innerHeight);
                const boundTop = maxScroll / 2;
                const boundBottom = -maxScroll / 2;
                
                if(window.indexScrollY > boundTop) window.indexScrollY = boundTop;
                if(window.indexScrollY < boundBottom) window.indexScrollY = boundBottom;
                
                gsap.to(dimCore, { y: window.indexScrollY, duration: 0.1 });
                touchStartY = currentY; // reset for next move event
            }
        }, {passive: true});
        
        stage.addEventListener('touchend', e => {
            if(isShifting) return; touchEndX = e.changedTouches[0].screenX; const distance = touchStartX - touchEndX; let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri;
            if(activeEngine.isIndexMode) {
                activeEngine.checkVisibilityInIndex(window.indexScrollY);
                return; 
            }
            if (Math.abs(distance) > 50) { isSwiping = true; stopAutoPlay(); if (distance > 50) activeEngine.flipNext(indicator, btnPrev, btnNext); if (distance < -50) activeEngine.flipPrev(indicator, btnPrev, btnNext); }
        }, {passive: true});

        if (window.DeviceOrientationEvent && /Mobile|Android|iOS|iPhone|iPad/i.test(navigator.userAgent)) {
            let gyroX = 50, gyroY = 50, targetGyroX = 50, targetGyroY = 50;
            window.addEventListener('deviceorientation', (e) => { let tiltX = Math.min(Math.max(e.gamma, -20), 20); let tiltY = Math.min(Math.max(e.beta - 45, -20), 20); targetGyroX = 50 + (tiltX / 20) * 15; targetGyroY = 50 + (tiltY / 20) * 15; });
            const updateGyro = () => { gyroX += (targetGyroX - gyroX) * 0.05; gyroY += (targetGyroY - gyroY) * 0.05; stage.style.perspectiveOrigin = `${gyroX}% ${gyroY}%`; requestAnimationFrame(updateGyro); }; updateGyro();
        } else {
            window.addEventListener('mousemove', (e) => {
                const x = (e.clientX / window.innerWidth) * 100; const y = (e.clientY / window.innerHeight) * 100; document.documentElement.style.setProperty('--mx', `${x}%`); document.documentElement.style.setProperty('--my', `${y}%`);
                if(!isShifting && !isIdle && parallaxActive) { let activeEngine = (activeDim === 'putra') ? bookPutra : bookPutri; if(activeEngine.isIndexMode) return; const tiltX = (window.innerHeight / 2 - e.clientY) / 60; const tiltY = (e.clientX - window.innerWidth / 2) / 60; const baseY = activeDim === 'putra' ? 0 : -180; gsap.to(dimCore, { rotationX: tiltX, rotationY: baseY + tiltY, duration: 0.8, ease: "power2.out" }); }
            });
        }
        
        const btnFullscreen = document.getElementById('btnFullscreen');
        if(btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e=>console.log(e)); btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i>'; } 
                else { document.exitFullscreen(); btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i>'; }
            });
        }
    };

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initGaleri);
} else {
    initGaleri();
}