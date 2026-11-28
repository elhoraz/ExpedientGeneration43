"use client";

import { useEffect, useRef } from "react";
import type * as THREE_TYPES from "three";
import {
  type CardIdentityData,
  type CardThemeMode,
  type LoadedCardAssets,
  createMarbleWallCanvas,
  createWovenStrapCanvas,
  drawIdBackFace,
  drawIdFrontFace,
  drawKtaBackFace,
  drawKtaFrontFace,
  loadArtworkImage,
} from "./cardArtwork";

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

interface CardTextureSet {
  colorCanvas: HTMLCanvasElement;
  pbrCanvas: HTMLCanvasElement;
  bumpCanvas: HTMLCanvasElement | null;
  cCtx: CanvasRenderingContext2D;
  pCtx: CanvasRenderingContext2D;
  bCtx: CanvasRenderingContext2D | null;
  colorTex: THREE_TYPES.CanvasTexture;
  pbrTex: THREE_TYPES.CanvasTexture;
  bumpTex: THREE_TYPES.CanvasTexture | null;
}

/**
 * Generates an extruded beveled card BufferGeometry with optional true pass-through
 * die-cut lanyard slot hole and strict planar Front (+Z) / Back (-Z) UV separation
 * so thick chamfered 24K gold bevels stay gleaming around edges and inner slot walls.
 */
function createDieCutCardGeometry(
  THREE: typeof THREE_TYPES,
  width: number,
  height: number,
  bodyDepth: number,
  cornerRadius: number,
  isMobile: boolean,
  slotHole?: { width: number; height: number; centerY: number }
): THREE_TYPES.BufferGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const r = cornerRadius;

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw, hh - r);
  shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw + r, hh);
  shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw, -hh + r);
  shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);

  if (slotHole) {
    const sw = slotHole.width / 2;
    const sr = slotHole.height / 2;
    const cy = slotHole.centerY;
    const hole = new THREE.Path();
    hole.moveTo(-sw + sr, cy + sr);
    hole.lineTo(sw - sr, cy + sr);
    hole.absarc(sw - sr, cy, sr, Math.PI / 2, -Math.PI / 2, true);
    hole.lineTo(-sw + sr, cy - sr);
    hole.absarc(-sw + sr, cy, sr, -Math.PI / 2, Math.PI / 2, true);
    shape.holes.push(hole);
  }

  const raw = new THREE.ExtrudeGeometry(shape, {
    depth: bodyDepth,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: isMobile ? 2 : 3,
    curveSegments: isMobile ? 10 : 16,
  });
  raw.translate(0, 0, -bodyDepth / 2);

  const srcPos = raw.attributes.position;
  const srcNrm = raw.attributes.normal;
  const srcUv = raw.attributes.uv;

  let maxZ = -Infinity;
  let minZ = Infinity;
  for (let i = 0; i < srcPos.count; i++) {
    const z = srcPos.getZ(i);
    if (z > maxZ) maxZ = z;
    if (z < minZ) minZ = z;
  }

  const frontIdx: number[] = [];
  const backIdx: number[] = [];
  const sideIdx: number[] = [];

  let fMinX = Infinity;
  let fMaxX = -Infinity;
  let fMinY = Infinity;
  let fMaxY = -Infinity;
  let bMinX = Infinity;
  let bMaxX = -Infinity;
  let bMinY = Infinity;
  let bMaxY = -Infinity;

  for (let i = 0; i < srcPos.count; i += 3) {
    const nz = (srcNrm.getZ(i) + srcNrm.getZ(i + 1) + srcNrm.getZ(i + 2)) / 3;
    const z0 = srcPos.getZ(i);
    const z1 = srcPos.getZ(i + 1);
    const z2 = srcPos.getZ(i + 2);

    if (
      nz > 0.995 &&
      Math.abs(z0 - maxZ) < 0.001 &&
      Math.abs(z1 - maxZ) < 0.001 &&
      Math.abs(z2 - maxZ) < 0.001
    ) {
      frontIdx.push(i, i + 1, i + 2);
      for (let k = 0; k < 3; k++) {
        fMinX = Math.min(fMinX, srcPos.getX(i + k));
        fMaxX = Math.max(fMaxX, srcPos.getX(i + k));
        fMinY = Math.min(fMinY, srcPos.getY(i + k));
        fMaxY = Math.max(fMaxY, srcPos.getY(i + k));
      }
    } else if (
      nz < -0.995 &&
      Math.abs(z0 - minZ) < 0.001 &&
      Math.abs(z1 - minZ) < 0.001 &&
      Math.abs(z2 - minZ) < 0.001
    ) {
      backIdx.push(i, i + 1, i + 2);
      for (let k = 0; k < 3; k++) {
        bMinX = Math.min(bMinX, srcPos.getX(i + k));
        bMaxX = Math.max(bMaxX, srcPos.getX(i + k));
        bMinY = Math.min(bMinY, srcPos.getY(i + k));
        bMaxY = Math.max(bMaxY, srcPos.getY(i + k));
      }
    } else {
      sideIdx.push(i, i + 1, i + 2);
    }
  }

  const totalVerts = sideIdx.length + frontIdx.length + backIdx.length;
  const outPos = new Float32Array(totalVerts * 3);
  const outNrm = new Float32Array(totalVerts * 3);
  const outUv = new Float32Array(totalVerts * 2);

  const fSpanX = Math.max(0.001, fMaxX - fMinX);
  const fSpanY = Math.max(0.001, fMaxY - fMinY);
  const bSpanX = Math.max(0.001, bMaxX - bMinX);
  const bSpanY = Math.max(0.001, bMaxY - bMinY);

  let writeCursor = 0;
  const copyBucket = (indices: number[], uvMode: "side" | "front" | "back") => {
    const start = writeCursor;
    for (const srcIdx of indices) {
      const px = srcPos.getX(srcIdx);
      const py = srcPos.getY(srcIdx);
      const pz = srcPos.getZ(srcIdx);

      outPos[writeCursor * 3] = px;
      outPos[writeCursor * 3 + 1] = py;
      outPos[writeCursor * 3 + 2] = pz;

      outNrm[writeCursor * 3] = srcNrm.getX(srcIdx);
      outNrm[writeCursor * 3 + 1] = srcNrm.getY(srcIdx);
      outNrm[writeCursor * 3 + 2] = srcNrm.getZ(srcIdx);

      if (uvMode === "front") {
        outUv[writeCursor * 2] = (px - fMinX) / fSpanX;
        outUv[writeCursor * 2 + 1] = (py - fMinY) / fSpanY;
      } else if (uvMode === "back") {
        outUv[writeCursor * 2] = 1 - (px - bMinX) / bSpanX;
        outUv[writeCursor * 2 + 1] = (py - bMinY) / bSpanY;
      } else {
        outUv[writeCursor * 2] = srcUv.getX(srcIdx);
        outUv[writeCursor * 2 + 1] = srcUv.getY(srcIdx);
      }
      writeCursor++;
    }
    return { start, count: indices.length };
  };

  const sideSpan = copyBucket(sideIdx, "side");
  const frontSpan = copyBucket(frontIdx, "front");
  const backSpan = copyBucket(backIdx, "back");

  raw.dispose();

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(outPos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(outNrm, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(outUv, 2));
  out.addGroup(sideSpan.start, sideSpan.count, 0);
  out.addGroup(frontSpan.start, frontSpan.count, 1);
  out.addGroup(backSpan.start, backSpan.count, 2);
  out.computeBoundingSphere();
  return out;
}

