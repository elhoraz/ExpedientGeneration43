import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function getAvatarUrl(foto_profil, fallbackName = 'A') {
  if (!foto_profil || foto_profil === 'default.webp' || foto_profil === 'null' || foto_profil.trim() === '') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=d4af37&color=000&bold=true`;
  }

  const trimmed = foto_profil.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dodcwulqgrhqpbldrlik.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/profile-photos/${trimmed}`;
}

describe('Universal Avatar URL Resolver', () => {
  it('should return ui-avatars URL when photo is null, empty, or default.webp', () => {
    const res1 = getAvatarUrl(null, 'John Doe');
    assert.match(res1, /^https:\/\/ui-avatars\.com\/api\/\?name=John/);

    const res2 = getAvatarUrl('', 'Jane');
    assert.match(res2, /^https:\/\/ui-avatars\.com\/api\/\?name=Jane/);

    const res3 = getAvatarUrl('default.webp', 'Admin');
    assert.match(res3, /^https:\/\/ui-avatars\.com\/api\/\?name=Admin/);
  });

  it('should preserve full external URLs (http/https)', () => {
    const fullUrl = 'https://supabase.co/storage/v1/object/public/profile-photos/user_123.jpg';
    assert.equal(getAvatarUrl(fullUrl), fullUrl);
  });

  it('should preserve local relative paths starting with /', () => {
    const localPath = '/uploads/profiles/user_456.webp';
    assert.equal(getAvatarUrl(localPath), localPath);
  });

  it('should construct Supabase storage URL when given bare filename', () => {
    const fileName = 'user_789.png';
    const res = getAvatarUrl(fileName);
    assert.match(res, /\/storage\/v1\/object\/public\/profile-photos\/user_789\.png$/);
  });
});
