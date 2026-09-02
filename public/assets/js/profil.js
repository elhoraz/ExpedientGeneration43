const initProfil = () => {
    const gsap = window.gsap || (typeof globalThis !== 'undefined' ? globalThis.gsap : undefined);
    if (!gsap) {
        setTimeout(initProfil, 50);
        return;
    }

    // === ELEMEN UI ===
    const videoElement = document.getElementById('cameraFeed');
    const statusText = document.getElementById('statusText');
    const authVault = document.getElementById('authVault');
    const controlPanel = document.getElementById('controlPanel');
    const focusRing = document.getElementById('focusRing');
    const scanLine = document.getElementById('scanLine');
    const retinaContainer = document.getElementById('retinaContainer');
    
    // HUD Nodes
    const s1 = document.getElementById('step1');
    const s2 = document.getElementById('step2');
    const s3 = document.getElementById('step3');

    if (!videoElement) {
        setTimeout(initProfil, 100);
        return;
    }

    // === STATE ===
    let streamRef = null;
    let timeoutRef = null;
    let isAuthenticating = false;
    let authCompleted = false;
    let currentStep = 'matching';
    let scanAnim = null;

    const dbFaceDataRaw = window.dbFaceDataRaw;
    let targetDescriptor = null;

    // === HELPER UI MEWAH ===
    const updateTextFade = (text, color) => {
        gsap.to(statusText, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            onComplete: () => {
                statusText.innerText = text;
                if(color) statusText.style.color = color;
                gsap.fromTo(statusText, { y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
            }
        });
    };

    const updateHUD = (text, color, isScanning, step) => {
        updateTextFade(text, color);
        
        if (isScanning && !scanAnim) {
            retinaContainer.classList.add('scanning');
            gsap.set(scanLine, { opacity: 1 });
            scanAnim = gsap.to(scanLine, {
                top: "100%",
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        } else if (!isScanning && scanAnim) {
            retinaContainer.classList.remove('scanning');
            scanAnim.kill();
            scanAnim = null;
            gsap.to(scanLine, { opacity: 0, duration: 0.3 });
        }

        if (color) {
            focusRing.style.borderColor = color;
            focusRing.style.boxShadow = `inset 0 0 40px var(--glass-bg), 0 0 50px ${color}30`;
        }

        if(step === 1) { s1.className = 'live-node active'; s2.className = 'live-node'; s3.className = 'live-node'; }
        if(step === 2) { s1.className = 'live-node done'; s2.className = 'live-node active'; s3.className = 'live-node'; }
        if(step === 3) { s1.className = 'live-node done'; s2.className = 'live-node done'; s3.className = 'live-node active'; }
        if(step === 'done') { s1.className = 'live-node done'; s2.className = 'live-node done'; s3.className = 'live-node done'; }
    };

    // Fungsi gagal total tanpa tombol bypass
    const triggerFatalError = (msg) => {
        authCompleted = true;
        updateHUD(msg, "var(--danger-elegant)", false, 0);
        setTimeout(() => {
            statusText.innerHTML = `<span style="font-size:0.9rem; color:var(--text-secondary);">Sistem keamanan mendeteksi anomali. Akses profil terkunci. Harap kembali ke Beranda.</span><br><br><a href="/beranda" class="action-btn" style="display:inline-flex; width:auto; justify-content:center; border-color:var(--text-primary); color:var(--text-primary); margin: 0 auto;">Kembali</a>`;
        }, 1500);
    };

    window.unlockControlPanel = () => {
        authCompleted = true;
        if (streamRef) streamRef.getTracks().forEach(track => track.stop());
        if (timeoutRef) clearTimeout(timeoutRef);

        gsap.to(authVault, {
            opacity: 0, scale: 1.1, filter: "blur(20px)", duration: 1.5, ease: "power3.inOut",
            onComplete: () => {
                authVault.style.display = "none";
                controlPanel.style.display = "flex";
                
                // Animasi Stagger GSAP Mewah untuk Form
                const tl = gsap.timeline();
                tl.to(controlPanel, { opacity: 1, duration: 0.5 })
                  .from(".stagger-item", { 
                      y: 40, 
                      opacity: 0, 
                      duration: 1, 
                      stagger: 0.15, 
                      ease: "power4.out" 
                  });
            }
        });
    };

    const startFaceVerification = async () => {
        if (window.isAdmin) {
            updateHUD("Bypass Eksekutif Aktif", "var(--gold-premium)", false, 'done');
            setTimeout(unlockControlPanel, 500);
            return;
        }

        if (dbFaceDataRaw === null) {
            updateHUD("Data Biometrik Kosong. Menggunakan Akses Standar...", "var(--text-secondary)", false, 'done');
            setTimeout(unlockControlPanel, 1000);
            return;
        }

        let parsedData = dbFaceDataRaw;
        if (typeof dbFaceDataRaw === 'string') {
            try {
                parsedData = JSON.parse(dbFaceDataRaw);
            } catch (e) {
                console.error("Parse error face_data", e);
            }
        }
        targetDescriptor = new Float32Array(parsedData);
        updateHUD("Menyiapkan Sistem Cerdas...", "var(--gold-premium)", false, 0);

        try {
            // Model dimuat dari CDN karena shared hosting (InfinityFree) memblokir fetch ke file binary lokal
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
        } catch (err) {
            updateHUD("Gagal Memuat Modul Biometrik. Menggunakan Akses Standar...", "var(--text-secondary)", false, 'done');
            setTimeout(unlockControlPanel, 1500);
            return;
        }

        updateHUD("Sinkronisasi Lensa...", "var(--gold-premium)", false, 0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
            videoElement.srcObject = stream;
            streamRef = stream;
        } catch (err) {
            updateHUD("Kamera Diblokir. Menggunakan Akses Standar...", "var(--text-secondary)", false, 'done');
            setTimeout(unlockControlPanel, 1500);
            return;
        }

        videoElement.onplay = () => {
            updateHUD("Menganalisis profil kedalaman...", "var(--gold-premium)", true, 1);
            
            const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
            
            const runDetection = async () => {
                if (authCompleted) return;
                if (isAuthenticating) {
                    timeoutRef = setTimeout(runDetection, 600);
                    return;
                }

                try {
                    const detection = await faceapi.detectSingleFace(videoElement, detectorOptions)
                                                   .withFaceLandmarks().withFaceDescriptor().withFaceExpressions();
                    
                    if (!detection) {
                        updateHUD("Mohon tatap tepat ke tengah lensa", "var(--gold-premium)", true, currentStep === 'matching'? 1 : (currentStep==='smiling'? 2:3));
                    } else {
                        if (currentStep === 'matching') {
                            const distance = faceapi.euclideanDistance(targetDescriptor, detection.descriptor);
                            if (distance < 0.5) {
                                currentStep = 'smiling';
                                isAuthenticating = true;
                                updateHUD("Identitas dikonfirmasi. Tunjukkan senyum Anda...", "var(--text-primary)", true, 2);
                                setTimeout(() => { isAuthenticating = false; }, 1200); 
                            } else {
                                updateHUD("Akses Ditolak: Wajah Tidak Dikenali", "var(--danger-elegant)", true, 1);
                            }
                        } 
                        else if (currentStep === 'smiling') {
                            if (detection.expressions.happy > 0.85) {
                                currentStep = 'turning';
                                isAuthenticating = true;
                                updateHUD("Sempurna. Tolehkan kepala Anda sedikit...", "var(--text-primary)", true, 3);
                                setTimeout(() => { isAuthenticating = false; }, 1500); 
                            } else {
                                updateHUD("Menunggu verifikasi ekspresi...", "var(--text-primary)", true, 2);
                            }
                        } 
                        else if (currentStep === 'turning') {
                            const landmarks = detection.landmarks;
                            const nose = landmarks.getNose()[0];
                            const leftEye = landmarks.getLeftEye()[0];
                            const rightEye = landmarks.getRightEye()[0];
                            
                            const distLeft = Math.abs(nose.x - leftEye.x);
                            const distRight = Math.abs(nose.x - rightEye.x);
                            
                            if (distRight !== 0) {
                                const ratio = distLeft / distRight;
                                if (ratio < 0.35 || ratio > 2.5) {
                                    authCompleted = true;
                                    updateHUD("Akses VVIP Diberikan", "var(--success-elegant)", false, 'done');
                                    setTimeout(unlockControlPanel, 1200);
                                    return; 
                                } else {
                                    updateHUD("Terus tolehkan perlahan...", "var(--text-primary)", true, 3);
                                }
                            }
                        }
                    }
                } catch(e) {
                    console.error("Face API Error:", e);
                }

                if (!authCompleted) timeoutRef = setTimeout(runDetection, 600);
            };

            runDetection();
        };
    };

    // === MAGNETIC HOVER ENGINE (INTERAKTIVITAS) ===
    const magBtnWrap = document.getElementById('magBtnWrap');
    const magBtn = document.getElementById('magBtn');
    const magAvatar = document.getElementById('magAvatar');

    const applyMagnetic = (wrap, el, strength) => {
        wrap.addEventListener('mousemove', (e) => {
            const rect = wrap.getBoundingClientRect();
            const x = (e.clientX - rect.left) - (rect.width / 2);
            const y = (e.clientY - rect.top) - (rect.height / 2);
            gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power2.out" });
        });
        wrap.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
        });
    };

    if(window.matchMedia("(pointer: fine)").matches) {
        if (magBtnWrap && magBtn) applyMagnetic(magBtnWrap, magBtn, 0.4);
        if (magAvatar && magAvatar.querySelector('img')) applyMagnetic(magAvatar, magAvatar.querySelector('img'), 0.2);

        // PARALLAX KARTU dinonaktifkan karena menyebabkan form input tidak dapat diklik/diedit pada desktop
        // akibat isu rendering browser (3D transform + backdrop-filter memutus hit-testing).
    }

    // === FITUR UPLOAD FOTO PROFIL ===
    const fileInput = document.getElementById('inputFileImg');
    const previewImg = document.getElementById('avatarPreview');
    const base64Input = document.getElementById('fotoBase64Value');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 500;
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                // Animasi ganti foto
                if (previewImg) {
                    gsap.to(previewImg, { scale: 0.8, opacity: 0, duration: 0.3, onComplete: () => {
                        previewImg.src = dataUrl;
                        if (base64Input) base64Input.value = dataUrl;
                        gsap.to(previewImg, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" });
                    }});
                }
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });
    }

    const checkFaceApi = () => {
        if (typeof faceapi !== 'undefined') {
            startFaceVerification();
        } else {
            setTimeout(checkFaceApi, 100);
        }
    };
    checkFaceApi();

};

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initProfil);
} else {
    initProfil();
}

