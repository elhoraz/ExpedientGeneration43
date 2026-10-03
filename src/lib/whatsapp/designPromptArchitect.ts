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
 * Mengaplikasikan Tipografi Heroik Khas Poster Resmi & Pinterest (Format 9:16 Instagram Story)
 * Meniru secara persis penataan, font, ukuran font, lambang emas, dan kuas bendera seperti poster HUT TNI / Hari Besar
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

    const isMilitary = blueprint.category === "military";
    const isIslamic = blueprint.category === "islamic";

    // 1. Ekstraksi Judul & Tipografi Sesuai Kategori
    let headline = "D I R G A H A Y U";
    let subheadline = "TENTARA NASIONAL INDONESIA";
    let dateStr = "5 OKTOBER 1945 – 5 OKTOBER 2026";
    let annivNum = "81";
    let mainTitle = "TNI";
    let slogan1 = "TNI PRIMA";
    let slogan2 = "TNI RAKYAT · INDONESIA MAJU";
    let quote = "Teruslah menjadi garda terdepan untuk menjaga kedaulatan bangsa dan mengabdi kepada rakyat, negara, dan tanah air.";
    let motto = "TNI KUAT, INDONESIA HEBAT";

    let primaryColor = "#DC2626"; // Merah
    let secondaryColor = "#FFFFFF";
    let accentColor = "#F59E0B"; // Emas

    if (isMilitary) {
      headline = "D I R G A H A Y U";
      subheadline = "TENTARA NASIONAL INDONESIA";
      dateStr = "5 OKTOBER 1945 – 5 OKTOBER 2026";
      annivNum = "81";
      mainTitle = "TNI";
      slogan1 = "TNI PRIMA";
      slogan2 = "TNI RAKYAT · INDONESIA MAJU";
      quote = blueprint.copywriting.quoteOrBody || "Teruslah menjadi garda terdepan untuk menjaga kedaulatan bangsa dan mengabdi kepada rakyat, negara, dan tanah air.";
      motto = "TNI KUAT, INDONESIA HEBAT";
      primaryColor = "#DC2626";
      secondaryColor = "#FFFFFF";
      accentColor = "#F59E0B";
    } else if (isIslamic) {
      headline = "P E R I N G A T A N";
      subheadline = "HARI SANTRI NASIONAL";
      dateStr = "22 OKTOBER 1945 – 22 OKTOBER 2026";
      annivNum = "2026";
      mainTitle = "SANTRI";
      slogan1 = "JIHAD SANTRI";
      slogan2 = "JAYAKAN NEGERI · BERAKHLAK MULIA";
      quote = blueprint.copywriting.quoteOrBody || "Menyambung juang, merengkuh masa depan. Dari pesantren untuk kemajuan Indonesia dan peradaban dunia.";
      motto = "SANTRI BERDAYA, INDONESIA JAYA";
      primaryColor = "#059669"; // Emerald
      secondaryColor = "#FFFFFF";
      accentColor = "#F59E0B";
    } else {
      headline = escapeXml((blueprint.copywriting.headline || "D I R G A H A Y U").toUpperCase());
      subheadline = escapeXml((blueprint.copywriting.subheadline || blueprint.title || "EXPEDIENT 43").toUpperCase());
      dateStr = "2026 · EXPEDIENT ARCHIVE";
      const numMatch = (headline + " " + subheadline).match(/\d+/);
      annivNum = numMatch ? numMatch[0] : "43";
      mainTitle = escapeXml(subheadline.length > 8 ? subheadline.slice(0, 8) : subheadline);
      slogan1 = "GENERASI EMAS";
      slogan2 = "BERSATU · BERKARYA · BERJAYA";
      quote = blueprint.copywriting.quoteOrBody || "Merajut kebersamaan, melangkah pasti menjemput masa depan gemilang.";
      motto = "EXPEDIENT 43 UNTUK INDONESIA";
      primaryColor = blueprint.colorPalette[1]?.hex || "#DC2626";
      secondaryColor = "#FFFFFF";
      accentColor = blueprint.colorPalette[0]?.hex || "#F59E0B";
    }

    const quoteLines = wrapSvgText(quote, 46);

    const svg = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Atmospheric Sky Gradient Scrims -->
        <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.85" />
          <stop offset="25%" stop-color="#020617" stop-opacity="0.65" />
          <stop offset="50%" stop-color="#020617" stop-opacity="0.30" />
          <stop offset="80%" stop-color="#020617" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="bottomScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#020617" stop-opacity="0" />
          <stop offset="30%" stop-color="#020617" stop-opacity="0.45" />
          <stop offset="70%" stop-color="#020617" stop-opacity="0.82" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
        </linearGradient>

        <!-- Authentic Gold Crest Gradient -->
        <linearGradient id="goldBright" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FEF9C3" />
          <stop offset="30%" stop-color="#FCD34D" />
          <stop offset="65%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#B45309" />
        </linearGradient>

        <!-- 3D Ribbon Gradients -->
        <linearGradient id="ribbonSplit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${primaryColor}" />
          <stop offset="48%" stop-color="#991B1B" />
          <stop offset="50%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#E2E8F0" />
        </linearGradient>

        <!-- Text Drop Shadows -->
        <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.95" />
        </filter>
        <filter id="crispShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.92" />
        </filter>
        <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="${accentColor}" flood-opacity="0.7" />
        </filter>
      </defs>

      <!-- Scrim Gradients -->
      <rect x="0" y="0" width="${W}" height="920" fill="url(#topScrim)" />
      <rect x="0" y="1300" width="${W}" height="620" fill="url(#bottomScrim)" />

      <!-- ==================== TOP-LEFT DRAPED FLAG BANNER ==================== -->
      <g filter="url(#heavyShadow)">
        <path d="M 0 0 L 340 0 C 280 60, 210 100, 150 155 C 95 195, 45 225, 0 245 Z" fill="${primaryColor}" />
        <path d="M 0 0 L 200 0 C 130 75, 75 150, 0 220 Z" fill="#7F1D1D" opacity="0.35" />
        <path d="M 0 245 C 45 225, 95 195, 150 155 C 210 100, 280 60, 340 0 L 375 0 C 305 70, 225 125, 160 185 C 100 235, 50 265, 0 285 Z" fill="${secondaryColor}" />
        <path d="M 150 155 C 130 175, 90 215, 45 250" stroke="#000000" stroke-width="3" opacity="0.2" fill="none" />
      </g>

      <!-- ==================== TOP CENTER AUTHENTIC GOLDEN CREST ==================== -->
      <g transform="translate(${W / 2}, 115)" filter="url(#goldGlow)">
        <!-- Laurel Wreath -->
        <circle cx="0" cy="0" r="62" fill="none" stroke="url(#goldBright)" stroke-width="3" stroke-dasharray="10,4" />
        <circle cx="0" cy="0" r="54" fill="#0A0F1D" fill-opacity="0.88" stroke="url(#goldBright)" stroke-width="2.5" />
        <path d="M -50 15 C -56 -12, -42 -42, 0 -52 C 42 -42, 56 -12, 50 15 C 42 36, 25 48, 0 54 C -25 48, -42 36, -50 15 Z" fill="none" stroke="url(#goldBright)" stroke-width="3" />

        <!-- 5-Pointed Star -->
        <polygon points="0,-42 4.5,-29 18,-29 8,-21 11,-8 0,-16 -11,-8 -8,-21 -18,-29 -4.5,-29" fill="url(#goldBright)" />

        <!-- Tri-Matra Wings / Crest Wings -->
        <path d="M -38 -15 C -22 -22, -11 -20, 0 -11 C 11 -20, 22 -22, 38 -15 C 28 -7, 14 -5, 0 3 C -14 -5, -28 -7, -38 -15 Z" fill="url(#goldBright)" />

        <!-- Anchor / Shield Center -->
        <line x1="0" y1="-11" x2="0" y2="33" stroke="url(#goldBright)" stroke-width="5.5" stroke-linecap="round" />
        <line x1="-18" y1="2" x2="18" y2="2" stroke="url(#goldBright)" stroke-width="4.5" stroke-linecap="round" />
        <path d="M -26 18 C -22 37, 22 37, 26 18" fill="none" stroke="url(#goldBright)" stroke-width="5" stroke-linecap="round" />
        <circle cx="0" cy="-8" r="4" fill="#0A0F1D" stroke="url(#goldBright)" stroke-width="2.5" />

        <!-- Ribbon at Base of Crest -->
        <path d="M -38 38 C -19 48, 19 48, 38 38 L 34 47 C 16 55, -16 55, -34 47 Z" fill="${primaryColor}" />
        <path d="M -34 47 C -16 55, 16 55, 34 47 L 30 54 C 13 60, -13 60, -30 54 Z" fill="${secondaryColor}" />
      </g>

      <!-- ==================== HEADER TYPOGRAPHY ==================== -->
      <g filter="url(#heavyShadow)">
        <!-- Line 1: D I R G A H A Y U -->
        <text x="${W / 2}" y="240" font-family="'Montserrat', 'Arial Black', sans-serif" font-size="28" font-weight="900" letter-spacing="14" fill="#FFFFFF" text-anchor="middle">
          ${headline}
        </text>

        <!-- Line 2: TENTARA NASIONAL INDONESIA -->
        <text x="${W / 2}" y="282" font-family="'Montserrat', Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="5" fill="#F8FAFC" text-anchor="middle">
          ${subheadline}
        </text>

        <!-- Line 3: Fine Divider with Commemoration Dates -->
        <g opacity="0.9">
          <line x1="160" y1="318" x2="310" y2="318" stroke="#FFFFFF" stroke-width="1.8" />
          <text x="${W / 2}" y="323" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" letter-spacing="3" fill="#FFFFFF" text-anchor="middle">
            ${dateStr}
          </text>
          <line x1="770" y1="318" x2="920" y2="318" stroke="#FFFFFF" stroke-width="1.8" />
        </g>
      </g>

      <!-- ==================== 3D RED-WHITE COMMEMORATIVE NUMBER ==================== -->
      <g filter="url(#heavyShadow)">
        <!-- 3D Ribbon Numeral '81' / '80' -->
        <g transform="translate(${W / 2 - (annivNum.length > 2 ? 0 : 20)}, 475)">
          <!-- Deep 3D Shadow -->
          <text x="0" y="8" font-family="'Arial Black', 'Montserrat ExtraBold', Impact, sans-serif" font-size="${annivNum.length > 2 ? 140 : 175}" font-weight="900" letter-spacing="-6" fill="#000000" opacity="0.75" text-anchor="middle">
            ${annivNum}
          </text>

          <!-- Red Upper & White Lower Split 3D Ribbon Fill -->
          <text x="0" y="0" font-family="'Arial Black', 'Montserrat ExtraBold', Impact, sans-serif" font-size="${annivNum.length > 2 ? 140 : 175}" font-weight="900" letter-spacing="-6" fill="url(#ribbonSplit)" text-anchor="middle">
            ${annivNum}
          </text>

          <!-- Fine 3D edge highlight -->
          <text x="0" y="0" font-family="'Arial Black', 'Montserrat ExtraBold', Impact, sans-serif" font-size="${annivNum.length > 2 ? 140 : 175}" font-weight="900" letter-spacing="-6" fill="none" stroke="#FFFFFF" stroke-width="2.5" opacity="0.6" text-anchor="middle">
            ${annivNum}
          </text>

          ${
            annivNum.length <= 2
              ? `<text x="135" y="-85" font-family="'Montserrat', 'Arial Black', sans-serif" font-size="38" font-weight="900" fill="#FFFFFF" filter="url(#crispShadow)">TH</text>`
              : ""
          }
        </g>
      </g>

      <!-- ==================== MONUMENTAL MAIN TITLE 'TNI' ==================== -->
      <g filter="url(#heavyShadow)">
        <!-- Massive Block Title: 'TNI' -->
        <!-- 3D Extrusion Shadow -->
        <text x="${W / 2 + 4}" y="624" font-family="'Arial Black', 'Impact', 'Montserrat ExtraBold', sans-serif" font-size="170" font-weight="900" letter-spacing="4" fill="#000000" opacity="0.85" text-anchor="middle">
          ${mainTitle}
        </text>
        <!-- Pure Monumental Face -->
        <text x="${W / 2}" y="620" font-family="'Arial Black', 'Impact', 'Montserrat ExtraBold', sans-serif" font-size="170" font-weight="900" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">
          ${mainTitle}
        </text>

        <!-- Official Slogan 1: TNI PRIMA -->
        <text x="${W / 2}" y="688" font-family="'Montserrat', 'Arial Black', sans-serif" font-size="32" font-weight="900" letter-spacing="7" fill="#FFFFFF" text-anchor="middle">
          ${slogan1}
        </text>

        <!-- Official Slogan 2: TNI RAKYAT · INDONESIA MAJU -->
        <text x="${W / 2}" y="730" font-family="'Montserrat', Arial, sans-serif" font-size="21" font-weight="800" letter-spacing="4" fill="#F1F5F9" opacity="0.95" text-anchor="middle">
          ${slogan2}
        </text>
      </g>

      <!-- ==================== BOTTOM-RIGHT DYNAMIC BRUSH STROKE ==================== -->
      <g filter="url(#heavyShadow)">
        <path d="M 660 1920 L 1080 1500 L 1080 1710 L 800 1920 Z" fill="${primaryColor}" opacity="0.95" />
        <path d="M 740 1920 L 1080 1580 L 1080 1670 L 840 1920 Z" fill="#7F1D1D" opacity="0.5" />
        <path d="M 780 1920 L 1080 1620 L 1080 1710 L 880 1920 Z" fill="${secondaryColor}" opacity="0.9" />
      </g>

      <!-- ==================== BOTTOM PATRIOTIC QUOTE & MOTTO ==================== -->
      <g filter="url(#heavyShadow)">
        <!-- Multi-line Centered Italic Quote -->
        ${quoteLines.map((line, idx) => `
          <text x="${W / 2}" y="${1740 + idx * 34}" font-family="'Georgia', serif" font-style="italic" font-size="20" font-weight="400" fill="#F8FAFC" text-anchor="middle">
            ${escapeXml(line)}
          </text>
        `).join("")}

        <!-- Bottom Motto: TNI KUAT, INDONESIA HEBAT -->
        <text x="${W / 2}" y="${1740 + quoteLines.length * 34 + 50}" font-family="'Montserrat', 'Arial Black', sans-serif" font-size="19" font-weight="900" letter-spacing="6" fill="#FFFFFF" text-anchor="middle">
          ${motto}
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

