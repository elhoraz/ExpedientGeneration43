/**
 * src/lib/whatsapp/designPromptArchitect.ts
 * AI Creative Art Director & Masterpiece Prompt Architect
 * 
 * Khusus Format Instagram Story (9:16) & Clean Visual (Anti-Gibberish).
 * Mengubah setiap permintaan pengguna menjadi visual sinematik tanpa teks cacat,
 * dilengkapi Kit Tipografi & Copywriting siap pakai untuk Instagram Story.
 */

import { callGeminiResilient } from "../geminiResilient";

export interface ArtDirectionBlueprint {
  title: string;
  category: string;
  enhancedPrompt: string;
  theme: string;
  layoutStyle?: "cinematic_minimal" | "modern_editorial" | "bottom_card" | "clean_art" | "magazine_cover";
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
 * AI Cognitive Architect: Merancang prompt FLUX & copywriting poster secara dinamis
 * sesuai keinginan bebas pengguna di Grup Desain menggunakan Google Gemini
 */
export async function architectDynamicDesignWithAI(rawUserPrompt: string): Promise<ArtDirectionBlueprint> {
  const fallbackBlueprint = architectMasterpieceDesign(rawUserPrompt);
  const clean = rawUserPrompt.trim();
  const lower = clean.toLowerCase();

  // Hanya gunakan preset kaku jika pengguna SANGAT SINGKAT (< 3 kata) dan persis menyebut hari besar resmi
  const isExactShortHoliday =
    clean.split(/\s+/).length <= 3 &&
    !lower.includes("dengan") &&
    !lower.includes("latar") &&
    !lower.includes("tema") &&
    !lower.includes("gaya") &&
    !lower.includes("suasana") &&
    (
      lower === "hut tni" ||
      lower === "poster tni" ||
      lower === "hari santri" ||
      lower === "poster hari santri" ||
      lower === "kesaktian pancasila" ||
      lower === "g30s pki"
    );

  if (isExactShortHoliday) {
    return fallbackBlueprint;
  }

  // Untuk SEMUA permintaan bebas/kustom anggota grup desain:
  // Gunakan Gemini Cognitive Architect untuk merancang prompt visual FLUX & teks poster secara dinamis
  try {
    const prompt = `
You are the Chief Art Director & Visual Prompt Architect for an elite Indonesian Creative Design Studio WhatsApp Bot.
A designer in our creative WhatsApp group asked for an image or poster with the following request: "${clean}".

Analyze their request and return ONLY a valid JSON object (no markdown, no backticks) with the following structure:
{
  "title": "Short descriptive project title in Indonesian",
  "category": "general" | "islamic" | "sports" | "milad" | "reunion",
  "theme": "Visual aesthetic style description in English (e.g. Cinematic warm ambient cafe, high octane sports, etc)",
  "layoutStyle": "cinematic_minimal" | "modern_editorial" | "bottom_card" | "clean_art" | "magazine_cover",
  "accentColor": "Hex color code (#RRGGBB) that fits the mood",
  "tagText": "SHORT UPPERCASE CATEGORY TAG (Max 4 words)",
  "headline": "IMPACTFUL UPPERCASE HEADLINE (1-3 words)",
  "subheadline": "CONTEXTUAL SUBHEADLINE (Uppercase)",
  "quoteOrBody": "Inspiring quote or slogan in Indonesian that matches the user's topic (1-2 sentences)",
  "enhancedPrompt": "Extremely detailed, professional English prompt for FLUX.1 diffusion model. Must describe the exact subject, environment, lighting, angle, mood, 9:16 vertical composition, 8k resolution, photorealistic or digital art as requested. Clean background composition, absolutely no text, no words, no letters, no gibberish, no watermark, no logo."
}

Layout selection guidelines:
- "clean_art": If user asks for pure image, wallpaper, scenery, painting, or specifically asks "tanpa teks" or "gambar saja".
- "cinematic_minimal": Movie poster style, visual art is 90% unblocked with majestic film title at the bottom. Best for dramatic, sacred, portraits, spiritual, and cinematic scenes.
- "modern_editorial": Asymmetrical left-aligned Swiss typography with issue numbers. Best for fashion, architecture, modern art, and quotes.
- "bottom_card": Clean upper scene with an elegant frosted glass card at bottom third. Best for events, invitations, and celebrations.
- "magazine_cover": Classic luxury Pinterest editorial cover with top masthead and bottom quote box.
`.trim();

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    };

    const res = await callGeminiResilient(body, "", "gemini-3.5-flash");
    const jsonText = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (jsonText) {
      const parsed = JSON.parse(jsonText.replace(/^```json\s*|\s*```$/g, "").trim());
      if (parsed.enhancedPrompt && parsed.headline) {
        return {
          title: parsed.title || clean,
          category: parsed.category || "general",
          theme: parsed.theme || "Modern Creative Studio Aesthetic",
          layoutStyle: parsed.layoutStyle || "cinematic_minimal",
          colorPalette: [
            { hex: parsed.accentColor || "#FBBF24", name: "Dynamic Accent" },
            { hex: "#0F172A", name: "Deep Obsidian" },
            { hex: "#F8FAFC", name: "Pure Light" },
          ],
          typography: {
            primaryFont: "Bold Monumental Editorial Serif",
            secondaryFont: "Geometric Clean Sans",
            recommendedLayout: `Format 9:16: Gaya ${parsed.layoutStyle || "cinematic_minimal"}`,
          },
          copywriting: {
            headline: parsed.headline,
            subheadline: parsed.subheadline || "EXPEDIENT CREATIVE ARCHIVE",
            quoteOrBody: parsed.quoteOrBody,
          },
          enhancedPrompt: parsed.enhancedPrompt,
        };
      }
    }
  } catch (err: any) {
    console.warn("[DYNAMIC-PROMPT-ARCHITECT-FALLBACK]:", err.message);
  }

