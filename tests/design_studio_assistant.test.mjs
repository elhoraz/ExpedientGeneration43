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

  it('MUST NOT nimbrung when designers are chatting among themselves without calling bot', () => {
    function shouldRespond(text) {
      const lower = text.trim().toLowerCase();
      if (lower.includes("@bot") || lower.includes("@") || lower.includes("89675010185")) return true;
      if (text.startsWith("!") || text.startsWith("/") || text.startsWith("#") || text.startsWith("?")) return true;
      if (
        lower.startsWith("bot ") ||
        lower.startsWith("bot,") ||
        lower.startsWith("min ") ||
        lower.startsWith("min,") ||
        lower === "bot" ||
        lower === "min" ||
        /(^|\s)(bot|min)[?!,.]*$/i.test(lower)
      ) {
        return true;
      }
      return false;
    }

    // Designers chatting among themselves -> MUST BE SILENT (false)
    assert.strictEqual(shouldRespond("menurut kalian bagusan warna merah apa biru bro?"), false);
    assert.strictEqual(shouldRespond("kemarin seru banget nonton bola"), false);
    assert.strictEqual(shouldRespond("ngopi yuk guys santai dulu"), false);
    assert.strictEqual(shouldRespond("ada ide tema buat g30s gak ya kalian?"), false);

    // Explicitly calling or tagging bot -> MUST RESPOND (true)
    assert.strictEqual(shouldRespond("@bot jadwal poster minggu ini"), true);
    assert.strictEqual(shouldRespond("bot, ada ide konsep pancasila gak?"), true);
    assert.strictEqual(shouldRespond("!brief kesaktian pancasila"), true);
    assert.strictEqual(shouldRespond("min tolong cek aset ultah danang"), true);
  });

  it('MUST format alert message containing @semua and ready-to-post Story & Feed posters', () => {
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
      feedImageUrl: "https://expedientgeneration.vercel.app/images/posters/kesaktian_pancasila_feed.jpg",
      storyImageUrl: "https://expedientgeneration.vercel.app/images/posters/kesaktian_pancasila_story.jpg",
    };

    function formatAlert(e) {
      let readyPostersSection = "";
      if (e.storyImageUrl || e.feedImageUrl) {
        readyPostersSection =
          `\n🖼️ *DESAIN POSTER SIAP UPLOAD (TINGGAL TERIMA JADI):*\n` +
          `• 📱 *Story IG (9:16):* ${e.storyImageUrl}\n` +
          `• 📸 *Feed IG (1:1):* ${e.feedImageUrl}\n`;
      }

      return (
        `📢 @semua *[CALL FOR EDITORS - EXPEDIENT CREATIVE STUDIO]* 🎨✨\n\n` +
        `⚠️ *BESOK (H-1 - FINAL DRAFT & REVIEW)*\n` +
        `📅 *Tanggal:* ${e.dateStr}\n` +
        `🎯 *Agenda Desain:* *${e.title}*\n` +
        readyPostersSection +
        `🎨 *Palet Warna:* ${e.colorPalette.join(" | ")}\n` +
        `📌 *Pinterest:* ${e.pinterestUrl}\n` +
        `🔍 *Google Images:* ${e.googleImagesUrl}`
      );
    }

    const output = formatAlert(item);
    assert.match(output, /@semua/);
    assert.match(output, /kesaktian_pancasila_story\.jpg/);
    assert.match(output, /kesaktian_pancasila_feed\.jpg/);
    assert.match(output, /pinterest\.com/);
  });
});
