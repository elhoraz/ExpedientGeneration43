import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('WhatsApp Bot Anti-Loop & Anti-Spam Protection Suite', () => {
  // 1. Logika Anti-Loop fromMe
  function shouldProcessInboundMessage({ fromMe, isGroup, remoteJid, botPhone, isOwnerCommand }) {
    const cleanRemote = remoteJid.replace(/:\d+@/, "@").replace(/\D/g, "");
    const isSelfChat = !isGroup && cleanRemote.includes(botPhone.slice(-9));

    // ATURAN ANTI-LOOP MUTLAK:
    if (fromMe) {
      if (!isSelfChat || !isOwnerCommand) {
        return false; // DROP!
      }
    }
    return true;
  }

  // 2. Logika Deteksi Auto-Responder / Bot Eksternal
  const AUTO_RESPONDER_PATTERNS = [
    /terima kasih telah menghubungi/i,
    /pesan ini dikirim secara otomatis/i,
    /auto[\s-]?reply/i,
    /autoreply/i,
    /kami sedang (offline|tutup|istirahat|tidak di tempat)/i,
    /out of office/i,
    /away message/i,
    /akan segera (membalas|merespons|menghubungi)/i,
    /terima kasih atas pesan anda/i,
    /asisten resmi expedient/i,
    /ref:\s*#eg43-/i,
    /belum terdaftar di web angkatan kita nih/i,
    /sudah otomatis ana japri/i,
    /milik sahabat .* alhamdulillah sudah terdaftar/i,
  ];

  function isAutoResponder(text) {
    if (!text) return false;
    return AUTO_RESPONDER_PATTERNS.some((p) => p.test(text));
  }

  // 3. Logika Circuit Breaker
  class CircuitBreakerMock {
    constructor() {
      this.replyTimestamps = new Map();
      this.mutedUntil = new Map();
      this.lastMessageTrack = new Map();
    }

    shouldAllow(remoteJid, text, now) {
      const muted = this.mutedUntil.get(remoteJid) || 0;
      if (now < muted) return { allowed: false, reason: 'Circuit breaker muted' };

      if (isAutoResponder(text)) return { allowed: false, reason: 'Auto responder detected' };

      // Cek repetisi
      const cleanNorm = text.trim().toLowerCase();
      if (cleanNorm.length > 3) {
        const track = this.lastMessageTrack.get(remoteJid);
        if (track && track.text === cleanNorm && now - track.lastTime < 45000) {
          track.count += 1;
          track.lastTime = now;
          if (track.count >= 3) return { allowed: false, reason: 'Duplicate message loop' };
        } else {
          this.lastMessageTrack.set(remoteJid, { text: cleanNorm, count: 1, lastTime: now });
        }
      }

      // Cek burst
      const list = (this.replyTimestamps.get(remoteJid) || []).filter(t => now - t < 60000);
      if (list.length >= 6) {
        this.mutedUntil.set(remoteJid, now + 3 * 60 * 1000);
        return { allowed: false, reason: 'Burst limit tripped' };
      }

      return { allowed: true };
    }

    recordReply(remoteJid, now) {
      const list = (this.replyTimestamps.get(remoteJid) || []).filter(t => now - t < 60000);
      list.push(now);
      this.replyTimestamps.set(remoteJid, list);
    }
  }

  it('MUST drop fromMe messages in groups even if they match owner commands like poster/desain/halo', () => {
    // Bot sends "🎨 Siap Sahabat! Desain poster telah selesai..."
    const shouldProcess = shouldProcessInboundMessage({
      fromMe: true,
      isGroup: true,
      remoteJid: '120363388633880584@g.us',
      botPhone: '6285151771289',
      isOwnerCommand: true, // Berisi kata "poster" & "desain"
    });

    assert.strictEqual(shouldProcess, false, 'Bot sent message in group MUST NEVER be processed');
  });

  it('MUST drop fromMe messages in private chat to other users', () => {
    // Bot sends DM to alumni
    const shouldProcess = shouldProcessInboundMessage({
      fromMe: true,
      isGroup: false,
      remoteJid: '6281234567890@s.whatsapp.net',
      botPhone: '6285151771289',
      isOwnerCommand: true,
    });

    assert.strictEqual(shouldProcess, false, 'Bot sent message to other user MUST NEVER be processed');
  });

  it('MUST ALLOW fromMe messages ONLY in self-chat with explicit command for manual testing', () => {
    // Owner testing in "Message Yourself" chat
    const shouldProcess = shouldProcessInboundMessage({
      fromMe: true,
      isGroup: false,
      remoteJid: '6285151771289@s.whatsapp.net',
      botPhone: '6285151771289',
      isOwnerCommand: true,
    });

    assert.strictEqual(shouldProcess, true, 'Self-chat command from owner MUST be allowed for testing');
  });

  it('MUST detect WhatsApp Business auto-responder patterns and drop them', () => {
    const autoSamples = [
      'Halo! Terima kasih telah menghubungi kami. Kami akan segera merespons pesan Anda.',
      'Pesan ini dikirim secara otomatis saat toko tutup.',
      'Mohon maaf, kami sedang offline. Silakan tinggalkan pesan.',
      'Auto-reply: Terima kasih atas pesan Anda.',
      'Out of office: Saya sedang cuti hingga Senin depan.',
    ];

    for (const msg of autoSamples) {
      assert.strictEqual(isAutoResponder(msg), true, `Must detect auto-reply: "${msg}"`);
    }

    const humanSamples = [
      'Halo min, mau tanya info reuni',
      'Assalamu alaikum min, ini nomornya Danang 081234567890',
      'Kapan agenda kumpul angkatan berikutnya?',
      'Buatkan poster hari santri dong min',
    ];

    for (const msg of humanSamples) {
      assert.strictEqual(isAutoResponder(msg), false, `Must NOT flag human message: "${msg}"`);
    }
  });

  it('MUST trip circuit breaker when burst frequency exceeds 6 messages per minute', () => {
    const cb = new CircuitBreakerMock();
    const jid = 'user_spammer@s.whatsapp.net';
    let baseTime = Date.now();

    // 6 replies within 30 seconds
    for (let i = 0; i < 6; i++) {
      const res = cb.shouldAllow(jid, `Pertanyaan ke-${i}`, baseTime + i * 1000);
      assert.strictEqual(res.allowed, true, `Reply ${i + 1} should be allowed`);
      cb.recordReply(jid, baseTime + i * 1000);
    }

    // 7th message in the same minute -> must trip circuit breaker!
    const tripCheck = cb.shouldAllow(jid, 'Pertanyaan ke-7 (spam)', baseTime + 10000);
    assert.strictEqual(tripCheck.allowed, false);
    assert.strictEqual(tripCheck.reason, 'Burst limit tripped');

    // Subsequent message 30s later must still be muted
    const stillMuted = cb.shouldAllow(jid, 'Tes lagi', baseTime + 40000);
    assert.strictEqual(stillMuted.allowed, false);
    assert.strictEqual(stillMuted.reason, 'Circuit breaker muted');
  });

  it('MUST suppress identical messages repeated 3 times within 45 seconds', () => {
    const cb = new CircuitBreakerMock();
    const jid = 'loop_bot@s.whatsapp.net';
    const time = Date.now();
    const repeatMsg = 'Terima kasih kembali sahabat';

    assert.strictEqual(cb.shouldAllow(jid, repeatMsg, time).allowed, true);
    assert.strictEqual(cb.shouldAllow(jid, repeatMsg, time + 2000).allowed, true);
    // 3rd repetition within 45s must be blocked
    const thirdCheck = cb.shouldAllow(jid, repeatMsg, time + 4000);
    assert.strictEqual(thirdCheck.allowed, false);
    assert.strictEqual(thirdCheck.reason, 'Duplicate message loop');
  });
});
