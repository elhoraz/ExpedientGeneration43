import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'crypto';
import {
  startKaburGame,
  handleKaburAnswer,
  getKaburGameStatus,
  stopKaburGame,
  registerKaburPoll,
  findOptionKeyByHash,
  resetKaburCooldowns,
  LOBBY_OPTIONS,
} from '../src/lib/whatsapp/kaburPondokEngine.ts';

describe('Kabur dari Pondok RPG Engine & Onboarding Lobby Test Suite', () => {
  const TEST_GROUP_ID = 'test-group-pondok-123@g.us';
  const SENDER_NAME = 'Taufiqi Santri';
  const SENDER_PHONE = '6281234567890';

  it('MUST start in Lobby mode with clear onboarding instructions and lobby poll', async () => {
    // Reset any prior session and cooldowns
    stopKaburGame(TEST_GROUP_ID);
    resetKaburCooldowns(TEST_GROUP_ID);

    const res = await startKaburGame(TEST_GROUP_ID, SENDER_NAME, SENDER_PHONE);
    assert.strictEqual(res.success, true);
    assert.match(res.message, /APAAN NIH MIN/);
    assert.match(res.message, /CARA BERMAIN/);
    assert.match(res.message, /Jasus Santri/);
    assert.match(res.message, /Biro Ri'ayah/);
    assert.match(res.message, /Gayung Merah Sakti/);

    // Verify Native Lobby Polling Payload
    assert.ok(res.poll, 'Must generate lobby poll payload');
    assert.match(res.poll.name, /KONFIRMASI TIM SANTRI/);
    assert.strictEqual(res.poll.values.length, 3);
    assert.match(res.poll.values[0], /Gas Mulai Misi/);
  });

  it('MUST show survival handbook when user chooses tips (B) in lobby', async () => {
    const tipsRes = await handleKaburAnswer(TEST_GROUP_ID, 'B', SENDER_NAME);
    assert.strictEqual(tipsRes.handled, true);
    assert.match(tipsRes.replyText, /BUKU PANDUAN SURVIVAL/);
    assert.match(tipsRes.replyText, /Stealth/);
    assert.match(tipsRes.replyText, /Radar Ri'ayah/);
    assert.ok(tipsRes.poll, 'Must reprompt lobby poll');
  });

  it('MUST transition from Lobby to Chapter 1 when user chooses Gas Mulai (A)', async () => {
    const startRes = await handleKaburAnswer(TEST_GROUP_ID, 'A', SENDER_NAME);
    assert.strictEqual(startRes.handled, true);
    assert.match(startRes.replyText, /TAKBIR/);
    assert.match(startRes.replyText, /CHAPTER 1 - RAYON ASRAMA/);
    assert.match(startRes.replyText, /STATUS TIM SANTRI/);
    assert.match(startRes.replyText, /Stealth:/);

    // Verify Chapter 1 action poll
    assert.ok(startRes.poll, 'Must generate Chapter 1 action poll');
    assert.match(startRes.poll.name, /CH\. 1/);
    assert.strictEqual(startRes.poll.values.length, 4);
    assert.match(startRes.poll.values[0], /🅰️/);
  });

  it('MUST properly register and resolve poll votes by option hash', () => {
    const MOCK_POLL_ID = 'mock-poll-id-abc';
    const MOCK_OPTIONS = [
      { key: 'A', label: 'ALIBI GAYUNG', archetype: 'ALIBI', description: 'Pura-pura mules bawa gayung ke kamar mandi' },
      { key: 'B', label: 'NINJA SARUNG', archetype: 'NINJA', description: 'Tiarap di bawah jemuran baju basah' },
      { key: 'C', label: 'DISTRAKSI KUCING', archetype: 'PARKOUR', description: 'Timpuk sandal swallow ke arah tong sampah' },
      { key: 'D', label: 'SOGOKAN INDOMIE', archetype: 'DIPLOMASI', description: 'Beri sebungkus mie sedap goreng ke jasus' },
    ];

    const MOCK_VALUES = [
      '🚀 [BISMILLAH] Gas Mulai Misi! (Masuk Ch. 1)',
      '📖 [TIPS SURVIVAL] Cara Selamat dari Ri\'ayah',
      '🏳️ [BATAL] Tidur Aja Takut Digundul Licin',
      '🚪 [LAINNYA] Pilihan rahasia',
    ];

    registerKaburPoll(
      MOCK_POLL_ID,
      TEST_GROUP_ID,
      '6285151771289',
      new Uint8Array(32),
      MOCK_OPTIONS,
      MOCK_VALUES,
      '105240321908772@lid'
    );

    // 1. Hash dari raw value WhatsApp asli (Opsi A)
    const hashRawA = crypto.createHash('sha256').update(Buffer.from(MOCK_VALUES[0])).digest('hex');
    assert.strictEqual(findOptionKeyByHash(MOCK_POLL_ID, hashRawA), 'A', 'Raw poll value hash must resolve to A');

    // 2. Hash dari constructed text (Opsi B)
    const optBText = `🅱️ [NINJA SARUNG] ${MOCK_OPTIONS[1].description.slice(0, 45)}`;
    const hashB = crypto.createHash('sha256').update(Buffer.from(optBText)).digest('hex');
    assert.strictEqual(findOptionKeyByHash(MOCK_POLL_ID, hashB), 'B', 'Constructed option text must also resolve to B');
  });

  it('MUST prevent double start and silently ignore repeated spam warning', async () => {
    // Panggilan pertama: kirim peringatan
    const res1 = await startKaburGame(TEST_GROUP_ID, SENDER_NAME, SENDER_PHONE);
    assert.strictEqual(res1.success, false);
    assert.strictEqual(res1.silent, false);
    assert.match(res1.message, /sudah aktif di grup ini/);

    // Panggilan beruntun kedua (spam): harus diabaikan secara senyap (silent: true)
    const res2 = await startKaburGame(TEST_GROUP_ID, SENDER_NAME, SENDER_PHONE);
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.silent, true);
    assert.strictEqual(res2.message, '');
  });

  it('MUST throttle individual user spamming commands repeatedly', async () => {
    const SPAMMER_PHONE = '628999888777';
    // User mengirim 4x berturut-turut
    await startKaburGame(TEST_GROUP_ID, 'Si Spammer', SPAMMER_PHONE);
    await startKaburGame(TEST_GROUP_ID, 'Si Spammer', SPAMMER_PHONE);
    await startKaburGame(TEST_GROUP_ID, 'Si Spammer', SPAMMER_PHONE);
    const strikeRes = await startKaburGame(TEST_GROUP_ID, 'Si Spammer', SPAMMER_PHONE);

    assert.strictEqual(strikeRes.success, false);
    assert.match(strikeRes.message, /Hussh Si Spammer/);
    assert.match(strikeRes.message, /terlalu berisik/);
  });

  it('MUST return status with status bar and last history', () => {
    const statusText = getKaburGameStatus(TEST_GROUP_ID);
    assert.match(statusText, /MISI KABUR DARI PONDOK/);
    assert.match(statusText, /Stealth:/);
    assert.match(statusText, /Stamina:/);
  });

  it('MUST ignore non-option chats without disturbing the group', async () => {
    const res = await handleKaburAnswer(TEST_GROUP_ID, 'halo rek piye kabare', 'Temen Santri');
    assert.strictEqual(res.handled, false);
  });

  it('MUST accept valid option letter (A, B, C, or D) and advance narrative with next poll', async () => {
    const res = await handleKaburAnswer(TEST_GROUP_ID, 'B', 'Ahmad Ninja');
    assert.strictEqual(res.handled, true);
    assert.ok(res.replyText, 'Must have replyText');
    assert.match(res.replyText, /Ahmad Ninja/);
    assert.ok(res.poll, 'Must generate next poll payload');
  });

  it('MUST allow stopping/cancelling the game and enforce resting cooldown on immediate restart', async () => {
    const stopMsg = stopKaburGame(TEST_GROUP_ID);
    assert.match(stopMsg, /Operasi Kabur Dibatalkan/);

    const checkStatus = getKaburGameStatus(TEST_GROUP_ID);
    assert.match(checkStatus, /Tidak ada operasi kabur/);

    // Coba langsung restart seketika: harus kena resting cooldown
    const restartImmediate = await startKaburGame(TEST_GROUP_ID, SENDER_NAME, SENDER_PHONE);
    assert.strictEqual(restartImmediate.success, false);
    assert.match(restartImmediate.message, /Santri lagi atur napas/);
  });
});
