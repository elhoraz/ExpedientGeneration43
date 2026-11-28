"use client";

import { useEffect, useRef } from "react";
import type * as THREE_TYPES from "three";

export interface SovereignThreeSceneProps {
  user: {
    id: string;
    nama_lengkap: string;
    nama_panggilan: string | null;
    foto_profil: string | null;
    public_token?: string | null;
    prestise_points?: number;
  };
  nomorId: string;
  fotoUrl: string;
  qrUrl: string;
  isLightMode: boolean;
  cardFormat: "id" | "kta";
  isFlipped: boolean;
  onCardFormatChange?: (format: "id" | "kta") => void;
  onFlipChange?: (flipped: boolean) => void;
  onLoaded?: () => void;
}

interface CardTextureBundle {
  colorCanvas: HTMLCanvasElement;
  colorTex: THREE_TYPES.CanvasTexture;
  pbrTex: THREE_TYPES.CanvasTexture;
  bumpTex: THREE_TYPES.CanvasTexture | null;
}

/**
 * Builds compact dark/light photographic softbox cubemap reflections so
 * stamped 24K gold foil, smart chips, and beveled edges glint sharply on both
 * desktop and low-to-mid range mobile GPUs.
 */
function buildCardStudioEnv(
  THREE: typeof THREE_TYPES,
  pmrem: THREE_TYPES.PMREMGenerator,
  isDayMode: boolean
): THREE_TYPES.WebGLRenderTarget {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDayMode ? 0xd9d4c7 : 0x090d16);

  const addPanel = (
    w: number,
    h: number,
    pos: [number, number, number],
    col: number,
    intensity: number
  ) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(col).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
  };

  // Warm key overhead softbox strip
  addPanel(8, 3.4, [3.2, 6.2, 5.2], 0xfff5e0, isDayMode ? 2.5 : 2.3);
  // Crisp cool fill reflection on opposite edge
  addPanel(6, 5.0, [-6.5, 2.5, 3.8], 0xd9e8ff, isDayMode ? 1.55 : 1.15);
  // Warm 24K gold rim kicker for back-to-front card rotation glints
  addPanel(7, 2.4, [0.4, 3.8, -6.2], 0xffdf99, 2.0);
  // Subtle diagonal specular strip across card plane
  addPanel(2.4, 8.0, [5.5, -2.5, 4.5], 0xfff0c2, isDayMode ? 1.35 : 1.7);

  const rt = pmrem.fromScene(envScene, 0.04);
  envScene.traverse((obj) => {
    const meshObj = obj as THREE_TYPES.Mesh;
    meshObj.geometry?.dispose?.();
    if (Array.isArray(meshObj.material)) {
      meshObj.material.forEach((m) => m.dispose());
    } else {
      meshObj.material?.dispose?.();
    }
  });
  return rt;
}

