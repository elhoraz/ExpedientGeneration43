import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Member Auditor & Mass Registration Invitation Suite', () => {
  function extractPhoneNumbers(text) {
    if (!text) return [];
    const rawMatches = text.match(/(?:\+?62|0|\b8)[\s\-\.\(\)0-9]{7,20}/g) || [];
    const normalizedSet = new Set();
    for (const raw of rawMatches) {
      let clean = raw.replace(/\D/g, "");
      if (clean.startsWith("0")) clean = "62" + clean.substring(1);
      else if (clean.startsWith("8")) clean = "62" + clean;
      if (/^628[0-9]{7,12}$/.test(clean)) {
        normalizedSet.add(clean);
      }
    }
    return Array.from(normalizedSet);
  }

  function formatAuditSummary(result) {
    let text = `📊 HASIL AUDIT ANGGOTA GRUP vs DATABASE WEBSITE\n`;
    text += `• Total Nomor Dianalisis: ${result.totalAnalyzed} Nomor\n`;
    text += `• ✅ Sudah Terdaftar: ${result.registered.length}\n`;
    text += `• ❌ Belum Terdaftar: ${result.unregistered.length}\n`;
    return text;
  }

  it('MUST extract and normalize Indonesian phone numbers from messy WhatsApp group text', () => {
    const rawInput = `
      Daftar Peserta Grup Expedient:
      ~Ahmad: +62 812-3456-7890
      085712345678, +6289675010185
      Budi (0813-9876-5432)
      +62 821 4287 7426
      81298765432
      Bukan Nomor: 021-1234567, 12345, 0812
    `;

    const phones = extractPhoneNumbers(rawInput);
    assert.strictEqual(phones.length, 6);
    assert.ok(phones.includes("6281234567890"));
    assert.ok(phones.includes("6285712345678"));
    assert.ok(phones.includes("6289675010185"));
    assert.ok(phones.includes("6281398765432"));
    assert.ok(phones.includes("6282142877426"));
    assert.ok(phones.includes("6281298765432"));
    // Non-mobile numbers must be excluded
    assert.ok(!phones.includes("0211234567"));
  });

  it('MUST deduplicate identical phone numbers regardless of formatting differences', () => {
    const rawInput = `+62 812-3456-7890, 081234567890, 6281234567890`;
    const phones = extractPhoneNumbers(rawInput);
    assert.strictEqual(phones.length, 1);
    assert.strictEqual(phones[0], "6281234567890");
  });

  it('MUST format audit summary correctly with registered and unregistered counts', () => {
    const summary = formatAuditSummary({
      totalAnalyzed: 20,
      registered: [ { phone: "6281234567890", name: "Ahmad" } ],
      unregistered: ["6285712345678"],
    });

    assert.match(summary, /Total Nomor Dianalisis: 20/);
    assert.match(summary, /Sudah Terdaftar: 1/);
    assert.match(summary, /Belum Terdaftar: 1/);
  });
});
