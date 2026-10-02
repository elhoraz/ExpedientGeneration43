/**
 * src/lib/whatsapp/designPromptArchitect.ts
 * AI Creative Art Director & Masterpiece Prompt Architect
 * 
 * Mengubah prompt atau permintaan pengguna yang sederhana menjadi konsep desain grafis
 * profesional tingkat studio (setara Behance / Dribbble / Midjourney / FLUX.1 Pro)
 * lengkap dengan arsitektur visual, tipografi, tata cahaya volumetrik, dan palet warna.
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
    feedUrl: string;
    storyUrl: string;
  };
}

/**
 * Menganalisis teks permintaan pengguna dan menghasilkan Blueprint Desain Grafis Mahakarya
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
      title: "Hari Ulang Tahun Tentara Nasional Indonesia (HUT TNI)",
      category: "military",
      theme: "Heroic Modern Tactical, Tri-Matra Forces, Golden Hour Cinematic Lighting, 3D Typography",
      colorPalette: [
        { hex: "#0F172A", name: "Midnight Navy Sky" },
        { hex: "#DC2626", name: "Patriot Red Ribbon" },
        { hex: "#F8FAFC", name: "Pure Textured White" },
        { hex: "#D97706", name: "Imperial Gold Emblem" },
        { hex: "#334155", name: "Charcoal Tactical Camo" },
      ],
      typography: {
        primaryFont: "Bold Textured Block Sans-Serif (TNI PRIMA Style)",
        secondaryFont: "Geometric Tracked Modern Serif",
        recommendedLayout: "Golden Tri-Matra Crest at Top, Giant 3D Ribbon Numeral, Over-the-shoulder Soldiers View, Coastal Twilight",
      },
      copywriting: {
        headline: "DIRGAHAYU TENTARA NASIONAL INDONESIA",
        subheadline: "TNI PRIMA · TNI RAKYAT · INDONESIA MAJU",
        quoteOrBody: "Dengan Semangat Prima, Kita Wujudkan TNI Rakyat untuk Indonesia Maju dan Sejahtera. TNI Kuat, Indonesia Hebat.",
      },
      officialCdnAsset: {
        feedUrl: "https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hut_tni_feed.jpg",
        storyUrl: "https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hut_tni_story.jpg",
      },
      enhancedPrompt:
        "Official ultra-premium commemorative graphic design poster for Indonesian Armed Forces Day (HUT TNI 5 Oktober). " +
        "Vertical 9:16 layout. At the top center, official golden Tri-Matra TNI crest with anchor, wings, and star, " +
        "followed by clean tracked typography 'DIRGAHAYU TENTARA NASIONAL INDONESIA 5 OKTOBER 1945 - 2026'. " +
        "In the center, giant bold 3D red-and-white ribbon wrapping over dynamic numerals, giant textured white block letters 'TNI', " +
        "and subtext 'TNI PRIMA · TNI RAKYAT · INDONESIA MAJU'. " +
        "Foreground features modern Indonesian soldiers in full combat gear viewed from behind looking out over the majestic coastal archipelago at golden sunset. " +
        "Fluttering Indonesian national red and white flag on the left, three supersonic Sukhoi fighter jets soaring with smoke trails on the right, " +
        "naval frigate battleship on the sea, and army combat tank. " +
        "Volumetric rim lighting, Octane render 3D masterpiece, 8k resolution, award-winning Behance graphic design, photorealistic.",
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
      theme: "Majestic Islamic Architecture, Royal Emerald & Gold, Intricate Calligraphy, Serene Twilight Glow",
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
        recommendedLayout: "Islamic Star Emblem at Top, Grand Illuminated Mosque Domes in Background, Santri Row in Foreground",
      },
      copywriting: {
        headline: "PERINGATAN HARI SANTRI NASIONAL",
        subheadline: "JIHAD SANTRI JAYAKAN NEGERI",
        quoteOrBody: "Menyambung Juang, Merengkuh Masa Depan: Dari Pesantren untuk Kemajuan Indonesia dan Peradaban Dunia.",
      },
      officialCdnAsset: {
        feedUrl: "https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hari_santri_feed.jpg",
        storyUrl: "https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hari_santri_story.jpg",
      },
      enhancedPrompt:
        "Ultra-high resolution official commemorative graphic design poster for Indonesian National Santri Day (Hari Santri Nasional). " +
        "At the top center, elegant golden Islamic emblem and crescent, followed by clean spaced typography 'PERINGATAN HARI SANTRI NASIONAL 22 OKTOBER 2026'. " +
        "In the center, giant bold 3D stylized emerald green and gold typography 'HARI SANTRI' with intricate Islamic geometric calligraphy patterns and ribbon. " +
        "Indonesian Santri youths standing proud wearing pristine white baju koko, dark green batik sarong, and black songkok peci. " +
        "Background features a magnificent grand illuminated Indonesian Islamic pesantren mosque with grand domes glowing in twilight blue hour sky, " +
        "warm golden lantern bokeh lights, crescent moon, and fluttering Indonesian national red and white flag. " +
        "Bottom typography 'JIHAD SANTRI JAYAKAN NEGERI - DARI PESANTREN UNTUK INDONESIA', Octane render 3D, volumetric lighting, 8k resolution, award-winning Behance poster design.",
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
        recommendedLayout: "Gold Hexagonal Frame, Portrait Profile in Center, Floating Gold Foil Confetti, Formal Congratulatory Banner",
      },
      copywriting: {
        headline: "BARAKALLAH FII UMRIK",
        subheadline: "SELAMAT MILAD SAHABAT EXPEDIENT 43",
        quoteOrBody: "Semoga bertambahnya usia senantiasa membawa keberkahan, kemuliaan ilmu, kelapangan rezeki, dan kesuksesan dunia akhirat.",
      },
      enhancedPrompt:
        `Masterpiece luxury congratulatory birthday poster for Indonesian alumni '${clean}', ` +
        "dark obsidian marble background with floating golden dust bokeh particles, geometric gold foil borders, " +
        "elegant typography 'BARAKALLAH FII UMRIK' in high-end metallic gold serif font, " +
        "subtle Islamic geometric ornaments, warm studio softbox lighting, 8k resolution, award-winning luxury branding aesthetic, ultra-clean layout.",
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
      theme: "High-Energy Dynamic Sports, Cyber Neon Lighting, Motion Blur & Impact Textures",
      colorPalette: [
        { hex: "#0A0A0A", name: "Pitch Black Stadium" },
        { hex: "#2563EB", name: "Electric Cyan Blue" },
        { hex: "#E11D48", name: "Laser Crimson" },
        { hex: "#FACC15", name: "Championship Gold" },
      ],
      typography: {
        primaryFont: "Aggressive Slanted Condensed Display (Bebas Neue / Druk Bold)",
        secondaryFont: "High-Tech Monospace Subtitle",
        recommendedLayout: "Center Hero Action Player, Exploding Particle Smoke, High-Contrast Stadium Floodlights, Bold Angled Match Title",
      },
      copywriting: {
        headline: "EXPEDIENT CHAMPIONSHIP CUP",
        subheadline: "JUNJUNG SPORTIVITAS · TUNTUT JUARA",
        quoteOrBody: "Buktikan ketangguhan fisik dan kekompakan strategi di lapangan hijau. Satu Tekad, Satu Solidaritas!",
      },
      enhancedPrompt:
        `High-energy action sports tournament poster for '${clean}', dynamic athlete in explosive motion kicking a ball, ` +
        "dramatic stadium arena floodlights, volumetric haze and shattered glowing neon particles, " +
        "bold aggressive slanted typography, intense rim lighting, high-contrast dark aesthetic, 8k resolution, Nike / Adidas commercial poster standard.",
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
      theme: "Cinematic Warm Nostalgia, Golden Hour Skyline, Elegant Cohort Monogram, Timeless Heritage",
      colorPalette: [
        { hex: "#1E293B", name: "Deep Slate Blue" },
        { hex: "#D97706", name: "Warm Sunset Amber" },
        { hex: "#F59E0B", name: "Golden Glow" },
        { hex: "#F8FAFC", name: "Pure Cloud White" },
      ],
      typography: {
        primaryFont: "Timeless Heritage Serif (Playfair Display / Georgia)",
        secondaryFont: "Refined Modern Sans",
        recommendedLayout: "Official Expedient 43 Golden Crest, Group Silhouette under Warm Sunset, Clean Event Schedule Block",
      },
      copywriting: {
        headline: "TEMU KANGEN & REUNI AKBAR",
        subheadline: "MERAWAT PERSAHABATAN, MENATAP MASA DEPAN",
        quoteOrBody: "Waktu boleh terus berlalu, langkah kaki boleh merantau jauh, namun ikatan ukhuwah kita di Arrisalah akan abadi selamanya.",
      },
      enhancedPrompt:
        `Heartwarming cinematic graphic poster for high school alumni reunion '${clean}', ` +
        "silhouette of alumni friends standing together on a hill overlooking city skyline at golden hour sunset, " +
        "warm amber sun rays, nostalgic cinematic color grade, golden Expedient 43 crest emblem at the top, " +
        "clean elegant typography 'TEMU AKBAR ALUMNI', award-winning design, 8k resolution.",
    };
  }

  // 6. DEFAULT / GENERAL: DESAIN GRAFIS PROFESIONAL TINGGI (BEHANCE / DRIBBBLE LEVEL)
  return {
    title: `Desain Grafis Profesional: ${clean.slice(0, 30)}`,
    category: "general",
    theme: "Modern Swiss Graphic Layout, Octane 3D Elements, Balanced Negative Space, Studio Lighting",
    colorPalette: [
      { hex: "#0F172A", name: "Deep Space Slate" },
      { hex: "#3B82F6", name: "Modern Accent Blue" },
      { hex: "#F8FAFC", name: "Clean Negative White" },
      { hex: "#64748B", name: "Balanced Neutral Grey" },
    ],
    typography: {
      primaryFont: "Bold Minimalist Neo-Grotesque Display",
      secondaryFont: "Precision Clean Editorial Sans",
      recommendedLayout: "Asymmetric Balanced Grid, 3D Hero Focal Point, High-Contrast Typography, Subtle Glassmorphism",
    },
    copywriting: {
      headline: clean.toUpperCase(),
      subheadline: "EXPEDIENT CREATIVE DESIGN STUDIO",
      quoteOrBody: "Visual excellence designed to inspire and captivate.",
    },
    enhancedPrompt:
      `Award-winning graphic design poster about '${clean}', ` +
      "ultra-modern minimalist aesthetic, 3D geometric centerpiece with glassmorphism and subtle metallic accents, " +
      "clean asymmetric layout with bold typography, professional studio lighting with soft ambient occlusion, " +
      "trending on Behance and Dribbble, 8k resolution, cinematic color grading, masterpiece graphic design.",
  };
}

/**
 * Format penjelasan blueprint desain ke dalam pesan WhatsApp yang memukau
 */
