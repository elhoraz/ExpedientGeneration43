"use client";

export type CardThemeMode = "dark" | "light";

export interface CardIdentityData {
  nama: string;
  panggilan: string;
  nomorId: string;
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
  qrImg?: HTMLImageElement | null;
}

/**
 * Encodes three PBR surface properties into RGB channels of one texture:
 * - R: Holographic diffraction intensity (used by custom GLSL foil shader)
 * - G: Micro-surface roughness (roughnessMap)
 * - B: Metalness (metalnessMap)
 */
export function pbrSurface(holo: number, roughness: number, metalness: number): string {
  const r = Math.max(0, Math.min(255, Math.round(holo * 255)));
  const g = Math.max(10, Math.min(250, Math.round(roughness * 255)));
  const b = Math.max(4, Math.min(252, Math.round(metalness * 255)));
  return `rgb(${r}, ${g}, ${b})`;
}

const PBR_CARD_DARK = pbrSurface(0.0, 0.48, 0.24);
const PBR_CARD_LIGHT = pbrSurface(0.0, 0.34, 0.36);
const PBR_FOIL_GOLD = pbrSurface(0.18, 0.15, 0.96);
const PBR_HOLO_FOIL = pbrSurface(0.95, 0.14, 0.95);
const PBR_HOLO_STRIP = pbrSurface(0.72, 0.22, 0.85);
const PBR_GLASS = pbrSurface(0.04, 0.09, 0.08);
const PBR_MAG_STRIPE = pbrSurface(0.0, 0.26, 0.12);
const PBR_MATTE_QR = pbrSurface(0.0, 0.82, 0.02);
const PBR_TEXT_PRIMARY = pbrSurface(0.1, 0.32, 0.65);

interface Palette {
  bgGradStart: string;
  bgGradMid: string;
  bgGradEnd: string;
  grainLineA: string;
  grainLineB: string;
  guillocheStroke: string;
  goldMain: string;
  goldSoft: string;
  textPrimary: string;
  textMuted: string;
  photoBg: string;
  slotBg: string;
  magStripe: string;
  pbrBase: string;
}

function getPalette(theme: CardThemeMode): Palette {
  if (theme === "light") {
    return {
      bgGradStart: "#ffffff",
      bgGradMid: "#f5f2ea",
      bgGradEnd: "#e7dfd0",
      grainLineA: "rgba(180, 150, 95, 0.07)",
      grainLineB: "rgba(255, 255, 255, 0.16)",
      guillocheStroke: "rgba(156, 114, 30, 0.11)",
      goldMain: "#9b7016",
      goldSoft: "rgba(155, 112, 22, 0.38)",
      textPrimary: "#18181b",
      textMuted: "#52525b",
      photoBg: "#e6dfd1",
      slotBg: "#e9e3d5",
      magStripe: "#1e2430",
      pbrBase: PBR_CARD_LIGHT,
    };
  }
  return {
    bgGradStart: "#0f1726",
    bgGradMid: "#080e1a",
    bgGradEnd: "#04070e",
    grainLineA: "rgba(42, 60, 92, 0.09)",
    grainLineB: "rgba(0, 0, 0, 0.14)",
    guillocheStroke: "rgba(212, 175, 55, 0.11)",
    goldMain: "#d4af37",
    goldSoft: "rgba(212, 175, 55, 0.35)",
    textPrimary: "#f8fafc",
    textMuted: "#9aa7b6",
    photoBg: "#121b2b",
    slotBg: "#03050a",
    magStripe: "#05070d",
    pbrBase: PBR_CARD_DARK,
  };
}

/** Loads an image safely with CORS support; resolves to null on error or empty URL. */
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

function drawGuillocheBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pal: Palette,
  cx: number,
  cy: number
) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, pal.bgGradStart);
  grad.addColorStop(0.52, pal.bgGradMid);
  grad.addColorStop(1, pal.bgGradEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Fine brushed satin metal striations
  for (let i = 0; i < w; i += 3) {
    ctx.fillStyle = i % 6 === 0 ? pal.grainLineA : pal.grainLineB;
    ctx.fillRect(i, 0, 1, h);
  }

  // Trigonometric guilloche security wave grid
  ctx.save();
  ctx.strokeStyle = pal.guillocheStroke;
  ctx.lineWidth = 1.25;
  const rows = Math.ceil(h / 42);
  for (let r = 0; r < rows; r++) {
    const baseY = r * 42;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 24) {
      const y =
        baseY +
        Math.sin((x / w) * Math.PI * 5 + r * 0.45) * 14 +
        Math.cos((x / w) * Math.PI * 9 - r * 0.3) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Geometric Islamic octagonal rosette watermark
  ctx.translate(cx, cy);
  ctx.strokeStyle = pal.goldSoft;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.22;
  for (let ring = 0; ring < 3; ring++) {
    const rad = 170 + ring * 55;
    ctx.save();
    ctx.rotate((ring * Math.PI) / 8);
    ctx.strokeRect(-rad * 0.707, -rad * 0.707, rad * 1.414, rad * 1.414);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-rad * 0.707, -rad * 0.707, rad * 1.414, rad * 1.414);
    ctx.restore();
  }
  ctx.restore();
}

function drawBasePbrAndBump(targets: ArtworkPaintTargets, w: number, h: number, pal: Palette) {
  const { pCtx, bCtx } = targets;
  if (pCtx) {
    pCtx.fillStyle = pal.pbrBase;
    pCtx.fillRect(0, 0, w, h);
  }
  if (bCtx) {
    bCtx.fillStyle = "#000000";
    bCtx.fillRect(0, 0, w, h);
  }
}

function drawMicroSecurityBorders(
  targets: ArtworkPaintTargets,
  w: number,
  h: number,
  pal: Palette,
  inset = 36,
  radius = 34
) {
  const { cCtx, pCtx, bCtx } = targets;

  cCtx.strokeStyle = pal.goldMain;
  cCtx.lineWidth = 3;
  cCtx.beginPath();
  cCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
  cCtx.stroke();

  cCtx.strokeStyle = pal.goldSoft;
  cCtx.lineWidth = 1.4;
  cCtx.beginPath();
  cCtx.roundRect(inset + 9, inset + 9, w - (inset + 9) * 2, h - (inset + 9) * 2, radius - 6);
  cCtx.stroke();

  if (pCtx) {
    pCtx.strokeStyle = PBR_FOIL_GOLD;
    pCtx.lineWidth = 4;
    pCtx.beginPath();
    pCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
    pCtx.stroke();
  }
  if (bCtx) {
    bCtx.strokeStyle = "#b0b0b0";
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
    bCtx.stroke();
  }
}

function drawSmartEmvChip(
  targets: ArtworkPaintTargets,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const { cCtx, pCtx, bCtx } = targets;
  const grad = cCtx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#fce8a6");
  grad.addColorStop(0.5, "#d4af37");
  grad.addColorStop(1, "#9a7215");
  cCtx.fillStyle = grad;
  cCtx.beginPath();
  cCtx.roundRect(x, y, w, h, r);
  cCtx.fill();

  if (pCtx) {
    pCtx.fillStyle = PBR_HOLO_FOIL;
    pCtx.beginPath();
    pCtx.roundRect(x, y, w, h, r);
    pCtx.fill();
  }
  if (bCtx) {
    bCtx.fillStyle = "#ffffff";
    bCtx.beginPath();
    bCtx.roundRect(x, y, w, h, r);
    bCtx.fill();
  }

  const drawPaths = (ctx: CanvasRenderingContext2D, stroke: string) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(x + 7, y + 7, w - 14, h - 14, Math.max(3, r - 4));
    ctx.stroke();

    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.21, h * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 7, cy - 13);
    ctx.lineTo(cx - w * 0.21, cy - 13);
    ctx.moveTo(x + 7, cy + 13);
    ctx.lineTo(cx - w * 0.21, cy + 13);
    ctx.moveTo(x + w - 7, cy - 13);
    ctx.lineTo(cx + w * 0.21, cy - 13);
    ctx.moveTo(x + w - 7, cy + 13);
    ctx.lineTo(cx + w * 0.21, cy + 13);
    ctx.moveTo(cx, y + 7);
    ctx.lineTo(cx, cy - h * 0.25);
    ctx.moveTo(cx, y + h - 7);
    ctx.lineTo(cx, cy + h * 0.25);
    ctx.stroke();
  };

  drawPaths(cCtx, "rgba(72, 46, 0, 0.58)");
  if (pCtx) drawPaths(pCtx, PBR_CARD_DARK);
  if (bCtx) drawPaths(bCtx, "#141414");
}

