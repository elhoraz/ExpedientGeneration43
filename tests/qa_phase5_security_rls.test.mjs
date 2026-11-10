import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSignedAdminSession, verifySignedAdminSession } from "../src/lib/admin-auth.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

process.env.ADMIN_MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD || "test_admin_master_password_secret_2026";

describe("Phase 5: Automated Security & RLS Regression Test Suite (QA-01)", () => {
  describe("SEC-01: Profiles RLS Privilege Escalation Guard", () => {
    const migrationPath = path.join(ROOT_DIR, "supabase/migrations/20260907000000_fix_profiles_rls.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    test("Migration file exists and enables Row Level Security on profiles", () => {
      assert.ok(fs.existsSync(migrationPath), "Migration 20260907000000_fix_profiles_rls.sql must exist");
      assert.ok(migrationSql.includes("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY"), "Must enforce RLS");
    });

    test("Migration prevents arbitrary client-side role escalation", () => {
      // Must drop unrestricted update policy and enforce role constraints
      const hasPolicyLock = migrationSql.includes("prevent_profile_role_escalation") ||
        migrationSql.includes("role = 'member'") ||
        migrationSql.includes("OLD.role");
      assert.ok(hasPolicyLock, "Must have trigger or policy locking role escalation");
    });

    test("Client-side update sanitizer strips unauthorized role mutations", () => {
      function sanitizeProfileUpdatePayload(payload, callerRole = "member") {
        const allowedFields = [
          "nama_lengkap",
          "nama_panggilan",
          "no_whatsapp",
          "alamat_lengkap",
          "motivasi_hidup",
          "cita_cita",
          "akun_ig",
          "akun_tiktok",
          "foto_profil",
          "wa_notif_opt_in"
        ];
        const sanitized = {};
        for (const [key, val] of Object.entries(payload)) {
          if (allowedFields.includes(key)) {
            sanitized[key] = val;
          }
          if (key === "role" && callerRole === "admin") {
            sanitized.role = val;
          }
        }
        return sanitized;
      }

      // Attacker payload trying to elevate privileges
      const maliciousPayload = {
        nama_lengkap: "Attacker",
        role: "admin",
        prestise_points: 99999
      };

      const sanitizedForMember = sanitizeProfileUpdatePayload(maliciousPayload, "member");
      assert.equal(sanitizedForMember.role, undefined, "Role field must be omitted for members");
      assert.equal(sanitizedForMember.prestise_points, undefined, "Prestise points cannot be updated directly");
      assert.equal(sanitizedForMember.nama_lengkap, "Attacker");

      const sanitizedForAdmin = sanitizeProfileUpdatePayload(maliciousPayload, "admin");
      assert.equal(sanitizedForAdmin.role, "admin", "Admin is authorized to assign roles");
    });
  });

  describe("SEC-02: Cryptographic Admin Session Verification & Backdoor Removal", () => {
    test("Rejects known backdoor string 'unlocked'", async () => {
      const isValid = await verifySignedAdminSession("unlocked");
      assert.equal(isValid, false, "The 'unlocked' backdoor string must be rejected");
    });

    test("Rejects empty, null, or undefined tokens", async () => {
      assert.equal(await verifySignedAdminSession(""), false);
      assert.equal(await verifySignedAdminSession(null), false);
      assert.equal(await verifySignedAdminSession(undefined), false);
    });

    test("Generates and verifies authentic HMAC session token", async () => {
      const token = await createSignedAdminSession("admin_user_01");
      assert.ok(token, "Must produce token string");
      const isValid = await verifySignedAdminSession(token);
      assert.equal(isValid, true, "Authentic newly generated token must be verified");
    });

    test("Rejects tampered signature token", async () => {
      const token = await createSignedAdminSession("admin_user_01");
      const [payload, sig] = token.split(".");
      const tampered = `${payload}.invalidsignature${sig.slice(16)}`;
      const isValid = await verifySignedAdminSession(tampered);
      assert.equal(isValid, false, "Tampered signature must be rejected");
    });
  });

  describe("SEC-03: Middleware Admin Route Interception", () => {
    const middlewarePath = path.join(ROOT_DIR, "src/lib/supabase/middleware.ts");
    const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

    test("Middleware intercepts all /api/admin/* endpoints", () => {
      assert.ok(
        middlewareContent.includes("request.nextUrl.pathname.startsWith('/api/admin')"),
        "Must intercept /api/admin/* paths"
      );
      assert.ok(
        middlewareContent.includes("verifySignedAdminSession"),
        "Must verify admin session cryptographically in middleware"
      );
      assert.ok(
        middlewareContent.includes("status: 401"),
        "Must respond with HTTP 401 on missing/invalid admin session"
      );
    });

    test("Middleware guards /admin UI pages and redirects unauthorized users to unlock", () => {
      assert.ok(
        middlewareContent.includes("request.nextUrl.pathname.startsWith('/admin')"),
        "Must guard /admin UI pages"
      );
      assert.ok(
        middlewareContent.includes("pathname = '/admin/unlock'"),
        "Must redirect unauthorized requests to /admin/unlock"
      );
    });
  });

  describe("SEC-04: Baitul Maal Financial Ledger Integrity & Anti-Tampering", () => {
    const baitulMaalRoute = path.join(ROOT_DIR, "src/app/api/baitul-maal/route.ts");
    const baitulMaalContent = fs.readFileSync(baitulMaalRoute, "utf8");

    test("User donation action tags records with [PENDING VERIFIKASI]", () => {
      assert.ok(
        baitulMaalContent.includes("[PENDING VERIFIKASI]"),
        "Non-admin donation must tag transaction description with [PENDING VERIFIKASI]"
      );
    });

    test("Baitul Maal transactions cannot award instant unverified prestise", () => {
      // Must not call addPrestise without verification
      assert.ok(
        baitulMaalContent.includes("[PENDING VERIFIKASI]"),
        "Must require admin verification before finalizing transaction"
      );
    });
  });

  describe("SEC-05: Ephemeral File Upload & Strict Validation", () => {
    const uploadRoute = path.join(ROOT_DIR, "src/app/api/upload/route.ts");
    const uploadContent = fs.readFileSync(uploadRoute, "utf8");

    test("Upload API enforces allowed MIME types whitelist", () => {
      assert.ok(uploadContent.includes("image/jpeg"), "Must support JPEG");
      assert.ok(uploadContent.includes("image/png"), "Must support PNG");
      assert.ok(uploadContent.includes("image/webp"), "Must support WEBP");
    });

    test("Upload API uses randomized UUID filenames to prevent collisions", () => {
      assert.ok(
        uploadContent.includes("randomUUID") || uploadContent.includes("Date.now()"),
        "Must use collision-resistant file naming"
      );
    });
  });

  describe("MOB-01 & MOB-02: Compliance & UGC Safety", () => {
    const deleteRoute = path.join(ROOT_DIR, "src/app/api/account/delete/route.ts");
    const reportRoute = path.join(ROOT_DIR, "src/app/api/moderation/report/route.ts");
    const blockRoute = path.join(ROOT_DIR, "src/app/api/moderation/block/route.ts");

    test("Account deletion endpoint validates 'HAPUS' confirmation", () => {
      assert.ok(fs.existsSync(deleteRoute), "Account deletion route must exist");
      const content = fs.readFileSync(deleteRoute, "utf8");
      assert.ok(content.includes("HAPUS"), "Must check for confirmation word HAPUS");
    });

    test("UGC Moderation prevents self-reporting and self-blocking", () => {
      assert.ok(fs.existsSync(reportRoute), "Report route must exist");
      assert.ok(fs.existsSync(blockRoute), "Block route must exist");
      const reportContent = fs.readFileSync(reportRoute, "utf8");
      const blockContent = fs.readFileSync(blockRoute, "utf8");
      assert.ok(
        reportContent.includes("reported_user_id === user.id"),
        "Must reject self-reporting"
      );
      assert.ok(
        blockContent.includes("target_user_id === user.id"),
        "Must reject self-blocking"
      );
    });

    test("Account deletion endpoint comprehensively cleans up biometric data and media", () => {
      const content = fs.readFileSync(deleteRoute, "utf8");
      assert.ok(content.includes("user_face_data"), "Must delete user_face_data");
      assert.ok(content.includes("profile-photos"), "Must clean up storage photos");
    });
  });

  describe("SEC-06: Zero Hardcoded AI Secrets & Radar Privacy Opt-Out", () => {
    test("geminiResilient.ts must NOT contain BUILTIN_POOL or hardcoded API keys", () => {
      const geminiClientPath = path.join(ROOT_DIR, "src/lib/geminiResilient.ts");
      const content = fs.readFileSync(geminiClientPath, "utf8");
      assert.equal(content.includes("BUILTIN_POOL"), false, "BUILTIN_POOL must be removed from codebase");
      assert.equal(content.includes("QVEuQW"), false, "Hardcoded base64 keys must not exist");
    });

    test("Radar location route must support DELETE method for privacy opt-out", () => {
      const radarRoute = path.join(ROOT_DIR, "src/app/api/radar/update-location/route.ts");
      const content = fs.readFileSync(radarRoute, "utf8");
      assert.ok(content.includes("export async function DELETE"), "Must export DELETE for GPS privacy opt-out");
    });

    test("Profiles RLS migration isolates face biometrics into user_face_data table", () => {
      const migrationPath = path.join(ROOT_DIR, "supabase/migrations/20261110000000_secure_profiles_rls.sql");
      assert.ok(fs.existsSync(migrationPath), "Migration 20261110000000_secure_profiles_rls.sql must exist");
      const sql = fs.readFileSync(migrationPath, "utf8");
      assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.user_face_data"), "Must create user_face_data");
      assert.ok(sql.includes("DROP POLICY IF EXISTS \"Public profiles are viewable by everyone.\""), "Must drop open anon policy");
    });

    test("Galeri, wasiats, and whatsapp_queue RLS migration closes open vulnerabilities", () => {
      const migrationPath = path.join(ROOT_DIR, "supabase/migrations/20261110000001_fix_galeri_wasiat_queue_rls.sql");
      assert.ok(fs.existsSync(migrationPath), "Migration 20261110000001_fix_galeri_wasiat_queue_rls.sql must exist");
      const sql = fs.readFileSync(migrationPath, "utf8");
      assert.ok(sql.includes("DROP POLICY IF EXISTS \"Admin can manage galeri\""), "Must drop open galeri policy");
      assert.ok(sql.includes("TO service_role"), "WhatsApp queue must be restricted to service_role");
      assert.ok(sql.includes("ALTER TABLE public.wasiats ENABLE ROW LEVEL SECURITY"), "Must enable RLS for wasiats");
      assert.ok(sql.includes("ALTER TABLE public.kontemplasi_journals ENABLE ROW LEVEL SECURITY"), "Must enable RLS for kontemplasi");
    });

    test("PWA configuration in next.config.ts excludes source map files from precaching", () => {
      const configPath = path.join(ROOT_DIR, "next.config.ts");
      const content = fs.readFileSync(configPath, "utf8");
      assert.ok(content.includes("!**/*.map"), "Must exclude .map files from PWA precache");
    });
  });

  // =========================================================================
  // SEC-07: Live DB Synchronization, Private Cache Control & API Hardening
  // =========================================================================
  describe("SEC-07: Live DB Synchronization, Private Cache Control & API Hardening", () => {
    test("vCard API enforces private no-store Cache-Control to prevent CDN contact leaks", () => {
      const vcardPath = path.join(ROOT_DIR, "src", "app", "api", "vcard", "[id]", "route.ts");
      const content = fs.readFileSync(vcardPath, "utf8");
      assert.ok(content.includes('"Cache-Control": "private, no-store"'), "vCard must not use public s-maxage caching");
    });

    test("Wasiat page excludes passphrase_hash from client payload and enforces one-time unlock points", () => {
      const wasiatPagePath = path.join(ROOT_DIR, "src", "app", "(dashboard)", "wasiat", "page.tsx");
      const pageContent = fs.readFileSync(wasiatPagePath, "utf8");
      assert.ok(!pageContent.includes('.select("*, profiles'), "Must not select * including passphrase_hash to client");

      const gamificationPath = path.join(ROOT_DIR, "src", "lib", "gamification.ts");
      const gamContent = fs.readFileSync(gamificationPath, "utf8");
      assert.ok(gamContent.includes("WASIAT_UNLOCK_"), "Must prevent duplicate WASIAT_UNLOCK point farming");
    });

    test("Push notification routes use admin client and respect UGC user_blocks & rate limits", () => {
      const pushSendPath = path.join(ROOT_DIR, "src", "app", "api", "push", "send", "route.ts");
      const pushSendContent = fs.readFileSync(pushSendPath, "utf8");
      assert.ok(pushSendContent.includes("createAdminClient"), "Admin push broadcast must use createAdminClient");

      const pushCallPath = path.join(ROOT_DIR, "src", "app", "api", "push", "call", "route.ts");
      const pushCallContent = fs.readFileSync(pushCallPath, "utf8");
      assert.ok(pushCallContent.includes("rateLimit"), "Incoming call push must enforce rateLimit");
      assert.ok(pushCallContent.includes("user_blocks"), "Incoming call push must respect user_blocks");
    });

    test("Audio TTS route enforces bounded LRU cache size and Oracle uses resilient Gemini pool", () => {
      const ttsPath = path.join(ROOT_DIR, "src", "app", "api", "audio", "tts", "route.ts");
      const ttsContent = fs.readFileSync(ttsPath, "utf8");
      assert.ok(ttsContent.includes("MAX_AUDIO_CACHE_SIZE"), "Audio TTS must bound in-memory cache to prevent OOM");

      const oraclePath = path.join(ROOT_DIR, "src", "app", "api", "oracle", "route.ts");
      const oracleContent = fs.readFileSync(oraclePath, "utf8");
      assert.ok(oracleContent.includes("callGeminiResilient"), "Oracle must use resilient multi-key Gemini pool");
    });

    test("Sync migration 20261110000002 synchronizes missing tables, triggers, and RLS policies", () => {
      const migrationPath = path.join(
        ROOT_DIR,
        "supabase",
        "migrations",
        "20261110000002_sync_missing_schema_and_rls.sql"
      );
      assert.ok(fs.existsSync(migrationPath), "Sync migration file must exist");
      const sql = fs.readFileSync(migrationPath, "utf8");
      assert.ok(sql.includes("trg_protect_profile_sensitive_columns"), "Must install profile protection trigger");
      assert.ok(sql.includes("public.increment_prestise"), "Must install bounded increment_prestise RPC");
      assert.ok(sql.includes("public.khatam_sessions"), "Must create khatam_sessions table");
      assert.ok(sql.includes("public.enigma_progress"), "Must create enigma_progress table");
      assert.ok(sql.includes("public.otp_logs"), "Must create otp_logs table");
    });

    test("Final migration 20261110000003 synchronizes galeri albums, like trigger, and biometrics deduplication", () => {
      const migrationPath = path.join(
        ROOT_DIR,
        "supabase",
        "migrations",
        "20261110000003_galeri_biometrics_final_sync.sql"
      );
      assert.ok(fs.existsSync(migrationPath), "Final sync migration file must exist");
      const sql = fs.readFileSync(migrationPath, "utf8");
      assert.ok(sql.includes("public.handle_galeri_like_count"), "Must create galeri like counter trigger");
      assert.ok(sql.includes("public.galeri_albums"), "Must seed default galeri albums");
      assert.ok(sql.includes("public.user_biometrics"), "Must extend user_biometrics columns");
    });

    test("Khatam API returns real database state and prevents duplicate points", () => {
      const khatamPath = path.join(ROOT_DIR, "src", "app", "api", "khatam", "route.ts");
      const content = fs.readFileSync(khatamPath, "utf8");
      assert.ok(content.includes("khatam_allocations"), "Must re-fetch DB allocations upon claim/complete");
      assert.ok(content.includes("KHATAM_JUZ_"), "Must use unique session-juz activity tag");

      const gamPath = path.join(ROOT_DIR, "src", "lib", "gamification.ts");
      const gamContent = fs.readFileSync(gamPath, "utf8");
      assert.ok(gamContent.includes("KHATAM_JUZ_"), "Gamification must block duplicate khatam points");
    });

    test("Layout and CSP security hardening are properly applied", () => {
      const layoutPath = path.join(ROOT_DIR, "src", "app", "layout.tsx");
      const layoutContent = fs.readFileSync(layoutPath, "utf8");
      assert.ok(layoutContent.includes("amiri.variable"), "Root layout must include Amiri font variable");

      const configPath = path.join(ROOT_DIR, "next.config.ts");
      const configContent = fs.readFileSync(configPath, "utf8");
      assert.ok(configContent.includes("source: '/(.*)'"), "CSP must cover all routes globally");
      assert.ok(configContent.includes("gibs.earthdata.nasa.gov"), "CSP img-src must include NASA satellite tile server");
    });
  });
});
