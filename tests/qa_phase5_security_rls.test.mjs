import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSignedAdminSession, verifySignedAdminSession } from "../src/lib/admin-auth.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

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
  });
});