  return fallbackBlueprint;
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

  // 2. KATEGORI B1: PERINGATAN MAULID NABI MUHAMMAD SAW
  if (
    lower.includes("maulid") ||
    lower.includes("mawlid") ||
    lower.includes("kelahiran nabi") ||
    lower.includes("rasulullah") ||
    lower.includes("maulidur")
  ) {
    return {
      title: "Peringatan Maulid Nabi Muhammad SAW",
      category: "maulid",
      theme: "Sacred Madinah Nabawi Architecture, Celestial Emerald & Gold, Serene Lantern Twilight",
      colorPalette: [
        { hex: "#064E3B", name: "Sacred Emerald Green" },
        { hex: "#D97706", name: "Warm Gold Arabesque" },
        { hex: "#022C22", name: "Deep Nocturnal Forest" },
        { hex: "#FEF3C7", name: "Luminous Lantern Amber" },
        { hex: "#FFFFFF", name: "Pure White Light" },
      ],
      typography: {
        primaryFont: "Sacred Calligraphic Modern Serif",
        secondaryFont: "Refined Geometric Monospace",
        recommendedLayout: "Format Instagram Story 9:16: Kubah Hijau Nabawi Bercahaya Lembut di Senja Madinah, Lentera Emas Arabesque Mengambang, Cahaya Rembulan",
      },
      copywriting: {
        headline: "MAULID NABI",
        subheadline: "MUHAMMAD SAW · 1448 H",
        quoteOrBody: "Meneladani akhlak agung Baginda Rasulullah SAW sebagai rahmat bagi semesta alam (Rahmatan lil 'Alamin).",
      },
      enhancedPrompt:
        "Cinematic vertical 9:16 Instagram Story photograph. " +
        "Breathtaking view of the Prophet Mosque Al-Masjid an-Nabawi in Madinah with its iconic green dome and illuminated elegant minarets at blue hour twilight. " +
        "Soft warm glowing hanging Arabic gold lantern bokeh lights, gentle crescent moon shining in serene night sky. " +
        "Sublime sacred spiritual atmosphere, volumetric atmospheric lighting, Octane render 3D, 8k resolution, extreme photorealism, " +
        "clean visual photography, absolutely no text, no words, no letters, no gibberish, no watermark, no logo.",
    };
  }

  // 2. KATEGORI B2: BULAN SUCI RAMADHAN & PUASA
  if (
    lower.includes("ramadan") ||
    lower.includes("ramadhan") ||
    lower.includes("puasa") ||
    lower.includes("tarawih") ||
    lower.includes("sahur") ||
    lower.includes("buka puasa")
  ) {
    return {
      title: "Peringatan Bulan Suci Ramadhan",
      category: "ramadan",
      theme: "Serene Midnight Ramadan Lanterns, Golden Crescent Moon & Starry Sky",
      colorPalette: [
        { hex: "#0F172A", name: "Midnight Navy" },
        { hex: "#F59E0B", name: "Glowing Amber" },
        { hex: "#10B981", name: "Islamic Emerald" },
        { hex: "#FFFBEB", name: "Warm Cream" },
      ],
      typography: {
        primaryFont: "Classical Arabian Modern Serif",
        secondaryFont: "Clean Geometric Sans",
        recommendedLayout: "Format 9:16: Lentera Fanous Ramadhan Menyala Emas, Siluet Kubah Masjid di Bawah Langit Berbintang",
      },
      copywriting: {
        headline: "MARHABAN YA RAMADHAN",
        subheadline: "BULAN SUCI PENUH BERKAH & AMPUNAN",
        quoteOrBody: "Sucikan hati, kuatkan iman, dan lipatgandakan amal ibadah menjemput keberkahan tak terhingga.",
      },
      enhancedPrompt:
        "Cinematic vertical 9:16 Instagram Story photograph. " +
        "Intricate brass Islamic Ramadan Fanous lantern glowing with warm golden flame on ancient Arabian stone balcony, " +
        "majestic grand mosque silhouette against twilight starry desert sky with radiant crescent moon. " +
        "Magical volumetric light rays, 8k resolution, photorealistic, no text, no words, no letters, no watermark.",
    };
  }

