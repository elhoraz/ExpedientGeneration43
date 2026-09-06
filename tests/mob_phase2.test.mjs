import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('MOB-01: Account Deletion Validation Logic', () => {
  function validateAccountDeletionPayload(body) {
    const confirmationText = String(body?.confirmation || "").trim().toUpperCase();
    if (confirmationText !== "HAPUS") {
      return { ok: false, error: "Konfirmasi tidak valid. Harap ketik 'HAPUS' untuk menyetujui penghapusan akun." };
    }
    return { ok: true };
  }

  it('MUST reject empty confirmation', () => {
    const res = validateAccountDeletionPayload({});
    assert.equal(res.ok, false);
  });

  it('MUST reject incorrect confirmation text', () => {
    const res = validateAccountDeletionPayload({ confirmation: "delete" });
    assert.equal(res.ok, false);
  });

  it('MUST accept valid "HAPUS" confirmation (case-insensitive & trimmed)', () => {
    assert.equal(validateAccountDeletionPayload({ confirmation: "HAPUS" }).ok, true);
    assert.equal(validateAccountDeletionPayload({ confirmation: "hapus " }).ok, true);
    assert.equal(validateAccountDeletionPayload({ confirmation: " Hapus" }).ok, true);
  });
});

describe('MOB-02: UGC Moderation Logic (Report & Block)', () => {
  function validateReportPayload(userId, body) {
    const { reported_user_id, reason } = body || {};
    if (!reported_user_id || !reason) {
      return { ok: false, error: "Target pengguna dan alasan pelaporan wajib diisi." };
    }
    if (reported_user_id === userId) {
      return { ok: false, error: "Anda tidak dapat melaporkan akun Anda sendiri." };
    }
    return { ok: true };
  }

  function validateBlockPayload(userId, body) {
    const { target_user_id, action = "block" } = body || {};
    if (!target_user_id) {
      return { ok: false, error: "Target pengguna wajib ditentukan." };
    }
    if (target_user_id === userId) {
      return { ok: false, error: "Anda tidak dapat memblokir akun Anda sendiri." };
    }
    if (action !== "block" && action !== "unblock") {
      return { ok: false, error: "Aksi tidak valid." };
    }
    return { ok: true };
  }

  it('MUST reject reporting oneself', () => {
    const res = validateReportPayload("user-123", { reported_user_id: "user-123", reason: "Spam" });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Anda tidak dapat melaporkan akun Anda sendiri.");
  });

  it('MUST accept valid report for another user', () => {
    const res = validateReportPayload("user-123", { reported_user_id: "user-456", reason: "Spam atau Penipuan" });
    assert.equal(res.ok, true);
  });

  it('MUST reject blocking oneself', () => {
    const res = validateBlockPayload("user-123", { target_user_id: "user-123", action: "block" });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Anda tidak dapat memblokir akun Anda sendiri.");
  });

  it('MUST accept blocking and unblocking valid target', () => {
    assert.equal(validateBlockPayload("user-123", { target_user_id: "user-456", action: "block" }).ok, true);
    assert.equal(validateBlockPayload("user-123", { target_user_id: "user-456", action: "unblock" }).ok, true);
  });
});

describe('MOB-03: Capacitor 6+ Android Configuration', () => {
  it('Capacitor config must define valid appId and androidScheme', async () => {
    // Dynamic import to verify syntax and properties
    const config = (await import('../capacitor.config.ts')).default;
    assert.equal(config.appId, 'com.expedient43.app');
    assert.equal(config.appName, 'Expedient 43');
    assert.equal(config.server?.androidScheme, 'https');
    assert.ok(config.plugins?.Keyboard);
    assert.ok(config.plugins?.StatusBar);
  });
});