/** Builds a thin raised 24K gold rectangular bezel frame that sits strictly proud of card face Z. */
function createRaisedRectBezelGeometry(
  THREE: typeof THREE_TYPES,
  outerW: number,
  outerH: number,
  rimThickness: number,
  cornerRadius: number,
  extrudeDepth: number
): THREE_TYPES.ExtrudeGeometry {
  const hw = outerW / 2;
  const hh = outerH / 2;
  const r = cornerRadius;

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw, hh - r);
  shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw + r, hh);
  shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw, -hh + r);
  shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);

  const ihw = hw - rimThickness;
  const ihh = hh - rimThickness;
  const ir = Math.max(0.02, r - rimThickness);
  const hole = new THREE.Path();
  hole.moveTo(-ihw + ir, ihh);
  hole.lineTo(ihw - ir, ihh);
  hole.absarc(ihw - ir, ihh - ir, ir, Math.PI / 2, 0, true);
  hole.lineTo(ihw, -ihh + ir);
  hole.absarc(ihw - ir, -ihh + ir, ir, 0, -Math.PI / 2, true);
  hole.lineTo(-ihw + ir, -ihh);
  hole.absarc(-ihw + ir, -ihh + ir, ir, -Math.PI / 2, -Math.PI, true);
  hole.lineTo(-ihw, ihh - ir);
  hole.absarc(-ihw + ir, ihh - ir, ir, Math.PI, Math.PI / 2, true);
  shape.holes.push(hole);

  return new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 8,
  });
}

/** Builds a smooth uniform-thickness oval carabiner wire passing cleanly through the die-cut hole. */
function createOvalCarabinerGeometry(
  THREE: typeof THREE_TYPES,
  centerY: number,
  heightSpan: number,
  depthHalf: number,
  wireRadius: number,
  isMobile: boolean
): THREE_TYPES.TubeGeometry {
  const halfH = heightSpan / 2;
  const pts = [
    new THREE.Vector3(0, centerY - halfH, 0),
    new THREE.Vector3(0, centerY - halfH * 0.72, depthHalf),
    new THREE.Vector3(0, centerY + halfH * 0.72, depthHalf),
    new THREE.Vector3(0, centerY + halfH, 0),
    new THREE.Vector3(0, centerY + halfH * 0.72, -depthHalf),
    new THREE.Vector3(0, centerY - halfH * 0.72, -depthHalf),
  ];
  const loopCurve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.35);
  return new THREE.TubeGeometry(
    loopCurve,
    isMobile ? 20 : 32,
    wireRadius,
    isMobile ? 8 : 12,
    true
  );
}

/**
 * Allocates one flat woven satin ribbon BufferGeometry once and updates vertex positions
 * and surface normals (+Z forward-facing) in-place with zero per-frame allocations.
 */