function drawCrestBadge(
  targets: ArtworkPaintTargets,
  crestImg: HTMLImageElement | null | undefined,
  cx: number,
  cy: number,
  radius: number,
  pal: Palette
) {
  const { cCtx, pCtx, bCtx } = targets;

  // Holographic backing ring
  const holoGrad = cCtx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  holoGrad.addColorStop(0, "#d4af37");
  holoGrad.addColorStop(0.5, "#fff4cf");
  holoGrad.addColorStop(1, "#9a6f14");

  cCtx.save();
  cCtx.strokeStyle = holoGrad;
  cCtx.lineWidth = 4;
  cCtx.beginPath();
  cCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  cCtx.stroke();

  if (crestImg) {
    cCtx.beginPath();
    cCtx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    cCtx.clip();
    const size = radius * 2.05;
    cCtx.drawImage(crestImg, cx - size / 2, cy - size / 2, size, size);
  } else {
    cCtx.fillStyle = pal.slotBg;
    cCtx.beginPath();
    cCtx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.fillStyle = pal.goldMain;
    cCtx.font = `bold ${Math.round(radius * 0.65)}px "Playfair Display", serif`;
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";
    cCtx.fillText("43", cx, cy + 2);
  }
  cCtx.restore();

  if (pCtx) {
    pCtx.fillStyle = PBR_HOLO_FOIL;
    pCtx.beginPath();
    pCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    pCtx.fill();
  }
  if (bCtx) {
    bCtx.fillStyle = "#ffffff";
    bCtx.beginPath();
    bCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    bCtx.fill();
  }
}

/**
 * Draws the die-cut lanyard slot collar rim around the real ExtrudeGeometry hole
 * (matches x=412..612, y=87..132 on the 1024x1624 canvas coordinate space).
 */
function drawSlotCollarFraming(targets: ArtworkPaintTargets, pal: Palette) {
  const { cCtx, pCtx } = targets;
  cCtx.save();
  cCtx.strokeStyle = pal.goldMain;
  cCtx.lineWidth = 4;
  cCtx.beginPath();
  cCtx.roundRect(408, 84, 208, 52, 26);
  cCtx.stroke();
  cCtx.restore();

  if (pCtx) {
    pCtx.strokeStyle = PBR_FOIL_GOLD;
    pCtx.lineWidth = 6;
    pCtx.beginPath();
    pCtx.roundRect(408, 84, 208, 52, 26);
    pCtx.stroke();
  }
}