  // 2. KATEGORI B3: HARI RAYA IDUL FITRI & IDUL ADHA
  if (
    lower.includes("idul fitri") ||
    lower.includes("lebaran") ||
    lower.includes("syawal") ||
    lower.includes("idul adha") ||
    lower.includes("qurban")
  ) {
    const isAdha = lower.includes("adha") || lower.includes("qurban");
    return {
      title: isAdha ? "Selamat Hari Raya Idul Adha" : "Selamat Hari Raya Idul Fitri",
      category: isAdha ? "eid_adha" : "eid",
      theme: "Festive Sacred Celebration, Regal Islamic Patterns & Warm Daylight Glow",
      colorPalette: [
        { hex: "#047857", name: "Royal Oasis Green" },
        { hex: "#D97706", name: "Festival Gold" },
        { hex: "#F8FAFC", name: "Purity White" },
      ],
      typography: {
        primaryFont: "Majestic Festive Serif",
        secondaryFont: "Warm Elegant Sans",
        recommendedLayout: "Format 9:16: Kemegahan Masjid Raya Pagi Hari Raya, Daun Ketupat Estetis & Cahaya Emas Terbit",
      },
      copywriting: {
        headline: isAdha ? "SELAMAT IDUL ADHA" : "SELAMAT IDUL FITRI",
        subheadline: isAdha ? "HARI RAYA QURBAN 1448 H" : "1 SYAWAL 1448 H · MOHON MAAF LAHIR BATIN",
        quoteOrBody: isAdha
          ? "Merajut keikhlasan, meneladani ketakwaan Nabi Ibrahim AS dalam berkorban demi ridha Allah SWT."
          : "Taqabbalallahu minna wa minkum. Semoga hati kembali fitrah dalam kesucian dan keberkahan ukhuwah.",
      },
      enhancedPrompt:
        "Cinematic vertical 9:16 Instagram Story photograph. " +
        "Grand illuminated Indonesian modern mosque courtyard at peaceful sunrise morning of Eid prayer, " +
        "golden sunlight rays streaming through arches, pristine white marble floor reflecting blue sky, festive clean atmosphere. " +
        "8k resolution, extreme photorealism, no text, no words, no letters, no watermark.",
    };
  }

