import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

describe("Phase 5: Android Release Build Pipeline & Keystore Signing (QA-02)", () => {
  const gradlePath = path.join(ROOT_DIR, "android/app/build.gradle");
  const keyExamplePath = path.join(ROOT_DIR, "android/key.properties.example");
  const gitignorePath = path.join(ROOT_DIR, ".gitignore");
  const pkgJsonPath = path.join(ROOT_DIR, "package.json");
  const batScriptPath = path.join(ROOT_DIR, "scripts/generate-keystore.bat");
  const shScriptPath = path.join(ROOT_DIR, "scripts/generate-keystore.sh");

  test("Android app build.gradle exists with correct namespace and SDK version", () => {
    assert.ok(fs.existsSync(gradlePath), "android/app/build.gradle must exist");
    const gradleContent = fs.readFileSync(gradlePath, "utf8");
    assert.ok(gradleContent.includes('namespace "com.expedient43.app"'), "Must define matching namespace");
    assert.ok(
      gradleContent.includes("targetSdkVersion") && (gradleContent.includes("34") || gradleContent.includes("35")),
      "Must target modern Android SDK 34 or 35 for Google Play Store compliance"
    );
  });

  test("build.gradle configures release signingConfig via key.properties", () => {
    const gradleContent = fs.readFileSync(gradlePath, "utf8");
    assert.ok(gradleContent.includes("keyPropertiesFile"), "Must check for key.properties file");
    assert.ok(gradleContent.includes("signingConfigs"), "Must define signingConfigs block");
    assert.ok(gradleContent.includes("release {"), "Must configure release signing");
    assert.ok(gradleContent.includes("signingConfig signingConfigs.release"), "Must bind release signing to release build");
    assert.ok(gradleContent.includes("minifyEnabled true"), "Must enable Proguard code minification");
    assert.ok(gradleContent.includes("shrinkResources true"), "Must enable resource shrinking");
  });

  test("android/key.properties.example provides template for confidential credentials", () => {
    assert.ok(fs.existsSync(keyExamplePath), "key.properties.example must exist");
    const exampleContent = fs.readFileSync(keyExamplePath, "utf8");
    assert.ok(exampleContent.includes("storePassword"), "Must document storePassword");
    assert.ok(exampleContent.includes("keyPassword"), "Must document keyPassword");
    assert.ok(exampleContent.includes("keyAlias"), "Must document keyAlias");
    assert.ok(exampleContent.includes("storeFile"), "Must document storeFile");
  });

  test(".gitignore protects keystore binaries and key.properties from leaks", () => {
    const gitignore = fs.readFileSync(gitignorePath, "utf8");
    assert.ok(gitignore.includes("*.jks"), "Must ignore *.jks");
    assert.ok(gitignore.includes("*.keystore"), "Must ignore *.keystore");
    assert.ok(gitignore.includes("key.properties"), "Must ignore key.properties");
  });

  test("package.json includes Android release sync and build scripts", () => {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    assert.ok(pkg.scripts["cap:sync"], "Must have cap:sync script");
    assert.ok(pkg.scripts["build:android"], "Must have build:android script");
  });

  test("Keystore generation scripts exist for both Windows and Unix", () => {
    assert.ok(fs.existsSync(batScriptPath), "scripts/generate-keystore.bat must exist");
    assert.ok(fs.existsSync(shScriptPath), "scripts/generate-keystore.sh must exist");
    const batContent = fs.readFileSync(batScriptPath, "utf8");
    const shContent = fs.readFileSync(shScriptPath, "utf8");
    assert.ok(batContent.includes("keytool -genkey"), "Batch script must call keytool");
    assert.ok(shContent.includes("keytool -genkey"), "Bash script must call keytool");
  });
});
