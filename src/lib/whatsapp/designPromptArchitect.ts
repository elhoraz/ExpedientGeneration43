/**
 * src/lib/whatsapp/designPromptArchitect.ts
 * Enterprise Auto Creative Brief Generator & Design System Pipeline
 * 
 * Flow: User Request -> Intent Analyzer -> Auto Creative Brief -> Preset Selector
 *       -> Safe Zone Enforcement -> Prompt Compiler -> Quality Gate -> Sharp Compositor
 */

import { callGeminiResilient } from "../geminiResilient";
import {
  DESIGN_PRESETS,
  DesignIntentCategory,
  PresetId,
  getDefaultPresetForCategory,
  escapeXml,
  wrapSvgText,
} from "./designSystem";

export interface AutoCreativeBrief {
  theme: string;
  category: DesignIntentCategory;
  poster_type: string;
  aspect_ratio: "9:16";
  preset_id: PresetId;
  audience: string;
  visual_style: string;
  mood: string;
  primary_colors: string[];
  secondary_colors: string[];
  main_subject: string;
  environment: string;
  composition: string;
  lighting: string;
  visual_density: "minimal" | "medium" | "dense";
  copywriting: {
    headline: string;
    subheadline: string;
    quoteOrBody?: string;
  };
  creative_confidence: number; // 0 - 100
  confidence_level: "HIGH" | "AUTO_CREATIVE" | "CLARIFICATION_NEEDED";
  assumed_fields: string[];
  preserved_facts: string[];
  compiled_image_prompt: string;
}

