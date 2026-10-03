/**
 * src/lib/whatsapp/designPromptArchitect.ts
 * AI Creative Art Director & Masterpiece Prompt Architect
 * 
 * Khusus Format Instagram Story (9:16) & Clean Visual (Anti-Gibberish).
 * Mengubah setiap permintaan pengguna menjadi visual sinematik tanpa teks cacat,
 * dilengkapi Kit Tipografi & Copywriting siap pakai untuk Instagram Story.
 */

export interface ArtDirectionBlueprint {
  title: string;
  category: "military" | "islamic" | "milad" | "sports" | "reunion" | "general";
  enhancedPrompt: string;
  theme: string;
  colorPalette: { hex: string; name: string }[];
  typography: {
    primaryFont: string;
    secondaryFont: string;
    recommendedLayout: string;
  };
  copywriting: {
    headline: string;
    subheadline: string;
    quoteOrBody?: string;
  };
  officialCdnAsset?: {
    storyUrl: string;
  };
}

/**
 * Menganalisis teks permintaan pengguna dan menghasilkan Blueprint Desain Instagram Story (9:16)
 * dengan aturan ketat Clean Visual (Anti-Gibberish: no random text/typo)
 */
export function architectMasterpieceDesign(rawUserPrompt: string): ArtDirectionBlueprint {
  const clean = rawUserPrompt.trim();
  const lower = clean.toLowerCase();

  // 1. KATEGORI A: NASIONAL / MILITER / PATRIOTIK (HUT TNI, Pahlawan, dll)
  if (
    lower.includes("tni") ||
    lower.includes("tentara") ||
    lower.includes("militer") ||
    lower.includes("pahlawan") ||
    lower.includes("polisi") ||
    lower.includes("kemiliteran")
  ) {
    return {
      title: "Peringatan Hari Ulang Tahun TNI (HUT TNI)",
      category: "military",
      theme: "Heroic Modern Tactical, Tri-Matra Forces, Golden Hour Sunset, Coastal Cinematic Lighting",
      colorPalette: [
        { hex: "#0F172A", name: "Midnight Navy Sky" },
        { hex: "#DC2626", name: "Patriot Red Ribbon" },
        { hex: "#F8FAFC", name: "Pure Textured White" },
        { hex: "#D97706", name: "Imperial Gold Emblem" },
        { hex: "#334155", name: "Charcoal Tactical Camo" },
      ],
      typography: {
        primaryFont: "Bold Modern Block Sans-Serif (TNI PRIMA Style)",
        secondaryFont: "Geometric Tracked Modern Serif",
        recommendedLayout: "Format Instagram Story 9:16: Tri-Matra Crest di Puncak, Prajurit 3 Matra Menghadap Senja Kepulauan, Formasi Sukhoi di Langit",
      },
      copywriting: {
        headline: "DIRGAHAYU",
        subheadline: "TNI KE-81",
        quoteOrBody: "TNI Prima, Bersama Rakyat Indonesia Kuat & Berdaulat Menjaga Nusantara. TNI Kuat, Indonesia Hebat.",
      },
      officialCdnAsset: {
        storyUrl: "https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hut_tni_story.jpg",
      },
      enhancedPrompt:
        "Cinematic vertical 9:16 Instagram Story photograph. " +
        "Breathtaking visual of Indonesian soldiers in modern tactical digital camouflage and Kopassus red beret, " +
        "viewed heroically from over-the-shoulder looking out over Indonesian archipelago coastline at golden sunset. " +
        "Indonesian national red and white flag fluttering on flagpole on the left, " +
        "three supersonic Sukhoi fighter jets soaring diagonally with sharp smoke trails in twilight sky, " +
        "naval frigate battleship on the ocean waves, and combat tank on shore. " +
        "Dramatic volumetric golden hour lighting, Octane render 3D, 8k resolution, extreme photorealism, " +
        "clean cinematic artwork, absolutely no text, no words, no letters, no gibberish, no watermark, no logo.",
    };
  }

  // 2. KATEGORI B: ISLAMI / HARI SANTRI / PESANTREN / MAULID / RAMADAN
  if (
    lower.includes("santri") ||
    lower.includes("hsn") ||
    lower.includes("pesantren") ||
    lower.includes("maulid") ||
    lower.includes("isra") ||
    lower.includes("ramadan") ||
    lower.includes("idul") ||
    lower.includes("islami") ||
    lower.includes("hijriyah")
  ) {
    return {
      title: "Peringatan Hari Santri Nasional / Agenda Keislaman",
      category: "islamic",
      theme: "Majestic Islamic Architecture, Royal Emerald & Warm Lantern Bokeh, Serene Twilight Glow",
      colorPalette: [
        { hex: "#064E3B", name: "Royal Emerald Green" },
        { hex: "#D97706", name: "Warm Gold Arabesque" },
        { hex: "#022C22", name: "Deep Forest Obsidian" },
        { hex: "#FEF3C7", name: "Luminous Lantern Amber" },
        { hex: "#FFFFFF", name: "Pristine White Koko" },
      ],
      typography: {
        primaryFont: "Bold 3D Emerald Block with Gold Trim & Arabic Arabesque Texture",
        secondaryFont: "Elegant Classical Calligraphic Serif",
        recommendedLayout: "Format Instagram Story 9:16: Kubah Masjid Megah Menyala, Santri Berbaju Koko Putih & Sarung Batik Hijau, Lentera Emas Mengambang",
      },
      copywriting: {
        headline: "PERINGATAN HARI SANTRI NASIONAL",
        subheadline: "JIHAD SANTRI JAYAKAN NEGERI",
        quoteOrBody: "Menyambung Juang, Merengkuh Masa Depan: Dari Pesantren untuk Kemajuan Indonesia dan Peradaban Dunia.",
      },
      officialCdnAsset: {
        storyUrl: "https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hari_santri_story.jpg",
      },
      enhancedPrompt:
        "Cinematic vertical 9:16 Instagram Story photograph. " +
        "Majestic grand illuminated Indonesian pesantren mosque with grand domes and minarets glowing in twilight blue hour sky, " +
        "warm golden hanging lantern bokeh lights, crescent moon, and Indonesian national red and white flag. " +
        "Heroic Indonesian Santri youths standing proud wearing pristine white baju koko, dark green batik sarong, and black songkok peci. " +
        "Volumetric atmospheric lighting, Octane render 3D, 8k resolution, extreme photorealism, " +
        "clean visual photography, absolutely no text, no words, no letters, no gibberish, no watermark, no logo.",
    };
  }

  // 3. KATEGORI C: MILAD / ULANG TAHUN / TASYAKURAN ALUMNI
  if (
    lower.includes("ultah") ||
    lower.includes("ulang tahun") ||
    lower.includes("milad") ||
    lower.includes("selamat milad") ||
    lower.includes("hbd") ||
    lower.includes("birthday")
  ) {
    return {
      title: "Desain Ucapan Milad & Ulang Tahun Sahabat Alumni",
      category: "milad",
      theme: "Luxury Celebratory Portrait, Dark Obsidian & Warm Champagne Gold, Elegant Geometry",
      colorPalette: [
        { hex: "#09090B", name: "Obsidian Black" },
        { hex: "#D4AF37", name: "Metallic Champagne Gold" },
        { hex: "#78350F", name: "Bronze Ember" },
        { hex: "#FFFBEB", name: "Cream Ivory" },
      ],
      typography: {
        primaryFont: "Luxury High-Fashion Modern Serif (Cinzel / Bodoni)",
        secondaryFont: "Clean Geometric Sans (Outfit / Montserrat)",
        recommendedLayout: "Format Instagram Story 9:16: Hexagonal Gold Frame, Studio Portrait Center, Partikel Emas Melayang",
      },
      copywriting: {
        headline: "BARAKALLAH FII UMRIK",
        subheadline: "SELAMAT MILAD SAHABAT EXPEDIENT 43",
        quoteOrBody: "Semoga bertambahnya usia senantiasa membawa keberkahan, kemuliaan ilmu, kelapangan rezeki, dan kesuksesan dunia akhirat.",
      },
      enhancedPrompt:
        `Cinematic vertical 9:16 Instagram Story visual for birthday celebration '${clean}'. ` +
        "Dark obsidian marble background with floating sparkling golden dust bokeh particles, geometric gold foil minimalist frame, " +
        "warm studio softbox rim lighting, cinematic depth of field, luxury celebratory atmosphere, 8k resolution, " +
        "clean visual photography, absolutely no text, no words, no letters, no gibberish, no watermark, no logo.",
    };
  }

  // 4. KATEGORI D: OLAHRAGA / FUTSAL / BADMINTON / TURNAMEN
  if (
    lower.includes("futsal") ||
    lower.includes("bola") ||
    lower.includes("sport") ||
    lower.includes("badminton") ||
    lower.includes("turnamen") ||
    lower.includes("tournament") ||
    lower.includes("cup") ||
    lower.includes("liga")
  ) {
    return {
      title: "Desain Poster / Banner Turnamen Olahraga & Futsal",
      category: "sports",
      theme: "High-Energy Dynamic Sports, Cyber Neon Lighting, Motion Blur & Stadium Floodlights",
      colorPalette: [
        { hex: "#0A0A0A", name: "Pitch Black Stadium" },
        { hex: "#2563EB", name: "Electric Cyan Blue" },
        { hex: "#E11D48", name: "Laser Crimson" },
        { hex: "#FACC15", name: "Championship Gold" },
      ],
      typography: {
        primaryFont: "Aggressive Slanted Condensed Display (Bebas Neue / Druk Bold)",
        secondaryFont: "High-Tech Monospace Subtitle",
        recommendedLayout: "Format Instagram Story 9:16: Pemain Utama Sedang Menendang Bola Dinamis, Sorot Lampu Stadion Megah, Partikel Asap Laser",
      },
      copywriting: {
        headline: "EXPEDIENT CHAMPIONSHIP CUP",
        subheadline: "JUNJUNG SPORTIVITAS · TUNTUT JUARA",
        quoteOrBody: "Buktikan ketangguhan fisik dan kekompakan strategi di lapangan hijau. Satu Tekad, Satu Solidaritas!",
      },
      enhancedPrompt:
        `Cinematic vertical 9:16 Instagram Story action sports photography for '${clean}'. ` +
        "Dynamic athlete in explosive athletic motion kicking a soccer ball, modern indoor stadium arena floodlights, " +
        "volumetric haze and shattered glowing neon cyan and amber particles, intense rim lighting, high-contrast dark aesthetic, " +
        "8k resolution, Nike commercial visual standard, " +
        "clean visual photography, absolutely no text, no words, no letters, no gibberish, no watermark, no logo.",
    };
  }

  // 5. KATEGORI E: REUNI / SILATURAHMI / ANGKATAN
  if (
    lower.includes("reuni") ||
    lower.includes("reunion") ||
    lower.includes("makrab") ||
    lower.includes("angkatan") ||
    lower.includes("silaturahmi") ||
    lower.includes("gathering") ||
    lower.includes("temu kangen")
  ) {
    return {
      title: "Poster Reuni & Temu Akbar Expedient Generation 43",
      category: "reunion",
      theme: "Cinematic Warm Nostalgia, Golden Hour Skyline, Silhouette of Friends, Timeless Heritage",
      colorPalette: [
        { hex: "#1E293B", name: "Deep Slate Blue" },
        { hex: "#D97706", name: "Warm Sunset Amber" },
        { hex: "#F59E0B", name: "Golden Glow" },
        { hex: "#F8FAFC", name: "Pure Cloud White" },
      ],
      typography: {
        primaryFont: "Timeless Heritage Serif (Playfair Display / Georgia)",
        secondaryFont: "Refined Modern Sans",
        recommendedLayout: "Format Instagram Story 9:16: Siluet Sahabat di Puncak Bukit Menghadap Senja Kota, Sinar Matahari Hangat",
      },
      copywriting: {
        headline: "TEMU KANGEN & REUNI AKBAR",
        subheadline: "MERAWAT PERSAHABATAN, MENATAP MASA DEPAN",
        quoteOrBody: "Waktu boleh terus berlalu, langkah kaki boleh merantau jauh, namun ikatan ukhuwah kita di Arrisalah akan abadi selamanya.",
      },
      enhancedPrompt:
        `Cinematic vertical 9:16 Instagram Story visual for high school alumni reunion '${clean}'. ` +
        "Silhouette of a group of alumni friends standing together on a hill overlooking city skyline at golden hour sunset, " +
        "warm amber sun rays, nostalgic cinematic color grade, atmospheric haze, 35mm lens photography, 8k resolution, " +
        "clean visual photography, absolutely no text, no words, no letters, no gibberish, no watermark, no logo.",
    };
  }

  // 6. DEFAULT / GENERAL: DESAIN GRAFIS PROFESIONAL TINGGI (BEHANCE / DRIBBBLE LEVEL)
  return {
    title: `Desain Visual Profesional: ${clean.slice(0, 30)}`,
    category: "general",
    theme: "Modern Vertical Story Layout, Octane 3D Elements, Balanced Negative Space, Studio Lighting",
    colorPalette: [
      { hex: "#0F172A", name: "Deep Space Slate" },
      { hex: "#3B82F6", name: "Modern Accent Blue" },
      { hex: "#F8FAFC", name: "Clean Negative White" },
      { hex: "#64748B", name: "Balanced Neutral Grey" },
    ],
    typography: {
      primaryFont: "Bold Minimalist Neo-Grotesque Display",
      secondaryFont: "Precision Clean Editorial Sans",
      recommendedLayout: "Format Instagram Story 9:16: 3D Hero Focal Point di Tengah, Pencahayaan Studio Mewah, Area Kosong Rapi untuk Stiker Teks",
    },
    copywriting: {
      headline: clean.toUpperCase(),
      subheadline: "EXPEDIENT CREATIVE DESIGN STUDIO",
      quoteOrBody: "Visual excellence designed to inspire and captivate.",
    },
    enhancedPrompt:
      `Cinematic vertical 9:16 Instagram Story visual about '${clean}'. ` +
      "Ultra-modern minimalist aesthetic, 3D geometric centerpiece with glassmorphism and subtle metallic accents, " +
      "professional studio lighting with soft ambient occlusion, trending on Behance and Dribbble, 8k resolution, cinematic color grading, " +
      "clean visual artwork, absolutely no text, no words, no letters, no gibberish, no watermark, no logo.",
  };
}

