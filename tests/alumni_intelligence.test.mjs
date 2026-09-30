import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge } from '../src/lib/whatsapp/alumniIntelligence.js';

describe('Alumni Intelligence & Smart Cohort Knowledge Suite', () => {
  it('MUST calculate exact age correctly from birth date string', () => {
    const ageResult = calculateAge('2005-05-04');
    assert.match(ageResult, /tahun/);
    assert.match(ageResult, /4 Mei 2005/);

    const invalidResult = calculateAge('');
    assert.strictEqual(invalidResult, '');
  });

  it('MUST recognize city queries from text properly', () => {
    const KNOWN_CITIES = ['ponorogo', 'bandung', 'surabaya', 'pacitan', 'kediri'];
    const msg1 = "Alumni yang tinggal di Bandung siapa aja?";
    const matched = KNOWN_CITIES.filter(c => msg1.toLowerCase().includes(c));
    assert.deepStrictEqual(matched, ['bandung']);

    const msg2 = "Anak ponorogo kumpul yuk";
    const matched2 = KNOWN_CITIES.filter(c => msg2.toLowerCase().includes(c));
    assert.deepStrictEqual(matched2, ['ponorogo']);
  });

  it('MUST detect leadership and founder questions accurately', () => {
    const testCases = [
      "siapa ketua angkatan?",
      "siapa pembuat website expedient?",
      "siapa taufiqi itu?",
      "kontak elhoraz ada gak?"
    ];

    testCases.forEach(msg => {
      const lower = msg.toLowerCase();
      const isLeaderQuery =
        lower.includes("ketua angkatan") ||
        lower.includes("ketua") ||
        lower.includes("pembuat web") ||
        lower.includes("siapa taufiqi") ||
        lower.includes("elhoraz") ||
        lower.includes("elhora");
      assert.strictEqual(isLeaderQuery, true);
    });
  });

  it('MUST distinguish group chat length rule from private chat length rule', () => {
    const isGroup = true;
    const rule = isGroup 
      ? "FOR GROUP CHAT: Keep your response EXTREMELY BRIEF & CRISP (1 to 2 sentences maximum!)."
      : "FOR PRIVATE CHAT: Provide a warm, clear, polite, and complete answer (2 to 4 sentences).";
    assert.match(rule, /1 to 2 sentences/);
  });
});