  // 2. KATEGORI B4: HARI SANTRI NASIONAL & KEHIDUPAN PESANTREN
  if (
    lower.includes("santri") ||
    lower.includes("hsn") ||
    lower.includes("pesantren") ||
    lower.includes("ngaji") ||
    lower.includes("kitab") ||
    lower.includes("islami") ||
    lower.includes("hijriyah")
  ) {
    return {
      title: "Peringatan Hari Santri Nasional / Agenda Keislaman",
      category: "santri",
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
  out += `✨ *Konsep/Tema:* ${blueprint.theme}\n`;
  if (blueprint.layoutStyle) {
    const layoutNames: Record<string, string> = {
      cinematic_minimal: "Cinematic Film Poster (Visual 90% Leluasa)",
      modern_editorial: "Modern Swiss Editorial (Asimetris Elegan)",
      bottom_card: "Floating Frosted Glass Story Card",
      clean_art: "Clean Visual Art (Pure Artwork Hero)",
      magazine_cover: "Pinterest Editorial Magazine Cover",
    };
    out += `📐 *Gaya Layout:* ${layoutNames[blueprint.layoutStyle] || blueprint.layoutStyle}\n`;
  }
  out += `\n`;

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

    if (category === "maulid") {
      accentColor = "#10B981"; // Emerald green
      tagText = "MAULID NABI MUHAMMAD SAW · 1448 H";
    } else if (category === "ramadan") {
      accentColor = "#F59E0B"; // Warm amber
      tagText = "MARHABAN YA RAMADHAN · BULAN SUCI";
    } else if (category === "eid" || category === "eid_adha") {
      accentColor = "#34D399"; // Luminous emerald
      tagText = category === "eid_adha" ? "HARI RAYA IDUL ADHA · 1448 H" : "HARI RAYA IDUL FITRI · 1448 H";
    } else if (category === "santri" || category === "islamic") {
      accentColor = "#10B981"; // Emerald
      tagText = "HARI SANTRI NASIONAL · EXPEDIENT 43";
    } else if (category === "milad") {
      accentColor = "#D4AF37"; // Champagne gold
      tagText = "TASYAKURAN MILAD & ULANG TAHUN ALUMNI";
    } else if (category === "military") {
      accentColor = "#F59E0B"; // Gold
      tagText = "DIRGAHAYU REPUBLIK INDONESIA";
    } else if (category === "reunion") {
      accentColor = "#FB923C"; // Warm sunset
      tagText = "TEMU KANGEN & REUNI AKBAR · 43";
    } else if (category === "sport" || category === "sports") {
      accentColor = "#38BDF8"; // Electric cyan
      tagText = "EXPEDIENT ATHLETICS · 2026";
    }

    const rawHeadline = (blueprint.copywriting.headline || blueprint.title || "EXPEDIENT").trim();
    const headline = escapeXml(rawHeadline.toUpperCase());

    const subheadline = escapeXml(
      (blueprint.copywriting.subheadline || "CREATIVE ARCHIVE").toUpperCase()
    );

    const quote =
      blueprint.copywriting.quoteOrBody ||
      "Merajut kebersamaan, melangkah pasti menjemput masa depan gemilang.";
    const quoteLines = wrapSvgText(quote, 48);

    const layout = blueprint.layoutStyle || "cinematic_minimal";
    let svg = "";

    // STYLE 1: CINEMATIC MINIMAL (Poster Film Layar Lebar - Visual 90% Bersih & Leluasa)
    if (layout === "cinematic_minimal") {
      svg = `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cineScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0" />
            <stop offset="45%" stop-color="#020617" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
          </linearGradient>
          <filter id="cineShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.9" />
          </filter>
        </defs>
        <rect x="0" y="1150" width="${W}" height="770" fill="url(#cineScrim)" />
        
        <g filter="url(#cineShadow)">
          <text x="${W / 2}" y="1560" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="8" fill="${accentColor}" text-anchor="middle">
            — ${escapeXml(tagText)} —
          </text>
          <text x="${W / 2}" y="1650" font-family="'Georgia', serif" font-size="${headline.length > 20 ? 46 : 60}" font-weight="700" letter-spacing="8" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 80}" y1="1690" x2="${W / 2 + 80}" y2="1690" stroke="${accentColor}" stroke-width="2" opacity="0.85" />
          <text x="${W / 2}" y="1740" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" letter-spacing="4" fill="#CBD5E1" text-anchor="middle">
            ${subheadline}
          </text>
          <text x="${W / 2}" y="1830" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" letter-spacing="5" fill="#64748B" text-anchor="middle">
            EXPEDIENT CREATIVE AI STUDIO · 2026
          </text>
        </g>
      </svg>`;
    } else if (layout === "modern_editorial") {
      // STYLE 2: MODERN EDITORIAL (Swiss Asymmetric / Kinfolk & Vogue Layout)
      svg = `
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
          <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" letter-spacing="6" fill="${accentColor}">
            EDITION NO. 43
          </text>
          <line x1="0" y1="20" x2="60" y2="20" stroke="${accentColor}" stroke-width="3" />
          
          <text x="0" y="110" font-family="'Helvetica Neue', Arial, sans-serif" font-size="64" font-weight="900" letter-spacing="2" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="0" y="165" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" letter-spacing="4" fill="#94A3B8">
            ${subheadline}
          </text>
        </g>

        <g transform="translate(100, 1650)">
          <rect x="0" y="0" width="4" height="80" fill="${accentColor}" />
          ${quoteLines.slice(0, 2).map((l, i) => `<text x="24" y="${28 + i * 28}" font-family="'Georgia', serif" font-style="italic" font-size="20" fill="#F1F5F9">${escapeXml(l)}</text>`).join("")}
          <text x="24" y="95" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#64748B">
            EXPEDIENT ARCHIVE · 2026
          </text>
        </g>
      </svg>`;
    } else if (layout === "bottom_card") {
      // STYLE 3: BOTTOM GLASSMORPHIC CARD (Floating Glass Card at Bottom)
      svg = `
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
          
          <rect x="45" y="45" width="220" height="34" rx="17" fill="${accentColor}" fill-opacity="0.15" stroke="${accentColor}" stroke-width="1" />
          <text x="155" y="67" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="${accentColor}" text-anchor="middle">
            ${tagText.slice(0, 22)}
          </text>

          <text x="45" y="135" font-family="'Georgia', serif" font-size="44" font-weight="700" letter-spacing="3" fill="#FFFFFF">
            ${headline}
          </text>
          <text x="45" y="175" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" letter-spacing="3" fill="#94A3B8">
            ${subheadline}
          </text>

          <line x1="45" y1="210" x2="895" y2="210" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />

          ${quoteLines.slice(0, 3).map((l, i) => `<text x="45" y="${260 + i * 32}" font-family="'Georgia', serif" font-style="italic" font-size="20" fill="#E2E8F0">${escapeXml(l)}</text>`).join("")}

          <text x="895" y="380" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="${accentColor}" text-anchor="end">
            EXPEDIENT GENERATION 43
          </text>
        </g>
      </svg>`;
    } else if (layout === "clean_art") {
      // STYLE 4: CLEAN ART (Pure Visual Art Hero - Minimalist corner mark)
      svg = `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="subtleBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.65" />
          </linearGradient>
        </defs>
        <rect x="0" y="1780" width="${W}" height="140" fill="url(#subtleBottom)" />
        
        <text x="60" y="1860" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" letter-spacing="5" fill="#FFFFFF" opacity="0.8">
          ${headline}
        </text>
        <text x="1020" y="1860" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="${accentColor}" text-anchor="end" opacity="0.9">
          EXPEDIENT 43
        </text>
      </svg>`;
    } else {
      // STYLE 5: MAGAZINE COVER (Classic Pinterest Editorial Cover)
      svg = `
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
          <filter id="crispShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="0.85" />
          </filter>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.65" />
          </filter>
        </defs>

        <rect x="0" y="0" width="${W}" height="620" fill="url(#topScrim)" />
        <rect x="0" y="1220" width="${W}" height="700" fill="url(#bottomScrim)" />

        <g filter="url(#crispShadow)">
          <text x="${W / 2}" y="140" font-family="'Segoe UI', -apple-system, Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="6" fill="${accentColor}" text-anchor="middle">
            — ${escapeXml(tagText)} —
          </text>
          <text x="${W / 2}" y="235" font-family="'Georgia', 'Times New Roman', serif" font-size="${headline.length > 25 ? 46 : 58}" font-weight="700" letter-spacing="6" fill="#FFFFFF" text-anchor="middle">
            ${headline}
          </text>
          <line x1="${W / 2 - 70}" y1="272" x2="${W / 2 + 70}" y2="272" stroke="${accentColor}" stroke-width="2" opacity="0.85" />
          <text x="${W / 2}" y="312" font-family="'Segoe UI', -apple-system, Roboto, sans-serif" font-size="17" font-weight="600" letter-spacing="4" fill="#E2E8F0" text-anchor="middle">
            ${subheadline}
          </text>
        </g>

        <g transform="translate(80, ${1580 - Math.max(0, (quoteLines.length - 2) * 30)})" filter="url(#cardShadow)">
          <rect x="0" y="0" width="920" height="${190 + Math.max(0, (quoteLines.length - 2) * 30)}" rx="18" fill="#0A0F1D" fill-opacity="0.68" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1.2" />
          ${quoteLines
            .map((line, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === quoteLines.length - 1;
              const cleanLine = line.replace(/^[“"']|[”"']$/g, "").trim();
              const textWithQuotes = `${isFirst ? "“" : ""}${cleanLine}${isLast ? "”" : ""}`;
              return `<text x="460" y="${64 + idx * 34}" font-family="'Georgia', serif" font-style="italic" font-size="21" font-weight="400" fill="#F8FAFC" text-anchor="middle">
                ${escapeXml(textWithQuotes)}
              </text>`;
            })
            .join("")}
          <line x1="40" y1="${135 + Math.max(0, (quoteLines.length - 2) * 30)}" x2="880" y2="${135 + Math.max(0, (quoteLines.length - 2) * 30)}" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
          <text x="50" y="${164 + Math.max(0, (quoteLines.length - 2) * 30)}" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" letter-spacing="3" fill="#94A3B8">
            2026 · EXPEDIENT ARCHIVE
          </text>
          <text x="870" y="${164 + Math.max(0, (quoteLines.length - 2) * 30)}" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="${accentColor}" text-anchor="end">
            EXPEDIENT 43
          </text>
        </g>
      </svg>`;
    }

    return await sharp(bg)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 96 })
      .toBuffer();
  } catch (_) {
    return imageBuffer;
  }
}