/** Paints Vertical ID Card Front onto any scaled 1024x1624 canvas context. */
export function drawIdFrontFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 1624;
  const pal = getPalette(theme);
  const { cCtx, pCtx, bCtx } = targets;

  drawGuillocheBackground(cCtx, W, H, pal, 512, 740);
  drawBasePbrAndBump(targets, W, H, pal);

  // Subtle centered official crest watermark behind content
  if (assets.crestImg) {
    cCtx.save();
    cCtx.globalAlpha = theme === "light" ? 0.08 : 0.07;
    cCtx.drawImage(assets.crestImg, 242, 470, 540, 540);
    cCtx.restore();
  }

  // Holographic left foil ribbon strip
  const foilGrad = cCtx.createLinearGradient(56, 40, 82, H - 40);
  foilGrad.addColorStop(0, "#d4af37");
  foilGrad.addColorStop(0.35, "#f7e39c");
  foilGrad.addColorStop(0.65, "#9c7014");
  foilGrad.addColorStop(1, "#d4af37");
  cCtx.fillStyle = foilGrad;
  cCtx.fillRect(64, 52, 10, H - 104);
  cCtx.fillRect(82, 52, 3, H - 104);

  if (pCtx) {
    pCtx.fillStyle = PBR_HOLO_STRIP;
    pCtx.fillRect(62, 52, 24, H - 104);
  }
  if (bCtx) {
    bCtx.fillStyle = "#c4c4c4";
    bCtx.fillRect(64, 52, 10, H - 104);
    bCtx.fillRect(82, 52, 3, H - 104);
  }

  drawMicroSecurityBorders(targets, W, H, pal, 36, 36);
  drawSlotCollarFraming(targets, pal);

  // Header brand + Crest Seal + Smart Chip safely below die-cut slot hole (y > 155)
  drawSmartEmvChip(targets, 128, 178, 124, 96, 16);

  cCtx.fillStyle = pal.goldMain;
  cCtx.font = 'bold 34px "Playfair Display", serif';
  cCtx.letterSpacing = "7px";
  cCtx.fillText("EXPEDIENT 43", 288, 224);
  cCtx.fillStyle = pal.textMuted;
  cCtx.font = '600 18px "Inter", sans-serif';
  cCtx.letterSpacing = "4px";
  cCtx.fillText("PONDOK MODERN ARRISALAH", 288, 260);
  cCtx.letterSpacing = "0px";

  drawCrestBadge(targets, assets.crestImg, 830, 232, 74, pal);

  // Portrait Photo Frame
  const photoX = 148;
  const photoY = 348;
  const photoW = 728;
  const photoH = 660;

  cCtx.save();
  cCtx.beginPath();
  cCtx.roundRect(photoX, photoY, photoW, photoH, 24);
  cCtx.clip();

  cCtx.fillStyle = pal.photoBg;
  cCtx.fillRect(photoX, photoY, photoW, photoH);

  if (assets.avatarImg) {
    const scale = Math.max(photoW / assets.avatarImg.width, photoH / assets.avatarImg.height);
    const dw = assets.avatarImg.width * scale;
    const dh = assets.avatarImg.height * scale;
    cCtx.drawImage(
      assets.avatarImg,
      photoX + (photoW - dw) / 2,
      photoY + (photoH - dh) / 2,
      dw,
      dh
    );
    const sheen = cCtx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
    sheen.addColorStop(0, "rgba(255,255,255,0.08)");
    sheen.addColorStop(1, "rgba(0,0,0,0.34)");
    cCtx.fillStyle = sheen;
    cCtx.fillRect(photoX, photoY, photoW, photoH);
  } else {
    // Elegant silhouette placeholder
    cCtx.fillStyle = theme === "light" ? "#cfc7b7" : "#1c2638";
    cCtx.beginPath();
    cCtx.arc(photoX + photoW / 2, photoY + 250, 118, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.beginPath();
    cCtx.arc(photoX + photoW / 2, photoY + 640, 265, Math.PI, 0);
    cCtx.fill();
  }
  cCtx.restore();

  cCtx.strokeStyle = pal.goldMain;
  cCtx.lineWidth = 4;
  cCtx.beginPath();
  cCtx.roundRect(photoX, photoY, photoW, photoH, 24);
  cCtx.stroke();

  if (pCtx) {
    pCtx.fillStyle = PBR_GLASS;
    pCtx.beginPath();
    pCtx.roundRect(photoX, photoY, photoW, photoH, 24);
    pCtx.fill();
  }

  // Name & Alumni Rank
  cCtx.textAlign = "left";
  cCtx.fillStyle = pal.textPrimary;
  cCtx.font = 'bold 58px "Playfair Display", serif';
  cCtx.fillText(identity.nama.toUpperCase(), 148, 1126, 728);

  cCtx.fillStyle = pal.goldMain;
  cCtx.font = '700 26px "Inter", sans-serif';
  cCtx.letterSpacing = "4.5px";
  cCtx.fillText(identity.angkatanLabel, 148, 1184, 728);
  cCtx.letterSpacing = "0px";

  if (pCtx) {
    pCtx.fillStyle = PBR_TEXT_PRIMARY;
    pCtx.font = 'bold 58px "Playfair Display", serif';
    pCtx.fillText(identity.nama.toUpperCase(), 148, 1126, 728);
    pCtx.fillStyle = PBR_FOIL_GOLD;
    pCtx.font = '700 26px "Inter", sans-serif';
    pCtx.letterSpacing = "4.5px";
    pCtx.fillText(identity.angkatanLabel, 148, 1184, 728);
    pCtx.letterSpacing = "0px";
  }
  if (bCtx) {
    bCtx.fillStyle = "#ffffff";
    bCtx.font = 'bold 58px "Playfair Display", serif';
    bCtx.fillText(identity.nama.toUpperCase(), 148, 1126, 728);
  }

  // Divider gold strip
  cCtx.fillStyle = pal.goldSoft;
  cCtx.fillRect(148, 1236, 728, 3);
  if (pCtx) {
    pCtx.fillStyle = PBR_FOIL_GOLD;
    pCtx.fillRect(148, 1236, 728, 3);
  }

  // ID Metadata & Barcode
  cCtx.fillStyle = pal.textMuted;
  cCtx.font = "600 28px monospace";
  cCtx.fillText(`ID: ${identity.nomorId}`, 148, 1316);
  cCtx.font = "500 24px monospace";
  cCtx.fillText(identity.berlakuLabel, 148, 1368);

  cCtx.fillStyle = pal.goldMain;
  cCtx.font = "700 22px monospace";
  cCtx.fillText("STATUS • TERVERIFIKASI", 148, 1428);

  // Deterministic crisp barcode
  cCtx.fillStyle = theme === "light" ? "#18181b" : "#e2e8f0";
  const barWidths = [6, 2, 4, 2, 8, 3, 2, 6, 2, 5, 3, 7, 2, 4, 2, 6, 3, 8, 2, 4, 3, 6, 2, 5];
  let bx = 636;
  for (const bw of barWidths) {
    cCtx.fillRect(bx, 1300, bw, 92);
    bx += bw + 4;
  }
}

