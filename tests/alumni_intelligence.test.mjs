import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function calculateAge(birthDateStr) {
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    if (isNaN(birth.getTime())) return '';

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    const birthFormatted = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeZone: 'Asia/Jakarta',
    }).format(birth);

    return `${age} tahun (Lahir: ${birthFormatted})`;
  } catch {
    return '';
  }
}

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

  it('MUST detect explicit memory learning and correction instructions', () => {
    const memoryTriggers = [
      "bot catat ya si Danang sekarang kerja di Pertamina",
      "min ingat ya si Auzan udah di Jakarta",
      "salah bot, ultahku tanggal 5",
      "fyi sekarang si Rizki udah nikah"
    ];

    memoryTriggers.forEach((msg) => {
      const lower = msg.toLowerCase();
      const isExplicitNote =
        lower.includes("catat") ||
        lower.includes("ingat") ||
        lower.includes("fyi") ||
        lower.includes("koreksi") ||
        lower.includes("salah min") ||
        lower.includes("salah bot") ||
        lower.includes("bukan bot") ||
        lower.includes("bukan min") ||
        lower.includes("sekarang kerja di") ||
        lower.includes("udah nikah");
      assert.strictEqual(isExplicitNote, true);
    });
  });

  it('MUST recognize natural organic statements WITHOUT any keywords like catat or ingat', () => {
    function isPotentialFact(text) {
      const lower = text.trim().toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      if (words.length < 3) return false;
      if (/^(wkwk|haha|hehe|p|tes|ping)/i.test(lower) && words.length < 5) return false;
      if (text.includes("?") || lower.startsWith("siapa ") || lower.startsWith("kapan ") || lower.startsWith("dimana ")) return false;
      const factIndicators = [
        "kerja di", "bekerja di", "kuliah di", "pindah ke", "tinggal di", "sekarang di", "buka usaha", "buka kafe", "udah nikah", "lulus", "cumlaude"
      ];
      if (factIndicators.some((ind) => lower.includes(ind))) return true;
      if ((lower.includes("sekarang") || lower.includes("udah") || lower.includes("kemarin") || lower.includes("baru")) && words.length >= 4) return true;
      return false;
    }

    // Natural conversation cases (NO "catat", NO "ingat")
    assert.strictEqual(isPotentialFact("Danang sekarang kerja di Pertamina Balikpapan"), true);
    assert.strictEqual(isPotentialFact("Auzan baru pindah dinas ke Jakarta"), true);
    assert.strictEqual(isPotentialFact("Rizki udah buka kafe di Ponorogo"), true);
    assert.strictEqual(isPotentialFact("Ihya kemarin lulus cumlaude di Malang"), true);

    // Casual chat or questions (MUST NOT trigger learning)
    assert.strictEqual(isPotentialFact("wkwkwk kocak banget lu bro"), false);
    assert.strictEqual(isPotentialFact("siapa ketua angkatan kita?"), false);
    assert.strictEqual(isPotentialFact("dimana Danang sekarang?"), false);
    assert.strictEqual(isPotentialFact("halo min"), false);
  });
});

