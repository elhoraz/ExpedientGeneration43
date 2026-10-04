/**
 * src/lib/whatsapp/pinterestResearchEngine.ts
 * AI Poster Studio — Live Pinterest & Behance Visual Research Engine
 * 
 * Flow:
 * 1. User requests poster (e.g. "Hari Kartini" or "Reuni Akbar")
 * 2. PinterestResearchEngine executes a live visual search on Pinterest/Behance trends
 * 3. Extracts trending color palettes, textures, composition DNA, and aesthetic keywords
 * 4. Enriches the Visual Prompt & Typography Blueprint with genuine Pinterest aesthetics
 * 5. Falls back to curated aesthetic presets if network timeout occurs
 */

import { callGeminiResilient } from "../geminiResilient";

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
  source: "LIVE_PINTEREST_SEARCH" | "CURATED_PINTEREST_MOODBOARD";
}

// Built-in curated Pinterest fallbacks for instant response if live search is skipped or times out
const CURATED_PINTEREST_FALLBACKS: Record<string, Partial<PinterestAestheticDNA>> = {
  kartini: {
    pinterestStyleTitle: "Boho Chic Editorial & Minimalist Botanical",
    trendingKeywords: ["minimalist botanical", "organic arch frames", "warm terracotta", "delicate jasmine line art", "boho chic"],
    colorPalette: {
      primary: ["#C27D65", "#F5EFE6"],
      accents: ["#8F9E8B", "#DCA052", "#1C1917"]
    },
    compositionDNA: "Asymmetrical portrait of dignified woman framed by organic archways, generous negative space at bottom third",
    lightingDNA: "Soft diffused morning window haze, golden sun flare, subtle paper grain shadow",
    injectedPromptEnrichment: "aesthetic Pinterest poster, Kinfolk editorial magazine, minimalist boho style, warm terracotta and sage green, organic arch framing, delicate melati flowers, subtle batik textures, 8k resolution"
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
    injectedPromptEnrichment: "trending on Pinterest graphic design, Behance featured editorial poster, modern Swiss graphic design, clean minimalist red and white architecture, heroic perspective, cinematic sunrise lighting"
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
    injectedPromptEnrichment: "trending on Pinterest Behance poster, cinematic editorial photography, soldier silhouette, golden hour atmospheric haze, Kodak Portra 400 film grain, minimalist magazine cover layout"
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
    injectedPromptEnrichment: "aesthetic Pinterest event poster, warm nostalgic gathering, glowing golden fairy lights, twilight ambiance, modern typography, Behance award-winning event branding"
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
    injectedPromptEnrichment: "aesthetic Islamic Pinterest poster, modern Arabic graphic design, sacred emerald and gold, soft dawn lighting, Behance featured islamic art, cinematic peace"
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
    injectedPromptEnrichment: "trending on Pinterest graphic design, modern Swiss poster, architectural photography, sleek brutalist tech aesthetic, Behance branding award"
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
    injectedPromptEnrichment: "aesthetic Pinterest exhibition poster, fine art gallery branding, warm organic textures, botanical collage, contemporary Indonesian art"
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
    injectedPromptEnrichment: "trending on Pinterest, Kinfolk editorial aesthetic, high-fashion magazine cover, Behance design award, 8k ultra-detailed"
  }
};

export class PinterestResearchEngine {
  /**
   * Researches live Pinterest visual trends for a given theme prompt
   */
  public static async researchPinterestTrends(themePrompt: string): Promise<PinterestAestheticDNA> {
    const cleanPrompt = (themePrompt || "").trim();
    const lower = cleanPrompt.toLowerCase();

    // 1. Try Live Research via Gemini Grounding
    try {
      const searchPrompt = [
        `You are a Senior Art Director specializing in Pinterest, Behance, and high-fashion editorial poster trends.`,
        `Search and analyze the current top trending aesthetic design DNA on Pinterest for the topic: "${cleanPrompt}".`,
        `Identify the trending color palette (hex), composition, textures, lighting style, and aesthetic keywords.`,
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
        `  "injectedPromptEnrichment": "Concise string of high-impact aesthetic keywords to append to diffusion prompt"`,
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
          return {
            theme: cleanPrompt,
            pinterestStyleTitle: parsed.pinterestStyleTitle,
            trendingKeywords: parsed.trendingKeywords || ["minimalist editorial", "pinterest aesthetic"],
            colorPalette: parsed.colorPalette || { primary: ["#C27D65", "#F5EFE6"], accents: ["#8F9E8B"] },
            compositionDNA: parsed.compositionDNA || "Balanced editorial composition with dedicated lower negative space",
            lightingDNA: parsed.lightingDNA || "Soft diffused warm ambient lighting",
            injectedPromptEnrichment: parsed.injectedPromptEnrichment,
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
   * Synchronous curated moodboard fallback
   */
  public static getCuratedPinterestDNA(themePrompt: string): PinterestAestheticDNA {
    const cleanPrompt = (themePrompt || "").trim();
    const lower = cleanPrompt.toLowerCase();

    let fallbackKey = "default";
    if (/kartini|wanita|perempuan|emansipasi/i.test(lower)) fallbackKey = "kartini";
    else if (/kemerdekaan|17 agustus|ri|merdeka|proklamasi/i.test(lower)) fallbackKey = "kemerdekaan";
    else if (/tni|tentara|militer|pahlawan|polisi/i.test(lower)) fallbackKey = "tni";
    else if (/reuni|alumni|gathering|temu/i.test(lower)) fallbackKey = "reuni";
    else if (/santri|hsn|islam|maulid|ramadan|masjid|dakwah|hijriah|pesantren/i.test(lower)) fallbackKey = "santri";
    else if (/seminar|workshop|bisnis|startup|tech|webinar|konferensi/i.test(lower)) fallbackKey = "seminar";
    else if (/seni|art|budaya|batik|konser|musik|pameran|festival/i.test(lower)) fallbackKey = "seni";

    const fb = CURATED_PINTEREST_FALLBACKS[fallbackKey] || CURATED_PINTEREST_FALLBACKS.default;

    return {
      theme: cleanPrompt,
      pinterestStyleTitle: fb.pinterestStyleTitle || "Curated Editorial Pinterest Aesthetic",
      trendingKeywords: fb.trendingKeywords || ["minimalist", "editorial", "pinterest"],
      colorPalette: fb.colorPalette || { primary: ["#8B5E3C", "#D4AF37"], accents: ["#F5EFE6", "#1C1917"] },
      compositionDNA: fb.compositionDNA || "Heroic upper-middle subject with balanced negative space",
      lightingDNA: fb.lightingDNA || "Volumetric soft morning golden sun flare with cinematic haze",
      injectedPromptEnrichment: fb.injectedPromptEnrichment || "trending on Pinterest, Kinfolk editorial aesthetic, modern minimalist poster design, high-end graphic design",
      source: "CURATED_PINTEREST_MOODBOARD"
    };
  }
}
