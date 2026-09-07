"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
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

  // Mode: 'lite' (60 FPS CSS3D Holographic - Bebas Lag) vs '3d' (Three.js Studio)
  const [viewMode, setViewMode] = useState<"lite" | "3d">("lite");
  const [cardFormat, setCardFormat] = useState<"id" | "kta">("id");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const isDragging = useRef(false);
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

  // Inisialisasi Deteksi Mobile & Mode Tersimpan
  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));

    const savedMode = localStorage.getItem("sovereign_view_mode") as "lite" | "3d" | null;
    if (savedMode === "lite" || savedMode === "3d") {
      setViewMode(savedMode);
    } else {
      // Default ke Mode Ringan (Lite 60 FPS) pada mobile agar TIDAK NGELAG sama sekali di HP spek rendah
      setViewMode(isMobile ? "lite" : "3d");
    }

    document.body.classList.add("page-sovereign");
    return () => {
      document.body.classList.remove("page-sovereign");
    };
  }, []);

  // Update theme attribute on root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isLightMode ? "light" : "dark");
  }, [isLightMode]);

  // Mode switcher handler
  const handleSwitchMode = (mode: "lite" | "3d") => {
    setViewMode(mode);
    localStorage.setItem("sovereign_view_mode", mode);
  };

  // Salin Nomor ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(nomorId);
    setCopiedId(true);
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // -------------------------------------------------------------
  // HIGH-RESOLUTION PNG EXPORT GENERATOR (2400 x 1800)
  // -------------------------------------------------------------
  const handleExportPng = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const compCanvas = document.createElement("canvas");
      const ctx = compCanvas.getContext("2d")!;
      compCanvas.width = 2400;
      compCanvas.height = 1800;

      // Background Luxury Obsidian / Day
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

      const [avatarImg, qrImg] = await Promise.all([loadImage(fotoUrl), loadImage(qrUrl)]);

      // Helper Draw Card Plate
      const drawCardPlate = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 35;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 20;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fillStyle = isLightMode ? "#ffffff" : "#0d1117";
        ctx.fill();

        ctx.strokeStyle = "rgba(212,175,55,0.6)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      };

      // 1. ID CARD VERTIKAL (FRONT) - x=180, y=420, w=580, h=920
      const idW = 580, idH = 920, idX = 180, idY = 420;
      drawCardPlate(idX, idY, idW, idH, 40);

      // Gold vertical strip
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(idX + 24, idY, 8, idH);

      // Text Brand Rotated
      ctx.save();
      ctx.translate(idX + 80, idY + idH - 60);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(212,175,55,0.2)";
      ctx.font = '900 70px "Playfair Display", serif';
      ctx.fillText("EXPEDIENT", 0, 0);
      ctx.restore();

      // Chip
      ctx.fillStyle = "#d4af37";
      ctx.beginPath(); ctx.roundRect(idX + 100, idY + 80, 80, 60, 10); ctx.fill();
      ctx.strokeStyle = "#8a6d1c"; ctx.stroke();

      // VVIP Circle
      ctx.fillStyle = "#d4af37";
      ctx.beginPath(); ctx.arc(idX + idW - 80, idY + 110, 45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0d1117";
      ctx.beginPath(); ctx.arc(idX + idW - 80, idY + 110, 41, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d4af37";
      ctx.font = 'bold 22px "Playfair Display", serif';
      ctx.textAlign = "center";
      ctx.fillText("VVIP", idX + idW - 80, idY + 118);

      // Photo
      const pX = idX + 100, pY = idY + 200, pW = idW - 180, pH = 380;
      ctx.save();
      ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, 16); ctx.clip();
      if (avatarImg) {
        ctx.drawImage(avatarImg, pX, pY, pW, pH);
      } else {
        ctx.fillStyle = "#1e293b"; ctx.fillRect(pX, pY, pW, pH);
        ctx.fillStyle = "#d4af37"; ctx.font = "bold 80px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(user.nama_lengkap.charAt(0), pX + pW / 2, pY + pH / 2 + 30);
      }
      ctx.restore();
      ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, 16); ctx.stroke();

      // Name & ID
      ctx.textAlign = "left";
      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 36px "Playfair Display", serif';
      ctx.fillText(user.nama_lengkap.toUpperCase(), pX, idY + 640, pW);

      ctx.fillStyle = "#d4af37";
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.letterSpacing = "3px";
      ctx.fillText("EXPEDIENT INHABITANT", pX, idY + 675);

      ctx.fillStyle = isLightMode ? "#444" : "#94a3b8";
      ctx.font = "bold 22px monospace";
      ctx.fillText(nomorId, pX, idY + 740);
      ctx.font = "16px monospace";
      ctx.fillText("VALID THRU FOREVER", pX, idY + 775);

      // 2. ID CARD VERTIKAL (BACK) - x=840, y=420, w=580, h=920
      const bX = 840, bY = 420;
      drawCardPlate(bX, bY, idW, idH, 40);

      // Magnetic Stripe
      ctx.fillStyle = "#050505";
      ctx.fillRect(bX, bY + 70, idW, 90);

      // Authorization Text
      ctx.textAlign = "center";
      ctx.fillStyle = isLightMode ? "#b48600" : "#d4af37";
      ctx.font = 'bold 24px "Playfair Display", serif';
      ctx.fillText("THE SOVEREIGN AUTHORIZATION", bX + idW / 2, bY + 230);

      ctx.fillStyle = isLightMode ? "#666" : "#94a3b8";
      ctx.font = '14px "Inter", sans-serif';
      ctx.fillText("This credential certifies verified cohort affiliation.", bX + idW / 2, bY + 270);
      ctx.fillText("Authorized exclusively for Expedient Generation 43.", bX + idW / 2, bY + 295);

      // QR Code
      const qrBoxX = bX + (idW - 240) / 2, qrBoxY = bY + 360;
      if (qrImg) {
        ctx.drawImage(qrImg, qrBoxX, qrBoxY, 240, 240);
        ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 3;
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

      // Chip & Brand
      ctx.fillStyle = "#d4af37";
      ctx.beginPath(); ctx.roundRect(kX + 60, kY + 60, 90, 70, 10); ctx.fill();

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
        ctx.beginPath(); ctx.arc(kX + kW - 110, kY + 310, 70, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(avatarImg, kX + kW - 180, kY + 240, 140, 140);
        ctx.restore();
        ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(kX + kW - 110, kY + 310, 70, 0, Math.PI * 2); ctx.stroke();
      }

      // 4. KTA HORIZONTAL (BACK) - x=1500, y=900, w=720, h=440
      const kbY = 900;
      drawCardPlate(kX, kbY, kW, kH, 30);

      ctx.fillStyle = "#050505";
      ctx.fillRect(kX, kbY + 50, kW, 70);

      // QR Code on KTA Back
      if (qrImg) {
        ctx.drawImage(qrImg, kX + 60, kbY + 160, 160, 160);
      }

      ctx.textAlign = "left";
      ctx.fillStyle = isLightMode ? "#b48600" : "#d4af37";
      ctx.font = 'bold 20px "Playfair Display", serif';
      ctx.fillText("OFFICIAL COHORT PASS", kX + 250, kbY + 190);

      ctx.fillStyle = isLightMode ? "#555" : "#94a3b8";
      ctx.font = '13px "Inter", sans-serif';
      ctx.fillText("Unauthorized duplicate is strictly prohibited.", kX + 250, kbY + 225);
      ctx.fillText("Property of Expedient 43 Autonomous Organization.", kX + 250, kbY + 250);

      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`TOKEN: ${qrToken.substring(0, 16).toUpperCase()}`, kX + 250, kbY + 300);

      // Download trigger
      const dataURL = compCanvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `KTA_Sovereign_${user.nama_lengkap.replace(/\s+/g, "_")}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (navigator.vibrate) navigator.vibrate(60);
    } catch (err) {
      console.error("[Export PNG Error]", err);
    } finally {
      setIsExporting(false);
    }
  }, [user, fotoUrl, qrUrl, nomorId, qrToken, isLightMode, isExporting]);

  // -------------------------------------------------------------
  // INTERAKTIF TOUCH & DRAG 3D CARD TILT (CSS COMPOSITE LAYER)
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (relX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (relY / rect.height) * 100));

    // Tilt angle limited to ±12deg for elegance
    const normX = (percentX - 50) / 50;
    const normY = (percentY - 50) / 50;
    const rotY = normX * 12;
    const rotX = -normY * 12;

    setTilt({
      x: rotY,
      y: rotX,
      glareX: percentX,
      glareY: percentY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
    // Jika hanya klik ringan (bukan drag), balik kartu
    if (dist < 10) {
      setIsFlipped((prev) => !prev);
      if (navigator.vibrate) navigator.vibrate(30);
    }
    isDragging.current = false;
    setTilt((prev) => ({ ...prev, x: 0, y: 0 }));
  };

  // -------------------------------------------------------------
  // THREE.JS STUDIO RUNNER (HANYA AKTIF SAAT MODE === '3D')
  // -------------------------------------------------------------
  useEffect(() => {
    if (viewMode !== "3d") return;

    let cleanupThree: (() => void) | null = null;
    let isCancelled = false;

    Promise.all([
      import("three"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
    ]).then(([THREE, { RoomEnvironment }, { RoundedBoxGeometry }]) => {
      if (isCancelled || !containerRef.current) return;
      const container = containerRef.current;

      const GOLD = "#d4af37";
      const PURE_GOLD = "#ffd700";
      const DARK_BG = "#050505";

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020202, 0.015);

      const isMobile = window.innerWidth < 768;

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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 2));
      renderer.shadowMap.enabled = !isMobile;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, isMobile ? 1.0 : 0.8);
      scene.add(ambientLight);

      const spotLight = new THREE.SpotLight(0xffeedd, isMobile ? 90 : 120);
      spotLight.position.set(10, 30, 25);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.8;
      scene.add(spotLight);

      const rimLight = new THREE.PointLight(PURE_GOLD, isMobile ? 45 : 60, 40);
      rimLight.position.set(-10, -5, 10);
      scene.add(rimLight);

      // Materials & Meshes
      const CardMatClass = isMobile ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
      const goldEdgeMaterial = new THREE.MeshStandardMaterial({ color: PURE_GOLD, metalness: 1.0, roughness: 0.15 });

      // ID Card Mesh Simple Placeholder / Canvas Textures
      const cardWidth = 5.4, cardHeight = 8.6, cardDepth = 0.12;
      const idCardGeo = new RoundedBoxGeometry(cardWidth, cardHeight, cardDepth, isMobile ? 8 : 24, 0.3);

      const makeCardTexture = (isBack = false) => {
        const c = document.createElement("canvas");
        c.width = 1024; c.height = 1624;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = DARK_BG; ctx.fillRect(0, 0, 1024, 1624);
        ctx.fillStyle = GOLD; ctx.fillRect(40, 0, 12, 1624);
        ctx.fillStyle = "#d4af37";
        ctx.font = 'bold 45px "Playfair Display", serif';
        ctx.fillText(isBack ? "SOVEREIGN REGISTRY" : user.nama_lengkap.toUpperCase(), 100, 1180, 760);
        ctx.font = "28px monospace";
        ctx.fillText(nomorId, 100, 1300);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };

      const frontTex = makeCardTexture(false);
      const backTex = makeCardTexture(true);

      const cardMatFront = new CardMatClass({ map: frontTex, roughness: 0.2, metalness: 0.6 });
      const cardMatBack = new CardMatClass({ map: backTex, roughness: 0.2, metalness: 0.6 });
      const materials = [goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, cardMatFront, cardMatBack];

      const idCard = new THREE.Mesh(idCardGeo, materials);
      idCard.position.set(0, 0, 0);
      scene.add(idCard);

      // Render Loop
      let animId: number | null = null;
      let rotSpeedY = 0.005;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        idCard.rotation.y += rotSpeedY;
        renderer.render(scene, camera);
      };
      animate();

      // Interaction
      let isCardDragging = false;
      let prevMouseX = 0;
      const onDown = (e: MouseEvent | TouchEvent) => {
        isCardDragging = true;
        rotSpeedY = 0;
        prevMouseX = "touches" in e ? e.touches[0].clientX : e.clientX;
      };
      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!isCardDragging) return;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const delta = clientX - prevMouseX;
        idCard.rotation.y += delta * 0.01;
        prevMouseX = clientX;
      };
      const onUp = () => {
        isCardDragging = false;
        rotSpeedY = 0.005;
      };

      container.addEventListener("mousedown", onDown as EventListener);
      window.addEventListener("mousemove", onMove as EventListener);
      window.addEventListener("mouseup", onUp);
      container.addEventListener("touchstart", onDown as EventListener, { passive: true });
      window.addEventListener("touchmove", onMove as EventListener, { passive: true });
      window.addEventListener("touchend", onUp);

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      cleanupThree = () => {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        container.removeEventListener("mousedown", onDown as EventListener);
        window.removeEventListener("mousemove", onMove as EventListener);
        window.removeEventListener("mouseup", onUp);
        container.removeEventListener("touchstart", onDown as EventListener);
        window.removeEventListener("touchmove", onMove as EventListener);
        window.removeEventListener("touchend", onUp);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      isCancelled = true;
      if (cleanupThree) cleanupThree();
    };
  }, [viewMode, user, nomorId]);

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        background: isLightMode ? "#f4f5f8" : "#020202",
        color: isLightMode ? "#111" : "#fff",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        fontFamily: "'Inter', sans-serif",
        userSelect: "none",
        transition: "background 0.5s ease",
      }}
    >
      {/* Background Decorative Grid & Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isLightMode
            ? "radial-gradient(circle at 50% 30%, rgba(212,175,55,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle at 50% 30%, rgba(212,175,55,0.12) 0%, transparent 80%), radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.95) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ========================================================================= */}
      {/* TOP HEADER CONTROLS (RESPONSIVE & TOUCH-FRIENDLY)                         */}
      {/* ========================================================================= */}
      <header
        style={{
          position: "absolute",
          top: "max(14px, env(safe-area-inset-top, 14px))",
          left: "max(14px, env(safe-area-inset-left, 14px))",
          right: "max(14px, env(safe-area-inset-right, 14px))",
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Tombol Kembali */}
        <Link
          href="/fitur"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: isLightMode ? "rgba(255,255,255,0.85)" : "rgba(10,12,16,0.8)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 10,
            color: "#d4af37",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2,
            textDecoration: "none",
            textTransform: "uppercase",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}
          id="btnBackToFitur"
        >
          <i className="fa-solid fa-chevron-left" />
          <span>Fitur</span>
        </Link>

        {/* Engine Switcher Pill (Ringan 60FPS vs 3D Studio) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: isLightMode ? "rgba(0,0,0,0.06)" : "rgba(20,24,32,0.8)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 30,
            padding: "3px",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={() => handleSwitchMode("lite")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 25,
              border: "none",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: viewMode === "lite" ? "linear-gradient(135deg, #d4af37, #f3e5ab)" : "transparent",
              color: viewMode === "lite" ? "#000" : isLightMode ? "#555" : "#94a3b8",
              boxShadow: viewMode === "lite" ? "0 2px 10px rgba(212,175,55,0.4)" : "none",
            }}
          >
            <i className="fa-solid fa-bolt" />
            <span>60 FPS</span>
          </button>
          <button
            onClick={() => handleSwitchMode("3d")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 25,
              border: "none",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: viewMode === "3d" ? "linear-gradient(135deg, #d4af37, #f3e5ab)" : "transparent",
              color: viewMode === "3d" ? "#000" : isLightMode ? "#555" : "#94a3b8",
              boxShadow: viewMode === "3d" ? "0 2px 10px rgba(212,175,55,0.4)" : "none",
            }}
          >
            <i className="fa-solid fa-cube" />
            <span>3D Studio</span>
          </button>
        </div>

        {/* Right Tools (Theme Toggle & Download) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Tema"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: isLightMode ? "rgba(255,255,255,0.9)" : "rgba(15,18,24,0.8)",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#d4af37",
              fontSize: 14,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}
          >
            <i className={isLightMode ? "fa-solid fa-moon" : "fa-solid fa-sun"} />
          </button>

          <button
            onClick={handleExportPng}
            disabled={isExporting}
            title="Unduh KTA HD (PNG)"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: isLightMode ? "rgba(255,255,255,0.9)" : "rgba(15,18,24,0.8)",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#d4af37",
              fontSize: 14,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}
          >
            {isExporting ? (
              <i className="fa-solid fa-spinner fa-spin" />
            ) : (
              <i className="fa-solid fa-download" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MODE RINGAN (ULTRA SMOOTH 60 FPS CSS3D HOLOGRAPHIC CARD)                 */}
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
            paddingTop: "max(65px, env(safe-area-inset-top, 65px))",
            paddingBottom: "max(85px, env(safe-area-inset-bottom, 85px))",
          }}
        >
          {/* Card Format Switcher Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              background: isLightMode ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)",
              padding: "4px 6px",
              borderRadius: 20,
              border: "1px solid rgba(212,175,55,0.2)",
            }}
          >
            <button
              onClick={() => { setCardFormat("id"); setIsFlipped(false); }}
              style={{
                padding: "6px 14px",
                borderRadius: 16,
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: cardFormat === "id" ? "rgba(212,175,55,0.2)" : "transparent",
                color: cardFormat === "id" ? "#d4af37" : isLightMode ? "#777" : "#999",
                transition: "all 0.2s ease",
              }}
            >
              <i className="fa-solid fa-id-badge" style={{ marginRight: 6 }} />
              ID Badge Vertikal
            </button>
            <button
              onClick={() => { setCardFormat("kta"); setIsFlipped(false); }}
              style={{
                padding: "6px 14px",
                borderRadius: 16,
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: cardFormat === "kta" ? "rgba(212,175,55,0.2)" : "transparent",
                color: cardFormat === "kta" ? "#d4af37" : isLightMode ? "#777" : "#999",
                transition: "all 0.2s ease",
              }}
            >
              <i className="fa-solid fa-credit-card" style={{ marginRight: 6 }} />
              KTA Horizontal
            </button>
          </div>

          {/* Lanyard Top Fixture (Khusus Format ID Badge) */}
          {cardFormat === "id" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: -6,
                zIndex: 15,
              }}
            >
              {/* Strap Hitam */}
              <div
                style={{
                  width: 24,
                  height: 35,
                  background: "linear-gradient(90deg, #111 0%, #222 50%, #111 100%)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                  borderLeft: "1px solid rgba(212,175,55,0.4)",
                  borderRight: "1px solid rgba(212,175,55,0.4)",
                }}
              />
              {/* Klip Logam Emas */}
              <div
                style={{
                  width: 38,
                  height: 14,
                  background: "linear-gradient(180deg, #f9d976 0%, #d4af37 50%, #a67c00 100%)",
                  borderRadius: 4,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                  border: "1px solid #ffe89e",
                }}
              />
            </div>
          )}

          {/* 3D Perspective Stage Container */}
          <div
            style={{
              perspective: "1200px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              maxWidth: 420,
              padding: "0 16px",
            }}
          >
            {/* The Flipping & Tilting Card Frame */}
            <div
              ref={cardRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                position: "relative",
                width: cardFormat === "id" ? "min(310px, 82vw)" : "min(350px, 90vw)",
                aspectRatio: cardFormat === "id" ? "54 / 86" : "85.6 / 54",
                transformStyle: "preserve-3d",
                transition: isDragging.current ? "none" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
                transform: `rotateY(${isFlipped ? 180 + tilt.x : tilt.x}deg) rotateX(${tilt.y}deg)`,
                cursor: "pointer",
                touchAction: "none",
              }}
            >
              {/* ============================================================= */}
              {/* MUKA DEPAN (FRONT FACE)                                       */}
              {/* ============================================================= */}
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
                {/* Holographic Dynamic Glare Sweep */}
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
                  /* ================= ID BADGE FRONT ================= */
                  <>
                    {/* Header Bar: Chip & VVIP Seal */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {/* Smart Chip Gold */}
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
                        <div style={{ position: "absolute", inset: "3px", border: "1px solid rgba(0,0,0,0.3)", borderRadius: 3 }} />
                        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.3)" }} />
                        <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "rgba(0,0,0,0.3)" }} />
                      </div>

                      {/* VVIP Stamp Badge */}
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
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: 1 }}>VVIP</span>
                      </div>
                    </div>

                    {/* Member Photo Frame */}
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

                    {/* Member Identity & Details */}
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

                      {/* ID Number & Expiry Badge */}
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
                        <span>ID: <strong style={{ color: "#d4af37" }}>{nomorId}</strong></span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>ACTIVE</span>
                      </div>
                    </div>

                    {/* Bottom Security Barcode Simulation */}
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
                      {[6, 2, 4, 1, 8, 3, 2, 6, 1, 4, 3, 8, 2, 5, 2, 6, 4, 1, 3, 8, 5, 2, 4].map((w, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: w,
                            height: 22,
                            background: isLightMode ? "#000" : "#d4af37",
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  /* ================= KTA HORIZONTAL FRONT ================= */
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Chip Gold */}
                        <div
                          style={{
                            width: 48,
                            height: 36,
                            borderRadius: 6,
                            background: "linear-gradient(135deg, #f9d976 0%, #d4af37 50%, #a67c00 100%)",
                            border: "1px solid #ffeaa7",
                          }}
                        />
                        {/* Contactless Waves */}
                        <i className="fa-solid fa-wifi" style={{ color: "#d4af37", fontSize: 18, transform: "rotate(90deg)" }} />
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

                    {/* Bottom Details (Name & Photo Pill) */}
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
                          <img src={fotoUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ============================================================= */}
              {/* MUKA BELAKANG (BACK FACE)                                     */}
              {/* ============================================================= */}
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

                  {/* QR Code Container with Gold Corners */}
                  <div
                    onClick={(e) => { e.stopPropagation(); setShowQrModal(true); }}
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
                      style={{ width: cardFormat === "id" ? 95 : 75, height: cardFormat === "id" ? 95 : 75, display: "block" }}
                    />
                    <span style={{ fontSize: 8, fontWeight: 700, color: "#000", letterSpacing: 1 }}>
                      KETUK UNTUK PERBESAR
                    </span>
                  </div>

                  {/* Signature Strip */}
                  <div
                    style={{
                      width: "90%",
                      padding: "6px 12px",
                      background: isLightMode ? "#e2e8f0" : "#ffffff",
                      borderRadius: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: "italic",
                        fontSize: 12,
                        color: "#111",
                        fontWeight: 700,
                      }}
                    >
                      {user.nama_panggilan || user.nama_lengkap}
                    </span>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "#666" }}>
                      SEC-43
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hint Balik Kartu */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: isLightMode ? "#666" : "rgba(212,175,55,0.7)",
              letterSpacing: 1,
            }}
          >
            <i className="fa-solid fa-arrow-rotate-right" style={{ fontSize: 10 }} />
            <span>Ketuk kartu untuk melihat sisi belakang</span>
          </div>

          {/* ============================================================= */}
          {/* FLOATING QUICK ACTION BAR (DOCK MOBILE)                       */}
          {/* ============================================================= */}
          <div
            style={{
              position: "fixed",
              bottom: "max(18px, env(safe-area-inset-bottom, 18px))",
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
        <div
          ref={containerRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 10,
            outline: "none",
            touchAction: "none",
          }}
        >
          {/* Tactical HUD bottom left */}
          <div
            style={{
              position: "absolute",
              bottom: "max(20px, env(safe-area-inset-bottom, 20px))",
              left: "max(20px, env(safe-area-inset-left, 20px))",
              zIndex: 20,
              color: "rgba(212,175,55,0.7)",
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              lineHeight: 1.6,
              pointerEvents: "none",
              textShadow: "0 0 10px #000",
            }}
          >
            EXPEDIENT 43 • 3D STUDIO ACTIVE<br />
            STATUS: [SOVEREIGN VERIFIED]<br />
            ANGGOTA: [{(user.nama_panggilan || user.nama_lengkap).toUpperCase()}]
          </div>

          {/* Interaction Instruction Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 20,
              fontSize: 11,
              color: "#d4af37",
              backdropFilter: "blur(8px)",
              pointerEvents: "none",
            }}
          >
            <i className="fa-solid fa-hand-pointer" />
            <span>Geser Layar untuk Memutar Kartu 3D</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN QR CODE MODAL FOR QUICK EVENT SCANNING                         */}
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

            <div style={{ fontSize: 14, fontWeight: 700, color: isLightMode ? "#111" : "#fff", marginBottom: 4 }}>
              {user.nama_lengkap}
            </div>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#d4af37", marginBottom: 24 }}>
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

      {/* Global CSS Overrides */}
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
          touch-action: none;
        }
      `}</style>
    </div>
  );
}