export function formatBlueprintForWhatsApp(blueprint: ArtDirectionBlueprint): string {
  const paletteStr = blueprint.colorPalette.map((c) => `  • \`${c.hex}\` (${c.name})`).join("\n");

  let out = `🎨 *ART DIRECTION & BLUEPRINT DESAIN MASTERPIECE* 📐\n\n`;
  out += `📌 *Proyek:* ${blueprint.title}\n`;
  out += `✨ *Konsep/Tema:* ${blueprint.theme}\n\n`;

  out += `🎨 *Palet Warna Harmonis:*\n${paletteStr}\n\n`;

  out += `🔤 *Tipografi & Tata Letak:*\n`;
  out += `  • *Font Utama:* ${blueprint.typography.primaryFont}\n`;
  out += `  • *Font Sekunder:* ${blueprint.typography.secondaryFont}\n`;
  out += `  • *Komposisi:* ${blueprint.typography.recommendedLayout}\n\n`;

  out += `📝 *Konsep Teks / Copywriting:*\n`;
  out += `  • *Headline:* "${blueprint.copywriting.headline}"\n`;
  out += `  • *Subheadline:* "${blueprint.copywriting.subheadline}"\n`;
  if (blueprint.copywriting.quoteOrBody) {
    out += `  • *Kutipan:* _"${blueprint.copywriting.quoteOrBody}"_\n`;
  }
  out += `\n`;

  if (blueprint.officialCdnAsset) {
    out += `🖼️ *ASET ULTRA-HD SIAP PAKAI (STUDIO EXPEDIENT):*\n`;
    out += `  • *Story IG (9:16):* ${blueprint.officialCdnAsset.storyUrl}\n`;
    out += `  • *Feed IG (1:1):* ${blueprint.officialCdnAsset.feedUrl}\n\n`;
    out += `_Aset resmi di atas sudah dirender dalam kualitas 8K Octane 3D dan siap diunggah ke media sosial!_ 🚀✨`;
  } else {
    out += `💻 *Prompt Engine (Midjourney / FLUX.1 Pro / DALL-E 3):*\n`;
    out += `\`\`\`${blueprint.enhancedPrompt}\`\`\`\n\n`;
    out += `_Prompt di atas dirancang dengan parameter tata cahaya, komposisi visual, dan estetika resolusi 8K!_ ✨`;
  }

  return out;
}
