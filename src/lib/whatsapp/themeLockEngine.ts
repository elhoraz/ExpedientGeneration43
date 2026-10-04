/**
 * src/lib/whatsapp/themeLockEngine.ts
 * AI Poster Studio — Theme Lock Engine & Identity Protection
 * 
 * CORE PRINCIPLE:
 * Creative Style may vary (Swiss, Luxury Editorial, Documentary, etc.).
 * Theme Identity may NEVER vary.
 * 
 * PRIORITY ORDER:
 * 1. Theme Accuracy (Theme always wins)
 * 2. Readability
 * 3. Composition
 * 4. Design Style (Style must NEVER override theme)
 * 
 * Prevents Critical Failures such as:
 * Input "Hari Kartini" -> Output "Corporate businessman / male executive"
 */

import type { AutoCreativeBrief } from "./designPromptArchitect";
import { PresetId } from "./designSystem";

export interface ThemeLockRule {
  themeId: string;
  displayName: string;
  matchPatterns: RegExp[];
  allowedStyles: string[];
  requiredVisualElements: string[];
  elementDetectors: Record<string, RegExp>;
  minimumRequiredIndicators: number;
  forbiddenVisualElements: string[];
  forbiddenPatterns: RegExp[];
  guaranteedSubject: string;
  guaranteedEnvironment: string;
}

export interface ThemeLockExtraction {
  theme: string;
  themeId: string;
  requiredVisualElements: string[];
  detectedRequiredElements: string[];
  detectedForbiddenElements: string[];
  themeFailure: boolean;
  failureReason?: string;
  themeConsistencyScore: number; // 0 - 100 (Pass >= 85, Fail < 85)
  action: "PASS" | "LOCKED_REPLACE" | "REJECT_AND_REBUILD";
}

