import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateAppUpdate } from "../src/lib/appUpdateLogic.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

describe("AppUpdateChecker version gating & mandatory enforcement", () => {
  test("forces older builds to update when forceUpdate is true even if session was dismissed", () => {
    const payload = {
      latestVersionCode: 6,
      forceUpdate: true,
      minSupportedVersionCode: 6,
    };

    for (const oldCode of [1, 2, 3, 4, 5]) {
      const result = evaluateAppUpdate(payload, oldCode, true);
      assert.equal(result.needsUpdate, true, `Build ${oldCode} must need update`);
      assert.equal(result.isMandatory, true, `Build ${oldCode} must be mandatory`);
      assert.equal(result.shouldShowPrompt, true, `Build ${oldCode} must ignore session dismissal`);
    }
  });

  test("enforces minSupportedVersionCode even when forceUpdate flag is false", () => {
    const payload = {
      latestVersionCode: 7,
      forceUpdate: false,
      minSupportedVersionCode: 6,
    };

    // Builds below minSupportedVersionCode remain mandatory
    const oldBuild = evaluateAppUpdate(payload, 5, true);
    assert.equal(oldBuild.needsUpdate, true);
    assert.equal(oldBuild.isMandatory, true);
    assert.equal(oldBuild.shouldShowPrompt, true);

    // Build 6 meets minSupportedVersionCode so update to 7 is optional & dismissible
    const supportedBuild = evaluateAppUpdate(payload, 6, true);
    assert.equal(supportedBuild.needsUpdate, true);
    assert.equal(supportedBuild.isMandatory, false);
    assert.equal(supportedBuild.shouldShowPrompt, false);
  });

  test("does not prompt when installed version is already up to date", () => {
    const payload = {
      latestVersionCode: 6,
      forceUpdate: true,
      minSupportedVersionCode: 6,
    };

    const upToDate = evaluateAppUpdate(payload, 6, false);
    assert.equal(upToDate.needsUpdate, false);
    assert.equal(upToDate.isMandatory, false);
    assert.equal(upToDate.shouldShowPrompt, false);
  });

  test("AppUpdateChecker uses shared evaluateAppUpdate and prevents mandatory dismissal", () => {
    const src = fs.readFileSync(
      path.join(ROOT_DIR, "src/components/layout/AppUpdateChecker.tsx"),
      "utf8"
    );
    assert.ok(src.includes("evaluateAppUpdate"), "Must share evaluateAppUpdate helper");
    assert.ok(
      src.includes("useDialogEscape(shouldRender, handleDismiss, isMandatoryUpdate)"),
      "Must disable Escape and hardware Back dismissal during mandatory updates"
    );
    assert.ok(
      src.includes("if (isMandatoryUpdate) return;"),
      "handleDismiss must bail out for mandatory updates"
    );
  });

  test("Android native build is bumped to v1.2.4 (Build 6) with dynamic User-Agent version", () => {
    const gradle = fs.readFileSync(path.join(ROOT_DIR, "android/app/build.gradle"), "utf8");
    const mainActivity = fs.readFileSync(
      path.join(ROOT_DIR, "android/app/src/main/java/com/expedient43/app/MainActivity.java"),
      "utf8"
    );
    assert.ok(gradle.includes("versionCode 6"), "versionCode must be bumped to 6");
    assert.ok(gradle.includes('versionName "1.2.4"'), 'versionName must be "1.2.4"');
    assert.ok(
      !mainActivity.includes('ExpedientNativeApp/1.2.2"'),
      "MainActivity User-Agent must not hardcode stale 1.2.2 string"
    );
  });

  test("/api/app-version enforces mandatory update for older builds and points to hosted v1.2.4 APK", async () => {
    const { GET } = await import("../src/app/api/app-version/route.ts");
    const response = await GET();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.latestVersionCode, 6);
    assert.equal(body.latestVersionName, "1.2.4");
    assert.equal(body.forceUpdate, true);
    assert.equal(body.minSupportedVersionCode, 6);
    assert.ok(body.apkUrl.startsWith("https://"), "apkUrl must be an HTTPS URL");
    assert.ok(body.apkUrl.includes("Expedient43-v1.2.4.apk"), "apkUrl must point to v1.2.4 APK");
  });
});
