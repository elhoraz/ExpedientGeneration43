"use client";

import { useEffect, useRef } from "react";
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
  const isInitialized = useRef(false);

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

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Tambahkan class khusus agar CSS global (film-grain, aurora) disembunyikan
    document.body.classList.add("page-sovereign");

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

    // === DYNAMIC IMPORT THREE.JS ===
    Promise.all([
      import("three"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
    ]).then(([THREE, { RoomEnvironment }, { RoundedBoxGeometry }]) => {
      const GOLD = "#d4af37";
      const PURE_GOLD = "#ffd700";
      const DARK_BG = "#050505";

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020202, 0.015);

      const isMobile = window.innerWidth < 768;
      const camera = new THREE.PerspectiveCamera(
        isMobile ? 55 : 45,
        window.innerWidth / window.innerHeight,
        0.1,
        200
      );
      camera.position.set(0, 0, isMobile ? 26 : 28);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

      // LIGHTING
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const spotLight = new THREE.SpotLight(0xffeedd, 120);
      spotLight.position.set(10, 30, 25);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.8;
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
      spotLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
      scene.add(spotLight);

      const rimLight = new THREE.PointLight(PURE_GOLD, 60, 40);
      rimLight.position.set(-10, -5, 10);
      scene.add(rimLight);

      const cardGlowLight = new THREE.PointLight(0xffaa00, 0, 15);
      cardGlowLight.position.set(0, 0, -2);
      scene.add(cardGlowLight);

      const mouseLight = new THREE.PointLight(PURE_GOLD, 50, 40);
      mouseLight.position.set(0, 0, -5);
      scene.add(mouseLight);

      // DUST PARTICLES
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = 150;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i++) {
        dustPos[i] = (Math.random() - 0.5) * 60;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        color: PURE_GOLD,
        size: 0.1,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);

      // KINTSUGI MARBLE BACKGROUND
      function createSeamlessMarbleTexture(isDayMode: boolean) {
        const size = 2048;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        if (isDayMode) {
          const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(1, "#f2f2f2");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
          ctx.globalAlpha = 0.25;
          ctx.strokeStyle = "#cdd2d6";
          ctx.lineWidth = 12;
          for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * size, 0);
            for (let j = 0; j < 8; j++) ctx.lineTo(Math.random() * size, (j + 1) * 300);
            ctx.stroke();
          }
        } else {
          const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size);
          grad.addColorStop(0, "#032417");
          grad.addColorStop(1, "#010a06");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
          ctx.globalAlpha = 0.2;
          ctx.strokeStyle = "#084d33";
          ctx.lineWidth = 4;
          for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * size, 0);
            for (let j = 0; j < 8; j++) ctx.lineTo(Math.random() * size, (j + 1) * 300);
            ctx.stroke();
          }
        }

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 20;
        ctx.shadowColor = isDayMode ? "rgba(0,0,0,0.1)" : PURE_GOLD;
        ctx.strokeStyle = isDayMode ? "#d4af37" : PURE_GOLD;
        ctx.lineWidth = isDayMode ? 4 : 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 0; i < 15; i++) {
          ctx.beginPath();
          let x = Math.random() * size, y = Math.random() * size;
          ctx.moveTo(x, y);
          for (let j = 0; j < 12; j++) {
            x += (Math.random() - 0.5) * 500;
            y += Math.random() * 300;
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

      const nightMarbleMat = new THREE.MeshPhysicalMaterial({
        map: createSeamlessMarbleTexture(false),
        metalness: 0.15,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
      });
      const nightMarbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), nightMarbleMat);
      nightMarbleMesh.receiveShadow = true;
      marbleGroup.add(nightMarbleMesh);

      const dayMarbleMat = new THREE.MeshPhysicalMaterial({
        map: createSeamlessMarbleTexture(true),
        metalness: 0.1,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
      });
      const dayMarbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), dayMarbleMat);
      dayMarbleMesh.position.z = 0.1;
      dayMarbleMesh.receiveShadow = true;
      marbleGroup.add(dayMarbleMesh);
      scene.add(marbleGroup);

      // MOUNT HARDWARE (Hook di atas)
      const anchorPos = new THREE.Vector3(0, 11, -6);
      const mountGroup = new THREE.Group();
      mountGroup.position.copy(anchorPos);

      const mountBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.8, 0.5, 64),
        new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1.0, roughness: 0.2 })
      );
      mountBase.rotation.x = Math.PI / 2;
      mountBase.position.z = -0.5;
      mountBase.receiveShadow = true;
      mountGroup.add(mountBase);

      const mountRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.12, 16, 32),
        new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1.0, roughness: 0.1 })
      );
      mountRing.rotation.y = Math.PI / 2;
      mountRing.castShadow = true;
      mountGroup.add(mountRing);
      scene.add(mountGroup);

      const lanyardMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.3 });


      function drawRealisticSmartChip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, isBump: boolean) {
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
        const cx = x + w / 2, cy = y + h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 6, cy - 15); ctx.lineTo(cx - w * 0.2, cy - 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 6, cy + 15); ctx.lineTo(cx - w * 0.2, cy + 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - 6, cy - 15); ctx.lineTo(cx + w * 0.2, cy - 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - 6, cy + 15); ctx.lineTo(cx + w * 0.2, cy + 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, y + 6); ctx.lineTo(cx, cy - h * 0.25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, y + h - 6); ctx.lineTo(cx, cy + h * 0.25); ctx.stroke();
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

        if (isBump) { ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        else { drawBrushedMetalMain(ctx, canvas.width, canvas.height); }

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
          ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(820, 200, 70, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(820, 200, 65, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#ffffff";
        } else {
          const hGrad = ctx.createLinearGradient(700, 100, 900, 300);
          hGrad.addColorStop(0, "#d4af37");
          hGrad.addColorStop(0.5, "#fff");
          hGrad.addColorStop(1, "#d4af37");
          ctx.fillStyle = hGrad; ctx.beginPath(); ctx.arc(820, 200, 70, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = DARK_BG; ctx.beginPath(); ctx.arc(820, 200, 65, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = GOLD;
        }
        ctx.font = 'bold 50px "Playfair Display", serif';
        ctx.textAlign = "center";
        ctx.fillText("VVIP", 820, 215);
        ctx.textAlign = "left";

        const photoX = 160, photoY = 400, photoW = 760, photoH = 650;
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
        ctx.beginPath(); ctx.moveTo(photoX, photoY + sz); ctx.lineTo(photoX, photoY); ctx.lineTo(photoX + sz, photoY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(photoX + photoW - sz, photoY); ctx.lineTo(photoX + photoW, photoY); ctx.lineTo(photoX + photoW, photoY + sz); ctx.stroke();

        if (!isBump) {
          ctx.fillStyle = "#1a2228";
          ctx.beginPath(); ctx.arc(540, 650, 120, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(540, 1050, 280, Math.PI, 0); ctx.fill();
        }

        if (isBump) { ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 1; }
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

        if (isBump) { ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 1; }
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

        if (isBump) { ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        else { drawBrushedMetalMain(ctx, canvas.width, canvas.height); }

        ctx.fillStyle = isBump ? "#111111" : "#000000";
        ctx.fillRect(0, 150, 1024, 250);
        ctx.strokeStyle = isBump ? "#444444" : "#222";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 150, 1024, 250);

        if (isBump) { ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 1; }
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
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 400, 640); ctx.stroke();
        }

        drawRealisticSmartChip(ctx, 100, 50, 100, 80, 10, isBump);

        if (isBump) { ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 1; }
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
          ctx.beginPath(); ctx.arc(800, 320, 250, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(800, 320, 245, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.fillStyle = "#222";
          ctx.beginPath(); ctx.arc(800, 320, 250, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#555";
          ctx.beginPath(); ctx.arc(800, 320, 245, 0, Math.PI * 2); ctx.stroke();
        }

        if (isBump) { ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 1; }
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

        if (isBump) { ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, 1024, 640); }
        else { drawBrushedMetalMain(ctx, 1024, 640); }

        ctx.fillStyle = isBump ? "#111111" : "#000000";
        ctx.fillRect(0, 100, 1024, 120);

        if (isBump) { ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 1; }
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

      function kalibrasiUV(texture: THREE_TYPES.CanvasTexture, isBump: boolean) {
        texture.flipY = false;
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = -1;
        if (!isBump) {
          texture.colorSpace = THREE.SRGBColorSpace;
        } else {
          // Bump map WAJIB menggunakan Linear atau NoColorSpace agar data height tidak terdistorsi
          texture.colorSpace = THREE.NoColorSpace || THREE.LinearSRGBColorSpace;
        }
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
      }

      const texFront = createFrontTexture(false);
      const bumpFront = createFrontTexture(true);
      const texBack = createBackTexture(false);
      const bumpBack = createBackTexture(true);
      const kFrontTex = createKTAFrontTexture(false);
      const kFrontBump = createKTAFrontTexture(true);
      const kBackTex = createKTABackTexture(false);
      const kBackBump = createKTABackTexture(true);

      const cardMaterialProps = isMobile
        ? { roughness: 0.3, metalness: 0.5, bumpScale: 0.04 }
        : { roughness: 0.15, metalness: 0.6, clearcoat: 1.0, clearcoatRoughness: 0.1, iridescence: 0.8, iridescenceIOR: 1.5, iridescenceThicknessRange: [100, 400] as [number, number], bumpScale: 0.04 };

      const goldEdgeMaterial = new THREE.MeshStandardMaterial({ color: PURE_GOLD, metalness: 1.0, roughness: 0.15 });

      const materials = [
        goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial,
        new THREE.MeshPhysicalMaterial({ map: texFront, bumpMap: bumpFront, ...cardMaterialProps }),
        new THREE.MeshPhysicalMaterial({ map: texBack, bumpMap: bumpBack, ...cardMaterialProps }),
      ];

      // ID CARD VERTIKAL
      const cardWidth = 5.4, cardHeight = 8.6, cardDepth = 0.12;
      const idCardGeo = new RoundedBoxGeometry(cardWidth, cardHeight, cardDepth, 24, 0.3);
      const idCard = new THREE.Mesh(idCardGeo, materials);
      idCard.position.set(0, 10, 0);
      idCard.castShadow = true;
      scene.add(idCard);

      const clipGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32);
      clipGeo.rotateZ(Math.PI / 2);
      const clipMat = new THREE.MeshStandardMaterial({ color: PURE_GOLD, metalness: 1.0, roughness: 0.2 });
      const metalClip = new THREE.Mesh(clipGeo, clipMat);
      metalClip.position.set(0, cardHeight / 2 + 0.1, 0);
      metalClip.castShadow = true;
      idCard.add(metalClip);

      const stringLength = 11.5;
      const restPos = new THREE.Vector3(0, anchorPos.y - stringLength, 0);
      let lanyardMesh: THREE_TYPES.Mesh | null = null;

      function updateLanyardGeometry() {
        const clipGlobalPos = new THREE.Vector3(0, cardHeight / 2 + 0.3, 0);
        idCard.localToWorld(clipGlobalPos);
        const dist = anchorPos.distanceTo(clipGlobalPos);
        const sag = Math.max(0, stringLength - dist) * 0.5;

        const control1 = new THREE.Vector3(anchorPos.x, anchorPos.y - stringLength * 0.3 - sag, anchorPos.z - 1);
        const control2 = new THREE.Vector3(clipGlobalPos.x, clipGlobalPos.y + stringLength * 0.3 + sag, clipGlobalPos.z - 1);
        const curve = new THREE.CubicBezierCurve3(anchorPos, control1, control2, clipGlobalPos);
        const tubeGeo = new THREE.TubeGeometry(curve, isMobile ? 12 : 40, 0.12, isMobile ? 4 : 8, false);
        if (lanyardMesh) {
          lanyardMesh.geometry.dispose();
          lanyardMesh.geometry = tubeGeo;
        } else {
          lanyardMesh = new THREE.Mesh(tubeGeo, lanyardMat);
          lanyardMesh.castShadow = true;
          scene.add(lanyardMesh);
        }
      }

      // KTA CARD HORIZONTAL
      const ktaWidth = 5.4, ktaHeight = 3.4, ktaDepth = 0.08;
      const ktaGeo = new RoundedBoxGeometry(ktaWidth, ktaHeight, ktaDepth, 24, 0.3);
      const ktaFrontMat = new THREE.MeshPhysicalMaterial({ map: kFrontTex, bumpMap: kFrontBump, ...cardMaterialProps, roughness: 0.1, metalness: 0.6 });
      const ktaBackMat = new THREE.MeshPhysicalMaterial({ map: kBackTex, bumpMap: kBackBump, ...cardMaterialProps, roughness: 0.2, metalness: 0.8 });
      const ktaMatArray = [goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, ktaFrontMat, ktaBackMat];
      const ktaMesh = new THREE.Mesh(ktaGeo, ktaMatArray);
      ktaMesh.castShadow = true;
      scene.add(ktaMesh);

      const ktaRestPos = new THREE.Vector3();
      if (window.innerWidth < 768) { ktaRestPos.set(-4, -5, -4); } else { ktaRestPos.set(-8, 0, -2); }
      ktaMesh.position.copy(ktaRestPos);

      // THEME TOGGLE
      const btnThemeToggle = document.getElementById("btnThemeToggle");
      const envStatus = document.getElementById("envStatus");
      let isLightMode = false;
      let targetDayOpacity = 0;

      btnThemeToggle?.addEventListener("click", () => {
        isLightMode = !isLightMode;
        document.documentElement.setAttribute("data-theme", isLightMode ? "light" : "dark");
        if (btnThemeToggle) btnThemeToggle.innerHTML = isLightMode ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        if (envStatus) envStatus.innerText = isLightMode ? "CALACATTA_GALLERY_ACTIVE" : "NOIR_VAULT_ACTIVE";
        if (isLightMode) {
          scene.fog = new THREE.FogExp2(0xf8f9fa, 0.008);
          ambientLight.intensity = 2.0;
          spotLight.intensity = 200;
          spotLight.color.setHex(0xffffff);
          rimLight.intensity = 40;
          dustMat.opacity = 0.05;
          targetDayOpacity = 1;
        } else {
          scene.fog = new THREE.FogExp2(0x020202, 0.015);
          ambientLight.intensity = 0.8;
          spotLight.intensity = 120;
          spotLight.color.setHex(0xffeedd);
          rimLight.intensity = 60;
          dustMat.opacity = 0.5;
          targetDayOpacity = 0;
        }
      });

      // EXPORT PNG
      const btnExportId = document.getElementById("btnExportId");
      if (btnExportId) {
        btnExportId.addEventListener("click", () => {
          if (!texFront.image || !texBack.image || !kFrontTex.image || !kBackTex.image) return;
          const compCanvas = document.createElement("canvas");
          const ctx = compCanvas.getContext("2d")!;
          compCanvas.width = 2400;
          compCanvas.height = 1800;

          const bgGrad = ctx.createLinearGradient(0, 0, compCanvas.width, compCanvas.height);
          bgGrad.addColorStop(0, "#1a1d24");
          bgGrad.addColorStop(1, "#050505");
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

          ctx.fillStyle = "rgba(212,175,55,0.05)";
          ctx.font = '900 150px "Playfair Display", serif';
          ctx.textAlign = "center";
          ctx.fillText("SOVEREIGN DIRECTIVE", 1200, 300);

          function drawCard(img: HTMLCanvasElement, dx: number, dy: number, dw: number, dh: number, isKTA = false) {
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 40;
            ctx.shadowOffsetX = 15;
            ctx.shadowOffsetY = 25;
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, isKTA ? 30 : 50);
            ctx.clip();
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = "rgba(212,175,55,0.5)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, isKTA ? 30 : 50);
            ctx.stroke();
            ctx.restore();
          }

          // Lanyard 2D
          ctx.save();
          ctx.strokeStyle = "#111";
          ctx.lineWidth = 15;
          ctx.lineCap = "round";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 10;
          ctx.beginPath(); ctx.moveTo(400, -100); ctx.bezierCurveTo(400, 200, 500, 400, 500, 500); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(600, -100); ctx.bezierCurveTo(600, 200, 500, 400, 500, 500); ctx.stroke();
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(470, 480, 60, 40);
          ctx.fillStyle = "#222";
          ctx.fillRect(490, 520, 20, 30);
          ctx.restore();

          const idW = 600, idH = 955;
          drawCard(texFront.image as unknown as HTMLCanvasElement, 200, 550, idW, idH);
          drawCard(texBack.image as unknown as HTMLCanvasElement, 900, 550, idW, idH);
          const ktaW = 600, ktaH = 377;
          drawCard(kFrontTex.image as unknown as HTMLCanvasElement, 1600, 550, ktaW, ktaH, true);
          drawCard(kBackTex.image as unknown as HTMLCanvasElement, 1600, 1000, ktaW, ktaH, true);

          const dataURL = compCanvas.toDataURL("image/png", 1.0);
          const link = document.createElement("a");
          link.download = `Sovereign_ID_${expedientData.nama.replace(/\s+/g, "_")}.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          if (navigator.vibrate) navigator.vibrate(50);
          btnExportId.innerHTML = '<i class="fa-solid fa-check"></i>';
          setTimeout(() => { btnExportId.innerHTML = '<i class="fa-solid fa-download"></i>'; }, 2000);
        });
      }

      // QR & PROFILE IMAGE LOADER
      const loadQR = new Promise<HTMLImageElement | null>((resolve) => {
        if (!expedientData.qr_url) return resolve(null);
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = expedientData.qr_url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });

      const loadProfile = new Promise<HTMLImageElement | null>((resolve) => {
        if (!expedientData.foto_url) return resolve(null);
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = expedientData.foto_url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });

      Promise.all([loadQR, loadProfile]).then(([qrImg, profileImg]) => {
        const loadingEl = document.getElementById("loadingText");
        if (loadingEl) loadingEl.innerText = "CALIBRATING PHYSICS...";

        if (qrImg) {
          if (texBack?.image) {
            const ctxBack = (texBack.image as HTMLCanvasElement).getContext("2d")!;
            ctxBack.drawImage(qrImg, 362, 1050, 300, 300);
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
            const photoX = 160, photoY = 400, photoW = 760, photoH = 650;
            ctxFront.save();
            ctxFront.beginPath();
            ctxFront.rect(photoX, photoY, photoW, photoH);
            ctxFront.clip();
            const scale = Math.max(photoW / profileImg.width, photoH / profileImg.height);
            const drawW = profileImg.width * scale, drawH = profileImg.height * scale;
            const drawX = photoX + (photoW - drawW) / 2, drawY = photoY + (photoH - drawH) / 2;
            ctxFront.drawImage(profileImg, drawX, drawY, drawW, drawH);
            const glass = ctxFront.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
            glass.addColorStop(0, "rgba(255,255,255,0.05)");
            glass.addColorStop(1, "rgba(0,0,0,0.5)");
            ctxFront.fillStyle = glass;
            ctxFront.fillRect(photoX, photoY, photoW, photoH);
            ctxFront.restore();
            ctxFront.strokeStyle = GOLD;
            ctxFront.lineWidth = 4;
            const sz2 = 30;
            ctxFront.beginPath(); ctxFront.moveTo(photoX, photoY + sz2); ctxFront.lineTo(photoX, photoY); ctxFront.lineTo(photoX + sz2, photoY); ctxFront.stroke();
            ctxFront.beginPath(); ctxFront.moveTo(photoX + photoW - sz2, photoY); ctxFront.lineTo(photoX + photoW, photoY); ctxFront.lineTo(photoX + photoW, photoY + sz2); ctxFront.stroke();
            texFront.needsUpdate = true;
          }
          if (kFrontTex?.image) {
            const ctxKta = (kFrontTex.image as HTMLCanvasElement).getContext("2d")!;
            ctxKta.save();
            ctxKta.beginPath();
            ctxKta.arc(800, 320, 245, 0, Math.PI * 2);
            ctxKta.clip();
            const targetSize = 500;
            const scaleKta = Math.max(targetSize / profileImg.width, targetSize / profileImg.height);
            const drawWKta = profileImg.width * scaleKta, drawHKta = profileImg.height * scaleKta;
            const drawXKta = 800 - drawWKta / 2, drawYKta = 320 - drawHKta / 2;
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
            setTimeout(() => { loader.style.display = "none"; }, 800);
          }
        }, 500);
      });

      // INTERACTION / KINEMATICS
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let targetCameraX = 0, targetCameraY = 0;
      let isKtaActive = false;
      const ktaViewPos = new THREE.Vector3(0, 0, 16);
      let ktaTargetRotX = 0, ktaTargetRotY = 0, ktaDragDist = 0;
      let isMainActive = false;
      const mainViewPos = new THREE.Vector3(0, 0, 16);
      let mainTargetRotX = 0, mainTargetRotY = 0;
      let lastClickTime = 0;
      let isDragging = false, hasInteracted = false;
      let targetPos = new THREE.Vector3().copy(restPos);
      let targetRotY = 0, targetRotX = 0, targetRotZ = 0;
      let velocity = new THREE.Vector3(0, 0, 0);
      const springK = 0.08, damping = 0.82;
      let previousMouse = { x: 0, y: 0 };
      let globalCursorX = 0, globalCursorY = 0;

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
        (scene.fog as THREE_TYPES.FogExp2).density = (isKtaActive || isMainActive) ? baseDensity + 0.02 : baseDensity;
      }

      function toggleKTA() {
        isKtaActive = !isKtaActive;
        if (isKtaActive) { ktaTargetRotX = 0; ktaTargetRotY = 0; }
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

      container.addEventListener("click", (event: MouseEvent) => {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastClickTime;
        const isDoubleClick = timeDiff < 300 && timeDiff > 0;
        lastClickTime = currentTime;

        if (isDragging && !isKtaActive && !isMainActive) return;
        if (isKtaActive && ktaDragDist < 5 && !isDoubleClick) { toggleKTA(); return; }
        if (isMainActive && ktaDragDist < 5 && !isDoubleClick) { toggleMainCard(); return; }
        if (isDoubleClick && isMainActive) { toggleMainCard(); return; }

        updateMouseRaycast(event);

        if (isDoubleClick && !isKtaActive && !isMainActive) {
          const intersectsMain = raycaster.intersectObject(idCard, true);
          if (intersectsMain.length > 0) { toggleMainCard(); return; }
        }

        const intersects = raycaster.intersectObject(ktaMesh);
        if (intersects.length > 0 && !isKtaActive && !isMainActive && !isDoubleClick) {
          toggleKTA();
          const overlay = document.getElementById("uxOverlay");
          if (overlay) overlay.classList.add("hidden");
        }
      });

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

        if (isDragging) ktaDragDist += Math.abs(cx - previousMouse.x) + Math.abs(cy - previousMouse.y);

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
      let baseBeta: number | null = null, baseGamma: number | null = null;
      window.addEventListener("deviceorientation", (event: DeviceOrientationEvent) => {
        if (!event.beta || !event.gamma) return;
        if (baseBeta === null) baseBeta = event.beta;
        if (baseGamma === null) baseGamma = event.gamma;
        let diffBeta = Math.max(-45, Math.min(45, event.beta - baseBeta));
        let diffGamma = Math.max(-45, Math.min(45, event.gamma - baseGamma));
        globalCursorX = diffGamma / 45;
        globalCursorY = diffBeta / 45;
        targetCameraX = globalCursorX * 2.5;
        targetCameraY = globalCursorY * 2.5;
      }, true);

      // RENDER LOOP
      let lastCardPos = new THREE.Vector3();
      function animate() {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        if (dayMarbleMat.opacity !== targetDayOpacity) {
          dayMarbleMat.opacity += (targetDayOpacity - dayMarbleMat.opacity) * 0.05;
          if (Math.abs(targetDayOpacity - dayMarbleMat.opacity) < 0.01) dayMarbleMat.opacity = targetDayOpacity;
        }

        raycaster.setFromCamera(new THREE.Vector2(globalCursorX, globalCursorY), camera);
        const wallIntersects = raycaster.intersectObject(nightMarbleMesh);
        if (wallIntersects.length > 0) {
          mouseLight.position.x += (wallIntersects[0].point.x - mouseLight.position.x) * 0.1;
          mouseLight.position.y += (wallIntersects[0].point.y - mouseLight.position.y) * 0.1;
        }
        mouseLight.intensity = isLightMode ? 20 : 50;
        mouseLight.color.setHex(isLightMode ? 0xffffff : 0xffd700);

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
          const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(mainTargetRotX, mainTargetRotY, 0));
          idCard.quaternion.slerp(targetQuat, 0.1);
        } else {
          const force = new THREE.Vector3().subVectors(targetPos, idCard.position).multiplyScalar(springK);
          velocity.add(force);
          velocity.multiplyScalar(damping);
          idCard.position.add(velocity);
          idCard.rotation.x += (targetRotX - idCard.rotation.x) * 0.1;
          idCard.rotation.y += (targetRotY - idCard.rotation.y) * 0.1;
          idCard.rotation.z += (targetRotZ - idCard.rotation.z) * 0.2;
        }

        cardGlowLight.position.copy(idCard.position);
        cardGlowLight.position.z -= 1;
        const glowIntensity = Math.max(0, 30 - idCard.position.z * 5);
        cardGlowLight.intensity = isLightMode ? 0 : glowIntensity;

        if (isKtaActive) {
          ktaMesh.position.lerp(ktaViewPos, 0.08);
          const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(ktaTargetRotX, ktaTargetRotY, 0));
          ktaMesh.quaternion.slerp(targetQuat, 0.1);
        } else {
          const floatTime = time * 1.2;
          const floatY = Math.sin(floatTime) * 0.4;
          ktaMesh.position.lerp(new THREE.Vector3(ktaRestPos.x, ktaRestPos.y + floatY, ktaRestPos.z), 0.1);
          const ktaParallaxX = -(globalCursorY * 0.2);
          const ktaParallaxY = globalCursorX * 0.3;
          const floatRotZ = Math.cos(floatTime * 0.8) * 0.05;
          ktaMesh.rotation.y += (ktaParallaxY + 0.008 - ktaMesh.rotation.y) * 0.1;
          ktaMesh.rotation.x += (ktaParallaxX + 0.2 - ktaMesh.rotation.x) * 0.1;
          ktaMesh.rotation.z += (floatRotZ - ktaMesh.rotation.z) * 0.05;
        }

        if (idCard.position.distanceToSquared(lastCardPos) > 0.0001) {
          updateLanyardGeometry();
          lastCardPos.copy(idCard.position);
        }

        renderer.render(scene, camera);
      }
      animate();

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.fov = window.innerWidth < 768 ? 65 : 45;
        if (window.innerWidth < 768) { ktaRestPos.set(-4, -5, -4); } else { ktaRestPos.set(-8, 0, -2); }
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      // Cleanup
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onPointerMove as EventListener);
        window.removeEventListener("mouseup", onPointerUp);
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      };
    });
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#020202",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Inter', sans-serif",
        userSelect: "none",
      }}
    >
      {/* Preloader */}
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

      {/* Vignette */}
      <div
        className="vault-vignette"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 11,
          background: "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.9) 100%)",
          transition: "background 1s ease",
        }}
      />

      {/* Back Button */}
      <Link
        href="/fitur"
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: 8,
          color: "#d4af37",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 3,
          textDecoration: "none",
          textTransform: "uppercase",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s ease",
        }}
        id="btnBackToFitur"
      >
        <i className="fa-solid fa-chevron-left" /> Exit Vault
      </Link>

      {/* Theme Toggle */}
      <button
        id="btnThemeToggle"
        title="Toggle Day/Night Mode"
        style={{
          position: "absolute",
          top: 30,
          right: 30,
          zIndex: 100,
          width: 45,
          height: 45,
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(212,175,55,0.3)",
          color: "#d4af37",
          fontSize: 16,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <i className="fa-solid fa-sun" />
      </button>

      {/* Export Button */}
      <button
        id="btnExportId"
        title="Simpan Kartu ID (PNG)"
        style={{
          position: "absolute",
          top: 90,
          right: 30,
          zIndex: 100,
          width: 45,
          height: 45,
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(212,175,55,0.3)",
          color: "#d4af37",
          fontSize: 16,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <i className="fa-solid fa-download" />
      </button>

      {/* Tactical HUD */}
      <div
        className="tactical-hud"
        style={{
          position: "absolute",
          bottom: 30,
          left: 30,
          zIndex: 15,
          color: "rgba(212,175,55,0.6)",
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          letterSpacing: 1,
          lineHeight: 1.6,
          pointerEvents: "none",
        }}
      >
        SYS_VER: 4.0.4_SOVEREIGN<br />
        ENVIRONMENT: <span id="envStatus">NOIR_VAULT_ACTIVE</span><br />
        ACCESS: GRANTED [{(user.nama_panggilan || user.nama_lengkap).toUpperCase()}]
      </div>

      {/* UX Overlay */}
      <div
        id="uxOverlay"
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          zIndex: 20,
          pointerEvents: "none",
          transition: "opacity 0.8s ease",
        }}
      >
        <i
          className="fa-solid fa-hand-pointer ux-icon"
          style={{
            color: "#d4af37",
            fontSize: 24,
            filter: "drop-shadow(0 0 10px rgba(212,175,55,0.6))",
          }}
        />
        <span
          className="ux-text"
          style={{
            color: "#d4af37",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 4,
            textShadow: "0 0 10px #000",
            textAlign: "center",
          }}
        >
          Berinteraksi<br />
          <span style={{ fontSize: 9, opacity: 0.7 }}>Tarik Kartu &amp; Usap Layar</span>
        </span>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: "100vw",
          height: "100vh",
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,
          outline: "none",
          pointerEvents: "auto",
        }}
      />

      <style>{`
        /* Hide global background elements from Next.js root layout */
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
        @keyframes dragSim {
          0% { transform: translateY(-10px) scale(0.9); opacity: 0; }
          20% { transform: translateY(0px) scale(1); opacity: 1; }
          70% { transform: translateY(30px) scale(1); opacity: 1; }
          100% { transform: translateY(40px) scale(0.9); opacity: 0; }
        }
        body.is-grabbing { cursor: grabbing !important; }
        #uxOverlay.hidden { opacity: 0 !important; }
        #btnThemeToggle:hover { transform: scale(1.1) rotate(15deg); box-shadow: 0 0 20px rgba(212,175,55,0.5); }
        #btnExportId:hover { transform: scale(1.1) translateY(5px); box-shadow: 0 0 20px rgba(212,175,55,0.5); }
        #btnBackToFitur:hover { transform: translateX(-5px); box-shadow: 0 0 20px rgba(212,175,55,0.5); border-color: #ffd700; color: #fff; }
        
        /* TEMA SIANG (ROYAL PEARL GALLERY) */
        :root[data-theme='light'] body.page-sovereign { background-color: #f8f9fa !important; }
        :root[data-theme='light'] body.page-sovereign .vault-vignette { background: radial-gradient(circle at center, transparent 10%, rgba(255,255,255,0.6) 100%) !important; }
        :root[data-theme='light'] body.page-sovereign .tactical-hud, 
        :root[data-theme='light'] body.page-sovereign .ux-text { color: #222 !important; text-shadow: 0 0 5px rgba(255,255,255,0.8) !important; }
        :root[data-theme='light'] body.page-sovereign .ux-icon { filter: drop-shadow(0 0 10px rgba(0,0,0,0.2)) !important; color: #b48600 !important; }
        :root[data-theme='light'] body.page-sovereign #btnBackToFitur { background: rgba(255,255,255,0.9) !important; color: #333 !important; border-color: #d4af37 !important; box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important; }
        :root[data-theme='light'] body.page-sovereign #btnThemeToggle,
        :root[data-theme='light'] body.page-sovereign #btnExportId { background: #fff !important; color: #b48600 !important; border-color: #d4af37 !important; box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important; }
        #btnThemeToggle:hover { transform: scale(1.1) rotate(15deg); box-shadow: 0 0 20px rgba(212,175,55,0.5); }
        #btnExportId:hover { transform: scale(1.1) translateY(5px); box-shadow: 0 0 20px rgba(212,175,55,0.5); }
        #btnBackToFitur:hover { transform: translateX(-5px); box-shadow: 0 0 20px rgba(212,175,55,0.5); border-color: #ffd700; color: #fff; }
        @media (max-width: 768px) {
          #btnBackToFitur { top: 20px; left: 20px; padding: 8px 15px; font-size: 10px; }
          #btnThemeToggle { top: 20px; right: 20px; width: 35px; height: 35px; font-size: 14px; }
          #btnExportId { top: 65px; right: 20px; width: 35px; height: 35px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
