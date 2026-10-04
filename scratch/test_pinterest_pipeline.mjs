/**
 * scratch/test_pinterest_pipeline.mjs
 * End-to-end verification of Pinterest Live Research + Theme Lock + Typography Pipeline
 */

import { architectDynamicDesignWithAI } from "../src/lib/whatsapp/designPromptArchitect.ts";

async function testPipeline() {
  console.log("==================================================");
  console.log("🧪 TESTING LIVE PINTEREST RESEARCH PIPELINE");
  console.log("==================================================\n");

  const prompt = "Hari Kartini 2026";
  console.log(`Input User: "${prompt}"\n`);

  const start = Date.now();
  const blueprint = await architectDynamicDesignWithAI(prompt);
  const elapsed = Date.now() - start;

  console.log(`⏱️ Completed in: ${elapsed} ms\n`);
  console.log("📌 PINTEREST RESEARCH REPORT:");
  console.log("- Style Title:", blueprint.pinterest_dna?.pinterestStyleTitle);
  console.log("- Source:", blueprint.pinterest_dna?.source);
  console.log("- Visual Keywords:", blueprint.pinterest_dna?.trendingKeywords);
  console.log("- Color Palette:", blueprint.pinterest_dna?.colorPalette);
  console.log("- Lighting:", blueprint.pinterest_dna?.lightingDNA);

  console.log("\n🎨 COMPILED IMAGE PROMPT:");
  console.log(blueprint.enhancedPrompt);

  console.log("\n🔒 THEME LOCK STATUS:");
  const hasKartini = /kartini|indonesian\s+woman|kebaya|batik/i.test(blueprint.enhancedPrompt);
  const hasBusinessman = /businessman|male\s+executive|corporate\s+office/i.test(blueprint.enhancedPrompt.split(/NEGATIVE PROMPT:/i)[0]);
  console.log("- Has Authentic Kartini Anchor:", hasKartini ? "✅ YES" : "❌ NO");
  console.log("- Has Businessman in Positive Content:", hasBusinessman ? "❌ YES (FAILURE)" : "✅ NO (CLEAN)");

  console.log("\n📐 TYPOGRAPHY BLUEPRINT:");
  console.log("- Headline:", blueprint.typography_blueprint.headline);
  console.log("- Subheadline:", blueprint.typography_blueprint.subheadline);
  console.log("- Font:", blueprint.typography_blueprint.headline_font);

  if (hasKartini && !hasBusinessman && blueprint.pinterest_dna) {
    console.log("\n🎉 ALL CHECKS PASSED: Pinterest Research + Theme Lock working in complete harmony!");
  } else {
    console.error("\n❌ Checks failed");
    process.exitCode = 1;
  }
}

testPipeline();
