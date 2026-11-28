"use client";

import QRCode from "qrcode";

export type CardThemeMode = "dark" | "light";

export interface CardIdentityData {
  nama: string;
  panggilan: string;
  nomorId: string;
  domisili: string;
  angkatanLabel: string;
  berlakuLabel: string;
  maskedCardNumber: string;
}

export interface ArtworkPaintTargets {
  cCtx: CanvasRenderingContext2D;
  pCtx?: CanvasRenderingContext2D | null;
  bCtx?: CanvasRenderingContext2D | null;
}

export interface LoadedCardAssets {
  crestImg?: HTMLImageElement | null;
  avatarImg?: HTMLImageElement | null;
  qrCanvas?: HTMLCanvasElement | null;
}

/**
 * Encodes PBR surface attributes into RGB channels of a single texture:
 * - R: Restrained holographic security foil mask (edge security line & seal rim ONLY)
 * - G: Micro-surface roughness (low = glossy piano lacquer, high = matte QR paper)
 * - B: Metalness (high = 24K stamped gold bullion)
 */
export function pbrSurface(holo: number, roughness: number, metalness: number): string {
  const r = Math.max(0, Math.min(255, Math.round(holo * 255)));
  const g = Math.max(10, Math.min(250, Math.round(roughness * 255)));
  const b = Math.max(4, Math.min(252, Math.round(metalness * 255)));
  return `rgb(${r}, ${g}, ${b})`;
}

const PBR_OBSIDIAN_LACQUER = pbrSurface(0.0, 0.14, 0.02);
const PBR_OBSIDIAN_SATIN_BACK = pbrSurface(0.0, 0.15, 0.02);
const PBR_SATIN_BAND = pbrSurface(0.0, 0.52, 0.02);
const PBR_GOLD_BULLION = pbrSurface(0.03, 0.24, 0.86);
const PBR_HOLO_FOIL = pbrSurface(0.42, 0.2, 0.88);
const PBR_PORTRAIT_GLASS = pbrSurface(0.0, 0.1, 0.02);
const PBR_MATTE_IVORY = pbrSurface(0.0, 0.88, 0.01);
const PBR_ENGRAVED_TYPE = pbrSurface(0.0, 0.24, 0.82);

interface ResolvedFontStacks {
  serif: string;
  sans: string;
  tabular: string;
}

let cachedFonts: ResolvedFontStacks | null = null;

function resolveVarFont(cssVar: string, fallback: string): string {
  if (typeof document === "undefined" || !document.body) return fallback;
  try {
    const el = document.createElement("span");
    el.style.fontFamily = `var(${cssVar}, ${fallback})`;
    el.style.position = "fixed";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
    const computed = getComputedStyle(el).fontFamily;
    document.body.removeChild(el);
    return computed && computed.trim() ? computed : fallback;
  } catch {
    return fallback;
  }
}

/** Resolves actual next/font/google font families onto Canvas 2D contexts. */
export function resolveCardFontStacks(): ResolvedFontStacks {
  if (cachedFonts && typeof document !== "undefined") return cachedFonts;
  const resolved: ResolvedFontStacks = {
    serif: resolveVarFont("--font-playfair", '"Playfair Display", Georgia, serif'),
    sans: resolveVarFont("--font-inter", '"Inter", sans-serif'),
    tabular: resolveVarFont("--font-manrope", '"Manrope", "Inter", sans-serif'),
  };
  if (typeof document !== "undefined" && document.body) {
    cachedFonts = resolved;
  }
  return resolved;
}

const artworkImageCache = new Map<string, Promise<HTMLImageElement | null>>();
const artworkQrCache = new Map<string, Promise<HTMLCanvasElement | null>>();

const GOLD = "#d4af37";
const GOLD_BRIGHT = "#f5e19c";
const GOLD_DEEP = "#8f6b14";
const OBSIDIAN_0 = "#0d1320";
const OBSIDIAN_1 = "#070a12";
const OBSIDIAN_2 = "#030509";
const IVORY = "#f8fafc";
const SLATE_MUTED = "#94a3b8";

/** Formats a raw address string into a concise, dignified domicile label for card engraving. */
export function formatDomisiliLabel(raw?: string | null): string {
  if (!raw || !raw.trim()) return "Ponorogo · Jawa Timur";
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 28) return cleaned;
  const parts = cleaned
    .split(/[,/-]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const tail = `${parts[parts.length - 2]} · ${parts[parts.length - 1]}`;
    if (tail.length <= 30) return tail;
  }
  return cleaned.slice(0, 26).trim() + "…";
}

