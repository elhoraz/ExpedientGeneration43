/**
 * src/lib/whatsapp/designSystem.ts
 * Enterprise Design System & Preset Library for Expedient Studio Bot
 * 
 * Defines the 12 Design System Presets, Intent Categories, Text Safe Zones,
 * and deterministic typography composition rules.
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

export interface TextSafeZone {
  position: "top" | "bottom" | "left" | "center" | "none";
  negativeSpaceInstruction: string;
}

export interface DesignPreset {
  id: PresetId;
  name: string;
  tagline: string;
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

export function wrapSvgText(text: string, maxCharsPerLine = 38): string[] {
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

export const DESIGN_PRESETS: Record<PresetId, DesignPreset> = {
  // 01. CINEMATIC HERO (Film Poster / Dramatic Art)
  "01_CINEMATIC_HERO": {
    id: "01_CINEMATIC_HERO",
    name: "Cinematic Hero",
    tagline: "Wide Cinematic Film Poster with 85% Unblocked Visual",
    targetCategories: ["SCENERY_IMAGE", "COMMEMORATIVE_POSTER", "RELIGIOUS_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain a clean, dark, low-detail negative-space region across the bottom 28% of the frame for typography overlay.",
    },
    defaultPalette: [
      { hex: "#FBBF24", name: "Amber Gold" },
      { hex: "#0F172A", name: "Midnight Obsidian" },
      { hex: "#F8FAFC", name: "Pure Light" },
    ],
    typography: {
      primaryFont: "'Georgia', serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#FBBF24";
      const headline = escapeXml((brief.copywriting?.headline || brief.theme || "EXPEDIENT").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "CREATIVE ARCHIVE").toUpperCase());
      const tag = escapeXml((brief.poster_type || "CINEMATIC MASTERPIECE").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="45%" stop-color="#020617" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
          </linearGradient>
          <filter id="cShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.9" />
          </filter>
        </defs>
        <rect x="0" y="1150" width="${W}" height="770" fill="url(#cineGrad)" />
        <g filter="url(#cShadow)">
          <text x="${W / 2}" y="1560" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="8" fill="${accent}" text-anchor="middle">
            — ${tag} —
          </text>
          <text x="${W / 2}" y="1650" font-family="'Georgia', serif" font-size="${headline.length > 20 ? 46 : 60}" font-weight="700" letter-spacing="8" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 80}" y1="1690" x2="${W / 2 + 80}" y2="1690" stroke="${accent}" stroke-width="2" opacity="0.85" />
          <text x="${W / 2}" y="1740" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" letter-spacing="4" fill="#CBD5E1" text-anchor="middle">
            ${subheadline}
          </text>
          <text x="${W / 2}" y="1830" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" letter-spacing="5" fill="#64748B" text-anchor="middle">
            EXPEDIENT CREATIVE AI STUDIO · 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 02. EDITORIAL LUXURY (Vogue & Architectural Digest High Fashion)
  "02_EDITORIAL_LUXURY": {
    id: "02_EDITORIAL_LUXURY",
    name: "Editorial Luxury",
    tagline: "Haute Couture & Fine Architecture Magazine Cover",
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
      primaryFont: "'Georgia', 'Times New Roman', serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#D4AF37";
      const headline = escapeXml((brief.copywriting?.headline || brief.theme || "EXPEDIENT").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "CREATIVE ARCHIVE").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Merajut harmoni dalam kemewahan estetika visual modern.";
      const quoteLines = wrapSvgText(quote, 46);
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.82" />
            <stop offset="45%" stop-color="#020617" stop-opacity="0.48" />
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
          <text x="${W / 2}" y="140" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="6" fill="${accent}" text-anchor="middle">
            — EXPEDIENT JOURNAL · VOL. 43 —
          </text>
          <text x="${W / 2}" y="235" font-family="'Georgia', serif" font-size="${headline.length > 25 ? 46 : 58}" font-weight="700" letter-spacing="6" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 70}" y1="272" x2="${W / 2 + 70}" y2="272" stroke="${accent}" stroke-width="2" opacity="0.85" />
          <text x="${W / 2}" y="312" font-family="'Segoe UI', sans-serif" font-size="17" font-weight="600" letter-spacing="4" fill="#E2E8F0" text-anchor="middle">
            ${subheadline}
          </text>
        </g>

        <g transform="translate(80, ${1580 - Math.max(0, (quoteLines.length - 2) * 30)})" filter="url(#cardShadow)">
          <rect x="0" y="0" width="920" height="${190 + Math.max(0, (quoteLines.length - 2) * 30)}" rx="18" fill="#0A0F1D" fill-opacity="0.68" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1.2" />
          ${quoteLines.map((line, idx) => `<text x="460" y="${64 + idx * 34}" font-family="'Georgia', serif" font-style="italic" font-size="21" font-weight="400" fill="#F8FAFC" text-anchor="middle">“${escapeXml(line)}”</text>`).join("")}
          <line x1="40" y1="${135 + Math.max(0, (quoteLines.length - 2) * 30)}" x2="880" y2="${135 + Math.max(0, (quoteLines.length - 2) * 30)}" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
          <text x="50" y="${164 + Math.max(0, (quoteLines.length - 2) * 30)}" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" letter-spacing="3" fill="#94A3B8">
            2026 · EXPEDIENT ARCHIVE
          </text>
          <text x="870" y="${164 + Math.max(0, (quoteLines.length - 2) * 30)}" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="${accent}" text-anchor="end">
            EXPEDIENT 43
          </text>
        </g>
      </svg>`;
    },
  },

  // 03. SWISS MODERN (Asymmetrical Grotesque Bauhaus Art Agency)
  "03_SWISS_MODERN": {
    id: "03_SWISS_MODERN",
    name: "Swiss Modern",
    tagline: "Asymmetrical Left-Aligned Swiss Modernism with Clean Grid",
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
      primaryFont: "'Helvetica Neue', Arial, sans-serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#EF4444";
      const headline = escapeXml((brief.copywriting?.headline || brief.theme || "EXPEDIENT").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "SWISS DESIGN ARCHIVE").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Struktur, presisi, dan harmoni dalam setiap detail karya grafis.";
      const quoteLines = wrapSvgText(quote, 32);
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leftScrim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.88" />
            <stop offset="55%" stop-color="#020617" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.75" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${W}" height="700" fill="url(#topScrim)" />
        <rect x="0" y="0" width="750" height="${H}" fill="url(#leftScrim)" />

        <g transform="translate(100, 160)">
          <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" letter-spacing="6" fill="${accent}">
            EDITION NO. 43
          </text>
          <line x1="0" y1="20" x2="60" y2="20" stroke="${accent}" stroke-width="3" />
          <text x="0" y="110" font-family="'Helvetica Neue', Arial, sans-serif" font-size="64" font-weight="900" letter-spacing="2" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="0" y="165" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" letter-spacing="4" fill="#94A3B8">
            ${subheadline}
          </text>
        </g>

        <g transform="translate(100, 1650)">
          <rect x="0" y="0" width="4" height="80" fill="${accent}" />
          ${quoteLines.slice(0, 2).map((l, i) => `<text x="24" y="${28 + i * 28}" font-family="'Georgia', serif" font-style="italic" font-size="20" fill="#F1F5F9">${escapeXml(l)}</text>`).join("")}
          <text x="24" y="95" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#64748B">
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
    targetCategories: ["EVENT_POSTER", "ANNOUNCEMENT_POSTER", "PROMOTIONAL_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Keep the bottom 35% of the scene clean and uncluttered to anchor a floating frosted glass story card.",
    },
    defaultPalette: [
      { hex: "#38BDF8", name: "Ice Cyan" },
      { hex: "#0F172A", name: "Deep Obsidian" },
      { hex: "#E2E8F0", name: "Frosted Glass" },
    ],
    typography: {
      primaryFont: "'Georgia', serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#38BDF8";
      const headline = escapeXml((brief.copywriting?.headline || brief.theme || "EXPEDIENT EVENT").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "AGENDA RESMI").toUpperCase());
      const tag = escapeXml((brief.poster_type || "OFFICIAL INVITATION").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Bergabung bersama kami dalam momen penuh makna dan inspirasi.";
      const quoteLines = wrapSvgText(quote, 38);
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.82" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
          </filter>
        </defs>
        <rect x="0" y="1000" width="${W}" height="920" fill="url(#cardGrad)" />
        
        <g transform="translate(70, 1380)" filter="url(#shadow)">
          <rect x="0" y="0" width="940" height="420" rx="28" fill="#0A0F1D" fill-opacity="0.75" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1.5" />
          
          <rect x="45" y="45" width="220" height="34" rx="17" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-width="1" />
          <text x="155" y="67" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="${accent}" text-anchor="middle">
            ${tag.slice(0, 22)}
          </text>

          <text x="45" y="135" font-family="'Georgia', serif" font-size="44" font-weight="700" letter-spacing="3" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="45" y="175" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" letter-spacing="3" fill="#94A3B8">
            ${subheadline}
          </text>

          <line x1="45" y1="210" x2="895" y2="210" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />

          ${quoteLines.slice(0, 3).map((l, i) => `<text x="45" y="${260 + i * 32}" font-family="'Georgia', serif" font-style="italic" font-size="20" fill="#E2E8F0">${escapeXml(l)}</text>`).join("")}

          <text x="895" y="380" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="${accent}" text-anchor="end">
            EXPEDIENT GENERATION 43
          </text>
        </g>
      </svg>`;
    },
  },

  // 05. MINIMAL RELIGIOUS (Sacred Spiritual Serenity with Luminous Emerald & Gold)
  "05_MINIMAL_RELIGIOUS": {
    id: "05_MINIMAL_RELIGIOUS",
    name: "Minimal Religious",
    tagline: "Sacred Spiritual Serenity with Luminous Emerald, Pearl & Gold",
    targetCategories: ["RELIGIOUS_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain clean ethereal space in the bottom 30% of the frame so sacred minarets and moonlit skies remain 100% visible.",
    },
    defaultPalette: [
      { hex: "#10B981", name: "Sacred Emerald" },
      { hex: "#F59E0B", name: "Luminous Gold" },
      { hex: "#064E3B", name: "Deep Forest Nocturne" },
    ],
    typography: {
      primaryFont: "'Georgia', serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#10B981";
      const gold = "#F59E0B";
      const headline = escapeXml((brief.copywriting?.headline || "MAULID NABI").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "MUHAMMAD SAW").toUpperCase());
      const quote = brief.copywriting?.quoteOrBody || "Meneladani akhlak agung Baginda Rasulullah SAW sebagai rahmat bagi semesta alam.";
      const quoteLines = wrapSvgText(quote, 44);
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="religGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#022C22" stop-opacity="0" />
            <stop offset="40%" stop-color="#022C22" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#022C22" stop-opacity="0.95" />
          </linearGradient>
          <filter id="glow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.9" />
          </filter>
        </defs>
        <rect x="0" y="1150" width="${W}" height="770" fill="url(#religGrad)" />

        <g filter="url(#glow)">
          <text x="${W / 2}" y="1520" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="700" letter-spacing="8" fill="${gold}" text-anchor="middle">
            ✦ PERINGATAN HARI BESAR ISLAM ✦
          </text>
          <text x="${W / 2}" y="1610" font-family="'Georgia', serif" font-size="${headline.length > 18 ? 48 : 62}" font-weight="700" letter-spacing="6" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 90}" y1="1645" x2="${W / 2 + 90}" y2="1645" stroke="${accent}" stroke-width="2" />
          <text x="${W / 2}" y="1690" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="600" letter-spacing="4" fill="#D1FAE5" text-anchor="middle">
            ${subheadline}
          </text>
          ${quoteLines.slice(0, 2).map((l, i) => `<text x="${W / 2}" y="${1745 + i * 30}" font-family="'Georgia', serif" font-style="italic" font-size="17" fill="#E2E8F0" text-anchor="middle">“${escapeXml(l)}”</text>`).join("")}
          <text x="${W / 2}" y="1840" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="#6EE7B7" text-anchor="middle">
            EXPEDIENT ISLAMIC ARCHIVE · 1448 H
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
    targetCategories: ["ANNOUNCEMENT_POSTER", "COMMEMORATIVE_POSTER", "INFOGRAPHIC"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Reserve clean structural space in lower 30% for corporate branding and announcement details.",
    },
    defaultPalette: [
      { hex: "#2563EB", name: "Corporate Blue" },
      { hex: "#0F172A", name: "Slate Navy" },
      { hex: "#F8FAFC", name: "Pure White" },
    ],
    typography: {
      primaryFont: "'Segoe UI', Roboto, sans-serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#2563EB";
      const headline = escapeXml((brief.copywriting?.headline || brief.theme || "EXPEDIENT OFFICIAL").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "PENGUMUMAN RESMI").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="1250" width="${W}" height="670" fill="#0B132B" fill-opacity="0.9" />
        <line x1="0" y1="1250" x2="${W}" y2="1250" stroke="${accent}" stroke-width="4" />
        <g transform="translate(90, 1380)">
          <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" letter-spacing="4" fill="${accent}">
            EXPEDIENT OFFICIAL RELEASE
          </text>
          <text x="0" y="70" font-family="'Segoe UI', sans-serif" font-size="52" font-weight="800" letter-spacing="2" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="0" y="120" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="500" letter-spacing="2" fill="#94A3B8">
            ${subheadline}
          </text>
        </g>
      </svg>`;
    },
  },

  // 07. YOUTH VIBRANT (High Octane Electric Energy & Athletics)
  "07_YOUTH_VIBRANT": {
    id: "07_YOUTH_VIBRANT",
    name: "Youth Vibrant",
    tagline: "High Octane Sports, Athletics & Youth Community Energy",
    targetCategories: ["EVENT_POSTER", "SOCIAL_MEDIA_POST"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Ensure bottom 30% has dark dynamic vignette for aggressive high-energy typography.",
    },
    defaultPalette: [
      { hex: "#06B6D4", name: "Electric Cyan" },
      { hex: "#F43F5E", name: "Neon Coral" },
      { hex: "#0F172A", name: "Dark Void" },
    ],
    typography: {
      primaryFont: "'Impact', 'Arial Black', sans-serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#06B6D4";
      const headline = escapeXml((brief.copywriting?.headline || "EXPEDIENT ATHLETICS").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vibeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.95" />
          </linearGradient>
        </defs>
        <rect x="0" y="1200" width="${W}" height="720" fill="url(#vibeGrad)" />
        <g transform="translate(${W / 2}, 1620)">
          <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="900" letter-spacing="8" fill="${accent}" text-anchor="middle">
            CHAMPIONSHIP SERIES · 2026
          </text>
          <text x="0" y="80" font-family="'Impact', 'Arial Black', sans-serif" font-size="76" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
        </g>
      </svg>`;
    },
  },

  // 08. PATRIOTIC MONUMENTAL (Dirgahayu RI, HUT TNI, Hari Pahlawan)
  "08_PATRIOTIC_MONUMENTAL": {
    id: "08_PATRIOTIC_MONUMENTAL",
    name: "Patriotic Monumental",
    tagline: "Heroic Indonesian Red & White, National Emblems & Golden Sunset",
    targetCategories: ["COMMEMORATIVE_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain clean cinematic negative space in bottom 32% for monumental national headline.",
    },
    defaultPalette: [
      { hex: "#DC2626", name: "Merah Putih Patriot" },
      { hex: "#F59E0B", name: "Imperial Gold" },
      { hex: "#0F172A", name: "Midnight Navy" },
    ],
    typography: {
      primaryFont: "'Impact', 'Arial Black', sans-serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const gold = "#F59E0B";
      const headline = escapeXml((brief.copywriting?.headline || "DIRGAHAYU REPUBLIK INDONESIA").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "BERSATU KITA TEGUH, NUSANTARA BERDAULAT").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="45%" stop-color="#020617" stop-opacity="0.65" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
          </linearGradient>
        </defs>
        <rect x="0" y="1150" width="${W}" height="770" fill="url(#patGrad)" />
        <g>
          <text x="${W / 2}" y="1540" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" letter-spacing="8" fill="${gold}" text-anchor="middle">
            ★ PERINGATAN RESMI NASIONAL ★
          </text>
          <text x="${W / 2}" y="1635" font-family="'Impact', 'Arial Black', sans-serif" font-size="${headline.length > 22 ? 52 : 68}" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 100}" y1="1670" x2="${W / 2 + 100}" y2="1670" stroke="#DC2626" stroke-width="3" />
          <text x="${W / 2}" y="1720" font-family="'Segoe UI', sans-serif" font-size="17" font-weight="700" letter-spacing="3" fill="#E2E8F0" text-anchor="middle">
            ${subheadline}
          </text>
          <text x="${W / 2}" y="1820" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="#94A3B8" text-anchor="middle">
            EXPEDIENT 43 PATRIOTIC ARCHIVE · 2026
          </text>
        </g>
      </svg>`;
    },
  },

  // 09. PRODUCT PREMIUM (Dark Studio Lighting & Commercial Ad)
  "09_PRODUCT_PREMIUM": {
    id: "09_PRODUCT_PREMIUM",
    name: "Product Premium",
    tagline: "Studio Commercial Lighting with Sharp Value Proposition",
    targetCategories: ["PRODUCT_AD", "PROMOTIONAL_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Keep product centered and bottom 25% clear for CTA and luxury branding.",
    },
    defaultPalette: [
      { hex: "#D4AF37", name: "Gold Foil" },
      { hex: "#000000", name: "Obsidian" },
      { hex: "#FFFFFF", name: "Crisp White" },
    ],
    typography: {
      primaryFont: "'Georgia', serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#D4AF37";
      const headline = escapeXml((brief.copywriting?.headline || "PREMIUM COLLECTION").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="1450" width="${W}" height="470" fill="#000000" fill-opacity="0.8" />
        <text x="${W / 2}" y="1600" font-family="'Georgia', serif" font-size="54" font-weight="700" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
          ${headline}
        </text>
        <text x="${W / 2}" y="1660" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="600" letter-spacing="6" fill="${accent}" text-anchor="middle">
          LIMITED EDITION · EXPEDIENT ATELIER
        </text>
      </svg>`;
    },
  },

  // 10. FUTURISTIC TECH (Cyber Minimalist HUD & Monospace Accents)
  "10_FUTURISTIC_TECH": {
    id: "10_FUTURISTIC_TECH",
    name: "Futuristic Tech",
    tagline: "Cyber Minimalist HUD with Monospace Coordinates & Data Grid",
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
      primaryFont: "'Consolas', monospace",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "left",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#06B6D4";
      const headline = escapeXml((brief.copywriting?.headline || "NEXT GEN INTELLIGENCE").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${W}" height="500" fill="#020617" fill-opacity="0.75" />
        <g transform="translate(80, 140)">
          <text x="0" y="0" font-family="'Consolas', monospace" font-size="13" fill="${accent}" letter-spacing="3">
            [SYS_VER: 43.0] // AI COGNITIVE PROTOCOL
          </text>
          <text x="0" y="65" font-family="'Segoe UI', sans-serif" font-size="52" font-weight="900" fill="#FFFFFF">
            ${headline}
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
    targetCategories: ["EDUCATIONAL_POSTER", "COMMEMORATIVE_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Ensure bottom 30% has gentle warm tint for classic historical document typography.",
    },
    defaultPalette: [
      { hex: "#D97706", name: "Warm Ochre" },
      { hex: "#1C1917", name: "Vintage Charcoal" },
      { hex: "#FEF3C7", name: "Antique Parchment" },
    ],
    typography: {
      primaryFont: "'Times New Roman', serif",
      secondaryFont: "'Georgia', serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#D97706";
      const headline = escapeXml((brief.copywriting?.headline || "CATATAN SEJARAH").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="1250" width="${W}" height="670" fill="#1C1917" fill-opacity="0.88" />
        <text x="${W / 2}" y="1450" font-family="'Times New Roman', serif" font-size="14" font-weight="700" letter-spacing="6" fill="${accent}" text-anchor="middle">
          — ARSIP SEJARAH EXPEDIENT —
        </text>
        <text x="${W / 2}" y="1540" font-family="'Times New Roman', serif" font-size="52" font-weight="700" fill="#FEF3C7" text-anchor="middle">
          ${headline}
        </text>
      </svg>`;
    },
  },

  // 12. FESTIVAL DYNAMIC (Lanterns, Celebrations, Reuni Akbar, Milad)
  "12_FESTIVAL_DYNAMIC": {
    id: "12_FESTIVAL_DYNAMIC",
    name: "Festival Dynamic",
    tagline: "Vibrant Celebrations, Golden Milad & Reunion Atmosphere",
    targetCategories: ["EVENT_POSTER", "ANNOUNCEMENT_POSTER"],
    textSafeZone: {
      position: "bottom",
      negativeSpaceInstruction: "Maintain warm dark atmospheric space in bottom 35% for celebratory gathering details.",
    },
    defaultPalette: [
      { hex: "#FB923C", name: "Warm Sunset" },
      { hex: "#F59E0B", name: "Festive Amber" },
      { hex: "#0F172A", name: "Nocturne Slate" },
    ],
    typography: {
      primaryFont: "'Georgia', serif",
      secondaryFont: "'Segoe UI', sans-serif",
      headlineAlign: "center",
      headlineCase: "uppercase",
    },
    renderSvg: (W, H, brief) => {
      const accent = brief.primary_colors?.[0] || "#FB923C";
      const headline = escapeXml((brief.copywriting?.headline || "TEMU KANGEN & REUNI").toUpperCase());
      const subheadline = escapeXml((brief.copywriting?.subheadline || "EXPEDIENT GENERATION 43").toUpperCase());
      return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="1180" width="${W}" height="740" fill="#0A0F1D" fill-opacity="0.8" />
        <g transform="translate(${W / 2}, 1520)">
          <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" letter-spacing="6" fill="${accent}" text-anchor="middle">
            ✦ PERAYAAN & TASYAKURAN ✦
          </text>
          <text x="0" y="80" font-family="'Georgia', serif" font-size="56" font-weight="700" letter-spacing="3" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <text x="0" y="140" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="600" letter-spacing="3" fill="#CBD5E1" text-anchor="middle">
            ${subheadline}
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
