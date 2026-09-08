"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type * as THREE_TYPES from "three";
import { getAvatarUrl } from "@/lib/avatar";

interface SovereignUser {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  foto_profil: string | null;
  public_token: string | null;
  prestise_points?: number;
}

export default function SovereignClient({ user }: { user: SovereignUser }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Engine Mode: 'lite' (60 FPS CSS3D Hologram - Bebas Lag) vs '3d' (Three.js Studio Lanyard)
  const [viewMode, setViewMode] = useState<"lite" | "3d">("3d");
  const [showMobileChoiceModal, setShowMobileChoiceModal] = useState(false);
  const [cardFormat, setCardFormat] = useState<"id" | "kta">("id");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const isDraggingCard = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Resolve foto URL secara aman
  const fotoUrl = user.foto_profil
    ? getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap)
    : "";

  // QR Code menggunakan public_token atau fallback ke id
  const qrToken = user.public_token || user.id;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=d4af37&margin=10&data=${encodeURIComponent(baseUrl + "/scan/" + qrToken)}`;

  // Nomor ID: 4 karakter pertama UUID uppercase
  const nomorId = "EXP-" + user.id.replace(/-/g, "").substring(0, 4).toUpperCase();

  // Deteksi Mobile pada Mount & Inisialisasi Mode
  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));

    setIsMobileDevice(isMobile);

    if (isMobile) {
      // Khusus mobile: langsung berikan modal pilihan pada saat user masuk ke halaman ini
      setShowMobileChoiceModal(true);

      const savedMode = localStorage.getItem("sovereign_chosen_mode") as "lite" | "3d" | null;
      if (savedMode === "lite" || savedMode === "3d") {
        setViewMode(savedMode);
      } else {
        // Default awal ke mode super ringan untuk mencegah lag di HP spek rendah
        setViewMode("lite");
      }
    } else {
      // Desktop: langsung ke 3D Studio grafis maksimal
      setViewMode("3d");
      setShowMobileChoiceModal(false);
    }

    document.body.classList.add("page-sovereign");
    return () => {
      document.body.classList.remove("page-sovereign");
    };
  }, []);

  // Update root attribute saat ganti tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isLightMode ? "light" : "dark");
  }, [isLightMode]);

  // Handler memilih mode dari modal atau switcher
  const handleSelectMode = (mode: "lite" | "3d") => {
    setViewMode(mode);
    setShowMobileChoiceModal(false);
    localStorage.setItem("sovereign_chosen_mode", mode);
  };

  // Salin Nomor ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(nomorId);
    setCopiedId(true);
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // INTERAKSI TILT & DRAG PADA MODE SUPER RINGAN (CSS 3D HOLOGRAPHIC)
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingCard.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, (cx / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (cy / rect.height) * 100));

    if (isDraggingCard.current) {
      const deltaX = (e.clientX - dragStart.current.x) * 0.4;
      const deltaY = -(e.clientY - dragStart.current.y) * 0.4;
      setTilt({
        x: Math.max(-28, Math.min(28, deltaX)),
        y: Math.max(-28, Math.min(28, deltaY)),
        glareX: pctX,
        glareY: pctY,
      });
    } else {
      const rotY = (pctX - 50) * 0.35;
      const rotX = -(pctY - 50) * 0.35;
      setTilt({ x: rotY, y: rotX, glareX: pctX, glareY: pctY });
    }
  };

  const handlePointerUp = () => {
    isDraggingCard.current = false;
    setTilt((prev) => ({ ...prev, x: 0, y: 0 }));
  };

  // Gyroscope tilt untuk Mode Super Ringan di mobile
  useEffect(() => {
    if (viewMode !== "lite") return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const rotY = Math.max(-25, Math.min(25, e.gamma * 0.7));
      const rotX = Math.max(-25, Math.min(25, (e.beta - 45) * 0.6));
      setTilt({
        x: rotY,
        y: rotX,
        glareX: 50 + rotY * 1.5,
        glareY: 50 + rotX * 1.5,
      });
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [viewMode]);

  // ---------------------------------------------------------------------------
  // GENERATOR EKSPOR HIGH-RESOLUTION PNG (2400 x 1800)
  // ---------------------------------------------------------------------------
  const handleExportPng = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const compCanvas = document.createElement("canvas");
      const ctx = compCanvas.getContext("2d")!;
      compCanvas.width = 2400;
      compCanvas.height = 1800;

      // Background Luxury Obsidian / Light
      const bgGrad = ctx.createLinearGradient(0, 0, compCanvas.width, compCanvas.height);
      if (isLightMode) {
        bgGrad.addColorStop(0, "#f8f9fa");
        bgGrad.addColorStop(1, "#e9ecef");
      } else {
        bgGrad.addColorStop(0, "#161a22");
        bgGrad.addColorStop(0.5, "#080a0d");
        bgGrad.addColorStop(1, "#020202");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

      // Watermark Header
      ctx.fillStyle = isLightMode ? "rgba(180,134,0,0.08)" : "rgba(212,175,55,0.06)";
      ctx.font = '900 130px "Playfair Display", serif';
      ctx.textAlign = "center";
      ctx.fillText("THE SOVEREIGN ALUMNI REGISTRY", 1200, 240);

      ctx.fillStyle = isLightMode ? "#8a6d1c" : "#d4af37";
      ctx.font = '600 24px "Inter", sans-serif';
      ctx.letterSpacing = "6px";
      ctx.fillText("EXPEDIENT 43 • OFFICIAL COHORT IDENTIFICATION CREDENTIAL", 1200, 310);

      // Helper load image
      const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          if (!url) return resolve(null);
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      const [avatarImg, qrImg] = await Promise.all([
        fotoUrl ? loadImage(fotoUrl) : Promise.resolve(null),
        loadImage(qrUrl),
      ]);

      const drawCardPlate = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 15;
        ctx.fillStyle = isLightMode ? "#ffffff" : "#0f131a";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      };

      // 1. ID CARD VERTIKAL (MUKA DEPAN) - x=180, y=420, w=580, h=920
      const idX = 180, idY = 420, idW = 580, idH = 920;
      drawCardPlate(idX, idY, idW, idH, 36);

      // Clip Lanyard Top
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(idX + idW / 2 - 40, idY - 20, 80, 25);

      // Gold Chip
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.roundRect(idX + 50, idY + 50, 90, 70, 10);
      ctx.fill();

      // VVIP Badge
      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 32px "Playfair Display", serif';
      ctx.textAlign = "right";
      ctx.fillText("VVIP", idX + idW - 50, idY + 95);

      // Avatar Foto
      const pX = idX + 50, pY = idY + 160, pW = idW - 100, pH = 340;
      ctx.fillStyle = "#1a1f2c";
      ctx.fillRect(pX, pY, pW, pH);
      if (avatarImg) {
        ctx.drawImage(avatarImg, pX, pY, pW, pH);
      }
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2;
      ctx.strokeRect(pX, pY, pW, pH);

      // Nama Anggota
      ctx.textAlign = "center";
      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 36px "Playfair Display", serif';
      ctx.fillText(user.nama_lengkap.toUpperCase(), idX + idW / 2, idY + 580, idW - 80);

      ctx.fillStyle = "#d4af37";
      ctx.font = '700 18px "Inter", sans-serif';
      ctx.letterSpacing = "4px";
      ctx.fillText("EXPEDIENT INHABITANT", idX + idW / 2, idY + 625);

      // ID Tag
      ctx.fillStyle = isLightMode ? "#555" : "#94a3b8";
      ctx.font = "bold 22px monospace";
      ctx.fillText(`ID: ${nomorId}`, idX + idW / 2, idY + 700);
      ctx.fillText("VALID THRU: FOREVER", idX + idW / 2, idY + 740);

      // Barcode
      ctx.fillStyle = isLightMode ? "#000000" : "#ffffff";
      for (let i = 0; i < 36; i++) {
        const bw = (i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 2);
        ctx.fillRect(idX + 80 + i * 11, idY + 800, bw, 50);
      }

      // 2. ID CARD VERTIKAL (MUKA BELAKANG) - x=840, y=420, w=580, h=920
      const bX = 840, bY = 420;
      drawCardPlate(bX, bY, idW, idH, 36);

      // Magnetic Stripe
      ctx.fillStyle = "#050505";
      ctx.fillRect(bX, bY + 60, idW, 90);

      // Directive Text
      ctx.textAlign = "center";
      ctx.fillStyle = "#d4af37";
      ctx.font = 'bold 26px "Playfair Display", serif';
      ctx.fillText("THE REGISTRY DIRECTIVE", bX + idW / 2, bY + 230);

      ctx.fillStyle = isLightMode ? "#555" : "#94a3b8";
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillText("Properti Eksklusif Expedient Generation 43.", bX + idW / 2, bY + 280);
      ctx.fillText("Simpan kartu ini sebagai hak akses The Vault.", bX + idW / 2, bY + 315);

      // QR Code
      const qrBoxX = bX + (idW - 240) / 2, qrBoxY = bY + 360;
      if (qrImg) {
        ctx.drawImage(qrImg, qrBoxX, qrBoxY, 240, 240);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 3;
        ctx.strokeRect(qrBoxX, qrBoxY, 240, 240);
      }

      ctx.fillStyle = isLightMode ? "#333" : "#e2e8f0";
      ctx.font = "bold 18px monospace";
      ctx.fillText("SCAN TO VERIFY CREDENTIAL", bX + idW / 2, bY + 650);

      // Signature Strip
      ctx.fillStyle = isLightMode ? "#e2e8f0" : "#ffffff";
      ctx.fillRect(bX + 80, bY + 720, idW - 160, 50);
      ctx.fillStyle = "#000000";
      ctx.font = 'italic bold 22px "Playfair Display", serif';
      ctx.fillText(user.nama_panggilan || user.nama_lengkap, bX + idW / 2, bY + 755);

      // 3. KTA HORIZONTAL (FRONT) - x=1500, y=420, w=720, h=440
      const kX = 1500, kY = 420, kW = 720, kH = 440;
      drawCardPlate(kX, kY, kW, kH, 30);

      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.roundRect(kX + 60, kY + 60, 90, 70, 10);
      ctx.fill();

      ctx.textAlign = "right";
      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 28px "Playfair Display", serif';
      ctx.fillText("EXPEDIENT SOVEREIGN", kX + kW - 60, kY + 90);

      ctx.textAlign = "left";
      ctx.fillStyle = "#d4af37";
      ctx.font = "bold 32px monospace";
      ctx.fillText(`4300 •••• •••• ${nomorId.replace("EXP-", "")}`, kX + 60, kY + 230);

      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 28px "Inter", sans-serif';
      ctx.fillText(user.nama_lengkap.toUpperCase(), kX + 60, kY + 320, 450);

      ctx.fillStyle = isLightMode ? "#666" : "#94a3b8";
      ctx.font = "16px monospace";
      ctx.fillText("VALID: FOREVER", kX + 60, kY + 360);

      if (avatarImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(kX + kW - 110, kY + 310, 70, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, kX + kW - 180, kY + 240, 140, 140);
        ctx.restore();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(kX + kW - 110, kY + 310, 70, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. KTA HORIZONTAL (BACK) - x=1500, y=900, w=720, h=440
      const kbY = 900;
      drawCardPlate(kX, kbY, kW, kH, 30);

      ctx.fillStyle = "#050505";
      ctx.fillRect(kX, kbY + 50, kW, 70);

      ctx.textAlign = "left";
      ctx.fillStyle = "#d4af37";
      ctx.font = 'bold 24px "Playfair Display", serif';
      ctx.fillText("THE VAULT AUTHORIZATION", kX + 60, kbY + 180);

      ctx.fillStyle = isLightMode ? "#555" : "#94a3b8";
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillText("Official Alumni Credential • Expedient 43", kX + 60, kbY + 225);
      ctx.fillText("Unauthorized reproduction is strictly prohibited.", kX + 60, kbY + 260);

      if (qrImg) {
        ctx.drawImage(qrImg, kX + kW - 200, kbY + 170, 140, 140);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.strokeRect(kX + kW - 200, kbY + 170, 140, 140);
      }

      // Download file PNG
      const link = document.createElement("a");
      link.download = `sovereign-credential-${nomorId}.png`;
      link.href = compCanvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Gagal export PNG:", err);
    } finally {
      setIsExporting(false);
    }
  }, [fotoUrl, isExporting, isLightMode, nomorId, qrUrl, user]);

  // ---------------------------------------------------------------------------
  // THREE.JS 3D STUDIO RUNNER (AKTIF SAAT viewMode === '3d')
  // DENGAN PERBAIKAN BUG KARTU TERBALIK (kalibrasiUV: flipY=true, repeat.set(1,1))
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (viewMode !== "3d") return;

    let cleanupFn: (() => void) | null = null;
    let isCancelled = false;

    const container = containerRef.current;
    if (!container) return;

    const expedientData = {
      nama: user.nama_lengkap,
      jabatan: "EXPEDIENT INHABITANT",
      nomor_id: nomorId,
      exp: "VALID THRU FOREVER",
      foto_url: fotoUrl,
      qr_url: qrUrl,
    };

    // DYNAMIC IMPORT THREE.JS
    Promise.all([
      import("three"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
    ]).then(([THREE, { RoomEnvironment }, { RoundedBoxGeometry }]) => {
      if (isCancelled || !containerRef.current) return;

      const GOLD = "#d4af37";
      const PURE_GOLD = "#ffd700";
      const DARK_BG = "#050505";

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020202, 0.015);

      const isMobile =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));

      const camera = new THREE.PerspectiveCamera(
        isMobile ? 50 : 45,
        window.innerWidth / window.innerHeight,
        0.1,
        200
      );
      camera.position.set(0, 0, isMobile ? 24 : 28);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: true,
        powerPreference: "high-performance",
        precision: isMobile ? "mediump" : "highp",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = !isMobile;
      if (!isMobile) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      // Bersihkan container dari render sebelumnya jika ada
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();

      // LIGHTING
      const ambientLight = new THREE.AmbientLight(0xffffff, isMobile ? 1.0 : 0.8);
      scene.add(ambientLight);

      const spotLight = new THREE.SpotLight(0xffeedd, isMobile ? 90 : 120);
      spotLight.position.set(10, 30, 25);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.8;
      if (!isMobile) {
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.bias = -0.0001;
      }
      scene.add(spotLight);

      const rimLight = new THREE.PointLight(PURE_GOLD, isMobile ? 45 : 60, 40);
      rimLight.position.set(-10, -5, 10);
      scene.add(rimLight);

      let mouseLight: THREE_TYPES.PointLight | null = null;
      if (!isMobile) {
        mouseLight = new THREE.PointLight(0xffd700, 50, 40);
        mouseLight.position.set(0, 0, 5);
        scene.add(mouseLight);
      }

      let cardGlowLight: THREE_TYPES.PointLight | null = null;
      if (!isMobile) {
        cardGlowLight = new THREE.PointLight(0xd4af37, 25, 20);
        scene.add(cardGlowLight);
      }

      // AMBIENT DUST PARTICLES
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = isMobile ? 40 : 180;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i += 3) {
        dustPos[i] = (Math.random() - 0.5) * 40;
        dustPos[i + 1] = (Math.random() - 0.5) * 40;
        dustPos[i + 2] = (Math.random() - 0.5) * 20;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        size: isMobile ? 0.08 : 0.05,
        color: 0xd4af37,
        transparent: true,
        opacity: isMobile ? 0.3 : 0.5,
        blending: THREE.AdditiveBlending,
      });
      const dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);

      // MARBLE BACKGROUND
      function createSeamlessMarbleTexture(isDayMode: boolean) {
        const canvas = document.createElement("canvas");
        const size = isMobile ? 512 : 2048;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        const baseGrad = ctx.createLinearGradient(0, 0, size, size);
        if (isDayMode) {
          baseGrad.addColorStop(0, "#f8f9fa");
          baseGrad.addColorStop(0.5, "#ffffff");
          baseGrad.addColorStop(1, "#e9ecef");
        } else {
          baseGrad.addColorStop(0, "#080a0d");
          baseGrad.addColorStop(0.5, "#030304");
          baseGrad.addColorStop(1, "#000000");
        }
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = isDayMode ? "#d4af37" : PURE_GOLD;
        ctx.lineWidth = isDayMode ? (isMobile ? 2 : 4) : (isMobile ? 3 : 6);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const veinCount = isMobile ? 6 : 15;
        for (let i = 0; i < veinCount; i++) {
          ctx.beginPath();
          let x = Math.random() * size,
            y = Math.random() * size;
          ctx.moveTo(x, y);
          for (let j = 0; j < (isMobile ? 6 : 12); j++) {
            x += (Math.random() - 0.5) * (isMobile ? 200 : 500);
            y += Math.random() * (isMobile ? 120 : 300);
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      }

      const marbleGroup = new THREE.Group();
      marbleGroup.position.set(0, 0, -10);

      const MarbleMatClass = isMobile ? THREE.MeshBasicMaterial : THREE.MeshPhysicalMaterial;

      const nightMarbleMat = new MarbleMatClass({
        map: createSeamlessMarbleTexture(false),
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        ...(isMobile
          ? {}
          : {
              metalness: 0.15,
              roughness: 0.1,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
            }),
      });
      const nightMarbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), nightMarbleMat);
      if (!isMobile) nightMarbleMesh.receiveShadow = true;
      marbleGroup.add(nightMarbleMesh);

      const dayMarbleMat = new MarbleMatClass({
        map: createSeamlessMarbleTexture(true),
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        ...(isMobile
          ? {}
          : {
              metalness: 0.1,
              roughness: 0.1,
              clearcoat: 1.0,
              clearcoatRoughness: 0.02,
            }),
      });
      const dayMarbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), dayMarbleMat);
      dayMarbleMesh.position.z = 0.1;
      if (!isMobile) dayMarbleMesh.receiveShadow = true;
      marbleGroup.add(dayMarbleMesh);
      scene.add(marbleGroup);

      // MOUNT HARDWARE (Lanyard Top Anchor)
      const anchorPos = new THREE.Vector3(0, 11, -6);
      const mountGroup = new THREE.Group();
      mountGroup.position.copy(anchorPos);

      const mountBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.8, 0.5, isMobile ? 16 : 64),
        new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1.0, roughness: 0.2 })
      );
      mountBase.rotation.x = Math.PI / 2;
      mountBase.position.z = -0.5;
      if (!isMobile) mountBase.receiveShadow = true;
      mountGroup.add(mountBase);

      const mountRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.12, isMobile ? 8 : 16, isMobile ? 16 : 32),
        new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1.0, roughness: 0.1 })
      );
      mountRing.rotation.y = Math.PI / 2;
      if (!isMobile) mountRing.castShadow = true;
      mountGroup.add(mountRing);
      scene.add(mountGroup);

      const lanyardMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.3,
      });

      // CANVAS TEXTURE GENERATOR FUNCTIONS
      function drawRealisticSmartChip(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
        isBump: boolean
      ) {
        if (!isBump) {
          const grad = ctx.createLinearGradient(x, y, x + w, y + h);
          grad.addColorStop(0, "#f9d976");
          grad.addColorStop(0.5, "#d4af37");
          grad.addColorStop(1, "#a67c00");
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = "#ffffff";
        }
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.strokeStyle = isBump ? "#000000" : "rgba(80,50,0,0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 6, w - 12, h - 12, r - 4);
        ctx.stroke();
        const cx = x + w / 2,
          cy = y + h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 6, cy - 15);
        ctx.lineTo(cx - w * 0.2, cy - 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 6, cy + 15);
        ctx.lineTo(cx - w * 0.2, cy + 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - 6, cy - 15);
        ctx.lineTo(cx + w * 0.2, cy - 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - 6, cy + 15);
        ctx.lineTo(cx + w * 0.2, cy + 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, y + 6);
        ctx.lineTo(cx, cy - h * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, y + h - 6);
        ctx.lineTo(cx, cy + h * 0.25);
        ctx.stroke();
      }

      function drawBrushedMetalMain(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.fillStyle = DARK_BG;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 0.03;
        for (let i = 0; i < w; i += 2) {
          ctx.fillStyle = Math.random() > 0.5 ? "#222222" : "#000000";
          ctx.fillRect(i, 0, 1, h);
        }
        ctx.globalAlpha = 1.0;
        const grd = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, w);
        grd.addColorStop(0, "transparent");
        grd.addColorStop(1, "rgba(0,0,0,0.9)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      function createFrontTexture(isBump = false) {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1624;
        const ctx = canvas.getContext("2d")!;

        if (isBump) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          drawBrushedMetalMain(ctx, canvas.width, canvas.height);
        }

        ctx.fillStyle = isBump ? "#888888" : GOLD;
        ctx.fillRect(40, 0, 12, canvas.height);
        ctx.fillRect(60, 0, 2, canvas.height);

        ctx.save();
        ctx.translate(140, 1500);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = isBump ? "#ffffff" : "rgba(212,175,55,0.15)";
        ctx.font = '900 130px "Playfair Display", serif';
        ctx.letterSpacing = "20px";
        ctx.fillText("EXPEDIENT", 0, 0);
        ctx.restore();

        drawRealisticSmartChip(ctx, 160, 160, 120, 100, 15, isBump);

        if (isBump) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(820, 200, 70, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(820, 200, 65, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
        } else {
          const hGrad = ctx.createLinearGradient(700, 100, 900, 300);
          hGrad.addColorStop(0, "#d4af37");
          hGrad.addColorStop(0.5, "#fff");
          hGrad.addColorStop(1, "#d4af37");
          ctx.fillStyle = hGrad;
          ctx.beginPath();
          ctx.arc(820, 200, 70, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = DARK_BG;
          ctx.beginPath();
          ctx.arc(820, 200, 65, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = GOLD;
        }
        ctx.font = 'bold 50px "Playfair Display", serif';
        ctx.textAlign = "center";
        ctx.fillText("VVIP", 820, 215);
        ctx.textAlign = "left";

        const photoX = 160,
          photoY = 400,
          photoW = 760,
          photoH = 650;
        ctx.strokeStyle = isBump ? "#888888" : "rgba(212,175,55,0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(photoX, photoY, photoW, photoH);

        if (!isBump) {
          const glass = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
          glass.addColorStop(0, "rgba(255,255,255,0.05)");
          glass.addColorStop(1, "rgba(0,0,0,0.5)");
          ctx.fillStyle = glass;
          ctx.fillRect(photoX, photoY, photoW, photoH);
        }

        ctx.strokeStyle = isBump ? "#ffffff" : GOLD;
        ctx.lineWidth = 4;
        const sz = 30;
        ctx.beginPath();
        ctx.moveTo(photoX, photoY + sz);
        ctx.lineTo(photoX, photoY);
        ctx.lineTo(photoX + sz, photoY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(photoX + photoW - sz, photoY);
        ctx.lineTo(photoX + photoW, photoY);
        ctx.lineTo(photoX + photoW, photoY + sz);
        ctx.stroke();

        if (!isBump) {
          ctx.fillStyle = "#1a2228";
          ctx.beginPath();
          ctx.arc(540, 650, 120, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(540, 1050, 280, Math.PI, 0);
          ctx.fill();
        }

        if (isBump) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 1;
        }
        ctx.fillStyle = "#ffffff";
        ctx.font = 'bold 65px "Playfair Display", serif';
        ctx.fillText(expedientData.nama.toUpperCase(), 160, 1180, 760);

        ctx.fillStyle = isBump ? "#ffffff" : GOLD;
        ctx.font = '600 30px "Inter", sans-serif';
        ctx.letterSpacing = "5px";
        ctx.fillText(expedientData.jabatan.toUpperCase(), 160, 1240, 760);

        if (isBump) ctx.shadowBlur = 0;
        ctx.fillStyle = isBump ? "#888888" : "rgba(212,175,55,0.3)";
        ctx.fillRect(160, 1300, 760, 2);

        if (isBump) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 1;
        }
        ctx.fillStyle = isBump ? "#ffffff" : "#8b9ba8";
        ctx.font = "400 28px monospace";
        ctx.letterSpacing = "2px";
        ctx.fillText("ID: " + expedientData.nomor_id, 160, 1380);
        ctx.fillText(expedientData.exp, 160, 1430);
        if (isBump) ctx.shadowBlur = 0;

        if (!isBump) {
          ctx.fillStyle = "#ffffff";
          for (let i = 0; i < 30; i++) {
            const bw = Math.random() * 8 + 2;
            ctx.fillRect(720 + i * 8, 1350, bw, 80);
          }
        }

        return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
      }

      function createBackTexture(isBump = false) {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1624;
        const ctx = canvas.getContext("2d")!;

        if (isBump) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          drawBrushedMetalMain(ctx, canvas.width, canvas.height);
        }

        ctx.fillStyle = isBump ? "#111111" : "#000000";
        ctx.fillRect(0, 150, 1024, 250);
        ctx.strokeStyle = isBump ? "#444444" : "#222";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 150, 1024, 250);

        if (isBump) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 1;
        }
        ctx.fillStyle = isBump ? "#ffffff" : GOLD;
        ctx.textAlign = "center";
        ctx.font = 'bold 45px "Playfair Display", serif';
        ctx.fillText("THE REGISTRY DIRECTIVE", 512, 550);
        if (isBump) ctx.shadowBlur = 0;

        ctx.fillStyle = isBump ? "#ffffff" : GOLD;
        ctx.fillRect(400, 580, 224, 2);

        ctx.fillStyle = isBump ? "#aaaaaa" : "#8b9ba8";
        ctx.font = '300 28px "Inter", sans-serif';
        const lines = [
          "Properti VVIP Eksklusif Expedient Generation.",
          "Kartu ini menyimpan data terenkripsi untuk",
          "akses tanpa batas ke dalam ekosistem The Vault.",
          "Penyalahgunaan akan dikenakan sanksi dewan.",
        ];
        lines.forEach((line, i) => ctx.fillText(line, 512, 680 + i * 45));

        ctx.strokeStyle = isBump ? "#ffffff" : GOLD;
        ctx.lineWidth = 8;
        ctx.strokeRect(342, 1030, 340, 340);
        ctx.fillStyle = isBump ? "#ffffff" : GOLD;
        ctx.fillRect(320, 1010, 40, 10);
        ctx.fillRect(320, 1010, 10, 40);

        ctx.fillStyle = isBump ? "#aaaaaa" : "#444";
        ctx.font = "400 20px monospace";
        ctx.fillText("SCAN FOR OMNIPRESENCE VERIFICATION", 512, 1420);

        return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
      }

      function createKTAFrontTexture(isBump = false) {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 640;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = isBump ? "#000000" : "#050505";
        ctx.fillRect(0, 0, 1024, 640);
        ctx.strokeStyle = isBump ? "#444444" : "#151515";
        ctx.lineWidth = 4;
        for (let i = -200; i < 1200; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 400, 640);
          ctx.stroke();
        }

        drawRealisticSmartChip(ctx, 100, 50, 100, 80, 10, isBump);

        if (isBump) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 1;
        }
        ctx.fillStyle = isBump ? "#ffffff" : "#d4af37";
        ctx.font = 'bold 36px "Playfair Display", serif';
        ctx.letterSpacing = "10px";
        ctx.fillText("EXPEDIENT", 100, 180);
        if (isBump) ctx.shadowBlur = 0;

        ctx.fillStyle = isBump ? "#aaaaaa" : "#666";
        ctx.font = "22px monospace";
        ctx.letterSpacing = "5px";
        ctx.fillText("VVIP ACCESS PLATINUM", 100, 230);

        if (!isBump) {
          ctx.fillStyle = "rgba(212,175,55,0.05)";
          ctx.beginPath();
          ctx.arc(800, 320, 250, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(800, 320, 245, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#222";
          ctx.beginPath();
          ctx.arc(800, 320, 250, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#555";
          ctx.beginPath();
          ctx.arc(800, 320, 245, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (isBump) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 1;
        }
        ctx.fillStyle = isBump ? "#ffffff" : "#ffffff";
        ctx.font = 'bold 45px "Inter", sans-serif';
        ctx.letterSpacing = "3px";
        ctx.fillText(expedientData.nama.toUpperCase(), 100, 530, 435);

        ctx.fillStyle = isBump ? "#ffffff" : "#d4af37";
        ctx.font = "30px monospace";
        ctx.fillText(expedientData.nomor_id, 100, 580, 435);
        if (isBump) ctx.shadowBlur = 0;

        return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
      }

      function createKTABackTexture(isBump = false) {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 640;
        const ctx = canvas.getContext("2d")!;

        if (isBump) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, 1024, 640);
        } else {
          drawBrushedMetalMain(ctx, 1024, 640);
        }

        ctx.fillStyle = isBump ? "#111111" : "#000000";
        ctx.fillRect(0, 100, 1024, 120);

        if (isBump) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 1;
        }
        ctx.fillStyle = isBump ? "#ffffff" : "#d4af37";
        ctx.font = 'bold 30px "Playfair Display", serif';
        ctx.textAlign = "left";
        ctx.fillText("THE VAULT AUTHORIZATION", 80, 320);
        if (isBump) ctx.shadowBlur = 0;

        ctx.fillStyle = isBump ? "#aaaaaa" : "#666";
        ctx.font = '22px "Inter", sans-serif';
        ctx.fillText("If found, return immediately to the Expedient Council.", 80, 380);
        ctx.fillText("Unauthorized use will be prosecuted.", 80, 420);

        return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
      }

      // =========================================================================
      // KALIBRASI UV TEXTURE 3D - PERBAIKAN BUG TERBALIK
      // Three.js CanvasTexture default flipY = true memetakan y=0 ke atas face 3D
      // repeat.set(1, 1) dan ClampToEdgeWrapping memastikan teks & gambar tidak mirror
      // =========================================================================
      function kalibrasiUV(texture: THREE_TYPES.CanvasTexture, isBump: boolean) {
        texture.flipY = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1);
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        if (!isBump) {
          texture.colorSpace = THREE.SRGBColorSpace;
        } else {
          texture.colorSpace = THREE.NoColorSpace || THREE.LinearSRGBColorSpace;
        }
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isMobile ? 2 : 16);
        return texture;
      }

      const texFront = createFrontTexture(false);
      const bumpFront = isMobile ? null : createFrontTexture(true);
      const texBack = createBackTexture(false);
      const bumpBack = isMobile ? null : createBackTexture(true);
      const kFrontTex = createKTAFrontTexture(false);
      const kFrontBump = isMobile ? null : createKTAFrontTexture(true);
      const kBackTex = createKTABackTexture(false);
      const kBackBump = isMobile ? null : createKTABackTexture(true);

      const cardMaterialProps = {
        roughness: 0.15,
        metalness: 0.6,
        clearcoat: isMobile ? 0.3 : 0.85,
        clearcoatRoughness: 0.1,
        iridescence: isMobile ? 0 : 0.8,
        iridescenceIOR: 1.5,
        iridescenceThicknessRange: [100, 400] as [number, number],
        bumpScale: 0.035,
      };

      const goldEdgeMaterial = new THREE.MeshStandardMaterial({
        color: PURE_GOLD,
        metalness: 1.0,
        roughness: 0.15,
      });

      const materials = [
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        new THREE.MeshPhysicalMaterial({
          map: texFront,
          ...(bumpFront ? { bumpMap: bumpFront } : {}),
          ...cardMaterialProps,
        }),
        new THREE.MeshPhysicalMaterial({
          map: texBack,
          ...(bumpBack ? { bumpMap: bumpBack } : {}),
          ...cardMaterialProps,
        }),
      ];

      // ID CARD VERTIKAL
      const cardWidth = 5.4,
        cardHeight = 8.6,
        cardDepth = 0.12;
      const idCardGeo = new RoundedBoxGeometry(
        cardWidth,
        cardHeight,
        cardDepth,
        isMobile ? 8 : 24,
        0.3
      );
      const idCard = new THREE.Mesh(idCardGeo, materials);
      idCard.position.set(0, 10, 0);
      if (!isMobile) idCard.castShadow = true;
      scene.add(idCard);

      const clipGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, isMobile ? 12 : 32);
      clipGeo.rotateZ(Math.PI / 2);
      const clipMat = new THREE.MeshStandardMaterial({
        color: PURE_GOLD,
        metalness: 1.0,
        roughness: 0.2,
      });
      const metalClip = new THREE.Mesh(clipGeo, clipMat);
      metalClip.position.set(0, cardHeight / 2 + 0.1, 0);
      if (!isMobile) metalClip.castShadow = true;
      idCard.add(metalClip);

      const stringLength = 11.5;
      const restPos = new THREE.Vector3(0, anchorPos.y - stringLength, 0);
      let lanyardMesh: THREE_TYPES.Mesh | null = null;

      function updateLanyardGeometry() {
        const clipGlobalPos = new THREE.Vector3(0, cardHeight / 2 + 0.3, 0);
        idCard.localToWorld(clipGlobalPos);
        const dist = anchorPos.distanceTo(clipGlobalPos);
        const sag = Math.max(0, stringLength - dist) * 0.5;

        const control1 = new THREE.Vector3(
          anchorPos.x,
          anchorPos.y - stringLength * 0.3 - sag,
          anchorPos.z - 1
        );
        const control2 = new THREE.Vector3(
          clipGlobalPos.x,
          clipGlobalPos.y + stringLength * 0.3 + sag,
          clipGlobalPos.z - 1
        );
        const curve = new THREE.CubicBezierCurve3(anchorPos, control1, control2, clipGlobalPos);
        const tubeGeo = new THREE.TubeGeometry(
          curve,
          isMobile ? 8 : 40,
          0.12,
          isMobile ? 3 : 8,
          false
        );
        if (lanyardMesh) {
          lanyardMesh.geometry.dispose();
          lanyardMesh.geometry = tubeGeo;
        } else {
          lanyardMesh = new THREE.Mesh(tubeGeo, lanyardMat);
          if (!isMobile) lanyardMesh.castShadow = true;
          scene.add(lanyardMesh);
        }
      }
      updateLanyardGeometry();

      // KTA CARD HORIZONTAL
      const ktaWidth = 5.4,
        ktaHeight = 3.4,
        ktaDepth = 0.08;
      const ktaGeo = new RoundedBoxGeometry(
        ktaWidth,
        ktaHeight,
        ktaDepth,
        isMobile ? 8 : 24,
        0.3
      );
      const ktaFrontMat = new THREE.MeshPhysicalMaterial({
        map: kFrontTex,
        ...(kFrontBump ? { bumpMap: kFrontBump } : {}),
        ...cardMaterialProps,
        roughness: 0.1,
        metalness: 0.6,
      });
      const ktaBackMat = new THREE.MeshPhysicalMaterial({
        map: kBackTex,
        ...(kBackBump ? { bumpMap: kBackBump } : {}),
        ...cardMaterialProps,
        roughness: 0.2,
        metalness: 0.8,
      });
      const ktaMatArray = [
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        ktaFrontMat,
        ktaBackMat,
      ];
      const ktaMesh = new THREE.Mesh(ktaGeo, ktaMatArray);
      if (!isMobile) ktaMesh.castShadow = true;
      scene.add(ktaMesh);

      const ktaRestPos = new THREE.Vector3();
      if (window.innerWidth < 768) {
        ktaRestPos.set(-4, -5, -4);
      } else {
        ktaRestPos.set(-8, 0, -2);
      }
      ktaMesh.position.copy(ktaRestPos);

      // ASYNC IMAGE INJECTION (AVATAR & QR CODE)
      const qrImg = new Image();
      qrImg.crossOrigin = "Anonymous";
      qrImg.src = qrUrl;

      let profileImg: HTMLImageElement | null = null;
      if (fotoUrl) {
        profileImg = new Image();
        profileImg.crossOrigin = "Anonymous";
        profileImg.src = fotoUrl;
      }

      Promise.all([
        new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = resolve;
        }),
        profileImg
          ? new Promise((resolve) => {
              profileImg!.onload = resolve;
              profileImg!.onerror = resolve;
            })
          : Promise.resolve(),
      ]).then(() => {
        if (qrImg) {
          if (texBack?.image) {
            const ctxBack = (texBack.image as HTMLCanvasElement).getContext("2d")!;
            ctxBack.drawImage(qrImg, 352, 1040, 320, 320);
            texBack.needsUpdate = true;
          }
          if (kBackTex?.image) {
            const ctxKta = (kBackTex.image as HTMLCanvasElement).getContext("2d")!;
            ctxKta.drawImage(qrImg, 750, 320, 200, 200);
            kBackTex.needsUpdate = true;
          }
        }

        if (profileImg) {
          if (texFront?.image) {
            const ctxFront = (texFront.image as HTMLCanvasElement).getContext("2d")!;
            const photoX = 160,
              photoY = 400,
              photoW = 760,
              photoH = 650;
            ctxFront.save();
            ctxFront.beginPath();
            ctxFront.rect(photoX, photoY, photoW, photoH);
            ctxFront.clip();
            const scale = Math.max(photoW / profileImg.width, photoH / profileImg.height);
            const drawW = profileImg.width * scale,
              drawH = profileImg.height * scale;
            const drawX = photoX + (photoW - drawW) / 2,
              drawY = photoY + (photoH - drawH) / 2;
            ctxFront.drawImage(profileImg, drawX, drawY, drawW, drawH);
            const glass = ctxFront.createLinearGradient(
              photoX,
              photoY,
              photoX + photoW,
              photoY + photoH
            );
            glass.addColorStop(0, "rgba(255,255,255,0.05)");
            glass.addColorStop(1, "rgba(0,0,0,0.5)");
            ctxFront.fillStyle = glass;
            ctxFront.fillRect(photoX, photoY, photoW, photoH);
            ctxFront.restore();
            ctxFront.strokeStyle = GOLD;
            ctxFront.lineWidth = 4;
            const sz2 = 30;
            ctxFront.beginPath();
            ctxFront.moveTo(photoX, photoY + sz2);
            ctxFront.lineTo(photoX, photoY);
            ctxFront.lineTo(photoX + sz2, photoY);
            ctxFront.stroke();
            ctxFront.beginPath();
            ctxFront.moveTo(photoX + photoW - sz2, photoY);
            ctxFront.lineTo(photoX + photoW, photoY);
            ctxFront.lineTo(photoX + photoW, photoY + sz2);
            ctxFront.stroke();
            texFront.needsUpdate = true;
          }
          if (kFrontTex?.image) {
            const ctxKta = (kFrontTex.image as HTMLCanvasElement).getContext("2d")!;
            ctxKta.save();
            ctxKta.beginPath();
            ctxKta.arc(800, 320, 245, 0, Math.PI * 2);
            ctxKta.clip();
            const targetSize = 500;
            const scaleKta = Math.max(
              targetSize / profileImg.width,
              targetSize / profileImg.height
            );
            const drawWKta = profileImg.width * scaleKta,
              drawHKta = profileImg.height * scaleKta;
            const drawXKta = 800 - drawWKta / 2,
              drawYKta = 320 - drawHKta / 2;
            ctxKta.drawImage(profileImg, drawXKta, drawYKta, drawWKta, drawHKta);
            ctxKta.lineWidth = 4;
            ctxKta.strokeStyle = "rgba(212,175,55,0.5)";
            ctxKta.beginPath();
            ctxKta.arc(800, 320, 245, 0, Math.PI * 2);
            ctxKta.stroke();
            ctxKta.restore();
            kFrontTex.needsUpdate = true;
          }
        }

        setTimeout(() => {
          const loader = document.getElementById("preloader");
          if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
              loader.style.display = "none";
            }, 800);
          }
        }, 500);
      });

      // INTERACTION / KINEMATICS
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let targetCameraX = 0,
        targetCameraY = 0;
      let isKtaActive = false;
      const ktaViewPos = new THREE.Vector3(0, 0, 16);
      let ktaTargetRotX = 0,
        ktaTargetRotY = 0,
        ktaDragDist = 0;
      let isMainActive = false;
      const mainViewPos = new THREE.Vector3(0, 0, 16);
      let mainTargetRotX = 0,
        mainTargetRotY = 0;
      let lastClickTime = 0;
      let isDragging = false,
        hasInteracted = false;
      let targetPos = new THREE.Vector3().copy(restPos);
      let targetRotY = 0,
        targetRotX = 0,
        targetRotZ = 0;
      let velocity = new THREE.Vector3(0, 0, 0);
      const springK = 0.08,
        damping = 0.82;
      let previousMouse = { x: 0, y: 0 };
      let globalCursorX = 0,
        globalCursorY = 0;

      function updateMouseRaycast(event: MouseEvent | TouchEvent) {
        const rect = container!.getBoundingClientRect();
        let clientX = (event as MouseEvent).clientX ?? 0;
        let clientY = (event as MouseEvent).clientY ?? 0;
        if ((event as TouchEvent).touches && (event as TouchEvent).touches.length > 0) {
          clientX = (event as TouchEvent).touches[0].clientX;
          clientY = (event as TouchEvent).touches[0].clientY;
        }
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        return { cx: clientX, cy: clientY };
      }

      function updateFocusState() {
        const baseDensity = isLightMode ? 0.008 : 0.015;
        (scene.fog as THREE_TYPES.FogExp2).density =
          isKtaActive || isMainActive ? baseDensity + 0.02 : baseDensity;
      }

      function toggleKTA() {
        isKtaActive = !isKtaActive;
        if (isKtaActive) {
          ktaTargetRotX = 0;
          ktaTargetRotY = 0;
        }
        updateFocusState();
      }

      function toggleMainCard() {
        isMainActive = !isMainActive;
        if (isMainActive) {
          mainTargetRotX = 0;
          let currentRotY = idCard.rotation.y % (Math.PI * 2);
          if (currentRotY > Math.PI) currentRotY -= Math.PI * 2;
          if (currentRotY < -Math.PI) currentRotY += Math.PI * 2;
          mainTargetRotY = currentRotY;
        } else {
          velocity.set(0, 0, 0);
          targetRotY = 0;
        }
        updateFocusState();
      }

      const onClickHandler = (event: MouseEvent) => {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastClickTime;
        const isDoubleClick = timeDiff < 300 && timeDiff > 0;
        lastClickTime = currentTime;

        if (isDragging && !isKtaActive && !isMainActive) return;
        if (isKtaActive && ktaDragDist < 5 && !isDoubleClick) {
          toggleKTA();
          return;
        }
        if (isMainActive && ktaDragDist < 5 && !isDoubleClick) {
          toggleMainCard();
          return;
        }
        if (isDoubleClick && isMainActive) {
          toggleMainCard();
          return;
        }

        updateMouseRaycast(event);

        if (isDoubleClick && !isKtaActive && !isMainActive) {
          const intersectsMain = raycaster.intersectObject(idCard, true);
          if (intersectsMain.length > 0) {
            toggleMainCard();
            return;
          }
        }

        const intersects = raycaster.intersectObject(ktaMesh);
        if (intersects.length > 0 && !isKtaActive && !isMainActive && !isDoubleClick) {
          toggleKTA();
          const overlay = document.getElementById("uxOverlay");
          if (overlay) overlay.classList.add("hidden");
        }
      };
      container.addEventListener("click", onClickHandler);

      function onPointerDown(event: MouseEvent | TouchEvent) {
        ktaDragDist = 0;
        const coords = updateMouseRaycast(event);
        if (isKtaActive || isMainActive) {
          isDragging = true;
          document.body.classList.add("is-grabbing");
          previousMouse = { x: coords.cx, y: coords.cy };
          return;
        }
        if (raycaster.intersectObject(ktaMesh).length > 0) return;
        isDragging = true;
        document.body.classList.add("is-grabbing");
        if (!hasInteracted) {
          const overlay = document.getElementById("uxOverlay");
          if (overlay) overlay.classList.add("hidden");
          hasInteracted = true;
        }
        previousMouse = { x: coords.cx, y: coords.cy };
      }

      function onPointerMove(event: MouseEvent | TouchEvent) {
        const rect = container!.getBoundingClientRect();
        let cx = (event as MouseEvent).clientX ?? 0;
        let cy = (event as MouseEvent).clientY ?? 0;
        if ((event as TouchEvent).touches && (event as TouchEvent).touches.length > 0) {
          cx = (event as TouchEvent).touches[0].clientX;
          cy = (event as TouchEvent).touches[0].clientY;
        }
        const normX = ((cx - rect.left) / rect.width) * 2 - 1;
        const normY = -((cy - rect.top) / rect.height) * 2 + 1;
        globalCursorX = normX;
        globalCursorY = normY;
        targetCameraX = normX * 2;
        targetCameraY = normY * 2;

        if (isDragging)
          ktaDragDist += Math.abs(cx - previousMouse.x) + Math.abs(cy - previousMouse.y);

        if (isKtaActive && isDragging) {
          ktaTargetRotY += (cx - previousMouse.x) * 0.01;
          ktaTargetRotX += (cy - previousMouse.y) * 0.01;
          previousMouse = { x: cx, y: cy };
          return;
        }
        if (isMainActive && isDragging) {
          mainTargetRotY += (cx - previousMouse.x) * 0.01;
          mainTargetRotX += (cy - previousMouse.y) * 0.01;
          previousMouse = { x: cx, y: cy };
          return;
        }
        if (!isDragging || isKtaActive || isMainActive) return;
        targetPos.x = normX * 14;
        targetPos.y = normY * 14;
        targetPos.z = 3;
        targetRotY += (cx - previousMouse.x) * 0.015;
        previousMouse = { x: cx, y: cy };
      }

      function onPointerUp() {
        if (isDragging) {
          isDragging = false;
          document.body.classList.remove("is-grabbing");
          if (!isKtaActive && !isMainActive) targetPos.copy(restPos);
        }
      }

      container.addEventListener("mousedown", onPointerDown as EventListener);
      window.addEventListener("mousemove", onPointerMove as EventListener);
      window.addEventListener("mouseup", onPointerUp);
      container.addEventListener("touchstart", onPointerDown as EventListener, { passive: false });
      window.addEventListener("touchmove", onPointerMove as EventListener, { passive: false });
      window.addEventListener("touchend", onPointerUp);

      // GYROSCOPE
      let baseBeta: number | null = null,
        baseGamma: number | null = null;
      const onDeviceOrientation = (event: DeviceOrientationEvent) => {
        if (!event.beta || !event.gamma) return;
        if (baseBeta === null) baseBeta = event.beta;
        if (baseGamma === null) baseGamma = event.gamma;
        let diffBeta = Math.max(-45, Math.min(45, event.beta - baseBeta));
        let diffGamma = Math.max(-45, Math.min(45, event.gamma - baseGamma));
        globalCursorX = diffGamma / 45;
        globalCursorY = diffBeta / 45;
        targetCameraX = globalCursorX * 2.5;
        targetCameraY = globalCursorY * 2.5;
      };
      window.addEventListener("deviceorientation", onDeviceOrientation, true);

      // RENDER LOOP
      let animId: number | null = null;
      let lastCardPos = new THREE.Vector3();
      let lastLanyardUpdate = 0;

      function animate() {
        animId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        const targetDayOpacity = isLightMode ? 1.0 : 0.0;
        if (dayMarbleMat.opacity !== targetDayOpacity) {
          dayMarbleMat.opacity += (targetDayOpacity - dayMarbleMat.opacity) * 0.05;
          if (Math.abs(targetDayOpacity - dayMarbleMat.opacity) < 0.01)
            dayMarbleMat.opacity = targetDayOpacity;
        }

        if (!isMobile && mouseLight) {
          raycaster.setFromCamera(new THREE.Vector2(globalCursorX, globalCursorY), camera);
          const wallIntersects = raycaster.intersectObject(nightMarbleMesh);
          if (wallIntersects.length > 0) {
            mouseLight.position.x += (wallIntersects[0].point.x - mouseLight.position.x) * 0.1;
            mouseLight.position.y += (wallIntersects[0].point.y - mouseLight.position.y) * 0.1;
          }
          mouseLight.intensity = isLightMode ? 20 : 50;
          mouseLight.color.setHex(isLightMode ? 0xffffff : 0xffd700);
        }

        dustParticles.rotation.y += 0.0005;
        dustParticles.rotation.x += 0.0002;

        if (!isMainActive && !isKtaActive) {
          camera.position.x += (targetCameraX - camera.position.x) * 0.05;
          camera.position.y += (targetCameraY - camera.position.y) * 0.05;
          camera.lookAt(0, 0, 0);
          marbleGroup.position.x = -(camera.position.x * 0.05);
          marbleGroup.position.y = -(camera.position.y * 0.05);
          if (!isDragging) {
            targetRotY = globalCursorX * 0.4;
            targetRotX = -(globalCursorY * 0.4);
          }
        } else {
          camera.position.x += (0 - camera.position.x) * 0.1;
          camera.position.y += (0 - camera.position.y) * 0.1;
          camera.lookAt(0, 0, 0);
          marbleGroup.position.lerp(new THREE.Vector3(0, 0, -10), 0.05);
        }

        if (isMainActive) {
          idCard.position.lerp(mainViewPos, 0.08);
          const targetQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(mainTargetRotX, mainTargetRotY, 0)
          );
          idCard.quaternion.slerp(targetQuat, 0.1);
        } else {
          const force = new THREE.Vector3()
            .subVectors(targetPos, idCard.position)
            .multiplyScalar(springK);
          velocity.add(force);
          velocity.multiplyScalar(damping);
          idCard.position.add(velocity);
          idCard.rotation.x += (targetRotX - idCard.rotation.x) * 0.1;
          idCard.rotation.y += (targetRotY - idCard.rotation.y) * 0.1;
          idCard.rotation.z += (targetRotZ - idCard.rotation.z) * 0.2;
        }

        if (!isMobile && cardGlowLight) {
          cardGlowLight.position.copy(idCard.position);
          cardGlowLight.position.z -= 1;
          const glowIntensity = Math.max(0, 30 - idCard.position.z * 5);
          cardGlowLight.intensity = isLightMode ? 0 : glowIntensity;
        }

        if (isKtaActive) {
          ktaMesh.position.lerp(ktaViewPos, 0.08);
          const targetQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(ktaTargetRotX, ktaTargetRotY, 0)
          );
          ktaMesh.quaternion.slerp(targetQuat, 0.1);
        } else {
          const floatTime = time * 1.2;
          const floatY = Math.sin(floatTime) * 0.4;
          ktaMesh.position.lerp(
            new THREE.Vector3(ktaRestPos.x, ktaRestPos.y + floatY, ktaRestPos.z),
            0.1
          );
          const ktaParallaxX = -(globalCursorY * 0.2);
          const ktaParallaxY = globalCursorX * 0.3;
          const floatRotZ = Math.cos(floatTime * 0.8) * 0.05;
          ktaMesh.rotation.y += (ktaParallaxY + 0.008 - ktaMesh.rotation.y) * 0.1;
          ktaMesh.rotation.x += (ktaParallaxX + 0.2 - ktaMesh.rotation.x) * 0.1;
          ktaMesh.rotation.z += (floatRotZ - ktaMesh.rotation.z) * 0.05;
        }

        const now = performance.now();
        const distSq = idCard.position.distanceToSquared(lastCardPos);
        const lanyardInterval = isMobile ? 50 : 16;
        const minMoveThreshold = isMobile ? 0.02 : 0.0001;
        if ((isDragging || distSq > minMoveThreshold) && now - lastLanyardUpdate > lanyardInterval) {
          updateLanyardGeometry();
          lastCardPos.copy(idCard.position);
          lastLanyardUpdate = now;
        }

        renderer.render(scene, camera);
      }
      animate();

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.fov = window.innerWidth < 768 ? 50 : 45;
        if (window.innerWidth < 768) {
          ktaRestPos.set(-4, -5, -4);
        } else {
          ktaRestPos.set(-8, 0, -2);
        }
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
      };
      window.addEventListener("resize", onResize);

      // Cleanup registration
      cleanupFn = () => {
        isCancelled = true;
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onPointerMove as EventListener);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchmove", onPointerMove as EventListener);
        window.removeEventListener("touchend", onPointerUp);
        window.removeEventListener("deviceorientation", onDeviceOrientation, true);
        if (container) {
          container.removeEventListener("click", onClickHandler);
          container.removeEventListener("mousedown", onPointerDown as EventListener);
          container.removeEventListener("touchstart", onPointerDown as EventListener);
        }
        renderer.dispose();
        if (container && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [viewMode, user, nomorId, fotoUrl, qrUrl, isLightMode]);

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        background: isLightMode ? "#f8f9fa" : "#020202",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        fontFamily: "'Inter', sans-serif",
        userSelect: "none",
        transition: "background 0.5s ease",
      }}
    >
      {/* ========================================================================= */}
      {/* PRELOADER INITIAL                                                         */}
      {/* ========================================================================= */}
      <div
        id="preloader"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "#020202",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transition: "opacity 0.8s ease",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "2px solid rgba(212,175,55,0.1)",
            borderTopColor: "#ffd700",
            borderRadius: "50%",
            animation: "spinLoader 1s linear infinite",
            marginBottom: 20,
            boxShadow: "0 0 20px rgba(212,175,55,0.2)",
          }}
        />
        <span
          id="loadingText"
          style={{
            color: "#ffd700",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 4,
            fontSize: 11,
            textShadow: "0 0 10px rgba(212,175,55,0.5)",
          }}
        >
          DECRYPTING OMNIPRESENCE...
        </span>
      </div>

      {/* Vignette Background */}
      <div
        className="vault-vignette"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 11,
          background: isLightMode
            ? "radial-gradient(circle at center, transparent 10%, rgba(255,255,255,0.6) 100%)"
            : "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.9) 100%)",
          transition: "background 0.5s ease",
        }}
      />

      {/* ========================================================================= */}
      {/* HEADER NAVIGASI & CONTROLS                                                */}
      {/* ========================================================================= */}
      {/* Back Button */}
      <Link
        href="/fitur"
        id="btnBackToFitur"
        style={{
          position: "absolute",
          top: "max(16px, env(safe-area-inset-top, 16px))",
          left: "max(16px, env(safe-area-inset-left, 16px))",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: isLightMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.65)",
          border: "1px solid rgba(212,175,55,0.4)",
          borderRadius: 20,
          color: isLightMode ? "#111" : "#d4af37",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          textDecoration: "none",
          textTransform: "uppercase",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        }}
      >
        <i className="fa-solid fa-chevron-left" /> Kembali
      </Link>

      {/* CENTER ENGINE MODE SWITCHER PILL */}
      <div
        style={{
          position: "absolute",
          top: "max(16px, env(safe-area-inset-top, 16px))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: isLightMode ? "rgba(255,255,255,0.9)" : "rgba(10,12,16,0.8)",
          padding: "4px 6px",
          borderRadius: 30,
          border: "1px solid rgba(212,175,55,0.4)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.4), 0 0 15px rgba(212,175,55,0.15)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Tombol Mode Super Ringan */}
        <button
          onClick={() => handleSelectMode("lite")}
          title="Mode Super Ringan (0% Lag WebGL, 60 FPS CSS 3D)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 20,
            border: "none",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: "pointer",
            transition: "all 0.3s ease",
            background:
              viewMode === "lite"
                ? "linear-gradient(135deg, #d4af37, #f3e5ab)"
                : "transparent",
            color: viewMode === "lite" ? "#000" : isLightMode ? "#666" : "#94a3b8",
            boxShadow: viewMode === "lite" ? "0 2px 10px rgba(212,175,55,0.4)" : "none",
          }}
        >
          <i className="fa-solid fa-bolt" />
          <span>Super Ringan</span>
        </button>

        {/* Tombol Mode 3D Studio */}
        <button
          onClick={() => handleSelectMode("3d")}
          title="Mode 3D Studio Three.js (Fisika Tali & Galeri)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 20,
            border: "none",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: "pointer",
            transition: "all 0.3s ease",
            background:
              viewMode === "3d"
                ? "linear-gradient(135deg, #d4af37, #f3e5ab)"
                : "transparent",
            color: viewMode === "3d" ? "#000" : isLightMode ? "#666" : "#94a3b8",
            boxShadow: viewMode === "3d" ? "0 2px 10px rgba(212,175,55,0.4)" : "none",
          }}
        >
          <i className="fa-solid fa-cube" />
          <span>3D Studio</span>
        </button>

        {/* Tombol Buka Modal Pilihan Mode (Khusus Mobile atau Fleksibel) */}
        {isMobileDevice && (
          <button
            onClick={() => setShowMobileChoiceModal(true)}
            title="Buka Pilihan Mode Tampilan"
            style={{
              padding: "6px 8px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(212,175,55,0.15)",
              color: "#d4af37",
              fontSize: 11,
              cursor: "pointer",
              marginLeft: 2,
            }}
          >
            <i className="fa-solid fa-sliders" />
          </button>
        )}
      </div>

      {/* Right Controls: Theme Toggle & Export PNG */}
      <div
        style={{
          position: "absolute",
          top: "max(16px, env(safe-area-inset-top, 16px))",
          right: "max(16px, env(safe-area-inset-right, 16px))",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          id="btnThemeToggle"
          title="Ganti Tema Siang/Malam"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: isLightMode ? "#ffffff" : "rgba(0,0,0,0.6)",
            border: "1px solid rgba(212,175,55,0.4)",
            color: isLightMode ? "#b48600" : "#d4af37",
            fontSize: 15,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
          }}
        >
          <i className={isLightMode ? "fa-solid fa-moon" : "fa-solid fa-sun"} />
        </button>

        <button
          onClick={handleExportPng}
          id="btnExportId"
          disabled={isExporting}
          title="Simpan Kartu ID (PNG HD)"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: isLightMode ? "#ffffff" : "rgba(0,0,0,0.6)",
            border: "1px solid rgba(212,175,55,0.4)",
            color: isLightMode ? "#b48600" : "#d4af37",
            fontSize: 15,
            cursor: isExporting ? "wait" : "pointer",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            opacity: isExporting ? 0.6 : 1,
          }}
        >
          <i className={isExporting ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-download"} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE SUPER RINGAN (SERINGAN-RINGANNYA: CSS 3D HOLOGRAPHIC CARD)           */}
      {/* ========================================================================= */}
      {viewMode === "lite" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1200,
            padding: "20px",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Format Switcher (ID Card Vertikal vs KTA Horizontal) */}
          <div
            style={{
              position: "absolute",
              top: "max(68px, calc(env(safe-area-inset-top, 16px) + 54px))",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isLightMode ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
              padding: "4px",
              borderRadius: 20,
              border: "1px solid rgba(212,175,55,0.25)",
              zIndex: 30,
            }}
          >
            <button
              onClick={() => setCardFormat("id")}
              style={{
                padding: "4px 12px",
                borderRadius: 14,
                border: "none",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                background: cardFormat === "id" ? "#d4af37" : "transparent",
                color: cardFormat === "id" ? "#000" : isLightMode ? "#666" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              ID Card Vertikal
            </button>
            <button
              onClick={() => setCardFormat("kta")}
              style={{
                padding: "4px 12px",
                borderRadius: 14,
                border: "none",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                background: cardFormat === "kta" ? "#d4af37" : "transparent",
                color: cardFormat === "kta" ? "#000" : isLightMode ? "#666" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              KTA Horizontal
            </button>
          </div>

          {/* Lanyard Strap Header (CSS ID Card Only) */}
          {cardFormat === "id" && (
            <div
              style={{
                position: "absolute",
                top: 0,
                width: 32,
                height: "calc(50vh - 200px)",
                minHeight: 60,
                background: "linear-gradient(180deg, #111 0%, #1a1a1a 80%, #333 100%)",
                borderInline: "1px solid rgba(212,175,55,0.4)",
                boxShadow: "0 0 15px rgba(0,0,0,0.6)",
                zIndex: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 16,
                  background: "linear-gradient(135deg, #ffd700, #d4af37, #996515)",
                  borderRadius: 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          )}

          {/* Kartu 3D Interaktif */}
          <div
            ref={cardRef}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              position: "relative",
              width: cardFormat === "id" ? "min(310px, 82vw)" : "min(350px, 90vw)",
              aspectRatio: cardFormat === "id" ? "54 / 86" : "85.6 / 54",
              transformStyle: "preserve-3d",
              transition: isDraggingCard.current
                ? "none"
                : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
              transform: `rotateY(${isFlipped ? 180 + tilt.x : tilt.x}deg) rotateX(${tilt.y}deg)`,
              cursor: "pointer",
              touchAction: "none",
            }}
          >
            {/* ================= MUKA DEPAN (FRONT FACE) ================= */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                background: isLightMode
                  ? "linear-gradient(135deg, #ffffff 0%, #f4f6f9 50%, #e9ecef 100%)"
                  : "linear-gradient(135deg, #181c24 0%, #0a0c10 50%, #121620 100%)",
                border: "1.5px solid rgba(212,175,55,0.45)",
                boxShadow: isLightMode
                  ? "0 20px 40px rgba(0,0,0,0.1), inset 0 0 20px rgba(212,175,55,0.08)"
                  : "0 25px 50px rgba(0,0,0,0.85), inset 0 0 25px rgba(212,175,55,0.12)",
                backfaceVisibility: "hidden",
                overflow: "hidden",
                padding: cardFormat === "id" ? "20px 18px" : "18px 22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Dynamic Holographic Glare Sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: `radial-gradient(circle 350px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,215,0,0.22) 0%, rgba(255,255,255,0.08) 25%, transparent 65%)`,
                  mixBlendMode: isLightMode ? "multiply" : "screen",
                }}
              />

              {cardFormat === "id" ? (
                /* ID BADGE FRONT */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div
                      style={{
                        width: 44,
                        height: 34,
                        borderRadius: 6,
                        background: "linear-gradient(135deg, #f9d976 0%, #d4af37 50%, #a67c00 100%)",
                        border: "1px solid #ffeaa7",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: "3px",
                          border: "1px solid rgba(0,0,0,0.3)",
                          borderRadius: 3,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          right: 0,
                          height: 1,
                          background: "rgba(0,0,0,0.3)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: "50%",
                          width: 1,
                          background: "rgba(0,0,0,0.3)",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: isLightMode ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.1)",
                        border: "1px solid rgba(212,175,55,0.4)",
                      }}
                    >
                      <i className="fa-solid fa-crown" style={{ color: "#d4af37", fontSize: 10 }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: 1 }}>
                        VVIP
                      </span>
                    </div>
                  </div>

                  {/* Foto Anggota */}
                  <div
                    style={{
                      alignSelf: "center",
                      width: "60%",
                      aspectRatio: "1/1",
                      maxHeight: 180,
                      borderRadius: 16,
                      border: "2px solid rgba(212,175,55,0.6)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                      overflow: "hidden",
                      background: "#1a1f2c",
                      position: "relative",
                      margin: "12px 0 8px",
                    }}
                  >
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={user.nama_lengkap}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 48,
                          fontWeight: 800,
                          color: "#d4af37",
                        }}
                      >
                        {user.nama_lengkap.charAt(0)}
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        insetInline: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                        padding: "4px",
                        textAlign: "center",
                        fontSize: 9,
                        letterSpacing: 2,
                        color: "#ffd700",
                        fontWeight: 700,
                      }}
                    >
                      EXPEDIENT 43
                    </div>
                  </div>

                  {/* Detail Nama & ID */}
                  <div style={{ textAlign: "center" }}>
                    <h2
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(16px, 4.5vw, 20px)",
                        fontWeight: 800,
                        color: isLightMode ? "#111" : "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        margin: "0 0 2px",
                        lineHeight: 1.2,
                      }}
                    >
                      {user.nama_lengkap}
                    </h2>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 3,
                        color: "#d4af37",
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      EXPEDIENT INHABITANT
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "4px 14px",
                        borderRadius: 8,
                        background: isLightMode ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: isLightMode ? "#222" : "#e2e8f0",
                      }}
                    >
                      <span>
                        ID: <strong style={{ color: "#d4af37" }}>{nomorId}</strong>
                      </span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>ACTIVE</span>
                    </div>
                  </div>

                  {/* Barcode Simulation */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 2,
                      opacity: isLightMode ? 0.7 : 0.5,
                      marginTop: 4,
                    }}
                  >
                    {[6, 2, 4, 1, 8, 3, 2, 6, 1, 4, 3, 8, 2, 5, 2, 6, 4, 1, 3, 8, 5, 2, 4].map(
                      (w, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: w,
                            height: 22,
                            background: isLightMode ? "#000" : "#d4af37",
                          }}
                        />
                      )
                    )}
                  </div>
                </>
              ) : (
                /* KTA HORIZONTAL FRONT */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 36,
                          borderRadius: 6,
                          background: "linear-gradient(135deg, #f9d976 0%, #d4af37 50%, #a67c00 100%)",
                          border: "1px solid #ffeaa7",
                        }}
                      />
                      <i
                        className="fa-solid fa-wifi"
                        style={{ color: "#d4af37", fontSize: 18, transform: "rotate(90deg)" }}
                      />
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: 2,
                          color: "#d4af37",
                        }}
                      >
                        EXPEDIENT
                      </div>
                      <div style={{ fontSize: 9, letterSpacing: 3, opacity: 0.6 }}>SOVEREIGN</div>
                    </div>
                  </div>

                  {/* Card Embossed Number */}
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "clamp(15px, 4.5vw, 19px)",
                      letterSpacing: 3,
                      color: isLightMode ? "#111" : "#fff",
                      textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                      margin: "14px 0",
                    }}
                  >
                    4300 •••• •••• <span style={{ color: "#d4af37" }}>{nomorId.replace("EXP-", "")}</span>
                  </div>

                  {/* Bottom Details */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: "#d4af37", textTransform: "uppercase" }}>
                        CARDHOLDER
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isLightMode ? "#111" : "#ffffff",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {user.nama_lengkap}
                      </div>
                      <div style={{ fontSize: 9, color: isLightMode ? "#666" : "#94a3b8", marginTop: 2 }}>
                        VALID: FOREVER
                      </div>
                    </div>

                    {fotoUrl && (
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: "50%",
                          border: "2px solid #d4af37",
                          overflow: "hidden",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                        }}
                      >
                        <img
                          src={fotoUrl}
                          alt="Avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ================= MUKA BELAKANG (BACK FACE) ================= */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                background: isLightMode
                  ? "linear-gradient(135deg, #f8f9fa 0%, #edf0f5 100%)"
                  : "linear-gradient(135deg, #0e1117 0%, #06080b 100%)",
                border: "1.5px solid rgba(212,175,55,0.4)",
                boxShadow: isLightMode
                  ? "0 20px 40px rgba(0,0,0,0.1)"
                  : "0 25px 50px rgba(0,0,0,0.85)",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                overflow: "hidden",
                padding: cardFormat === "id" ? "0 0 16px" : "0 0 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Magnetic Stripe */}
              <div
                style={{
                  width: "100%",
                  height: cardFormat === "id" ? 42 : 36,
                  marginTop: cardFormat === "id" ? 28 : 18,
                  background: "linear-gradient(180deg, #111 0%, #000 100%)",
                  boxShadow: "inset 0 1px 3px rgba(255,255,255,0.1)",
                }}
              />

              {/* Content Back */}
              <div
                style={{
                  padding: "10px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  flex: 1,
                  justifyContent: "space-around",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#d4af37",
                      letterSpacing: 2,
                      marginBottom: 4,
                    }}
                  >
                    THE VAULT AUTHORIZATION
                  </div>
                  <p
                    style={{
                      fontSize: 9,
                      lineHeight: 1.4,
                      color: isLightMode ? "#555" : "#94a3b8",
                      margin: 0,
                      maxWidth: 240,
                    }}
                  >
                    Credential ini adalah bukti keabsahan sah alumni Expedient Generation 43.
                    Penggunaan tanpa hak akan diproses sesuai statuta kehormatan.
                  </p>
                </div>

                {/* QR Code Container */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQrModal(true);
                  }}
                  style={{
                    padding: 8,
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <img
                    src={qrUrl}
                    alt="QR Verification"
                    style={{
                      width: cardFormat === "id" ? 95 : 75,
                      height: cardFormat === "id" ? 95 : 75,
                      display: "block",
                    }}
                  />
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#000", letterSpacing: 1 }}>
                    KETUK UNTUK PERBESAR
                  </span>
                </div>

                {/* Signature Strip */}
                <div
                  style={{
                    width: "80%",
                    height: 28,
                    background: isLightMode ? "#e2e8f0" : "#ffffff",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#000",
                    border: "1px dashed rgba(212,175,55,0.6)",
                  }}
                >
                  {user.nama_panggilan || user.nama_lengkap}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Floating Bar */}
          <div
            style={{
              position: "absolute",
              bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isLightMode ? "rgba(255,255,255,0.9)" : "rgba(18,22,30,0.85)",
              padding: "6px 12px",
              borderRadius: 30,
              border: "1px solid rgba(212,175,55,0.3)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              backdropFilter: "blur(14px)",
            }}
          >
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 20,
                border: "none",
                background: "rgba(212,175,55,0.15)",
                color: "#d4af37",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <i className="fa-solid fa-repeat" />
              <span>{isFlipped ? "Muka Depan" : "Muka Belakang"}</span>
            </button>

            <button
              onClick={handleCopyId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 20,
                border: "none",
                background: copiedId ? "#10b981" : "rgba(212,175,55,0.15)",
                color: copiedId ? "#fff" : "#d4af37",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <i className={copiedId ? "fa-solid fa-check" : "fa-solid fa-copy"} />
              <span>{copiedId ? "Tersalin!" : "Salin ID"}</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 20,
                border: "none",
                background: "rgba(212,175,55,0.15)",
                color: "#d4af37",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <i className="fa-solid fa-qrcode" />
              <span>QR Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3D STUDIO (THREE.JS CANVAS VIEW)                                     */}
      {/* ========================================================================= */}
      {viewMode === "3d" && (
        <>
          {/* Tactical HUD */}
          <div
            className="tactical-hud"
            style={{
              position: "absolute",
              bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
              left: "max(24px, env(safe-area-inset-left, 24px))",
              zIndex: 15,
              color: isLightMode ? "#333" : "rgba(212,175,55,0.7)",
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              letterSpacing: 1,
              lineHeight: 1.6,
              pointerEvents: "none",
              textShadow: isLightMode ? "none" : "0 0 10px #000",
            }}
          >
            EXPEDIENT 43 • 3D STUDIO ACTIVE<br />
            STATUS: [SOVEREIGN VERIFIED]<br />
            ANGGOTA: [{(user.nama_panggilan || user.nama_lengkap).toUpperCase()}]
          </div>

          {/* UX Interaction Overlay */}
          <div
            id="uxOverlay"
            style={{
              position: "absolute",
              bottom: "max(28px, env(safe-area-inset-bottom, 28px))",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              zIndex: 20,
              pointerEvents: "none",
              transition: "opacity 0.8s ease",
            }}
          >
            <i
              className="fa-solid fa-hand-pointer ux-icon"
              style={{
                color: "#d4af37",
                fontSize: 20,
                filter: "drop-shadow(0 0 10px rgba(212,175,55,0.6))",
              }}
            />
            <span
              className="ux-text"
              style={{
                color: isLightMode ? "#222" : "#d4af37",
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 3,
                textShadow: isLightMode ? "none" : "0 0 10px #000",
                textAlign: "center",
              }}
            >
              Tarik Kartu &amp; Usap Layar
            </span>
          </div>

          {/* Canvas Three.js Container */}
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 10,
              outline: "none",
              pointerEvents: "auto",
              touchAction: "none",
            }}
          />
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL PILIHAN MODE (KHUSUS MOBILE PADA SAAT MASUK HALAMAN)               */}
      {/* ========================================================================= */}
      {showMobileChoiceModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
            animation: "fadeInModal 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              background: "linear-gradient(180deg, #131720 0%, #0a0d13 100%)",
              border: "1.5px solid rgba(212,175,55,0.5)",
              borderRadius: 24,
              padding: "24px 20px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.2)",
              color: "#fff",
              position: "relative",
            }}
          >
            {/* Header Modal */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "rgba(212,175,55,0.15)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  fontSize: 10,
                  color: "#d4af37",
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                <i className="fa-solid fa-mobile-screen-button" />
                Khusus Tampilan HP
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: "0 0 6px",
                  letterSpacing: 1,
                }}
              >
                PILIH VERSI TAMPILAN
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Pilih versi KTA digital yang paling sesuai dan nyaman untuk perangkat HP Anda:
              </p>
            </div>

            {/* Dua Pilihan Mode */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              {/* Opsi 1: Mode Super Ringan (Seringan-ringannya) */}
              <div
                onClick={() => handleSelectMode("lite")}
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(20,24,32,0.85) 100%)",
                  border: "1.5px solid rgba(212,175,55,0.6)",
                  borderRadius: 18,
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ffd700, #d4af37)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#000",
                        fontSize: 16,
                        fontWeight: 900,
                      }}
                    >
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>
                        Versi Super Ringan
                      </div>
                      <div style={{ fontSize: 10, color: "#ffd700", fontWeight: 700 }}>
                        SERINGAN-RINGANNYA (60 FPS)
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: "#10b981",
                      color: "#fff",
                      fontWeight: 800,
                      letterSpacing: 1,
                    }}
                  >
                    DIREKOMENDASIKAN
                  </span>
                </div>

                <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                  0% beban WebGL. Menggunakan kartu holografik CSS 3D, bebas lag 100%, lancar jaya di
                  semua HP, sangat hemat baterai.
                </p>

                <button
                  style={{
                    alignSelf: "flex-end",
                    padding: "6px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #d4af37, #f3e5ab)",
                    color: "#000",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1,
                    cursor: "pointer",
                  }}
                >
                  Pilih Versi Ini →
                </button>
              </div>

              {/* Opsi 2: Mode 3D Studio Fisika (Sudah Diperbaiki Tidak Terbalik) */}
              <div
                onClick={() => handleSelectMode("3d")}
                style={{
                  background: "linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.85) 100%)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 18,
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(212,175,55,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#d4af37",
                        fontSize: 15,
                      }}
                    >
                      ✦
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>
                        Versi 3D Studio
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        SIMULASI 3D TALI &amp; GALERI
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: "rgba(212,175,55,0.2)",
                      color: "#d4af37",
                      fontWeight: 800,
                      border: "1px solid rgba(212,175,55,0.4)",
                    }}
                  >
                    TELAH DIPERBAIKI
                  </span>
                </div>

                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                  Simulasi 3D Three.js asli lengkap dengan tali lanyard fisik &amp; pencahayaan galeri.
                  Orientasi kartu yang sebelumnya terbalik kini sudah tegak &amp; normal.
                </p>

                <button
                  style={{
                    alignSelf: "flex-end",
                    padding: "6px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(212,175,55,0.4)",
                    background: "rgba(212,175,55,0.1)",
                    color: "#d4af37",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    cursor: "pointer",
                  }}
                >
                  Pilih Versi 3D →
                </button>
              </div>
            </div>

            {/* Note & Close */}
            <div
              style={{
                textAlign: "center",
                fontSize: 10,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              💡 <em>Anda dapat beralih mode kapan saja lewat tombol di bagian atas layar.</em>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN QR CODE MODAL                                                  */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isLightMode ? "#ffffff" : "#0d1117",
              border: "2px solid #d4af37",
              borderRadius: 24,
              padding: "32px 24px",
              maxWidth: 340,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.25)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 800,
                color: isLightMode ? "#111" : "#ffffff",
                margin: "0 0 4px",
              }}
            >
              SCAN VERIFIKASI
            </h3>
            <p style={{ fontSize: 11, color: "#d4af37", letterSpacing: 2, marginBottom: 20 }}>
              EXPEDIENT GENERATION 43
            </p>

            <div
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 16,
                display: "inline-block",
                boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                marginBottom: 16,
              }}
            >
              <img src={qrUrl} alt="QR Big" style={{ width: 200, height: 200, display: "block" }} />
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: isLightMode ? "#111" : "#fff",
                marginBottom: 4,
              }}
            >
              {user.nama_lengkap}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: "#d4af37",
                marginBottom: 24,
              }}
            >
              {nomorId}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #d4af37, #f3e5ab)",
                color: "#000",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Global CSS Styles */}
      <style>{`
        body.page-sovereign .film-grain,
        body.page-sovereign .aurora-container,
        body.page-sovereign #particles-js,
        body.page-sovereign .cursor-dot,
        body.page-sovereign .cursor-ring {
          display: none !important;
        }
        body.page-sovereign {
          overflow: hidden !important;
        }

        @keyframes spinLoader {
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        body.is-grabbing { cursor: grabbing !important; }
        #uxOverlay.hidden { opacity: 0 !important; }
        #btnThemeToggle:hover { transform: scale(1.1) rotate(15deg); box-shadow: 0 0 20px rgba(212,175,55,0.5); }
        #btnExportId:hover { transform: scale(1.1) translateY(2px); box-shadow: 0 0 20px rgba(212,175,55,0.5); }
        #btnBackToFitur:hover { transform: translateX(-3px); box-shadow: 0 0 20px rgba(212,175,55,0.5); border-color: #ffd700; color: #fff; }
        
        /* TEMA SIANG */
        :root[data-theme='light'] body.page-sovereign { background-color: #f8f9fa !important; }
        :root[data-theme='light'] body.page-sovereign .vault-vignette { background: radial-gradient(circle at center, transparent 10%, rgba(255,255,255,0.6) 100%) !important; }
        :root[data-theme='light'] body.page-sovereign .tactical-hud, 
        :root[data-theme='light'] body.page-sovereign .ux-text { color: #222 !important; text-shadow: 0 0 5px rgba(255,255,255,0.8) !important; }
        :root[data-theme='light'] body.page-sovereign .ux-icon { filter: drop-shadow(0 0 10px rgba(0,0,0,0.2)) !important; color: #b48600 !important; }
      `}</style>
    </div>
  );
}