// ================= LOGIKA WEBAUTHN / PASSKEY =================
function base64urlToBuffer(base64url) {
    if (!base64url) return new ArrayBuffer(0);
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray.buffer;
}

function bufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function startBiometricEnrollment() {
    const statusEl = document.getElementById('bioStatus');
    const optionsBox = document.getElementById('bioOptionsBox');
    
    if (navigator.vibrate) navigator.vibrate(50);

    try {
        if (!window.PublicKeyCredential) {
            throw new Error("Perangkat atau Browser Anda tidak mendukung biometrik atau Anda tidak berada dalam koneksi HTTPS yang aman.");
        }

        gsap.to(optionsBox, { opacity: 0, height: 0, duration: 0.4, onComplete: () => optionsBox.style.display = 'none' });
        statusEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyiapkan protokol kriptografi...';
        statusEl.style.color = "var(--gold-premium)";

        const res = await fetch('/biometric/register-options');
        const responseJson = await res.json();
        
        if (responseJson.status !== 'success') throw new Error(responseJson.message || 'Gagal memuat opsi.');

        // Data WebAuthn ada di dalam responseJson.data
        const pkConfig = responseJson.data;
        if (!pkConfig.challenge) throw new Error("Tantangan Kriptografi gagal dimuat.");

        // Convert base64url strings to ArrayBuffer
        pkConfig.challenge = base64urlToBuffer(pkConfig.challenge);
        pkConfig.user.id = base64urlToBuffer(pkConfig.user.id);
        if (pkConfig.excludeCredentials) {
            pkConfig.excludeCredentials.forEach(cred => { cred.id = base64urlToBuffer(cred.id); });
        }

        statusEl.innerText = "Silakan autentikasi menggunakan Touch ID / Face ID / PIN pada perangkat ini...";

        const credential = await navigator.credentials.create({ publicKey: pkConfig });
        statusEl.innerText = "Menyegel kunci keamanan...";

        // Kirim credential.id (yang diharapkan oleh backend)
        const attestationData = {
            id: credential.id,
            rawId: bufferToBase64url(credential.rawId),
            type: credential.type,
            response: { clientDataJSON: bufferToBase64url(credential.response.clientDataJSON) }
        };

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const verifyRes = await fetch('/biometric/register-verify', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(attestationData)
        });

        const result = await verifyRes.json();

        if (result.status === 'success') {
            statusEl.innerHTML = '<i class="fa-solid fa-check"></i> Perangkat Berhasil Disahkan';
            statusEl.style.color = "var(--success-elegant)";
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setTimeout(() => window.location.reload(), 2000); 
        } else {
            throw new Error(result.message || 'Gagal menyegel kredensial.');
        }

    } catch (err) {
        console.error(err);
        optionsBox.style.display = 'block';
        gsap.to(optionsBox, { opacity: 1, height: 'auto', duration: 0.4 });
        statusEl.innerText = "Sertifikasi Dibatalkan: " + err.message;
        statusEl.style.color = "var(--danger-elegant)";
    }
}
