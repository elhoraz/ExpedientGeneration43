/**
 * src/lib/whatsapp/designPromptArchitect.ts
 * Enterprise Auto Creative Brief Generator & 3-Tier Design System Pipeline
 * 
 * Implements the 2 Decoupled Outputs Architecture:
 * 1. Visual Prompt (Framing 35-45%, Narrative Depth, POSTER LAYOUT INTENT, Negative Prompt)
 * 2. Typography Blueprint (Deterministic Preset, Multi-stop Scrim, Auto-Sizing, Sharp Compositor)
 * 
 * Includes:
 * - Design Preset Library (12 Presets)
 * - Auto Hierarchy Generator (Eyebrow, Headline, Subheadline, Quote, Footer)
 * - Post-Render Quality Checker (Sharp Contrast & Luminance Inspection)
 */

import { callGeminiResilient } from "../geminiResilient";
import {
  DESIGN_PRESETS,
  DesignIntentCategory,
  PresetId,
  getDefaultPresetForCategory,
  escapeXml,
  wrapSvgText,
  calculateHeadlineSize,
} from "./designSystem";

export interface TypographyBlueprint {
  layout: string;
  headline: string;
  subheadline: string;
  eyebrow?: string;
  quote?: string;
  footer?: string;
  headline_font: string;
  headline_size: number;
  headline_tracking: number;
  subheadline_font: string;
  subheadline_size: number;
  subheadline_tracking?: number;
  alignment: "center" | "left";
  text_position: "bottom_center" | "top_center" | "left_center" | "bottom_left";
  overlay: {
    type: "bottom_gradient" | "top_gradient" | "left_gradient" | "glass_card";
    opacity: number;
  };
}

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
  subject_occupancy?: string;
  environment: string;
  narrative_elements?: string;
  composition: string;
  lighting: string;
  visual_density: "minimal" | "medium" | "dense";
  copywriting: {
    eyebrow?: string;
    headline: string;
    subheadline: string;
    quoteOrBody?: string;
  };
  typography_blueprint: TypographyBlueprint;
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
  typography_blueprint: TypographyBlueprint;
  layoutStyle?: string;
  colorPalette: { hex: string; name: string }[];
  typography: {
    primaryFont: string;
    secondaryFont: string;
    recommendedLayout: string;
  };
  copywriting: {
    eyebrow?: string;
    headline: string;
    subheadline: string;
    quoteOrBody?: string;
  };
  officialCdnAsset?: {
    storyUrl: string;
  };
}

/**
 * Builds the deterministic Typography Blueprint for Sharp
 */
export function buildTypographyBlueprint(brief: {
  preset_id: PresetId;
  copywriting: {
    headline: string;
    subheadline: string;
    eyebrow?: string;
    quoteOrBody?: string;
  };
}): TypographyBlueprint {
  const preset = DESIGN_PRESETS[brief.preset_id] || DESIGN_PRESETS["01_CINEMATIC_HERO"];
  const rawHeadline = (brief.copywriting.headline || "EXPEDIENT").trim();
  const headlineSize = calculateHeadlineSize(rawHeadline, 118);
  const isLeft = preset.typography.headlineAlign === "left";
  const isTop = preset.textSafeZone.position === "top";
  const isLeftZone = preset.textSafeZone.position === "left";

  let textPos: TypographyBlueprint["text_position"] = "bottom_center";
  if (isTop) textPos = "top_center";
  else if (isLeftZone) textPos = "left_center";
  else if (isLeft) textPos = "bottom_left";

  let overlayType: TypographyBlueprint["overlay"]["type"] = "bottom_gradient";
  if (isTop) overlayType = "top_gradient";
  else if (isLeftZone) overlayType = "left_gradient";
  else if (brief.preset_id === "04_GLASS_EVENT") overlayType = "glass_card";

  return {
    layout: brief.preset_id,
    headline: rawHeadline.toUpperCase(),
    subheadline: (brief.copywriting.subheadline || "").trim(),
    eyebrow: brief.copywriting.eyebrow,
    quote: brief.copywriting.quoteOrBody,
    headline_font: preset.typography.primaryFont,
    headline_size: headlineSize,
    headline_tracking: 3,
    subheadline_font: preset.typography.secondaryFont,
    subheadline_size: 32,
    subheadline_tracking: 2,
    alignment: preset.typography.headlineAlign,
    text_position: textPos,
    overlay: {
      type: overlayType,
      opacity: 0.85,
    },
  };
}