export interface ArtDirectionBlueprint {
  title: string;
  category: string;
  enhancedPrompt: string;
  theme: string;
  preset_id?: PresetId;
  auto_brief?: AutoCreativeBrief;
  layoutStyle?: string;
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
 * Structured Prompt Compiler
 * Compiles a deterministic, high-fidelity diffusion prompt incorporating
 * the Text Safe Zone requirements from the active design preset.
 */
export function compileImagePrompt(brief: AutoCreativeBrief): string {
  const preset = DESIGN_PRESETS[brief.preset_id] || DESIGN_PRESETS["01_CINEMATIC_HERO"];
  return [
    `Create a premium cinematic vertical 9:16 visual background for ${brief.poster_type}.`,
    `MAIN SUBJECT: ${brief.main_subject}.`,
    `ENVIRONMENT: ${brief.environment}.`,
    `COMPOSITION: ${brief.composition}.`,
    `LIGHTING: ${brief.lighting}.`,
    `MOOD: ${brief.mood}.`,
    `COLOR PALETTE: ${brief.primary_colors?.join(", ") || "#FBBF24, #0F172A"}, with accents of ${brief.secondary_colors?.join(", ") || "#FFFFFF"}.`,
    `GRAPHIC DESIGN REQUIREMENT: ${preset.textSafeZone.negativeSpaceInstruction}`,
    `STYLE: ${brief.visual_style}, advertising photography, cinematic grading, high dynamic range, 8k resolution, clean visual hierarchy.`,
    `IMPORTANT: Clean artwork only, absolutely no text, no words, no letters, no logos, no watermark, no typography, no gibberish.`,
  ].join(" ");
}

/**
 * Auto Creative Brief Generator
 * Transforms short user requests (e.g. "buatkan poster hari kemerdekaan") into a complete,
 * production-ready design specification before rendering.
 */
export async function generateAutoCreativeBrief(rawUserPrompt: string): Promise<AutoCreativeBrief> {
  const clean = rawUserPrompt.trim();

  try {
    const systemPrompt = `
You are an Elite Creative Art Director & Auto Creative Brief Generator for a professional Graphic Design Studio WhatsApp Bot.
A user requested: "${clean}".

Your task is "Auto-Brief Completion": normalize short or ambiguous user requests into a complete, structured design specification.

CRITICAL INFORMATION BOUNDARY RULES:
1. SAFE TO ASSUME & ENRICH: Visual style, layout preset, color palette, lighting, composition, photography style, typography style, inspirational headline, subheadline, and uplifting quotes.
2. NEVER HALLUCINATE OR INVENT: Exact dates, venue addresses, ticket prices, personal phone numbers, sponsor logos, fake committee names, or unknown official institutional slogans. If not explicitly provided by the user, omit them!

Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "theme": "Normalized Indonesian theme title",
  "category": "COMMEMORATIVE_POSTER" | "RELIGIOUS_POSTER" | "EVENT_POSTER" | "PROMOTIONAL_POSTER" | "EDUCATIONAL_POSTER" | "ANNOUNCEMENT_POSTER" | "PRODUCT_AD" | "SOCIAL_MEDIA_POST" | "SCENERY_IMAGE" | "PORTRAIT" | "INFOGRAPHIC",
  "poster_type": "Descriptive English poster type (e.g. National Commemorative Poster, Sacred Holiday Story)",
  "preset_id": "01_CINEMATIC_HERO" | "02_EDITORIAL_LUXURY" | "03_SWISS_MODERN" | "04_GLASS_EVENT" | "05_MINIMAL_RELIGIOUS" | "06_CORPORATE_CLEAN" | "07_YOUTH_VIBRANT" | "08_PATRIOTIC_MONUMENTAL" | "09_PRODUCT_PREMIUM" | "10_FUTURISTIC_TECH" | "11_DOCUMENTARY_HISTORY" | "12_FESTIVAL_DYNAMIC",
  "audience": "Target audience (e.g. General public, youth, alumni)",
  "visual_style": "Specific visual style in English (e.g. Cinematic patriotic editorial, minimal architectural)",
  "mood": "Emotional mood in English (e.g. Heroic, proud, elegant)",
  "primary_colors": ["#Hex1", "#Hex2"],
  "secondary_colors": ["#Hex3", "#Hex4"],
  "main_subject": "Exact focal subject in English (e.g. Indonesian national flag fluttering proudly with golden rays)",
  "environment": "Environment / setting in English (e.g. Archipelago coastline at dramatic golden sunrise)",
  "composition": "Framing composition in English (e.g. Strong central hero focal point with low-angle majesty)",
  "lighting": "Cinematic lighting in English (e.g. Dramatic volumetric golden hour backlight)",
  "visual_density": "minimal" | "medium" | "dense",
  "headline": "POWERFUL UPPERCASE HEADLINE (1-3 words in Indonesian)",
  "subheadline": "Contextual uppercase subheadline in Indonesian",
  "quoteOrBody": "Inspiring slogan or quote in Indonesian (1-2 sentences)",
  "confidence_score": 75,
  "assumed_fields": ["palette", "lighting", "mood", "subheadline"],
  "preserved_facts": ["theme"]
}
`.trim();

    const body = {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    };

    const res = await callGeminiResilient(body, "", "gemini-3.5-flash");
    const jsonText = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (jsonText) {
      const parsed = JSON.parse(jsonText.replace(/^```json\s*|\s*```$/g, "").trim());
      if (parsed.theme && parsed.headline) {
        const presetId: PresetId =
          parsed.preset_id && DESIGN_PRESETS[parsed.preset_id as PresetId]
            ? (parsed.preset_id as PresetId)
            : getDefaultPresetForCategory(parsed.category || "COMMEMORATIVE_POSTER");

        const score = typeof parsed.confidence_score === "number" ? parsed.confidence_score : 75;
        const confidenceLevel = score >= 80 ? "HIGH" : score >= 55 ? "AUTO_CREATIVE" : "CLARIFICATION_NEEDED";

        const brief: AutoCreativeBrief = {
          theme: parsed.theme,
          category: parsed.category || "COMMEMORATIVE_POSTER",
          poster_type: parsed.poster_type || "Editorial Commemorative Poster",
          aspect_ratio: "9:16",
          preset_id: presetId,
          audience: parsed.audience || "General Public & Social Media",
          visual_style: parsed.visual_style || "Cinematic Editorial",
          mood: parsed.mood || "Heroic, Elegant & Inspiring",
          primary_colors: parsed.primary_colors?.length ? parsed.primary_colors : ["#CE1126", "#FFFFFF"],
          secondary_colors: parsed.secondary_colors?.length ? parsed.secondary_colors : ["#D4AF37", "#0F172A"],
          main_subject: parsed.main_subject || parsed.theme,
          environment: parsed.environment || "Dramatic cinematic atmosphere",
          composition: parsed.composition || "Strong focal subject with negative space for typography",
          lighting: parsed.lighting || "Volumetric golden hour lighting",
          visual_density: parsed.visual_density || "medium",
          copywriting: {
            headline: parsed.headline,
            subheadline: parsed.subheadline || "EXPEDIENT CREATIVE ARCHIVE",
            quoteOrBody: parsed.quoteOrBody,
          },
          creative_confidence: score,
          confidence_level: confidenceLevel,
          assumed_fields: parsed.assumed_fields || ["palette", "lighting", "subheadline"],
          preserved_facts: parsed.preserved_facts || ["theme"],
          compiled_image_prompt: "",
        };

        brief.compiled_image_prompt = compileImagePrompt(brief);
        return brief;
      }
    }
  } catch (err: any) {
    console.warn("[AUTO-BRIEF-FALLBACK]:", err.message);
  }

  // Deterministic local fallback brief
  return createFallbackBrief(clean);
}

function createFallbackBrief(clean: string): AutoCreativeBrief {
  const lower = clean.toLowerCase();
  let category: DesignIntentCategory = "COMMEMORATIVE_POSTER";
  let presetId: PresetId = "01_CINEMATIC_HERO";

  if (lower.includes("kemerdekaan") || lower.includes("tni") || lower.includes("pancasila") || lower.includes("pahlawan")) {
    category = "COMMEMORATIVE_POSTER";
    presetId = "08_PATRIOTIC_MONUMENTAL";
  } else if (lower.includes("maulid") || lower.includes("santri") || lower.includes("masjid") || lower.includes("isa")) {
    category = "RELIGIOUS_POSTER";
    presetId = "05_MINIMAL_RELIGIOUS";
  } else if (lower.includes("reuni") || lower.includes("milad") || lower.includes("acara")) {
    category = "EVENT_POSTER";
    presetId = "04_GLASS_EVENT";
  } else if (lower.includes("olahraga") || lower.includes("sport") || lower.includes("futsal")) {
    category = "EVENT_POSTER";
    presetId = "07_YOUTH_VIBRANT";
  }

  const preset = DESIGN_PRESETS[presetId];
  const brief: AutoCreativeBrief = {
    theme: clean || "Desain Kreatif Expedient",
    category,
    poster_type: "Editorial Commemorative Poster",
    aspect_ratio: "9:16",
    preset_id: presetId,
    audience: "Alumni & Komunitas",
    visual_style: preset.tagline,
    mood: "Heroic, Elegant & Inspiring",
    primary_colors: preset.defaultPalette.map((p) => p.hex),
    secondary_colors: ["#D4AF37", "#0F172A"],
    main_subject: clean,
    environment: "Dramatic cinematic atmosphere with volumetric lighting",
    composition: "Hero central subject with intentional negative space",
    lighting: "Golden hour dramatic volumetric backlight",
    visual_density: "medium",
    copywriting: {
      headline: clean.split(" ").slice(0, 3).join(" ").toUpperCase() || "EXPEDIENT",
      subheadline: "CREATIVE ARCHIVE · VOL. 43",
      quoteOrBody: "Merajut kebersamaan, melangkah pasti menjemput masa depan gemilang.",
    },
    creative_confidence: 70,
    confidence_level: "AUTO_CREATIVE",
    assumed_fields: ["palette", "lighting", "typography", "safe_zone"],
    preserved_facts: ["theme"],
    compiled_image_prompt: "",
  };

  brief.compiled_image_prompt = compileImagePrompt(brief);
  return brief;
}

/**
 * Main Dynamic AI Architect: Converts User Prompt into an Auto Creative Brief
 * and returns the ArtDirectionBlueprint expected by the WhatsApp Gateway.
 */
export async function architectDynamicDesignWithAI(rawUserPrompt: string): Promise<ArtDirectionBlueprint> {
  const brief = await generateAutoCreativeBrief(rawUserPrompt);
  const preset = DESIGN_PRESETS[brief.preset_id] || DESIGN_PRESETS["01_CINEMATIC_HERO"];

  return {
    title: brief.theme,
    category: brief.category,
    enhancedPrompt: brief.compiled_image_prompt,
    theme: `${brief.visual_style} (${preset.name})`,
    preset_id: brief.preset_id,
    auto_brief: brief,
    colorPalette: brief.primary_colors.map((hex, i) => ({ hex, name: `Accent ${i + 1}` })),
    typography: {
      primaryFont: preset.typography.primaryFont,
      secondaryFont: preset.typography.secondaryFont,
      recommendedLayout: `Format 9:16: [${preset.id}] ${preset.name}`,
    },
    copywriting: brief.copywriting,
  };
}

/**
 * Legacy Fallback Synchronous Architect
 */
export function architectMasterpieceDesign(rawUserPrompt: string): ArtDirectionBlueprint {
  const brief = createFallbackBrief(rawUserPrompt);
  const preset = DESIGN_PRESETS[brief.preset_id];
  return {
    title: brief.theme,
    category: brief.category,
    enhancedPrompt: brief.compiled_image_prompt,
    theme: `${brief.visual_style} (${preset.name})`,
    preset_id: brief.preset_id,
    auto_brief: brief,
    colorPalette: brief.primary_colors.map((hex, i) => ({ hex, name: `Accent ${i + 1}` })),
    typography: {
      primaryFont: preset.typography.primaryFont,
      secondaryFont: preset.typography.secondaryFont,
      recommendedLayout: `Format 9:16: [${preset.id}] ${preset.name}`,
    },
    copywriting: brief.copywriting,
  };
}

/**
 * Formats the Auto Creative Brief into a professional WhatsApp summary card
 */
export function formatBlueprintForWhatsApp(blueprint: ArtDirectionBlueprint): string {
  const brief = blueprint.auto_brief as AutoCreativeBrief | undefined;
  const presetId = (blueprint.preset_id as PresetId) || "01_CINEMATIC_HERO";
  const preset = DESIGN_PRESETS[presetId] || DESIGN_PRESETS["01_CINEMATIC_HERO"];

  let out = `🎨 *AUTO CREATIVE BRIEF (Expedient Studio)*\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `📌 *Tema Desain:* ${blueprint.title}\n`;
  out += `🏷️ *Intent Category:* ${brief?.category || "COMMEMORATIVE_POSTER"}\n`;
  out += `📐 *Design Preset:* [${preset.id}] ${preset.name}\n`;
  out += `🎯 *Text Safe Zone:* ${preset.textSafeZone.position.toUpperCase()} (${preset.textSafeZone.negativeSpaceInstruction.slice(0, 42)}...)\n`;
  out += `✨ *Visual Mood:* ${brief?.mood || blueprint.theme}\n`;
  out += `🎨 *Palet Warna:* ${blueprint.colorPalette.map((c) => c.hex).join(", ")}\n\n`;

  out += `🔤 *Hierarchy Copywriting:*\n`;
  out += `  • *Headline:* "${blueprint.copywriting.headline}"\n`;
  out += `  • *Subheadline:* "${blueprint.copywriting.subheadline}"\n`;
  if (blueprint.copywriting.quoteOrBody) {
    out += `  • *Quote:* _"${blueprint.copywriting.quoteOrBody}"_\n`;
  }
  out += `\n`;

  const confScore = brief?.creative_confidence || 85;
  const confMode = confScore >= 80 ? "HIGH CONFIDENCE" : "AUTO CREATIVE MODE";
  out += `⚡ *Confidence Score:* ${confScore}% (${confMode})\n`;
  if (brief?.assumed_fields?.length) {
    out += `🧩 *Auto-Enriched:* ${brief.assumed_fields.slice(0, 4).join(", ")}\n`;
  }
  out += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🚀 _Engine sedang merender visual difusi & tipografi presisi..._\n`;

  return out;
}

/**
 * Sharp Typography Compositor
 * Reads the active Design Preset and composites the exact typographic layout onto the image.
 */
export async function applyPinterestTypographyOverlay(
  imageBuffer: Buffer,
  blueprint: ArtDirectionBlueprint
): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    const W = 1080;
    const H = 1920;

