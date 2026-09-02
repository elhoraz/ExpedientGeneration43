    const initOracleVision = async () => {
        const gsap = window.gsap || (typeof globalThis !== 'undefined' ? globalThis.gsap : undefined);
        const video = document.getElementById('videoFeed');
        const canvas = document.getElementById('captureCanvas');
        const ctx = canvas.getContext('2d');
        const btnScan = document.getElementById('btnScan');
        const btnReset = document.getElementById('btnReset');
        const permNotice = document.getElementById('permNotice');
        const visionContainer = document.getElementById('visionContainer');
        const logoReticle = document.getElementById('logoReticle');
        const scannerLaser = document.getElementById('scannerLaser');
        const hudText = document.getElementById('hudText');
        const arabicHud = document.getElementById('arabicHud');
        const resultOverlay = document.getElementById('resultOverlay');
        
        let stream = null;
        let modelsLoaded = false;

        // Gelar Islami Database
        const baseTitles = [
            "Al-Amin (Sang Terpercaya)", "Al-Fatih (Sang Pembuka)", "Al-Karim (Sang Dermawan)", "Al-Adil (Sang Adil)", "Al-Hafidz (Sang Penjaga)", 
            "Al-Muhsin (Sang Pembuat Kebaikan)", "As-Siddiq (Sang Pembenar)", "Al-Hakim (Sang Bijaksana)", "Al-Mujahid (Sang Pejuang)", "Al-Qawi (Sang Kuat)",
            "Al-Mubarak (Yang Diberkahi)", "Al-Ghani (Yang Berkecukupan)", "Al-Wadud (Yang Penuh Kasih)", "Al-Majid (Yang Mulia)", "Al-Basir (Yang Maha Melihat Kepentingan)", 
            "Al-Khabir (Yang Waspada)", "Al-Halim (Yang Lembut)", "Al-Aziz (Yang Perkasa)", "Al-Mutawakkil (Yang Berserah)", "An-Nur (Sang Cahaya)", 
            "Al-Haqq (Sang Pembela Kebenaran)", "Al-Matin (Yang Kokoh)", "Al-Bari (Sang Perancang)", "Al-Musawwir (Sang Pembentuk)", "Al-Fattah (Penakluk Jalan)", 
            "Al-Aliyy (Yang Berkedudukan Tinggi)", "Al-Kabir (Yang Berjiwa Besar)", "Al-Hasib (Pembuat Perhitungan)", "Al-Jalil (Yang Berkharisma)"
        ];
        
        const descriptors = [
            "Menjaga amanah dalam setiap langkah.",
            "Membawa kemenangan dan pencerahan.",
            "Kebaikan yang mengalir tanpa henti.",
            "Menempatkan segala sesuatu pada porsinya.",
            "Melindungi warisan dan nilai-nilai luhur.",
            "Kehadirannya senantiasa membawa manfaat.",
            "Integritas dan kejujuran di atas segalanya.",
            "Memutuskan dengan akal dan hikmah.",
            "Tak kenal lelah demi kebenaran.",
            "Keteguhan hati yang tak tergoyahkan.",
            "Langkahnya senantiasa membawa rahmat.",
            "Mandiri, tangguh, dan membumi.",
            "Mampu mengikat erat tali ukhuwah.",
            "Memiliki wibawa dan kedudukan yang agung.",
            "Jiwa yang tenang, badai tak mampu menggoyahkannya."
        ];

        // Dapatkan Identitas Unik berdasarkan User ID
        const userId = window.userEntityId || 1;
        const myTitleIndex = userId % baseTitles.length;
        const myDescIndex = (userId * 3) % descriptors.length;
        
        const myTitle = baseTitles[myTitleIndex];
        const myDesc = descriptors[myDescIndex];

        // 1. Load AI Models
        hudText.innerText = "MEMUAT NEURAL NETWORKS...";
        try {
            await Promise.all([
            const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
                faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(FACE_MODEL_URL)
            ]);
            modelsLoaded = true;
            hudText.innerText = "SYSTEM STANDBY";
            initCamera();
        } catch (e) {
            console.error("Gagal memuat model:", e);
            permNotice.innerHTML = "GAGAL MEMUAT SISTEM AI.<br>Pastikan model tersedia di server.";
            permNotice.style.display = 'block';
        }

        // Initialize Camera
        async function initCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                video.srcObject = stream;
                
                video.onloadedmetadata = () => {
                    video.style.opacity = 1;
                    permNotice.style.display = 'none';
                    btnScan.disabled = false;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    arabicHud.style.display = 'block';
                };
            } catch (err) {
                console.error(err);
                permNotice.innerHTML = "AKSES KAMERA DITOLAK.<br>Mohon berikan izin pada browser.";
                permNotice.style.display = 'block';
                permNotice.style.color = "#ff3366";
            }
        }

        let scanAnim;
        
        // Scan Sequence
        btnScan.addEventListener('click', async () => {
            if (!modelsLoaded) return;
            btnScan.style.display = 'none';
            
            // 1. Prepare UI
            visionContainer.classList.add('scanning');
            scannerLaser.style.display = 'block';
            hudText.style.opacity = 1;
            
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

            // 2. Animate Laser (GSAP)
            scanAnim = gsap.fromTo(scannerLaser, 
                { y: 0, opacity: 0 }, 
                { y: visionContainer.offsetHeight, opacity: 1, duration: 1.2, ease: "linear", repeat: -1, yoyo: true }
            );

            // 3. Fake Processing Texts while AI processes
            const messages = [
                "MENGKALKULASI LANDMARK WAJAH...",
                "MENGANALISIS NAFSHIYAH (STATE OF SOUL)...",
                "MENGUKUR SYMMETRY INDEX...",
                "MENYINKRONISASI IDENTITAS SOVEREIGN..."
            ];
            
            let msgIndex = 0;
            hudText.innerText = messages[0];
            const msgInterval = setInterval(() => {
                msgIndex++;
                if(msgIndex < messages.length) {
                    hudText.innerText = messages[msgIndex];
                }
            }, 800);

            // 4. AI Real-time Detection
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
            
            setTimeout(() => {
                clearInterval(msgInterval);
                scanAnim.kill();
                scannerLaser.style.display = 'none';
                visionContainer.classList.remove('scanning');
                hudText.innerText = "FIRASAT TERVERIFIKASI";
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

                let maqam = "Tawakkul (Berserah Diri)";
                let symmetryIndex = (90 + Math.random() * 8).toFixed(1); // Default fallback
                let dominantEmotion = "neutral";
                let filterStr = "sepia(0.6) hue-rotate(-10deg) brightness(0.8) contrast(1.2)";
                let tintColor = "rgba(212, 175, 55, 0.4)"; // Emas default

                if (detections) {
                    // Kalkulasi Simetri (Mata vs Hidung)
                    const leftEye = detections.landmarks.getLeftEye();
                    const rightEye = detections.landmarks.getRightEye();
                    const diffY = Math.abs(leftEye[0].y - rightEye[0].y);
                    symmetryIndex = Math.max(80, 99.9 - (diffY * 0.5)).toFixed(1);

                    // Deteksi Emosi Dominan
                    const expr = detections.expressions;
                    dominantEmotion = Object.keys(expr).reduce((a, b) => expr[a] > expr[b] ? a : b);

                    switch(dominantEmotion) {
                        case 'happy': 
                            maqam = "Tasyakkur (Bersyukur)"; 
                            tintColor = "rgba(0, 255, 136, 0.4)"; 
                            filterStr = "sepia(0.3) hue-rotate(90deg) brightness(0.9) contrast(1.3)";
                            break;
                        case 'sad': 
                            maqam = "Muhasabah (Introspeksi)"; 
                            tintColor = "rgba(0, 162, 255, 0.4)"; 
                            filterStr = "sepia(0.5) hue-rotate(180deg) brightness(0.9) contrast(1.1)";
                            break;
                        case 'angry':
                        case 'disgusted':
                            maqam = "Mujahadah (Berjuang)"; 
                            tintColor = "rgba(255, 69, 0, 0.4)"; 
                            filterStr = "sepia(0.6) hue-rotate(10deg) brightness(0.8) contrast(1.3)";
                            break;
                        case 'fearful':
                        case 'surprised':
                            maqam = "Yaqza (Terjaga/Waspada)"; 
                            tintColor = "rgba(180, 100, 255, 0.4)"; 
                            filterStr = "sepia(0.3) hue-rotate(260deg) brightness(0.85) contrast(1.2)";
                            break;
                        default:
                            maqam = "Tawakkul (Ketenangan Jiwa)";
                            break; // default gold
                    }
                } else {
                    hudText.innerText = "WAJAH TIDAK TERDETEKSI JELAS";
                }

                // Draw to canvas and apply filter
                ctx.filter = filterStr;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Draw a color overlay
                ctx.fillStyle = tintColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Show canvas, hide video
                canvas.style.display = 'block';
                video.style.opacity = 0;
                logoReticle.style.opacity = 0;
                arabicHud.style.display = 'none';

                // Tampilkan Hasil Firasat
                document.getElementById('auraTitle').innerText = myTitle;
                document.getElementById('auraDesc').innerHTML = `
                    <div style="margin-bottom:10px; color:#fff;">${myDesc}</div>
                    <div style="font-family:monospace; font-size:0.85rem; color:var(--text-secondary); background:rgba(0,0,0,0.5); padding:10px; border-radius:8px; display:inline-block; text-align:left;">
                        <span style="color:#d4af37">></span> RESONANCE STABILITY : ${symmetryIndex}%<br>
                        <span style="color:#d4af37">></span> DOMINANT EMOTION  : ${dominantEmotion.toUpperCase()}<br>
                        <span style="color:#d4af37">></span> CURRENT MAQAM     : <b style="color:#fff;">${maqam}</b>
                    </div>
                `;
                
                resultOverlay.classList.add('show');
                gsap.to('.aura-title', { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.3 });
                gsap.to('.aura-desc', { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.6 });
                
                btnReset.style.display = 'inline-block';
                
            }, 3200); // Minimum delay for UX aesthetics
        });

        // Reset
        btnReset.addEventListener('click', () => {
            canvas.style.display = 'none';
            video.style.opacity = 1;
            logoReticle.style.opacity = 0.15;
            arabicHud.style.display = 'block';
            resultOverlay.classList.remove('show');
            gsap.set('.aura-title', { opacity: 0, y: 30 });
            gsap.set('.aura-desc', { opacity: 0, y: 20 });
            hudText.style.opacity = 0;
            btnReset.style.display = 'none';
            btnScan.style.display = 'inline-block';
        });

        // Time Capsule Panel Toggle
        const btnToggleCapsule = document.getElementById('btnToggleCapsule');
        const capsulePanel = document.getElementById('capsulePanel');
        btnToggleCapsule.addEventListener('click', () => {
            capsulePanel.classList.toggle('open');
            if(navigator.vibrate) navigator.vibrate(20);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", initOracleVision);
    } else {
        initOracleVision();
    }
