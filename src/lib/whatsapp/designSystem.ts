/**
 * src/lib/whatsapp/designSystem.ts
 * Enterprise Design System & Preset Library for Expedient Studio Bot
 * 
 * Features:
 * - Professional Designer Font Stacks (Montserrat, Bebas Neue, Playfair Display, Cormorant Garamond, Space Grotesk)
 * - 6 Varied Overlay Architecture (bottom_gradient, center_glow, glass_card, vignette, split_overlay, editorial_panel)
 * - Dynamic Auto-Typography Sizing
 * - 4-Tier Visual Hierarchy (Eyebrow, Headline, Subheadline, Punchy Quote, Footer)
 */

export type DesignIntentCategory =
  | "COMMEMORATIVE_POSTER"
  | "RELIGIOUS_POSTER"
  | "EVENT_POSTER"
  | "PROMOTIONAL_POSTER"
  | "EDUCATIONAL_POSTER"
  | "ANNOUNCEMENT_POSTER"
  | "PRODUCT_AD"
  | "SOCIAL_MEDIA_POST"
  | "SCENERY_IMAGE"
  | "PORTRAIT"
  | "INFOGRAPHIC";

export type PresetId =
  | "01_CINEMATIC_HERO"
  | "02_EDITORIAL_LUXURY"
  | "03_SWISS_MODERN"
  | "04_GLASS_EVENT"
  | "05_MINIMAL_RELIGIOUS"
  | "06_CORPORATE_CLEAN"
  | "07_YOUTH_VIBRANT"
  | "08_PATRIOTIC_MONUMENTAL"
  | "09_PRODUCT_PREMIUM"
  | "10_FUTURISTIC_TECH"
  | "11_DOCUMENTARY_HISTORY"
  | "12_FESTIVAL_DYNAMIC";

export type OverlayType =
  | "bottom_gradient"
  | "center_glow"
  | "glass_card"
  | "vignette"
  | "split_overlay"
  | "editorial_panel";

export interface TextSafeZone {
  position: "top" | "bottom" | "left" | "center" | "none";
  negativeSpaceInstruction: string;
}

export interface DesignPreset {
  id: PresetId;
  name: string;
  tagline: string;
  overlayType: OverlayType;
  targetCategories: DesignIntentCategory[];
  textSafeZone: TextSafeZone;
  defaultPalette: { hex: string; name: string }[];
  typography: {
    primaryFont: string;
    secondaryFont: string;
    headlineAlign: "center" | "left";
    headlineCase: "uppercase" | "titlecase";
  };
  renderSvg: (W: number, H: number, brief: any) => string;
}

