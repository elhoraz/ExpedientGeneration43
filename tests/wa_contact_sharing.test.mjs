import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('WhatsApp Bot Contact Sharing & vCard Processing Suite', () => {
  // Replikasi logika parseContactsFromVCard
  function parseContactsFromVCard(vcardStr, fallbackName) {
    if (!vcardStr) return [];
    const contacts = [];
    const vcardBlocks = vcardStr.split(/BEGIN:VCARD/i).filter((b) => b.trim().length > 0);

    for (const block of vcardBlocks) {
      let name = (fallbackName || "").trim();
      const fnMatch =
        block.match(/(?:^|\r?\n)FN[;:][^\r\n:]*:(.+?)(?:\r?\n|$)/i) ||
        block.match(/(?:^|\r?\n)FN:(.+?)(?:\r?\n|$)/i);
      if (fnMatch && fnMatch[1]?.trim()) {
        name = fnMatch[1].trim();
      } else {
        const nMatch =
          block.match(/(?:^|\r?\n)N[;:][^\r\n:]*:(.+?)(?:\r?\n|$)/i) ||
          block.match(/(?:^|\r?\n)N:(.+?)(?:\r?\n|$)/i);
        if (nMatch && nMatch[1]?.trim()) {
          const parts = nMatch[1].split(";").filter(Boolean).map((p) => p.trim());
          if (parts.length > 0) {
            name = parts.reverse().join(" ");
          }
        }
      }

      const rawPhones = [];
      const waidMatches = block.matchAll(/waid=(\d+)/gi);
      for (const m of waidMatches) {
        if (m[1]) rawPhones.push(m[1]);
      }
      const telMatches = block.matchAll(/(?:^|\r?\n)TEL[^:]*:(.+?)(?:\r?\n|$)/gi);
      for (const m of telMatches) {
        if (m[1]) rawPhones.push(m[1].trim());
      }

      const seen = new Set();
      for (const raw of rawPhones) {
        let clean = raw.replace(/\D/g, "");
        if (clean.startsWith("0")) clean = "62" + clean.substring(1);
        else if (clean.startsWith("8")) clean = "62" + clean;
        if (/^628\d{7,12}$/.test(clean) && !seen.has(clean)) {
          seen.add(clean);
          contacts.push({
            displayName: name || fallbackName || "Sahabat",
            phone: clean,
            vcard: block,
          });
        }
      }
    }

    return contacts;
  }

  function extractContactsFromBaileysMessage(msgContent) {
    if (!msgContent) return [];
    const results = [];

    // 1. Single contactMessage
    if (msgContent.contactMessage) {
      const cm = msgContent.contactMessage;
      const name = cm.displayName || "";
      const vcard = cm.vcard || "";
      const parsed = parseContactsFromVCard(vcard, name);
      if (parsed.length > 0) {
        results.push(...parsed);
      }
    }

    // 2. Multiple contactsArrayMessage
    if (msgContent.contactsArrayMessage && Array.isArray(msgContent.contactsArrayMessage.contacts)) {
      for (const cm of msgContent.contactsArrayMessage.contacts) {
        const name = cm.displayName || "";
        const vcard = cm.vcard || "";
        const parsed = parseContactsFromVCard(vcard, name);
        if (parsed.length > 0) {
          results.push(...parsed);
        }
      }
    }

    const deduped = [];
    const seenPhones = new Set();
    for (const c of results) {
      if (!seenPhones.has(c.phone)) {
        seenPhones.add(c.phone);
        deduped.push(c);
      }
    }
    return deduped;
  }

  it('MUST extract displayName and phone from standard WhatsApp contactMessage vCard', () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:;Danang Arrisalah;;;
FN:Danang Arrisalah
TEL;type=CELL;type=VOICE;waid=6281234567890:+62 812-3456-7890
END:VCARD`;

    const contacts = parseContactsFromVCard(vcard, "Danang");
    assert.strictEqual(contacts.length, 1);
    assert.strictEqual(contacts[0].displayName, "Danang Arrisalah");
    assert.strictEqual(contacts[0].phone, "6281234567890");
  });

  it('MUST parse multiple contacts from contactsArrayMessage', () => {
    const baileysPayload = {
      contactsArrayMessage: {
        displayName: "2 Kontak",
        contacts: [
          {
            displayName: "Danang",
            vcard: `BEGIN:VCARD\nFN:Danang\nTEL;waid=6281234567890:+62 812-3456-7890\nEND:VCARD`
          },
          {
            displayName: "Ahmad Zaki",
            vcard: `BEGIN:VCARD\nFN:Ahmad Zaki\nTEL;type=CELL:085151771289\nEND:VCARD`
          }
        ]
      }
    };

    const contacts = extractContactsFromBaileysMessage(baileysPayload);
    assert.strictEqual(contacts.length, 2);
    assert.strictEqual(contacts[0].displayName, "Danang");
    assert.strictEqual(contacts[0].phone, "6281234567890");
    assert.strictEqual(contacts[1].displayName, "Ahmad Zaki");
    assert.strictEqual(contacts[1].phone, "6285151771289");
  });

  it('MUST synthesize non-empty messageText when contactMessage is received without text caption', () => {
    const incomingContacts = [
      { displayName: "Danang", phone: "6281234567890" }
    ];

    let messageText = "";
    if (!messageText && incomingContacts.length > 0) {
      messageText = incomingContacts.map((c) => `[Kontak: ${c.displayName} - ${c.phone}]`).join("\n");
    }

    assert.ok(messageText.length > 0);
    assert.match(messageText, /Danang/);
    assert.match(messageText, /6281234567890/);
  });

  it('MUST extract phone when someone quotes a contactMessage in reply', () => {
    const quotedPayload = {
      contactMessage: {
        displayName: "Sahabat Budi",
        vcard: `BEGIN:VCARD\nFN:Sahabat Budi\nTEL;type=CELL:+62 813-9876-5432\nEND:VCARD`
      }
    };

    const quotedContacts = extractContactsFromBaileysMessage(quotedPayload);
    assert.strictEqual(quotedContacts.length, 1);

    let quotedText = "";
    if (!quotedText && quotedContacts.length > 0) {
      quotedText = quotedContacts.map((c) => `[Kontak: ${c.displayName} - ${c.phone}]`).join("\n");
    }

    assert.match(quotedText, /6281398765432/);
    assert.match(quotedText, /Sahabat Budi/);
  });
});