/** Creates a reusable soft radial drop-shadow alpha texture (2 triangles per card). */
function createSoftShadowTexture(THREE: typeof THREE_TYPES): THREE_TYPES.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
  grad.addColorStop(0.45, "rgba(0, 0, 0, 0.34)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Allocates one reusable tubular BufferGeometry and updates positions & normals
 * in-place along a CubicBezierCurve3 with zero per-frame heap allocations.
 */
function createDynamicLanyardTube(
  THREE: typeof THREE_TYPES,
  tubularSegments: number,
  radialSegments: number,
  radius: number
) {
  const ringVerts = radialSegments + 1;
  const ringCount = tubularSegments + 1;
  const vertexCount = ringCount * ringVerts;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const uvIdx = (i * ringVerts + j) * 2;
      uvs[uvIdx] = u;
      uvs[uvIdx + 1] = v;
    }
  }

  for (let j = 1; j <= tubularSegments; j++) {
    for (let i = 1; i <= radialSegments; i++) {
      const a = ringVerts * (j - 1) + (i - 1);
      const b = ringVerts * j + (i - 1);
      const c = ringVerts * j + i;
      const d = ringVerts * (j - 1) + i;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  const normAttr = new THREE.BufferAttribute(normals, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  normAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", posAttr);
  geometry.setAttribute("normal", normAttr);
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  // Pre-allocated scratch buffers/vectors (zero GC pressure while dragging)
  const tangents = Array.from({ length: ringCount }, () => new THREE.Vector3());
  const normalVecs = Array.from({ length: ringCount }, () => new THREE.Vector3());
  const binormals = Array.from({ length: ringCount }, () => new THREE.Vector3());
  const vec = new THREE.Vector3();
  const prevTangent = new THREE.Vector3();
  const matRot = new THREE.Matrix4();
  const point = new THREE.Vector3();
  const vertexNormal = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 0, 1);

  const cosTable = new Float32Array(ringVerts);
  const sinTable = new Float32Array(ringVerts);
  for (let j = 0; j <= radialSegments; j++) {
    const v = (j / radialSegments) * Math.PI * 2;
    cosTable[j] = Math.cos(v);
    sinTable[j] = -Math.sin(v);
  }

  function update(curve: THREE_TYPES.Curve<THREE_TYPES.Vector3>) {
    for (let i = 0; i <= tubularSegments; i++) {
      curve.getTangentAt(i / tubularSegments, tangents[i]).normalize();
    }

    normalVecs[0].crossVectors(tangents[0], worldUp);
    if (normalVecs[0].lengthSq() < 1e-5) {
      normalVecs[0].set(1, 0, 0);
    } else {
      normalVecs[0].normalize();
    }
    binormals[0].crossVectors(tangents[0], normalVecs[0]).normalize();

    for (let i = 1; i <= tubularSegments; i++) {
      normalVecs[i].copy(normalVecs[i - 1]);
      binormals[i].copy(binormals[i - 1]);
      prevTangent.copy(tangents[i - 1]);
      vec.crossVectors(prevTangent, tangents[i]);
      if (vec.lengthSq() > 1e-8) {
        vec.normalize();
        const theta = Math.acos(Math.max(-1, Math.min(1, prevTangent.dot(tangents[i]))));
        normalVecs[i].applyMatrix4(matRot.makeRotationAxis(vec, theta));
      }
      binormals[i].crossVectors(tangents[i], normalVecs[i]);
    }

    for (let i = 0; i <= tubularSegments; i++) {
      curve.getPointAt(i / tubularSegments, point);
      const n = normalVecs[i];
      const b = binormals[i];
      for (let j = 0; j <= radialSegments; j++) {
        const cx = radius * cosTable[j];
        const cy = radius * sinTable[j];
        vertexNormal.set(
          cx * n.x + cy * b.x,
          cx * n.y + cy * b.y,
          cx * n.z + cy * b.z
        ).normalize();

        const idx = (i * ringVerts + j) * 3;
        positions[idx] = point.x + cx * n.x + cy * b.x;
        positions[idx + 1] = point.y + cx * n.y + cy * b.y;
        positions[idx + 2] = point.z + cx * n.z + cy * b.z;
        normals[idx] = vertexNormal.x;
        normals[idx + 1] = vertexNormal.y;
        normals[idx + 2] = vertexNormal.z;
      }
    }

    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
    geometry.computeBoundingSphere();
  }

  return { geometry, update };
}

/**
 * Encodes PBR surface contrast into RGB: G = roughness, B = metalness.
 * Carbon/obsidian stays velvety satin; 24K foil trim, smart chip & lettering flash crisp metal.
 */
function pbrColor(roughness: number, metalness: number): string {
  const g = Math.max(12, Math.min(250, Math.round(roughness * 255)));
  const b = Math.max(5, Math.min(252, Math.round(metalness * 255)));
  return `rgb(128, ${g}, ${b})`;
}

const PBR_CARBON = pbrColor(0.5, 0.22);
const PBR_STRIPE = pbrColor(0.28, 0.1);
const PBR_FOIL_GOLD = pbrColor(0.16, 0.96);
const PBR_GLASS = pbrColor(0.11, 0.06);
const PBR_MATTE_QR = pbrColor(0.76, 0.03);
const PBR_TEXT_SOFT = pbrColor(0.42, 0.45);

export default function SovereignThreeScene({
  user,
  nomorId,
  fotoUrl,
  qrUrl,
  isLightMode,
  cardFormat,
  isFlipped,
  onCardFormatChange,
  onFlipChange,
  onLoaded,
}: SovereignThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef({
    isLightMode,
    cardFormat,
    isFlipped,
    onCardFormatChange,
    onFlipChange,
    onLoaded,
  });
  liveRef.current = {
    isLightMode,
    cardFormat,
    isFlipped,
    onCardFormatChange,
    onFlipChange,
    onLoaded,
  };

  const resetOnFormatChangeRef = useRef<((fmt: "id" | "kta") => void) | null>(null);
  const prevFormatRef = useRef<"id" | "kta">(cardFormat);

  useEffect(() => {
    if (prevFormatRef.current !== cardFormat) {
      prevFormatRef.current = cardFormat;
      resetOnFormatChangeRef.current?.(cardFormat);
    }
  }, [cardFormat]);

  // ---------------------------------------------------------------------------
  // THREE.JS 3D STUDIO RUNNER (mounted once per user profile/QR; liveRef handles theme/format/flip)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    let isCancelled = false;
    let hasNotifiedLoaded = false;

    const container = containerRef.current;
    if (!container) return;

    const expedientData = {
      nama: user.nama_lengkap,
      jabatan: "ALUMNI ANGKATAN KE-43",
      nomor_id: nomorId,
      exp: "BERLAKU SELAMANYA",
      foto_url: fotoUrl,
      qr_url: qrUrl,
    };

    const fontsReadyPromise =
      typeof document !== "undefined" && document.fonts?.ready
        ? Promise.race([
            document.fonts.ready,
            new Promise<void>((res) => setTimeout(res, 450)),
          ])
        : Promise.resolve();

    Promise.all([
      import("three"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
      fontsReadyPromise,
    ]).then(([THREE, { RoundedBoxGeometry }]) => {
      if (isCancelled || !containerRef.current) return;

      const GOLD = "#d4af37";
      const PURE_GOLD = "#e5c158";
      const DARK_BG = "#070c16";

      const isMobileViewport = () =>
        window.innerWidth < 768 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);

      let isMobile = isMobileViewport();

      const navAny = navigator as unknown as { deviceMemory?: number };
      const devMem = typeof navAny.deviceMemory === "number" ? navAny.deviceMemory : null;
      const cpuCores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null;
      const isPerfLiteAttr = document.documentElement.getAttribute("data-perf") === "lite";

      const probeCanvas = document.createElement("canvas");
      let gpuName = "";
      try {
        const probeGl = probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl");
        const dbg = probeGl?.getExtension("WEBGL_debug_renderer_info");
        if (probeGl && dbg) {
          gpuName = String(probeGl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
        }
      } catch {
        gpuName = "";
      }

      const isUltraEntryGpu =
        /PowerVR.*(GE8320|GE8322|GE8300|GE8100)|Adreno.*(30\d|40\d|504|505|506|508|509|510)|Mali-4\d\d|Mali-T7\d\d|Mali-T8[23]0|Mali-G31/i.test(
          gpuName
        );
      const isWeakRamTier =
        (devMem !== null && devMem <= 2) ||
        (devMem !== null && devMem <= 4 && (cpuCores === null || cpuCores <= 4));
      let isLiteTier =
        isMobile && (isPerfLiteAttr || isUltraEntryGpu || isWeakRamTier);

      const getCameraFov = (mob: boolean) => (mob ? 48 : 44);
      const getCameraZ = (aspect: number, mob: boolean) => {
        if (!mob) return 27;
        return aspect < 0.68 ? 27 : 25;
      };

      const scene = new THREE.Scene();
      const aspectInit = window.innerWidth / Math.max(1, window.innerHeight);
      const camera = new THREE.PerspectiveCamera(
        getCameraFov(isMobile),
        aspectInit,
        0.1,
        160
      );
      camera.position.set(0, 0, getCameraZ(aspectInit, isMobile));

      const renderer = new THREE.WebGLRenderer({
        antialias: !isUltraEntryGpu,
        alpha: true,
        powerPreference: "high-performance",
        precision: isUltraEntryGpu ? "mediump" : "highp",
      });

      const getSovereignDpr = (mob: boolean) => {
        const dpr = window.devicePixelRatio || 1;
        if (!mob) return Math.min(dpr, 2);
        if (isUltraEntryGpu) return Math.min(dpr, 1.25);
        return Math.min(dpr, isLiteTier ? 1.5 : 1.75);
      };

      renderer.setClearColor(0x000000, 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(getSovereignDpr(isMobile));
      renderer.shadowMap.enabled = false;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      // Bake compact dark & light studio cubemaps once (< 8ms total)
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const nightEnvRT = buildCardStudioEnv(THREE, pmremGenerator, false);
      const dayEnvRT = buildCardStudioEnv(THREE, pmremGenerator, true);
      pmremGenerator.dispose();
      scene.environment = liveRef.current.isLightMode ? dayEnvRT.texture : nightEnvRT.texture;

      // STUDIO LIGHTING (smoothly updated via liveRef without WebGL reload)
      const ambientLight = new THREE.AmbientLight(0xffffff, liveRef.current.isLightMode ? 0.95 : 0.72);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0xfff5dc, 0x162033, liveRef.current.isLightMode ? 0.85 : 0.65);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
      keyLight.position.set(8, 18, 22);
      scene.add(keyLight);

      const rimLight = new THREE.PointLight(0xffe08a, liveRef.current.isLightMode ? 24 : 42, 46);
      rimLight.position.set(-11, -5, 11);
      scene.add(rimLight);

      const mouseLight = new THREE.PointLight(0xffd76a, liveRef.current.isLightMode ? 16 : 36, 38);
      mouseLight.position.set(0, 0, 8);
      scene.add(mouseLight);

      // SUBTLE FLOATING GOLD DUST MOTES
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = isLiteTier ? 24 : isMobile ? 42 : 120;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i += 3) {
        dustPos[i] = (Math.random() - 0.5) * 34;
        dustPos[i + 1] = (Math.random() - 0.5) * 30;
        dustPos[i + 2] = (Math.random() - 0.5) * 14 - 2;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        size: isMobile ? 0.08 : 0.055,
        color: 0xd4af37,
        transparent: true,
        opacity: liveRef.current.isLightMode ? 0.16 : 0.42,
        blending: THREE.NormalBlending,
        depthWrite: false,
      });
      const dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);

      // SOFT QUAD DROP SHADOWS (zero render-pass shadow map overhead)
      const softShadowTex = createSoftShadowTexture(THREE);
      const idShadowMat = new THREE.MeshBasicMaterial({
        map: softShadowTex,
        transparent: true,
        opacity: liveRef.current.isLightMode ? 0.22 : 0.48,
        depthWrite: false,
      });
      const idShadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 16.5), idShadowMat);
      idShadowPlane.position.set(0.6, -1.2, -3.5);
      scene.add(idShadowPlane);

      const ktaShadowMat = new THREE.MeshBasicMaterial({
        map: softShadowTex,
        transparent: true,
        opacity: liveRef.current.isLightMode ? 0.18 : 0.4,
        depthWrite: false,
      });
      const ktaShadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 7.6), ktaShadowMat);
      ktaShadowPlane.position.set(-8, -0.5, -5.5);
      scene.add(ktaShadowPlane);

      // TOP MOUNT & LANYARD HARDWARE
      const anchorPos = new THREE.Vector3(0, 11.2, -5.6);
      const mountGroup = new THREE.Group();
      mountGroup.position.copy(anchorPos);

      const goldHardwareMat = new THREE.MeshStandardMaterial({
        color: PURE_GOLD,
        metalness: 0.94,
        roughness: 0.16,
        envMapIntensity: 1.4,
      });
      const gunmetalMat = new THREE.MeshStandardMaterial({
        color: 0x1b222e,
        metalness: 0.85,
        roughness: 0.28,
        envMapIntensity: 1.1,
      });

      const mountBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.65, 0.42, isMobile ? 20 : 48),
        goldHardwareMat
      );
      mountBase.rotation.x = Math.PI / 2;
      mountBase.position.z = -0.4;
      mountGroup.add(mountBase);

      const mountCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.78, 0.48, isMobile ? 16 : 32),
        gunmetalMat
      );
      mountCollar.rotation.x = Math.PI / 2;
      mountCollar.position.z = -0.1;
      mountGroup.add(mountCollar);

      const mountRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.11, isMobile ? 10 : 16, isMobile ? 20 : 32),
        goldHardwareMat
      );
      mountRing.rotation.y = Math.PI / 2;
      mountGroup.add(mountRing);
      scene.add(mountGroup);

      const lanyardMat = new THREE.MeshStandardMaterial({
        color: 0x171d28,
        roughness: 0.62,
        metalness: 0.22,
        envMapIntensity: 0.8,
      });

      // =========================================================================
      // CALIBRATED UV + SCALED TEXTURE GENERATOR (1024 desktop, 768 mobile)
      // =========================================================================
      const texScale = isMobile ? 0.75 : 1.0;

      function createCalibratedPair(baseW: number, baseH: number) {
        const w = Math.round(baseW * texScale);
        const h = Math.round(baseH * texScale);

        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = w;
        colorCanvas.height = h;
        const cCtx = colorCanvas.getContext("2d")!;
        cCtx.scale(texScale, texScale);

        const pbrCanvas = document.createElement("canvas");
        pbrCanvas.width = w;
        pbrCanvas.height = h;
        const pCtx = pbrCanvas.getContext("2d")!;
        pCtx.scale(texScale, texScale);

        let bumpCanvas: HTMLCanvasElement | null = null;
        let bCtx: CanvasRenderingContext2D | null = null;
        if (!isUltraEntryGpu) {
          bumpCanvas = document.createElement("canvas");
          bumpCanvas.width = w;
          bumpCanvas.height = h;
          bCtx = bumpCanvas.getContext("2d")!;
          bCtx.scale(texScale, texScale);
        }

        return { colorCanvas, pbrCanvas, bumpCanvas, cCtx, pCtx, bCtx, baseW, baseH };
      }

      function calibrateTex(
        canvas: HTMLCanvasElement,
        colorSpace: THREE_TYPES.ColorSpace
      ): THREE_TYPES.CanvasTexture {
        const tex = new THREE.CanvasTexture(canvas);
        tex.flipY = true;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.center.set(0.5, 0.5);
        tex.rotation = Math.PI;
        tex.repeat.set(1, 1);
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = colorSpace;
        tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isMobile ? 4 : 16);
        return tex;
      }

      function finalizeBundle(
        pair: ReturnType<typeof createCalibratedPair>
      ): CardTextureBundle {
        const colorTex = calibrateTex(pair.colorCanvas, THREE.SRGBColorSpace);
        const pbrTex = calibrateTex(pair.pbrCanvas, THREE.NoColorSpace);
        const bumpTex = pair.bumpCanvas
          ? calibrateTex(pair.bumpCanvas, THREE.NoColorSpace)
          : null;
        return {
          colorCanvas: pair.colorCanvas,
          colorTex,
          pbrTex,
          bumpTex,
        };
      }

      function drawBrushedCarbonBase(
        cCtx: CanvasRenderingContext2D,
        pCtx: CanvasRenderingContext2D,
        bCtx: CanvasRenderingContext2D | null,
        w: number,
        h: number
      ) {
        cCtx.fillStyle = DARK_BG;
        cCtx.fillRect(0, 0, w, h);

        // Subtle satin hairline metallic grain
        cCtx.globalAlpha = 0.035;
        for (let i = 0; i < w; i += 3) {
          cCtx.fillStyle = i % 6 === 0 ? "#25324a" : "#020408";
          cCtx.fillRect(i, 0, 1, h);
        }
        cCtx.globalAlpha = 1.0;

        // Corner ambient depth vignette
        const vig = cCtx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.95);
        vig.addColorStop(0, "rgba(212,175,55,0.03)");
        vig.addColorStop(1, "rgba(0,0,0,0.68)");
        cCtx.fillStyle = vig;
        cCtx.fillRect(0, 0, w, h);

        pCtx.fillStyle = PBR_CARBON;
        pCtx.fillRect(0, 0, w, h);
        if (bCtx) {
          bCtx.fillStyle = "#000000";
          bCtx.fillRect(0, 0, w, h);
        }
      }

      function drawSmartChip(
        cCtx: CanvasRenderingContext2D,
        pCtx: CanvasRenderingContext2D,
        bCtx: CanvasRenderingContext2D | null,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) {
        const grad = cCtx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, "#fae08b");
        grad.addColorStop(0.5, "#d4af37");
        grad.addColorStop(1, "#9c7316");
        cCtx.fillStyle = grad;
        cCtx.beginPath();
        cCtx.roundRect(x, y, w, h, r);
        cCtx.fill();

        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.beginPath();
        pCtx.roundRect(x, y, w, h, r);
        pCtx.fill();

        if (bCtx) {
          bCtx.fillStyle = "#ffffff";
          bCtx.beginPath();
          bCtx.roundRect(x, y, w, h, r);
          bCtx.fill();
        }

        const drawCircuitLines = (ctx: CanvasRenderingContext2D, stroke: string) => {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 6, w - 12, h - 12, r - 4);
          ctx.stroke();
          const cx = x + w / 2;
          const cy = y + h / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 6, cy - 14);
          ctx.lineTo(cx - w * 0.2, cy - 14);
          ctx.moveTo(x + 6, cy + 14);
          ctx.lineTo(cx - w * 0.2, cy + 14);
          ctx.moveTo(x + w - 6, cy - 14);
          ctx.lineTo(cx + w * 0.2, cy - 14);
          ctx.moveTo(x + w - 6, cy + 14);
          ctx.lineTo(cx + w * 0.2, cy + 14);
          ctx.moveTo(cx, y + 6);
          ctx.lineTo(cx, cy - h * 0.25);
          ctx.moveTo(cx, y + h - 6);
          ctx.lineTo(cx, cy + h * 0.25);
          ctx.stroke();
        };

        drawCircuitLines(cCtx, "rgba(70, 45, 0, 0.55)");
        drawCircuitLines(pCtx, PBR_CARBON);
        if (bCtx) drawCircuitLines(bCtx, "#111111");
      }

      // 1. VERTICAL ID FRONT
      function buildIdFront(): CardTextureBundle {
        const p = createCalibratedPair(1024, 1624);
        const { cCtx, pCtx, bCtx, baseW, baseH } = p;
        drawBrushedCarbonBase(cCtx, pCtx, bCtx, baseW, baseH);

        // Stamped 24K Gold side ribbon lines
        cCtx.fillStyle = GOLD;
        cCtx.fillRect(42, 0, 12, baseH);
        cCtx.fillRect(62, 0, 3, baseH);
        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.fillRect(42, 0, 12, baseH);
        pCtx.fillRect(62, 0, 3, baseH);
        if (bCtx) {
          bCtx.fillStyle = "#c8c8c8";
          bCtx.fillRect(42, 0, 12, baseH);
          bCtx.fillRect(62, 0, 3, baseH);
        }

        // Top lanyard slot punch indicator bar
        cCtx.fillStyle = "#03050a";
        cCtx.beginPath();
        cCtx.roundRect(432, 34, 160, 26, 13);
        cCtx.fill();
        cCtx.strokeStyle = GOLD;
        cCtx.lineWidth = 4;
        cCtx.stroke();

        // Subtle watermark vertically
        cCtx.save();
        cCtx.translate(142, 1500);
        cCtx.rotate(-Math.PI / 2);
        cCtx.fillStyle = "rgba(212,175,55,0.14)";
        cCtx.font = '900 124px "Playfair Display", serif';
        cCtx.letterSpacing = "18px";
        cCtx.fillText("EXPEDIENT", 0, 0);
        cCtx.restore();

        drawSmartChip(cCtx, pCtx, bCtx, 160, 156, 124, 98, 16);

        // Circular Crest Seal (with proper dark interior fill!)
        const sealGrad = cCtx.createLinearGradient(730, 120, 910, 290);
        sealGrad.addColorStop(0, "#d4af37");
        sealGrad.addColorStop(0.5, "#fff2c2");
        sealGrad.addColorStop(1, "#a67c00");
        cCtx.fillStyle = sealGrad;
        cCtx.beginPath();
        cCtx.arc(820, 205, 72, 0, Math.PI * 2);
        cCtx.fill();

        cCtx.fillStyle = DARK_BG;
        cCtx.beginPath();
        cCtx.arc(820, 205, 64, 0, Math.PI * 2);
        cCtx.fill();

        cCtx.fillStyle = GOLD;
        cCtx.font = 'bold 46px "Playfair Display", serif';
        cCtx.textAlign = "center";
        cCtx.fillText("43", 820, 222);
        cCtx.textAlign = "left";

        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.beginPath();
        pCtx.arc(820, 205, 72, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.fillStyle = PBR_CARBON;
        pCtx.beginPath();
        pCtx.arc(820, 205, 62, 0, Math.PI * 2);
        pCtx.fill();

        if (bCtx) {
          bCtx.fillStyle = "#ffffff";
          bCtx.beginPath();
          bCtx.arc(820, 205, 72, 0, Math.PI * 2);
          bCtx.fill();
          bCtx.fillStyle = "#202020";
          bCtx.beginPath();
          bCtx.arc(820, 205, 62, 0, Math.PI * 2);
          bCtx.fill();
        }

        // Photo Frame Placeholder + Glossy Glass Surface Map
        const photoX = 160, photoY = 385, photoW = 760, photoH = 650;
        pCtx.fillStyle = PBR_GLASS;
        pCtx.fillRect(photoX, photoY, photoW, photoH);

        cCtx.strokeStyle = "rgba(212,175,55,0.55)";
        cCtx.lineWidth = 3;
        cCtx.strokeRect(photoX, photoY, photoW, photoH);
        const glass = cCtx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
        glass.addColorStop(0, "rgba(255,255,255,0.06)");
        glass.addColorStop(1, "rgba(0,0,0,0.42)");
        cCtx.fillStyle = glass;
        cCtx.fillRect(photoX, photoY, photoW, photoH);

        // Initial silhouette fallback
        cCtx.fillStyle = "#16202e";
        cCtx.beginPath();
        cCtx.arc(540, 635, 115, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.beginPath();
        cCtx.arc(540, 1035, 270, Math.PI, 0);
        cCtx.fill();

        // Corner golden photo accents
        cCtx.strokeStyle = GOLD;
        cCtx.lineWidth = 5;
        const cornerSz = 34;
        cCtx.beginPath();
        cCtx.moveTo(photoX, photoY + cornerSz);
        cCtx.lineTo(photoX, photoY);
        cCtx.lineTo(photoX + cornerSz, photoY);
        cCtx.moveTo(photoX + photoW - cornerSz, photoY);
        cCtx.lineTo(photoX + photoW, photoY);
        cCtx.lineTo(photoX + photoW, photoY + cornerSz);
        cCtx.stroke();

        // Foil Name + Alumni Rank
        cCtx.fillStyle = "#ffffff";
        cCtx.font = 'bold 62px "Playfair Display", serif';
        cCtx.fillText(expedientData.nama.toUpperCase(), 160, 1170, 760);

        cCtx.fillStyle = GOLD;
        cCtx.font = '700 28px "Inter", sans-serif';
        cCtx.letterSpacing = "5px";
        cCtx.fillText(expedientData.jabatan, 160, 1232, 760);

        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.font = 'bold 62px "Playfair Display", serif';
        pCtx.fillText(expedientData.nama.toUpperCase(), 160, 1170, 760);
        pCtx.font = '700 28px "Inter", sans-serif';
        pCtx.letterSpacing = "5px";
        pCtx.fillText(expedientData.jabatan, 160, 1232, 760);

        if (bCtx) {
          bCtx.fillStyle = "#ffffff";
          bCtx.font = 'bold 62px "Playfair Display", serif';
          bCtx.fillText(expedientData.nama.toUpperCase(), 160, 1170, 760);
          bCtx.font = '700 28px "Inter", sans-serif';
          bCtx.letterSpacing = "5px";
          bCtx.fillText(expedientData.jabatan, 160, 1232, 760);
        }

        cCtx.fillStyle = "rgba(212,175,55,0.38)";
        cCtx.fillRect(160, 1290, 760, 3);
        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.fillRect(160, 1290, 760, 3);

        cCtx.fillStyle = "#9aa7b6";
        cCtx.font = "500 28px monospace";
        cCtx.letterSpacing = "2px";
        cCtx.fillText("ID: " + expedientData.nomor_id, 160, 1372);
        cCtx.fillText(expedientData.exp, 160, 1425);

        pCtx.fillStyle = PBR_TEXT_SOFT;
        pCtx.font = "500 28px monospace";
        pCtx.letterSpacing = "2px";
        pCtx.fillText("ID: " + expedientData.nomor_id, 160, 1372);
        pCtx.fillText(expedientData.exp, 160, 1425);

        // Deterministic barcode stripes
        cCtx.fillStyle = "#e2e8f0";
        for (let i = 0; i < 30; i++) {
          const bw = i % 3 === 0 ? 7 : i % 2 === 0 ? 4 : 2;
          cCtx.fillRect(670 + i * 8, 1345, bw, 80);
        }

        return finalizeBundle(p);
      }

      // 2. VERTICAL ID BACK
      function buildIdBack(): CardTextureBundle {
        const p = createCalibratedPair(1024, 1624);
        const { cCtx, pCtx, bCtx, baseW, baseH } = p;
        drawBrushedCarbonBase(cCtx, pCtx, bCtx, baseW, baseH);

        // Glossy magnetic stripe
        cCtx.fillStyle = "#03050a";
        cCtx.fillRect(0, 150, baseW, 240);
        cCtx.strokeStyle = "#1d2838";
        cCtx.lineWidth = 4;
        cCtx.strokeRect(0, 150, baseW, 240);
        pCtx.fillStyle = PBR_STRIPE;
        pCtx.fillRect(0, 150, baseW, 240);

        cCtx.fillStyle = GOLD;
        cCtx.textAlign = "center";
        cCtx.font = 'bold 42px "Playfair Display", serif';
        cCtx.fillText("KARTU TANDA ALUMNI RESMI", 512, 540);
        cCtx.fillRect(390, 574, 244, 3);

        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.textAlign = "center";
        pCtx.font = 'bold 42px "Playfair Display", serif';
        pCtx.fillText("KARTU TANDA ALUMNI RESMI", 512, 540);
        pCtx.fillRect(390, 574, 244, 3);

        cCtx.fillStyle = "#9aa7b6";
        cCtx.font = '400 28px "Inter", sans-serif';
        const lines = [
          "Expedient Generation 43",
          "Pondok Modern Arrisalah • Slahung, Ponorogo.",
          "Identitas resmi silaturahmi & ekosistem digital",
          "Keluarga Besar Alumni Angkatan ke-43.",
        ];
        lines.forEach((line, i) => cCtx.fillText(line, 512, 675 + i * 48));

        // QR Frame (matte non-glare interior for fast scanning!)
        pCtx.fillStyle = PBR_MATTE_QR;
        pCtx.fillRect(334, 1022, 356, 356);
        cCtx.strokeStyle = GOLD;
        cCtx.lineWidth = 8;
        cCtx.strokeRect(342, 1030, 340, 340);

        cCtx.fillStyle = GOLD;
        cCtx.font = "600 22px monospace";
        cCtx.fillText("PINDAI QR VERIFIKASI IDENTITAS", 512, 1435);

        return finalizeBundle(p);
      }

      // 3. HORIZONTAL KTA FRONT
      function buildKtaFront(): CardTextureBundle {
        const p = createCalibratedPair(1024, 640);
        const { cCtx, pCtx, bCtx, baseW, baseH } = p;
        drawBrushedCarbonBase(cCtx, pCtx, bCtx, baseW, baseH);

        // Diagonal guilloche line texture
        cCtx.strokeStyle = "#0e1d36";
        cCtx.lineWidth = 3;
        for (let i = -200; i < 1200; i += 54) {
          cCtx.beginPath();
          cCtx.moveTo(i, 0);
          cCtx.lineTo(i + 400, 640);
          cCtx.stroke();
        }

        drawSmartChip(cCtx, pCtx, bCtx, 88, 60, 108, 84, 12);

        cCtx.fillStyle = GOLD;
        cCtx.font = 'bold 38px "Playfair Display", serif';
        cCtx.letterSpacing = "10px";
        cCtx.fillText("EXPEDIENT", 88, 204);

        cCtx.fillStyle = "#9aa7b6";
        cCtx.font = "600 22px monospace";
        cCtx.letterSpacing = "5px";
        cCtx.fillText("ANGKATAN 43 • ARRISALAH", 88, 248);

        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.font = 'bold 38px "Playfair Display", serif';
        pCtx.letterSpacing = "10px";
        pCtx.fillText("EXPEDIENT", 88, 204);
        if (bCtx) {
          bCtx.fillStyle = "#ffffff";
          bCtx.font = 'bold 38px "Playfair Display", serif';
          bCtx.letterSpacing = "10px";
          bCtx.fillText("EXPEDIENT", 88, 204);
        }

        // Photo circle backdrop + glossy surface
        pCtx.fillStyle = PBR_GLASS;
        pCtx.beginPath();
        pCtx.arc(790, 320, 195, 0, Math.PI * 2);
        pCtx.fill();

        cCtx.fillStyle = "rgba(212,175,55,0.06)";
        cCtx.beginPath();
        cCtx.arc(790, 320, 198, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.strokeStyle = "rgba(212,175,55,0.45)";
        cCtx.lineWidth = 4;
        cCtx.stroke();

        // Member name & ID number
        cCtx.fillStyle = "#ffffff";
        cCtx.font = 'bold 42px "Inter", sans-serif';
        cCtx.letterSpacing = "2px";
        cCtx.fillText(expedientData.nama.toUpperCase(), 88, 516, 470);

        cCtx.fillStyle = GOLD;
        cCtx.font = "700 30px monospace";
        cCtx.fillText(expedientData.nomor_id, 88, 568, 470);

        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.font = 'bold 42px "Inter", sans-serif';
        pCtx.letterSpacing = "2px";
        pCtx.fillText(expedientData.nama.toUpperCase(), 88, 516, 470);
        pCtx.font = "700 30px monospace";
        pCtx.fillText(expedientData.nomor_id, 88, 568, 470);

        if (bCtx) {
          bCtx.fillStyle = "#ffffff";
          bCtx.font = 'bold 42px "Inter", sans-serif';
          bCtx.letterSpacing = "2px";
          bCtx.fillText(expedientData.nama.toUpperCase(), 88, 516, 470);
          bCtx.font = "700 30px monospace";
          bCtx.fillText(expedientData.nomor_id, 88, 568, 470);
        }

        return finalizeBundle(p);
      }

      // 4. HORIZONTAL KTA BACK
      function buildKtaBack(): CardTextureBundle {
        const p = createCalibratedPair(1024, 640);
        const { cCtx, pCtx, bCtx, baseW, baseH } = p;
        drawBrushedCarbonBase(cCtx, pCtx, bCtx, baseW, baseH);

        cCtx.fillStyle = "#03050a";
        cCtx.fillRect(0, 82, baseW, 110);
        pCtx.fillStyle = PBR_STRIPE;
        pCtx.fillRect(0, 82, baseW, 110);

        cCtx.fillStyle = GOLD;
        cCtx.font = 'bold 30px "Playfair Display", serif';
        cCtx.textAlign = "left";
        cCtx.fillText("VERIFIKASI ALUMNI RESMI", 80, 302);
        pCtx.fillStyle = PBR_FOIL_GOLD;
        pCtx.font = 'bold 30px "Playfair Display", serif';
        pCtx.fillText("VERIFIKASI ALUMNI RESMI", 80, 302);

        cCtx.fillStyle = "#9aa7b6";
        cCtx.font = '400 22px "Inter", sans-serif';
        cCtx.fillText("Pondok Modern Arrisalah • Slahung, Ponorogo", 80, 362);
        cCtx.fillText("Keluarga Besar Alumni Angkatan ke-43", 80, 404);
        cCtx.fillStyle = GOLD;
        cCtx.font = "600 20px monospace";
        cCtx.fillText(`ID: ${expedientData.nomor_id} • ${expedientData.exp}`, 80, 476);

        pCtx.fillStyle = PBR_MATTE_QR;
        pCtx.fillRect(722, 272, 236, 236);
        cCtx.strokeStyle = GOLD;
        cCtx.lineWidth = 5;
        cCtx.strokeRect(732, 282, 216, 216);

        return finalizeBundle(p);
      }

      const idFront = buildIdFront();
      const idBack = buildIdBack();
      const ktaFront = buildKtaFront();
      const ktaBack = buildKtaBack();

      const createCardFaceMaterial = (bundle: CardTextureBundle) =>
        new THREE.MeshStandardMaterial({
          map: bundle.colorTex,
          roughness: 1.0,
          metalness: 1.0,
          roughnessMap: bundle.pbrTex,
          metalnessMap: bundle.pbrTex,
          envMapIntensity: 1.25,
          ...(bundle.bumpTex ? { bumpMap: bundle.bumpTex, bumpScale: 0.028 } : {}),
        });

      const goldEdgeMaterial = new THREE.MeshStandardMaterial({
        color: PURE_GOLD,
        metalness: 0.94,
        roughness: 0.16,
        envMapIntensity: 1.45,
      });

      // ID CARD VERTICAL + CLASP HARDWARE
      const cardWidth = 5.4;
      const cardHeight = 8.6;
      const cardDepth = 0.12;
      const idCardGeo = new RoundedBoxGeometry(
        cardWidth,
        cardHeight,
        cardDepth,
        isMobile ? 12 : 24,
        0.3
      );
      const idMaterials = [
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        createCardFaceMaterial(idFront),
        createCardFaceMaterial(idBack),
      ];
      const idCard = new THREE.Mesh(idCardGeo, idMaterials);
      idCard.position.set(0, 9.5, 0);
      scene.add(idCard);

      // Refined Clasp Assembly on top edge of ID Card
      const claspGroup = new THREE.Group();
      claspGroup.position.set(0, cardHeight / 2 + 0.04, 0);

      const eyeletBar = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.22, 0.24),
        gunmetalMat
      );
      claspGroup.add(eyeletBar);

      const clampJaw = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 0.36, 0.3),
        goldHardwareMat
      );
      clampJaw.position.y = 0.14;
      claspGroup.add(clampJaw);

      const dRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.08, isMobile ? 10 : 16, isMobile ? 18 : 28),
        goldHardwareMat
      );
      dRing.position.y = 0.44;
      claspGroup.add(dRing);
      idCard.add(claspGroup);

      const stringLength = 11.2;
      const restPos = new THREE.Vector3(0, anchorPos.y - stringLength, 0);
      const idParkedPos = new THREE.Vector3(
        isMobile ? 7.2 : 9.2,
        isMobile ? 4.4 : 2.2,
        -6.5
      );

      // ZERO-ALLOCATION DYNAMIC LANYARD TUBE
      const lanyardTube = createDynamicLanyardTube(
        THREE,
        isMobile ? 18 : 30,
        isMobile ? 6 : 8,
        0.115
      );
      const lanyardMesh = new THREE.Mesh(lanyardTube.geometry, lanyardMat);
      scene.add(lanyardMesh);

      const clipGlobalPos = new THREE.Vector3();
      const ctrl1 = new THREE.Vector3();
      const ctrl2 = new THREE.Vector3();
      const curve = new THREE.CubicBezierCurve3(
        anchorPos.clone(),
        ctrl1,
        ctrl2,
        clipGlobalPos
      );

      function updateLanyardVertexBuffers() {
        clipGlobalPos.set(0, cardHeight / 2 + 0.65, 0);
        idCard.localToWorld(clipGlobalPos);
        const dist = anchorPos.distanceTo(clipGlobalPos);
        const sag = Math.max(0, stringLength - dist) * 0.48;

        ctrl1.set(anchorPos.x, anchorPos.y - stringLength * 0.3 - sag, anchorPos.z - 0.9);
        ctrl2.set(clipGlobalPos.x, clipGlobalPos.y + stringLength * 0.3 + sag, clipGlobalPos.z - 0.9);
        curve.v0.copy(anchorPos);
        curve.v1.copy(ctrl1);
        curve.v2.copy(ctrl2);
        curve.v3.copy(clipGlobalPos);
        lanyardTube.update(curve);
      }
      updateLanyardVertexBuffers();

      // HORIZONTAL KTA CARD
      const ktaWidth = 5.4;
      const ktaHeight = 3.4;
      const ktaDepth = 0.085;
      const ktaGeo = new RoundedBoxGeometry(
        ktaWidth,
        ktaHeight,
        ktaDepth,
        isMobile ? 12 : 24,
        0.28
      );
      const ktaMatArray = [
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        goldEdgeMaterial,
        createCardFaceMaterial(ktaFront),
        createCardFaceMaterial(ktaBack),
      ];
      const ktaMesh = new THREE.Mesh(ktaGeo, ktaMatArray);
      scene.add(ktaMesh);

      const getKtaRestPos = (mob: boolean) =>
        mob ? new THREE.Vector3(-4.2, -5.2, -5.0) : new THREE.Vector3(-8.4, 0.2, -2.5);
      const getKtaViewPos = (mob: boolean) =>
        mob ? new THREE.Vector3(0, 0.2, 6.2) : new THREE.Vector3(0, 0.1, 14.5);
      const getMainViewPos = (mob: boolean) =>
        mob ? new THREE.Vector3(0, 0.2, 5.2) : new THREE.Vector3(0, 0, 14.0);

      const ktaRestPos = getKtaRestPos(isMobile);
      const ktaViewPos = getKtaViewPos(isMobile);
      const mainViewPos = getMainViewPos(isMobile);
      ktaMesh.position.copy(ktaRestPos);

      // ASYNC AVATAR & QR TEXTURE INJECTION
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
        if (isCancelled) return;
        if (qrImg.complete && qrImg.naturalWidth > 0) {
          const ctxBack = idBack.colorCanvas.getContext("2d")!;
          ctxBack.drawImage(qrImg, 352, 1040, 320, 320);
          idBack.colorTex.needsUpdate = true;

          const ctxKtaBack = ktaBack.colorCanvas.getContext("2d")!;
          ctxKtaBack.drawImage(qrImg, 742, 292, 196, 196);
          ktaBack.colorTex.needsUpdate = true;
        }

        if (profileImg && profileImg.complete && profileImg.naturalWidth > 0) {
          // Vertical ID photo
          const ctxFront = idFront.colorCanvas.getContext("2d")!;
          const photoX = 160, photoY = 385, photoW = 760, photoH = 650;
          ctxFront.save();
          ctxFront.beginPath();
          ctxFront.rect(photoX, photoY, photoW, photoH);
          ctxFront.clip();
          const scale = Math.max(photoW / profileImg.width, photoH / profileImg.height);
          const drawW = profileImg.width * scale;
          const drawH = profileImg.height * scale;
          ctxFront.drawImage(
            profileImg,
            photoX + (photoW - drawW) / 2,
            photoY + (photoH - drawH) / 2,
            drawW,
            drawH
          );
          const sheen = ctxFront.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
          sheen.addColorStop(0, "rgba(255,255,255,0.08)");
          sheen.addColorStop(1, "rgba(0,0,0,0.32)");
          ctxFront.fillStyle = sheen;
          ctxFront.fillRect(photoX, photoY, photoW, photoH);
          ctxFront.restore();

          ctxFront.strokeStyle = GOLD;
          ctxFront.lineWidth = 5;
          const cSz = 34;
          ctxFront.beginPath();
          ctxFront.moveTo(photoX, photoY + cSz);
          ctxFront.lineTo(photoX, photoY);
          ctxFront.lineTo(photoX + cSz, photoY);
          ctxFront.moveTo(photoX + photoW - cSz, photoY);
          ctxFront.lineTo(photoX + photoW, photoY);
          ctxFront.lineTo(photoX + photoW, photoY + cSz);
          ctxFront.stroke();
          idFront.colorTex.needsUpdate = true;

          // Horizontal KTA circular avatar
          const ctxKtaFront = ktaFront.colorCanvas.getContext("2d")!;
          const cx = 790, cy = 320, rad = 190;
          ctxKtaFront.save();
          ctxKtaFront.beginPath();
          ctxKtaFront.arc(cx, cy, rad, 0, Math.PI * 2);
          ctxKtaFront.clip();
          const sKta = Math.max((rad * 2) / profileImg.width, (rad * 2) / profileImg.height);
          const dWKta = profileImg.width * sKta;
          const dHKta = profileImg.height * sKta;
          ctxKtaFront.drawImage(profileImg, cx - dWKta / 2, cy - dHKta / 2, dWKta, dHKta);
          ctxKtaFront.restore();
          ctxKtaFront.lineWidth = 6;
          ctxKtaFront.strokeStyle = GOLD;
          ctxKtaFront.beginPath();
          ctxKtaFront.arc(cx, cy, rad, 0, Math.PI * 2);
          ctxKtaFront.stroke();
          ktaFront.colorTex.needsUpdate = true;
        }
      });

      // INTERACTION & KINEMATICS
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      let isMainInspect = false;
      let mainTargetRotX = 0;
      let mainTargetRotY = 0;
      let ktaTargetRotX = 0;
      let ktaTargetRotY = 0;
      let dragDist = 0;
      let lastTapTime = 0;
      let isDragging = false;
      let activePointerId: number | null = null;
      let hasInteracted = false;

      const targetPos = new THREE.Vector3().copy(restPos);
      let targetRotY = 0;
      let targetRotX = 0;
      const velocity = new THREE.Vector3(0, 0, 0);
      const springK = 0.085;
      const damping = 0.82;
      let previousPointer = { x: 0, y: 0 };
      let globalCursorX = 0;
      let globalCursorY = 0;
      let targetCameraX = 0;
      let targetCameraY = 0;

      resetOnFormatChangeRef.current = (nextFmt) => {
        if (nextFmt === "kta") {
          isMainInspect = false;
          ktaTargetRotX = 0;
          ktaTargetRotY = 0;
          velocity.set(0, 0, 0);
        } else {
          isMainInspect = false;
          mainTargetRotX = 0;
          mainTargetRotY = 0;
          targetPos.copy(restPos);
          velocity.set(0, 0, 0);
        }
      };

      const hideUxHint = () => {
        if (!hasInteracted) {
          hasInteracted = true;
          const overlay = document.getElementById("uxOverlay");
          if (overlay) overlay.classList.add("hidden");
        }
      };

      const setPointerRay = (clientX: number, clientY: number) => {
        const rect = container.getBoundingClientRect();
        pointerNdc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        pointerNdc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        return { normX: pointerNdc.x, normY: pointerNdc.y };
      };

      const handlePointerDown = (event: PointerEvent) => {
        if (activePointerId !== null && activePointerId !== event.pointerId) return;
        activePointerId = event.pointerId;
        dragDist = 0;
        previousPointer = { x: event.clientX, y: event.clientY };
        setPointerRay(event.clientX, event.clientY);

        isDragging = true;
        document.body.classList.add("is-grabbing");
        hideUxHint();
        try {
          container.setPointerCapture(event.pointerId);
        } catch {}
      };

      const handlePointerMove = (event: PointerEvent) => {
        const { normX, normY } = setPointerRay(event.clientX, event.clientY);
        globalCursorX = normX;
        globalCursorY = normY;
        targetCameraX = normX * 1.8;
        targetCameraY = normY * 1.6;

        if (!isDragging || (activePointerId !== null && activePointerId !== event.pointerId)) {
          return;
        }

        const dx = event.clientX - previousPointer.x;
        const dy = event.clientY - previousPointer.y;
        dragDist += Math.hypot(dx, dy);
        previousPointer = { x: event.clientX, y: event.clientY };

        const fmt = liveRef.current.cardFormat;
        if (fmt === "kta") {
          ktaTargetRotY += dx * 0.011;
          ktaTargetRotX += dy * 0.011;
          return;
        }
        if (isMainInspect) {
          mainTargetRotY += dx * 0.011;
          mainTargetRotX += dy * 0.011;
          return;
        }

        // Physical spring lanyard drag
        targetPos.x = normX * (isMobile ? 9.5 : 13.5);
        targetPos.y = normY * (isMobile ? 9.5 : 12.5);
        targetPos.z = 3.2;
        targetRotY += dx * 0.014;
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (activePointerId !== null && activePointerId !== event.pointerId) return;
        activePointerId = null;

        const wasTap = isDragging && dragDist < 9;
        isDragging = false;
        document.body.classList.remove("is-grabbing");

        const fmt = liveRef.current.cardFormat;
        if (fmt === "id" && !isMainInspect) {
          targetPos.copy(restPos);
        }

        if (!wasTap) return;

        const nowTap = performance.now();
        const isDoubleTap = nowTap - lastTapTime < 320;
        lastTapTime = nowTap;

        setPointerRay(event.clientX, event.clientY);
        const hitKta = raycaster.intersectObject(ktaMesh, false).length > 0;
        const hitId = raycaster.intersectObject(idCard, true).length > 0;

        if (fmt === "id" && hitKta && !isMainInspect) {
          liveRef.current.onCardFormatChange?.("kta");
          return;
        }
        if (fmt === "kta" && hitId && !hitKta) {
          liveRef.current.onCardFormatChange?.("id");
          return;
        }
        if (fmt === "id") {
          if (isDoubleTap && hitId) {
            isMainInspect = !isMainInspect;
            mainTargetRotX = 0;
            mainTargetRotY = 0;
            velocity.set(0, 0, 0);
            targetRotY = 0;
          } else if (isMainInspect && !hitId) {
            isMainInspect = false;
            velocity.set(0, 0, 0);
            targetRotY = 0;
          }
        }
      };

      container.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);

      // MOBILE GYROSCOPE PARALLAX
      let baseBeta: number | null = null;
      let baseGamma: number | null = null;
      const onDeviceOrientation = (event: DeviceOrientationEvent) => {
        if (event.beta === null || event.gamma === null) return;
        if (baseBeta === null) baseBeta = event.beta;
        if (baseGamma === null) baseGamma = event.gamma;
        const diffBeta = Math.max(-40, Math.min(40, event.beta - baseBeta));
        const diffGamma = Math.max(-40, Math.min(40, event.gamma - baseGamma));
        globalCursorX = diffGamma / 40;
        globalCursorY = diffBeta / 40;
        targetCameraX = globalCursorX * 2.2;
        targetCameraY = globalCursorY * 2.0;
      };
      window.addEventListener("deviceorientation", onDeviceOrientation, true);

      // ANIMATION LOOP WITH SAFE AUTO-THROTTLE
      let animId: number | null = null;
      const lastCardPos = new THREE.Vector3(999, 999, 999);
      let isInViewport = true;
      let lastRenderMs = performance.now();
      let lastLightModeApplied = liveRef.current.isLightMode;
      let slowFrames = 0;
      let measuredFrames = 0;
      let autoThrottled = false;

      const observer = new IntersectionObserver(
        ([entry]) => {
          isInViewport = entry.isIntersecting;
        },
        { threshold: 0.05 }
      );
      observer.observe(container);

      const springForce = new THREE.Vector3();
      const targetFloatKta = new THREE.Vector3();
      const eulerScratch = new THREE.Euler();
      const quatScratch = new THREE.Quaternion();
      const lookZero = new THREE.Vector3(0, 0, 0);

      function animate() {
        animId = requestAnimationFrame(animate);
        if (document.hidden || !isInViewport) {
          lastRenderMs = performance.now();
          return;
        }

        const nowMs = performance.now();
        const elapsedMs = nowMs - lastRenderMs;
        if (autoThrottled && !isDragging && elapsedMs < 24) {
          return;
        }
        lastRenderMs = nowMs;

        if (isMobile && !autoThrottled && elapsedMs < 150) {
          if (elapsedMs > 44) slowFrames++;
          measuredFrames++;
          if (measuredFrames >= 24) {
            if (slowFrames >= 14) {
              autoThrottled = true;
              renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
              renderer.setSize(window.innerWidth, window.innerHeight);
            }
            measuredFrames = 0;
            slowFrames = 0;
          }
        }

        const {
          isLightMode: lightNow,
          cardFormat: fmtNow,
          isFlipped: flippedNow,
        } = liveRef.current;

        // Instant in-place Day/Night studio transition (0 WebGL rebuilds)
        if (lightNow !== lastLightModeApplied) {
          lastLightModeApplied = lightNow;
          scene.environment = lightNow ? dayEnvRT.texture : nightEnvRT.texture;
          ambientLight.intensity = lightNow ? 0.95 : 0.72;
          hemiLight.intensity = lightNow ? 0.85 : 0.65;
          rimLight.intensity = lightNow ? 24 : 42;
          mouseLight.intensity = lightNow ? 16 : 36;
          dustMat.opacity = lightNow ? 0.16 : 0.42;
        }

        const time = nowMs * 0.001;
        const flipOffset = flippedNow ? Math.PI : 0;

        // Smooth interactive specular reflection light
        mouseLight.position.x += (globalCursorX * 14 - mouseLight.position.x) * 0.12;
        mouseLight.position.y += (globalCursorY * 10 - mouseLight.position.y) * 0.12;

        dustParticles.rotation.y += 0.00045;
        dustParticles.rotation.x += 0.00018;

        const isFocusedMode = fmtNow === "kta" || isMainInspect;
        if (!isFocusedMode) {
          camera.position.x += (targetCameraX - camera.position.x) * 0.06;
          camera.position.y += (targetCameraY - camera.position.y) * 0.06;
          if (!isDragging) {
            targetRotY = globalCursorX * 0.36;
            targetRotX = -globalCursorY * 0.36;
          }
        } else {
          camera.position.x += (0 - camera.position.x) * 0.1;
          camera.position.y += (0 - camera.position.y) * 0.1;
        }
        camera.lookAt(lookZero);

        // ID CARD MOTION (Showcase Hanging / Focused / Parked Aside)
        if (fmtNow === "kta") {
          idCard.position.lerp(idParkedPos, 0.08);
          eulerScratch.set(0.08, -0.35 + flipOffset, -0.05);
          quatScratch.setFromEuler(eulerScratch);
          idCard.quaternion.slerp(quatScratch, 0.08);
        } else if (isMainInspect) {
          idCard.position.lerp(mainViewPos, 0.09);
          eulerScratch.set(mainTargetRotX, mainTargetRotY + flipOffset, 0);
          quatScratch.setFromEuler(eulerScratch);
          idCard.quaternion.slerp(quatScratch, 0.12);
        } else {
          springForce.subVectors(targetPos, idCard.position).multiplyScalar(springK);
          velocity.add(springForce).multiplyScalar(damping);
          idCard.position.add(velocity);

          eulerScratch.set(targetRotX, targetRotY + flipOffset, 0);
          quatScratch.setFromEuler(eulerScratch);
          idCard.quaternion.slerp(quatScratch, 0.11);
        }

        // KTA CARD MOTION (Float Side / Center Stage)
        if (fmtNow === "kta") {
          ktaMesh.position.lerp(ktaViewPos, 0.09);
          eulerScratch.set(
            ktaTargetRotX + -globalCursorY * 0.08,
            ktaTargetRotY + globalCursorX * 0.12 + flipOffset,
            0
          );
          quatScratch.setFromEuler(eulerScratch);
          ktaMesh.quaternion.slerp(quatScratch, 0.12);
        } else {
          const floatY = Math.sin(time * 1.2) * 0.36;
          targetFloatKta.set(ktaRestPos.x, ktaRestPos.y + floatY, ktaRestPos.z);
          ktaMesh.position.lerp(targetFloatKta, 0.09);
          eulerScratch.set(
            -globalCursorY * 0.18 + 0.18,
            globalCursorX * 0.25 + 0.05 + flipOffset,
            Math.cos(time * 0.9) * 0.045
          );
          quatScratch.setFromEuler(eulerScratch);
          ktaMesh.quaternion.slerp(quatScratch, 0.08);
        }

        // Soft drop shadows track card positions (0 shadowMap cost)
        idShadowPlane.position.set(
          idCard.position.x + 0.55,
          idCard.position.y - 0.85,
          idCard.position.z - 2.6
        );
        const idShadowScale = Math.max(0.65, 1 - Math.abs(idCard.position.z) * 0.04);
        idShadowPlane.scale.setScalar(idShadowScale);
        idShadowMat.opacity =
          (lightNow ? 0.22 : 0.45) * (fmtNow === "kta" ? 0.25 : 1);

        ktaShadowPlane.position.set(
          ktaMesh.position.x + 0.45,
          ktaMesh.position.y - 0.7,
          ktaMesh.position.z - 2.2
        );
        ktaShadowMat.opacity =
          (lightNow ? 0.22 : 0.45) * (fmtNow === "kta" ? 1 : 0.4);

        // Zero-GC vertex buffer update only when ID Card moved noticeably
        if (isDragging || idCard.position.distanceToSquared(lastCardPos) > 0.0004) {
          updateLanyardVertexBuffers();
          lastCardPos.copy(idCard.position);
        }

        renderer.render(scene, camera);
        if (!hasNotifiedLoaded) {
          hasNotifiedLoaded = true;
          liveRef.current.onLoaded?.();
        }
      }
      animate();

      const onResize = () => {
        isMobile = isMobileViewport();
        const aspect = window.innerWidth / Math.max(1, window.innerHeight);
        camera.aspect = aspect;
        camera.fov = getCameraFov(isMobile);
        camera.position.z = getCameraZ(aspect, isMobile);
        camera.updateProjectionMatrix();

        ktaRestPos.copy(getKtaRestPos(isMobile));
        ktaViewPos.copy(getKtaViewPos(isMobile));
        mainViewPos.copy(getMainViewPos(isMobile));
        idParkedPos.set(isMobile ? 7.2 : 9.2, isMobile ? 4.4 : 2.2, -6.5);

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(getSovereignDpr(isMobile));
      };
      window.addEventListener("resize", onResize);

      cleanupFn = () => {
        isCancelled = true;
        observer.disconnect();
        if (animId) cancelAnimationFrame(animId);
        nightEnvRT.dispose();
        dayEnvRT.dispose();
        softShadowTex.dispose();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
        window.removeEventListener("deviceorientation", onDeviceOrientation, true);
        container.removeEventListener("pointerdown", handlePointerDown);

        scene.traverse((obj) => {
          const meshObj = obj as THREE_TYPES.Mesh;
          meshObj.geometry?.dispose?.();
          const mats = Array.isArray(meshObj.material)
            ? meshObj.material
            : meshObj.material
            ? [meshObj.material]
            : [];
          for (const mat of mats) {
            for (const val of Object.values(mat)) {
              if (val && typeof (val as { dispose?: () => void }).dispose === "function") {
                (val as { dispose: () => void }).dispose();
              }
            }
            if (typeof mat.dispose === "function") mat.dispose();
          }
        });
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      isCancelled = true;
      if (cleanupFn) cleanupFn();
    };
  }, [user, nomorId, fotoUrl, qrUrl]);

  return (
    <>
      {/* Tactical HUD (Desktop Safe Corner, Zero Mobile Overlap) */}
      <div
        className="tactical-hud"
        style={{
          position: "absolute",
          bottom: "max(18px, env(safe-area-inset-bottom, 18px))",
          left: "max(22px, env(safe-area-inset-left, 22px))",
          zIndex: 15,
          color: isLightMode ? "#52525b" : "rgba(212,175,55,0.8)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.05em",
          lineHeight: 1.5,
          pointerEvents: "none",
          maxWidth: 210,
        }}
      >
        EXPEDIENT 43 · KTA 3D
        <br />
        STATUS: TERVERIFIKASI
        <br />
        {(user.nama_panggilan || user.nama_lengkap).toUpperCase()}
      </div>

      {/* Subtle Interaction Cue Below Center Dock Transition */}
      <div
        id="uxOverlay"
        style={{
          position: "absolute",
          bottom: "max(118px, calc(env(safe-area-inset-bottom, 20px) + 104px))",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
          zIndex: 20,
          pointerEvents: "none",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <i
          className="fa-solid fa-hand-pointer ux-icon"
          style={{
            color: "#d4af37",
            fontSize: 16,
            filter: "drop-shadow(0 0 10px rgba(212,175,55,0.6))",
          }}
        />
        <span
          className="ux-text"
          style={{
            color: isLightMode ? "#27272a" : "#d4af37",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.8,
            textShadow: isLightMode ? "none" : "0 0 10px #000",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {cardFormat === "kta"
            ? "Putar Kartu KTA • Ketuk Balik untuk QR"
            : "Tarik Kartu • Klik 2x Fokus"}
        </span>
      </div>

      {/* Transparent WebGL Stage Over CSS Marble Gallery */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          position: "absolute",
          inset: 0,
          zIndex: 10,
          outline: "none",
          pointerEvents: "auto",
          touchAction: "none",
        }}
      />
    </>
  );
}
