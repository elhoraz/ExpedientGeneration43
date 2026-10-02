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
        headline: "DIRGAHAYU TENTARA NASIONAL INDONESIA",
        subheadline: "TNI PRIMA · TNI RAKYAT · INDONESIA MAJU",
        quoteOrBody: "Dengan Semangat Prima, Kita Wujudkan TNI Rakyat untuk Indonesia Maju dan Sejahtera. TNI Kuat, Indonesia Hebat.",
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

/**
 * Mengaplikasikan Tipografi Estetis Khas Pinterest secara Otomatis (Format 9:16 Instagram Story)
 * Menggunakan Sharp & Vector SVG Overlay beresolusi tinggi (Anti-Typo & Anti-Gibberish)
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

    const margin = 55;
    const innerW = W - margin * 2;
    const innerH = H - margin * 2;
    const accentColor = blueprint.colorPalette[1]?.hex || "#F59E0B";

    const tagTop = escapeXml("EXPEDIENT ARCHIVE");
    const editionStr = escapeXml("SPECIAL COMMEMORATIVE EDITION · VOL. 43");
    const headline = escapeXml(blueprint.copywriting.headline || "DIRGAHAYU");
    const subheadline = escapeXml(blueprint.copywriting.subheadline || blueprint.title || "EXPEDIENT 43");
    const rawQuote = blueprint.copywriting.quoteOrBody || "";
    const dateStr = escapeXml("05 OKTOBER 2026");

    // Dynamic Sizing
    const hSize = headline.length > 20 ? 26 : 34;
    const hTracking = headline.length > 15 ? 8 : 12;

    // Subheadline multi-line wrapping (max 2 lines)
    const subLines = wrapSvgText(subheadline, 22).slice(0, 2);
    const subSize = subLines.length > 1 ? 38 : 46;

    // Quote multi-line wrapping (max 2 lines)
    const quoteLines = rawQuote ? wrapSvgText(rawQuote, 42).slice(0, 2) : [];

    const svg = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.88" />
          <stop offset="35%" stop-color="#000000" stop-opacity="0.6" />
          <stop offset="70%" stop-color="#000000" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="bottomScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0" />
          <stop offset="30%" stop-color="#000000" stop-opacity="0.4" />
          <stop offset="70%" stop-color="#000000" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.96" />
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.95" />
        </filter>
      </defs>

      <!-- Scrim Gradients untuk Keterbacaan Kontras Tinggi -->
      <rect x="0" y="0" width="${W}" height="680" fill="url(#topScrim)" />
      <rect x="0" y="1220" width="${W}" height="700" fill="url(#bottomScrim)" />

      <!-- Pinterest Editorial Minimalist Border Frame -->
      <rect x="${margin}" y="${margin}" width="${innerW}" height="${innerH}" fill="none" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.8" rx="3" />

      <!-- Top Editorial Typography Layout -->
      <g filter="url(#shadow)">
        <!-- Minimalist Pill Badge -->
        <rect x="${W / 2 - 135}" y="${margin + 36}" width="270" height="34" rx="17" fill="#000000" fill-opacity="0.5" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1" />
        <text x="${W / 2}" y="${margin + 58}" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="4" fill="#F8FAFC" text-anchor="middle">
          ${tagTop}
        </text>

        <!-- Subtitle Tag -->
        <text x="${W / 2}" y="${margin + 105}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" letter-spacing="3" fill="${accentColor}" text-anchor="middle">
          ${editionStr}
        </text>

        <line x1="${margin + 70}" y1="${margin + 128}" x2="${W - margin - 70}" y2="${margin + 128}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1" />

        <!-- Main Headline (Editorial Serif Pinterest Style) -->
        <text x="${W / 2}" y="${margin + 195}" font-family="'Playfair Display', 'Bodoni MT', 'Didot', 'Georgia', serif" font-size="${hSize}" font-weight="400" letter-spacing="${hTracking}" fill="#FFFFFF" text-anchor="middle">
          ${headline}
        </text>

        <!-- Subheadline (Bold Modern Sans Pinterest Style) -->
        ${subLines.map((line, idx) => `
          <text x="${W / 2}" y="${margin + 265 + idx * (subSize + 8)}" font-family="'Montserrat', 'Arial Black', Impact, sans-serif" font-size="${subSize}" font-weight="900" letter-spacing="4" fill="#F8FAFC" text-anchor="middle">
            ${escapeXml(line)}
          </text>
        `).join("")}

        <!-- Aesthetic Accent Divider & Dots -->
        <circle cx="${W / 2 - 35}" cy="${margin + 285 + (subLines.length - 1) * (subSize + 8)}" r="2.5" fill="${accentColor}" />
        <line x1="${W / 2 - 20}" y1="${margin + 285 + (subLines.length - 1) * (subSize + 8)}" x2="${W / 2 + 20}" y2="${margin + 285 + (subLines.length - 1) * (subSize + 8)}" stroke="${accentColor}" stroke-width="2" />
        <circle cx="${W / 2 + 35}" cy="${margin + 285 + (subLines.length - 1) * (subSize + 8)}" r="2.5" fill="${accentColor}" />
      </g>

      <!-- Bottom Editorial Quote & Metadata -->
      <g filter="url(#shadow)">
        <line x1="${margin + 60}" y1="${H - margin - 210}" x2="${W - margin - 60}" y2="${H - margin - 210}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1" />
        <text x="${margin + 42}" y="${H - margin - 205}" font-family="monospace" font-size="14" fill="${accentColor}">+</text>
        <text x="${W - margin - 52}" y="${H - margin - 205}" font-family="monospace" font-size="14" fill="${accentColor}">+</text>

        <!-- Quote Lines -->
        ${quoteLines.map((qLine, qIdx) => `
          <text x="${W / 2}" y="${H - margin - 150 + qIdx * 30}" font-family="'Playfair Display', 'Georgia', serif" font-style="italic" font-size="20" font-weight="400" fill="#F1F5F9" text-anchor="middle">
            ${qIdx === 0 && quoteLines.length === 1 ? `“${escapeXml(qLine)}”` : qIdx === 0 ? `“${escapeXml(qLine)}` : `${escapeXml(qLine)}”`}
          </text>
        `).join("")}

        <!-- Date -->
        <text x="${W / 2}" y="${H - margin - 75}" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" letter-spacing="4" fill="#E2E8F0" text-anchor="middle">
          ${dateStr}
        </text>

        <!-- Signature Tag -->
        <text x="${W / 2}" y="${H - margin - 35}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="${accentColor}" text-anchor="middle">
          EXPEDIENT GENERATION 43 · OFFICIAL STUDIO
        </text>
      </g>
    </svg>
    `;

    return await sharp(bg)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 95 })
      .toBuffer();
  } catch (_) {
    return imageBuffer;
  }
}