function createDynamicRibbonStrap(
  THREE: typeof THREE_TYPES,
  lengthSegments: number,
  halfWidth: number,
  halfThick: number
) {
  const profX = [
    -halfWidth,
    -halfWidth * 0.88,
    halfWidth * 0.88,
    halfWidth,
    halfWidth * 0.88,
    -halfWidth * 0.88,
    -halfWidth,
  ];
  const profZ = [0, halfThick, halfThick, 0, -halfThick, -halfThick, 0];
  const uStrip = [0, 0.08, 0.92, 1.0, 0.92, 0.08, 0];
  const ringVerts = profX.length;
  const ringCount = lengthSegments + 1;
  const vertexCount = ringCount * ringVerts;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  for (let i = 0; i <= lengthSegments; i++) {
    const v = 1 - i / lengthSegments;
    for (let j = 0; j < ringVerts; j++) {
      const uvIdx = (i * ringVerts + j) * 2;
      uvs[uvIdx] = uStrip[j];
      uvs[uvIdx + 1] = v;
    }
  }

  for (let i = 0; i < lengthSegments; i++) {
    for (let j = 0; j < ringVerts - 1; j++) {
      const a = i * ringVerts + j;
      const b = (i + 1) * ringVerts + j;
      const c = (i + 1) * ringVerts + (j + 1);
      const d = i * ringVerts + (j + 1);
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

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const topRight = new THREE.Vector3(1, 0, 0);
  const cardRight = new THREE.Vector3();
  const desiredRight = new THREE.Vector3();
  const strapNormal = new THREE.Vector3();
  const orthoRight = new THREE.Vector3();
  const vertNormal = new THREE.Vector3();

  function update(
    curve: THREE_TYPES.Curve<THREE_TYPES.Vector3>,
    cardQuaternion: THREE_TYPES.Quaternion
  ) {
    cardRight.set(1, 0, 0).applyQuaternion(cardQuaternion).normalize();
    if (cardRight.x < 0) cardRight.negate();

    for (let i = 0; i <= lengthSegments; i++) {
      const t = i / lengthSegments;
      curve.getPointAt(t, point);
      curve.getTangentAt(t, tangent).normalize();

      desiredRight.copy(topRight).lerp(cardRight, t).normalize();
      strapNormal.crossVectors(tangent, desiredRight);
      if (strapNormal.lengthSq() < 1e-5) {
        strapNormal.set(0, 0, 1);
      } else {
        strapNormal.normalize();
      }
      orthoRight.crossVectors(strapNormal, tangent).normalize();

      for (let j = 0; j < ringVerts; j++) {
        const px = profX[j];
        const pz = profZ[j];
        const idx = (i * ringVerts + j) * 3;
        positions[idx] = point.x + orthoRight.x * px + strapNormal.x * pz;
        positions[idx + 1] = point.y + orthoRight.y * px + strapNormal.y * pz;
        positions[idx + 2] = point.z + orthoRight.z * px + strapNormal.z * pz;

        vertNormal
          .set(
            orthoRight.x * (px / halfWidth) * 0.25 + strapNormal.x * (pz / halfThick),
            orthoRight.y * (px / halfWidth) * 0.25 + strapNormal.y * (pz / halfThick),
            orthoRight.z * (px / halfWidth) * 0.25 + strapNormal.z * (pz / halfThick)
          )
          .normalize();
        normals[idx] = vertNormal.x;
        normals[idx + 1] = vertNormal.y;
        normals[idx + 2] = vertNormal.z;
      }
    }

    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
    geometry.computeBoundingSphere();
  }

  return { geometry, update };
}

/** Restrained holographic edge-foil diffraction shader reading mask from texelRoughness.r. */
function applyHologramFoilShader(
  material: THREE_TYPES.MeshPhysicalMaterial,
  uniforms: {
    uHoloTilt: { value: number };
    uHoloStrength: { value: number };
  }
) {
  material.customProgramCacheKey = () => "sovereign-holo-v2";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHoloTilt = uniforms.uHoloTilt;
    shader.uniforms.uHoloStrength = uniforms.uHoloStrength;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `uniform float uHoloTilt;
uniform float uHoloStrength;
#include <common>`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
#ifdef USE_ROUGHNESSMAP
  float _holoMask = texelRoughness.r;
  if (_holoMask > 0.04) {
    vec3 _vDir = normalize(vViewPosition);
    float _ndv = clamp(abs(dot(normalize(normal), _vDir)), 0.0, 1.0);
    float _phase = (_vDir.x * 2.0 + _vDir.y * 1.2) + (1.0 - _ndv) * 2.2 + vRoughnessMapUv.x * 1.3 + vRoughnessMapUv.y * 0.7 + uHoloTilt;
    vec3 _prism = vec3(
      0.58 + 0.42 * cos(6.28318 * (_phase + 0.04)),
      0.56 + 0.44 * cos(6.28318 * (_phase + 0.22)),
      0.46 + 0.54 * cos(6.28318 * (_phase + 0.55))
    );
    float _glint = smoothstep(0.18, 0.94, pow(0.5 + 0.5 * sin(_phase * 3.14159), 2.0));
    totalEmissiveRadiance += _prism * _holoMask * (0.2 + 0.8 * _glint) * uHoloStrength;
  }
#endif`
      );
  };
}

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

  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    let isCancelled = false;
    let hasNotifiedLoaded = false;

    const container = containerRef.current;
    if (!container) return;

    const identity: CardIdentityData = {
      nama: user.nama_lengkap,
      panggilan: user.nama_panggilan || user.nama_lengkap,
      nomorId,
      angkatanLabel: "ALUMNI ANGKATAN KE-43",
      berlakuLabel: "BERLAKU SELAMANYA",
      maskedCardNumber: `4300 •••• •••• ${nomorId.replace("EXP-", "")}`,
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
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      fontsReadyPromise,
    ]).then(([THREE, { RoomEnvironment }]) => {
      if (isCancelled || !containerRef.current) return;

      const isMobileViewport = () =>
        window.innerWidth < 768 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);

      let isMobile = isMobileViewport();

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
      const navAny = navigator as unknown as { deviceMemory?: number };
      const devMem = typeof navAny.deviceMemory === "number" ? navAny.deviceMemory : null;
      const isWeakRam = devMem !== null && devMem <= 2;

      const getCameraFov = (mob: boolean) => (mob ? 48 : 44);
      const getCameraZ = (aspect: number, mob: boolean) => {
        if (!mob) return 27;
        return aspect < 0.68 ? 27.5 : 25.5;
      };

      const getSovereignDpr = (mob: boolean) => {
        const dpr = window.devicePixelRatio || 1;
        if (!mob) return Math.min(dpr, 2);
        if (isUltraEntryGpu || isWeakRam) return Math.min(dpr, 1.35);
        return Math.min(dpr, 1.75);
      };

      const scene = new THREE.Scene();
      if (!isMobile) {
        scene.fog = new THREE.FogExp2(
          liveRef.current.isLightMode ? 0xf5f2ea : 0x050911,
          liveRef.current.isLightMode ? 0.007 : 0.015
        );
      }

      const aspectInit = window.innerWidth / Math.max(1, window.innerHeight);
      const camera = new THREE.PerspectiveCamera(
        getCameraFov(isMobile),
        aspectInit,
        0.1,
        180
      );
      camera.position.set(0, 0, getCameraZ(aspectInit, isMobile));

      const renderer = new THREE.WebGLRenderer({
        antialias: !isUltraEntryGpu,
        alpha: true,
        powerPreference: "high-performance",
        precision: isUltraEntryGpu ? "mediump" : "highp",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(getSovereignDpr(isMobile));
      renderer.shadowMap.enabled = !isMobile;
      if (!isMobile) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      // 360° RoomEnvironment baked once
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnvRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = roomEnvRT.texture;
      pmremGenerator.dispose();

      // WARM GOLDEN STUDIO LIGHTING
      const ambientLight = new THREE.AmbientLight(
        0xffffff,
        liveRef.current.isLightMode ? 1.55 : 0.8
      );
      scene.add(ambientLight);

      const spotLight = new THREE.SpotLight(
        liveRef.current.isLightMode ? 0xffffff : 0xffeedd,
        liveRef.current.isLightMode ? 185 : 145
      );
      spotLight.position.set(10, 28, 26);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.82;
      if (!isMobile) {
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.bias = -0.00015;
      }
      scene.add(spotLight);

      const rimLight = new THREE.PointLight(
        0xffd700,
        liveRef.current.isLightMode ? 36 : 68,
        48
      );
      rimLight.position.set(-10, -5, 11);
      scene.add(rimLight);

      const cardGlowLight = new THREE.PointLight(
        0xffaa00,
        liveRef.current.isLightMode ? 0 : 38,
        22
      );
      cardGlowLight.position.set(0, 0, -1.5);
      scene.add(cardGlowLight);

      // FRONT-MOUNTED GOLD CURSOR SPOTLIGHT (+7.2 Z illuminates both front card relief & marble stage!)
      const mouseLight = new THREE.PointLight(
        liveRef.current.isLightMode ? 0xfff5d6 : 0xffd700,
        liveRef.current.isLightMode ? 28 : 72,
        48
      );
      mouseLight.position.set(0, 0, 7.2);
      scene.add(mouseLight);

      // AMBIENT GOLD DUST PARTICLES
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = isUltraEntryGpu || isWeakRam ? 24 : isMobile ? 48 : 220;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i += 3) {
        dustPos[i] = (Math.random() - 0.5) * 42;
        dustPos[i + 1] = (Math.random() - 0.5) * 34;
        dustPos[i + 2] = (Math.random() - 0.5) * 18 - 1;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        size: isMobile ? 0.08 : 0.075,
        color: 0xffd700,
        transparent: true,
        opacity: liveRef.current.isLightMode ? 0.14 : 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);

      // SINGLE OPAQUE 3D MARBLE STUDIO WALL (Glossy clearcoat on Desktop, fast 512px opaque on Mobile)
      const marbleTexSize = isMobile ? 512 : 2048;
      const nightMarbleTex = new THREE.CanvasTexture(
        createMarbleWallCanvas(false, marbleTexSize)
      );
      nightMarbleTex.colorSpace = THREE.SRGBColorSpace;
      const dayMarbleTex = new THREE.CanvasTexture(
        createMarbleWallCanvas(true, marbleTexSize)
      );
      dayMarbleTex.colorSpace = THREE.SRGBColorSpace;

      const marbleMat = isMobile
        ? new THREE.MeshStandardMaterial({
            map: liveRef.current.isLightMode ? dayMarbleTex : nightMarbleTex,
            metalness: 0.14,
            roughness: 0.15,
            transparent: false,
          })
        : new THREE.MeshPhysicalMaterial({
            map: liveRef.current.isLightMode ? dayMarbleTex : nightMarbleTex,
            metalness: 0.15,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            transparent: false,
          });
      const marbleWall = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), marbleMat);
      marbleWall.position.set(0, 0, -10);
      if (!isMobile) marbleWall.receiveShadow = true;
      scene.add(marbleWall);

      const goldHardwareMat = new THREE.MeshStandardMaterial({
        color: 0xf0c954,
        metalness: 0.98,
        roughness: 0.12,
        envMapIntensity: 1.65,
      });
      const gunmetalMat = new THREE.MeshStandardMaterial({
        color: 0x1b222e,
        metalness: 0.88,
        roughness: 0.22,
        envMapIntensity: 1.2,
      });

      // DESKTOP ARCHITECTURAL 3D GOLD VAULT HALO RINGS (Adds rich multi-layered 3D depth)
      let vaultRingsGroup: THREE_TYPES.Group | null = null;
      let outerVaultRing: THREE_TYPES.Mesh | null = null;
      let innerVaultRing: THREE_TYPES.Mesh | null = null;
      if (!isMobile) {
        vaultRingsGroup = new THREE.Group();
        vaultRingsGroup.position.set(0, 0.2, -5.8);

        outerVaultRing = new THREE.Mesh(
          new THREE.TorusGeometry(9.4, 0.026, 12, 96),
          goldHardwareMat
        );
        vaultRingsGroup.add(outerVaultRing);

        // Four subtle diamond stud accents along outer ring
        const studGeo = new THREE.OctahedronGeometry(0.14, 0);
        const studCoords: [number, number][] = [
          [9.4, 0],
          [-9.4, 0],
          [0, 9.4],
          [0, -9.4],
        ];
        for (const [sx, sy] of studCoords) {
          const stud = new THREE.Mesh(studGeo, goldHardwareMat);
          stud.position.set(sx, sy, 0);
          outerVaultRing.add(stud);
        }

        innerVaultRing = new THREE.Mesh(
          new THREE.TorusGeometry(7.2, 0.022, 12, 80),
          goldHardwareMat
        );
        innerVaultRing.rotation.x = 0.24;
        innerVaultRing.rotation.y = -0.18;
        vaultRingsGroup.add(innerVaultRing);
        scene.add(vaultRingsGroup);
      }

      // TOP MOUNT & SWIVEL ANCHOR
      const anchorPos = new THREE.Vector3(0, 11.4, -0.55);
      const mountGroup = new THREE.Group();
      mountGroup.position.copy(anchorPos);

      const mountBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.7, 0.44, isMobile ? 18 : 48),
        goldHardwareMat
      );
      mountBase.rotation.x = Math.PI / 2;
      mountBase.position.z = -0.32;
      if (!isMobile) mountBase.castShadow = true;
      mountGroup.add(mountBase);

      const mountCollar = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.28, 0.24),
        gunmetalMat
      );
      mountCollar.position.z = -0.02;
      mountGroup.add(mountCollar);
      scene.add(mountGroup);

      // SCALED CARD TEXTURES
      const texScale = isMobile ? 0.75 : 1.0;

      function createTextureSet(baseW: number, baseH: number): CardTextureSet {
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

        const setupTex = (canvas: HTMLCanvasElement, colorSpace: THREE_TYPES.ColorSpace) => {
          const tex = new THREE.CanvasTexture(canvas);
          tex.flipY = true;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.colorSpace = colorSpace;
          tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isMobile ? 4 : 16);
          return tex;
        };

        return {
          colorCanvas,
          pbrCanvas,
          bumpCanvas,
          cCtx,
          pCtx,
          bCtx,
          colorTex: setupTex(colorCanvas, THREE.SRGBColorSpace),
          pbrTex: setupTex(pbrCanvas, THREE.NoColorSpace),
          bumpTex: bumpCanvas ? setupTex(bumpCanvas, THREE.NoColorSpace) : null,
        };
      }

      const idFrontSet = createTextureSet(1024, 1624);
      const idBackSet = createTextureSet(1024, 1624);
      const ktaFrontSet = createTextureSet(1024, 640);
      const ktaBackSet = createTextureSet(1024, 640);

      const loadedAssets: LoadedCardAssets = {};

      function paintAllFaces(theme: CardThemeMode) {
        drawIdFrontFace(
          { cCtx: idFrontSet.cCtx, pCtx: idFrontSet.pCtx, bCtx: idFrontSet.bCtx },
          identity,
          theme,
          loadedAssets
        );
        drawIdBackFace(
          { cCtx: idBackSet.cCtx, pCtx: idBackSet.pCtx, bCtx: idBackSet.bCtx },
          identity,
          theme,
          loadedAssets
        );
        drawKtaFrontFace(
          { cCtx: ktaFrontSet.cCtx, pCtx: ktaFrontSet.pCtx, bCtx: ktaFrontSet.bCtx },
          identity,
          theme,
          loadedAssets
        );
        drawKtaBackFace(
          { cCtx: ktaBackSet.cCtx, pCtx: ktaBackSet.pCtx, bCtx: ktaBackSet.bCtx },
          identity,
          theme,
          loadedAssets
        );

        for (const s of [idFrontSet, idBackSet, ktaFrontSet, ktaBackSet]) {
          s.colorTex.needsUpdate = true;
          s.pbrTex.needsUpdate = true;
          if (s.bumpTex) s.bumpTex.needsUpdate = true;
        }
      }

      const initialTheme: CardThemeMode = liveRef.current.isLightMode ? "light" : "dark";
      paintAllFaces(initialTheme);

      const holoUniforms = {
        uHoloTilt: { value: 0 },
        uHoloStrength: { value: isUltraEntryGpu ? 0.14 : 0.22 },
      };

      const createLuxuryCardMaterial = (set: CardTextureSet) => {
        const mat = new THREE.MeshPhysicalMaterial({
          map: set.colorTex,
          roughness: 1.0,
          metalness: 1.0,
          roughnessMap: set.pbrTex,
          metalnessMap: set.pbrTex,
          clearcoat: isUltraEntryGpu ? 0.0 : 0.9,
          clearcoatRoughness: 0.08,
          envMapIntensity: 1.45,
          ...(set.bumpTex ? { bumpMap: set.bumpTex, bumpScale: 0.028 } : {}),
        });
        applyHologramFoilShader(mat, holoUniforms);
        return mat;
      };

      // ID CARD HINGE PIVOT GROUP + REAL RAISED 3D GOLD SURFACE RELIEF
      const hookOffsetY = 4.94;
      const idPivotGroup = new THREE.Group();
      const idCardContainer = new THREE.Group();
      idCardContainer.position.set(0, -hookOffsetY, 0);
      idPivotGroup.add(idCardContainer);
      scene.add(idPivotGroup);

      const cardWidth = 5.4;
      const cardHeight = 8.6;
      const idCardGeo = createDieCutCardGeometry(
        THREE,
        cardWidth,
        cardHeight,
        0.08,
        0.34,
        isMobile,
        { width: 1.04, height: 0.23, centerY: 3.718 }
      );
      const idCard = new THREE.Mesh(idCardGeo, [
        goldHardwareMat,
        createLuxuryCardMaterial(idFrontSet),
        createLuxuryCardMaterial(idBackSet),
      ]);
      if (!isMobile) idCard.castShadow = true;
      idCardContainer.add(idCard);

      // Raised 3D 24K Gold Relief Trim mounted strictly proud of +0.062 front face
      const idChipBezel = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 0.68, 0.53, 0.036, 0.085, 0.016),
        goldHardwareMat
      );
      idChipBezel.position.set(-1.698, 3.103, 0.064);
      idCardContainer.add(idChipBezel);

      const idCrestRing3D = new THREE.Mesh(
        new THREE.TorusGeometry(0.39, 0.025, isMobile ? 8 : 14, isMobile ? 24 : 36),
        goldHardwareMat
      );
      idCrestRing3D.position.set(1.677, 3.071, 0.066);
      idCardContainer.add(idCrestRing3D);

      if (!isMobile) {
        const idPhotoFrame3D = new THREE.Mesh(
          createRaisedRectBezelGeometry(THREE, 3.88, 3.54, 0.035, 0.14, 0.016),
          goldHardwareMat
        );
        idPhotoFrame3D.position.set(0, 0.71, 0.063);
        idCardContainer.add(idPhotoFrame3D);
      }

      // Articulated carabiner passing cleanly through die-cut slot hole
      const carabinerMesh = new THREE.Mesh(
        createOvalCarabinerGeometry(THREE, 4.19, 0.94, 0.155, 0.056, isMobile),
        gunmetalMat
      );
      if (!isMobile) carabinerMesh.castShadow = true;
      idCardContainer.add(carabinerMesh);

      const clampBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.34, isMobile ? 12 : 20),
        goldHardwareMat
      );
      clampBarrel.position.set(0, 4.72, 0);
      idCardContainer.add(clampBarrel);

      const clampCollar = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.22, 0.18),
        goldHardwareMat
      );
      clampCollar.position.set(0, 4.92, 0);
      if (!isMobile) clampCollar.castShadow = true;
      idCardContainer.add(clampCollar);

      // WOVEN FLAT RIBBON LANYARD + CENTERED VERLET PENDULUM
      const strapCanvas = createWovenStrapCanvas();
      const strapTex = new THREE.CanvasTexture(strapCanvas);
      strapTex.wrapS = THREE.RepeatWrapping;
      strapTex.wrapT = THREE.RepeatWrapping;
      strapTex.repeat.set(1, 3.0);
      strapTex.colorSpace = THREE.SRGBColorSpace;
      strapTex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isMobile ? 4 : 8);

      const strapMat = new THREE.MeshStandardMaterial({
        map: strapTex,
        roughness: 0.56,
        metalness: 0.24,
        envMapIntensity: 1.05,
      });

      const ribbonStrap = createDynamicRibbonStrap(THREE, isMobile ? 20 : 28, 0.29, 0.02);
      const lanyardMesh = new THREE.Mesh(ribbonStrap.geometry, strapMat);
      if (!isMobile) lanyardMesh.castShadow = true;
      scene.add(lanyardMesh);

      const VERLET_NODES = 6;
      const restCardCenterY = 0.22;
      const restHookWorld = new THREE.Vector3(0, restCardCenterY + hookOffsetY, 0);
      const totalRopeLen = anchorPos.distanceTo(restHookWorld) + 0.04;
      const segLen = totalRopeLen / (VERLET_NODES - 1);

      const verletPos = Array.from({ length: VERLET_NODES }, (_, i) =>
        new THREE.Vector3().lerpVectors(anchorPos, restHookWorld, i / (VERLET_NODES - 1))
      );
      const verletPrev = verletPos.map((p) => p.clone());
      idPivotGroup.position.copy(restHookWorld);
      const ropeCurve = new THREE.CatmullRomCurve3(verletPos);

      // HORIZONTAL KTA CARD WITH REAL 3D GOLD BEZEL RELIEFS
      const ktaWidth = 5.4;
      const ktaHeight = 3.4;
      const ktaGeo = createDieCutCardGeometry(
        THREE,
        ktaWidth,
        ktaHeight,
        0.055,
        0.26,
        isMobile
      );
      const ktaMesh = new THREE.Mesh(ktaGeo, [
        goldHardwareMat,
        createLuxuryCardMaterial(ktaFrontSet),
        createLuxuryCardMaterial(ktaBackSet),
      ]);
      if (!isMobile) ktaMesh.castShadow = true;
      scene.add(ktaMesh);

      const ktaChipBezel = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 0.59, 0.45, 0.03, 0.075, 0.015),
        goldHardwareMat
      );
      ktaChipBezel.position.set(-2.036, 1.11, 0.051);
      ktaMesh.add(ktaChipBezel);

      const ktaCrestRing3D = new THREE.Mesh(
        new THREE.TorusGeometry(0.274, 0.022, isMobile ? 8 : 12, isMobile ? 20 : 32),
        goldHardwareMat
      );
      ktaCrestRing3D.position.set(2.13, 1.094, 0.052);
      ktaMesh.add(ktaCrestRing3D);

      const ktaAvatarRing3D = new THREE.Mesh(
        new THREE.TorusGeometry(0.592, 0.026, isMobile ? 8 : 14, isMobile ? 24 : 36),
        goldHardwareMat
      );
      ktaAvatarRing3D.position.set(1.698, -0.574, 0.052);
      ktaMesh.add(ktaAvatarRing3D);

      const getKtaRestPos = (mob: boolean) =>
        mob ? new THREE.Vector3(-4.2, -5.0, -4.6) : new THREE.Vector3(-7.6, -0.1, -1.2);
      const getKtaViewPos = (mob: boolean) =>
        mob ? new THREE.Vector3(0, 0.25, 6.4) : new THREE.Vector3(0, 0.15, 14.5);
      const getMainViewPos = (mob: boolean) =>
        mob ? new THREE.Vector3(0, 0.25, 5.2) : new THREE.Vector3(0, 0.1, 14.0);

      const ktaRestPos = getKtaRestPos(isMobile);
      const ktaViewPos = getKtaViewPos(isMobile);
      const mainViewPos = getMainViewPos(isMobile);
      const idParkedPos = new THREE.Vector3(
        isMobile ? 7.2 : 9.2,
        isMobile ? 4.4 : 2.2,
        -6.5
      );
      ktaMesh.position.copy(ktaRestPos);

      Promise.all([
        loadArtworkImage("/images/logo-utuh.webp"),
        loadArtworkImage(fotoUrl),
        loadArtworkImage(qrUrl),
      ]).then(([crestImg, avatarImg, qrImg]) => {
        if (isCancelled) return;
        loadedAssets.crestImg = crestImg;
        loadedAssets.avatarImg = avatarImg;
        loadedAssets.qrImg = qrImg;
        paintAllFaces(liveRef.current.isLightMode ? "light" : "dark");
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

      const dragTargetHook = new THREE.Vector3().copy(restHookWorld);
      let targetRotY = 0;
      let previousPointer = { x: 0, y: 0 };
      let globalCursorX = 0;
      let globalCursorY = 0;
      let targetCameraX = 0;
      let targetCameraY = 0;

      resetOnFormatChangeRef.current = (nextFmt) => {
        isMainInspect = false;
        mainTargetRotX = 0;
        mainTargetRotY = 0;
        ktaTargetRotX = 0;
        ktaTargetRotY = 0;
        if (nextFmt === "id") {
          dragTargetHook.copy(restHookWorld);
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
        targetCameraX = normX * 2.0;
        targetCameraY = normY * 1.8;

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

        dragTargetHook.x = normX * (isMobile ? 8.5 : 12.0);
        dragTargetHook.y =
          Math.max(-3.0, Math.min(5.2, normY * (isMobile ? 6.5 : 9.0))) + hookOffsetY;
        dragTargetHook.z = 2.4;
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
          dragTargetHook.copy(restHookWorld);
        }

        if (!wasTap) return;

        const nowTap = performance.now();
        const isDoubleTap = nowTap - lastTapTime < 320;
        lastTapTime = nowTap;

        setPointerRay(event.clientX, event.clientY);
        const hitKta = raycaster.intersectObject(ktaMesh, true).length > 0;
        const hitId = raycaster.intersectObject(idPivotGroup, true).length > 0;

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
            targetRotY = 0;
          } else if (isMainInspect && !hitId) {
            isMainInspect = false;
            targetRotY = 0;
          }
        }
      };

      container.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);

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

      let animId: number | null = null;
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

      const vDelta = new THREE.Vector3();
      const vVel = new THREE.Vector3();
      const targetFloatKta = new THREE.Vector3();
      const eulerScratch = new THREE.Euler();
      const quatScratch = new THREE.Quaternion();
      const lookZero = new THREE.Vector3(0, 0, 0);

      function stepVerletPendulum(isHangingActive: boolean) {
        const lastIdx = VERLET_NODES - 1;

        for (let i = 1; i < VERLET_NODES; i++) {
          const cur = verletPos[i];
          const prev = verletPrev[i];
          vVel.subVectors(cur, prev).multiplyScalar(0.955);
          prev.copy(cur);

          cur.add(vVel);
          cur.y -= 0.036;

          if (i === lastIdx && isHangingActive && !isDragging) {
            cur.x += (restHookWorld.x - cur.x) * 0.032;
            cur.z += (restHookWorld.z - cur.z) * 0.14;
          } else {
            cur.z += (anchorPos.z * (1 - i / lastIdx) - cur.z) * 0.08;
          }
        }

        if (isDragging && isHangingActive) {
          verletPos[lastIdx].copy(dragTargetHook);
        }

        for (let iter = 0; iter < 5; iter++) {
          verletPos[0].copy(anchorPos);
          if (isDragging && isHangingActive) {
            verletPos[lastIdx].copy(dragTargetHook);
          }

          for (let i = 0; i < lastIdx; i++) {
            const a = verletPos[i];
            const b = verletPos[i + 1];
            vDelta.subVectors(b, a);
            const dist = vDelta.length();
            if (dist < 0.0001) continue;
            const diff = (dist - segLen) / dist;

            if (i === 0) {
              b.addScaledVector(vDelta, -diff);
            } else if (i === lastIdx - 1 && isDragging && isHangingActive) {
              a.addScaledVector(vDelta, diff);
            } else {
              a.addScaledVector(vDelta, diff * 0.5);
              b.addScaledVector(vDelta, -diff * 0.5);
            }
          }
        }
      }

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

        if (lightNow !== lastLightModeApplied) {
          lastLightModeApplied = lightNow;
          marbleMat.map = lightNow ? dayMarbleTex : nightMarbleTex;
          marbleMat.needsUpdate = true;
          if (scene.fog) {
            scene.fog.color.setHex(lightNow ? 0xf5f2ea : 0x050911);
            (scene.fog as THREE_TYPES.FogExp2).density = lightNow ? 0.007 : 0.015;
          }
          ambientLight.intensity = lightNow ? 1.55 : 0.8;
          spotLight.intensity = lightNow ? 185 : 145;
          spotLight.color.setHex(lightNow ? 0xffffff : 0xffeedd);
          rimLight.intensity = lightNow ? 36 : 68;
          mouseLight.intensity = lightNow ? 28 : 72;
          mouseLight.color.setHex(lightNow ? 0xfff5d6 : 0xffd700);
          dustMat.opacity = lightNow ? 0.14 : 0.52;
        }

        const time = nowMs * 0.001;
        const flipOffset = flippedNow ? Math.PI : 0;

        holoUniforms.uHoloTilt.value =
          globalCursorX * 0.5 + globalCursorY * 0.35 + Math.sin(time * 0.7) * 0.16;

        // Front gold spotlight glides smoothly across card relief & marble depth
        mouseLight.position.x += (globalCursorX * 18 - mouseLight.position.x) * 0.12;
        mouseLight.position.y += (globalCursorY * 12 - mouseLight.position.y) * 0.12;

        dustParticles.rotation.y += 0.00055;
        dustParticles.rotation.x += 0.00022;

        if (vaultRingsGroup && outerVaultRing && innerVaultRing) {
          outerVaultRing.rotation.z += 0.0012;
          innerVaultRing.rotation.z -= 0.0018;
          vaultRingsGroup.rotation.y += (globalCursorX * 0.15 - vaultRingsGroup.rotation.y) * 0.05;
          vaultRingsGroup.rotation.x += (-globalCursorY * 0.12 - vaultRingsGroup.rotation.x) * 0.05;
        }

        const isFocusedMode = fmtNow === "kta" || isMainInspect;
        if (!isFocusedMode) {
          camera.position.x += (targetCameraX - camera.position.x) * 0.06;
          camera.position.y += (targetCameraY - camera.position.y) * 0.06;
        } else {
          camera.position.x += (0 - camera.position.x) * 0.1;
          camera.position.y += (0 - camera.position.y) * 0.1;
        }
        camera.lookAt(lookZero);
        marbleWall.position.x = -(camera.position.x * 0.05);
        marbleWall.position.y = -(camera.position.y * 0.05);

        const isHangingId = fmtNow === "id" && !isMainInspect;
        stepVerletPendulum(isHangingId);

        const bottomNode = verletPos[VERLET_NODES - 1];
        const prevNode = verletPos[VERLET_NODES - 2];

        if (fmtNow === "kta") {
          idPivotGroup.position.lerp(idParkedPos, 0.08);
          idCardContainer.position.y += (0 - idCardContainer.position.y) * 0.1;
          eulerScratch.set(0.08, -0.35 + flipOffset, -0.05);
          quatScratch.setFromEuler(eulerScratch);
          idPivotGroup.quaternion.slerp(quatScratch, 0.08);
        } else if (isMainInspect) {
          idPivotGroup.position.lerp(mainViewPos, 0.09);
          idCardContainer.position.y += (0 - idCardContainer.position.y) * 0.14;
          eulerScratch.set(mainTargetRotX, mainTargetRotY + flipOffset, 0);
          quatScratch.setFromEuler(eulerScratch);
          idPivotGroup.quaternion.slerp(quatScratch, 0.12);
        } else {
          idCardContainer.position.y += (-hookOffsetY - idCardContainer.position.y) * 0.18;
          idPivotGroup.position.copy(bottomNode);

          const swingRollZ = Math.atan2(
            bottomNode.x - prevNode.x,
            Math.max(0.5, prevNode.y - bottomNode.y)
          );
          const swingPitchX =
            -globalCursorY * 0.34 +
            Math.atan2(prevNode.z - bottomNode.z, Math.max(0.6, prevNode.y - bottomNode.y)) * 0.4;
          if (!isDragging) {
            targetRotY = globalCursorX * 0.38;
          }
          eulerScratch.set(swingPitchX, targetRotY + flipOffset, swingRollZ * 0.85);
          quatScratch.setFromEuler(eulerScratch);
          idPivotGroup.quaternion.slerp(quatScratch, 0.24);
        }

        cardGlowLight.position.set(
          idPivotGroup.position.x,
          idPivotGroup.position.y + idCardContainer.position.y,
          idPivotGroup.position.z - 1.2
        );
        cardGlowLight.intensity = lightNow || fmtNow === "kta" ? 0 : 38;

        lanyardMesh.visible = isHangingId;
        if (lanyardMesh.visible) {
          ribbonStrap.update(ropeCurve, idPivotGroup.quaternion);
        }

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
          const floatY = Math.sin(time * 1.2) * 0.38;
          targetFloatKta.set(ktaRestPos.x, ktaRestPos.y + floatY, ktaRestPos.z);
          ktaMesh.position.lerp(targetFloatKta, 0.09);
          eulerScratch.set(
            -globalCursorY * 0.18 + 0.18,
            globalCursorX * 0.26 + 0.04 + flipOffset,
            Math.cos(time * 0.9) * 0.045
          );
          quatScratch.setFromEuler(eulerScratch);
          ktaMesh.quaternion.slerp(quatScratch, 0.08);
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
        roomEnvRT.dispose();
        nightMarbleTex.dispose();
        dayMarbleTex.dispose();
        strapTex.dispose();
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
            : "Tarik Tali & Ayun • Klik 2x Fokus"}
        </span>
      </div>

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
