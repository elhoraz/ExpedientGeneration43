import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Expedient Graphic Design Studio Assistant Suite', () => {
  it('MUST recognize the Graphic Design group JID correctly', () => {
    const designGroupId = "120363404648728200@g.us";
    function isDesignGroup(id) {
      if (!id) return false;
      return id.includes("120363404648728200") || id.trim() === designGroupId;
    }

    assert.strictEqual(isDesignGroup("120363404648728200@g.us"), true);
    assert.strictEqual(isDesignGroup("120363404648728200"), true);
    assert.strictEqual(isDesignGroup("120363388633880584@g.us"), false); // Community group
    assert.strictEqual(isDesignGroup("120363407294140739@g.us"), false); // Official group
  });

  it('MUST detect design triggers and commands in the design group', () => {
    function shouldRespond(text) {
      const lower = text.trim().toLowerCase();
      if (lower.includes("bot") || lower.includes("@") || lower.includes("desain") || lower.includes("editor")) return true;
      if (text.startsWith("!") || text.startsWith("/")) return true;
      const kw = ["poster", "ide", "tema", "warna", "jadwal", "kalender", "aset", "g30s", "santri"];
      if (kw.some(k => lower.includes(k))) return true;
      return false;
    }

    assert.strictEqual(shouldRespond("@bot jadwal poster minggu ini"), true);
    assert.strictEqual(shouldRespond("!brief kesaktian pancasila"), true);
    assert.strictEqual(shouldRespond("ada ide tema buat g30s gak ya"), true);
    assert.strictEqual(shouldRespond("siapa yang pegang poster hari santri"), true);
    assert.strictEqual(shouldRespond("aset foto ultah danang mana ya"), true);
  });

  it('MUST format alert message containing @semua and 1-click Pinterest & Google links', () => {
    const item = {
      type: "event",
      title: "Hari Kesaktian Pancasila",
      category: "Hari Nasional",
      dateStr: "1 Oktober",
      daysLeft: 1,
      description: "Pancasila pemersatu bangsa",
      colorPalette: ["#78350F", "#B45309", "#1E293B", "#FFFBEB"],
      suggestedTheme: "Garuda Emas Kokoh & Fajar Bangsa",
      pinterestUrl: "https://www.pinterest.com/search/pins/?q=hari+kesaktian+pancasila+poster",
      googleImagesUrl: "https://www.google.com/search?tbm=isch&q=hari+kesaktian+pancasila",
    };

    function formatAlert(e) {
      return `📢 @semua *[CALL FOR EDITORS - EXPEDIENT CREATIVE STUDIO]* 🎨✨\n` +
        `⚠️ *BESOK (H-1 - FINAL DRAFT & REVIEW)*\n` +
        `📅 *Tanggal:* ${e.dateStr}\n` +
        `🎯 *Agenda Desain:* *${e.title}*\n` +
        `🎨 *Palet Warna:* ${e.colorPalette.join(" | ")}\n` +
        `📌 *Pinterest:* ${e.pinterestUrl}\n` +
        `🔍 *Google Images:* ${e.googleImagesUrl}`;
    }

    const output = formatAlert(item);
    assert.match(output, /@semua/);
    assert.match(output, /pinterest\.com/);
    assert.match(output, /google\.com/);
    assert.match(output, /#78350F/);
  });

  it('MUST handle off-topic conversations with polite deflection to design topics', () => {
    const offTopicMessage = "lu dukung paslon mana bro?";
    function checkOffTopic(msg) {
      const lower = msg.toLowerCase();
      const designTerms = ["desain", "design", "poster", "warna", "font", "layout", "jadwal", "aset", "brief", "karya", "canva", "photoshop", "figma"];
      const isDesignRelated = designTerms.some(t => lower.includes(t));
      if (!isDesignRelated) {
        return "MOHON_MAAF_OFF_TOPIC";
      }
      return "VALID_DESIGN_TOPIC";
    }

    assert.strictEqual(checkOffTopic(offTopicMessage), "MOHON_MAAF_OFF_TOPIC");
    assert.strictEqual(checkOffTopic("rekomendasi font serif buat poster heroik dong"), "VALID_DESIGN_TOPIC");
  });
});