export const THEME_LOCK_REGISTRY: Record<string, ThemeLockRule> = {
  kartini: {
    themeId: "kartini",
    displayName: "Hari Kartini",
    matchPatterns: [
      /\b(kartini|emansipasi|perempuan|wanita|habis\s+gelap|puan|raden\s+ajeng)\b/i,
    ],
    allowedStyles: [
      "Historical Documentary",
      "Luxury Editorial",
      "Modern Swiss",
      "Premium Magazine",
      "Minimal Heritage",
    ],
    requiredVisualElements: [
      "Indonesian woman",
      "Kartini-inspired figure",
      "Women's education symbolism",
      "Books",
      "Letters",
      "Traditional Indonesian heritage",
      "Historical atmosphere",
      "Female empowerment symbolism",
    ],
    elementDetectors: {
      "Indonesian woman": /\b(indonesian\s+woman|wanita\s+indonesia|perempuan\s+indonesia|woman|wanita|perempuan|gadis)\b/i,
      "Kartini-inspired figure": /\b(kartini|kartini-inspired|figure|tokoh\s+kartini|raden\s+ajeng)\b/i,
      "Women's education symbolism": /\b(education|pendidikan|literasi|literacy|sekolah|belajar|study|intellectual)\b/i,
      "Books": /\b(book|books|buku|kitab|literature|reading|bacaan)\b/i,
      "Letters": /\b(letter|letters|surat|manuscript|manuskrip|door\s+duisternis|writing\s+desk|fountain\s+pen|pena)\b/i,
      "Traditional Indonesian heritage": /\b(batik|kebaya|javanese|jawa|heritage|tradisional|traditional|jepara|tenun)\b/i,
      "Historical atmosphere": /\b(historical|sejarah|colonial|kolonial|antique|antik|klasik|archival|vintage|era\s+dahulu)\b/i,
      "Female empowerment symbolism": /\b(empowerment|emansipasi|equality|kesetaraan|puan|perjuangan\s+wanita|courage)\b/i,
    },
    minimumRequiredIndicators: 2,
    forbiddenVisualElements: [
      "businessman",
      "male executive",
      "corporate office",
      "corporate leadership imagery",
      "unrelated modern business symbolism",
    ],
    forbiddenPatterns: [
      /\b(businessman|businessmen|male\s+executive|corporate\s+office|corporate\s+leadership|modern\s+business|boardroom|man\s+in\s+suit|corporate\s+setting|office\s+building|male\s+manager|business\s+meeting|male\s+director|stock\s+market)\b/i,
    ],
    guaranteedSubject:
      "A dignified Kartini-inspired Indonesian woman wearing graceful classical Javanese kebaya and batik, sitting with intellectual poise at an antique wooden writing desk with historical letters, literature books, and a fountain pen",
    guaranteedEnvironment:
      "A serene colonial Javanese library veranda with warm golden dawn sunlight filtering through teakwood blinds, surrounded by delicate batik drapery and historical dignity",
  },
  hari_ibu: {
    themeId: "hari_ibu",
    displayName: "Hari Ibu Nasional",
    matchPatterns: [
      /\b(hari\s+ibu|ibu|mother|mothers\s+day|kasih\s+ibu|bunda|mama|ummi|22\s+desember)\b/i,
    ],
    allowedStyles: [
      "Luxury Editorial",
      "Modern Swiss",
      "Tender Emotional",
      "Warm Minimalist",
      "Premium Magazine",
    ],
    requiredVisualElements: [
      "Mother figure / maternal embrace",
      "Warm tender atmosphere",
      "Soft floral accents (carnation, jasmine, lily)",
      "Maternal love symbolism",
    ],
    elementDetectors: {
      "Mother figure / maternal embrace": /\b(mother|ibu|bunda|mama|maternal|embrace|pelukan|child|baby|anak)\b/i,
      "Warm tender atmosphere": /\b(warm|hangat|tender|lembut|kasih|love|soft|gentle|morning\s+sunlight)\b/i,
      "Soft floral accents (carnation, jasmine, lily)": /\b(flower|flowers|bunga|carnation|melati|jasmine|lily|kelopak|petals)\b/i,
      "Maternal love symbolism": /\b(kasih\s+ibu|devotion|sacrifice|pengorbanan|surga|heaven|tribute)\b/i,
    },
    minimumRequiredIndicators: 2,
    forbiddenVisualElements: [
      "businessman in suit",
      "corporate office",
      "battle weapons",
      "military camouflage",
    ],
    forbiddenPatterns: [
      /\b(businessman|corporate\s+office|weapon|military|camouflage|soldier)\b/i,
    ],
    guaranteedSubject:
      "A serene, graceful Indonesian mother gently embracing her child with tender maternal love, bathed in warm soft golden morning light",
    guaranteedEnvironment:
      "A warm minimalist aesthetic sanctuary with sheer linen curtains, gentle floral accents of blush carnations, and soft ambient morning illumination",
  },
  independence_day: {
    themeId: "independence_day",
    displayName: "Hari Kemerdekaan Indonesia",
    matchPatterns: [
      /\b(kemerdekaan|17\s+agustus|hut\s+ri|dirgahayu\s+indonesia|proklamasi|merah\s+putih)\b/i,
    ],
    allowedStyles: [
      "Heroic Monumental",
      "Modern Swiss",
      "Luxury Editorial",
      "Historical Documentary",
      "Cinematic Dawn",
    ],
    requiredVisualElements: [
      "Indonesian flag (Merah Putih)",
      "National symbolism (Garuda / Archipelago)",
      "Historical struggle / patriotic valor",
      "Independence references (Proclamation / 1945)",
      "National unity symbolism",
    ],
    elementDetectors: {
      "Indonesian flag (Merah Putih)": /\b(merah\s*putih|bendera|indonesian\s+flag|red\s+and\s+white\s+flag|silk\s+flag)\b/i,
      "National symbolism (Garuda / Archipelago)": /\b(garuda|nusantara|archipelago|pancasila|nasional|national)\b/i,
      "Historical struggle / patriotic valor": /\b(struggle|perjuangan|pejuang|valor|patriot|heroic|pahlawan)\b/i,
      "Independence references (Proclamation / 1945)": /\b(proklamasi|1945|kemerdekaan|monas|monument|proclamation)\b/i,
      "National unity symbolism": /\b(persatuan|unity|bhineka|sovereignty|unified)\b/i,
    },
    minimumRequiredIndicators: 2,
    forbiddenVisualElements: [
      "foreign flag",
      "corporate office meeting",
      "businessman",
      "unrelated commercial store",
    ],
    forbiddenPatterns: [
      /\b(foreign\s+flag|stars\s+and\s+stripes|union\s+jack|businessman|corporate\s+office)\b/i,
    ],
    guaranteedSubject:
      "A majestic fluttering Indonesian red-and-white silk flag waving proudly with rich realistic texture",
    guaranteedEnvironment:
      "Archipelago coastline at dramatic golden sunrise with volumetric rays and distant silhouettes of the Proclamation monument",
  },
  ramadan: {
    themeId: "ramadan",
    displayName: "Bulan Suci Ramadan & Ibadah",
    matchPatterns: [
      /\b(ramadan|ramadhan|puasa|tarawih|sahur|bulan\s+suci|lebaran|idul\s+fitri)\b/i,
    ],
    allowedStyles: [
      "Sacred Serenity",
      "Luxury Arabesque",
      "Modern Swiss",
      "Minimal Heritage",
      "Celestial Dawn",
    ],
    requiredVisualElements: [
      "Worship symbolism (Quran / Rehal)",
      "Mosque elements (Minaret / Dome)",
      "Community activity",
      "Ramadan atmosphere (Luminous Crescent Hilal Moon / Brass Lanterns)",
      "Spiritual reflection",
    ],
    elementDetectors: {
      "Worship symbolism (Quran / Rehal)": /\b(quran|alquran|al-qur'an|rehal|kitab|tasbih)\b/i,
      "Mosque elements (Minaret / Dome)": /\b(masjid|mosque|kubah|dome|menara|minaret)\b/i,
      "Community activity": /\b(jamaah|ibadah|tarawih|silaturahmi|umat|community)\b/i,
      "Ramadan atmosphere (Luminous Crescent Hilal Moon / Brass Lanterns)": /\b(hilal|crescent|moon|bulan\s+sabit|lentera|lantern|fanoos)\b/i,
      "Spiritual reflection": /\b(spiritual|berkah|suci|doa|peaceful|taqwa|reflection)\b/i,
    },
    minimumRequiredIndicators: 2,
    forbiddenVisualElements: [
      "daytime feasting / food eating",
      "alcohol",
      "corporate office meeting",
      "nightclub partying",
    ],
    forbiddenPatterns: [
      /\b(alcohol|cocktail|wine|nightclub|corporate\s+office|eating\s+food)\b/i,
    ],
    guaranteedSubject:
      "Majestic Grand Mosque minaret silhouette under an ethereal crescent moon and luminous emerald mist with glowing golden brass fanoos lanterns",
    guaranteedEnvironment:
      "Serene sacred marble courtyard at blue hour twilight with reflective shallow pool and soft ambient radiance",
  },
  hari_pahlawan: {
    themeId: "hari_pahlawan",
    displayName: "Hari Pahlawan Nasional",
    matchPatterns: [
      /\b(pahlawan|10\s+november|surabaya|veteran|bung\s+tomo)\b/i,
    ],
    allowedStyles: [
      "Heroic Monumental",
      "Historical Documentary",
      "Modern Swiss",
      "Luxury Editorial",
    ],
    requiredVisualElements: [
      "Heroic monument / Bambu Runcing",
      "Freedom fighters silhouette",
      "Indonesian red-and-white ribbon",
      "Historical 1945 struggle atmosphere",
      "Patriotic courage symbolism",
    ],
    elementDetectors: {
      "Heroic monument / Bambu Runcing": /\b(monumen|monument|bambu\s+runcing|patung)\b/i,
      "Freedom fighters silhouette": /\b(pejuang|pahlawan|freedom\s+fighter|veteran|bung\s+tomo|fighters)\b/i,
      "Indonesian red-and-white ribbon": /\b(pita\s+merah\s+putih|red-and-white\s+ribbon|merah\s+putih|flag)\b/i,
      "Historical 1945 struggle atmosphere": /\b(1945|surabaya|10\s+november|pertempuran|historic|struggle)\b/i,
      "Patriotic courage symbolism": /\b(keberanian|courage|patriotik|semangat|valor)\b/i,
    },
    minimumRequiredIndicators: 2,
    forbiddenVisualElements: [
      "corporate businessman",
      "modern shopping mall",
      "futuristic sci-fi cyber city",
    ],
    forbiddenPatterns: [
      /\b(businessman|corporate\s+office|shopping\s+mall|cyberpunk)\b/i,
    ],
    guaranteedSubject:
      "A weathered heroic bronze freedom monument draped with a crisp red-and-white silk ribbon bathed in solemn volumetric morning sunlight",
    guaranteedEnvironment:
      "Historic battle of Surabaya commemorative ground at dawn with dramatic volumetric rays breaking through atmospheric clouds",
  },
  hari_santri: {
    themeId: "hari_santri",
    displayName: "Hari Santri Nasional",
    matchPatterns: [
      /\b(santri|pesantren|hsn|resolusi\s+jihad|22\s+oktober)\b/i,
    ],
    allowedStyles: [
      "Sacred Heritage",
      "Historical Documentary",
      "Modern Swiss",
      "Minimalist Academic",
    ],
    requiredVisualElements: [
      "Santri silhouette in traditional peci & sarong",
      "Kitab Kuning / classical manuscript on rehal",
      "Historic pesantren timber architecture",
      "Faith and national defense harmony",
    ],
    elementDetectors: {
      "Santri silhouette in traditional peci & sarong": /\b(santri|peci|sarung|sarong|kopiah)\b/i,
      "Kitab Kuning / classical manuscript on rehal": /\b(kitab|kitab\s+kuning|manuskrip|rehal|buku|reading|manuscript)\b/i,
      "Historic pesantren timber architecture": /\b(pesantren|pondok|surau|kayu|timber|courtyard|architecture)\b/i,
      "Faith and national defense harmony": /\b(resolusi\s+jihad|jihad|bela\s+negara|fatwa|defense)\b/i,
    },
    minimumRequiredIndicators: 2,
    forbiddenVisualElements: [
      "western businessman in suit",
      "corporate boardroom",
    ],
    forbiddenPatterns: [
      /\b(businessman|corporate\s+boardroom|suit\s+and\s+tie)\b/i,
    ],
    guaranteedSubject:
      "A dignified silhouette of a santri wearing traditional peci and clean white attire reading a classical manuscript on a carved wooden rehal",
    guaranteedEnvironment:
      "Historic Javanese timber pesantren courtyard at golden dawn with lush banyan trees and tranquil spiritual serenity",
  },
};

export class ThemeLockEngine {
  /**
   * Matches raw user prompt against registered locked themes
   */
  public static detectTheme(prompt: string): ThemeLockRule | null {
    for (const rule of Object.values(THEME_LOCK_REGISTRY)) {
      if (rule.matchPatterns.some((pattern) => pattern.test(prompt))) {
        return rule;
      }
    }
    return null;
  }

  /**
   * THEME LOCK VALIDATION:
   * Inspects visual prompt and main subject against locked theme rules.
   * If forbidden elements are found (e.g. businessman in Kartini), triggers themeFailure = true.
   * If fewer than required minimum indicators found, triggers themeFailure = true.
   */
  public static validatePrompt(
    promptToTest: string,
    themeRule: ThemeLockRule
  ): ThemeLockExtraction {
    // Isolate positive prompt from negative prompt so negative prompt exclusions aren't falsely flagged as positive subject matter
    const parts = promptToTest.split(/NEGATIVE PROMPT:/i);
    const positivePrompt = parts[0] || "";
    const lower = positivePrompt.toLowerCase();

    // 1. Detect Forbidden Elements in Positive Content (Immediate Failure)
    const detectedForbidden: string[] = [];
    for (const term of themeRule.forbiddenVisualElements) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(lower)) {
        detectedForbidden.push(term);
      }
    }
    for (const pattern of themeRule.forbiddenPatterns) {
      const match = lower.match(pattern);
      if (match && !detectedForbidden.some((item) => item.toLowerCase() === match[0].toLowerCase())) {
        detectedForbidden.push(match[0]);
      }
    }

    // 2. Detect Required Visual Elements
    const detectedRequired: string[] = [];
    for (const req of themeRule.requiredVisualElements) {
      const detector = themeRule.elementDetectors?.[req];
      let isPresent = false;
      if (detector) {
        isPresent = detector.test(lower);
      } else {
        const keywords = req.toLowerCase().split(/[\s\/\(\)]+/).filter((w) => w.length > 3);
        isPresent = keywords.some((kw) => lower.includes(kw));
      }
      if (isPresent) {
        detectedRequired.push(req);
      }
    }

    const hasForbidden = detectedForbidden.length > 0;
    const hasEnoughIndicators = detectedRequired.length >= themeRule.minimumRequiredIndicators;
    const themeFailure = hasForbidden || !hasEnoughIndicators;

    let failureReason: string | undefined;
    if (hasForbidden) {
      failureReason = `CRITICAL THEME FAILURE: Forbidden visual element detected (${detectedForbidden.join(", ")}) for locked theme "${themeRule.displayName}". Style attempted to override theme identity!`;
    } else if (!hasEnoughIndicators) {
      failureReason = `THEME INSUFFICIENT INDICATORS: Detected only ${detectedRequired.length} indicator(s), minimum ${themeRule.minimumRequiredIndicators} required for theme "${themeRule.displayName}".`;
    }

    // 3. Theme Consistency Score (Question: "If typography is removed, would most Indonesian viewers still identify this as [Theme]?")
    // Pass >= 85, Fail < 85
    let consistencyScore = 95;
    if (hasForbidden) {
      consistencyScore = 15; // Zero tolerance for businessman in Kartini (Immediate Fail)
    } else if (detectedRequired.length === 0) {
      consistencyScore = 30; // Immediate Fail (< 85)
    } else if (detectedRequired.length === 1) {
      consistencyScore = 70; // Insufficient indicators (< 85)
    } else if (detectedRequired.length >= 2) {
      // 2 indicators = 88, 3 = 92, 4 = 96, 5+ = 98 - 100 (Pass >= 85)
      consistencyScore = Math.min(100, 88 + (detectedRequired.length - 2) * 4);
    }

    let action: ThemeLockExtraction["action"] = "PASS";
    if (themeFailure) {
      action = hasForbidden ? "LOCKED_REPLACE" : "REJECT_AND_REBUILD";
    }

    return {
      theme: themeRule.displayName,
      themeId: themeRule.themeId,
      requiredVisualElements: themeRule.requiredVisualElements,
      detectedRequiredElements: detectedRequired,
      detectedForbiddenElements: detectedForbidden,
      themeFailure,
      failureReason,
      themeConsistencyScore: consistencyScore,
      action,
    };
  }

  /**
   * THEME LOCK ENFORCER (The Healer):
   * Enforces Priority Order:
   * 1. Theme Accuracy
   * 2. Readability
   * 3. Composition
   * 4. Design Style
   * 
   * If brief or prompt contains a theme failure (e.g. corporate businessman for Kartini),
   * strictly strips the unauthorized corporate elements and locks the subject to the theme's
   * guaranteed authentic subject while preserving the user's desired aesthetic style (Swiss, Luxury, etc.)!
   */
  public static enforceThemeLock(
    brief: AutoCreativeBrief,
    rawUserPrompt: string
  ): {
    brief: AutoCreativeBrief;
    lockReport: ThemeLockExtraction;
    wasAutoHealed: boolean;
  } {
    const themeRule = this.detectTheme(`${rawUserPrompt} ${brief.theme}`);

    // If not a registered locked theme, pass through
    if (!themeRule) {
      return {
        brief,
        lockReport: {
          theme: brief.theme,
          themeId: "unlocked_general",
          requiredVisualElements: [],
          detectedRequiredElements: [],
          detectedForbiddenElements: [],
          themeFailure: false,
          themeConsistencyScore: 92,
          action: "PASS",
        },
        wasAutoHealed: false,
      };
    }

    const testSubjectAndPrompt = `${brief.main_subject} ${brief.compiled_image_prompt}`;
    let lockReport = this.validatePrompt(testSubjectAndPrompt, themeRule);

    let wasAutoHealed = false;

    // If Theme Failure detected -> HEAL IMMEDIATELY
    if (lockReport.themeFailure) {
      // 1. Force guaranteed authentic subject & environment
      brief.main_subject = themeRule.guaranteedSubject;
      brief.environment = themeRule.guaranteedEnvironment;

      // 2. Disallow forbidden presets (e.g. 06_CORPORATE_CLEAN is forbidden for Kartini)
      if (brief.preset_id === "06_CORPORATE_CLEAN") {
        brief.preset_id = "02_EDITORIAL_LUXURY";
        brief.creative_style = "LUXURY_EDITORIAL";
      }

      // 3. Re-compile prompt with cleansed authentic elements
      brief.compiled_image_prompt = [
        `Create a premium cinematic vertical 9:16 visual background for ${themeRule.displayName}.`,
        `MAIN SUBJECT: ${brief.main_subject}, positioned strictly in upper-middle area occupying 35-45% of the frame with heroic perspective.`,
        `ENVIRONMENT: ${brief.environment}.`,
        `COMPOSITION: Balanced classical composition, strong central focal point, intentional visual hierarchy.`,
        `LIGHTING: Soft dramatic volumetric golden morning light, subtle atmospheric glow.`,
        `MOOD: Noble, intellectual, graceful, and historically profound.`,
        `COLOR PALETTE: #8B5E3C, #D4AF37, with accents of #1C1917, #FDFBF7.`,
        `POSTER LAYOUT INTENT: Reserve dedicated typography-safe zone in lower third (bottom 32-35%). Main subject must remain strictly in upper-middle area and must NOT overlap or bleed into the typography area.`,
        `GRAPHIC DESIGN REQUIREMENTS: Designed specifically as a professional museum/editorial poster background. Avoid high-frequency details, avoid complex objects, avoid bright highlights in typography area.`,
        `STYLE: ${brief.visual_style || "Editorial Heritage"}, cinematic realism, modern minimalist poster design, 8k ultra-detailed rendering.`,
        `NEGATIVE PROMPT: businessman, male executive, corporate office, suit, modern boardroom, no text, no words, no letters, no logos, no watermark, no typography.`
      ].join(" ");

      wasAutoHealed = true;

      // Re-validate after healing
      lockReport = this.validatePrompt(`${brief.main_subject} ${brief.compiled_image_prompt}`, themeRule);
    }

    return {
      brief,
      lockReport,
      wasAutoHealed,
    };
  }
}
