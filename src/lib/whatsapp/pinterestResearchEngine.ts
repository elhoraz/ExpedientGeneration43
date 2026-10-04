/**
 * src/lib/whatsapp/pinterestResearchEngine.ts
 * AI Poster Studio — Live Pinterest & Behance Visual & Typography Research Engine
 * 
 * Flow:
 * 1. User requests poster (e.g. "Tahun Baru Islam", "Hari Kartini", "Reuni Akbar")
 * 2. PinterestResearchEngine executes a live visual search on Pinterest/Behance trends
 * 3. Extracts trending color palettes, textures, composition DNA, aesthetic keywords,
 *    and TOP-TIER DESIGNER FONT PAIRINGS (Cinzel Decorative, Cormorant Garamond, Space Grotesk, Plus Jakarta Sans)
 * 4. Enriches the Visual Prompt & Typography Blueprint with genuine Pinterest aesthetics
 * 5. Falls back to curated aesthetic presets if network timeout occurs
 */

import { callGeminiResilient } from "../geminiResilient";

export interface PinterestTypographyDNA {
  trendingFontPairing: string;
  headlineFont: string;
  subheadlineFont: string;
  headlineTracking: number;
  treatment: string;
  microAccents: string;
}

export interface PinterestAestheticDNA {
  theme: string;
  pinterestStyleTitle: string;
  trendingKeywords: string[];
  colorPalette: {
    primary: string[];
    accents: string[];
  };
  compositionDNA: string;
  lightingDNA: string;
  injectedPromptEnrichment: string;
  typographyDNA: PinterestTypographyDNA;
  source: "LIVE_PINTEREST_SEARCH" | "CURATED_PINTEREST_MOODBOARD";
}