/** Paints Vertical ID Card Back onto any scaled 1024x1624 canvas context. */
export function drawIdBackFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 1624;
  const pal = getPalette(theme);
  const { cCtx, pCtx } = targets;

  drawGuillocheBackground(cCtx, W, H, pal, 512, 860);
  drawBasePbrAndBump(targets, W, H, pal);
  drawMicroSecurityBorders(targets, W, H, pal, 36, 36);
  drawSlotCollarFraming(targets, pal);

  // Magnetic Stripe cleanly below slot punch
  cCtx.fillStyle = pal.magStripe;
  cCtx.fillRect(38, 184, W - 76, 170);
  if (pCtx) {
    pCtx.fillStyle = PBR_MAG_STRIPE;
    pCtx.fillRect(38, 184, W - 76, 170);
  }

  cCtx.textAlign = "center";
  cCtx.fillStyle = pal.goldMain;
  cCtx.font = 'bold 40px "Playfair Display", serif';
  cCtx.fillText("KARTU TANDA ALUMNI RESMI", 512, 468);
  cCtx.fillRect(372, 498, 280, 3);

  cCtx.fillStyle = pal.textMuted;
  cCtx.font = '400 26px "Inter", sans-serif';
  const copy = [
    "Expedient Generation 43",
    "Pondok Modern Arrisalah • Slahung, Ponorogo.",
    "Identitas resmi silaturahmi & ekosistem digital",
    "Keluarga Besar Alumni Angkatan ke-43.",
  ];
  copy.forEach((line, i) => cCtx.fillText(line, 512, 580 + i * 44));

  // QR Container Plate (Matte white for effortless scanning in dark/light mode)
  const qx = 322;
  const qy = 820;
  const qs = 380;
  cCtx.fillStyle = "#ffffff";
  cCtx.beginPath();
  cCtx.roundRect(qx, qy, qs, qs, 22);
  cCtx.fill();
  cCtx.strokeStyle = pal.goldMain;
  cCtx.lineWidth = 6;
  cCtx.stroke();

  if (assets.qrImg) {
    cCtx.drawImage(assets.qrImg, qx + 22, qy + 22, qs - 44, qs - 44);
  }
  if (pCtx) {
    pCtx.fillStyle = PBR_MATTE_QR;
    pCtx.beginPath();
    pCtx.roundRect(qx, qy, qs, qs, 22);
    pCtx.fill();
  }

  cCtx.fillStyle = pal.goldMain;
  cCtx.font = "700 22px monospace";
  cCtx.fillText("PINDAI QR VERIFIKASI IDENTITAS", 512, 1260);

  // Signature Strip
  cCtx.fillStyle = theme === "light" ? "#e5dfd0" : "#f8fafc";
  cCtx.beginPath();
  cCtx.roundRect(184, 1340, 656, 76, 12);
  cCtx.fill();
  cCtx.strokeStyle = pal.goldSoft;
  cCtx.lineWidth = 2;
  cCtx.stroke();

  cCtx.fillStyle = "#0f172a";
  cCtx.font = 'italic bold 34px "Playfair Display", serif';
  cCtx.fillText(identity.panggilan, 512, 1390);
  cCtx.textAlign = "left";
}

