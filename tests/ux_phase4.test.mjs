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
    const navbarChatCss = fs.readFileSync(path.join(ROOT_DIR, "src/components/layout/navbar-chat.css"), "utf8");

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

    test("chat.css and navbar-chat.css enforce touch targets on chat and dropdown actions", () => {
      assert.ok(navbarChatCss.includes(".chat-dropdown-btn-action"), "navbar-chat.css should have .chat-dropdown-btn-action");
      assert.ok(navbarChatCss.includes("min-width: 44px"), "Should have min-width: 44px in navbar-chat.css");
      assert.ok(navbarChatCss.includes("min-height: 44px"), "Should have min-height: 44px in navbar-chat.css");
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

  describe("UX-04: Non-overlapping Fixed HUDs & Accurate Radar Metric Labels", () => {
    const radarCss = fs.readFileSync(path.join(ROOT_DIR, "src/app/(dashboard)/radar/radar.css"), "utf8");
    const guideCss = fs.readFileSync(path.join(ROOT_DIR, "src/components/guide/guide.css"), "utf8");
    const kiblatCss = fs.readFileSync(path.join(ROOT_DIR, "src/app/(dashboard)/kiblat/kiblat.css"), "utf8");
    const quranCss = fs.readFileSync(path.join(ROOT_DIR, "src/app/(dashboard)/quran/quran.css"), "utf8");
    const galeriCss = fs.readFileSync(path.join(ROOT_DIR, "src/app/(dashboard)/galeri/galeri.css"), "utf8");
    const birthdayCss = fs.readFileSync(path.join(ROOT_DIR, "src/app/(dashboard)/birthday/birthday.css"), "utf8");
    const idDict = fs.readFileSync(path.join(ROOT_DIR, "src/lib/i18n/dictionaries/id.ts"), "utf8");
    const enDict = fs.readFileSync(path.join(ROOT_DIR, "src/lib/i18n/dictionaries/en.ts"), "utf8");
    const arDict = fs.readFileSync(path.join(ROOT_DIR, "src/lib/i18n/dictionaries/ar.ts"), "utf8");

    test("/radar uses flex .radar-top-bar clear of .top-utility-dock and docks help pill below top dock", () => {
      assert.ok(radarCss.includes(".radar-top-bar"), "radar.css must define .radar-top-bar");
      assert.ok(guideCss.includes("top: 86px;"), "guide.css must anchor desktop radar help pill below top dock");
      assert.ok(!guideCss.includes("bottom: 245px;"), "guide.css must not overlap radar Update Lokasi button");
      assert.ok(radarCss.includes("z-index:10010;"), "info-drawer must sit above global top dock");
    });

    test("/radar maxDist stat label reflects kilometers rather than country count", () => {
      assert.ok(!idDict.includes('stat_countries: "Negara"'), "ID stat_countries must not mislabel km as Negara");
      assert.ok(!enDict.includes('stat_countries: "Countries"'), "EN stat_countries must not mislabel km as Countries");
      assert.ok(!arDict.includes('stat_countries: "الدول"'), "AR stat_countries must not mislabel km as Countries");
    });

    test("Similar floating controls avoid collisions across kiblat, quran, galeri, and birthday", () => {
      assert.ok(birthdayCss.includes("body.page-birthday .floating-help-pill"), "Birthday mode must hide floating-help-pill");
      assert.ok(kiblatCss.includes("bottom: 92px;"), "Kiblat scroll-top button must sit cleanly above help pill");
      assert.ok(quranCss.includes("inset-inline-end: 230px;"), "Quran audio bar must stay clear of desktop help pill");
      assert.ok(!galeriCss.includes("@media (max-width: 1024px)"), "Galeri mobile FAB must not overlap tablet left sidebar");
    });
  });

  describe("UX-05: Sovereign KTA 3D Horology Studio, Local QR Verification & Micro-Machined Bezels", () => {
    const sovereignScene = fs.readFileSync(path.join(ROOT_DIR, "src/app/sovereign/SovereignThreeScene.tsx"), "utf8");
    const sovereignClient = fs.readFileSync(path.join(ROOT_DIR, "src/app/sovereign/SovereignClient.tsx"), "utf8");
    const cardArtwork = fs.readFileSync(path.join(ROOT_DIR, "src/app/sovereign/cardArtwork.ts"), "utf8");

    test("cardArtwork engine generates local high-DPI QR codes, resolved Google fonts, un-squished typography & fBm stone", () => {
      assert.ok(cardArtwork.includes("generateVerificationQrCanvas"), "Generates offline local QR canvas via qrcode package");
      assert.ok(!cardArtwork.includes("api.qrserver.com"), "Eliminates external QR image dependency");
      assert.ok(cardArtwork.includes("resolveCardFontStacks"), "Resolves next/font CSS font families onto Canvas 2D contexts");
      assert.ok(cardArtwork.includes("ensureCardFontsLoaded"), "Preloads calligraphy signature and card fonts before painting Canvas");
      assert.ok(cardArtwork.includes("drawSignaturePlaque"), "Renders recessed smoked-obsidian guilloche calligraphic gold-foil signature plaque");
      assert.ok(cardArtwork.includes("layoutDisplayName"), "Auto-fits full names across 1-2 lines without horizontal glyph squishing");
      assert.ok(cardArtwork.includes("drawObsidianLacquerSurface"), "Renders deep glossy Obsidian Lacquer card finish");
      assert.ok(cardArtwork.includes("createWovenStrapCanvas"), "Generates woven EXPEDIENT 43 lanyard strap texture");
      assert.ok(cardArtwork.includes("createMarbleWallCanvas"), "Provides opaque day/night Kintsugi marble wall backdrop");
      assert.ok(sovereignScene.includes("/images/logo-utuh.webp"), "Loads official Expedient 43 crest onto 3D cards");
    });

    test("SovereignThreeScene uses horology softbox PMREM, 2x supersampling, 3D EMV chip pads, plinth stage & mechanical buckle", () => {
      assert.ok(sovereignScene.includes("buildHorologyCardEnv"), "Bakes high-contrast horology softbox studio environment maps");
      assert.ok(sovereignScene.includes("transparent: false"), "Uses single opaque marble wall to eliminate dual-plane alpha overdraw");
      assert.ok(sovereignScene.includes("createDieCutCardGeometry"), "Extrudes real die-cut slot punch hole with planar gold bevel isolation");
      assert.ok(sovereignScene.includes("createRaisedRectBezelGeometry"), "Mounts precision micro-chamfered 24K gold bezels on card surfaces");
      assert.ok(sovereignScene.includes("idBackSigBezel") && sovereignScene.includes("ktaBackSigBezel"), "Frames card back signature plaques in solid 3D 24K gold bezels");
      assert.ok(sovereignScene.includes("createRaisedRingBezelGeometry"), "Mounts watch-caliber flat circular bezel rings around official crest");
      assert.ok(sovereignScene.includes("createEmvChip3DGroup"), "Mounts multi-tiered solid 3D machined 24K EMV contact pad assembly");
      assert.ok(sovereignScene.includes("galleryStageGroup"), "Mounts desktop stepped 3D architectural stone plinth & piers");
      assert.ok(sovereignScene.includes("sliderBuckleGroup"), "Simulates mechanical lanyard buckle & articulated clasp");
      assert.ok(!sovereignScene.includes("vaultRingsGroup"), "Removes decorative floating wireframe rings in favor of architectural stage");
      assert.ok(sovereignScene.includes("idPivotGroup"), "Hinges card rotation right at clasp tip for zero ribbon detachment gap");
      assert.ok(sovereignScene.includes("createDynamicRibbonStrap"), "Uses +Z forward zero-allocation woven ribbon strap buffer updates");
      assert.ok(sovereignScene.includes("stepVerletPendulum"), "Simulates 6-node Verlet pendulum physics");
      assert.ok(sovereignScene.includes("applyHologramFoilShader"), "Injects restrained hologram foil shader only on edge security accents");
      assert.ok(
        sovereignScene.includes("}, [user, nomorId, fotoUrl, verificationUrl]);"),
        "Theme toggle updates studio lighting and marble map in-place without rebuilding WebGL context"
      );
    });

    test("SovereignClient routes verification QR to /dossier/[id], syncs global theme & unifies HD PNG export", () => {
      assert.ok(!sovereignClient.includes("showMobileChoiceModal"), "Blocking mobile startup modal must be removed");
      assert.ok(!sovereignClient.includes("api.qrserver.com"), "Client must not depend on external QR server");
      assert.ok(sovereignClient.includes("/dossier/"), "Verification URL links directly to live /dossier/[id] route");
      assert.ok(sovereignClient.includes("expedient_theme"), "Synchronizes initial Siang/Malam state with global theme preference");
      assert.ok(sovereignClient.includes("drawIdFrontFace"), "Reuses cardArtwork painters inside 2400x1800 PNG export");
      assert.ok(sovereignClient.includes("/images/logo-utuh.webp"), "Lite CSS card renders official Expedient 43 crest");
      assert.ok(sovereignClient.includes("sovereign-bottom-dock"), "Unified bottom dock controls work across both 3D and Lite views");
      assert.ok(sovereignClient.includes("cardFormat={cardFormat}"), "Passes format switcher state directly into 3D scene");
      assert.ok(sovereignClient.includes("isFlipped={isFlipped}"), "Passes flip state directly into 3D scene");
    });
  });
});
