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
  formatDomisiliLabel,
  generateVerificationQrCanvas,
  loadArtworkImage,
} from "./cardArtwork";

export interface SovereignThreeSceneProps {
  user: {
    id: string;
    nama_lengkap: string;
    nama_panggilan: string | null;
    foto_profil: string | null;
    alamat_lengkap?: string | null;
    role?: string | null;
    prestise_points?: number;
  };
  nomorId: string;
  fotoUrl: string;
  verificationUrl: string;
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
 * Builds a high-contrast horology & precious-metal studio environment map via PMREM.
 * Dark chamber bounds preserve deep jet-black obsidian lacquer while directional HDR
 * softbox panels carve liquid 24K gold highlights across beveled edges and micro-bezels.
 */
function buildHorologyCardEnv(
  THREE: typeof THREE_TYPES,
  pmrem: THREE_TYPES.PMREMGenerator,
  isDayMode: boolean
): THREE_TYPES.WebGLRenderTarget {
  const envScene = new THREE.Scene();
  // Dark negative-fill chamber behind the camera keeps dielectric obsidian jet-black in BOTH Day & Night
  envScene.background = new THREE.Color(isDayMode ? 0x090c13 : 0x050810);

  const addSoftbox = (
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
    pos: [number, number, number],
    look: [number, number, number]
  ) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(r, g, b),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.lookAt(look[0], look[1], look[2]);
    envScene.add(mesh);
  };

  const boost = isDayMode ? 0.96 : 1.0;
  // 1. Broad soft champagne umbrella facing card normals: solid gold EMV chip & clearcoat depth without flat wash
  addSoftbox(18, 8, 1.35 * boost, 1.12 * boost, 0.7 * boost, [0, 5.5, 12], [0, 0, 0]);
  // 2. Warm overhead horology key softbox
  addSoftbox(18, 9, 2.35 * boost, 2.0 * boost, 1.42 * boost, [0, 14, 5], [0, 0, 0]);
  // 3. Controlled diagonal 24K bullion sweep bar (toned down so flipped card backs show satin sheen, never white glare wash)
  addSoftbox(18, 4.0, 2.15 * boost, 1.65 * boost, 0.78 * boost, [-11, 7, 10], [0, 0, 0]);
  // 4. Right champagne architectural strip
  addSoftbox(6, 15, 1.85 * boost, 1.56 * boost, 1.08 * boost, [13, 2, 8], [0, 0, 0]);
  // 5. Subtle cool sapphire counter-rim for chromatic gold separation
  addSoftbox(7, 14, 0.72 * boost, 0.94 * boost, 1.36 * boost, [-14, -2, -6], [0, 0, 0]);
  // 6. Subtle lower bounce panel
  addSoftbox(16, 7, 0.85 * boost, 0.68 * boost, 0.42 * boost, [0, -13, 6], [0, 0, 0]);

  const rt = pmrem.fromScene(envScene, 0.036);
  envScene.traverse((obj) => {
    const m = obj as THREE_TYPES.Mesh;
    m.geometry?.dispose?.();
    if (m.material && !Array.isArray(m.material)) {
      m.material.dispose();
    }
  });
  return rt;
}

/** Crisp optical star-sparkle bokeh sprite so ambient gold dust never renders as blurry patches. */
function createGoldBokehSpriteCanvas(): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, "rgba(255, 250, 224, 1)");
  grad.addColorStop(0.18, "rgba(245, 212, 108, 0.85)");
  grad.addColorStop(0.45, "rgba(212, 175, 55, 0.16)");
  grad.addColorStop(1, "rgba(212, 175, 55, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
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
    bevelSegments: isMobile ? 2 : 4,
    curveSegments: isMobile ? 12 : 24,
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

/** Builds a precision micro-chamfered 24K gold rectangular or pill bezel frame. */
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
  const r = Math.min(cornerRadius, hw - 0.002, hh - 0.002);

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
  const ir = Math.max(0.015, Math.min(r - rimThickness, ihw - 0.002, ihh - 0.002));
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
    bevelThickness: 0.0035,
    bevelSize: 0.0035,
    bevelSegments: 2,
    curveSegments: 14,
  });
}

/** Builds a stepped solid 3D machined 24K EMV contact pad assembly protruding inside its bezel. */
function createEmvChip3DGroup(
  THREE: typeof THREE_TYPES,
  chipW: number,
  chipH: number,
  goldMat: THREE_TYPES.Material,
  seamMat: THREE_TYPES.Material
): THREE_TYPES.Group {
  const group = new THREE.Group();

  // Base chamfered gold silicon plate
  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(chipW * 0.92, chipH * 0.9, 0.008),
    goldMat
  );
  basePlate.position.z = 0.004;
  group.add(basePlate);

  // Dark anodized engraved channel grooves separating the 6 contact pads
  const seamV = new THREE.BoxGeometry(0.012, chipH * 0.86, 0.003);
  for (const sx of [-chipW * 0.16, chipW * 0.16]) {
    const bar = new THREE.Mesh(seamV, seamMat);
    bar.position.set(sx, 0, 0.008);
    group.add(bar);
  }
  const seamH = new THREE.BoxGeometry(chipW * 0.28, 0.012, 0.003);
  for (const sx of [-chipW * 0.31, chipW * 0.31]) {
    for (const sy of [-chipH * 0.16, chipH * 0.16]) {
      const hBar = new THREE.Mesh(seamH, seamMat);
      hBar.position.set(sx, sy, 0.008);
      group.add(hBar);
    }
  }

  // Central domed 24K die island
  const centerIsland = new THREE.Mesh(
    new THREE.BoxGeometry(chipW * 0.29, chipH * 0.52, 0.006),
    goldMat
  );
  centerIsland.position.z = 0.01;
  group.add(centerIsland);

  return group;
}

