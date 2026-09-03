import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function generateVCard(profile, siteUrl = 'https://expedientgeneration.vercel.app') {
  const name = profile.nama_lengkap || profile.nama_panggilan || 'Kolega Expedient';
  const nick = profile.nama_panggilan || '';
  
  let rawPhone = profile.no_whatsapp ? profile.no_whatsapp.replace(/\D/g, '') : '';
  if (rawPhone.startsWith('0')) {
    rawPhone = '62' + rawPhone.slice(1);
  }
  const phone = rawPhone ? `+${rawPhone}` : '';

  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${name};;;;`,
  ];

  if (nick) {
    vcardLines.push(`NICKNAME:${nick}`);
  }

  vcardLines.push('ORG:Expedient Generation 42');
  vcardLines.push('TITLE:Alumni');

  if (phone) {
    vcardLines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
  }

  if (profile.foto_profil && profile.foto_profil.startsWith('http')) {
    vcardLines.push(`PHOTO;VALUE=URI:${profile.foto_profil}`);
  }

  vcardLines.push(`URL:${siteUrl}/dossier/${profile.id}`);

  const notes = [profile.motivasi_hidup, profile.cita_cita ? `Aspirasi: ${profile.cita_cita}` : '']
    .filter(Boolean)
    .join(' | ');

  if (notes) {
    vcardLines.push(`NOTE:${notes}`);
  }

  if (profile.alamat_lengkap) {
    vcardLines.push(`ADR;TYPE=HOME:;;${profile.alamat_lengkap};;;;`);
  }

  vcardLines.push('END:VCARD');
  return vcardLines.join('\r\n') + '\r\n';
}

describe('vCard 3.0 Generation Logic', () => {
  it('should generate valid vCard structure with CRLF line endings', () => {
    const profile = {
      id: 'user-123',
      nama_lengkap: 'Muhammad Faris',
      nama_panggilan: 'Faris',
      no_whatsapp: '081234567890',
      motivasi_hidup: 'Terus melangkah',
      cita_cita: 'CEO',
      foto_profil: 'https://storage.com/photo.jpg',
      alamat_lengkap: 'Jakarta, Indonesia'
    };

    const vcf = generateVCard(profile);
    assert.ok(vcf.startsWith('BEGIN:VCARD\r\n'));
    assert.ok(vcf.endsWith('END:VCARD\r\n'));
    assert.ok(vcf.includes('VERSION:3.0\r\n'));
    assert.ok(vcf.includes('FN:Muhammad Faris\r\n'));
    assert.ok(vcf.includes('NICKNAME:Faris\r\n'));
    assert.ok(vcf.includes('TEL;TYPE=CELL,VOICE:+6281234567890\r\n'));
    assert.ok(vcf.includes('PHOTO;VALUE=URI:https://storage.com/photo.jpg\r\n'));
    assert.ok(vcf.includes('ORG:Expedient Generation 42\r\n'));
    assert.ok(vcf.includes('ADR;TYPE=HOME:;;Jakarta, Indonesia;;;;\r\n'));
  });

  it('should gracefully handle missing fields and convert 0-prefixed phone to +62', () => {
    const profile = {
      id: 'user-456',
      no_whatsapp: '089988776655',
    };

    const vcf = generateVCard(profile);
    assert.ok(vcf.includes('FN:Kolega Expedient\r\n'));
    assert.ok(vcf.includes('TEL;TYPE=CELL,VOICE:+6289988776655\r\n'));
    assert.ok(!vcf.includes('PHOTO'));
  });
});