/** Generates and caches a crisp, zero-network local QR code canvas (`errorCorrectionLevel: H`). */
export function generateVerificationQrCanvas(
  verificationUrl: string,
  pixelSize = 480
): Promise<HTMLCanvasElement | null> {
  if (typeof document === "undefined" || !verificationUrl) {
    return Promise.resolve(null);
  }
  const cacheKey = `${verificationUrl}::${pixelSize}`;
  const cached = artworkQrCache.get(cacheKey);
  if (cached) return cached;

  const job = (async () => {
    try {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, verificationUrl, {
        width: pixelSize,
        margin: 1,
        errorCorrectionLevel: "H",
        color: {
          dark: "#070a12",
          light: "#faf8f3",
        },
      });

      const { serif } = resolveCardFontStacks();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const c = canvas.width / 2;
        const r = canvas.width * 0.105;
        ctx.save();
        ctx.fillStyle = "#faf8f3";
        ctx.beginPath();
        ctx.arc(c, c, r + 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#070a12";
        ctx.beginPath();
        ctx.arc(c, c, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = GOLD_BRIGHT;
        ctx.font = `700 ${Math.round(r * 0.92)}px ${serif}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("43", c, c + 1);
        ctx.restore();
      }
      return canvas;
    } catch {
      artworkQrCache.delete(cacheKey);
      return null;
    }
  })();

  artworkQrCache.set(cacheKey, job);
  return job;
}

/** Loads and caches an artwork image safely so mode switches render zero-flicker frames. */
export function loadArtworkImage(url: string): Promise<HTMLImageElement | null> {
  if (!url || typeof Image === "undefined") {
    return Promise.resolve(null);
  }
  const cached = artworkImageCache.get(url);
  if (cached) return cached;

  const job = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => {
      artworkImageCache.delete(url);
      resolve(null);
    };
    img.src = url;
  });

  artworkImageCache.set(url, job);
  return job;
}

/**
 * Fits a member's full name into 1 or 2 balanced lines without ever squishing glyph widths.
 */
function layoutDisplayName(
  ctx: CanvasRenderingContext2D,
  fullName: string,
  maxWidth: number,
  maxFontPx: number,
  minFontPx: number,
  family: string
): { lines: string[]; fontSize: number } {
  const normalized = (fullName || "ALUMNI EXPEDIENT").trim().replace(/\s+/g, " ").toUpperCase();

  // Try single line from maxFontPx down to a comfortable threshold
  const singleLineFloor = Math.round(maxFontPx * 0.72);
  for (let px = maxFontPx; px >= singleLineFloor; px -= 2) {
    ctx.font = `700 ${px}px ${family}`;
    if (ctx.measureText(normalized).width <= maxWidth) {
      return { lines: [normalized], fontSize: px };
    }
  }

  // Split into 2 balanced lines at word boundary closest to midpoint
  const words = normalized.split(" ");
  if (words.length >= 2) {
    let bestSplit = 1;
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const left = words.slice(0, i).join(" ");
      const right = words.slice(i).join(" ");
      const diff = Math.abs(left.length - right.length);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSplit = i;
      }
    }
    const line1 = words.slice(0, bestSplit).join(" ");
    const line2 = words.slice(bestSplit).join(" ");

    for (let px = Math.round(maxFontPx * 0.82); px >= minFontPx; px -= 2) {
      ctx.font = `700 ${px}px ${family}`;
      if (
        ctx.measureText(line1).width <= maxWidth &&
        ctx.measureText(line2).width <= maxWidth
      ) {
        return { lines: [line1, line2], fontSize: px };
      }
    }
    return { lines: [line1, line2], fontSize: minFontPx };
  }

  return { lines: [normalized], fontSize: minFontPx };
}

function marbleHash(x: number, y: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function marbleNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = marbleHash(ix, iy);
  const b = marbleHash(ix + 1, iy);
  const c = marbleHash(ix, iy + 1);
  const d = marbleHash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function marbleFbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amp = 0.5;
  let sx = x;
  let sy = y;
  for (let i = 0; i < octaves; i++) {
    value += amp * marbleNoise(sx, sy);
    sx = sx * 2.04 + 13.7;
    sy = sy * 2.04 + 29.3;
    amp *= 0.5;
  }
  return value;
}

/**
 * Generates an organic geological Italian Calacatta Gold (Day) or Nero Marquina (Night)
 * marble texture via domain-warped fBm turbulence at 16:10 aspect ratio.
 */
export function createMarbleWallCanvas(isDayMode: boolean, width: number): HTMLCanvasElement {
  const outW = Math.max(320, width);
  const outH = Math.round(outW * 0.625);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  const simW = outW <= 640 ? 288 : 448;
  const simH = Math.round(simW * 0.625);
  const simCanvas = document.createElement("canvas");
  simCanvas.width = simW;
  simCanvas.height = simH;
  const simCtx = simCanvas.getContext("2d")!;
  const imgData = simCtx.createImageData(simW, simH);
  const data = imgData.data;

  for (let py = 0; py < simH; py++) {
    const ny = py / simH;
    for (let px = 0; px < simW; px++) {
      const nx = px / simW;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const radial = Math.min(1, Math.hypot(dx * 1.12, dy * 1.15) / 0.72);

      const qx = nx * 2.8;
      const qy = ny * 1.85;
      const w1 = marbleFbm(qx + 4.2, qy + 1.9, 5);
      const w2 = marbleFbm(qx + 1.55 * w1 + 8.3, qy + 1.55 * w1 + 5.1, 5);
      const cloud = marbleFbm(nx * 2.3 + w1 * 0.75, ny * 1.6 + w2 * 0.75, 4);

      const diag = nx * 2.35 + ny * 1.45;
      const vein1 = Math.pow(1 - Math.abs(Math.sin((diag + w2 * 2.05) * Math.PI)), 22);
      const vein2 = Math.pow(
        1 - Math.abs(Math.sin((diag * 0.72 - ny * 1.1 + w1 * 1.9 + 0.35) * Math.PI)),
        8
      );
      const crispDetail = Math.pow(
        1 - Math.abs(Math.sin((nx * 4.4 + ny * 2.8 + w2 * 2.6) * Math.PI)),
        32
      );
      const goldGate = Math.max(0, Math.sin((nx * 3.1 - ny * 2.2 + w1 * 2.4) * Math.PI));
      const gMask = Math.min(
        1,
        crispDetail * goldGate * 1.15 + Math.pow(vein1, 2.2) * goldGate * 0.55
      );

      let r: number;
      let g: number;
      let b: number;
      if (isDayMode) {
        const baseR = 250 - radial * 15 - cloud * 10;
        const baseG = 247 - radial * 17 - cloud * 11;
        const baseB = 240 - radial * 21 - cloud * 13;
        r = baseR - vein2 * 16 - vein1 * 24 - crispDetail * 14;
        g = baseG - vein2 * 17 - vein1 * 25 - crispDetail * 15;
        b = baseB - vein2 * 18 - vein1 * 27 - crispDetail * 16;
        r = r * (1 - gMask * 0.65) + 194 * gMask * 0.65;
        g = g * (1 - gMask * 0.65) + 152 * gMask * 0.65;
        b = b * (1 - gMask * 0.65) + 58 * gMask * 0.65;
      } else {
        const lumGlow = (1 - radial) * 16 + cloud * 12;
        const baseR = 14 + lumGlow;
        const baseG = 15 + lumGlow;
        const baseB = 18 + lumGlow * 1.04;
        r = baseR + vein2 * 13 + vein1 * 20 + crispDetail * 14;
        g = baseG + vein2 * 13 + vein1 * 20 + crispDetail * 15;
        b = baseB + vein2 * 14 + vein1 * 22 + crispDetail * 17;
        r = r * (1 - gMask * 0.85) + 224 * gMask * 0.85;
        g = g * (1 - gMask * 0.85) + 182 * gMask * 0.85;
        b = b * (1 - gMask * 0.85) + 74 * gMask * 0.85;
      }

      const idx = (py * simW + px) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      data[idx + 3] = 255;
    }
  }

  simCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(simCanvas, 0, 0, outW, outH);
  return canvas;
}

function drawObsidianLacquerSurface(
  targets: ArtworkPaintTargets,
  w: number,
  h: number,
  isBackFace = false
) {
  const { cCtx, pCtx, bCtx } = targets;

  const grad = cCtx.createLinearGradient(0, 0, w * 0.85, h);
  grad.addColorStop(0, OBSIDIAN_0);
  grad.addColorStop(0.48, OBSIDIAN_1);
  grad.addColorStop(1, OBSIDIAN_2);
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, w, h);

  // Ultra-fine brushed titanium micro-striations
  cCtx.save();
  cCtx.globalAlpha = 0.022;
  for (let x = 0; x < w; x += 3) {
    cCtx.fillStyle = x % 6 === 0 ? "#334768" : "#000000";
    cCtx.fillRect(x, 0, 1, h);
  }
  cCtx.restore();

  // Whisper-quiet concentric security compass arcs (anchored off-center for editorial depth)
  cCtx.save();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.045)";
  cCtx.lineWidth = 1.1;
  const ax = w * 0.82;
  const ay = h * 0.18;
  for (let r = 140; r <= 680; r += 54) {
    cCtx.beginPath();
    cCtx.arc(ax, ay, r, 0, Math.PI * 2);
    cCtx.stroke();
  }
  cCtx.restore();

  if (pCtx) {
    pCtx.fillStyle = isBackFace ? PBR_OBSIDIAN_SATIN_BACK : PBR_OBSIDIAN_LACQUER;
    pCtx.fillRect(0, 0, w, h);
  }
  if (bCtx) {
    bCtx.fillStyle = "#000000";
    bCtx.fillRect(0, 0, w, h);
  }
}

function drawPrecisionPerimeterRule(
  targets: ArtworkPaintTargets,
  w: number,
  h: number,
  inset: number,
  radius: number
) {
  const { cCtx, pCtx, bCtx } = targets;

  const ruleGrad = cCtx.createLinearGradient(0, 0, w, h);
  ruleGrad.addColorStop(0, "rgba(245, 225, 156, 0.72)");
  ruleGrad.addColorStop(0.5, "rgba(212, 175, 55, 0.42)");
  ruleGrad.addColorStop(1, "rgba(143, 107, 20, 0.68)");

  cCtx.strokeStyle = ruleGrad;
  cCtx.lineWidth = 2.4;
  cCtx.beginPath();
  cCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
  cCtx.stroke();

  cCtx.strokeStyle = "rgba(212, 175, 55, 0.18)";
  cCtx.lineWidth = 1.1;
  cCtx.beginPath();
  cCtx.roundRect(inset + 10, inset + 10, w - (inset + 10) * 2, h - (inset + 10) * 2, radius - 6);
  cCtx.stroke();

  if (pCtx) {
    pCtx.strokeStyle = PBR_GOLD_BULLION;
    pCtx.lineWidth = 3.5;
    pCtx.beginPath();
    pCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
    pCtx.stroke();
  }
  if (bCtx) {
    bCtx.strokeStyle = "#a8a8a8";
    bCtx.lineWidth = 2.5;
    bCtx.beginPath();
    bCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
    bCtx.stroke();
  }
}

function drawPrecisionEmvChip(
  targets: ArtworkPaintTargets,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const { cCtx, pCtx, bCtx } = targets;

  const grad = cCtx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#fae7a8");
  grad.addColorStop(0.45, "#d8b23c");
  grad.addColorStop(1, "#8f6912");
  cCtx.fillStyle = grad;
  cCtx.beginPath();
  cCtx.roundRect(x, y, w, h, r);
  cCtx.fill();

  if (pCtx) {
    pCtx.fillStyle = PBR_GOLD_BULLION;
    pCtx.beginPath();
    pCtx.roundRect(x, y, w, h, r);
    pCtx.fill();
  }
  if (bCtx) {
    bCtx.fillStyle = "#e8e8e8";
    bCtx.beginPath();
    bCtx.roundRect(x, y, w, h, r);
    bCtx.fill();
  }

  const etch = (ctx: CanvasRenderingContext2D, stroke: string) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 6, w - 12, h - 12, Math.max(3, r - 4));
    ctx.stroke();

    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.18, cy - h * 0.24, w * 0.36, h * 0.48, 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 6, cy - h * 0.12);
    ctx.lineTo(cx - w * 0.18, cy - h * 0.12);
    ctx.moveTo(x + 6, cy + h * 0.12);
    ctx.lineTo(cx - w * 0.18, cy + h * 0.12);
    ctx.moveTo(x + w - 6, cy - h * 0.12);
    ctx.lineTo(cx + w * 0.18, cy - h * 0.12);
    ctx.moveTo(x + w - 6, cy + h * 0.12);
    ctx.lineTo(cx + w * 0.18, cy + h * 0.12);
    ctx.stroke();
  };

  etch(cCtx, "rgba(58, 38, 4, 0.55)");
  if (pCtx) etch(pCtx, PBR_OBSIDIAN_LACQUER);
  if (bCtx) etch(bCtx, "#181818");
}

function drawOfficialCrestMedallion(
  targets: ArtworkPaintTargets,
  crestImg: HTMLImageElement | null | undefined,
  cx: number,
  cy: number,
  radius: number
) {
  const { cCtx, pCtx, bCtx } = targets;

  cCtx.save();
  const ringGrad = cCtx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  ringGrad.addColorStop(0, GOLD_BRIGHT);
  ringGrad.addColorStop(0.5, GOLD);
  ringGrad.addColorStop(1, GOLD_DEEP);

  cCtx.strokeStyle = ringGrad;
  cCtx.lineWidth = 3.5;
  cCtx.beginPath();
  cCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  cCtx.stroke();

  cCtx.strokeStyle = "rgba(212, 175, 55, 0.28)";
  cCtx.lineWidth = 1.2;
  cCtx.beginPath();
  cCtx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
  cCtx.stroke();

  if (crestImg) {
    cCtx.beginPath();
    cCtx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
    cCtx.clip();
    const s = radius * 2.02;
    cCtx.drawImage(crestImg, cx - s / 2, cy - s / 2, s, s);
  } else {
    cCtx.fillStyle = OBSIDIAN_1;
    cCtx.beginPath();
    cCtx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.fillStyle = GOLD_BRIGHT;
    cCtx.font = `700 ${Math.round(radius * 0.64)}px "Playfair Display", Georgia, serif`;
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";
    cCtx.fillText("43", cx, cy + 2);
  }
  cCtx.restore();

  // Holographic prism ONLY on the thin outer ring (center crest stays 100% crisp & untinted)
  if (pCtx) {
    pCtx.save();
    pCtx.strokeStyle = PBR_HOLO_FOIL;
    pCtx.lineWidth = 6;
    pCtx.beginPath();
    pCtx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    pCtx.stroke();
    pCtx.restore();
  }
  if (bCtx) {
    bCtx.strokeStyle = "#ffffff";
    bCtx.lineWidth = 4;
    bCtx.beginPath();
    bCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    bCtx.stroke();
  }
}

function drawSlotGrommet(targets: ArtworkPaintTargets) {
  const { cCtx, pCtx, bCtx } = targets;
  // Matches createDieCutCardGeometry slotHole at centerY = 3.718 -> canvas (408..616, 84..136)
  cCtx.save();
  const gGrad = cCtx.createLinearGradient(404, 80, 620, 140);
  gGrad.addColorStop(0, GOLD_BRIGHT);
  gGrad.addColorStop(0.5, GOLD);
  gGrad.addColorStop(1, GOLD_DEEP);
  cCtx.strokeStyle = gGrad;
  cCtx.lineWidth = 4.5;
  cCtx.beginPath();
  cCtx.roundRect(408, 84, 208, 52, 26);
  cCtx.stroke();
  cCtx.restore();

  if (pCtx) {
    pCtx.strokeStyle = PBR_GOLD_BULLION;
    pCtx.lineWidth = 7;
    pCtx.beginPath();
    pCtx.roundRect(408, 84, 208, 52, 26);
    pCtx.stroke();
  }
  if (bCtx) {
    bCtx.strokeStyle = "#ffffff";
    bCtx.lineWidth = 5;
    bCtx.beginPath();
    bCtx.roundRect(408, 84, 208, 52, 26);
    bCtx.stroke();
  }
}

function drawQrPlate(
  targets: ArtworkPaintTargets,
  qrCanvas: HTMLCanvasElement | null | undefined,
  x: number,
  y: number,
  size: number,
  radius: number
) {
  const { cCtx, pCtx } = targets;

  cCtx.save();
  cCtx.fillStyle = "#faf8f3";
  cCtx.beginPath();
  cCtx.roundRect(x, y, size, size, radius);
  cCtx.fill();

  cCtx.strokeStyle = GOLD;
  cCtx.lineWidth = 4;
  cCtx.stroke();

  if (qrCanvas) {
    const pad = Math.round(size * 0.055);
    cCtx.drawImage(qrCanvas, x + pad, y + pad, size - pad * 2, size - pad * 2);
  }
  cCtx.restore();

  if (pCtx) {
    pCtx.fillStyle = PBR_MATTE_IVORY;
    pCtx.beginPath();
    pCtx.roundRect(x, y, size, size, radius);
    pCtx.fill();
  }
}

/** Paints Vertical Lanyard ID Card Front (1024x1624 logical coordinate space). */
export function drawIdFrontFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 1624;
  const { cCtx, pCtx, bCtx } = targets;
  const fonts = resolveCardFontStacks();

  drawObsidianLacquerSurface(targets, W, H, false);
  drawPrecisionPerimeterRule(targets, W, H, 34, 34);
  drawSlotGrommet(targets);

  // Subtle holographic security thread along left inner margin
  const threadGrad = cCtx.createLinearGradient(0, 120, 0, H - 120);
  threadGrad.addColorStop(0, "rgba(212,175,55,0)");
  threadGrad.addColorStop(0.2, "rgba(245,225,156,0.65)");
  threadGrad.addColorStop(0.5, "rgba(212,175,55,0.35)");
  threadGrad.addColorStop(0.8, "rgba(245,225,156,0.65)");
  threadGrad.addColorStop(1, "rgba(212,175,55,0)");
  cCtx.fillStyle = threadGrad;
  cCtx.fillRect(68, 110, 3.5, H - 220);
  if (pCtx) {
    pCtx.fillStyle = PBR_HOLO_FOIL;
    pCtx.fillRect(64, 110, 12, H - 220);
  }

  // Balanced Header: Official Crest + Institution Title (left) & 24K EMV Chip (right)
  drawOfficialCrestMedallion(targets, assets.crestImg, 186, 232, 62);

  cCtx.textAlign = "left";
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `700 30px ${fonts.serif}`;
  cCtx.letterSpacing = "4px";
  cCtx.fillText("EXPEDIENT 43", 274, 222);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 20px ${fonts.sans}`;
  cCtx.fillText("Pondok Modern Arrisalah", 274, 258);

  drawPrecisionEmvChip(targets, 774, 186, 122, 92, 15);

  // Editorial Portrait Window (x=128, y=330, w=768, h=668 -> leaves generous room for metadata)
  const px = 128;
  const py = 330;
  const pw = 768;
  const ph = 668;

  cCtx.save();
  cCtx.beginPath();
  cCtx.roundRect(px, py, pw, ph, 22);
  cCtx.clip();

  const portBg = cCtx.createRadialGradient(
    px + pw / 2,
    py + ph * 0.38,
    40,
    px + pw / 2,
    py + ph / 2,
    pw * 0.75
  );
  portBg.addColorStop(0, "#172236");
  portBg.addColorStop(1, "#090e18");
  cCtx.fillStyle = portBg;
  cCtx.fillRect(px, py, pw, ph);

  if (assets.avatarImg) {
    const scale = Math.max(pw / assets.avatarImg.width, ph / assets.avatarImg.height);
    const dw = assets.avatarImg.width * scale;
    const dh = assets.avatarImg.height * scale;
    cCtx.drawImage(assets.avatarImg, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);

    const botShade = cCtx.createLinearGradient(0, py + ph * 0.65, 0, py + ph);
    botShade.addColorStop(0, "rgba(7, 10, 18, 0)");
    botShade.addColorStop(1, "rgba(7, 10, 18, 0.58)");
    cCtx.fillStyle = botShade;
    cCtx.fillRect(px, py, pw, ph);
  } else {
    if (assets.crestImg) {
      cCtx.globalAlpha = 0.14;
      cCtx.drawImage(assets.crestImg, px + pw / 2 - 200, py + ph / 2 - 200, 400, 400);
      cCtx.globalAlpha = 1.0;
    }
    cCtx.fillStyle = GOLD_BRIGHT;
    cCtx.font = `700 180px ${fonts.serif}`;
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";
    cCtx.fillText(identity.nama.charAt(0).toUpperCase(), px + pw / 2, py + ph / 2);
  }
  cCtx.restore();

  cCtx.strokeStyle = GOLD;
  cCtx.lineWidth = 3.2;
  cCtx.beginPath();
  cCtx.roundRect(px, py, pw, ph, 22);
  cCtx.stroke();

  cCtx.strokeStyle = "rgba(245, 225, 156, 0.24)";
  cCtx.lineWidth = 1.2;
  cCtx.beginPath();
  cCtx.roundRect(px + 10, py + 10, pw - 20, ph - 20, 16);
  cCtx.stroke();

  if (pCtx) {
    pCtx.fillStyle = PBR_PORTRAIT_GLASS;
    pCtx.beginPath();
    pCtx.roundRect(px, py, pw, ph, 22);
    pCtx.fill();
  }

  // Editorial Identity Block (Genuine resolved Playfair Display + crisp spacious metadata)
  cCtx.textAlign = "left";
  cCtx.textBaseline = "alphabetic";
  cCtx.fillStyle = GOLD;
  cCtx.font = `600 22px ${fonts.sans}`;
  cCtx.letterSpacing = "3px";
  cCtx.fillText("KARTU TANDA ALUMNI RESMI", 128, 1070);
  cCtx.letterSpacing = "0px";

  const { lines: nameLines, fontSize: namePx } = layoutDisplayName(
    cCtx,
    identity.nama,
    768,
    60,
    40,
    fonts.serif
  );

  cCtx.fillStyle = IVORY;
  cCtx.font = `700 ${namePx}px ${fonts.serif}`;
  const nameStartY = nameLines.length === 1 ? 1148 : 1134;
  const lineStep = Math.round(namePx * 1.16);
  nameLines.forEach((ln, idx) => {
    cCtx.fillText(ln, 128, nameStartY + idx * lineStep);
  });

  if (pCtx) {
    pCtx.fillStyle = PBR_ENGRAVED_TYPE;
    pCtx.font = `700 ${namePx}px ${fonts.serif}`;
    nameLines.forEach((ln, idx) => {
      pCtx.fillText(ln, 128, nameStartY + idx * lineStep);
    });
  }
  if (bCtx) {
    bCtx.fillStyle = "#b8b8b8";
    bCtx.font = `700 ${namePx}px ${fonts.serif}`;
    nameLines.forEach((ln, idx) => {
      bCtx.fillText(ln, 128, nameStartY + idx * lineStep);
    });
  }

  // Hairline gold divider above legible 2-column metadata grid
  const divY = 1254;
  cCtx.fillStyle = "rgba(212, 175, 55, 0.36)";
  cCtx.fillRect(128, divY, 768, 2);
  if (pCtx) {
    pCtx.fillStyle = PBR_GOLD_BULLION;
    pCtx.fillRect(128, divY, 768, 2);
  }

  // Left Column: Domisili & Angkatan
  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 21px ${fonts.sans}`;
  cCtx.fillText("Domisili", 128, 1312);
  cCtx.fillStyle = IVORY;
  cCtx.font = `600 29px ${fonts.sans}`;
  cCtx.fillText(identity.domisili, 128, 1354);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 21px ${fonts.sans}`;
  cCtx.fillText("Angkatan", 128, 1422);
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `600 27px ${fonts.sans}`;
  cCtx.fillText("Ke-43 · Expedient Generation", 128, 1464);

  // Right Column: Tabular Alumni ID & Verification Status
  cCtx.textAlign = "right";
  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 21px ${fonts.sans}`;
  cCtx.fillText("Nomor Anggota", 896, 1312);
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `700 34px ${fonts.tabular}`;
  cCtx.fillText(identity.nomorId, 896, 1356);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 21px ${fonts.sans}`;
  cCtx.fillText("Masa Berlaku", 896, 1422);
  cCtx.fillStyle = IVORY;
  cCtx.font = `600 27px ${fonts.sans}`;
  cCtx.fillText("Seumur Hidup", 896, 1464);
  cCtx.textAlign = "left";
}

/** Paints Vertical Lanyard ID Card Back (1024x1624 logical coordinate space). */
export function drawIdBackFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 1624;
  const { cCtx, pCtx } = targets;
  const fonts = resolveCardFontStacks();

  drawObsidianLacquerSurface(targets, W, H, true);

  // Subtle institutional crest guilloche watermark behind central verification vault
  if (assets.crestImg) {
    cCtx.save();
    cCtx.globalAlpha = 0.048;
    cCtx.drawImage(assets.crestImg, 272, 666, 480, 480);
    cCtx.restore();
  }

  drawPrecisionPerimeterRule(targets, W, H, 34, 34);
  drawSlotGrommet(targets);

  // Framed Matte Obsidian Magnetic Track (cleanly inset inside perimeter rule)
  cCtx.fillStyle = "#03050a";
  cCtx.beginPath();
  cCtx.roundRect(56, 178, W - 112, 154, 12);
  cCtx.fill();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.32)";
  cCtx.lineWidth = 2;
  cCtx.stroke();
  if (pCtx) {
    pCtx.fillStyle = PBR_SATIN_BAND;
    pCtx.fillRect(56, 178, W - 112, 154);
  }

  // Editorial Diplomatic Certificate Heading
  cCtx.textAlign = "center";
  cCtx.fillStyle = GOLD;
  cCtx.font = `600 18px ${fonts.sans}`;
  cCtx.letterSpacing = "3.5px";
  cCtx.fillText("DOKUMEN IDENTITAS RESMI", 512, 404);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `700 40px ${fonts.serif}`;
  cCtx.fillText("Verifikasi Keanggotaan Resmi", 512, 456);

  // Delicate architectural rule flanked by gold diamond pip
  cCtx.fillStyle = "rgba(212, 175, 55, 0.35)";
  cCtx.fillRect(284, 486, 198, 1.8);
  cCtx.fillRect(542, 486, 198, 1.8);
  cCtx.save();
  cCtx.translate(512, 487);
  cCtx.rotate(Math.PI / 4);
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.fillRect(-5, -5, 10, 10);
  cCtx.restore();

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `400 24px ${fonts.sans}`;
  const lines = [
    "Pemegang kartu tertera di balik adalah anggota sah",
    "Keluarga Besar Alumni Angkatan ke-43",
    "Pondok Modern Arrisalah, Slahung, Ponorogo.",
  ];
  lines.forEach((line, idx) => cCtx.fillText(line, 512, 542 + idx * 40));

  // Corner Precision Registration Brackets framing the QR Verification Vault
  cCtx.save();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.52)";
  cCtx.lineWidth = 2.4;
  const bx0 = 282;
  const by0 = 676;
  const bSize = 460;
  const arm = 34;
  const corners: Array<[number, number, number, number]> = [
    [bx0, by0, 1, 1],
    [bx0 + bSize, by0, -1, 1],
    [bx0, by0 + bSize, 1, -1],
    [bx0 + bSize, by0 + bSize, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    cCtx.beginPath();
    cCtx.moveTo(cx + arm * dx, cy);
    cCtx.lineTo(cx, cy);
    cCtx.lineTo(cx, cy + arm * dy);
    cCtx.stroke();
  }
  cCtx.restore();

  // Crisp Local High-DPI Verification QR Plate (exact centered match to 3D idBackQrBezel)
  drawQrPlate(targets, assets.qrCanvas, 312, 706, 400, 26);

  cCtx.fillStyle = GOLD;
  cCtx.font = `600 20px ${fonts.sans}`;
  cCtx.letterSpacing = "1.5px";
  cCtx.fillText("PINDAI QR VERIFIKASI DARING", 512, 1172);
  cCtx.letterSpacing = "0px";

  // Authorized Signature Plaque (x=172, y=1232, w=680, h=84 -> synced with 3D idBackSigBezel)
  const sigGrad = cCtx.createLinearGradient(172, 1232, 852, 1316);
  sigGrad.addColorStop(0, "#f7f3ea");
  sigGrad.addColorStop(0.5, "#fbf9f5");
  sigGrad.addColorStop(1, "#ede6d6");
  cCtx.fillStyle = sigGrad;
  cCtx.beginPath();
  cCtx.roundRect(172, 1232, 680, 84, 14);
  cCtx.fill();

  // Subtle horizontal ruled line inside signature vellum
  cCtx.fillStyle = "rgba(143, 107, 20, 0.22)";
  cCtx.fillRect(212, 1294, 600, 1.2);

  cCtx.fillStyle = "#0f172a";
  cCtx.font = `italic 700 36px ${fonts.serif}`;
  cCtx.fillText(identity.panggilan, 512, 1284);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 18px ${fonts.sans}`;
  cCtx.fillText("Tanda Tangan & Identitas Terdaftar", 512, 1356);

  // Subtle hairline & Official Registry Seal Footer
  cCtx.fillStyle = "rgba(212, 175, 55, 0.28)";
  cCtx.fillRect(172, 1396, 680, 1.5);

  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `700 25px ${fonts.tabular}`;
  cCtx.letterSpacing = "2px";
  cCtx.fillText(`${identity.nomorId}  ·  ANGKATAN KE-43`, 512, 1448);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 19px ${fonts.sans}`;
  cCtx.fillText("PONDOK MODERN ARRISALAH · SLAHUNG, PONOROGO", 512, 1486);
  cCtx.textAlign = "left";
}

/** Paints Horizontal Wallet KTA Card Front (1024x640 ISO ID-1 proportion). */
export function drawKtaFrontFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 640;
  const { cCtx, pCtx } = targets;
  const fonts = resolveCardFontStacks();

  drawObsidianLacquerSurface(targets, W, H, false);

  if (assets.crestImg) {
    cCtx.save();
    cCtx.globalAlpha = 0.055;
    cCtx.drawImage(assets.crestImg, 322, 110, 420, 420);
    cCtx.restore();
  }

  drawPrecisionPerimeterRule(targets, W, H, 24, 28);

  // Top Header: Official Crest + Expedient 43 Title
  drawOfficialCrestMedallion(targets, assets.crestImg, 114, 112, 46);

  cCtx.textAlign = "left";
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `700 30px ${fonts.serif}`;
  cCtx.letterSpacing = "4px";
  cCtx.fillText("EXPEDIENT GENERATION", 182, 106);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 18px ${fonts.sans}`;
  cCtx.fillText("Pondok Modern Arrisalah · Alumni Angkatan ke-43", 182, 136);

  // Mid-left 24K Gold EMV Chip + Contactless Wave
  drawPrecisionEmvChip(targets, 72, 202, 108, 82, 13);

  cCtx.save();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.55)";
  cCtx.lineWidth = 2.6;
  cCtx.lineCap = "round";
  for (let r = 12; r <= 28; r += 8) {
    cCtx.beginPath();
    cCtx.arc(204, 243, r, -Math.PI * 0.34, Math.PI * 0.34);
    cCtx.stroke();
  }
  cCtx.restore();

  // Sharp Tabular Credential Number + Custom-Drawn Security Pips (Zero Bump Smudge!)
  const suffix = identity.nomorId.replace("EXP-", "");
  const digitFont = `700 34px ${fonts.tabular}`;
  const drawCredentialLine = (ctx: CanvasRenderingContext2D, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = digitFont;
    ctx.letterSpacing = "2.5px";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("4300", 72, 356);
    ctx.fillText("2026", 190, 356);

    // 4 crisp circular geometric security pips (never thick fuzzy monospace bullets)
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(320 + i * 20, 344, 4.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillText(suffix, 412, 356);
    ctx.letterSpacing = "0px";
    ctx.restore();
  };

  drawCredentialLine(cCtx, GOLD_BRIGHT);
  if (pCtx) {
    drawCredentialLine(pCtx, PBR_GOLD_BULLION);
  }

  // Bottom-Left Member Name (Auto-fitted in genuine Playfair Display)
  cCtx.fillStyle = GOLD;
  cCtx.font = `600 17px ${fonts.sans}`;
  cCtx.letterSpacing = "2.5px";
  cCtx.fillText("PEMEGANG KARTU", 72, 428);
  cCtx.letterSpacing = "0px";

  const { lines: ktaLines, fontSize: ktaPx } = layoutDisplayName(
    cCtx,
    identity.nama,
    620,
    40,
    26,
    fonts.serif
  );
  cCtx.fillStyle = IVORY;
  cCtx.font = `700 ${ktaPx}px ${fonts.serif}`;
  const ktaBaseY = ktaLines.length === 1 ? 482 : 468;
  ktaLines.forEach((ln, idx) => {
    cCtx.fillText(ln, 72, ktaBaseY + idx * Math.round(ktaPx * 1.14));
  });

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `500 21px ${fonts.sans}`;
  cCtx.fillText(`${identity.domisili}  ·  ${identity.nomorId}`, 72, 566);

  // Right Chamfered Portrait Window (x=736, y=194, w=224, h=376, r=20)
  const ax = 736;
  const ay = 194;
  const aw = 224;
  const ah = 376;

  cCtx.save();
  cCtx.beginPath();
  cCtx.roundRect(ax, ay, aw, ah, 20);
  cCtx.clip();
  cCtx.fillStyle = "#111a2a";
  cCtx.fillRect(ax, ay, aw, ah);

  if (assets.avatarImg) {
    const s = Math.max(aw / assets.avatarImg.width, ah / assets.avatarImg.height);
    const dw = assets.avatarImg.width * s;
    const dh = assets.avatarImg.height * s;
    cCtx.drawImage(assets.avatarImg, ax + (aw - dw) / 2, ay + (ah - dh) / 2, dw, dh);
  } else {
    cCtx.fillStyle = GOLD_BRIGHT;
    cCtx.font = `700 92px ${fonts.serif}`;
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";
    cCtx.fillText(identity.nama.charAt(0).toUpperCase(), ax + aw / 2, ay + ah / 2);
  }
  cCtx.restore();

  cCtx.strokeStyle = GOLD;
  cCtx.lineWidth = 3;
  cCtx.beginPath();
  cCtx.roundRect(ax, ay, aw, ah, 20);
  cCtx.stroke();

  if (pCtx) {
    pCtx.fillStyle = PBR_PORTRAIT_GLASS;
    pCtx.beginPath();
    pCtx.roundRect(ax, ay, aw, ah, 20);
    pCtx.fill();
  }
}

/** Paints Horizontal Wallet KTA Card Back (1024x640 ISO ID-1 proportion). */
export function drawKtaBackFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 640;
  const { cCtx, pCtx } = targets;
  const fonts = resolveCardFontStacks();

  drawObsidianLacquerSurface(targets, W, H, true);

  if (assets.crestImg) {
    cCtx.save();
    cCtx.globalAlpha = 0.045;
    cCtx.drawImage(assets.crestImg, 210, 220, 320, 320);
    cCtx.restore();
  }

  drawPrecisionPerimeterRule(targets, W, H, 24, 28);

  // Framed Satin Magnetic Band inset inside perimeter rule
  cCtx.fillStyle = "#03050a";
  cCtx.beginPath();
  cCtx.roundRect(46, 62, W - 92, 92, 10);
  cCtx.fill();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.3)";
  cCtx.lineWidth = 1.8;
  cCtx.stroke();
  if (pCtx) {
    pCtx.fillStyle = PBR_SATIN_BAND;
    pCtx.fillRect(46, 62, W - 92, 92);
  }

  // Signature Plaque + Official Verification Text on Left
  const sigGrad = cCtx.createLinearGradient(68, 198, 628, 266);
  sigGrad.addColorStop(0, "#f7f3ea");
  sigGrad.addColorStop(0.5, "#fbf9f5");
  sigGrad.addColorStop(1, "#ede6d6");
  cCtx.fillStyle = sigGrad;
  cCtx.beginPath();
  cCtx.roundRect(68, 198, 560, 68, 10);
  cCtx.fill();
  cCtx.fillStyle = "rgba(143, 107, 20, 0.22)";
  cCtx.fillRect(92, 249, 512, 1.2);

  cCtx.textAlign = "left";
  cCtx.fillStyle = "#0f172a";
  cCtx.font = `italic 700 30px ${fonts.serif}`;
  cCtx.fillText(identity.panggilan, 92, 241);

  cCtx.fillStyle = GOLD;
  cCtx.font = `600 15px ${fonts.sans}`;
  cCtx.letterSpacing = "2px";
  cCtx.fillText("TANDA TANGAN PEMEGANG RESMI", 68, 294);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `700 28px ${fonts.serif}`;
  cCtx.fillText("Kartu Tanda Alumni Resmi", 68, 354);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = `400 21px ${fonts.sans}`;
  cCtx.fillText("Keluarga Besar Alumni Angkatan ke-43", 68, 396);
  cCtx.fillText("Pondok Modern Arrisalah · Slahung, Ponorogo", 68, 428);

  cCtx.fillStyle = "rgba(212, 175, 55, 0.28)";
  cCtx.fillRect(68, 488, 540, 1.5);

  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = `700 23px ${fonts.tabular}`;
  cCtx.fillText(`${identity.nomorId}  ·  TERVERIFIKASI  ·  SEUMUR HIDUP`, 68, 548);

  // Right High-DPI Local Verification QR Plate
  drawQrPlate(targets, assets.qrCanvas, 694, 198, 262, 20);
  cCtx.textAlign = "center";
  cCtx.fillStyle = GOLD;
  cCtx.font = `600 17px ${fonts.sans}`;
  cCtx.fillText("Pindai Verifikasi", 825, 496);
  cCtx.textAlign = "left";
}

/** Creates a procedural satin woven ribbon strap texture printed with subtle cohort branding. */
export function createWovenStrapCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0e131d";
  ctx.fillRect(0, 0, w, h);

  // Herringbone satin weave
  ctx.strokeStyle = "rgba(255, 255, 255, 0.038)";
  ctx.lineWidth = 2;
  for (let y = -16; y < h + 16; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w / 2, y + 9);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Fine woven 24K gold edge selvedge
  ctx.fillStyle = "rgba(212, 175, 55, 0.55)";
  ctx.fillRect(10, 0, 4, h);
  ctx.fillRect(w - 14, 0, 4, h);

  const fonts = resolveCardFontStacks();
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(212, 175, 55, 0.34)";
  ctx.font = `600 20px ${fonts.sans}`;
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXPEDIENT 43 · ARRISALAH", 0, 0);
  ctx.restore();

  return canvas;
}
