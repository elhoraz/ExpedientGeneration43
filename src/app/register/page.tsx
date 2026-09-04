"use client";

import { useEffect, useRef, useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useCms } from "@/components/layout/CmsProvider";
import "./register.css";

// Dynamic import for face-api.js and cropperjs to avoid SSR issues
let faceapi: any;
let Cropper: any;

function RegisterFormContent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [logoState, setLogoState] = useState<"exploding" | "united">("united");
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useCms();
  
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");
  const [showToast, setShowToast] = useState(!!errorMsg);
  
  // Forms & Cropper
  const [imagePreview, setImagePreview] = useState("");
  const [isCropping, setIsCropping] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropperInstance, setCropperInstance] = useState<any>(null);
  const cropTargetRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Face API
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceStatus, setFaceStatus] = useState("Memuat Kalibrasi...");
  const [isScanning, setIsScanning] = useState(false);
  const [faceStep, setFaceStep] = useState(0);
  const [faceData, setFaceData] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Load external libs
    import("cropperjs").then(mod => Cropper = mod.default);

    const savedTheme = (localStorage.getItem("expedient_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    triggerLogoExplosion();

    if (errorMsg) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, [errorMsg]);

  const triggerLogoExplosion = () => {
    setLogoState("exploding");
    setTimeout(() => {
      setLogoState("united");
    }, 1000);
  };

  const toggleTheme = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    triggerLogoExplosion();
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("expedient_theme", nextTheme);
  };

  // Helper to optimize image into base64 JPEG max 800x800
  const optimizeImage = (dataUri: string, callback: (optimizedUri: string) => void) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 800;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const result = canvas.toDataURL("image/jpeg", 0.88);
          callback(result);
          return;
        }
      } catch (err) {
        console.error("Error optimizing image:", err);
      }
      callback(dataUri);
    };
    img.onerror = () => callback(dataUri);
    img.src = dataUri;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const resultStr = event.target.result as string;

          // 1. Immediately set base64 synchronously so hidden input is NEVER empty
          setImagePreview(resultStr);
          const hiddenInput = document.getElementById("fotoProfilBase64Input") as HTMLInputElement;
          if (hiddenInput) hiddenInput.value = resultStr;

          // 2. Then optimize in background
          optimizeImage(resultStr, (optimized) => {
            setImagePreview(optimized);
            if (hiddenInput) hiddenInput.value = optimized;
          });

          setCropSrc(resultStr);
          setIsCropping(true);

          // Load Cropper dynamically if not loaded yet
          let CropperClass = Cropper;
          if (!CropperClass) {
            try {
              const mod = await import("cropperjs");
              Cropper = mod.default;
              CropperClass = Cropper;
            } catch (err) {
              console.error("Failed to load cropperjs:", err);
            }
          }

          if (CropperClass && cropTargetRef.current) {
            const initCropper = () => {
              if (cropperInstance) cropperInstance.destroy();
              const cropper = new CropperClass(cropTargetRef.current, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: "move",
                autoCropArea: 0.85,
                background: false
              });
              setCropperInstance(cropper);
            };

            const targetImg = cropTargetRef.current;
            if (targetImg.complete && targetImg.naturalWidth > 0) {
              initCropper();
            } else {
              targetImg.onload = initCropper;
            }
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = () => {
    if (cropperInstance) {
      try {
        const canvas = cropperInstance.getCroppedCanvas({ width: 500, height: 500 });
        if (canvas) {
          const base64 = canvas.toDataURL("image/jpeg", 0.9);
          setImagePreview(base64);
          const hiddenInput = document.getElementById("fotoProfilBase64Input") as HTMLInputElement;
          if (hiddenInput) hiddenInput.value = base64;
        }
      } catch (err) {
        console.error("Apply crop error:", err);
      }
      cropperInstance.destroy();
      setCropperInstance(null);
    }
    setIsCropping(false);
    setCropSrc("");
  };

  const cancelCrop = () => {
    setIsCropping(false);
    if (cropperInstance) {
      cropperInstance.destroy();
      setCropperInstance(null);
    }
    setCropSrc("");
    // Note: Do NOT clear imagePreview here!
    // If the user picked a photo and canceled the cropper dialog, 
    // the selected photo (optimized fallback) remains saved as their profile picture.
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      e.preventDefault();
      
      let firstInvalidElement: HTMLInputElement | null = null;
      const invalidInputs = form.querySelectorAll(":invalid") as NodeListOf<HTMLInputElement>;
      
      invalidInputs.forEach(input => {
        if (input.id === "snk") {
          const snkContainer = document.getElementById("snkContainer");
          if (snkContainer) {
            snkContainer.classList.add("is-invalid");
            const hint = snkContainer.querySelector(".error-hint") as HTMLElement;
            if (hint) hint.innerText = "Persetujuan ini wajib dicentang.";
          }
        } else {
          input.classList.add("is-invalid");
          const parent = input.parentElement;
          if (parent) {
            const hint = parent.querySelector(".error-hint") as HTMLElement;
            if (hint) {
              if (input.validity.valueMissing) { hint.innerText = "Kolom ini wajib diisi."; }
              else if (input.validity.typeMismatch && input.type === "email") { hint.innerText = "Gunakan format email yang sah (misal: nama@gmail.com)."; }
              else if (input.validity.tooShort) { hint.innerText = `Minimal harus ${input.getAttribute("minLength")} karakter.`; }
              else if (input.validity.patternMismatch) { hint.innerText = "Hanya boleh berisi angka."; }
              else { hint.innerText = "Format tidak sesuai."; }
            }
          }
        }
        if (!firstInvalidElement) firstInvalidElement = input;
      });

      if (firstInvalidElement) {
        (firstInvalidElement as HTMLElement).focus();
      }

      const btnSubmit = form.querySelector(".btn-prime");
      if (btnSubmit) {
        btnSubmit.classList.add("shake-anim");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => btnSubmit.classList.remove("shake-anim"), 500);
      }

    } else {
      if (!faceData) {
        e.preventDefault();
        startFaceScanner();
      }
    }
  };

  useEffect(() => {
    const allInputs = document.querySelectorAll(".input-control, input[type='checkbox']");
    allInputs.forEach(input => {
      input.addEventListener("input", function(this: HTMLInputElement) {
        this.classList.remove("is-invalid");
        if(this.id === "snk") {
          const snkContainer = document.getElementById("snkContainer");
          if (snkContainer) snkContainer.classList.remove("is-invalid");
        }
      });
    });
  }, []);

  const startFaceScanner = async () => {
    setIsFaceModalOpen(true);
    setFaceStatus("MEMUAT PROTOKOL KEAMANAN...");
    setFaceStep(0);
    setIsScanning(false);

    try {
      let faceapi = (window as any).faceapi;
      if (!faceapi) {
        setFaceStatus("MENGINISIALISASI MODULE AI...");
        let count = 0;
        while (!(window as any).faceapi && count < 15) {
          await new Promise(resolve => setTimeout(resolve, 200));
          count++;
        }
        faceapi = (window as any).faceapi;
      }

      if (!faceapi) {
        setFaceStatus("ERROR: MODEL AI TIDAK DAPAT DIMUAT");
        return;
      }

      setFaceStatus("MEMUAT DATA DETEKTOR WAJAH...");
      const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
      } catch (err) {
        console.error("Error loading face-api models:", err);
        setFaceStatus("ERROR: GAGAL MEMUAT MODEL AI DARI CDN");
        return;
      }

      setFaceStatus("MENGAKSES OPTIK KAMERA...");
      setFaceStep(1);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Video play error:", e));
          };
        }
      } catch (e) {
        setFaceStatus("ERROR: AKSES KAMERA DITOLAK");
        return;
      }

      setFaceStatus("MENUNGGU DETEKSI WAJAH...");
      setIsScanning(true);
      setFaceStep(1);

      let isVerifying = false;
      faceIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || isVerifying) return;

        // Wait until video is playing and has data
        if (videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
          return;
        }

        try {
          const detection = await faceapi.detectSingleFace(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 })
          )
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptor();

          if (!detection) {
            setFaceStatus("WAJAH TIDAK TERDETEKSI / KAMERA TERTUTUP");
            setFaceStep(1);
            return;
          }

          setFaceStep(2);
          setFaceStatus("WAJAH TERDETEKSI! SILAKAN TERSENYUM :)");

          // Check for happy expression (smile verification)
          if (detection.expressions.happy > 0.8) {
            isVerifying = true;
            clearInterval(faceIntervalRef.current);
            setFaceStep(4);
            setFaceStatus("VERIFIKASI SUKSES! MENGUNCI DATA...");
            setIsScanning(false);

            const descriptorArray = Array.from(detection.descriptor);
            const descriptorStr = JSON.stringify(descriptorArray);
            setFaceData(descriptorStr);
            const faceInput = document.getElementById("faceDataInput") as HTMLInputElement;
            if (faceInput) faceInput.value = descriptorStr;

            if (streamRef.current) {
              streamRef.current.getTracks().forEach(t => t.stop());
            }

            setTimeout(() => {
              setIsFaceModalOpen(false);
              const form = document.getElementById("registerForm") as HTMLFormElement;
              if (form) form.submit();
            }, 1500);
          } else {
            setFaceStep(3);
            setFaceStatus("EKSTRAKSI BIOMETRIK... SILAKAN TERSENYUM");
          }
        } catch (err) {
          console.error("Error during face detection:", err);
        }
      }, 500);

    } catch (error) {
      setFaceStatus("ERROR: GAGAL MEMULAI PEMINDAIAN");
    }
  };

  const closeFaceScanner = () => {
    setIsFaceModalOpen(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
  };

  return (
    <div className="register-page">
      <div className="aurora-container">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      {showToast && (
        <div id="dynamicToast" className={`quantum-toast toast-error ${showToast ? 'show' : ''}`}>
          <div className="toast-icon"><i className="fa-solid fa-shield-virus"></i></div>
          <div style={{ transform: "translateZ(15px)" }}>
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", letterSpacing: "1px" }}>Akses Ditolak</strong><br/>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{errorMsg}</span>
          </div>
        </div>
      )}

      <Link href="/login" className="floating-nav">
        <i className="fa-solid fa-arrow-left-long"></i> <span className="nav-text">Kembali</span>
      </Link>
      <button className="theme-widget" id="btnTheme" title="Ganti Mode" onClick={toggleTheme}>
        <div className="icon-orb">
          <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`} id="toggleIcon"></i>
        </div>
        <span className="widget-text" id="themeText">
          {theme === "dark" ? "Malam" : "Siang"}
        </span>
      </button>

      <div className="main-container">
        <div className="register-vault" id="mainVault">
          <div className="vault-header">
            <div className={`logo-container ${logoState}`} id="logoContainer">
              <img src="/images/kristal-puncak.webp" className="logo-part part-1" alt="Part" />
              <img src="/images/tanduk-perak.webp" className="logo-part part-2" alt="Part" />
              <img src="/images/zamrud-hijau.webp" className="logo-part part-3" alt="Part" />
              <img src="/images/cincin-emas.webp" className="logo-part part-4" alt="Part" />
              <img src="/images/mahkota-emas.webp" className="logo-part part-5" alt="Part" />
              <img src={t('register_hero_image', '/images/logo-utuh.webp')} className="logo-utuh" alt="Expedient Logo" />
            </div>
            <h1 className="title-holographic">{t('register_title', 'Inisiasi Angkatan')}</h1>
            <p className="subtitle-spec">{t('register_subtitle', 'Pahat identitas Anda dalam sejarah 43rd Arrisalah Expedient Generation.')}</p>
          </div>

          <form action="/auth/register" method="POST" encType="multipart/form-data" id="registerForm" noValidate onSubmit={handleSubmit}>
            <input type="hidden" name="face_data" id="faceDataInput" value={faceData} />
            <input type="hidden" name="foto_profil_base64" id="fotoProfilBase64Input" value={imagePreview} />
            
            <div className="form-grid">
              <div className="input-group">
                <input type="text" name="nama_lengkap" className="input-control" required minLength={3} placeholder=" " />
                <label className="input-label">Nama Lengkap (Sesuai Ijazah)</label>
                <div className="input-neon-line"></div>
                <div className="error-hint">Wajib diisi dengan benar.</div>
              </div>
              
              <div className="input-group">
                <input type="text" name="nama_panggilan" className="input-control" required minLength={2} placeholder=" " />
                <label className="input-label">Nama Panggilan</label>
                <div className="input-neon-line"></div>
                <div className="error-hint">Wajib diisi dengan benar.</div>
              </div>

              <div className="input-group">
                <select name="jenis_kelamin" className="input-control" required defaultValue="">
                  <option value="" disabled hidden>Pilih Gender...</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <label className="input-label">Jenis Kelamin</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>
              
              <div className="input-group">
                <input type="text" name="tempat_lahir" className="input-control" required placeholder=" " />
                <label className="input-label">Tempat Lahir</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>

              <div className="input-group">
                <input type="date" name="tanggal_lahir" className="input-control" required placeholder=" " style={{ colorScheme: "dark" }} />
                <label className="input-label" style={{ top: "-20px", fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "2px", fontWeight: 700 }}>Tanggal Lahir</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>

              <div className="input-group span-full">
                <input type="text" name="alamat_lengkap" className="input-control" required minLength={10} placeholder=" " />
                <label className="input-label">Alamat Lengkap Domisili</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>

              <div className="input-group">
                <input type="email" name="email" className="input-control" required placeholder=" " />
                <label className="input-label">Surel Resmi (Email Aktif)</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>
              
              <div className="input-group">
                <input type="text" name="no_whatsapp" className="input-control" required minLength={10} pattern="[0-9]+" placeholder=" " />
                <label className="input-label">Nomor WhatsApp (Contoh: 628123456789)</label>
                <div className="input-neon-line"></div>
                <div className="error-hint">Wajib menggunakan format 62 (Kode Negara).</div>
              </div>

              <div className="input-group span-full">
                <input type={showPassword ? "text" : "password"} name="password" className="input-control" required minLength={8} placeholder=" " />
                <label className="input-label">Kata Sandi Akses</label>
                <div className="input-neon-line"></div>
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} icon-eye`} onClick={() => setShowPassword(!showPassword)}></i>
              </div>

              <div className="input-group">
                <input type="text" name="motivasi_hidup" className="input-control" placeholder=" " />
                <label className="input-label">Motivasi & Filosofi Hidup</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>
              
              <div className="input-group">
                <input type="text" name="cita_cita" className="input-control" placeholder=" " />
                <label className="input-label">Cita-Cita Terbesar</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>

              <div className="input-group">
                <input type="text" name="akun_ig" className="input-control" placeholder=" " />
                <label className="input-label">Instagram (@username)</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>
              
              <div className="input-group">
                <input type="text" name="akun_tiktok" className="input-control" placeholder=" " />
                <label className="input-label">TikTok (@username)</label>
                <div className="input-neon-line"></div>
                <div className="error-hint"></div>
              </div>

              <div className="input-group span-full">
                <label className="input-label" style={{ top: "-20px", fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "2px", fontWeight: 700 }}>Foto Profil Eksklusif</label>
                <label className="upload-zone" onClick={() => fileInputRef.current?.click()} style={{ display: imagePreview ? "none" : "flex" }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "5px" }}>Unggah Pasfoto Terbaik</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Tap/Klik di area ini untuk menelusuri galeri</span>
                  <input type="file" ref={fileInputRef} name="foto_profil_file" onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
                </label>
                <div className={`preview-area ${imagePreview ? "show" : ""}`}>
                  {imagePreview && <img src={imagePreview} alt="Pratinjau Foto" />}
                  <br />
                  <button 
                    type="button" 
                    className="btn-change-photo" 
                    onClick={() => { 
                      setImagePreview(""); 
                      const hiddenInput = document.getElementById("fotoProfilBase64Input") as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = "";
                      if (fileInputRef.current) fileInputRef.current.value = ""; 
                      fileInputRef.current?.click(); 
                    }}
                  >
                    Ubah Pilihan Foto
                  </button>
                </div>
              </div>

              <div className="input-group span-full checkbox-container" id="snkContainer">
                <input type="checkbox" id="snk" name="snk" required />
                <label htmlFor="snk">Saya menyatakan dengan sadar bahwa data ini benar dan menyetujui penyimpanannya ke dalam direktori angkatan Expedient.</label>
                <div className="error-hint" style={{ bottom: "-15px" }}></div>
              </div>

              <div className="span-full btn-magnetic-wrapper">
                <button type="submit" className="btn-prime magnetic-btn">Selesaikan Inisiasi <i className="fa-solid fa-check"></i></button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Cropper Modal */}
      <div className={`crop-modal ${isCropping ? "active" : ""}`}>
        <div className="crop-content">
          <h3 style={{ color: "var(--text-primary)", textAlign: "center", marginBottom: "20px", fontWeight: 700 }}>Sesuaikan Presisi Foto</h3>
          <div className="crop-img-wrap"><img ref={cropTargetRef} src={cropSrc || undefined} alt="target" /></div>
          <div className="crop-actions">
            <button type="button" className="crop-btn-cancel" onClick={cancelCrop}>Batalkan</button>
            <button type="button" className="crop-btn-apply" onClick={applyCrop}>Terapkan Pemotongan</button>
          </div>
        </div>
      </div>

      {/* Face Scanner Modal */}
      <div className={`auth-vault ${isFaceModalOpen ? "active" : ""}`}>
        <div className={`retina-container ${isScanning ? "scanning" : ""}`}>
          <div className="focus-ring"></div>
          <div className="bracket bracket-tl"></div>
          <div className="bracket bracket-tr"></div>
          <div className="bracket bracket-bl"></div>
          <div className="bracket bracket-br"></div>
          
          <div className="camera-frame">
            <video ref={videoRef} className="camera-feed" autoPlay playsInline muted></video>
            <div className="lens-dust"></div>
            <div className="scan-line" ref={scanLineRef} style={{ opacity: isScanning ? 1 : 0 }}></div>
          </div>
        </div>

        <div className="liveness-indicator">
          <div className={`live-node ${faceStep >= 1 ? "active" : ""} ${faceStep >= 2 ? "done" : ""}`}></div>
          <div className={`live-node ${faceStep >= 2 ? "active" : ""} ${faceStep >= 3 ? "done" : ""}`}></div>
          <div className={`live-node ${faceStep >= 3 ? "active" : ""} ${faceStep >= 4 ? "done" : ""}`}></div>
        </div>

        <div className="status-display">
          <div className="status-title">Protokol Keamanan VVIP</div>
          <div className="status-value">{faceStatus}</div>
        </div>

        <button type="button" className="crop-btn-cancel" style={{ marginTop: "40px", fontSize: "0.75rem" }} onClick={closeFaceScanner}>BATALKAN INISIASI</button>
      </div>
      <Script src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js" strategy="afterInteractive" />
    </div>
  );
}

export default function RegisterClient() {
  return (
    <Suspense fallback={<div style={{ width: "100%", minHeight: "100vh", background: "#020406" }}></div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
