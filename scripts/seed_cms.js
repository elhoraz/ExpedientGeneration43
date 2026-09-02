const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const contents = [
  { content_key: 'landing_hero_eyebrow', content_value: '42nd Pondok Modern Arrisalah', content_type: 'text' },
  { content_key: 'landing_hero_title', content_value: 'Expedient Generation', content_type: 'text' },
  { content_key: 'landing_hero_subtitle', content_value: 'Museum digital eksklusif dan platform komunitas alumni angkatan ke-42. Menjaga warisan, membangun masa depan, mempersatukan barisan.', content_type: 'textarea' },
  { content_key: 'landing_hero_image', content_value: '/images/logo-utuh.webp', content_type: 'image' },
  { content_key: 'landing_about_eyebrow', content_value: 'Tentang Kami', content_type: 'text' },
  { content_key: 'landing_about_title', content_value: 'Kami Bukan Sekadar Angkatan', content_type: 'text' },
  { content_key: 'landing_about_text', content_value: 'Kami adalah barisan pelopor yang lahir dari rahim Arrisalah, dibentuk oleh waktu, dipersatukan oleh takdir. Platform ini adalah monumen digital untuk menjaga silaturahmi, mendokumentasikan jejak langkah, dan membangun masa depan bersama.', content_type: 'textarea' },
  { content_key: 'landing_footer_text', content_value: 'Expedient Generation — 42nd Pondok Modern Arrisalah', content_type: 'text' }
];

async function seed() {
  for (let c of contents) {
    const { data, error } = await supabase.from('site_content').upsert(c, { onConflict: 'content_key' });
    if (error) console.error(error);
    else console.log('Seeded:', c.content_key);
  }
}
seed();
