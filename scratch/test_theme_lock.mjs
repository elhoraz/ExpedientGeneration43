/**
 * scratch/test_theme_lock.mjs
 * End-to-end verification of SYSTEM UPGRADE: THEME LOCK ENGINE
 */

import {
  ThemeLockEngine,
  THEME_LOCK_REGISTRY,
} from "../src/lib/whatsapp/themeLockEngine.ts";
import {
  generateMultiConceptCandidates,
} from "../src/lib/whatsapp/designQualityLayer.ts";

console.log("==================================================");
console.log("🧪 RUNNING SUITE: THEME LOCK ENGINE VERIFICATION");
console.log("==================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------------------------------
// TEST 1: Theme Extraction & Required Elements List
// ----------------------------------------------------------------------------
console.log("--- TEST 1: Theme Extraction & Required Elements Specification ---");
const kartiniRule = ThemeLockEngine.detectTheme("Hari Kartini");
assert(kartiniRule !== null, "Detected theme rule for 'Hari Kartini'");
assert(kartiniRule.displayName === "Hari Kartini", "Display name matches 'Hari Kartini'");
assert(kartiniRule.requiredVisualElements.length === 8, "Has exactly 8 required visual elements for Kartini");
assert(kartiniRule.minimumRequiredIndicators === 2, "Requires at least 2 visual indicators");

// ----------------------------------------------------------------------------
// TEST 2: Critical Failure Detection (Businessman in Kartini)
// ----------------------------------------------------------------------------
console.log("\n--- TEST 2: Critical Failure Detection (Businessman in Kartini) ---");
const corruptedPrompt = "A businessman in corporate office analyzing charts with male executive leadership";
const failureReport = ThemeLockEngine.validatePrompt(corruptedPrompt, kartiniRule);

console.log("Extracted Failure Report:", JSON.stringify({
  theme: failureReport.theme,
  detectedForbiddenElements: failureReport.detectedForbiddenElements,
  themeFailure: failureReport.themeFailure,
  themeConsistencyScore: failureReport.themeConsistencyScore,
  action: failureReport.action,
}, null, 2));

assert(failureReport.themeFailure === true, "themeFailure is strictly true when businessman detected");
assert(failureReport.detectedForbiddenElements.length >= 2, "Detected forbidden elements: businessman, corporate office, male executive");
assert(failureReport.themeConsistencyScore < 85, `Consistency score is ${failureReport.themeConsistencyScore} (< 85 FAIL threshold)`);
assert(failureReport.action === "LOCKED_REPLACE", "Action triggered: LOCKED_REPLACE");

// ----------------------------------------------------------------------------
// TEST 3: Theme Lock Healing (Priority: Theme Accuracy > Readability > Composition > Style)
// ----------------------------------------------------------------------------
console.log("\n--- TEST 3: Theme Lock Healing (Auto-Rebuilding to Authentic Kartini) ---");
const corruptedBrief = {
  theme: "Hari Kartini",
  category: "COMMEMORATIVE_POSTER",
  poster_type: "Commemorative Poster",
  aspect_ratio: "9:16",
  platform: "STORY_9_16",
  preset_id: "06_CORPORATE_CLEAN", // Corporate preset that should be overridden
  creative_style: "CORPORATE_EXECUTIVE",
  main_subject: "A businessman in corporate office",
  environment: "Modern glass corporate boardroom",
  copywriting: {
    headline: "HARI KARTINI",
    subheadline: "Emansipasi Wanita Indonesia",
    quoteOrBody: "Habis Gelap Terbitlah Terang",
  },
  typography_blueprint: {
    layout: "06_CORPORATE_CLEAN",
    headline: "HARI KARTINI",
    subheadline: "Emansipasi Wanita Indonesia",
    headline_font: "Inter",
    headline_size: 90,
    headline_tracking: 2,
    subheadline_font: "Roboto",
    subheadline_size: 32,
    alignment: "center",
    text_position: "bottom_center",
    overlay: { type: "bottom_gradient", opacity: 0.85 },
  },
  compiled_image_prompt: "A businessman in corporate office leading a meeting",
};

const healedResult = ThemeLockEngine.enforceThemeLock(corruptedBrief, "Hari Kartini");

console.log("Healed Brief Summary:");
console.log("- Subject:", healedResult.brief.main_subject);
console.log("- Preset:", healedResult.brief.preset_id);
console.log("- Creative Style:", healedResult.brief.creative_style);
console.log("- Was Auto-Healed:", healedResult.wasAutoHealed);
console.log("- Post-Healing Consistency Score:", healedResult.lockReport.themeConsistencyScore);
console.log("- Post-Healing Detected Elements:", healedResult.lockReport.detectedRequiredElements);

assert(healedResult.wasAutoHealed === true, "Enforcer successfully healed corrupted brief");
assert(healedResult.brief.preset_id !== "06_CORPORATE_CLEAN", "Forbidden corporate preset replaced with editorial/luxury preset");
assert(!healedResult.brief.main_subject.toLowerCase().includes("businessman"), "Businessman completely stripped from main subject");
assert(healedResult.lockReport.themeFailure === false, "themeFailure is false after healing");
assert(healedResult.lockReport.themeConsistencyScore >= 85, `Healed score ${healedResult.lockReport.themeConsistencyScore} meets or exceeds 85 Pass threshold`);
assert(healedResult.lockReport.detectedRequiredElements.length >= 2, "Healed subject contains at least 2 required visual indicators");

// ----------------------------------------------------------------------------
// TEST 4: Creative Style Variance with Locked Theme (Kartini in 5 Allowed Styles)
// ----------------------------------------------------------------------------
console.log("\n--- TEST 4: Creative Styles Variance (Theme Identity Never Changes) ---");
const allowedStyles = [
  "Historical Documentary",
  "Luxury Editorial",
  "Modern Swiss",
  "Premium Magazine",
  "Minimal Heritage",
];

for (const styleName of allowedStyles) {
  const authenticKartiniPrompt = [
    `Create a premium visual background for Hari Kartini in ${styleName} aesthetic.`,
    `MAIN SUBJECT: A dignified Kartini-inspired Indonesian woman wearing graceful Javanese kebaya and batik, sitting at an antique wooden desk with historical letters and literature books.`,
    `ENVIRONMENT: Classical colonial veranda with warm golden dawn sunlight and teakwood carvings.`,
    `STYLE: ${styleName} design, clean negative space, 8k ultra-detailed rendering.`,
  ].join(" ");

  const evalResult = ThemeLockEngine.validatePrompt(authenticKartiniPrompt, kartiniRule);
  console.log(`Style: [${styleName}] -> Detected: [${evalResult.detectedRequiredElements.join(", ")}] | Score: ${evalResult.themeConsistencyScore}`);
  assert(!evalResult.themeFailure, `Style '${styleName}' preserves theme identity without themeFailure`);
  assert(evalResult.themeConsistencyScore >= 85, `Style '${styleName}' passes consistency score (Score: ${evalResult.themeConsistencyScore} >= 85)`);
}

// ----------------------------------------------------------------------------
// TEST 5: Multi-Concept Candidates for Kartini (Zero Corporate Executive)
// ----------------------------------------------------------------------------
console.log("\n--- TEST 5: Multi-Concept Candidates for Kartini ---");
const candidates = generateMultiConceptCandidates("Hari Kartini", "COMMEMORATIVE_POSTER");
console.log("Generated Candidates for 'Hari Kartini':");
for (const c of candidates) {
  console.log(`- Option ${c.id}: ${c.name} (${c.creative_style}) -> ${c.visualConcept.slice(0, 60)}...`);
}

assert(candidates.length === 3, "Generated 3 distinct candidates");
const hasAnyBusinessman = candidates.some((c) =>
  /businessman|corporate\s+executive|boardroom/i.test(`${c.name} ${c.visualConcept} ${c.creative_style}`)
);
assert(!hasAnyBusinessman, "Zero candidates contain businessman or corporate executive imagery");
assert(candidates.some((c) => c.name.includes("Historical Documentary")), "Candidate includes Historical Documentary");
assert(candidates.some((c) => c.name.includes("Editorial")), "Candidate includes Editorial");
assert(candidates.some((c) => c.name.includes("Swiss")), "Candidate includes Modern Swiss");

// ----------------------------------------------------------------------------
// TEST 6: Other Themes in Registry (Independence Day, Ramadan, etc.)
// ----------------------------------------------------------------------------
console.log("\n--- TEST 6: Other Registered Themes ---");
const independenceRule = ThemeLockEngine.detectTheme("HUT RI Kemerdekaan Indonesia 17 Agustus");
assert(independenceRule !== null, "Detected theme for Independence Day");

const validIndepPrompt = "A majestic fluttering Indonesian red-and-white silk flag waving proudly at archipelago sunrise with Proclamation monument silhouette";
const indepEval = ThemeLockEngine.validatePrompt(validIndepPrompt, independenceRule);
assert(!indepEval.themeFailure, "Independence day prompt passes validation");
assert(indepEval.themeConsistencyScore >= 85, `Independence consistency score: ${indepEval.themeConsistencyScore} >= 85`);

const ramadanRule = ThemeLockEngine.detectTheme("Marhaban ya Ramadan Bulan Suci");
assert(ramadanRule !== null, "Detected theme for Ramadan");

const validRamadanPrompt = "Majestic Grand Mosque minaret silhouette under an ethereal crescent moon with glowing brass lanterns and sacred courtyard";
const ramadanEval = ThemeLockEngine.validatePrompt(validRamadanPrompt, ramadanRule);
assert(!ramadanEval.themeFailure, "Ramadan prompt passes validation");
assert(ramadanEval.themeConsistencyScore >= 85, `Ramadan consistency score: ${ramadanEval.themeConsistencyScore} >= 85`);

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log("\n==================================================");
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
if (passedTests === totalTests) {
  console.log("🎉 ALL THEME LOCK ENGINE TESTS PASSED WITH 100% SUCCESS!");
} else {
  console.error("⚠️ SOME TESTS FAILED. CHECK LOGS ABOVE.");
}
console.log("==================================================");
