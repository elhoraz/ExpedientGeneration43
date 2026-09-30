import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test logic mirroring isWhatsAppGroup
function isWhatsAppGroup(target) {
  if (!target) return false;
  const t = String(target).trim().toLowerCase();
  return (
    t.endsWith('@g.us') ||
    t.includes('@g.us') ||
    t.startsWith('group:') ||
    t.endsWith('@broadcast') ||
    t.includes('-')
  );
}

// Test logic mirroring isAnnouncementSubmission
function isAnnouncementSubmission(text) {
  const lower = text.trim().toLowerCase();
  const dukaKeywords = [
    'innalillahi',
    'inna lillahi',
    'lelayu',
    'meninggal',
    'wafat',
    'telah berpulang',
    'duka cita',
    'kabar duka',
    'berita duka',
    'takziyah',
    'takziah',
    'meninggal dunia',
  ];
  if (dukaKeywords.some((kw) => lower.includes(kw))) {
    return { isAnnouncement: true, category: 'duka_cita' };
  }

  const announcementKeywords = [
    'titip pengumuman',
    'titip info',
    'titip kabar',
    'sampaikan ke grup',
    'kirim ke grup resmi',
    'umumkan ke grup',
    'tolong sampaikan di grup',
    'tolong sampaikan ke grup',
    'info penting grup',
    'mohon dishare di grup',
    'mohon di share di grup',
  ];
  if (announcementKeywords.some((kw) => lower.includes(kw))) {
    return { isAnnouncement: true, category: 'berita_penting' };
  }

  return { isAnnouncement: false, category: 'berita_penting' };
}

// Test logic mirroring shouldGroupBotRespond
function shouldGroupBotRespond(messageText) {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Tag / Mention Bot
  if (
    lower.includes("89675010185") ||
    lower.includes("@bot") ||
    lower.includes("bot") ||
    lower.includes("expedient") ||
    lower.includes("minbot") ||
    lower.includes("admin bot") ||
    /\bmin\b/i.test(lower) ||
    lower.includes("@")
  ) {
    return true;
  }

  // 2. Command Prefix (!, /, ?, #)
  if (
    messageText.startsWith("!") ||
    messageText.startsWith("/") ||
    messageText.startsWith("?") ||
    messageText.startsWith("#")
  ) {
    return true;
  }

  // 3. Sapaan langsung / testing bot di grup
  if (
    lower === "tes" ||
    lower === "test" ||
    lower === "ping" ||
    lower.startsWith("tes bot") ||
    lower.startsWith("test bot") ||
    lower.startsWith("halo bot") ||
    lower.startsWith("hai bot") ||
    lower.startsWith("p ") ||
    lower === "p" ||
    lower.startsWith("assalamu'alaikum bot") ||
    lower.startsWith("assalamualaikum bot")
  ) {
    return true;
  }

  // 4. Pertanyaan Sosok / Profil Alumni / Siapa
  if (
    lower.includes("siapa") ||
    lower.includes("siapakah") ||
    lower.startsWith("profil ") ||
    lower.startsWith("kontak ") ||
    lower.startsWith("nomor ") ||
    lower.startsWith("alamat ") ||
    lower.includes("tinggal di") ||
    lower.includes("info tentang ") ||
    lower.startsWith("tanya dong")
  ) {
    return true;
  }

  // 5. Pertanyaan Spesifik Seputar Angkatan & Website Portal
  if (
    lower.includes("ultah") ||
    lower.includes("ulang tahun") ||
    lower.includes("milad") ||
    lower.includes("reuni") ||
    lower.includes("agenda") ||
    lower.includes("acara") ||
    lower.includes("total alumni") ||
    lower.includes("berapa alumni") ||
    lower.includes("jumlah alumni") ||
    lower.includes("website") ||
    lower.includes("fitur") ||
    lower.includes("portal") ||
    lower.includes("link web")
  ) {
    return true;
  }

  return false;
}