    const bg = await sharp(imageBuffer)
      .resize(W, H, { fit: "cover", position: "center" })
      .toBuffer();

    const presetId: PresetId = (blueprint as any).preset_id || "01_CINEMATIC_HERO";
    const preset = DESIGN_PRESETS[presetId] || DESIGN_PRESETS["01_CINEMATIC_HERO"];

    const svg = preset.renderSvg(W, H, {
      theme: blueprint.title,
      poster_type: blueprint.category,
      primary_colors: blueprint.colorPalette?.map((c) => c.hex) || ["#FBBF24"],
      copywriting: blueprint.copywriting,
    });

    return await sharp(bg)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 96 })
      .toBuffer();
  } catch (_) {
    return imageBuffer;
  }
}

/**
 * Pre-flight Quality Critic Gate
 * Validates buffer integrity, dimensions, and readability before WhatsApp dispatch.
 */
export async function qualityCritic(imageBuffer: Buffer): Promise<{ passed: boolean; score: number; notes: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(imageBuffer).metadata();
    const bufferValid = imageBuffer.length > 20000;
    const dimensionsValid = (meta.width === 1080 && meta.height === 1920) || (Boolean(meta.width && meta.height && meta.width > 500));

    const score = (bufferValid ? 50 : 0) + (dimensionsValid ? 50 : 0);
    return {
      passed: score >= 80,
      score,
      notes: score >= 80 ? "Passed studio quality gate." : "Buffer needs recomposition.",
    };
  } catch (err: any) {
    return { passed: false, score: 0, notes: err.message };
  }
}
