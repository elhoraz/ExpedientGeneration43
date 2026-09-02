const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const imageKeys = [
    { content_key: 'beranda_img_full', content_value: '/images/logo-utuh.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_1', content_value: '/images/globe.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_2', content_value: '/images/teks-gabungan.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_3', content_value: '/images/cincin-emas.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_4', content_value: '/images/pita-putih.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_5', content_value: '/images/perisai-bendera.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_6', content_value: '/images/tanduk-perak.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_7', content_value: '/images/segi-delapan-perak.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_8', content_value: '/images/bingkai-kristal-biru.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_9', content_value: '/images/ornamen-bawah-emas.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_10', content_value: '/images/segi-delapan-gelap.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_11', content_value: '/images/mahkota-emas.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_12', content_value: '/images/kristal-puncak.webp', content_type: 'image' },
    { content_key: 'beranda_img_shard_13', content_value: '/images/zamrud-hijau.webp', content_type: 'image' },
];

async function run() {
    const { error } = await supabase.from('site_content').upsert(imageKeys, { onConflict: 'content_key' });
    if (error) {
        console.error("Error upserting:", error);
    } else {
        console.log("Successfully upserted 14 image keys!");
    }
}

run();
