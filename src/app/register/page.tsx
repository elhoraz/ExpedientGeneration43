"use client";

import { useEffect, useRef, useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useCms } from "@/components/layout/CmsProvider";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import "./register.css";

// Dynamic import for face-api.js to avoid SSR issues
let faceapi: any;

function RegisterFormContent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [logoState, setLogoState] = useState<"exploding" | "united">("united");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const { t } = useCms();

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: "", percent: 0 };
    if (pwd.length < 8) return { level: 1, label: "Kurang dari 8 karakter", percent: 25 };
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (pwd.length >= 10 && hasLetter && hasNumber && hasSpecial) {
      return { level: 4, label: "Sangat Kuat", percent: 100 };
    }
    if (hasLetter && hasNumber) {
      return { level: 3, label: "Kuat", percent: 75 };
    }
    return { level: 2, label: "Cukup", percent: 50 };
  };

  const pwdStrength = getPasswordStrength(passwordValue);
  
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");
  const verifyParam = searchParams.get("verify");
  const emailParam = searchParams.get("email");
  const [showToast, setShowToast] = useState(!!errorMsg);
  const [toastMessage, setToastMessage] = useState(errorMsg || "");
  
  // Forms & Photo Cropper
  const [imagePreview, setImagePreview] = useState("");
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
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

  // OTP Verification States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<"choose_channel" | "input_otp" | "success">("choose_channel");
  const [selectedChannel, setSelectedChannel] = useState<"gmail" | "whatsapp" | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredWa, setRegisteredWa] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const showToastAlert = (msg: any) => {
    let text = "Pendaftaran gagal. Silakan coba lagi.";
    if (typeof msg === "string") {
      text = msg;
    } else if (msg && typeof msg.message === "string") {
      text = msg.message;
    } else if (msg && typeof msg.error === "string") {
      text = msg.error;
    }
    if (text === "[object Object]" || text.includes("[object Object]")) {
      text = "Ukuran file atau data foto terlalu besar. Silakan gunakan foto lain yang lebih ringan.";
    }
    setToastMessage(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 6000);
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("expedient_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    triggerLogoExplosion();

    if (errorMsg) {
      let text = errorMsg;
      if (text === "[object Object]") text = "Terjadi kendala saat registrasi. Silakan ulangi.";
      setToastMessage(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    }

    // Dukungan langsung membuka modal OTP jika diarahkan dari login / URL
    if (verifyParam === "true" && emailParam) {
      setRegisteredEmail(emailParam);
      setIsOtpModalOpen(true);
      setOtpStep("choose_channel");
    }
  }, [errorMsg, verifyParam, emailParam]);

  // Global ESC Key Handler to close open modals gracefully
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCropperOpen) setIsCropperOpen(false);
        if (isFaceModalOpen) closeFaceScanner();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCropperOpen, isFaceModalOpen]);

  const triggerLogoExplosion = () => {
    setLogoState("exploding");
    setTimeout(() => {
      setLogoState("united");
    }, 1000);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("expedient_theme", nextTheme);
  };

  // Helper to compress any image data URL directly to a lightweight Base64 JPEG (max 800px, ~50-90KB)
  const compressImageDataUrl = (dataUrl: string, maxDim = 800, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
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
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
            return;
          }
        } catch (err) {
          console.error("Canvas compression error:", err);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (file.size > 15 * 1024 * 1024) {
        showToastAlert("Ukuran file foto melebihi batas 15MB. Silakan pilih foto lain yang lebih ringan.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif|heic|heif)$/i.test(file.name);
      if (!isImage && file.type) {
        showToastAlert("Format file harus berupa gambar (JPG, PNG, atau WEBP).");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const resultUrl = reader.result as string;
          if (!resultUrl) {
            showToastAlert("Gagal membaca file foto. Silakan coba file lain.");
            return;
          }

          // Segera kompresi dan set preview agar foto LANGSUNG terlihat di form
          const compressed = await compressImageDataUrl(resultUrl, 800, 0.85);
          setImagePreview(compressed);
          setRawCropImage(resultUrl);
          setIsCropperOpen(true);
        };

        reader.onerror = () => {
          showToastAlert("Gagal membaca file foto. Silakan coba file lain.");
        };

        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Error reading profile photo file:", err);
        showToastAlert("Terjadi kendala saat membaca foto.");
      }
    }
  };

  const handleCropApply = async (_croppedBlob: Blob, croppedDataUrl: string) => {
    try {
      const compressed = await compressImageDataUrl(croppedDataUrl, 600, 0.85);
      setImagePreview(compressed);
    } catch {
      setImagePreview(croppedDataUrl);
    }
    setIsCropperOpen(false);
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);
  };

  const handleResetPhoto = () => {
    setImagePreview("");
    setRawCropImage(null);
    setIsCropperOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = () => {
    setImagePreview("");
    setRawCropImage(null);
    setIsCropperOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitRegistrationAsync = async (faceDescStr: string) => {
    const form = document.getElementById("registerForm") as HTMLFormElement;
    if (!form) return;

    try {
      setIsSubmittingForm(true);
      const formData = new FormData(form);
      // Hapus file mentah agar tidak melebihi kuota 4.5MB Serverless Payload Vercel
      formData.delete("foto_profil_file");
      if (faceDescStr) {
        formData.set("face_data", faceDescStr);
      }
      if (imagePreview) {
        formData.set("foto_profil_base64", imagePreview);
      }

      const res = await fetch("/auth/register?json=true", {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: formData,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || data.error) {
        let errMessage = "Gagal memproses inisiasi registrasi.";
        if (res.status === 413) {
          errMessage = "Ukuran file foto terlalu besar untuk jaringan. Silakan gunakan foto yang lebih kecil.";
        } else if (typeof data.error === "string") {
          errMessage = data.error;
        } else if (data.error && typeof data.error.message === "string") {
          errMessage = data.error.message;
        } else if (typeof data.message === "string") {
          errMessage = data.message;
        }
        throw new Error(errMessage);
      }

      setRegisteredEmail(data.email || "");
      setRegisteredWa(data.no_whatsapp || "");
      setIsOtpModalOpen(true);
      setOtpStep("choose_channel");
    } catch (err: any) {
      console.error("Registration error:", err);
      showToastAlert(err?.message || "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleSendOtp = async (channel: "gmail" | "whatsapp") => {
    if (!registeredEmail) {
      showToastAlert("Email pendaftaran tidak ditemukan. Silakan isi form kembali.");
      return;
    }

    try {
      setIsSendingOtp(true);
      setOtpError(null);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, channel }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || data.error) {
        let errMessage = "Gagal mengirimkan kode OTP.";
        if (typeof data.error === "string") errMessage = data.error;
        else if (data.error && typeof data.error.message === "string") errMessage = data.error.message;
        else if (typeof data.message === "string") errMessage = data.message;
        throw new Error(errMessage);
      }

      const finalChannel = (data.channel as "gmail" | "whatsapp") || channel;
      setSelectedChannel(finalChannel);
      setMaskedTarget(data.target || (finalChannel === "whatsapp" ? registeredWa : registeredEmail));
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpCooldown(60);
      setOtpStep("input_otp");

      if (data.channel && data.channel !== channel) {
        showToastAlert(data.message || "Pengiriman ke Gmail dialihkan ke WhatsApp!");
      }

      // Auto-focus first digit box
      setTimeout(() => {
        const firstBox = document.getElementById("otp-box-0") as HTMLInputElement;
        firstBox?.focus();
      }, 150);
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setOtpError(err?.message || "Gagal mengirimkan kode OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpWithDigits = async (digits: string[]) => {
    const fullOtp = digits.join("").trim();
    if (fullOtp.length !== 6) {
      setOtpError("Masukkan 6 digit kode OTP secara lengkap.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setOtpError(null);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otp: fullOtp }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || data.error) {
        let errMessage = "Verifikasi OTP gagal.";
        if (typeof data.error === "string") errMessage = data.error;
        else if (data.error && typeof data.error.message === "string") errMessage = data.error.message;
        else if (typeof data.message === "string") errMessage = data.message;
        throw new Error(errMessage);
      }

      setOtpStep("success");
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

      // Redirect ke login dalam 2.5 detik
      setTimeout(() => {
        window.location.href = data.redirect_url || "/login?success=Akun+Anda+telah+aktif";
      }, 2500);
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setOtpError(err.message || "Kode OTP tidak valid.");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    handleVerifyOtpWithDigits(otpDigits);
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleanVal[cleanVal.length - 1];
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (index < 5) {
      const nextBox = document.getElementById(`otp-box-${index + 1}`) as HTMLInputElement;
      nextBox?.focus();
    } else if (newDigits.every(d => d !== "")) {
      // Otomatis verifikasi jika semua 6 digit terisi
      setTimeout(() => {
        handleVerifyOtpWithDigits(newDigits);
      }, 100);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevBox = document.getElementById(`otp-box-${index - 1}`) as HTMLInputElement;
      prevBox?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    const targetBox = document.getElementById(`otp-box-${nextIndex}`) as HTMLInputElement;
    targetBox?.focus();

    if (pasted.length === 6) {
      setTimeout(() => {
        handleVerifyOtpWithDigits(newDigits);
      }, 100);
    }
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
              else if (input.validity.tooShort || (input.name === "password" && input.value.length < 8)) { hint.innerText = "Kata sandi minimal harus 8 karakter."; }
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
      e.preventDefault();
      if (!faceData) {
        startFaceScanner();
      } else {
        submitRegistrationAsync(faceData);
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
        setFaceStatus("MENGUNDUH MODUL BIOMETRIK AI...");
        await new Promise<void>((resolve, reject) => {
          if ((window as any).faceapi) return resolve();
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Gagal mengunduh modul AI dari CDN"));
          document.head.appendChild(script);
        });
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
      let detectedFrames = 0;
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

          detectedFrames++;
          setFaceStep(2);
          setFaceStatus("WAJAH TERDETEKSI! SILAKAN TERSENYUM :)");

          // Check for happy expression (smile verification) atau stabil terdeteksi
          if (detection.expressions.happy > 0.65 || (detectedFrames >= 6 && detection.detection.score > 0.6)) {
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
              submitRegistrationAsync(descriptorStr);
            }, 1200);
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
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", letterSpacing: "1px" }}>Pemberitahuan</strong><br/>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{toastMessage || errorMsg}</span>
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
                <label className="input-label">Nomor WhatsApp (Aktif, Contoh: 081234567890)</label>
                <div className="input-neon-line"></div>
                <div className="error-hint">Masukkan nomor WhatsApp aktif (awalan 08 atau 62).</div>
              </div>

              <div className="input-group span-full has-requirements">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  id="passwordInput"
                  className="input-control" 
                  required 
                  minLength={8} 
                  placeholder=" " 
                  value={passwordValue}
                  onChange={(e) => {
                    setPasswordValue(e.target.value);
                    if (e.target.value.length >= 8) {
                      e.target.classList.remove("is-invalid");
                    }
                  }}
                />
                <label className="input-label">Kata Sandi Akses</label>
                <div className="input-neon-line"></div>
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} icon-eye`} onClick={() => setShowPassword(!showPassword)}></i>
                <div className="error-hint">Kata sandi minimal harus 8 karakter.</div>

                <div className="password-requirements-box">
                  <div className="pwd-req-header">
                    <span className="pwd-req-title">
                      <i className="fa-solid fa-shield-halved"></i> Ketentuan Kata Sandi
                    </span>
                    {passwordValue.length > 0 && (
                      <span className={`pwd-strength-badge strength-${pwdStrength.level}`}>
                        {pwdStrength.label}
                      </span>
                    )}
                  </div>

                  {passwordValue.length > 0 && (
                    <div className="pwd-strength-bar-wrap">
                      <div 
                        className={`pwd-strength-bar strength-${pwdStrength.level}`} 
                        style={{ width: `${pwdStrength.percent}%` }}
                      ></div>
                    </div>
                  )}

                  <div className="pwd-req-items">
                    <div className={`pwd-req-item ${passwordValue.length >= 8 ? "valid" : "pending"}`}>
                      <i className={`fa-solid ${passwordValue.length >= 8 ? "fa-circle-check" : "fa-circle"}`}></i>
                      <span>Minimal 8 karakter ({passwordValue.length}/8)</span>
                    </div>
                    <div className={`pwd-req-item ${/[a-zA-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue) ? "valid" : "info"}`}>
                      <i className={`fa-solid ${/[a-zA-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue) ? "fa-circle-check" : "fa-circle-info"}`}></i>
                      <span>Disarankan perpaduan huruf & angka</span>
                    </div>
                  </div>
                </div>
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
                
                {/* Upload Zone (Tampil saat belum ada foto terpilih) */}
                {!imagePreview && (
                  <label className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "5px" }}>Unggah Pasfoto Terbaik</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Tap/Klik di area ini untuk menelusuri galeri (Maksimal 15MB)</span>
                    <span style={{ color: "#d4af37", fontSize: "0.75rem", marginTop: "4px" }}>
                      <i className="fa-solid fa-crop-simple"></i> Pemotong otomatis rasio 1:1 akan muncul
                    </span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      name="foto_profil_file" 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      style={{ display: "none" }} 
                    />
                  </label>
                )}

                {/* Preview Area (Tampil saat foto telah dipilih) */}
                {imagePreview && (
                  <div className="photo-preview-card">
                    <div className="preview-avatar-wrap">
                      <img src={imagePreview} alt="Pratinjau Pasfoto" className="preview-avatar-img" />
                      <div className="preview-status-badge">
                        <i className="fa-solid fa-circle-check"></i> Siap Disimpan
                      </div>
                    </div>
                    
                    <div className="preview-details">
                      <h4 className="preview-details-title">Pasfoto Terpilih</h4>
                      <p className="preview-details-sub">Rasio 1:1 pasfoto siap digunakan untuk direktori resmi & buku tahunan angkatan.</p>
                      
                      <div className="preview-actions">
                        <button 
                          type="button" 
                          className="btn-preview-action btn-recrop" 
                          onClick={() => {
                            if (rawCropImage) {
                              setIsCropperOpen(true);
                            } else {
                              fileInputRef.current?.click();
                            }
                          }}
                        >
                          <i className="fa-solid fa-crop-simple"></i> Atur Ulang Posisi (Crop)
                        </button>
                        <button 
                          type="button" 
                          className="btn-preview-action btn-change" 
                          onClick={handleResetPhoto}
                        >
                          <i className="fa-solid fa-arrows-rotate"></i> Ganti Foto Lain
                        </button>
                        <button 
                          type="button" 
                          className="btn-preview-action btn-remove" 
                          onClick={handleRemovePhoto}
                          title="Hapus foto"
                        >
                          <i className="fa-solid fa-trash-can"></i> Hapus
                        </button>
                      </div>
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      name="foto_profil_file" 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      style={{ display: "none" }} 
                    />
                  </div>
                )}

                {/* Hidden input agar data foto_profil_base64 selalu terikutsertakan */}
                <input type="hidden" name="foto_profil_base64" id="fotoProfilBase64Input" value={imagePreview} />

                <div className="photo-guidelines-box">
                  <div className="photo-guide-header">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>Ketentuan & Petunjuk Unggah Pasfoto</span>
                  </div>
                  <div className="photo-guide-grid">
                    <div className="photo-guide-item">
                      <i className="fa-solid fa-file-image"></i>
                      <div>
                        <strong>Format & Ukuran File</strong>
                        <p>Mendukung JPG, JPEG, PNG, WEBP (Maksimal 15MB). Sistem otomatis mengompresi gambar tanpa mengurangi kualitas.</p>
                      </div>
                    </div>
                    <div className="photo-guide-item">
                      <i className="fa-solid fa-user-check"></i>
                      <div>
                        <strong>Kerapihan & Komposisi Pasfoto</strong>
                        <p>Gunakan pasfoto sopan/formal, wajah menghadap depan, pencahayaan jelas tanpa kacamata hitam atau masker.</p>
                      </div>
                    </div>
                    <div className="photo-guide-item">
                      <i className="fa-solid fa-crop-simple"></i>
                      <div>
                        <strong>Pemotong Foto Otomatis (Rasio 1:1)</strong>
                        <p>Setelah memilih foto, jendela pemotong foto akan muncul otomatis agar posisi wajah pas dan simetris.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="input-group span-full checkbox-container" id="snkContainer">
                <input type="checkbox" id="snk" name="snk" required />
                <label htmlFor="snk">Saya menyatakan dengan sadar bahwa data ini benar dan menyetujui penyimpanannya ke dalam direktori angkatan Expedient.</label>
                <div className="error-hint" style={{ bottom: "-15px" }}></div>
              </div>

              <div className="span-full btn-magnetic-wrapper">
                <button type="submit" className="btn-prime magnetic-btn" disabled={isSubmittingForm}>
                  {isSubmittingForm ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Menyimpan Inisiasi...
                    </>
                  ) : (
                    <>
                      Selesaikan Inisiasi <i className="fa-solid fa-check"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {isCropperOpen && rawCropImage && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={rawCropImage}
          title="Sesuaikan Posisi Pasfoto (Rasio 1:1)"
          aspectRatio={1}
          outputWidth={600}
          outputHeight={600}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}

      {/* Face Scanner Modal */}
      <div className={`auth-vault ${isFaceModalOpen ? "active" : ""}`} role="dialog" aria-modal="true" aria-label="Pemindai Biometrik Wajah">
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

        {faceStatus.includes("ERROR") && (
          <button
            type="button"
            className="btn-prime"
            style={{ marginTop: "20px", fontSize: "0.75rem", padding: "8px 16px", borderRadius: "8px" }}
            onClick={() => {
              closeFaceScanner();
              submitRegistrationAsync("");
            }}
          >
            <i className="fa-solid fa-forward"></i> Lanjutkan Tanpa Face ID (Daftarkan Nanti di Profil)
          </button>
        )}

        <button type="button" className="crop-btn-cancel" style={{ marginTop: "25px", fontSize: "0.75rem" }} onClick={closeFaceScanner}>BATALKAN INISIASI</button>
      </div>

      {/* OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="otp-modal-backdrop">
          <div className="otp-modal-vault" role="dialog" aria-modal="true" aria-label="Verifikasi Kode Keamanan OTP">
            <div className="otp-ambient-glow"></div>

            {/* STEP 1: PILIH METODE VERIFIKASI (GMAIL vs WHATSAPP) */}
            {otpStep === "choose_channel" && (
              <div className="otp-step-content">
                <div className="otp-badge-icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h3 className="otp-title">Pilih Metode Verifikasi</h3>
                <p className="otp-subtitle">
                  Pilih jalur pengiriman kode verifikasi OTP (6 digit) untuk mengesahkan identitas akun Anda:
                </p>

                <div className="otp-channel-grid">
                  {/* Opsi 1: Gmail */}
                  <button
                    type="button"
                    className="otp-channel-card"
                    onClick={() => handleSendOtp("gmail")}
                    disabled={isSendingOtp}
                  >
                    <div className="channel-icon-wrap icon-gmail">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <div className="channel-info">
                      <div className="channel-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>Kirim via Gmail</span>
                        <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: "10px", background: "rgba(212, 175, 55, 0.2)", border: "1px solid rgba(212, 175, 55, 0.45)", color: "#ffd700", fontWeight: 700, letterSpacing: "0.5px" }}>
                          Rekomendasi
                        </span>
                      </div>
                      <div className="channel-target">{registeredEmail || "Email Anda"}</div>
                    </div>
                    <div className="channel-arrow">
                      <i className="fa-solid fa-chevron-right"></i>
                    </div>
                  </button>

                  {/* Opsi 2: WhatsApp */}
                  <button
                    type="button"
                    className="otp-channel-card"
                    onClick={() => handleSendOtp("whatsapp")}
                    disabled={isSendingOtp}
                  >
                    <div className="channel-icon-wrap icon-whatsapp">
                      <i className="fa-brands fa-whatsapp"></i>
                    </div>
                    <div className="channel-info">
                      <div className="channel-name">Kirim via WhatsApp</div>
                      <div className="channel-target">{registeredWa || "Nomor WhatsApp Anda"}</div>
                    </div>
                    <div className="channel-arrow">
                      <i className="fa-solid fa-chevron-right"></i>
                    </div>
                  </button>
                </div>

                {isSendingOtp && (
                  <div className="otp-loading-status">
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Sedang mengirimkan kode OTP...</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: INPUT 6 DIGIT KODE OTP */}
            {otpStep === "input_otp" && (
              <div className="otp-step-content">
                <div className="otp-badge-icon">
                  <i className="fa-solid fa-key"></i>
                </div>
                <h3 className="otp-title">Masukkan Kode OTP</h3>
                <p className="otp-subtitle">
                  Kode 6 digit telah dikirimkan ke{" "}
                  <strong style={{ color: "#ffd700" }}>
                    {selectedChannel === "whatsapp" ? `WhatsApp (${maskedTarget})` : `Gmail (${maskedTarget})`}
                  </strong>
                  . Silakan masukkan 6 angka di bawah:
                </p>

                {selectedChannel === "gmail" && (
                  <div className="otp-email-hint">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>
                      Belum menerima email di Kotak Masuk? Pastikan cek folder <strong>Spam</strong>, <strong>Junk</strong>, atau <strong>Promosi</strong> di Gmail Anda.
                    </span>
                  </div>
                )}

                <div className="otp-boxes-wrap" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-box-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      pattern="[0-9]*"
                      className="otp-digit-box"
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      autoComplete="one-time-code"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="otp-error-text">
                    <i className="fa-solid fa-triangle-exclamation"></i> {otpError}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-prime otp-submit-btn"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otpDigits.join("").length < 6}
                >
                  {isVerifyingOtp ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Mengesahkan Akun...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check-double"></i> Sahkan & Aktifkan Akun
                    </>
                  )}
                </button>

                <div className="otp-resend-row">
                  {otpCooldown > 0 ? (
                    <span className="otp-cooldown-text">
                      Kirim ulang kode dalam <strong>{otpCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="otp-resend-btn"
                      onClick={() => handleSendOtp(selectedChannel || "gmail")}
                      disabled={isSendingOtp}
                    >
                      <i className="fa-solid fa-rotate-right"></i> Kirim Ulang Kode OTP
                    </button>
                  )}
                </div>

                <div style={{ marginTop: "14px", textAlign: "center" }}>
                  <button
                    type="button"
                    className="otp-switch-channel-btn"
                    onClick={() => {
                      setOtpStep("choose_channel");
                      setOtpError(null);
                    }}
                  >
                    <i className="fa-solid fa-arrow-left"></i> Ganti Saluran (Pilih WhatsApp / Gmail)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUKSES VERIFIKASI */}
            {otpStep === "success" && (
              <div className="otp-step-content" style={{ textAlign: "center" }}>
                <div className="otp-success-icon">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h3 className="otp-title" style={{ color: "#ffd700" }}>
                  Verifikasi Berhasil!
                </h3>
                <p className="otp-subtitle" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                  Akun Anda telah <strong>resmi aktif 100%</strong>.<br />
                  Surat & ucapan selamat bergabung resmi telah dikirimkan ke <strong>WhatsApp</strong> dan <strong>Email</strong> Anda.
                </p>
                <div style={{ marginTop: "25px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Mengalihkan ke Gerbang Masuk...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
