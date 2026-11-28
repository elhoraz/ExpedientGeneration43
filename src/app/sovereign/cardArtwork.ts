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

const PBR_OBSIDIAN_LACQUER = pbrSurface(0.0, 0.16, 0.28);
const PBR_SATIN_BAND = pbrSurface(0.0, 0.34, 0.14);
const PBR_GOLD_BULLION = pbrSurface(0.03, 0.13, 0.98);
const PBR_HOLO_FOIL = pbrSurface(0.52, 0.15, 0.95);
const PBR_PORTRAIT_GLASS = pbrSurface(0.0, 0.08, 0.05);
const PBR_MATTE_IVORY = pbrSurface(0.0, 0.84, 0.02);
const PBR_ENGRAVED_TYPE = pbrSurface(0.0, 0.22, 0.78);

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

/** Generates a crisp, zero-network local QR code canvas with high error-correction (`H`). */
export async function generateVerificationQrCanvas(
  verificationUrl: string,
  pixelSize = 480
): Promise<HTMLCanvasElement | null> {
  if (typeof document === "undefined" || !verificationUrl) return null;
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

    // Center miniature 43 seal emblem (safe under Level H 30% error correction)
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
      ctx.font = `700 ${Math.round(r * 0.92)}px "Playfair Display", Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("43", c, c + 1);
      ctx.restore();
    }
    return canvas;
  } catch {
    return null;
  }
}

/** Loads an image safely with CORS support; resolves to null on failure. */
export function loadArtworkImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url || typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
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

/**
 * Creates a smooth organic Bezier Kintsugi studio backdrop (zero jagged polyline zig-zags).
 */
export function createMarbleWallCanvas(isDayMode: boolean, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createRadialGradient(
    size * 0.5,
    size * 0.45,
    size * 0.04,
    size * 0.5,
    size * 0.5,
    size * 0.78
  );
  if (isDayMode) {
    bg.addColorStop(0, "#fbf9f4");
    bg.addColorStop(0.55, "#f1ece1");
    bg.addColorStop(1, "#e2dacb");
  } else {
    bg.addColorStop(0, "#1b2b46");
    bg.addColorStop(0.52, "#0e1828");
    bg.addColorStop(1, "#060a12");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Smooth organic stone strata using continuous cubic Bezier ribbons
  ctx.save();
  for (let layer = 0; layer < 14; layer++) {
    const yBase = (layer / 13) * size;
    const amp = size * (0.025 + (layer % 3) * 0.012);
    ctx.beginPath();
    ctx.moveTo(-size * 0.05, yBase);
    ctx.bezierCurveTo(
      size * 0.28,
      yBase - amp,
      size * 0.68,
      yBase + amp * 1.15,
      size * 1.05,
      yBase - amp * 0.4
    );
    ctx.strokeStyle = isDayMode
      ? `rgba(140, 124, 96, ${0.14 + (layer % 3) * 0.05})`
      : `rgba(70, 96, 142, ${0.14 + (layer % 3) * 0.05})`;
    ctx.lineWidth = size * (0.004 + (layer % 4) * 0.0025);
    ctx.stroke();
  }

  // Delicate curved Kintsugi 24K gold seams
  const seams: Array<[number, number, number, number, number, number, number, number]> = [
    [0.08, 0.18, 0.32, 0.28, 0.58, 0.14, 0.92, 0.26],
    [0.14, 0.78, 0.42, 0.66, 0.66, 0.84, 0.95, 0.72],
    [0.24, 0.04, 0.31, 0.36, 0.21, 0.64, 0.34, 0.96],
    [0.76, 0.06, 0.69, 0.38, 0.81, 0.66, 0.71, 0.95],
  ];

  ctx.lineCap = "round";
  for (const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] of seams) {
    ctx.beginPath();
    ctx.moveTo(x0 * size, y0 * size);
    ctx.bezierCurveTo(
      cx1 * size,
      cy1 * size,
      cx2 * size,
      cy2 * size,
      x1 * size,
      y1 * size
    );
    ctx.shadowBlur = size * 0.008;
    ctx.shadowColor = isDayMode ? "rgba(180, 138, 36, 0.16)" : "rgba(229, 193, 88, 0.35)";
    ctx.strokeStyle = isDayMode ? "rgba(160, 118, 28, 0.7)" : "rgba(235, 200, 96, 0.72)";
    ctx.lineWidth = Math.max(2, size * 0.0024);
    ctx.stroke();
  }
  ctx.restore();

  return canvas;
}

function drawObsidianLacquerSurface(targets: ArtworkPaintTargets, w: number, h: number) {
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
    pCtx.fillStyle = PBR_OBSIDIAN_LACQUER;
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

  drawObsidianLacquerSurface(targets, W, H);
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
  drawOfficialCrestMedallion(targets, assets.crestImg, 186, 236, 62);

  cCtx.textAlign = "left";
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = '700 30px "Playfair Display", Georgia, serif';
  cCtx.letterSpacing = "4px";
  cCtx.fillText("EXPEDIENT 43", 274, 226);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 19px "Inter", sans-serif';
  cCtx.fillText("Pondok Modern Arrisalah", 274, 260);

  drawPrecisionEmvChip(targets, 774, 190, 122, 92, 15);

  // Editorial Portrait Window (x=128, y=340, w=768, h=704)
  const px = 128;
  const py = 340;
  const pw = 768;
  const ph = 704;

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
    botShade.addColorStop(1, "rgba(7, 10, 18, 0.55)");
    cCtx.fillStyle = botShade;
    cCtx.fillRect(px, py, pw, ph);
  } else {
    // Dignified calligraphic monogram portrait fallback
    if (assets.crestImg) {
      cCtx.globalAlpha = 0.14;
      cCtx.drawImage(assets.crestImg, px + pw / 2 - 200, py + ph / 2 - 200, 400, 400);
      cCtx.globalAlpha = 1.0;
    }
    cCtx.fillStyle = GOLD_BRIGHT;
    cCtx.font = '700 180px "Playfair Display", Georgia, serif';
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

  // Editorial Identity Block (No horizontal text squishing!)
  cCtx.textAlign = "left";
  cCtx.textBaseline = "alphabetic";
  cCtx.fillStyle = GOLD;
  cCtx.font = '600 21px "Inter", sans-serif';
  cCtx.letterSpacing = "3px";
  cCtx.fillText("KARTU TANDA ALUMNI RESMI", 128, 1112);
  cCtx.letterSpacing = "0px";

  const { lines: nameLines, fontSize: namePx } = layoutDisplayName(
    cCtx,
    identity.nama,
    768,
    58,
    38,
    '"Playfair Display", Georgia, serif'
  );

  cCtx.fillStyle = IVORY;
  cCtx.font = `700 ${namePx}px "Playfair Display", Georgia, serif`;
  const nameStartY = nameLines.length === 1 ? 1188 : 1172;
  const lineStep = Math.round(namePx * 1.16);
  nameLines.forEach((ln, idx) => {
    cCtx.fillText(ln, 128, nameStartY + idx * lineStep);
  });

  if (pCtx) {
    pCtx.fillStyle = PBR_ENGRAVED_TYPE;
    pCtx.font = `700 ${namePx}px "Playfair Display", Georgia, serif`;
    nameLines.forEach((ln, idx) => {
      pCtx.fillText(ln, 128, nameStartY + idx * lineStep);
    });
  }
  if (bCtx) {
    bCtx.fillStyle = "#ffffff";
    bCtx.font = `700 ${namePx}px "Playfair Display", Georgia, serif`;
    nameLines.forEach((ln, idx) => {
      bCtx.fillText(ln, 128, nameStartY + idx * lineStep);
    });
  }

  // Hairline gold divider above 2-column architectural metadata grid
  const divY = 1288;
  cCtx.fillStyle = "rgba(212, 175, 55, 0.34)";
  cCtx.fillRect(128, divY, 768, 2);
  if (pCtx) {
    pCtx.fillStyle = PBR_GOLD_BULLION;
    pCtx.fillRect(128, divY, 768, 2);
  }

  // Left Column: Domisili & Cohort
  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 19px "Inter", sans-serif';
  cCtx.fillText("Domisili", 128, 1340);
  cCtx.fillStyle = IVORY;
  cCtx.font = '600 25px "Inter", sans-serif';
  cCtx.fillText(identity.domisili, 128, 1376);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 19px "Inter", sans-serif';
  cCtx.fillText("Angkatan", 128, 1434);
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = '600 24px "Inter", sans-serif';
  cCtx.fillText("Ke-43 · Expedient Generation", 128, 1470);

  // Right Column: Tabular Alumni ID & Verification Status
  cCtx.textAlign = "right";
  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 19px "Inter", sans-serif';
  cCtx.fillText("Nomor Anggota", 896, 1340);
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = "700 30px monospace";
  cCtx.fillText(identity.nomorId, 896, 1378);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 19px "Inter", sans-serif';
  cCtx.fillText("Masa Berlaku", 896, 1434);
  cCtx.fillStyle = IVORY;
  cCtx.font = '600 24px "Inter", sans-serif';
  cCtx.fillText("Seumur Hidup", 896, 1470);
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

  drawObsidianLacquerSurface(targets, W, H);
  drawPrecisionPerimeterRule(targets, W, H, 34, 34);
  drawSlotGrommet(targets);

  // Satin Magnetic Band cleanly below die-cut slot grommet
  cCtx.fillStyle = "#020408";
  cCtx.fillRect(36, 178, W - 72, 154);
  if (pCtx) {
    pCtx.fillStyle = PBR_SATIN_BAND;
    pCtx.fillRect(36, 178, W - 72, 154);
  }

  cCtx.textAlign = "center";
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = '700 38px "Playfair Display", Georgia, serif';
  cCtx.fillText("Verifikasi Keanggotaan Resmi", 512, 438);

  cCtx.fillStyle = "rgba(212, 175, 55, 0.38)";
  cCtx.fillRect(382, 466, 260, 2);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '400 25px "Inter", sans-serif';
  const lines = [
    "Kartu ini menerangkan bahwa pemegang bernama di balik",
    "adalah anggota sah Keluarga Besar Alumni Angkatan ke-43",
    "Pondok Modern Arrisalah, Slahung, Ponorogo.",
  ];
  lines.forEach((line, idx) => cCtx.fillText(line, 512, 534 + idx * 42));

  // Crisp Local High-DPI Verification QR Plate
  drawQrPlate(targets, assets.qrCanvas, 312, 706, 400, 26);

  cCtx.fillStyle = GOLD;
  cCtx.font = '600 22px "Inter", sans-serif';
  cCtx.fillText("Pindai kode QR untuk membuka profil verifikasi", 512, 1166);

  // Authorized Signature Strip
  cCtx.fillStyle = "#f4f1ea";
  cCtx.beginPath();
  cCtx.roundRect(172, 1244, 680, 86, 14);
  cCtx.fill();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.5)";
  cCtx.lineWidth = 2;
  cCtx.stroke();

  cCtx.fillStyle = "#0f172a";
  cCtx.font = 'italic 700 36px "Playfair Display", Georgia, serif';
  cCtx.fillText(identity.panggilan, 512, 1299);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = "600 22px monospace";
  cCtx.fillText(`${identity.nomorId}  ·  PONDOK MODERN ARRISALAH`, 512, 1438);
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
  const { cCtx, pCtx, bCtx } = targets;

  drawObsidianLacquerSurface(targets, W, H);

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
  cCtx.font = '700 30px "Playfair Display", Georgia, serif';
  cCtx.letterSpacing = "4px";
  cCtx.fillText("EXPEDIENT GENERATION", 182, 106);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 18px "Inter", sans-serif';
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

  // Embossed Tabular Credential Number
  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = "700 35px monospace";
  cCtx.letterSpacing = "2px";
  cCtx.fillText(identity.maskedCardNumber, 72, 356);
  cCtx.letterSpacing = "0px";

  if (pCtx) {
    pCtx.fillStyle = PBR_GOLD_BULLION;
    pCtx.font = "700 35px monospace";
    pCtx.letterSpacing = "2px";
    pCtx.fillText(identity.maskedCardNumber, 72, 356);
    pCtx.letterSpacing = "0px";
  }
  if (bCtx) {
    bCtx.fillStyle = "#ffffff";
    bCtx.font = "700 35px monospace";
    bCtx.letterSpacing = "2px";
    bCtx.fillText(identity.maskedCardNumber, 72, 356);
    bCtx.letterSpacing = "0px";
  }

  // Bottom-Left Member Name (Auto-fitted, never horizontally squished)
  cCtx.fillStyle = GOLD;
  cCtx.font = '600 16px "Inter", sans-serif';
  cCtx.letterSpacing = "2.5px";
  cCtx.fillText("PEMEGANG KARTU", 72, 430);
  cCtx.letterSpacing = "0px";

  const { lines: ktaLines, fontSize: ktaPx } = layoutDisplayName(
    cCtx,
    identity.nama,
    620,
    38,
    26,
    '"Playfair Display", Georgia, serif'
  );
  cCtx.fillStyle = IVORY;
  cCtx.font = `700 ${ktaPx}px "Playfair Display", Georgia, serif`;
  const ktaBaseY = ktaLines.length === 1 ? 482 : 468;
  ktaLines.forEach((ln, idx) => {
    cCtx.fillText(ln, 72, ktaBaseY + idx * Math.round(ktaPx * 1.14));
  });

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 20px "Inter", sans-serif';
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
    cCtx.font = '700 92px "Playfair Display", Georgia, serif';
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

  drawObsidianLacquerSurface(targets, W, H);
  drawPrecisionPerimeterRule(targets, W, H, 24, 28);

  // Satin Magnetic Band
  cCtx.fillStyle = "#020408";
  cCtx.fillRect(26, 62, W - 52, 92);
  if (pCtx) {
    pCtx.fillStyle = PBR_SATIN_BAND;
    pCtx.fillRect(26, 62, W - 52, 92);
  }

  // Signature Strip + Official Verification Text on Left
  cCtx.fillStyle = "#f4f1ea";
  cCtx.beginPath();
  cCtx.roundRect(68, 198, 560, 68, 10);
  cCtx.fill();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.45)";
  cCtx.lineWidth = 1.8;
  cCtx.stroke();

  cCtx.textAlign = "left";
  cCtx.fillStyle = "#0f172a";
  cCtx.font = 'italic 700 30px "Playfair Display", Georgia, serif';
  cCtx.fillText(identity.panggilan, 92, 243);

  cCtx.fillStyle = GOLD_BRIGHT;
  cCtx.font = '700 26px "Playfair Display", Georgia, serif';
  cCtx.fillText("Kartu Tanda Alumni Resmi", 68, 336);

  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '400 21px "Inter", sans-serif';
  cCtx.fillText("Keluarga Besar Alumni Angkatan ke-43", 68, 378);
  cCtx.fillText("Pondok Modern Arrisalah · Slahung, Ponorogo", 68, 412);

  cCtx.fillStyle = GOLD;
  cCtx.font = "600 22px monospace";
  cCtx.fillText(`${identity.nomorId}  ·  SEUMUR HIDUP`, 68, 548);

  // Right High-DPI Local Verification QR Plate
  drawQrPlate(targets, assets.qrCanvas, 694, 198, 262, 20);
  cCtx.textAlign = "center";
  cCtx.fillStyle = SLATE_MUTED;
  cCtx.font = '500 17px "Inter", sans-serif';
  cCtx.fillText("Pindai Verifikasi", 825, 494);
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

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
  ctx.font = '600 20px "Inter", sans-serif';
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXPEDIENT 43 · ARRISALAH", 0, 0);
  ctx.restore();

  return canvas;
}
