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
 * Encodes PBR surface attributes into RGB channels:
 * - R: Restrained holographic diffraction intensity (edge foil ribbon & crest outer halo ONLY)
 * - G: Surface roughness (roughnessMap — low values produce crisp piano-lacquer sheen)
 * - B: Metalness (metalnessMap — gold foil & trim hit 0.98)
 */
export function pbrSurface(holo: number, roughness: number, metalness: number): string {
  const r = Math.max(0, Math.min(255, Math.round(holo * 255)));
  const g = Math.max(10, Math.min(250, Math.round(roughness * 255)));
  const b = Math.max(4, Math.min(252, Math.round(metalness * 255)));
  return `rgb(${r}, ${g}, ${b})`;
}

// Iconic glossy dark obsidian + 24K stamped gold card finish (vivid across Day/Night galleries)
const PBR_OBSIDIAN_LACQUER = pbrSurface(0.0, 0.17, 0.34);
const PBR_GOLD_FOIL = pbrSurface(0.04, 0.14, 0.98);
const PBR_HOLO_ACCENT = pbrSurface(0.55, 0.16, 0.94);
const PBR_GLASS = pbrSurface(0.0, 0.08, 0.05);
const PBR_MAG_STRIPE = pbrSurface(0.0, 0.24, 0.12);
const PBR_MATTE_QR = pbrSurface(0.0, 0.82, 0.02);
const PBR_TEXT_FOIL = pbrSurface(0.0, 0.24, 0.72);

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f5df96";
const OBSIDIAN_TOP = "#0c1422";
const OBSIDIAN_MID = "#060b14";
const OBSIDIAN_BOT = "#03060c";

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

/** Creates an opaque architectural Kintsugi Marble backdrop canvas for the 3D studio wall. */
export function createMarbleWallCanvas(isDayMode: boolean, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.72);
  if (isDayMode) {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#edeae2");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#cbc4b5";
    ctx.lineWidth = Math.max(4, size * 0.005);
  } else {
    grad.addColorStop(0, "#0c182b");
    grad.addColorStop(1, "#050911");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#182842";
    ctx.lineWidth = Math.max(2, size * 0.0025);
  }

  for (let i = 0; i < 28; i++) {
    ctx.beginPath();
    ctx.moveTo(((i * 97) % 100) * 0.01 * size, 0);
    for (let j = 1; j <= 6; j++) {
      const px = (((i * 53 + j * 37) % 100) * 0.01) * size;
      ctx.lineTo(px, (j / 6) * size);
    }
    ctx.stroke();
  }

  // Deterministic Kintsugi gold seams
  ctx.globalAlpha = 0.92;
  ctx.shadowBlur = Math.round(size * 0.01);
  ctx.shadowColor = isDayMode ? "rgba(180,140,40,0.18)" : "#e5c158";
  ctx.strokeStyle = isDayMode ? "#c89f3c" : "#e5c158";
  ctx.lineWidth = isDayMode ? Math.max(2, size * 0.002) : Math.max(2.5, size * 0.003);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let x = (((i * 71 + 19) % 100) * 0.01) * size;
    let y = (((i * 43 + 11) % 85) * 0.01) * size;
    ctx.moveTo(x, y);
    for (let j = 0; j < 7; j++) {
      x += ((((i * 17 + j * 29) % 100) - 50) * 0.005) * size;
      y += (0.04 + (((i + j) * 19) % 10) * 0.008) * size;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  return canvas;
}