export function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapSvgText(text: string, maxCharsPerLine = 36): string[] {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Dynamic Auto Typography Rules
 * Calculates optimal headline font size dynamically based on character count
 * to prevent text clipping, line wrapping errors, or clutter.
 */
export function calculateHeadlineSize(headline: string, baseSize = 118): number {
  const len = (headline || "").trim().length;
  if (len <= 14) return Math.min(baseSize, 122);  // e.g. "DIRGAHAYU RI"
  if (len <= 22) return Math.min(baseSize, 102);  // e.g. "DIRGAHAYU INDONESIA"
  if (len <= 32) return Math.min(baseSize, 82);   // e.g. "79 TAHUN INDONESIA MERDEKA"
  return Math.min(baseSize, 64);
}

export const DESIGN_PRESETS: Record<PresetId, DesignPreset> = {
  // 01. CINEMATIC HERO (Film Poster / Dramatic Art) - Split Vignette Overlay
  "01_CINEMATIC_HERO": {
    id: "01_CINEMATIC_HERO",
    name: "Cinematic Hero",
    tagline: "Wide Cinematic Film Poster with 85% Unblocked Visual",
    overlayType: "bottom_gradient",
    targetCategories: ["SCENERY_IMAGE", "COMMEMORATIVE_POSTER", "RELIGIOUS_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 30-35% of frame. Avoid high-frequency details, avoid complex objects, avoid bright highlights in typography area.",
    },
    defaultPalette: [
      { hex: "#FBBF24", name: "Amber Gold" },
      { hex: "#0F172A", name: "Midnight Obsidian" },
      { hex: "#F8FAFC", name: "Pure Light" },
    ],
    typography: {
      primaryFont: "'Montserrat', 'Playfair Display', 'Georgia', serif",
      secondaryFont: "'Inter', 'Segoe UI', -apple-system, sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#FBBF24";
      const rawHeadline = (brief.copywriting?.headline || brief.theme || "DIRGAHAYU INDONESIA").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 105);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || `— ${brief.poster_type || "CINEMATIC MASTERPIECE"} —`).toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "CREATIVE ARCHIVE").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody;
      const quoteLines = quote ? wrapSvgText(quote, 36) : [];

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="30%" stop-color="#020617" stop-opacity="0.38" />
            <stop offset="65%" stop-color="#020617" stop-opacity="0.82" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.97" />
          </linearGradient>
          <filter id="cShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.75" />
          </filter>
        </defs>
        <rect x="0" y="1120" width="${W}" height="800" fill="url(#cineGrad)" />
        <g filter="url(#cShadow)">
          <text x="${W / 2}" y="1480" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" font-weight="700" letter-spacing="8" fill="${accent}" text-anchor="middle">
            ${eyebrow}
          </text>
          <text x="${W / 2}" y="1585" font-family="'Montserrat', 'Playfair Display', serif" font-size="${headlineSize}" font-weight="900" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 80}" y1="1625" x2="${W / 2 + 80}" y2="1625" stroke="${accent}" stroke-width="2" opacity="0.85" />
          <text x="${W / 2}" y="1675" font-family="'Inter', 'Segoe UI', sans-serif" font-size="24" font-weight="600" letter-spacing="3" fill="#CBD5E1" text-anchor="middle">
            ${subheadline}
          </text>
          ${quoteLines.slice(0, 2).map((l, i) => `
            <text x="${W / 2}" y="${1730 + i * 30}" font-family="'Georgia', serif" font-style="italic" font-size="19" fill="#94A3B8" text-anchor="middle">
              “${escapeXml(l)}”
            </text>
          `).join("")}
          <text x="${W / 2}" y="1840" font-family="'Inter', 'Segoe UI', sans-serif" font-size="11" font-weight="600" letter-spacing="5" fill="#64748B" text-anchor="middle">
            EXPEDIENT CREATIVE AI STUDIO · 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 02. EDITORIAL LUXURY (Vogue & Architectural Digest High Fashion) - Split Masthead Overlay
  "02_EDITORIAL_LUXURY": {
    id: "02_EDITORIAL_LUXURY",
    name: "Editorial Luxury",
    tagline: "Haute Couture & Fine Architecture Magazine Cover",
    overlayType: "split_overlay",
    targetCategories: ["SOCIAL_MEDIA_POST", "PRODUCT_AD", "PORTRAIT"],
    textSafeZone: {
      position: "top",
      negativeSpaceInstruction: "Maintain clean high-contrast negative space across the upper 25% of the frame for the editorial masthead.",
    },
    defaultPalette: [
      { hex: "#D4AF37", name: "Champagne Gold" },
      { hex: "#0F172A", name: "Obsidian Slate" },
      { hex: "#FAF8F5", name: "Cream White" },
    ],
    typography: {
      primaryFont: "'Cormorant Garamond', 'Playfair Display', 'Bodoni Moda', serif",
      secondaryFont: "'Inter', 'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#D4AF37";
      const rawHeadline = (brief.copywriting?.headline || brief.theme || "EXPEDIENT").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 95);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "— EXPEDIENT JOURNAL · VOL. 43 —").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "CREATIVE ARCHIVE").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Harmoni dalam kemewahan estetika visual modern.";
      const quoteLines = wrapSvgText(quote, 40);

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.88" />
            <stop offset="45%" stop-color="#020617" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="bottomScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="35%" stop-color="#020617" stop-opacity="0.55" />
            <stop offset="80%" stop-color="#020617" stop-opacity="0.88" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
          </linearGradient>
          <filter id="cardShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.65" />
          </filter>
        </defs>
        <rect x="0" y="0" width="${W}" height="620" fill="url(#topScrim)" />
        <rect x="0" y="1220" width="${W}" height="700" fill="url(#bottomScrim)" />

        <g>
          <text x="${W / 2}" y="140" font-family="'Inter', sans-serif" font-size="14" font-weight="700" letter-spacing="6" fill="${accent}" text-anchor="middle">
            ${eyebrow}
          </text>
          <text x="${W / 2}" y="235" font-family="'Cormorant Garamond', 'Playfair Display', serif" font-size="${headlineSize}" font-weight="700" letter-spacing="6" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 70}" y1="272" x2="${W / 2 + 70}" y2="272" stroke="${accent}" stroke-width="2" opacity="0.85" />
          <text x="${W / 2}" y="312" font-family="'Inter', sans-serif" font-size="17" font-weight="600" letter-spacing="4" fill="#E2E8F0" text-anchor="middle">
            ${subheadline}
          </text>
        </g>

        <g transform="translate(80, ${1620 - Math.max(0, (quoteLines.length - 1) * 30)})" filter="url(#cardShadow)">
          <rect x="0" y="0" width="920" height="${150 + Math.max(0, (quoteLines.length - 1) * 30)}" rx="18" fill="#0A0F1D" fill-opacity="0.72" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1.2" />
          ${quoteLines.map((line, idx) => `<text x="460" y="${58 + idx * 34}" font-family="'Cormorant Garamond', serif" font-style="italic" font-size="22" font-weight="400" fill="#F8FAFC" text-anchor="middle">“${escapeXml(line)}”</text>`).join("")}
          <line x1="40" y1="${105 + Math.max(0, (quoteLines.length - 1) * 30)}" x2="880" y2="${105 + Math.max(0, (quoteLines.length - 1) * 30)}" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
          <text x="50" y="${132 + Math.max(0, (quoteLines.length - 1) * 30)}" font-family="'Inter', sans-serif" font-size="12" font-weight="600" letter-spacing="3" fill="#94A3B8">
            2026 · EXPEDIENT ARCHIVE
          </text>
          <text x="870" y="${132 + Math.max(0, (quoteLines.length - 1) * 30)}" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="${accent}" text-anchor="end">
            EXPEDIENT 43
          </text>
        </g>
      </svg>`;
    },
  },

  // 03. SWISS MODERN (Asymmetrical Grotesque Bauhaus Art Agency) - Editorial Panel Overlay
  "03_SWISS_MODERN": {
    id: "03_SWISS_MODERN",
    name: "Swiss Modern",
    tagline: "Asymmetrical Left-Aligned Swiss Modernism with Clean Grid",
    overlayType: "editorial_panel",
    targetCategories: ["EDUCATIONAL_POSTER", "INFOGRAPHIC", "SOCIAL_MEDIA_POST"],
    textSafeZone: {
      position: "left",
      negativeSpaceInstruction: "Maintain clean, low-contrast negative space across the left 40% of the frame for asymmetrical left-aligned typography.",
    },
    defaultPalette: [
      { hex: "#EF4444", name: "Swiss Red" },
      { hex: "#000000", name: "Absolute Black" },
      { hex: "#FFFFFF", name: "Pure White" },
    ],
    typography: {
      primaryFont: "'Space Grotesk', 'Cabinet Grotesk', 'Inter', sans-serif",
      secondaryFont: "'Inter', 'Segoe UI', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#EF4444";
      const rawHeadline = (brief.copywriting?.headline || brief.theme || "DIRGAHAYU INDONESIA").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 100);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "EDITION NO. 43").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "SWISS DESIGN ARCHIVE").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Struktur, presisi, dan harmoni dalam setiap detail karya.";
      const quoteLines = wrapSvgText(quote, 28);

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leftScrim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.94" />
            <stop offset="55%" stop-color="#020617" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${W}" height="700" fill="url(#topScrim)" />
        <rect x="0" y="0" width="750" height="${H}" fill="url(#leftScrim)" />

        <g transform="translate(100, 160)">
          <text x="0" y="0" font-family="'Inter', sans-serif" font-size="14" font-weight="800" letter-spacing="6" fill="${accent}">
            ${eyebrow}
          </text>
          <line x1="0" y1="20" x2="60" y2="20" stroke="${accent}" stroke-width="3" />
          <text x="0" y="110" font-family="'Space Grotesk', 'Inter', sans-serif" font-size="${headlineSize}" font-weight="900" letter-spacing="2" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="0" y="175" font-family="'Inter', sans-serif" font-size="18" font-weight="600" letter-spacing="4" fill="#94A3B8">
            ${subheadline}
          </text>
        </g>

        <g transform="translate(100, 1680)">
          <rect x="0" y="0" width="4" height="60" fill="${accent}" />
          ${quoteLines.slice(0, 2).map((l, i) => `<text x="24" y="${28 + i * 26}" font-family="'Space Grotesk', sans-serif" font-size="19" font-weight="500" fill="#F1F5F9">${escapeXml(l)}</text>`).join("")}
          <text x="24" y="85" font-family="'Inter', sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#64748B">
            EXPEDIENT ARCHIVE · 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 04. GLASS EVENT (Floating Glassmorphism Card for Events & Ceremonies)
  "04_GLASS_EVENT": {
    id: "04_GLASS_EVENT",
    name: "Glass Event",
    tagline: "Floating Frosted Glassmorphism Card for Events & Gatherings",
    overlayType: "glass_card",
    targetCategories: ["EVENT_POSTER", "ANNOUNCEMENT_POSTER", "PROMOTIONAL_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 35% of frame for floating frosted glass card.",
    },
    defaultPalette: [
      { hex: "#38BDF8", name: "Ice Cyan" },
      { hex: "#0F172A", name: "Deep Obsidian" },
      { hex: "#E2E8F0", name: "Frosted Glass" },
    ],
    typography: {
      primaryFont: "'Montserrat', 'Outfit', 'Segoe UI', sans-serif",
      secondaryFont: "'Inter', 'Segoe UI', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#38BDF8";
      const rawHeadline = (brief.copywriting?.headline || brief.theme || "REUNI AKBAR").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 80);
      const subheadline = escapeXml((brief.copywriting?.subheadline || "AGENDA RESMI").toUpperCase());
      const tag = escapeXml((brief.copywriting?.eyebrow || brief.poster_type || "OFFICIAL INVITATION").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Momen penuh makna, merajut kebersamaan abadi.";
      const quoteLines = wrapSvgText(quote, 36);

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="35%" stop-color="#020617" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.88" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
          </filter>
        </defs>
        <rect x="0" y="1000" width="${W}" height="920" fill="url(#cardGrad)" />
        
        <g transform="translate(70, 1420)" filter="url(#shadow)">
          <rect x="0" y="0" width="940" height="380" rx="28" fill="#0A0F1D" fill-opacity="0.75" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1.5" />
          
          <rect x="45" y="40" width="220" height="34" rx="17" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-width="1" />
          <text x="155" y="62" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="${accent}" text-anchor="middle">
            ${tag.slice(0, 22)}
          </text>

          <text x="45" y="130" font-family="'Montserrat', sans-serif" font-size="${headlineSize}" font-weight="800" letter-spacing="3" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="45" y="170" font-family="'Inter', sans-serif" font-size="16" font-weight="600" letter-spacing="3" fill="#94A3B8">
            ${subheadline}
          </text>

          <line x1="45" y1="205" x2="895" y2="205" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />

          ${quoteLines.slice(0, 2).map((l, i) => `<text x="45" y="${250 + i * 30}" font-family="'Inter', sans-serif" font-size="19" font-weight="500" fill="#E2E8F0">“${escapeXml(l)}”</text>`).join("")}

          <text x="895" y="345" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="${accent}" text-anchor="end">
            EXPEDIENT GENERATION 43
          </text>
        </g>
      </svg>`;
    },
  },

  // 05. MINIMAL RELIGIOUS (Sacred Spiritual Serenity with Luminous Emerald & Gold) - Center Glow Overlay
  "05_MINIMAL_RELIGIOUS": {
    id: "05_MINIMAL_RELIGIOUS",
    name: "Minimal Religious",
    tagline: "Sacred Spiritual Serenity with Luminous Emerald, Pearl & Gold",
    overlayType: "center_glow",
    targetCategories: ["RELIGIOUS_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 32% of frame. Avoid high-frequency details, avoid complex objects, preserve sacred serenity for typography.",
    },
    defaultPalette: [
      { hex: "#10B981", name: "Sacred Emerald" },
      { hex: "#F59E0B", name: "Luminous Gold" },
      { hex: "#064E3B", name: "Deep Forest Nocturne" },
    ],
    typography: {
      primaryFont: "'Playfair Display', 'Cormorant Garamond', 'Cinzel', serif",
      secondaryFont: "'Inter', 'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#10B981";
      const gold = "#F59E0B";
      const rawHeadline = (brief.copywriting?.headline || "KENAIKAN ISA AL-MASIH").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 100);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "✦ PERINGATAN HARI BESAR KEAGAMAAN ✦").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "KASIH DAN DAMAI SEJAHTERA").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Meneladani kasih dan membawa damai bagi sesama.";
      const quoteLines = wrapSvgText(quote, 38);

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="religGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#022C22" stop-opacity="0" />
            <stop offset="30%" stop-color="#022C22" stop-opacity="0.45" />
            <stop offset="70%" stop-color="#022C22" stop-opacity="0.88" />
            <stop offset="100%" stop-color="#022C22" stop-opacity="0.97" />
          </linearGradient>
          <radialGradient id="sacredGlow" cx="50%" cy="80%" r="45%">
            <stop offset="0%" stop-color="${gold}" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8" />
          </filter>
        </defs>
        <rect x="0" y="1120" width="${W}" height="800" fill="url(#religGrad)" />
        <rect x="0" y="1200" width="${W}" height="720" fill="url(#sacredGlow)" />

        <g filter="url(#glow)">
          <text x="${W / 2}" y="1480" font-family="'Inter', sans-serif" font-size="14" font-weight="700" letter-spacing="8" fill="${gold}" text-anchor="middle">
            ${eyebrow}
          </text>
          <text x="${W / 2}" y="1580" font-family="'Playfair Display', 'Cormorant Garamond', serif" font-size="${headlineSize}" font-weight="700" letter-spacing="5" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <g transform="translate(${W / 2 - 90}, 1615)">
            <line x1="0" y1="0" x2="75" y2="0" stroke="${accent}" stroke-width="2" />
            <circle cx="90" cy="0" r="3.5" fill="${gold}" />
            <line x1="105" y1="0" x2="180" y2="0" stroke="${accent}" stroke-width="2" />
          </g>
          <text x="${W / 2}" y="1670" font-family="'Inter', sans-serif" font-size="24" font-weight="600" letter-spacing="3" fill="#D1FAE5" text-anchor="middle">
            ${subheadline}
          </text>
          ${quoteLines.slice(0, 2).map((l, i) => `<text x="${W / 2}" y="${1730 + i * 30}" font-family="'Playfair Display', serif" font-style="italic" font-size="20" fill="#E2E8F0" text-anchor="middle">“${escapeXml(l)}”</text>`).join("")}
          <text x="${W / 2}" y="1840" font-family="'Inter', sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="#6EE7B7" text-anchor="middle">
            EXPEDIENT ISLAMIC & SPIRITUAL ARCHIVE · 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 06. CORPORATE CLEAN (Clean Professional Executive Hierarchy)
  "06_CORPORATE_CLEAN": {
    id: "06_CORPORATE_CLEAN",
    name: "Corporate Clean",
    tagline: "Crisp Executive Blue & Slate with High Trust Hierarchy",
    overlayType: "bottom_gradient",
    targetCategories: ["ANNOUNCEMENT_POSTER", "COMMEMORATIVE_POSTER", "INFOGRAPHIC"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 30% of frame for corporate branding and announcement details.",
    },
    defaultPalette: [
      { hex: "#2563EB", name: "Corporate Blue" },
      { hex: "#0F172A", name: "Slate Navy" },
      { hex: "#F8FAFC", name: "Pure White" },
    ],
    typography: {
      primaryFont: "'Inter', 'Montserrat', 'Segoe UI', sans-serif",
      secondaryFont: "'Inter', 'Segoe UI', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#2563EB";
      const rawHeadline = (brief.copywriting?.headline || brief.theme || "EXPEDIENT OFFICIAL").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 90);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "EXPEDIENT OFFICIAL RELEASE").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "PENGUMUMAN RESMI").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody;
      const quoteLines = quote ? wrapSvgText(quote, 36) : [];

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="corpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0B132B" stop-opacity="0" />
            <stop offset="25%" stop-color="#0B132B" stop-opacity="0.45" />
            <stop offset="70%" stop-color="#0B132B" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#0B132B" stop-opacity="0.98" />
          </linearGradient>
        </defs>
        <rect x="0" y="1150" width="${W}" height="770" fill="url(#corpGrad)" />
        <line x1="0" y1="1250" x2="${W}" y2="1250" stroke="${accent}" stroke-width="4" opacity="0.8" />
        <g transform="translate(90, 1420)">
          <text x="0" y="0" font-family="'Inter', sans-serif" font-size="14" font-weight="800" letter-spacing="4" fill="${accent}">
            ${eyebrow}
          </text>
          <text x="0" y="70" font-family="'Inter', 'Montserrat', sans-serif" font-size="${headlineSize}" font-weight="900" letter-spacing="2" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="0" y="125" font-family="'Inter', sans-serif" font-size="20" font-weight="600" letter-spacing="2" fill="#CBD5E1">
            ${subheadline}
          </text>
          ${quoteLines.slice(0, 2).map((l, i) => `
            <text x="0" y="${175 + i * 28}" font-family="'Inter', sans-serif" font-size="17" fill="#94A3B8">
              ${escapeXml(l)}
            </text>
          `).join("")}
          <text x="0" y="380" font-family="'Inter', sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="#64748B">
            EXPEDIENT 43 EXECUTIVE SECRETARIAT · 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 07. YOUTH VIBRANT (High-Impact Neon Cyber Athletic Poster)
  "07_YOUTH_VIBRANT": {
    id: "07_YOUTH_VIBRANT",
    name: "Youth Vibrant",
    tagline: "High-Octane Athletics, Streetwear & Neon Dynamic Energy",
    overlayType: "bottom_gradient",
    targetCategories: ["EVENT_POSTER", "PROMOTIONAL_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain clean high-contrast dark space in bottom 32% for high-impact athletic branding.",
    },
    defaultPalette: [
      { hex: "#06B6D4", name: "Neon Cyan" },
      { hex: "#FACC15", name: "Electric Yellow" },
      { hex: "#020617", name: "Deep Void" },
    ],
    typography: {
      primaryFont: "'Bebas Neue', 'Anton', 'Montserrat', sans-serif",
      secondaryFont: "'Outfit', 'Inter', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#06B6D4";
      const rawHeadline = (brief.copywriting?.headline || "CHAMPIONSHIP").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 110);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "CHAMPIONSHIP SERIES · 2026").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "BERSATU MERAIH JUARA").toUpperCase());

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vibeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="35%" stop-color="#020617" stop-opacity="0.5" />
            <stop offset="70%" stop-color="#020617" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.97" />
          </linearGradient>
          <filter id="vibeShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8" />
          </filter>
        </defs>
        <rect x="0" y="1120" width="${W}" height="800" fill="url(#vibeGrad)" />
        <g transform="translate(${W / 2}, 1520)" filter="url(#vibeShadow)">
          <text x="0" y="0" font-family="'Outfit', sans-serif" font-size="15" font-weight="900" letter-spacing="8" fill="${accent}" text-anchor="middle">
            ${eyebrow}
          </text>
          <text x="0" y="80" font-family="'Bebas Neue', 'Anton', sans-serif" font-size="${headlineSize}" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <text x="0" y="140" font-family="'Outfit', sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#FACC15" text-anchor="middle">
            ${subheadline}
          </text>
          <text x="0" y="290" font-family="'Inter', sans-serif" font-size="11" font-weight="700" letter-spacing="5" fill="#64748B" text-anchor="middle">
            EXPEDIENT GENERATION 43 · ALL RIGHTS RESERVED
          </text>
        </g>
      </svg>`;
    },
  },

  // 08. PATRIOTIC MONUMENTAL (Dirgahayu RI, HUT TNI, Hari Pahlawan) - Multi-Stop Scrim
  "08_PATRIOTIC_MONUMENTAL": {
    id: "08_PATRIOTIC_MONUMENTAL",
    name: "Patriotic Monumental",
    tagline: "Heroic Indonesian Red & White, National Emblems & Golden Sunset",
    overlayType: "bottom_gradient",
    targetCategories: ["COMMEMORATIVE_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 32-35% of frame. Avoid high-frequency details, avoid complex objects, avoid bright highlights in typography area. Preserve strong readability support for headline placement.",
    },
    defaultPalette: [
      { hex: "#DC2626", name: "Merah Putih Patriot" },
      { hex: "#F59E0B", name: "Imperial Gold" },
      { hex: "#0F172A", name: "Midnight Navy" },
    ],
    typography: {
      primaryFont: "'Montserrat', 'Bebas Neue', 'Anton', 'Oswald', sans-serif",
      secondaryFont: "'Inter', 'Segoe UI', -apple-system, sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const rawHeadline = (brief.copywriting?.headline || "DIRGAHAYU INDONESIA").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 118);

      const rawSubhead = (brief.copywriting?.subheadline || "Merayakan Kemerdekaan, Menjaga Persatuan").trim();
      const subheadline = escapeXml(rawSubhead);

      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "★ 17 AGUSTUS · PERINGATAN RESMI NASIONAL ★").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Bersatu untuk Indonesia yang lebih maju.";
      const quoteLines = wrapSvgText(quote, 34);

      const gold = "#F59E0B";
      const red = "#DC2626";

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Multi-Stop Ultra Smooth Contrast Scrim -->
          <linearGradient id="patrioticScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="30%" stop-color="#020617" stop-opacity="0.38" />
            <stop offset="65%" stop-color="#020617" stop-opacity="0.82" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.97" />
          </linearGradient>
          <!-- Subtle Anti-Muddy Text Shadow -->
          <filter id="crispShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.75" />
          </filter>
        </defs>

        <!-- Scrim across bottom 42% -->
        <rect x="0" y="1100" width="${W}" height="820" fill="url(#patrioticScrim)" />

        <!-- Typography Hierarchy Cluster -->
        <g filter="url(#crispShadow)">
          <!-- 1. EYEBROW BADGE -->
          <text x="${W / 2}" y="1460" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-size="14" font-weight="800" letter-spacing="8" fill="${gold}" text-anchor="middle">
            ${eyebrow}
          </text>

          <!-- 2. MONUMENTAL HEADLINE (Dynamic Auto-Sized with Montserrat / Bebas Neue) -->
          <text x="${W / 2}" y="1570" font-family="'Montserrat', 'Bebas Neue', 'Anton', sans-serif" font-size="${headlineSize}" font-weight="900" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>

          <!-- 3. ELEGANT PATRIOTIC ACCENT DIVIDER -->
          <g transform="translate(${W / 2 - 120}, 1605)">
            <line x1="0" y1="0" x2="100" y2="0" stroke="${red}" stroke-width="3" />
            <circle cx="120" cy="0" r="4" fill="${gold}" />
            <line x1="140" y1="0" x2="240" y2="0" stroke="${red}" stroke-width="3" />
          </g>

          <!-- 4. REFINED SUBHEADLINE -->
          <text x="${W / 2}" y="1660" font-family="'Inter', 'Segoe UI', sans-serif" font-size="26" font-weight="600" letter-spacing="2" fill="#F1F5F9" text-anchor="middle">
            ${subheadline}
          </text>

          <!-- 5. SHORT PUNCHY QUOTE CALLOUT -->
          ${quoteLines.slice(0, 2).map((l, i) => `
            <text x="${W / 2}" y="${1720 + i * 32}" font-family="'Georgia', serif" font-style="italic" font-size="20" fill="#CBD5E1" text-anchor="middle">
              “${escapeXml(l)}”
            </text>
          `).join("")}

          <!-- 6. FOOTER BRANDING -->
          <text x="${W / 2}" y="1840" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" font-weight="700" letter-spacing="5" fill="#64748B" text-anchor="middle">
            EXPEDIENT 43 · PATRIOTIC ARCHIVE 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 09. PRODUCT PREMIUM (Dark Studio Lighting & Commercial Ad) - Vignette Overlay
  "09_PRODUCT_PREMIUM": {
    id: "09_PRODUCT_PREMIUM",
    name: "Product Premium",
    tagline: "Studio Commercial Lighting with Sharp Value Proposition",
    overlayType: "vignette",
    targetCategories: ["PRODUCT_AD", "PROMOTIONAL_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 28% of frame for luxury CTA and product branding.",
    },
    defaultPalette: [
      { hex: "#D4AF37", name: "Gold Foil" },
      { hex: "#000000", name: "Obsidian" },
      { hex: "#FFFFFF", name: "Crisp White" },
    ],
    typography: {
      primaryFont: "'Cinzel', 'Playfair Display', 'Cormorant Garamond', serif",
      secondaryFont: "'Inter', 'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#D4AF37";
      const rawHeadline = (brief.copywriting?.headline || "PREMIUM ATELIER").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 90);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "EXCLUSIVE RELEASE").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "EXPEDIENT ATELIER").toUpperCase());

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="35%" stop-color="#020617" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.95" />
          </linearGradient>
        </defs>
        <rect x="0" y="1250" width="${W}" height="670" fill="url(#prodGrad)" />
        <g transform="translate(${W / 2}, 1560)">
          <text x="0" y="0" font-family="'Inter', sans-serif" font-size="13" font-weight="700" letter-spacing="6" fill="${accent}" text-anchor="middle">
            — ${eyebrow} —
          </text>
          <text x="0" y="70" font-family="'Cinzel', 'Playfair Display', serif" font-size="${headlineSize}" font-weight="700" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <text x="0" y="125" font-family="'Inter', sans-serif" font-size="16" font-weight="600" letter-spacing="4" fill="#E2E8F0" text-anchor="middle">
            ${subheadline}
          </text>
          <text x="0" y="240" font-family="'Inter', sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="#64748B" text-anchor="middle">
            LIMITED EDITION · EXPEDIENT 43
          </text>
        </g>
      </svg>`;
    },
  },

  // 10. FUTURISTIC TECH (Cyber Minimalist HUD & Monospace Accents)
  "10_FUTURISTIC_TECH": {
    id: "10_FUTURISTIC_TECH",
    name: "Futuristic Tech",
    tagline: "Cyber Minimalist HUD with Monospace Coordinates & Data Grid",
    overlayType: "editorial_panel",
    targetCategories: ["INFOGRAPHIC", "SOCIAL_MEDIA_POST"],
    textSafeZone: {
      position: "top",
      negativeSpaceInstruction: "Maintain clean high-tech grid spacing across top 30% for digital HUD overlay.",
    },
    defaultPalette: [
      { hex: "#06B6D4", name: "Cyber Cyan" },
      { hex: "#8B5CF6", name: "Neon Violet" },
      { hex: "#020617", name: "Deep Void" },
    ],
    typography: {
      primaryFont: "'Space Grotesk', 'Outfit', 'Consolas', monospace",
      secondaryFont: "'Space Grotesk', 'Inter', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#06B6D4";
      const rawHeadline = (brief.copywriting?.headline || "NEXT GEN AI").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 90);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "[SYS_VER: 43.0] // AI COGNITIVE PROTOCOL").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "NEURAL QUANTUM ARCHITECTURE").toUpperCase());

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="techGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.88" />
            <stop offset="45%" stop-color="#020617" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${W}" height="560" fill="url(#techGrad)" />
        <g transform="translate(80, 140)">
          <text x="0" y="0" font-family="'Space Grotesk', monospace" font-size="13" fill="${accent}" letter-spacing="3">
            ${eyebrow}
          </text>
          <line x1="0" y1="20" x2="120" y2="20" stroke="${accent}" stroke-width="2" />
          <text x="0" y="85" font-family="'Space Grotesk', 'Inter', sans-serif" font-size="${headlineSize}" font-weight="900" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="0" y="140" font-family="'Space Grotesk', monospace" font-size="16" fill="#A7F3D0" letter-spacing="2">
            // ${subheadline}
          </text>
        </g>
      </svg>`;
    },
  },

  // 11. DOCUMENTARY HISTORY (Classic Sepia & Archival Record)
  "11_DOCUMENTARY_HISTORY": {
    id: "11_DOCUMENTARY_HISTORY",
    name: "Documentary History",
    tagline: "Archival Record, Historical Chronicle & Classic Monograph",
    overlayType: "bottom_gradient",
    targetCategories: ["EDUCATIONAL_POSTER", "COMMEMORATIVE_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 30% with gentle warm tint for classic historical document typography.",
    },
    defaultPalette: [
      { hex: "#D97706", name: "Warm Ochre" },
      { hex: "#1C1917", name: "Vintage Charcoal" },
      { hex: "#FEF3C7", name: "Antique Parchment" },
    ],
    typography: {
      primaryFont: "'Playfair Display', 'Times New Roman', serif",
      secondaryFont: "'Georgia', 'Inter', serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#D97706";
      const rawHeadline = (brief.copywriting?.headline || "CATATAN SEJARAH").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 95);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "— ARSIP SEJARAH EXPEDIENT —").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "MENGENANG PERJALANAN BANGSA").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody;
      const quoteLines = quote ? wrapSvgText(quote, 36) : [];

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1C1917" stop-opacity="0" />
            <stop offset="30%" stop-color="#1C1917" stop-opacity="0.45" />
            <stop offset="70%" stop-color="#1C1917" stop-opacity="0.88" />
            <stop offset="100%" stop-color="#1C1917" stop-opacity="0.97" />
          </linearGradient>
        </defs>
        <rect x="0" y="1120" width="${W}" height="800" fill="url(#histGrad)" />
        <g transform="translate(${W / 2}, 1500)">
          <text x="0" y="0" font-family="'Playfair Display', serif" font-size="14" font-weight="700" letter-spacing="6" fill="${accent}" text-anchor="middle">
            ${eyebrow}
          </text>
          <text x="0" y="80" font-family="'Playfair Display', 'Georgia', serif" font-size="${headlineSize}" font-weight="700" fill="#FEF3C7" text-anchor="middle">
            ${headline}
          </text>
          <text x="0" y="135" font-family="'Georgia', serif" font-size="20" font-weight="600" letter-spacing="3" fill="#E7E5E4" text-anchor="middle">
            ${subheadline}
          </text>
          ${quoteLines.slice(0, 2).map((l, i) => `
            <text x="0" y="${185 + i * 28}" font-family="'Playfair Display', serif" font-style="italic" font-size="18" fill="#D6D3D1" text-anchor="middle">
              “${escapeXml(l)}”
            </text>
          `).join("")}
          <text x="0" y="320" font-family="'Inter', sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="#A8A29E" text-anchor="middle">
            EXPEDIENT HISTORICAL ARCHIVE · 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 12. FESTIVAL DYNAMIC (Lanterns, Celebrations, Reuni Akbar, Milad)
  "12_FESTIVAL_DYNAMIC": {
    id: "12_FESTIVAL_DYNAMIC",
    name: "Festival Dynamic",
    tagline: "Vibrant Celebrations, Golden Milad & Reunion Atmosphere",
    overlayType: "bottom_gradient",
    targetCategories: ["EVENT_POSTER", "ANNOUNCEMENT_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain smooth low-detail dark gradient area across bottom 35% of frame for celebratory gathering details.",
    },
    defaultPalette: [
      { hex: "#FB923C", name: "Warm Sunset" },
      { hex: "#F59E0B", name: "Festive Amber" },
      { hex: "#0F172A", name: "Nocturne Slate" },
    ],
    typography: {
      primaryFont: "'Montserrat', 'Playfair Display', serif",
      secondaryFont: "'Inter', 'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#FB923C";
      const rawHeadline = (brief.copywriting?.headline || "TEMU KANGEN & REUNI").trim();
      const headline = escapeXml(rawHeadline.toUpperCase());
      const headlineSize = calculateHeadlineSize(rawHeadline, 100);
      const eyebrow = escapeXml((brief.copywriting?.eyebrow || "✦ PERAYAAN & TASYAKURAN ✦").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "EXPEDIENT GENERATION 43").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody;
      const quoteLines = quote ? wrapSvgText(quote, 36) : [];

      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="festGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0A0F1D" stop-opacity="0" />
            <stop offset="30%" stop-color="#0A0F1D" stop-opacity="0.45" />
            <stop offset="68%" stop-color="#0A0F1D" stop-opacity="0.88" />
            <stop offset="100%" stop-color="#0A0F1D" stop-opacity="0.97" />
          </linearGradient>
          <filter id="festShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8" />
          </filter>
        </defs>
        <rect x="0" y="1120" width="${W}" height="800" fill="url(#festGrad)" />
        <g transform="translate(${W / 2}, 1480)" filter="url(#festShadow)">
          <text x="0" y="0" font-family="'Inter', sans-serif" font-size="14" font-weight="800" letter-spacing="6" fill="${accent}" text-anchor="middle">
            ${eyebrow}
          </text>
          <text x="0" y="80" font-family="'Montserrat', 'Playfair Display', serif" font-size="${headlineSize}" font-weight="800" letter-spacing="3" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <text x="0" y="140" font-family="'Inter', sans-serif" font-size="22" font-weight="600" letter-spacing="3" fill="#CBD5E1" text-anchor="middle">
            ${subheadline}
          </text>
          ${quoteLines.slice(0, 2).map((l, i) => `
            <text x="0" y="${195 + i * 28}" font-family="'Playfair Display', serif" font-style="italic" font-size="18" fill="#F8FAFC" text-anchor="middle">
              “${escapeXml(l)}”
            </text>
          `).join("")}
          <text x="0" y="340" font-family="'Inter', sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="#94A3B8" text-anchor="middle">
            EXPEDIENT 43 · BERSAMA MENGUKIR SEJARAH
          </text>
        </g>
      </svg>`;
    },
  },
};

/**
 * Maps a DesignIntentCategory to the best matching default Design Preset
 */
export function getDefaultPresetForCategory(cat: DesignIntentCategory): PresetId {
  switch (cat) {
    case "COMMEMORATIVE_POSTER":
      return "08_PATRIOTIC_MONUMENTAL";
    case "RELIGIOUS_POSTER":
      return "05_MINIMAL_RELIGIOUS";
    case "EVENT_POSTER":
      return "04_GLASS_EVENT";
    case "PROMOTIONAL_POSTER":
      return "09_PRODUCT_PREMIUM";
    case "EDUCATIONAL_POSTER":
      return "03_SWISS_MODERN";
    case "ANNOUNCEMENT_POSTER":
      return "06_CORPORATE_CLEAN";
    case "PRODUCT_AD":
      return "09_PRODUCT_PREMIUM";
    case "SOCIAL_MEDIA_POST":
      return "02_EDITORIAL_LUXURY";
    case "SCENERY_IMAGE":
      return "01_CINEMATIC_HERO";
    case "PORTRAIT":
      return "02_EDITORIAL_LUXURY";
    case "INFOGRAPHIC":
      return "03_SWISS_MODERN";
    default:
      return "01_CINEMATIC_HERO";
  }
}