/**
 * Format penjelasan blueprint desain ke dalam pesan WhatsApp khusus Instagram Story
 */
export function formatBlueprintForWhatsApp(blueprint: ArtDirectionBlueprint): string {
  const paletteStr = blueprint.colorPalette.map((c) => `  • \`${c.hex}\` (${c.name})`).join("\n");

  let out = `📱 *BLUEPRINT DESAIN INSTAGRAM STORY (9:16)* 🎨\n\n`;
  out += `📌 *Proyek:* ${blueprint.title}\n`;
  out += `✨ *Konsep/Tema:* ${blueprint.theme}\n\n`;

  out += `🎨 *Palet Warna Harmonis:*\n${paletteStr}\n\n`;

  out += `🔤 *Rekomendasi Font:*\n`;
  out += `  • *Font Utama:* ${blueprint.typography.primaryFont}\n`;
  out += `  • *Font Sekunder:* ${blueprint.typography.secondaryFont}\n\n`;

  out += `📝 *Teks Siap Salin untuk Story:*\n`;
  out += `  • *Judul:* "${blueprint.copywriting.headline}"\n`;
  out += `  • *Subjudul:* "${blueprint.copywriting.subheadline}"\n`;
  if (blueprint.copywriting.quoteOrBody) {
    out += `  • *Kutipan:* _"${blueprint.copywriting.quoteOrBody}"_\n`;
  }
  out += `\n`;

  if (blueprint.officialCdnAsset) {
    out += `🖼️ *ASET STORY RESMI ULTRA-HD (8K):*\n`;
    out += `  • ${blueprint.officialCdnAsset.storyUrl}\n\n`;
    out += `_Poster resmi di atas sudah dilengkapi tipografi 3D & lambang emas, siap diposting langsung ke IG Story!_ 🚀✨`;
  } else {
    out += `💡 _Poster Instagram Story ala Pinterest lengkap dengan tipografi estetis sudah dirender dan dikirim ke chat ini!_ ✨`;
  }

  return out;
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapSvgText(text: string, maxCharsPerLine = 32): string[] {
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

function generateBarcodeSvg(x: number, y: number, height = 24): string {
  const bars = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 1, 3];
  let curX = x;
  let svg = `<g opacity="0.65">`;
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i];
    if (i % 2 === 0) {
      svg += `<rect x="${curX}" y="${y}" width="${w}" height="${height}" fill="#FFFFFF" />`;
    }
    curX += w + 1.6;
  }
  svg += `</g>`;
  return svg;
}