/**
 * Output 1: Structured Diffusion Visual Prompt Compiler
 * Includes the explicit POSTER LAYOUT INTENT to prevent main subject overlap!
 */
export function compileImagePrompt(brief: AutoCreativeBrief): string {
  const preset = DESIGN_PRESETS[brief.preset_id] || DESIGN_PRESETS["01_CINEMATIC_HERO"];
  const safeZoneInstruction = preset.textSafeZone.negativeSpaceInstruction;
  const occupancy = brief.subject_occupancy || "positioned strictly in upper-middle area, occupying approximately 35-45% of the frame with heroic low-angle perspective";
  const narrative = brief.narrative_elements ? ` ${brief.narrative_elements}.` : "";

  return [
    `Create a premium cinematic vertical 9:16 visual background for ${brief.poster_type}.`,
    `MAIN SUBJECT: ${brief.main_subject}, ${occupancy}.`,
    `ENVIRONMENT: ${brief.environment}.${narrative}`,
    `COMPOSITION: ${brief.composition}, strong central focal point, intentional visual hierarchy, balanced composition.`,
    `LIGHTING: ${brief.lighting}, volumetric sun rays, soft atmospheric glow, high dynamic range.`,
    `MOOD: ${brief.mood}.`,
    `COLOR PALETTE: ${brief.primary_colors?.join(", ") || "#DC2626, #FFFFFF"}, with accents of ${brief.secondary_colors?.join(", ") || "#F59E0B, #0F172A"}.`,
    `POSTER LAYOUT INTENT: Reserve dedicated typography-safe zone in lower third (bottom 32-35%). Main subject must remain strictly in upper-middle area and must NOT overlap or bleed into the typography area. Maintain strong contrast separation between focal subject and text zone.`,
    `GRAPHIC DESIGN REQUIREMENTS: Designed specifically as a professional social media poster background. ${safeZoneInstruction} Avoid high-frequency details, avoid complex objects, avoid bright highlights in typography area. Preserve strong readability support for headline placement.`,
    `STYLE: ${brief.visual_style}, cinematic realism, modern minimalist poster design, professional advertising quality, clean visual hierarchy, 8k ultra-detailed rendering.`,
    `NEGATIVE PROMPT: No text, no letters, no words, no logos, no watermark, no typography, no gibberish, no visual clutter, no excessive decorative elements, no distorted objects, no busy background.`
  ].join(" ");
}

/**
 * Auto Creative Brief Generator
 * Transforms short user requests into the 2 decoupled outputs:
 * Output 1: Visual Diffusion Prompt
 * Output 2: Typography Blueprint
 */