describe('WhatsApp Group Gateway & Smart Trigger Validation', () => {
  it('MUST identify WhatsApp Group JID formats correctly', () => {
    assert.strictEqual(isWhatsAppGroup('120363028392819@g.us'), true);
    assert.strictEqual(isWhatsAppGroup('628123456789-1234567890@g.us'), true);
    assert.strictEqual(isWhatsAppGroup('group:120363028392819'), true);
    assert.strictEqual(isWhatsAppGroup('status@broadcast'), true);

    // Regular numbers should NOT be considered groups
    assert.strictEqual(isWhatsAppGroup('082142877426'), false);
    assert.strictEqual(isWhatsAppGroup('6282142877426'), false);
    assert.strictEqual(isWhatsAppGroup('+6282142877426'), false);
    assert.strictEqual(isWhatsAppGroup(''), false);
  });

  it('MUST detect Berita Duka / Lelayu submissions accurately', () => {
    const rawMsg = "Assalamu'alaikum min, innalillahi bapaknya sahabat Rizki meninggal tadi subuh, tolong infokan.";
    const check = isAnnouncementSubmission(rawMsg);
    assert.strictEqual(check.isAnnouncement, true);
    assert.strictEqual(check.category, 'duka_cita');
  });

  it('MUST detect Important Cohort Announcement requests', () => {
    const rawMsg = "Halo bot, tolong sampaikan ke grup info reuni akbar tanggal 20 Oktober ya";
    const check = isAnnouncementSubmission(rawMsg);
    assert.strictEqual(check.isAnnouncement, true);
    assert.strictEqual(check.category, 'berita_penting');
  });

  it('MUST NOT trigger announcement on casual chat', () => {
    const rawMsg = "Halo apa kabar semuanya? Kapan kita main futsal bareng lagi?";
    const check = isAnnouncementSubmission(rawMsg);
    assert.strictEqual(check.isAnnouncement, false);
  });

  it('MUST filter community group messages with smart anti-spam and support phone tags', () => {
    // 1. Should respond when mentioned by name or phone tag
    assert.strictEqual(shouldGroupBotRespond('@ExpedientBot siapa ketua angkatan?'), true);
    assert.strictEqual(shouldGroupBotRespond('@6289675010185 halo apa kabar'), true);
    assert.strictEqual(shouldGroupBotRespond('bot, info reuni dong'), true);
    assert.strictEqual(shouldGroupBotRespond('halo bot'), true);
    assert.strictEqual(shouldGroupBotRespond('tes'), true);
    assert.strictEqual(shouldGroupBotRespond('ping'), true);

    // 2. Should respond to command prefix
    assert.strictEqual(shouldGroupBotRespond('!ultah'), true);
    assert.strictEqual(shouldGroupBotRespond('!reuni'), true);
    assert.strictEqual(shouldGroupBotRespond('!cari danang'), true);

    // 3. Should respond to explicit cohort query
    assert.strictEqual(shouldGroupBotRespond('Siapa Taufiqi itu'), true);
    assert.strictEqual(shouldGroupBotRespond('siapa yang ultah hari ini rek?'), true);
    assert.strictEqual(shouldGroupBotRespond('kontak danang ada yang tau?'), true);
    assert.strictEqual(shouldGroupBotRespond('kapan reuni angkatan kita?'), true);
    assert.strictEqual(shouldGroupBotRespond('berapa alumni kita yang terdaftar sekarang?'), true);
    assert.strictEqual(shouldGroupBotRespond('Alumni yang tinggal di Bandung siapa aja?'), true);
    assert.strictEqual(shouldGroupBotRespond('Fitur website kita ada apa aja min?'), true);

    // 4. MUST IGNORE ordinary casual chatting between friends (anti-spam)
    assert.strictEqual(shouldGroupBotRespond('wkwkwk kocak banget lu bro'), false);
    assert.strictEqual(shouldGroupBotRespond('besok sore ada yang nongkrong gak?'), false);
    assert.strictEqual(shouldGroupBotRespond('gue otw nih tunggu ya'), false);
    assert.strictEqual(shouldGroupBotRespond('mantap jiwa'), false);
  });
});
