const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const dirs = [
  'admin',          'announcements',   'create',
  'broadcast',      'cms',             'events',
  'manage',          'export',
  'moderation',     'users',           'wallet-generator',
  'unlock',         'baitul-maal',     'beranda',
  'birthday',       'buku-tamu',       'chat',
  'lounge',         'personal',        'direktori',
  'event',          'fitur',           'galeri',
  'majlis',         'multazam',        'nexus',
  'profil',         'radar',           'syndicate',
  'edit',           'tarbiyah',        'wasiat',
  'ar-hologram',    'celestial',       'divine',
  'dossier',        'enigma',          'genesis',
  'kontemplasi',    'oracle',          'scanner',
  'wrapped',        'auth',            'callback',
  'login',          'logout',          'register',
  'reset-password', 'forgot-password', 'offline',
  'sovereign'
];

async function seed() {
    let toInsert = [];
    for(let dir of dirs) {
        toInsert.push({
            content_key: `${dir}_title`,
            content_value: `Halaman ${dir}`,
            content_type: 'text'
        });
    }

    const { data, error } = await supabase
      .from('site_content')
      .upsert(toInsert, { onConflict: 'content_key' });

    if(error) console.error(error);
    else console.log('Successfully seeded pages into CMS!');
}

seed();