/**
 * Mengaplikasikan Tipografi Editorial Estetis Ala Pinterest & Majalah Mewah (Format 9:16 Instagram Story)
 * Desain bersih, bernafas, profesional, tanpa gambar klipart/garis kaku yang merusak foto AI.
 */
export async function applyPinterestTypographyOverlay(
  imageBuffer: Buffer,
  blueprint: ArtDirectionBlueprint
): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    const W = 1080;
    const H = 1920;

    // Pastikan background visual di-scale ke resolusi ultra-HD 9:16 (1080x1920)
    const bg = await sharp(imageBuffer)
      .resize(W, H, { fit: "cover", position: "center" })
      .toBuffer();

    const category = blueprint.category || "general";
    let accentColor = "#FBBF24"; // Emas amber default
    let tagText = "EXPEDIENT JOURNAL · VOL. 43";

    if (category === "islamic") {
      accentColor = "#34D399"; // Emerald
      tagText = "HARI SANTRI NASIONAL · 2026";
    } else if (category === "military") {
      accentColor = "#F59E0B"; // Gold
      tagText = "DIRGAHAYU REPUBLIK INDONESIA";
    } else if (category === "reunion") {
      accentColor = "#FB923C"; // Warm sunset
      tagText = "TEMU KANGEN & REUNI AKBAR · 43";
    } else if (category === "sport") {
      accentColor = "#38BDF8"; // Electric cyan
      tagText = "EXPEDIENT ATHLETICS · 2026";
    }

    const rawHeadline = (blueprint.copywriting.headline || blueprint.title || "EXPEDIENT").trim();
    // Spacing huruf untuk kesan monumental editorial mewah
    const headline = escapeXml(
      rawHeadline.length <= 15
        ? rawHeadline.toUpperCase().split("").join(" ")
        : rawHeadline.toUpperCase()
    );

    const subheadline = escapeXml(
      (blueprint.copywriting.subheadline || "CREATIVE ARCHIVE").toUpperCase()
    );

    const quote =
      blueprint.copywriting.quoteOrBody ||
      "Merajut kebersamaan, melangkah pasti menjemput masa depan gemilang.";
    const quoteLines = wrapSvgText(quote, 48);

    const svg = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Atmospheric Vignette Scrims -->
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

        <!-- Drop Shadows -->
        <filter id="crispShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="0.85" />
        </filter>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.65" />
        </filter>
      </defs>

      <!-- Soft Contrast Scrims -->
      <rect x="0" y="0" width="${W}" height="620" fill="url(#topScrim)" />
      <rect x="0" y="1220" width="${W}" height="700" fill="url(#bottomScrim)" />

      <!-- ==================== TOP EDITORIAL HEADER ==================== -->
      <g filter="url(#crispShadow)">
        <!-- Minimalist Tag Badge -->
        <text x="${W / 2}" y="140" font-family="'Segoe UI', -apple-system, Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="6" fill="${accentColor}" text-anchor="middle">
          — ${escapeXml(tagText)} —
        </text>

        <!-- Main Monumental Headline -->
        <text x="${W / 2}" y="235" font-family="'Georgia', 'Times New Roman', serif" font-size="${headline.length > 25 ? 46 : 58}" font-weight="700" letter-spacing="8" fill="#FFFFFF" text-anchor="middle">
          ${headline}
        </text>

        <!-- Thin Elegant Accent Line -->
        <line x1="${W / 2 - 70}" y1="272" x2="${W / 2 + 70}" y2="272" stroke="${accentColor}" stroke-width="2" opacity="0.85" />

        <!-- Refined Subheadline -->
        <text x="${W / 2}" y="312" font-family="'Segoe UI', -apple-system, Roboto, sans-serif" font-size="17" font-weight="600" letter-spacing="4" fill="#E2E8F0" text-anchor="middle">
          ${subheadline}
        </text>
      </g>

      <!-- ==================== BOTTOM PINTEREST GLASSMORPHIC CARD ==================== -->
      <g transform="translate(80, ${1580 - Math.max(0, (quoteLines.length - 2) * 30)})" filter="url(#cardShadow)">
        <!-- Frosted Dark Glass Backdrop -->
        <rect x="0" y="0" width="920" height="${190 + Math.max(0, (quoteLines.length - 2) * 30)}" rx="18" fill="#0A0F1D" fill-opacity="0.68" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1.2" />

        <!-- Poetic Quote Text -->
        ${quoteLines
          .map(
            (line, idx) => `
          <text x="460" y="${64 + idx * 34}" font-family="'Georgia', serif" font-style="italic" font-size="21" font-weight="400" fill="#F8FAFC" text-anchor="middle">
            "${escapeXml(line.replace(/^"|"$/g, ""))}"
          </text>`
          )
          .join("")}

        <!-- Divider Line -->
        <line x1="40" y1="${135 + Math.max(0, (quoteLines.length - 2) * 30)}" x2="880" y2="${135 + Math.max(0, (quoteLines.length - 2) * 30)}" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />

        <!-- Footer Metadata -->
        <text x="50" y="${164 + Math.max(0, (quoteLines.length - 2) * 30)}" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" letter-spacing="3" fill="#94A3B8">
          2026 · EXPEDIENT ARCHIVE
        </text>
        <text x="870" y="${164 + Math.max(0, (quoteLines.length - 2) * 30)}" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="${accentColor}" text-anchor="end">
          EXPEDIENT 43
        </text>
      </g>
    </svg>
    `;

    return await sharp(bg)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 96 })
      .toBuffer();
  } catch (_) {
    return imageBuffer;
  }
}


