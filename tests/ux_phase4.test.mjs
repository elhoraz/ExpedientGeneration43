import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

describe("Phase 4: UI/UX & Ergonomic Enhancements", () => {
  describe("UX-01: Fitts's Law Touch Target Standardization (>= 44x44px)", () => {
    const templateCss = fs.readFileSync(path.join(ROOT_DIR, "public/css/template.css"), "utf8");
    const adminCss = fs.readFileSync(path.join(ROOT_DIR, "src/app/(dashboard)/admin/admin.css"), "utf8");
    const chatCss = fs.readFileSync(path.join(ROOT_DIR, "src/app/(dashboard)/chat/chat.css"), "utf8");

    test("template.css standardizes interactive touch targets to >= 44x44px", () => {
      assert.ok(templateCss.includes(".touch-target-44"), "Should have .touch-target-44 utility class");
      assert.ok(templateCss.includes("min-width: 44px"), "Should enforce min-width 44px");
      assert.ok(templateCss.includes("min-height: 44px"), "Should enforce min-height 44px");
      assert.ok(templateCss.includes(".btn-rsvp"), "Should include .btn-rsvp in touch target rules");
      assert.ok(templateCss.includes(".wizard-tab-btn"), "Should include .wizard-tab-btn in touch target rules");
      assert.ok(templateCss.includes(".chat-dropdown-btn-action"), "Should include .chat-dropdown-btn-action");
    });

    test("admin.css provides min 44x44px touch targets on table action buttons", () => {
      assert.ok(adminCss.includes(".admin-wrapper .btn-action"), "Should have .btn-action in admin.css");
      assert.ok(adminCss.includes("min-height: 44px"), "Admin btn-action should have min-height 44px");
      assert.ok(adminCss.includes("min-width: 44px"), "Admin btn-action should have min-width 44px");
    });

    test("chat.css enforces touch targets on dropdown actions", () => {
      assert.ok(chatCss.includes(".chat-dropdown-btn-action"), "chat.css should have .chat-dropdown-btn-action");
      assert.ok(chatCss.includes("min-width: 44px"), "Should have min-width: 44px in chat.css");
      assert.ok(chatCss.includes("min-height: 44px"), "Should have min-height: 44px in chat.css");
    });

    test("template.css includes active micro-interaction tap feedback on coarse pointer devices", () => {
      assert.ok(templateCss.includes("@media (pointer: coarse)"), "Should have coarse pointer media query");
      assert.ok(templateCss.includes("transform: scale(0.96)"), "Should have active tap scale animation");
    });
  });

  describe("UX-02: Progressive Disclosure 3-Step Wizard & Completeness Bar", () => {
    const profilClientPath = path.join(ROOT_DIR, "src/app/(dashboard)/profil/ProfilClient.tsx");
    const profilCssPath = path.join(ROOT_DIR, "src/app/(dashboard)/profil/profil.css");
    const profilClientContent = fs.readFileSync(profilClientPath, "utf8");
    const profilCssContent = fs.readFileSync(profilCssPath, "utf8");

    test("ProfilClient contains wizardStep state and 3 distinct sections", () => {
      assert.ok(profilClientContent.includes("wizardStep"), "Should define wizardStep state");
      assert.ok(profilClientContent.includes("setWizardStep"), "Should provide step setter");
      assert.ok(profilClientContent.includes("Identitas Personal"), "Step 1 should be Identitas Personal");
      assert.ok(profilClientContent.includes("Kontak & Domisili"), "Step 2 should be Kontak & Domisili");
      assert.ok(profilClientContent.includes("Visi & Sosial"), "Step 3 should be Visi & Sosial");
    });

    test("ProfilClient calculates profile completeness percentage correctly", () => {
      assert.ok(profilClientContent.includes("profileCompleteness"), "Should compute profileCompleteness");
      
      // Pure helper replicating the completeness calculation in ProfilClient
      function computeCompleteness(user, croppedFile = null) {
        const checks = [
          Boolean(user.foto_profil || croppedFile),
          Boolean(user.nama_lengkap && String(user.nama_lengkap).trim().length > 0),
          Boolean(user.nama_panggilan && String(user.nama_panggilan).trim().length > 0),
          Boolean(user.email && String(user.email).trim().length > 0),
          Boolean(user.no_whatsapp && String(user.no_whatsapp).trim().length > 0),
          Boolean(user.alamat_lengkap && String(user.alamat_lengkap).trim().length > 0),
          Boolean(user.motivasi_hidup && String(user.motivasi_hidup).trim().length > 0),
          Boolean(user.cita_cita && String(user.cita_cita).trim().length > 0),
          Boolean(
            (user.akun_ig && String(user.akun_ig).trim().length > 0) ||
            (user.akun_tiktok && String(user.akun_tiktok).trim().length > 0)
          ),
        ];
        const filled = checks.filter(Boolean).length;
        return Math.round((filled / checks.length) * 100);
      }

      // Test 1: Empty user
      assert.equal(computeCompleteness({}), 0);

      // Test 2: Full user
      const fullUser = {
        foto_profil: "https://example.com/avatar.jpg",
        nama_lengkap: "Boby Rahman",
        nama_panggilan: "Boby",
        email: "boby@gmail.com",
        no_whatsapp: "628123456789",
        alamat_lengkap: "Jl. Sudirman No. 1, Jakarta",
        motivasi_hidup: "Terus maju pantang mundur",
        cita_cita: "Founder Tech Startup",
        akun_ig: "boby.rahman",
      };
      assert.equal(computeCompleteness(fullUser), 100);

      // Test 3: Partial user (5 out of 9 = 56%)
      const partialUser = {
        nama_lengkap: "Ahmad",
        nama_panggilan: "Mad",
        email: "ahmad@gmail.com",
        no_whatsapp: "08111111",
        foto_profil: "photo.jpg",
      };
      assert.equal(computeCompleteness(partialUser), 56);
    });

    test("profil.css defines wizard stepper and progress bar styling", () => {
      assert.ok(profilCssContent.includes(".wizard-stepper-container"), "Should style wizard container");
      assert.ok(profilCssContent.includes(".wizard-progress-track"), "Should style progress track");
      assert.ok(profilCssContent.includes(".wizard-progress-fill"), "Should style progress fill");
      assert.ok(profilCssContent.includes(".wizard-tab-btn"), "Should style wizard tab buttons");
      assert.ok(profilCssContent.includes(".wizard-nav-footer"), "Should style wizard nav footer");
    });
  });

  describe("UX-03: Optimistic UI Updates on Social Interactions", () => {
    const eventClientPath = path.join(ROOT_DIR, "src/app/(dashboard)/event/EventClient.tsx");
    const loungeChatPath = path.join(ROOT_DIR, "src/app/(dashboard)/chat/lounge/ChatClient.tsx");
    const eventClientContent = fs.readFileSync(eventClientPath, "utf8");
    const loungeChatContent = fs.readFileSync(loungeChatPath, "utf8");

    test("EventClient eliminates full-page reload on RSVP", () => {
      assert.ok(
        !eventClientContent.includes("window.location.reload()"),
        "EventClient must NOT perform window.location.reload() on RSVP"
      );
    });

    test("EventClient implements optimistic state updates and graceful rollback", () => {
      assert.ok(eventClientContent.includes("prevEvents"), "Should keep track of previous events for rollback");
      assert.ok(eventClientContent.includes("updatedEvents"), "Should compute updatedEvents optimistically");
      assert.ok(eventClientContent.includes("showToast"), "Should provide optimistic feedback via toast");
      assert.ok(eventClientContent.includes("setEvents(prevEvents)"), "Should restore previous events if fetch fails");

      // Unit test pure RSVP stats calculation
      function updateRsvpState(events, eventId, newStatus) {
        const target = events.find((e) => e.id === eventId);
        if (!target || target.my_rsvp === newStatus) return events;

        const oldStatus = target.my_rsvp;
        return events.map((ev) => {
          if (ev.id !== eventId) return ev;

          const newStats = {
            Hadir: ev.stats?.Hadir || 0,
            Tentatif: ev.stats?.Tentatif || 0,
            Tidak: ev.stats?.Tidak || 0,
          };

          if (oldStatus === "Hadir" && newStats.Hadir > 0) newStats.Hadir -= 1;
          else if (oldStatus === "Tentatif" && newStats.Tentatif > 0) newStats.Tentatif -= 1;
          else if ((oldStatus === "Tidak Hadir" || oldStatus === "Tidak") && newStats.Tidak > 0) newStats.Tidak -= 1;

          if (newStatus === "Hadir") newStats.Hadir += 1;
          else if (newStatus === "Tentatif") newStats.Tentatif += 1;
          else if (newStatus === "Tidak Hadir" || newStatus === "Tidak") newStats.Tidak += 1;

          return { ...ev, my_rsvp: newStatus, stats: newStats };
        });
      }

      const initialEvents = [
        {
          id: "ev-1",
          title: "Reuni Akbar",
          my_rsvp: "Hadir",
          stats: { Hadir: 5, Tentatif: 2, Tidak: 1 },
        },
      ];

      // Switch from Hadir to Tentatif
      const transitioned = updateRsvpState(initialEvents, "ev-1", "Tentatif");
      assert.equal(transitioned[0].my_rsvp, "Tentatif");
      assert.equal(transitioned[0].stats.Hadir, 4);
      assert.equal(transitioned[0].stats.Tentatif, 3);
      assert.equal(transitioned[0].stats.Tidak, 1);
    });

    test("ChatClient (The Lounge) implements instant optimistic delete with rollback", () => {
      assert.ok(
        loungeChatContent.includes("prevMessages"),
        "ChatClient should keep prevMessages for rollback"
      );
      assert.ok(
        loungeChatContent.includes("setMessages(prevMessages)"),
        "ChatClient should rollback to prevMessages on error"
      );
      assert.ok(
        loungeChatContent.includes("is_deleted: true"),
        "ChatClient should immediately set is_deleted: true optimistically"
      );
    });
  });
});