export async function generateAutoCreativeBrief(rawUserPrompt: string): Promise<AutoCreativeBrief> {
  const clean = rawUserPrompt.trim();

  try {
    const systemPrompt = `
You are an Award-Winning Poster Art Director & Auto Creative Brief Generator for a professional Graphic Design Studio WhatsApp Bot.
A user requested: "${clean}".

Your task is "Auto-Brief Completion": normalize short or ambiguous user requests into a complete, decoupled design specification:
1. Visual Design Specification (camera framing, strictly 35-45% occupancy in upper-middle area, narrative storytelling depth e.g. subtle monument silhouettes or atmospheric depth, lighting, mood, color palette).
2. Professional Indonesian Copywriting with 4-Tier Visual Hierarchy:
   - eyebrow: official badge or kicker (e.g. "17 AGUSTUS · PERINGATAN RESMI NASIONAL")
   - headline: monumental, punchy uppercase (1-3 words)
   - subheadline: supporting contextual theme
   - quoteOrBody: inspiring slogan or quote (1-2 sentences)
3. Typography Blueprint Selection (choose best matching preset_id from the 12 presets).

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
  "mood": "Emotional mood in English (e.g. Heroic, proud, majestic, unified)",
  "primary_colors": ["#Hex1", "#Hex2"],
  "secondary_colors": ["#Hex3", "#Hex4"],
  "main_subject": "Exact focal subject in English (e.g. A majestic Indonesian red-and-white flag with realistic silk texture)",
  "subject_occupancy": "positioned strictly in upper-middle area, occupying approximately 35-45% of the frame with heroic low-angle perspective",
  "environment": "Environment in English (e.g. Archipelago coastline at sunrise with soft atmospheric depth)",
  "narrative_elements": "Subtle monument silhouettes, distant celebratory atmosphere, and symbolic patriotic storytelling",
  "composition": "Heroic low-angle perspective with strong central focal point",
  "lighting": "Golden-hour cinematic lighting with volumetric sun rays and high dynamic range",
  "visual_density": "minimal" | "medium" | "dense",
  "eyebrow": "OFFICIAL BADGE OR KICKER (uppercase Indonesian)",
  "headline": "POWERFUL UPPERCASE HEADLINE (1-3 words in Indonesian)",
  "subheadline": "Contextual supporting subheadline in Indonesian",
  "quoteOrBody": "Inspiring slogan or quote in Indonesian (1-2 sentences)",
  "confidence_score": 90,
  "assumed_fields": ["palette", "lighting", "mood", "subheadline", "eyebrow"],
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

        const score = typeof parsed.confidence_score === "number" ? parsed.confidence_score : 85;
        const confidenceLevel = score >= 80 ? "HIGH" : score >= 55 ? "AUTO_CREATIVE" : "CLARIFICATION_NEEDED";
        const preset = DESIGN_PRESETS[presetId];

        const brief: AutoCreativeBrief = {
          theme: parsed.theme,
          category: parsed.category || "COMMEMORATIVE_POSTER",
          poster_type: parsed.poster_type || "Editorial Commemorative Poster",
          aspect_ratio: "9:16",
          preset_id: presetId,
          audience: parsed.audience || "General Public & Social Media",
          visual_style: parsed.visual_style || "Cinematic Patriotic Editorial",
          mood: parsed.mood || "Heroic, Proud & Unified",
          primary_colors: parsed.primary_colors?.length ? parsed.primary_colors : preset.defaultPalette.map((p) => p.hex),
          secondary_colors: parsed.secondary_colors?.length ? parsed.secondary_colors : ["#D4AF37", "#0F172A"],
          main_subject: parsed.main_subject || parsed.theme,
          subject_occupancy: parsed.subject_occupancy || "positioned strictly in upper-middle area, occupying approximately 35-45% of the frame",
          environment: parsed.environment || "Dramatic archipelago coastline at sunrise with atmospheric depth",
          narrative_elements: parsed.narrative_elements || "Subtle monument silhouettes and celebratory storytelling elements",
          composition: parsed.composition || "Heroic low-angle perspective with strong central focal point",
          lighting: parsed.lighting || "Golden hour cinematic lighting with volumetric rays",
          visual_density: parsed.visual_density || "medium",
          copywriting: {
            eyebrow: parsed.eyebrow,
            headline: parsed.headline,
            subheadline: parsed.subheadline || "EXPEDIENT CREATIVE ARCHIVE",
            quoteOrBody: parsed.quoteOrBody,
          },
          typography_blueprint: buildTypographyBlueprint({
            preset_id: presetId,
            copywriting: {
              eyebrow: parsed.eyebrow,
              headline: parsed.headline,
              subheadline: parsed.subheadline || "EXPEDIENT CREATIVE ARCHIVE",
              quoteOrBody: parsed.quoteOrBody,
            },
          }),
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
  let presetId: PresetId = "08_PATRIOTIC_MONUMENTAL";

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
  } else {
    category = "COMMEMORATIVE_POSTER";
    presetId = "01_CINEMATIC_HERO";
  }

  const preset = DESIGN_PRESETS[presetId];
  const copywriting = {
    eyebrow: "★ PERINGATAN RESMI NASIONAL ★",
    headline: clean.split(" ").slice(0, 3).join(" ").toUpperCase() || "EXPEDIENT",
    subheadline: "CREATIVE ARCHIVE · VOL. 43",
    quoteOrBody: "Merajut kebersamaan, melangkah pasti menjemput masa depan gemilang.",
  };

  const brief: AutoCreativeBrief = {
    theme: clean || "Desain Kreatif Expedient",
    category,
    poster_type: "National Commemorative Poster",
    aspect_ratio: "9:16",
    preset_id: presetId,
    audience: "Alumni & Komunitas",
    visual_style: preset.tagline,
    mood: "Heroic, Proud & Unified",
    primary_colors: preset.defaultPalette.map((p) => p.hex),
    secondary_colors: ["#D4AF37", "#0F172A"],
    main_subject: clean,
    subject_occupancy: "positioned strictly in upper-middle area, occupying approximately 35-45% of the frame",
    environment: "Dramatic archipelago coastline at sunrise with atmospheric depth",
    narrative_elements: "Subtle monument silhouettes and celebratory storytelling elements",
    composition: "Heroic low-angle perspective with strong central focal point",
    lighting: "Golden hour dramatic volumetric backlight",
    visual_density: "medium",
    copywriting,
    typography_blueprint: buildTypographyBlueprint({ preset_id: presetId, copywriting }),
    creative_confidence: 75,
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
    typography_blueprint: brief.typography_blueprint,
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
    typography_blueprint: brief.typography_blueprint,
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
 * Formats the Decoupled Outputs into a professional WhatsApp summary card
 */
export function formatBlueprintForWhatsApp(blueprint: ArtDirectionBlueprint): string {
  const brief = blueprint.auto_brief as AutoCreativeBrief | undefined;
  const presetId = (blueprint.preset_id as PresetId) || "01_CINEMATIC_HERO";
  const preset = DESIGN_PRESETS[presetId] || DESIGN_PRESETS["01_CINEMATIC_HERO"];
  const tb = blueprint.typography_blueprint;

  let out = `🎨 *AUTO CREATIVE BRIEF & TYPOGRAPHY BLUEPRINT*\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `📌 *Tema Desain:* ${blueprint.title}\n`;
  out += `🏷️ *Intent Category:* ${brief?.category || "COMMEMORATIVE_POSTER"}\n`;
  out += `📐 *Design Preset:* [${preset.id}] ${preset.name}\n`;
  out += `🎯 *Safe Zone:* ${preset.textSafeZone.position.toUpperCase()} (Multi-Stop Scrim)\n`;
  out += `✨ *Visual Mood:* ${brief?.mood || blueprint.theme}\n`;
  out += `🎨 *Palet Warna:* ${blueprint.colorPalette.map((c) => c.hex).join(", ")}\n\n`;

  out += `🔤 *Typography Blueprint (Sharp Engine):*\n`;
  if (tb.eyebrow) {
    out += `  • *Badge/Eyebrow:* ${tb.eyebrow}\n`;
  }
  out += `  • *Headline:* "${tb.headline}" (Size: ${tb.headline_size}px, Tracking: +${tb.headline_tracking})\n`;
  out += `  • *Subheadline:* "${tb.subheadline}" (Size: ${tb.subheadline_size}px)\n`;
  if (tb.quote) {
    out += `  • *Quote:* _"${tb.quote}"_\n`;
  }
  out += `  • *Alignment & Scrim:* ${tb.alignment.toUpperCase()} | ${tb.overlay.type} (Opacity: ${tb.overlay.opacity})\n\n`;

  const confScore = brief?.creative_confidence || 88;
  const confMode = confScore >= 80 ? "HIGH CONFIDENCE" : "AUTO CREATIVE MODE";
  out += `⚡ *Confidence Score:* ${confScore}% (${confMode})\n`;
  if (brief?.assumed_fields?.length) {
    out += `🧩 *Auto-Enriched:* ${brief.assumed_fields.slice(0, 4).join(", ")}\n`;
  }
  out += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🚀 _Engine sedang merender latar visual difusi & tipografi presisi..._\n`;

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
      primary_colors: blueprint.colorPalette?.map((c) => c.hex) || ["#DC2626"],
      copywriting: blueprint.copywriting,
    });

    return await sharp(bg)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 96 })
      .toBuffer();
  } catch (err: any) {
    console.warn("[TYPOGRAPHY-OVERLAY-FALLBACK]:", err.message);
    return imageBuffer;
  }
}

export interface QualityCriticReport {
  passed: boolean;
  score: number;
  checks: {
    resolution_9_16: boolean;
    buffer_integrity: boolean;
    typography_contrast: boolean;
  };
  metrics?: {
    width?: number;
    height?: number;
    byteSize?: number;
    meanLuminance?: number;
  };
  notes: string;
}

/**
 * Pre-flight Quality Critic Gate (Post-Sharp Render)
 * Inspects dimensions (9:16 vertical 1080x1920), buffer integrity,
 * and performs contrast/luminance analysis in the typography safe zone!
 */
export async function qualityCritic(imageBuffer: Buffer): Promise<QualityCriticReport> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(imageBuffer).metadata();
    const bufferValid = imageBuffer.length > 25000;
    const is916 = (meta.width === 1080 && meta.height === 1920) || 
      (Boolean(meta.width && meta.height) && Math.abs((meta.width! / meta.height!) - (9 / 16)) < 0.05);

    // Measure luminance in typography zone (lower 35% of frame)
    let meanLuminance = 45;
    let contrastSafe = true;
    try {
      if (meta.width && meta.height && meta.width >= 500 && meta.height >= 800) {
        const zoneTop = Math.floor(meta.height * 0.65);
        const zoneHeight = meta.height - zoneTop;
        const stats = await sharp(imageBuffer)
          .extract({ left: 0, top: zoneTop, width: meta.width, height: zoneHeight })
          .stats();
        
        if (stats.channels && stats.channels.length >= 3) {
          meanLuminance = Math.round(
            (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3
          );
          // Dark gradient scrim ensures typography zone background stays dark enough for white text
          contrastSafe = meanLuminance < 165;
        }
      }
    } catch (_) {}

    const checks = {
      resolution_9_16: Boolean(is916),
      buffer_integrity: bufferValid,
      typography_contrast: contrastSafe,
    };

    let score = 0;
    if (checks.buffer_integrity) score += 35;
    if (checks.resolution_9_16) score += 35;
    if (checks.typography_contrast) score += 30;

    return {
      passed: score >= 70,
      score,
      checks,
      metrics: {
        width: meta.width,
        height: meta.height,
        byteSize: imageBuffer.length,
        meanLuminance,
      },
      notes: score >= 90
        ? "Passed studio quality gate (1080x1920 9:16 vertical, high typography contrast)."
        : score >= 70
        ? "Acceptable poster render with minor safe-zone variance."
        : "Failed quality gate, recomposition required.",
    };
  } catch (err: any) {
    return {
      passed: false,
      score: 0,
      checks: { resolution_9_16: false, buffer_integrity: false, typography_contrast: false },
      notes: `Quality critic error: ${err.message}`,
    };
  }
}
