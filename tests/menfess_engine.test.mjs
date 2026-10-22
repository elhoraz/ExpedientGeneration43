import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhone,
  toggleMenfessOptOut,
  checkMenfessContentSafety,
  buildGroupMenfessMessage,
  handlePrivateMenfessMessage,
} from '../src/lib/whatsapp/menfessEngine.ts';

describe('Menfess & Titip Salam Engine Test Suite', () => {
  it('MUST normalize phone numbers properly to 628xxx format', () => {
    assert.strictEqual(normalizePhone('08123456789'), '628123456789');
    assert.strictEqual(normalizePhone('+62 812-3456-7890'), '6281234567890');
    assert.strictEqual(normalizePhone('6285151771289'), '6285151771289');
  });

  it('MUST toggle opt-out and opt-in settings properly', () => {
    const testPhone = '081299887766';
    const optOutMsg = toggleMenfessOptOut(testPhone, true);
    assert.match(optOutMsg, /PREFERENSI TERSIMPAN/);
    assert.match(optOutMsg, /dinonaktifkan/);

    const optInMsg = toggleMenfessOptOut(testPhone, false);
    assert.match(optInMsg, /PREFERENSI TERSIMPAN/);
    assert.match(optInMsg, /diaktifkan kembali/);
  });

  it('MUST reject toxic or offensive content in safety screener', async () => {
    const toxicCheck = await checkMenfessContentSafety('kamu babi bangsat banget sih');
    assert.strictEqual(toxicCheck.isSafe, false);
    assert.ok(toxicCheck.reason, 'Must provide rejection reason');

    const politeCheck = await checkMenfessContentSafety('Semangat sidang skripsinya ya akhi, semoga lancar dan barakah!');
    assert.strictEqual(politeCheck.isSafe, true);
  });

  it('MUST format group message with proper tag format and sender attribution', () => {
    const targetPhone = '628123456789';
    const message = 'Barakallah atas pernikahannya bro!';
    const sender = 'Ahmad Fauzi';

    // Default: Nama Ditampilkan
    const publicMsg = buildGroupMenfessMessage(targetPhone, message, sender, false);
    assert.match(publicMsg, /TITIP SALAM ALUMNI/);
    assert.match(publicMsg, /@628123456789/);
    assert.match(publicMsg, /Dari: Sahabat \*Ahmad Fauzi\* 👤/);

    // Mode Anonim: Nama Dirahasiakan
    const anonMsg = buildGroupMenfessMessage(targetPhone, message, sender, true);
    assert.match(anonMsg, /TITIP SALAM ALUMNI/);
    assert.match(anonMsg, /@628123456789/);
    assert.match(anonMsg, /Dari: \*Seorang Sahabat Santri \(Anonim 🕵️✨\)\*/);
  });

  it('MUST handle natural conversation flow and gatekeep unregistered users', async () => {
    // Unregistered phone test
    const fakePhone = '628999999999999';
    const res = await handlePrivateMenfessMessage({
      senderPhone: fakePhone,
      senderName: 'Orang Asing',
      messageText: 'bot kamu bisa kirim chat ke grup ga? tolong kirim salam ke temenku',
    });

    assert.strictEqual(res.handled, true);
    assert.ok(res.replyToSender);
    assert.match(res.replyToSender, /fasilitas khusus untuk \*Alumni Angkatan\*/);
    assert.match(res.replyToSender, /https:\/\/expedientgeneration\.vercel\.app\/register/);
  });

  it('MUST verify registered alumni even when chatting with LID via name matching', async () => {
    const mockLid = '105240321908772';
    const res = await handlePrivateMenfessMessage({
      senderPhone: mockLid,
      senderName: 'Muhammad Nur Taufiqi',
      messageText: 'bot kamu bisa kirim chat ke grup ga?',
    });

    assert.strictEqual(res.handled, true);
    assert.ok(res.replyToSender);
    assert.match(res.replyToSender, /Bisa banget Sahabat/);
    assert.match(res.replyToSender, /Elhoraz|Muhammad Nur Taufiqi/);
  });
});