function drawObsidianLacquerBase(
  targets: ArtworkPaintTargets,
  w: number,
  h: number
) {
  const { cCtx, pCtx, bCtx } = targets;

  const grad = cCtx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, OBSIDIAN_TOP);
  grad.addColorStop(0.5, OBSIDIAN_MID);
  grad.addColorStop(1, OBSIDIAN_BOT);
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, w, h);

  // Subtle vertical satin hairline grain
  cCtx.globalAlpha = 0.028;
  for (let i = 0; i < w; i += 3) {
    cCtx.fillStyle = i % 6 === 0 ? "#283956" : "#000000";
    cCtx.fillRect(i, 0, 1, h);
  }
  cCtx.globalAlpha = 1.0;

  // Delicate architectural guilloche hairlines (barely visible so obsidian stays deep & clean)
  cCtx.save();
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.042)";
  cCtx.lineWidth = 1.1;
  const rows = Math.ceil(h / 96);
  for (let r = 0; r < rows; r++) {
    const baseY = r * 96 + 48;
    cCtx.beginPath();
    for (let x = 0; x <= w; x += 32) {
      const y = baseY + Math.sin((x / w) * Math.PI * 4 + r * 0.6) * 18;
      if (x === 0) cCtx.moveTo(x, y);
      else cCtx.lineTo(x, y);
    }
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

function drawMicroBorders(
  targets: ArtworkPaintTargets,
  w: number,
  h: number,
  inset = 34,
  radius = 32
) {
  const { cCtx, pCtx, bCtx } = targets;
  cCtx.strokeStyle = "rgba(212, 175, 55, 0.55)";
  cCtx.lineWidth = 2.5;
  cCtx.beginPath();
  cCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
  cCtx.stroke();

  if (pCtx) {
    pCtx.strokeStyle = PBR_GOLD_FOIL;
    pCtx.lineWidth = 3;
    pCtx.beginPath();
    pCtx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
    pCtx.stroke();
  }
  if (bCtx) {
    bCtx.strokeStyle = "#909090";
    bCtx.lineWidth = 2.5;
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
  grad.addColorStop(0, "#fce6a4");
  grad.addColorStop(0.5, GOLD);
  grad.addColorStop(1, "#9a7114");
  cCtx.fillStyle = grad;
  cCtx.beginPath();
  cCtx.roundRect(x, y, w, h, r);
  cCtx.fill();

  if (pCtx) {
    // True crisp metallic gold chip without washed-out rainbow glow
    pCtx.fillStyle = PBR_GOLD_FOIL;
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
  if (pCtx) drawPaths(pCtx, PBR_OBSIDIAN_LACQUER);
  if (bCtx) drawPaths(bCtx, "#141414");
}

function drawCrestBadge(
  targets: ArtworkPaintTargets,
  crestImg: HTMLImageElement | null | undefined,
  cx: number,
  cy: number,
  radius: number
) {
  const { cCtx, pCtx, bCtx } = targets;

  const haloGrad = cCtx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  haloGrad.addColorStop(0, GOLD);
  haloGrad.addColorStop(0.5, GOLD_LIGHT);
  haloGrad.addColorStop(1, "#9a6f14");

  cCtx.save();
  cCtx.strokeStyle = haloGrad;
  cCtx.lineWidth = 4.5;
  cCtx.beginPath();
  cCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  cCtx.stroke();

  if (crestImg) {
    cCtx.beginPath();
    cCtx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    cCtx.clip();
    const size = radius * 2.04;
    cCtx.drawImage(crestImg, cx - size / 2, cy - size / 2, size, size);
  } else {
    cCtx.fillStyle = OBSIDIAN_MID;
    cCtx.beginPath();
    cCtx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.fillStyle = GOLD;
    cCtx.font = `bold ${Math.round(radius * 0.65)}px "Playfair Display", serif`;
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";
    cCtx.fillText("43", cx, cy + 2);
  }
  cCtx.restore();

  // Subtle holographic accent ONLY on outer gold bezel ring (keeps center crest vivid!)
  if (pCtx) {
    pCtx.save();
    pCtx.strokeStyle = PBR_HOLO_ACCENT;
    pCtx.lineWidth = 7;
    pCtx.beginPath();
    pCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    pCtx.stroke();
    pCtx.restore();
  }
  if (bCtx) {
    bCtx.strokeStyle = "#ffffff";
    bCtx.lineWidth = 5;
    bCtx.beginPath();
    bCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    bCtx.stroke();
  }
}

function drawSlotCollarFraming(targets: ArtworkPaintTargets) {
  const { cCtx, pCtx } = targets;
  cCtx.save();
  cCtx.strokeStyle = GOLD;
  cCtx.lineWidth = 4;
  cCtx.beginPath();
  cCtx.roundRect(408, 84, 208, 52, 26);
  cCtx.stroke();
  cCtx.restore();

  if (pCtx) {
    pCtx.strokeStyle = PBR_GOLD_FOIL;
    pCtx.lineWidth = 6;
    pCtx.beginPath();
    pCtx.roundRect(408, 84, 208, 52, 26);
    pCtx.stroke();
  }
}

/** Paints Vertical ID Card Front (Signature Glossy Black Obsidian + 24K Gold Foil). */
export function drawIdFrontFace(
  targets: ArtworkPaintTargets,
  identity: CardIdentityData,
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 1624;
  const { cCtx, pCtx, bCtx } = targets;

  drawObsidianLacquerBase(targets, W, H);

  // Subtle crest watermark behind photo frame
  if (assets.crestImg) {
    cCtx.save();
    cCtx.globalAlpha = 0.06;
    cCtx.drawImage(assets.crestImg, 252, 490, 520, 520);
    cCtx.restore();
  }

  // Left vertical gold foil security strip
  cCtx.fillStyle = GOLD;
  cCtx.fillRect(58, 52, 11, H - 104);
  cCtx.fillRect(76, 52, 2.5, H - 104);
  if (pCtx) {
    pCtx.fillStyle = PBR_HOLO_ACCENT;
    pCtx.fillRect(56, 52, 22, H - 104);
  }
  if (bCtx) {
    bCtx.fillStyle = "#c0c0c0";
    bCtx.fillRect(58, 52, 11, H - 104);
  }

  drawMicroBorders(targets, W, H, 34, 34);
  drawSlotCollarFraming(targets);

  // Header brand + Smart Chip + Crest Seal safely below slot hole
  drawSmartEmvChip(targets, 128, 178, 124, 96, 16);

  cCtx.textAlign = "left";
  cCtx.fillStyle = GOLD;
  cCtx.font = 'bold 34px "Playfair Display", serif';
  cCtx.letterSpacing = "6px";
  cCtx.fillText("EXPEDIENT 43", 284, 224);
  cCtx.fillStyle = "#a3b1c2";
  cCtx.font = '600 18px "Inter", sans-serif';
  cCtx.letterSpacing = "3.5px";
  cCtx.fillText("PONDOK MODERN ARRISALAH", 284, 260);
  cCtx.letterSpacing = "0px";

  drawCrestBadge(targets, assets.crestImg, 830, 232, 74);

  // Portrait Photo Frame
  const photoX = 148;
  const photoY = 348;
  const photoW = 728;
  const photoH = 660;

  cCtx.save();
  cCtx.beginPath();
  cCtx.roundRect(photoX, photoY, photoW, photoH, 22);
  cCtx.clip();

  cCtx.fillStyle = "#111a28";
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
    sheen.addColorStop(0, "rgba(255,255,255,0.06)");
    sheen.addColorStop(1, "rgba(0,0,0,0.38)");
    cCtx.fillStyle = sheen;
    cCtx.fillRect(photoX, photoY, photoW, photoH);
  } else {
    cCtx.fillStyle = "#1c2638";
    cCtx.beginPath();
    cCtx.arc(photoX + photoW / 2, photoY + 250, 118, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.beginPath();
    cCtx.arc(photoX + photoW / 2, photoY + 640, 265, Math.PI, 0);
    cCtx.fill();
  }
  cCtx.restore();

  cCtx.strokeStyle = GOLD;
  cCtx.lineWidth = 4;
  cCtx.beginPath();
  cCtx.roundRect(photoX, photoY, photoW, photoH, 22);
  cCtx.stroke();

  if (pCtx) {
    pCtx.fillStyle = PBR_GLASS;
    pCtx.beginPath();
    pCtx.roundRect(photoX, photoY, photoW, photoH, 22);
    pCtx.fill();
  }

  // Name & Alumni Title
  cCtx.fillStyle = "#ffffff";
  cCtx.font = 'bold 58px "Playfair Display", serif';
  cCtx.fillText(identity.nama.toUpperCase(), 148, 1126, 728);

  cCtx.fillStyle = GOLD;
  cCtx.font = '700 26px "Inter", sans-serif';
  cCtx.letterSpacing = "4.5px";
  cCtx.fillText(identity.angkatanLabel, 148, 1184, 728);
  cCtx.letterSpacing = "0px";

  if (pCtx) {
    pCtx.fillStyle = PBR_TEXT_FOIL;
    pCtx.font = 'bold 58px "Playfair Display", serif';
    pCtx.fillText(identity.nama.toUpperCase(), 148, 1126, 728);
    pCtx.fillStyle = PBR_GOLD_FOIL;
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

  cCtx.fillStyle = "rgba(212,175,55,0.34)";
  cCtx.fillRect(148, 1236, 728, 3);
  if (pCtx) {
    pCtx.fillStyle = PBR_GOLD_FOIL;
    pCtx.fillRect(148, 1236, 728, 3);
  }

  // ID Metadata & Barcode
  cCtx.fillStyle = "#9aa7b6";
  cCtx.font = "600 28px monospace";
  cCtx.fillText(`ID: ${identity.nomorId}`, 148, 1316);
  cCtx.font = "500 24px monospace";
  cCtx.fillText(identity.berlakuLabel, 148, 1368);

  cCtx.fillStyle = GOLD;
  cCtx.font = "700 22px monospace";
  cCtx.fillText("STATUS • TERVERIFIKASI", 148, 1428);

  cCtx.fillStyle = "#e2e8f0";
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
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 1624;
  const { cCtx, pCtx } = targets;

  drawObsidianLacquerBase(targets, W, H);
  drawMicroBorders(targets, W, H, 34, 34);
  drawSlotCollarFraming(targets);

  // Magnetic Stripe
  cCtx.fillStyle = "#03050a";
  cCtx.fillRect(36, 184, W - 72, 170);
  if (pCtx) {
    pCtx.fillStyle = PBR_MAG_STRIPE;
    pCtx.fillRect(36, 184, W - 72, 170);
  }

  cCtx.textAlign = "center";
  cCtx.fillStyle = GOLD;
  cCtx.font = 'bold 40px "Playfair Display", serif';
  cCtx.fillText("KARTU TANDA ALUMNI RESMI", 512, 468);
  cCtx.fillRect(372, 498, 280, 3);

  cCtx.fillStyle = "#9aa7b6";
  cCtx.font = '400 26px "Inter", sans-serif';
  const copy = [
    "Expedient Generation 43",
    "Pondok Modern Arrisalah • Slahung, Ponorogo.",
    "Identitas resmi silaturahmi & ekosistem digital",
    "Keluarga Besar Alumni Angkatan ke-43.",
  ];
  copy.forEach((line, i) => cCtx.fillText(line, 512, 580 + i * 44));

  const qx = 322;
  const qy = 820;
  const qs = 380;
  cCtx.fillStyle = "#ffffff";
  cCtx.beginPath();
  cCtx.roundRect(qx, qy, qs, qs, 22);
  cCtx.fill();
  cCtx.strokeStyle = GOLD;
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

  cCtx.fillStyle = GOLD;
  cCtx.font = "700 22px monospace";
  cCtx.fillText("PINDAI QR VERIFIKASI IDENTITAS", 512, 1260);

  cCtx.fillStyle = "#f8fafc";
  cCtx.beginPath();
  cCtx.roundRect(184, 1340, 656, 76, 12);
  cCtx.fill();
  cCtx.strokeStyle = "rgba(212,175,55,0.45)";
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
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 640;
  const { cCtx, pCtx, bCtx } = targets;

  drawObsidianLacquerBase(targets, W, H);

  if (assets.crestImg) {
    cCtx.save();
    cCtx.globalAlpha = 0.06;
    cCtx.drawImage(assets.crestImg, 312, 120, 400, 400);
    cCtx.restore();
  }

  drawMicroBorders(targets, W, H, 24, 28);
  drawSmartEmvChip(targets, 72, 68, 108, 82, 14);

  drawCrestBadge(targets, assets.crestImg, 916, 114, 52);
  cCtx.textAlign = "right";
  cCtx.fillStyle = GOLD;
  cCtx.font = 'bold 34px "Playfair Display", serif';
  cCtx.letterSpacing = "7px";
  cCtx.fillText("EXPEDIENT", 844, 110);
  cCtx.fillStyle = "#9aa7b6";
  cCtx.font = "600 18px monospace";
  cCtx.letterSpacing = "4px";
  cCtx.fillText("ANGKATAN 43 • ARRISALAH", 844, 144);
  cCtx.letterSpacing = "0px";
  cCtx.textAlign = "left";

  if (pCtx) {
    pCtx.fillStyle = PBR_GOLD_FOIL;
    pCtx.font = 'bold 34px "Playfair Display", serif';
    pCtx.textAlign = "right";
    pCtx.fillText("EXPEDIENT", 844, 110);
    pCtx.textAlign = "left";
  }

  cCtx.fillStyle = GOLD;
  cCtx.font = "bold 40px monospace";
  cCtx.letterSpacing = "3px";
  cCtx.fillText(identity.maskedCardNumber, 72, 320);
  cCtx.letterSpacing = "0px";
  if (pCtx) {
    pCtx.fillStyle = PBR_GOLD_FOIL;
    pCtx.font = "bold 40px monospace";
    pCtx.fillText(identity.maskedCardNumber, 72, 320);
  }
  if (bCtx) {
    bCtx.fillStyle = "#ffffff";
    bCtx.font = "bold 40px monospace";
    bCtx.fillText(identity.maskedCardNumber, 72, 320);
  }

  cCtx.fillStyle = GOLD;
  cCtx.font = '700 17px "Inter", sans-serif';
  cCtx.letterSpacing = "3px";
  cCtx.fillText("PEMEGANG KTA RESMI", 72, 434);
  cCtx.letterSpacing = "0px";

  cCtx.fillStyle = "#ffffff";
  cCtx.font = 'bold 40px "Inter", sans-serif';
  cCtx.fillText(identity.nama.toUpperCase(), 72, 488, 590);

  cCtx.fillStyle = "#9aa7b6";
  cCtx.font = "600 22px monospace";
  cCtx.fillText(`ID: ${identity.nomorId}  •  ${identity.berlakuLabel}`, 72, 540, 590);

  const cx = 834;
  const cy = 428;
  const rad = 112;
  cCtx.save();
  cCtx.beginPath();
  cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
  cCtx.clip();
  cCtx.fillStyle = "#111a28";
  cCtx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);

  if (assets.avatarImg) {
    const s = Math.max((rad * 2) / assets.avatarImg.width, (rad * 2) / assets.avatarImg.height);
    const dw = assets.avatarImg.width * s;
    const dh = assets.avatarImg.height * s;
    cCtx.drawImage(assets.avatarImg, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    cCtx.fillStyle = GOLD;
    cCtx.font = 'bold 84px "Playfair Display", serif';
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";
    cCtx.fillText(identity.nama.charAt(0).toUpperCase(), cx, cy + 4);
  }
  cCtx.restore();

  cCtx.strokeStyle = GOLD;
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
  _theme: CardThemeMode,
  assets: LoadedCardAssets
) {
  const W = 1024;
  const H = 640;
  const { cCtx, pCtx } = targets;

  drawObsidianLacquerBase(targets, W, H);
  drawMicroBorders(targets, W, H, 24, 28);

  cCtx.fillStyle = "#03050a";
  cCtx.fillRect(26, 68, W - 52, 94);
  if (pCtx) {
    pCtx.fillStyle = PBR_MAG_STRIPE;
    pCtx.fillRect(26, 68, W - 52, 94);
  }

  cCtx.textAlign = "left";
  cCtx.fillStyle = GOLD;
  cCtx.font = 'bold 30px "Playfair Display", serif';
  cCtx.fillText("VERIFIKASI ALUMNI RESMI", 72, 246);

  cCtx.fillStyle = "#9aa7b6";
  cCtx.font = '400 22px "Inter", sans-serif';
  cCtx.fillText("Expedient Generation 43 • Pondok Modern Arrisalah", 72, 304);
  cCtx.fillText("Slahung, Ponorogo • Jawa Timur, Indonesia", 72, 344);

  cCtx.fillStyle = GOLD;
  cCtx.font = "700 22px monospace";
  cCtx.fillText(`ID: ${identity.nomorId} • ${identity.berlakuLabel}`, 72, 426);

  cCtx.fillStyle = "#cbd5e1";
  cCtx.font = 'italic 24px "Playfair Display", serif';
  cCtx.fillText(identity.panggilan, 72, 514);

  const qx = 716;
  const qy = 228;
  const qs = 236;
  cCtx.fillStyle = "#ffffff";
  cCtx.beginPath();
  cCtx.roundRect(qx, qy, qs, qs, 18);
  cCtx.fill();
  cCtx.strokeStyle = GOLD;
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

  ctx.fillStyle = "#111722";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 2;
  for (let y = -16; y < h + 16; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w / 2, y + 10);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(212, 175, 55, 0.6)";
  ctx.fillRect(10, 0, 5, h);
  ctx.fillRect(w - 15, 0, 5, h);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(212, 175, 55, 0.34)";
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXPEDIENT 43 • ARRISALAH", 0, 0);
  ctx.restore();

  return canvas;
}