/** Paints Horizontal KTA Front onto any scaled 1024x640 canvas context. */
export function drawKtaFrontFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 640;
  const pal = getPalette(theme);
  const { cCtx, pCtx, bCtx } = targets;

  drawGuillocheBackground(cCtx, W, H, pal, 512, 320);
  drawBasePbrAndBump(targets, W, H, pal);

  if (assets.crestImg) {
    cCtx.save();
    cCtx.globalAlpha = theme === "light" ? 0.08 : 0.07;
    cCtx.drawImage(assets.crestImg, 312, 120, 400, 400);
    cCtx.restore();
  }

  drawMicroSecurityBorders(targets, W, H, pal, 24, 28);
  drawSmartEmvChip(targets, 72, 68, 108, 82, 14);

  // Top-right crest + brand title
  drawCrestBadge(targets, assets.crestImg, 916, 114, 52, pal);
  cCtx.textAlign = "right";
  cCtx.fillStyle = pal.goldMain;
  cCtx.font = 'bold 34px "Playfair Display", serif';
  cCtx.letterSpacing = "7px";
  cCtx.fillText("EXPEDIENT", 844, 110);
  cCtx.fillStyle = pal.textMuted;
  cCtx.font = "600 18px monospace";
  cCtx.letterSpacing = "4px";
  cCtx.fillText("ANGKATAN 43 • ARRISALAH", 844, 144);
  cCtx.letterSpacing = "0px";
  cCtx.textAlign = "left";

  if (pCtx) {
    pCtx.fillStyle = PBR_HOLO_FOIL;
    pCtx.font = 'bold 34px "Playfair Display", serif';
    pCtx.textAlign = "right";
    pCtx.fillText("EXPEDIENT", 844, 110);
    pCtx.textAlign = "left";
  }

  // Embossed Card Number
  cCtx.fillStyle = pal.goldMain;
  cCtx.font = "bold 40px monospace";
  cCtx.letterSpacing = "3px";
  cCtx.fillText(identity.maskedCardNumber, 72, 320);
  cCtx.letterSpacing = "0px";
  if (pCtx) {
    pCtx.fillStyle = PBR_FOIL_GOLD;
    pCtx.font = "bold 40px monospace";
    pCtx.fillText(identity.maskedCardNumber, 72, 320);
  }
  if (bCtx) {
    bCtx.fillStyle = "#ffffff";
    bCtx.font = "bold 40px monospace";
    bCtx.fillText(identity.maskedCardNumber, 72, 320);
  }

  // Cardholder Name + Metadata
  cCtx.fillStyle = pal.goldMain;
  cCtx.font = '700 17px "Inter", sans-serif';
  cCtx.letterSpacing = "3px";
  cCtx.fillText("PEMEGANG KTA RESMI", 72, 434);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = pal.textPrimary;
  cCtx.font = 'bold 40px "Inter", sans-serif';
  cCtx.fillText(identity.nama.toUpperCase(), 72, 488, 590);

  cCtx.fillStyle = pal.textMuted;
  cCtx.font = "600 22px monospace";
  cCtx.fillText(`ID: ${identity.nomorId}  •  ${identity.berlakuLabel}`, 72, 540, 590);

  // Circular Avatar Frame right-bottom
  const cx = 834;
  const cy = 428;
  const rad = 112;
  cCtx.save();
  cCtx.beginPath();
  cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
  cCtx.clip();
  cCtx.fillStyle = pal.photoBg;
  cCtx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);

  if (assets.avatarImg) {
    const s = Math.max((rad * 2) / assets.avatarImg.width, (rad * 2) / assets.avatarImg.height);
    const dw = assets.avatarImg.width * s;
    const dh = assets.avatarImg.height * s;
    cCtx.drawImage(assets.avatarImg, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    cCtx.fillStyle = pal.goldMain;
    cCtx.font = 'bold 84px "Playfair Display", serif';
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";
    cCtx.fillText(identity.nama.charAt(0).toUpperCase(), cx, cy + 4);
  }
  cCtx.restore();

  cCtx.strokeStyle = pal.goldMain;
  cCtx.lineWidth = 5;
  cCtx.beginPath();
  cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
  cCtx.stroke();

  if (pCtx) {
    pCtx.fillStyle = PBR_GLASS;
    pCtx.beginPath();
    pCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    pCtx.fill();
  }
}