/** Builds a watch-caliber flat chamfered circular bezel ring (replaces chunky torus tubes). */
function createRaisedRingBezelGeometry(
  THREE: typeof THREE_TYPES,
  outerRadius: number,
  rimThickness: number,
  extrudeDepth: number,
  isMobile: boolean
): THREE_TYPES.ExtrudeGeometry {
  const segs = isMobile ? 28 : 48;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  hole.absarc(0, 0, Math.max(0.04, outerRadius - rimThickness), 0, Math.PI * 2, true);
  shape.holes.push(hole);

  return new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: segs,
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
    isMobile ? 22 : 36,
    wireRadius,
    isMobile ? 8 : 14,
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
  material.customProgramCacheKey = () => "sovereign-holo-v3";
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
    float _phase = (_vDir.x * 2.1 + _vDir.y * 1.2) + (1.0 - _ndv) * 2.0 + vRoughnessMapUv.x * 1.2 + vRoughnessMapUv.y * 0.6 + uHoloTilt;
    vec3 _prism = vec3(
      0.66 + 0.34 * cos(6.28318 * (_phase + 0.03)),
      0.58 + 0.38 * cos(6.28318 * (_phase + 0.16)),
      0.38 + 0.44 * cos(6.28318 * (_phase + 0.42))
    );
    float _glint = smoothstep(0.22, 0.96, pow(0.5 + 0.5 * sin(_phase * 3.14159), 2.2));
    totalEmissiveRadiance += _prism * _holoMask * (0.18 + 0.82 * _glint) * uHoloStrength;
  }
#endif`
      );
  };
}