// Built-in curated Pinterest fallbacks for instant response if live search is skipped or times out
const CURATED_PINTEREST_FALLBACKS: Record<string, {
  pinterestStyleTitle: string;
  trendingKeywords: string[];
  colorPalette: { primary: string[]; accents: string[] };
  compositionDNA: string;
  lightingDNA: string;
  injectedPromptEnrichment: string;
  typographyDNA: PinterestTypographyDNA;
}> = {
  tahun_baru_islam: {
    pinterestStyleTitle: "Sacred Midnight & Imperial Gold Celestial Islamic Editorial",
    trendingKeywords: ["celestial crescent moon", "midnight lapis lazuli", "imperial gold foil", "modern arabic editorial", "cinzel decorative typography", "1 muharram 1448 H"],
    colorPalette: {
      primary: ["#0A192F", "#D4AF37"],
      accents: ["#059669", "#F8FAFC", "#1E293B"]
    },
    compositionDNA: "Breathtaking grand mosque minarets and illuminated domes under deep midnight indigo sky with glowing golden crescent moon; lower 35% reserved for majestic typography",
    lightingDNA: "Divine soft moonlight volumetric radiance with shimmering celestial star haze and warm gold accents",
    injectedPromptEnrichment: "aesthetic Islamic New Year poster trending on Pinterest, 1 Muharram celestial night sky, glowing golden crescent moon, serene grand mosque minarets bathed in soft divine moonlight, lapis lazuli and warm gold tones, cinematic atmosphere, 8k resolution, Behance featured",
    typographyDNA: {
      trendingFontPairing: "Cinzel Decorative + Plus Jakarta Sans (Sacred Editorial Trend)",
      headlineFont: "'Cinzel Decorative', 'Amiri', 'Playfair Display', serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
      headlineTracking: 6,
      treatment: "Celestial gold foil lettering, generous editorial tracking, hairline dividers",
      microAccents: "✦ ☾ ✦"
    }
  },
  kartini: {
    pinterestStyleTitle: "Boho Chic Editorial & Minimalist Botanical",
    trendingKeywords: ["minimalist botanical", "organic arch frames", "warm terracotta", "delicate jasmine line art", "cormorant garamond editorial"],
    colorPalette: {
      primary: ["#C27D65", "#F5EFE6"],
      accents: ["#8F9E8B", "#DCA052", "#1C1917"]
    },
    compositionDNA: "Asymmetrical portrait of dignified woman framed by organic archways, generous negative space at bottom third",
    lightingDNA: "Soft diffused morning window haze, golden sun flare, subtle paper grain shadow",
    injectedPromptEnrichment: "aesthetic Pinterest poster, Kinfolk editorial magazine, minimalist boho style, warm terracotta and sage green, organic arch framing, delicate melati flowers, subtle batik textures, 8k resolution",
    typographyDNA: {
      trendingFontPairing: "Cormorant Garamond + Plus Jakarta Sans (Vogue/Kinfolk Trend)",
      headlineFont: "'Cormorant Garamond', 'Playfair Display', serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      headlineTracking: 6,
      treatment: "High-fashion masthead layout, frameless floating bottom typography, star accents",
      microAccents: "✦  ✦  ✦"
    }
  },
  hari_ibu: {
    pinterestStyleTitle: "Soft Luxury Rose & Tender Floral Editorial",
    trendingKeywords: ["tender maternal portrait", "blush rose gold", "delicate carnation floral", "kinfolk luxury editorial", "playfair display serif"],
    colorPalette: {
      primary: ["#9F1239", "#E0A96D"],
      accents: ["#FFF1F2", "#1C1917", "#D4AF37"]
    },
    compositionDNA: "Graceful silhouette of Indonesian mother embracing her child with tender love, framed by soft blush botanicals and airy bottom 35% negative space",
    lightingDNA: "Warm golden morning sunlight through sheer white linen curtains, soft emotional bloom and subtle film grain",
    injectedPromptEnrichment: "aesthetic Pinterest poster, Kinfolk editorial magazine, tender maternal love, graceful Indonesian mother gently embracing child, blush rose and warm gold tones, soft morning sunlight, delicate carnation florals, Behance featured, 8k resolution",
    typographyDNA: {
      trendingFontPairing: "Playfair Display + Plus Jakarta Sans (Maternal Elegance Trend)",
      headlineFont: "'Playfair Display', 'Cormorant Garamond', serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
      headlineTracking: 5,
      treatment: "Frameless floating luxury bottom typography, warm rose hairline rule, heartfelt elegance",
      microAccents: "♡  KASIH IBU  ♡"
    }
  },
  kemerdekaan: {
    pinterestStyleTitle: "Modern Swiss Monumental & Minimalist Red-White",
    trendingKeywords: ["modern swiss grid", "geometric red-white", "bold editorial typography", "silk flutter", "ultra-minimalist"],
    colorPalette: {
      primary: ["#E8112D", "#FFFFFF"],
      accents: ["#0F172A", "#D4AF37"]
    },
    compositionDNA: "Heroic low-angle perspective, dynamic diagonal tension, clean architectural framing with strict 35% safe text zone",
    lightingDNA: "Dramatic volumetric sunrise god rays, cinematic contrast, subtle film grain",
    injectedPromptEnrichment: "trending on Pinterest graphic design, Behance featured editorial poster, modern Swiss graphic design, clean minimalist red and white architecture, heroic perspective, cinematic sunrise lighting",
    typographyDNA: {
      trendingFontPairing: "Montserrat Black + Inter (Swiss Monumental Trend)",
      headlineFont: "'Montserrat', 'Bebas Neue', 'Anton', sans-serif",
      subheadlineFont: "'Inter', 'Segoe UI', -apple-system, sans-serif",
      headlineTracking: 4,
      treatment: "Heavy geometric uppercase typography, red-gold hairline divider, archival badge",
      microAccents: "★  ★  ★"
    }
  },
  tni: {
    pinterestStyleTitle: "Cinematic High-Fashion Editorial Armed Forces",
    trendingKeywords: ["vogue editorial military", "golden hour silhouette", "minimalist border framing", "kodak portra 400"],
    colorPalette: {
      primary: ["#1E293B", "#D97706"],
      accents: ["#334155", "#F8FAFC"]
    },
    compositionDNA: "Monumental low-angle soldier or jet silhouette against golden hour sky, thin elegant outer margin borders",
    lightingDNA: "Backlit golden hour silhouette with volumetric amber flare and atmospheric mist",
    injectedPromptEnrichment: "trending on Pinterest Behance poster, cinematic editorial photography, soldier silhouette, golden hour atmospheric haze, Kodak Portra 400 film grain, minimalist magazine cover layout",
    typographyDNA: {
      trendingFontPairing: "Montserrat Black + Plus Jakarta Sans (Tactical Editorial)",
      headlineFont: "'Montserrat', 'Anton', 'Oswald', sans-serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
      headlineTracking: 5,
      treatment: "Monumental tracking, dark military amber accent rule, archival stamping",
      microAccents: "★  ARMED FORCES  ★"
    }
  },
  reuni: {
    pinterestStyleTitle: "Warm Nostalgic Polaroid & Glassmorphic Twilight",
    trendingKeywords: ["nostalgic warm bokeh", "golden fairy lights", "frosted glass card", "lifestyle alumni gathering"],
    colorPalette: {
      primary: ["#0F172A", "#F59E0B"],
      accents: ["#38BDF8", "#FEF3C7"]
    },
    compositionDNA: "Atmospheric evening terrace amphitheater with warm glowing fairy lights, bottom frosted dark glass card",
    lightingDNA: "Warm ambient bokeh, twilight blue hour sky with golden celebration illumination",
    injectedPromptEnrichment: "aesthetic Pinterest event poster, warm nostalgic gathering, glowing golden fairy lights, twilight ambiance, modern typography, Behance award-winning event branding",
    typographyDNA: {
      trendingFontPairing: "Montserrat + Plus Jakarta Sans (Glassmorphism Luxury)",
      headlineFont: "'Montserrat', 'Playfair Display', serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
      headlineTracking: 3,
      treatment: "Modern frosted card hierarchy, amber pill badge, subtle divider",
      microAccents: "✦ MMXXVI ✦"
    }
  },
  santri: {
    pinterestStyleTitle: "Sacred Emerald Arch & Modern Islamic Editorial",
    trendingKeywords: ["emerald green", "moroccan arches", "golden lantern glow", "sacred calligraphy", "arabic modern editorial"],
    colorPalette: {
      primary: ["#064E3B", "#D4AF37"],
      accents: ["#10B981", "#FAF8F5", "#1E293B"]
    },
    compositionDNA: "Majestic architectural minaret or mosque courtyard silhouette bathed in divine dawn light, serene lower negative space",
    lightingDNA: "Celestial dawn volumetric light, soft emerald glow, mystical atmospheric haze",
    injectedPromptEnrichment: "aesthetic Islamic Pinterest poster, modern Arabic graphic design, sacred emerald and gold, soft dawn lighting, Behance featured islamic art, cinematic peace",
    typographyDNA: {
      trendingFontPairing: "Playfair Display + Plus Jakarta Sans (Sacred Spiritual)",
      headlineFont: "'Playfair Display', 'Cormorant Garamond', 'Cinzel', serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
      headlineTracking: 5,
      treatment: "Sacred emerald glow, gold bead divider, spiritual archival footer",
      microAccents: "✦ ☾ ✦"
    }
  },
  seminar: {
    pinterestStyleTitle: "Bauhaus Tech Minimalist & Sleek Grid Architecture",
    trendingKeywords: ["swiss typography grid", "brutalist lighting", "electric blue accents", "minimalist architecture", "editorial tech"],
    colorPalette: {
      primary: ["#0F172A", "#3B82F6"],
      accents: ["#10B981", "#F8FAFC", "#64748B"]
    },
    compositionDNA: "Sleek contemporary architectural structure with strong geometric shadows and crisp 40% negative space",
    lightingDNA: "High-contrast studio architectural illumination with subtle neon blue edge reflections",
    injectedPromptEnrichment: "trending on Pinterest graphic design, modern Swiss poster, architectural photography, sleek brutalist tech aesthetic, Behance branding award",
    typographyDNA: {
      trendingFontPairing: "Space Grotesk + Inter (Contemporary Tech Grid)",
      headlineFont: "'Space Grotesk', 'Cabinet Grotesk', 'Inter', sans-serif",
      subheadlineFont: "'Space Grotesk', 'Inter', monospace",
      headlineTracking: 2,
      treatment: "Asymmetric left-aligned grid, vertical accent bar, technical coordinate header",
      microAccents: "// EXP_SYS: 43.0"
    }
  },
  seni: {
    pinterestStyleTitle: "Contemporary Neo-Heritage & Botanical Collage",
    trendingKeywords: ["fine art collage", "textured canvas", "organic botanical shapes", "earthy ochre", "fine art exhibition"],
    colorPalette: {
      primary: ["#9A3412", "#D97706"],
      accents: ["#047857", "#FFFBEB", "#1C1917"]
    },
    compositionDNA: "Artistic fine-art floral and textile flow with balanced asymmetrical visual tension",
    lightingDNA: "Soft painterly daylight, warm organic highlights, subtle canvas texture",
    injectedPromptEnrichment: "aesthetic Pinterest exhibition poster, fine art gallery branding, warm organic textures, botanical collage, contemporary Indonesian art",
    typographyDNA: {
      trendingFontPairing: "Playfair Display + Plus Jakarta Sans (Art Gallery)",
      headlineFont: "'Playfair Display', 'Cormorant Garamond', serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
      headlineTracking: 5,
      treatment: "Fine art monograph layout, warm ochre divider, poetic motto",
      microAccents: "✦  ART ATELIER  ✦"
    }
  },
  default: {
    pinterestStyleTitle: "Kinfolk Minimalist Editorial & Archival Warmth",
    trendingKeywords: ["kinfolk editorial", "modern serif typography", "warm earthy tones", "fine film grain", "minimalist layout"],
    colorPalette: {
      primary: ["#78350F", "#D4AF37"],
      accents: ["#FEF3C7", "#0F172A", "#F8FAFC"]
    },
    compositionDNA: "Clean upper-middle focal hero with generous unblocked negative space in the lower half",
    lightingDNA: "Golden hour warm sunlight with volumetric rays and soft film grain",
    injectedPromptEnrichment: "trending on Pinterest, Kinfolk editorial aesthetic, high-fashion magazine cover, Behance design award, 8k ultra-detailed",
    typographyDNA: {
      trendingFontPairing: "Cinzel + Plus Jakarta Sans (Editorial Prestige)",
      headlineFont: "'Cinzel', 'Playfair Display', 'Montserrat', serif",
      subheadlineFont: "'Plus Jakarta Sans', 'Inter', sans-serif",
      headlineTracking: 5,
      treatment: "Editorial letter-spacing, delicate hairline dividers, archival typography",
      microAccents: "✦  ✦  ✦"
    }
  }
};