/** Paints Horizontal KTA Back onto any scaled 1024x640 canvas context. */
export function drawKtaBackFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 640;
  const pal = getPalette(theme);
  const { cCtx, pCtx } = targets;

  drawGuillocheBackground(cCtx, W, H, pal, 420, 340);
  drawBasePbrAndBump(targets, W, H, pal);
  drawMicroSecurityBorders(targets, W, H, pal, 24, 28);

  // Magnetic Stripe
  cCtx.fillStyle = pal.magStripe;
  cCtx.fillRect(26, 68, W - 52, 94);
  if (pCtx) {
    pCtx.fillStyle = PBR_MAG_STRIPE;
    pCtx.fillRect(26, 68, W - 52, 94);
  }

  cCtx.textAlign = "left";
  cCtx.fillStyle = pal.goldMain;
  cCtx.font = 'bold 30px "Playfair Display", serif';
  cCtx.fillText("VERIFIKASI ALUMNI RESMI", 72, 246);

  cCtx.fillStyle = pal.textMuted;
  cCtx.font = '400 22px "Inter", sans-serif';
  cCtx.fillText("Expedient Generation 43 • Pondok Modern Arrisalah", 72, 304);
  cCtx.fillText("Slahung, Ponorogo • Jawa Timur, Indonesia", 72, 344);

  cCtx.fillStyle = pal.goldMain;
  cCtx.font = "700 22px monospace";
  cCtx.fillText(`ID: ${identity.nomorId} • ${identity.berlakuLabel}`, 72, 426);

  cCtx.fillStyle = pal.textMuted;
  cCtx.font = 'italic 24px "Playfair Display", serif';
  cCtx.fillText(identity.panggilan, 72, 514);

  // QR Box right side
  const qx = 716;
  const qy = 228;
  const qs = 236;
  cCtx.fillStyle = "#ffffff";
  cCtx.beginPath();
  cCtx.roundRect(qx, qy, qs, qs, 18);
  cCtx.fill();
  cCtx.strokeStyle = pal.goldMain;
  cCtx.lineWidth = 4;
  cCtx.stroke();

  if (assets.qrImg) {
    cCtx.drawImage(assets.qrImg, qx + 16, qy + 16, qs - 32, qs - 32);
  }
  if (pCtx) {
    pCtx.fillStyle = PBR_MATTE_QR;
    pCtx.beginPath();
    pCtx.roundRect(qx, qy, qs, qs, 18);
    pCtx.fill();
  }
}

/** Creates a procedural satin woven ribbon strap texture printed with subtle cohort branding. */
export function createWovenStrapCanvas(): HTMLCanvasElement {
  const w = 256;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#121824";
  ctx.fillRect(0, 0, w, h);

  // Subtle woven herringbone ribs
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 2;
  for (let y = -16; y < h + 16; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w / 2, y + 10);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Golden satin edge pipings
  ctx.fillStyle = "rgba(212, 175, 55, 0.55)";
  ctx.fillRect(10, 0, 5, h);
  ctx.fillRect(w - 15, 0, 5, h);

  // Subtle vertical woven typography along center of strap
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(212, 175, 55, 0.28)";
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXPEDIENT 43 • ARRISALAH", 0, 0);
  ctx.restore();

  return canvas;
}