export default function SovereignThreeScene({
  user,
  nomorId,
  fotoUrl,
  verificationUrl,
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
      domisili: formatDomisiliLabel(user.alamat_lengkap),
      angkatanLabel: "Ke-43 · Expedient Generation",
      berlakuLabel: "Seumur Hidup",
      maskedCardNumber: `4300  2026  ••••  ${nomorId.replace("EXP-", "")}`,
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
      fontsReadyPromise,
      loadArtworkImage("/images/logo-utuh.webp"),
      loadArtworkImage(fotoUrl),
      generateVerificationQrCanvas(verificationUrl, 520),
    ]).then(([THREE, , preCrestImg, preAvatarImg, preQrCanvas]) => {
      if (isCancelled || !containerRef.current) return;

      const isMobileViewport = () =>
        window.innerWidth < 768 ||
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

      const getCameraFov = (mob: boolean) => (mob ? 47 : 42);
      const getCameraZ = (aspect: number, mob: boolean) => {
        if (!mob) return 26.2;
        return aspect < 0.65 ? 27.2 : 25.0;
      };

      // Supersample 1080p Desktop monitors (min 1.65x DPR) for razor-sharp gold bevels & serif type
      const getSovereignDpr = (mob: boolean) => {
        const dpr = window.devicePixelRatio || 1;
        if (!mob) return Math.min(Math.max(dpr, 1.65), 2.25);
        if (isUltraEntryGpu || isWeakRam) return Math.min(dpr, 1.3);
        return Math.min(dpr, 1.65);
      };

      const scene = new THREE.Scene();
      if (!isMobile) {
        scene.fog = new THREE.FogExp2(
          liveRef.current.isLightMode ? 0xf3eee3 : 0x070b14,
          liveRef.current.isLightMode ? 0.004 : 0.0055
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
      renderer.toneMappingExposure = liveRef.current.isLightMode ? 1.0 : 1.12;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      // Horology Studio Cubemaps bound directly onto metallic & card materials so marble wall stays hotspot-free
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const nightEnvRT = buildHorologyCardEnv(THREE, pmremGenerator, false);
      const dayEnvRT = buildHorologyCardEnv(THREE, pmremGenerator, true);
      const activeEnvTex = liveRef.current.isLightMode ? dayEnvRT.texture : nightEnvRT.texture;
      scene.environment = null;
      pmremGenerator.dispose();

      // CONTROLLED HOROLOGY GALLERY LIGHTING (Calibrated to Three.js r184 RECIPROCAL_PI diffuse units)
      const ambientLight = new THREE.AmbientLight(
        liveRef.current.isLightMode ? 0xfefcf6 : 0xe4e7ef,
        liveRef.current.isLightMode ? 1.15 : 1.45
      );
      scene.add(ambientLight);

      const keyFillLight = new THREE.DirectionalLight(
        liveRef.current.isLightMode ? 0xfffaf0 : 0xf4ecdc,
        liveRef.current.isLightMode ? 0.72 : 0.85
      );
      keyFillLight.position.set(-4, 9, 18);
      scene.add(keyFillLight);

      const spotLight = new THREE.SpotLight(
        liveRef.current.isLightMode ? 0xfff8eb : 0xffeed0,
        liveRef.current.isLightMode ? 65 : 78,
        85,
        Math.PI / 3.2,
        0.94,
        1.0
      );
      spotLight.position.set(8.5, 22, 24);
      if (!isMobile) {
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.bias = -0.00012;
        spotLight.shadow.radius = 3.6;
      }
      scene.add(spotLight);

      const rimLight = new THREE.PointLight(
        0xffc845,
        liveRef.current.isLightMode ? 18 : 42,
        54,
        1.2
      );
      rimLight.position.set(-11, -5, 11);
      scene.add(rimLight);

      const cardGlowLight = new THREE.PointLight(
        0xffaa1d,
        liveRef.current.isLightMode ? 0 : 20,
        18,
        1.25
      );
      cardGlowLight.position.set(0, 0, -1.6);
      scene.add(cardGlowLight);

      // Front-sweeping 24K Gold Specular Key Light following cursor/gyroscope without wall hotspot glare
      const mouseLight = new THREE.PointLight(
        liveRef.current.isLightMode ? 0xfff2cc : 0xffdf7a,
        liveRef.current.isLightMode ? 12 : 26,
        58,
        1.15
      );
      mouseLight.position.set(0, 1.2, 12.5);
      scene.add(mouseLight);

      // CRISP PINHOLE GOLD MOTES STRICTLY IN BACKGROUND DEPTH (Never crosses foreground card typography)
      const bokehTex = new THREE.CanvasTexture(createGoldBokehSpriteCanvas());
      bokehTex.colorSpace = THREE.SRGBColorSpace;
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = isUltraEntryGpu || isWeakRam ? 16 : isMobile ? 26 : 85;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i += 3) {
        dustPos[i] = (Math.random() - 0.5) * 34;
        dustPos[i + 1] = (Math.random() - 0.5) * 24;
        dustPos[i + 2] = -2.2 - Math.random() * 6.5;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        size: isMobile ? 4.5 : 5.5,
        sizeAttenuation: false,
        map: bokehTex,
        color: 0xffdf73,
        transparent: true,
        opacity: liveRef.current.isLightMode ? 0.12 : 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);

      // SHARED SOLID 24K BULLION & BRUSHED GUNMETAL HARDWARE MATERIALS
      const goldHardwareMat = new THREE.MeshPhysicalMaterial({
        color: 0xf4d268,
        metalness: 0.96,
        roughness: 0.14,
        clearcoat: isMobile ? 0.0 : 0.4,
        clearcoatRoughness: 0.08,
        envMap: activeEnvTex,
        envMapIntensity: 1.75,
      });
      const brushedBrassMat = new THREE.MeshStandardMaterial({
        color: 0xd9ae44,
        metalness: 0.88,
        roughness: 0.28,
        envMap: activeEnvTex,
        envMapIntensity: 1.6,
      });
      const gunmetalMat = new THREE.MeshStandardMaterial({
        color: 0x181f2b,
        metalness: 0.88,
        roughness: 0.22,
        envMap: activeEnvTex,
        envMapIntensity: 1.25,
      });

      // SINGLE SEAMLESS 16:10 ITALIAN MARBLE GALLERY WALL (Calacatta Gold Day / Nero Marquina Night)
      const marbleStageGroup = new THREE.Group();
      marbleStageGroup.position.set(0, 0, -10);
      scene.add(marbleStageGroup);

      const marbleTexWidth = isMobile ? 640 : 1440;
      const nightMarbleTex = new THREE.CanvasTexture(
        createMarbleWallCanvas(false, marbleTexWidth)
      );
      nightMarbleTex.colorSpace = THREE.SRGBColorSpace;
      const dayMarbleTex = new THREE.CanvasTexture(
        createMarbleWallCanvas(true, marbleTexWidth)
      );
      dayMarbleTex.colorSpace = THREE.SRGBColorSpace;

      const marbleMat = new THREE.MeshStandardMaterial({
        map: liveRef.current.isLightMode ? dayMarbleTex : nightMarbleTex,
        metalness: 0.02,
        roughness: 0.72,
        transparent: false,
      });
      const marbleWall = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), marbleMat);
      if (!isMobile) marbleWall.receiveShadow = true;
      marbleStageGroup.add(marbleWall);

      // Stepped 3D Architectural Gallery Plinth & Edge Piers on Desktop (Multi-depth spatial stage)
      let plinthMat: THREE_TYPES.MeshStandardMaterial | null = null;
      if (!isMobile) {
        const galleryStageGroup = new THREE.Group();
        galleryStageGroup.position.set(0, -6.58, -3.6);

        plinthMat = new THREE.MeshStandardMaterial({
          color: liveRef.current.isLightMode ? 0xefe9dc : 0x151820,
          metalness: liveRef.current.isLightMode ? 0.04 : 0.12,
          roughness: 0.62,
        });

        const lowerTier = new THREE.Mesh(new THREE.BoxGeometry(24.6, 0.44, 5.2), plinthMat);
        lowerTier.position.y = -0.14;
        lowerTier.receiveShadow = true;
        galleryStageGroup.add(lowerTier);

        const upperTier = new THREE.Mesh(new THREE.BoxGeometry(22.8, 0.24, 4.1), plinthMat);
        upperTier.position.y = 0.2;
        upperTier.receiveShadow = true;
        galleryStageGroup.add(upperTier);

        const brassFrontLip = new THREE.Mesh(
          new THREE.BoxGeometry(22.86, 0.045, 0.08),
          brushedBrassMat
        );
        brassFrontLip.position.set(0, 0.29, 2.07);
        galleryStageGroup.add(brassFrontLip);

        const brassSubLip = new THREE.Mesh(
          new THREE.BoxGeometry(24.64, 0.036, 0.06),
          goldHardwareMat
        );
        brassSubLip.position.set(0, 0.06, 2.61);
        galleryStageGroup.add(brassSubLip);

        scene.add(galleryStageGroup);

        // Recessed architectural stone piers flanking outer edges (x=±18.2, z=-6.6)
        const pierGeo = new THREE.BoxGeometry(1.5, 26, 1.4);
        const pierTrimGeo = new THREE.BoxGeometry(0.05, 26, 0.08);
        for (const sign of [-1, 1]) {
          const pier = new THREE.Mesh(pierGeo, plinthMat);
          pier.position.set(sign * 18.2, 0, -6.6);
          pier.receiveShadow = true;
          scene.add(pier);

          const pierTrim = new THREE.Mesh(pierTrimGeo, brushedBrassMat);
          pierTrim.position.set(sign * 17.44, 0, -5.92);
          scene.add(pierTrim);
        }
      }

      // TOP CEILING ANCHOR (Positioned above viewport margin so ribbon enters cleanly behind top pill)
      const anchorPos = new THREE.Vector3(0, 11.95, -0.55);
      const mountGroup = new THREE.Group();
      mountGroup.position.copy(anchorPos);

      const mountRosette = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.45, 0.36, isMobile ? 20 : 48),
        goldHardwareMat
      );
      mountRosette.rotation.x = Math.PI / 2;
      mountRosette.position.z = -0.34;
      mountGroup.add(mountRosette);

      const mountSlotBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.22, 0.2),
        gunmetalMat
      );
      mountSlotBar.position.z = 0.02;
      mountGroup.add(mountSlotBar);
      scene.add(mountGroup);

      // SUPERSAMPLED 2048px CARD TEXTURES ON DESKTOP (0.85x fast budget on Mobile)
      const texScale = isMobile ? (isUltraEntryGpu || isWeakRam ? 0.75 : 0.9) : 2.0;

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

      const loadedAssets: LoadedCardAssets = {
        crestImg: preCrestImg,
        avatarImg: preAvatarImg,
        qrCanvas: preQrCanvas,
      };

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

      paintAllFaces(liveRef.current.isLightMode ? "light" : "dark");

      const holoUniforms = {
        uHoloTilt: { value: 0 },
        uHoloStrength: { value: isUltraEntryGpu ? 0.12 : 0.2 },
      };

      const createLuxuryCardMaterial = (set: CardTextureSet) => {
        const mat = new THREE.MeshPhysicalMaterial({
          map: set.colorTex,
          roughness: 1.0,
          metalness: 1.0,
          roughnessMap: set.pbrTex,
          metalnessMap: set.pbrTex,
          clearcoat: isUltraEntryGpu ? 0.0 : 0.34,
          clearcoatRoughness: 0.22,
          reflectivity: 0.58,
          envMap: activeEnvTex,
          envMapIntensity: 0.88,
          ...(set.bumpTex ? { bumpMap: set.bumpTex, bumpScale: 0.02 } : {}),
        });
        applyHologramFoilShader(mat, holoUniforms);
        return mat;
      };

      // =======================================================================
      // 1. VERTICAL LANYARD ID CREDENTIAL + PRECISION MICRO-MACHINED 3D BEZELS
      // =======================================================================
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
      const idFrontMat = createLuxuryCardMaterial(idFrontSet);
      const idBackMat = createLuxuryCardMaterial(idBackSet);
      const idCard = new THREE.Mesh(idCardGeo, [
        goldHardwareMat,
        idFrontMat,
        idBackMat,
      ]);
      if (!isMobile) idCard.castShadow = true;
      idCardContainer.add(idCard);

      // Double-sided 3D 24K Gold Slot Grommet Eyelets (Front +0.062 & Back -0.072)
      const slotEyeletGeo = createRaisedRectBezelGeometry(THREE, 1.11, 0.285, 0.032, 0.142, 0.01);
      const idSlotEyeletFront = new THREE.Mesh(slotEyeletGeo, goldHardwareMat);
      idSlotEyeletFront.position.set(0, 3.718, 0.062);
      idCardContainer.add(idSlotEyeletFront);

      const idSlotEyeletBack = new THREE.Mesh(slotEyeletGeo, goldHardwareMat);
      idSlotEyeletBack.position.set(0, 3.718, -0.072);
      idCardContainer.add(idSlotEyeletBack);

      // ID Top-Left Official Crest Watch-Caliber Bezel Ring (cx=186, cy=232 on 1024x1624)
      const idCrestRing3D = new THREE.Mesh(
        createRaisedRingBezelGeometry(THREE, 0.358, 0.02, 0.009, isMobile),
        goldHardwareMat
      );
      idCrestRing3D.position.set(-1.719, 3.071, 0.062);
      idCardContainer.add(idCrestRing3D);

      // ID Top-Right 24K EMV Chip Bezel + Stepped 3D Machined Gold Pad Island (x=774, y=186, w=122, h=92)
      const idChipBezel = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 0.66, 0.504, 0.024, 0.082, 0.01),
        goldHardwareMat
      );
      idChipBezel.position.set(1.703, 3.071, 0.062);
      idCardContainer.add(idChipBezel);

      const idChip3DPads = createEmvChip3DGroup(
        THREE,
        0.59,
        0.44,
        goldHardwareMat,
        gunmetalMat
      );
      idChip3DPads.position.set(1.703, 3.071, 0.062);
      idCardContainer.add(idChip3DPads);

      // ID Editorial Portrait Window Bezel (x=128, y=330, w=768, h=668 -> cy=0.784, h=3.554)
      const idPhotoFrame3D = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 4.066, 3.554, 0.024, 0.118, 0.01),
        goldHardwareMat
      );
      idPhotoFrame3D.position.set(0, 0.784, 0.062);
      idCardContainer.add(idPhotoFrame3D);

      // ID Back Verification QR Plate Bezel & Recessed Magstripe Lower Brass Rail
      const idBackQrBezel = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 2.126, 2.134, 0.024, 0.14, 0.01),
        goldHardwareMat
      );
      idBackQrBezel.position.set(0, -0.598, -0.072);
      idCardContainer.add(idBackQrBezel);

      const idBackMagRail = new THREE.Mesh(
        new THREE.BoxGeometry(5.02, 0.022, 0.006),
        brushedBrassMat
      );
      idBackMagRail.position.set(0, 2.54, -0.064);
      idCardContainer.add(idBackMagRail);

      // Articulated Multi-Part Swivel Clasp, Spring-Gate Sleeve & Twin-Bolt Yoke Collar
      const carabinerMesh = new THREE.Mesh(
        createOvalCarabinerGeometry(THREE, 4.19, 0.94, 0.155, 0.054, isMobile),
        gunmetalMat
      );
      if (!isMobile) carabinerMesh.castShadow = true;
      idCardContainer.add(carabinerMesh);

      const gateSleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.074, 0.074, 0.34, isMobile ? 12 : 20),
        goldHardwareMat
      );
      gateSleeve.rotation.x = Math.PI * 0.44;
      gateSleeve.position.set(0, 4.21, 0.155);
      idCardContainer.add(gateSleeve);

      const swivelRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.08, isMobile ? 14 : 24),
        goldHardwareMat
      );
      swivelRing.position.set(0, 4.64, 0);
      idCardContainer.add(swivelRing);

      const clampBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.125, 0.14, 0.28, isMobile ? 12 : 24),
        gunmetalMat
      );
      clampBarrel.position.set(0, 4.76, 0);
      idCardContainer.add(clampBarrel);

      const clampCollar = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 0.22, 0.17),
        goldHardwareMat
      );
      clampCollar.position.set(0, 4.93, 0);
      if (!isMobile) clampCollar.castShadow = true;
      idCardContainer.add(clampCollar);

      // Brushed twin rivets & saddle loop on ribbon crimp collar
      if (!isMobile) {
        const rivetGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.19, 12);
        rivetGeo.rotateX(Math.PI / 2);
        for (const rx of [-0.22, 0.22]) {
          const rivet = new THREE.Mesh(rivetGeo, gunmetalMat);
          rivet.position.set(rx, 4.93, 0);
          idCardContainer.add(rivet);
        }
      }

      // WOVEN FLAT RIBBON LANYARD + SLIDING CHROME-GOLD ADJUSTER BUCKLE + 6-NODE VERLET PENDULUM
      const strapCanvas = createWovenStrapCanvas();
      const strapTex = new THREE.CanvasTexture(strapCanvas);
      strapTex.wrapS = THREE.RepeatWrapping;
      strapTex.wrapT = THREE.RepeatWrapping;
      strapTex.repeat.set(1, 3.0);
      strapTex.colorSpace = THREE.SRGBColorSpace;
      strapTex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isMobile ? 4 : 8);

      const strapMat = new THREE.MeshStandardMaterial({
        map: strapTex,
        roughness: 0.54,
        metalness: 0.24,
        envMap: activeEnvTex,
        envMapIntensity: 1.05,
      });

      const ribbonStrap = createDynamicRibbonStrap(THREE, isMobile ? 20 : 30, 0.29, 0.02);
      const lanyardMesh = new THREE.Mesh(ribbonStrap.geometry, strapMat);
      if (!isMobile) lanyardMesh.castShadow = true;
      scene.add(lanyardMesh);

      const sliderBuckleGroup = new THREE.Group();
      const buckleBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.24, 0.12),
        goldHardwareMat
      );
      if (!isMobile) buckleBody.castShadow = true;
      sliderBuckleGroup.add(buckleBody);
      const buckleCenterSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.06, 0.135),
        gunmetalMat
      );
      sliderBuckleGroup.add(buckleCenterSlot);
      scene.add(sliderBuckleGroup);

      const VERLET_NODES = 6;
      const restCardCenterY = 0.16;
      const restHookWorld = new THREE.Vector3(0, restCardCenterY + hookOffsetY, 0);
      const totalRopeLen = anchorPos.distanceTo(restHookWorld) + 0.04;
      const segLen = totalRopeLen / (VERLET_NODES - 1);

      const verletPos = Array.from({ length: VERLET_NODES }, (_, i) =>
        new THREE.Vector3().lerpVectors(anchorPos, restHookWorld, i / (VERLET_NODES - 1))
      );
      const verletPrev = verletPos.map((p) => p.clone());
      idPivotGroup.position.copy(restHookWorld);
      const ropeCurve = new THREE.CatmullRomCurve3(verletPos);

      // =======================================================================
      // 2. HORIZONTAL WALLET KTA (EXACT 1.600 ISO ID-1 PROPORTION: 5.4 x 3.375)
      // =======================================================================
      const ktaWidth = 5.4;
      const ktaHeight = 3.375;
      const ktaGeo = createDieCutCardGeometry(
        THREE,
        ktaWidth,
        ktaHeight,
        0.056,
        0.25,
        isMobile
      );
      const ktaFrontMat = createLuxuryCardMaterial(ktaFrontSet);
      const ktaBackMat = createLuxuryCardMaterial(ktaBackSet);
      const ktaMesh = new THREE.Mesh(ktaGeo, [
        goldHardwareMat,
        ktaFrontMat,
        ktaBackMat,
      ]);
      if (!isMobile) ktaMesh.castShadow = true;
      scene.add(ktaMesh);

      // KTA Top-Left Crest Watch-Bezel Ring (cx=114, cy=112, r=46+4 on 1024x640)
      const ktaCrestRing3D = new THREE.Mesh(
        createRaisedRingBezelGeometry(THREE, 0.268, 0.018, 0.008, isMobile),
        goldHardwareMat
      );
      ktaCrestRing3D.position.set(-2.099, 1.097, 0.05);
      ktaMesh.add(ktaCrestRing3D);

      // KTA Mid-Left 24K EMV Chip Bezel + Stepped 3D Gold Pad Island (x=72, y=202, w=108, h=82)
      const ktaChipBezel = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 0.586, 0.448, 0.022, 0.072, 0.009),
        goldHardwareMat
      );
      ktaChipBezel.position.set(-2.036, 0.406, 0.05);
      ktaMesh.add(ktaChipBezel);

      const ktaChip3DPads = createEmvChip3DGroup(
        THREE,
        0.52,
        0.39,
        goldHardwareMat,
        gunmetalMat
      );
      ktaChip3DPads.position.set(-2.036, 0.406, 0.05);
      ktaMesh.add(ktaChip3DPads);

      // KTA Right Chamfered Portrait Window Bezel (x=736, y=194, w=224, h=376 on 1024x640)
      const ktaPortraitBezel = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 1.198, 2.0, 0.022, 0.108, 0.009),
        goldHardwareMat
      );
      ktaPortraitBezel.position.set(1.772, -0.327, 0.05);
      ktaMesh.add(ktaPortraitBezel);

      // KTA Back Verification QR Plate Bezel & Magstripe Lower Brass Rail
      const ktaBackQrBezel = new THREE.Mesh(
        createRaisedRectBezelGeometry(THREE, 1.398, 1.398, 0.022, 0.108, 0.009),
        goldHardwareMat
      );
      ktaBackQrBezel.position.set(-1.651, -0.048, -0.059);
      ktaMesh.add(ktaBackQrBezel);

      const ktaBackMagRail = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.018, 0.005),
        brushedBrassMat
      );
      ktaBackMagRail.position.set(0, 0.87, -0.051);
      ktaMesh.add(ktaBackMagRail);

      // Staging coordinates: Desktop showcases both objects in sculptural 3D depth;
      // Mobile parks the inactive card cleanly outside the narrow portrait viewport.
      const getKtaRestPos = (mob: boolean) =>
        mob ? new THREE.Vector3(-10.8, -5.2, -7.5) : new THREE.Vector3(-7.75, -0.25, -1.35);
      const getKtaViewPos = (mob: boolean) =>
        mob ? new THREE.Vector3(0, 0.35, 7.6) : new THREE.Vector3(0, 0.15, 14.8);
      const getMainViewPos = (mob: boolean) =>
        mob ? new THREE.Vector3(0, 0.3, 5.6) : new THREE.Vector3(0, 0.1, 14.0);
      const getIdParkedPos = (mob: boolean) =>
        mob ? new THREE.Vector3(10.8, 5.2, -7.5) : new THREE.Vector3(9.1, 2.1, -6.2);

      const ktaRestPos = getKtaRestPos(isMobile);
      const ktaViewPos = getKtaViewPos(isMobile);
      const mainViewPos = getMainViewPos(isMobile);
      const idParkedPos = getIdParkedPos(isMobile);
      ktaMesh.position.copy(ktaRestPos);

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

      const hideStageHint = () => {
        if (!hasInteracted) {
          hasInteracted = true;
          const hint = document.getElementById("sovereignStageHint");
          if (hint) hint.classList.add("is-hidden");
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
        hideStageHint();
        try {
          container.setPointerCapture(event.pointerId);
        } catch {}
      };

      const handlePointerMove = (event: PointerEvent) => {
        const { normX, normY } = setPointerRay(event.clientX, event.clientY);
        globalCursorX = normX;
        globalCursorY = normY;
        targetCameraX = normX * 1.85;
        targetCameraY = normY * 1.55;

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
          ktaTargetRotX = Math.max(-0.85, Math.min(0.85, ktaTargetRotX + dy * 0.011));
          return;
        }
        if (isMainInspect) {
          mainTargetRotY += dx * 0.011;
          mainTargetRotX = Math.max(-0.85, Math.min(0.85, mainTargetRotX + dy * 0.011));
          return;
        }

        dragTargetHook.x = normX * (isMobile ? 8.2 : 11.5);
        dragTargetHook.y =
          Math.max(-2.8, Math.min(5.0, normY * (isMobile ? 6.2 : 8.6))) + hookOffsetY;
        dragTargetHook.z = 2.2;
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
        } else if (fmt === "kta" && isDoubleTap && hitKta) {
          liveRef.current.onFlipChange?.(!liveRef.current.isFlipped);
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
        targetCameraX = globalCursorX * 2.0;
        targetCameraY = globalCursorY * 1.8;
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
      const bucklePos = new THREE.Vector3();
      const buckleTan = new THREE.Vector3();
      const buckleDown = new THREE.Vector3(0, -1, 0);
      const buckleAlignQuat = new THREE.Quaternion();

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
            cur.x += (restHookWorld.x - cur.x) * 0.034;
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
              renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2));
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
          const nextEnv = lightNow ? dayEnvRT.texture : nightEnvRT.texture;
          for (const m of [
            goldHardwareMat,
            brushedBrassMat,
            gunmetalMat,
            strapMat,
            idFrontMat,
            idBackMat,
            ktaFrontMat,
            ktaBackMat,
          ]) {
            m.envMap = nextEnv;
            m.needsUpdate = true;
          }
          renderer.toneMappingExposure = lightNow ? 1.0 : 1.12;
          marbleMat.map = lightNow ? dayMarbleTex : nightMarbleTex;
          marbleMat.needsUpdate = true;
          if (scene.fog) {
            scene.fog.color.setHex(lightNow ? 0xf3eee3 : 0x070b14);
            (scene.fog as THREE_TYPES.FogExp2).density = lightNow ? 0.004 : 0.0055;
          }
          ambientLight.color.setHex(lightNow ? 0xfefcf6 : 0xe4e7ef);
          ambientLight.intensity = lightNow ? 1.15 : 1.45;
          keyFillLight.color.setHex(lightNow ? 0xfffaf0 : 0xf4ecdc);
          keyFillLight.intensity = lightNow ? 0.72 : 0.85;
          spotLight.intensity = lightNow ? 65 : 78;
          spotLight.color.setHex(lightNow ? 0xfff8eb : 0xffeed0);
          rimLight.intensity = lightNow ? 18 : 42;
          mouseLight.intensity = lightNow ? 12 : 26;
          mouseLight.color.setHex(lightNow ? 0xfff2cc : 0xffdf7a);
          dustMat.opacity = lightNow ? 0.12 : 0.42;
          if (plinthMat) {
            plinthMat.color.setHex(lightNow ? 0xefe9dc : 0x151820);
            plinthMat.metalness = lightNow ? 0.04 : 0.12;
          }
        }

        const time = nowMs * 0.001;
        const flipOffset = flippedNow ? Math.PI : 0;

        holoUniforms.uHoloTilt.value =
          globalCursorX * 0.52 + globalCursorY * 0.36 + Math.sin(time * 0.65) * 0.14;

        // Front 24K gold spotlight sweeps smoothly across card bevels & clearcoat
        mouseLight.position.x += (globalCursorX * 17 - mouseLight.position.x) * 0.11;
        mouseLight.position.y += (globalCursorY * 11 + 1.2 - mouseLight.position.y) * 0.11;

        dustParticles.rotation.y += 0.00042;
        dustParticles.rotation.x += 0.00018;

        const isFocusedMode = fmtNow === "kta" || isMainInspect;
        if (!isFocusedMode) {
          camera.position.x += (targetCameraX - camera.position.x) * 0.055;
          camera.position.y += (targetCameraY - camera.position.y) * 0.055;
        } else {
          camera.position.x += (0 - camera.position.x) * 0.1;
          camera.position.y += (0 - camera.position.y) * 0.1;
        }
        camera.lookAt(lookZero);
        marbleStageGroup.position.x = -(camera.position.x * 0.045);
        marbleStageGroup.position.y = -(camera.position.y * 0.045);

        const isHangingId = fmtNow === "id" && !isMainInspect;
        stepVerletPendulum(isHangingId);

        const bottomNode = verletPos[VERLET_NODES - 1];
        const prevNode = verletPos[VERLET_NODES - 2];

        if (fmtNow === "kta") {
          idPivotGroup.position.lerp(idParkedPos, 0.085);
          idCardContainer.position.y += (0 - idCardContainer.position.y) * 0.1;
          eulerScratch.set(0.08, -0.34 + flipOffset, -0.05);
          quatScratch.setFromEuler(eulerScratch);
          idPivotGroup.quaternion.slerp(quatScratch, 0.085);
          mountGroup.visible = !isMobile;
        } else if (isMainInspect) {
          idPivotGroup.position.lerp(mainViewPos, 0.095);
          idCardContainer.position.y += (0 - idCardContainer.position.y) * 0.14;
          eulerScratch.set(mainTargetRotX, mainTargetRotY + flipOffset, 0);
          quatScratch.setFromEuler(eulerScratch);
          idPivotGroup.quaternion.slerp(quatScratch, 0.12);
          mountGroup.visible = true;
        } else {
          mountGroup.visible = true;
          idCardContainer.position.y += (-hookOffsetY - idCardContainer.position.y) * 0.18;
          idPivotGroup.position.copy(bottomNode);

          const swingRollZ = Math.atan2(
            bottomNode.x - prevNode.x,
            Math.max(0.5, prevNode.y - bottomNode.y)
          );
          const swingPitchX =
            -globalCursorY * 0.32 +
            Math.atan2(prevNode.z - bottomNode.z, Math.max(0.6, prevNode.y - bottomNode.y)) * 0.38;
          if (!isDragging) {
            // Subtle sculptural hero 3D angle reveals gold bevel depth & 3D EMV chip relief immediately
            targetRotY = globalCursorX * 0.4 + Math.sin(time * 0.48) * 0.065 + 0.085;
          }
          eulerScratch.set(swingPitchX, targetRotY + flipOffset, swingRollZ * 0.85);
          quatScratch.setFromEuler(eulerScratch);
          idPivotGroup.quaternion.slerp(quatScratch, 0.22);
        }

        cardGlowLight.position.set(
          idPivotGroup.position.x,
          idPivotGroup.position.y + idCardContainer.position.y,
          idPivotGroup.position.z - 1.25
        );
        cardGlowLight.intensity = lightNow || fmtNow === "kta" ? 0 : 18;

        lanyardMesh.visible = isHangingId;
        sliderBuckleGroup.visible = isHangingId;
        if (lanyardMesh.visible) {
          ribbonStrap.update(ropeCurve, idPivotGroup.quaternion);
          ropeCurve.getPointAt(0.68, bucklePos);
          ropeCurve.getTangentAt(0.68, buckleTan).normalize();
          sliderBuckleGroup.position.copy(bucklePos);
          buckleAlignQuat.setFromUnitVectors(buckleDown, buckleTan);
          sliderBuckleGroup.quaternion.copy(buckleAlignQuat);
        }

        if (fmtNow === "kta") {
          ktaMesh.visible = true;
          ktaMesh.position.lerp(ktaViewPos, 0.095);
          eulerScratch.set(
            ktaTargetRotX + -globalCursorY * 0.09,
            ktaTargetRotY + globalCursorX * 0.14 + flipOffset,
            0
          );
          quatScratch.setFromEuler(eulerScratch);
          ktaMesh.quaternion.slerp(quatScratch, 0.12);
        } else {
          ktaMesh.visible = !isMobile || ktaMesh.position.x > -9.8;
          const floatY = Math.sin(time * 1.15) * 0.28;
          targetFloatKta.set(ktaRestPos.x, ktaRestPos.y + floatY, ktaRestPos.z);
          ktaMesh.position.lerp(targetFloatKta, 0.085);
          eulerScratch.set(
            -globalCursorY * 0.16 + 0.12,
            globalCursorX * 0.24 + 0.28 + flipOffset,
            Math.cos(time * 0.85) * 0.03
          );
          quatScratch.setFromEuler(eulerScratch);
          ktaMesh.quaternion.slerp(quatScratch, 0.085);
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
        idParkedPos.copy(getIdParkedPos(isMobile));

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
        nightMarbleTex.dispose();
        dayMarbleTex.dispose();
        strapTex.dispose();
        bokehTex.dispose();
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
  }, [user, nomorId, fotoUrl, verificationUrl]);

  return (
    <>
      <div className="sovereign-placard" aria-hidden="true">
        <span className="sovereign-placard-eyebrow">Pondok Modern Arrisalah</span>
        <span className="sovereign-placard-title">Expedient Generation · 43</span>
        <span className="sovereign-placard-meta">
          {nomorId} · {(user.nama_panggilan || user.nama_lengkap).toUpperCase()}
        </span>
      </div>

      <div id="sovereignStageHint" className="sovereign-stage-hint" aria-hidden="true">
        <span>Geser untuk mengayun · Ketuk ganda untuk inspeksi dekat</span>
      </div>

      <div ref={containerRef} className="sovereign-webgl-stage" />
    </>
  );
}