export class PinterestResearchEngine {
  /**
   * Researches live Pinterest visual & typography trends for a given theme prompt
   */
  public static async researchPinterestTrends(themePrompt: string): Promise<PinterestAestheticDNA> {
    const cleanPrompt = (themePrompt || "").trim();

    // 1. Try Live Research via Gemini Grounding
    try {
      const searchPrompt = [
        `You are a Senior Art Director specializing in Pinterest, Behance, and high-fashion editorial poster typography trends used by world-class graphic designers.`,
        `Search and analyze the current top trending aesthetic visual & typography design DNA on Pinterest/Behance for the topic: "${cleanPrompt}".`,
        `Identify the trending color palette (hex), composition, textures, lighting style, aesthetic keywords, and TOP-TIER DESIGNER FONT PAIRING.`,
        `Font pairing options must use real modern Google Fonts (e.g. 'Cinzel Decorative', 'Cormorant Garamond', 'Playfair Display', 'Space Grotesk', 'Plus Jakarta Sans', 'Montserrat', 'Inter').`,
        `Return STRICTLY valid JSON with no markdown wrapping:`,
        `{`,
        `  "pinterestStyleTitle": "Creative short title for the Pinterest aesthetic style",`,
        `  "trendingKeywords": ["3 to 5 trending aesthetic keywords on Pinterest"],`,
        `  "colorPalette": {`,
        `    "primary": ["#hex1", "#hex2"],`,
        `    "accents": ["#hex3", "#hex4"]`,
        `  },`,
        `  "compositionDNA": "Precise description of subject placement and negative space",`,
        `  "lightingDNA": "Precise lighting style e.g. soft diffused window light, warm golden haze",`,
        `  "injectedPromptEnrichment": "Concise string of high-impact aesthetic keywords to append to diffusion prompt",`,
        `  "typographyDNA": {`,
        `    "trendingFontPairing": "Font 1 + Font 2 (Designer Trend Name)",`,
        `    "headlineFont": "'Font 1', serif/sans-serif",`,
        `    "subheadlineFont": "'Font 2', sans-serif",`,
        `    "headlineTracking": 5,`,
        `    "treatment": "Description of typography treatment e.g. wide tracking, hairline accents",`,
        `    "microAccents": "✦ ☾ ✦ or ✦  ✦  ✦"`,
        `  }`,
        `}`
      ].join("\n");

      const geminiRes = await callGeminiResilient({
        contents: [
          {
            parts: [{ text: searchPrompt }]
          }
        ]
      });

      const replyText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.pinterestStyleTitle && parsed.injectedPromptEnrichment) {
          const curatedFallback = this.getCuratedPinterestDNA(cleanPrompt);
          return {
            theme: cleanPrompt,
            pinterestStyleTitle: parsed.pinterestStyleTitle,
            trendingKeywords: parsed.trendingKeywords || ["minimalist editorial", "pinterest aesthetic"],
            colorPalette: parsed.colorPalette || curatedFallback.colorPalette,
            compositionDNA: parsed.compositionDNA || "Balanced editorial composition with dedicated lower negative space",
            lightingDNA: parsed.lightingDNA || "Soft diffused warm ambient lighting",
            injectedPromptEnrichment: parsed.injectedPromptEnrichment,
            typographyDNA: parsed.typographyDNA || curatedFallback.typographyDNA,
            source: "LIVE_PINTEREST_SEARCH"
          };
        }
      }
    } catch (err: any) {
      console.warn(`[PINTEREST-RESEARCH-WARN] Live search failed (${err.message}), using curated Pinterest moodboard`);
    }

    return this.getCuratedPinterestDNA(cleanPrompt);
  }

  /**
   * Synchronous curated moodboard & typography fallback
   */
  public static getCuratedPinterestDNA(themePrompt: string): PinterestAestheticDNA {
    const cleanPrompt = (themePrompt || "").trim();
    const lower = cleanPrompt.toLowerCase();

    let fallbackKey = "default";
    if (/tahun baru islam|1 muharram|muharram|hijriah|hijriyah|tahun baru hijriah/i.test(lower)) {
      fallbackKey = "tahun_baru_islam";
    } else if (/ibu|mother|hari ibu|bunda|mama|ummi/i.test(lower)) {
      fallbackKey = "hari_ibu";
    } else if (/kartini|wanita|perempuan|emansipasi/i.test(lower)) {
      fallbackKey = "kartini";
    } else if (/kemerdekaan|17 agustus|ri|merdeka|proklamasi/i.test(lower)) {
      fallbackKey = "kemerdekaan";
    } else if (/tni|tentara|militer|pahlawan|polisi/i.test(lower)) {
      fallbackKey = "tni";
    } else if (/reuni|alumni|gathering|temu/i.test(lower)) {
      fallbackKey = "reuni";
    } else if (/santri|hsn|islam|maulid|ramadan|masjid|dakwah|pesantren/i.test(lower)) {
      fallbackKey = "santri";
    } else if (/seminar|workshop|bisnis|startup|tech|webinar|konferensi/i.test(lower)) {
      fallbackKey = "seminar";
    } else if (/seni|art|budaya|batik|konser|musik|pameran|festival/i.test(lower)) {
      fallbackKey = "seni";
    }

    const fb = CURATED_PINTEREST_FALLBACKS[fallbackKey] || CURATED_PINTEREST_FALLBACKS.default;

    return {
      theme: cleanPrompt,
      pinterestStyleTitle: fb.pinterestStyleTitle,
      trendingKeywords: fb.trendingKeywords,
      colorPalette: fb.colorPalette,
      compositionDNA: fb.compositionDNA,
      lightingDNA: fb.lightingDNA,
      injectedPromptEnrichment: fb.injectedPromptEnrichment,
      typographyDNA: fb.typographyDNA,
      source: "CURATED_PINTEREST_MOODBOARD"
    };
  }
}
