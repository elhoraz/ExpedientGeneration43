import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

async function getAllFiles(dirPath) {
  let files = [];
  if (!fs.existsSync(dirPath)) return files;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      files = files.concat(await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function convertLocalUploads() {
  console.log('\n==================================================');
  console.log('1. MENGONVERSI FILE LOKAL DI public/uploads KE WEBP');
  console.log('==================================================');

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('Direktori public/uploads tidak ditemukan.');
    return new Map();
  }

  const allFiles = await getAllFiles(UPLOADS_DIR);
  const imageExts = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif']);
  const pathMap = new Map(); // oldUrl -> newUrl

  let convertedCount = 0;
  let errorCount = 0;

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (!imageExts.has(ext)) continue;

    const baseName = filePath.slice(0, -ext.length);
    const newWebpPath = `${baseName}.webp`;

    const oldRelPath = '/uploads/' + path.relative(UPLOADS_DIR, filePath).replace(/\\/g, '/');
    const newRelPath = '/uploads/' + path.relative(UPLOADS_DIR, newWebpPath).replace(/\\/g, '/');

    try {
      const inputBuffer = fs.readFileSync(filePath);
      const webpBuffer = await sharp(inputBuffer)
        .rotate()
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      fs.writeFileSync(newWebpPath, webpBuffer);
      
      // Hapus file asli yang lama jika beda nama file
      if (filePath !== newWebpPath) {
        fs.unlinkSync(filePath);
      }

      const origKb = (inputBuffer.length / 1024).toFixed(1);
      const newKb = (webpBuffer.length / 1024).toFixed(1);
      const reduction = (((inputBuffer.length - webpBuffer.length) / inputBuffer.length) * 100).toFixed(1);

      console.log(`[CONVERTED] ${path.basename(filePath)} (${origKb}KB) -> ${path.basename(newWebpPath)} (${newKb}KB, -${reduction}%)`);
      pathMap.set(oldRelPath, newRelPath);
      convertedCount++;
    } catch (err) {
      console.error(`[ERROR] Gagal konversi ${filePath}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\nSelesai konversi lokal: ${convertedCount} berhasil, ${errorCount} gagal.`);
  return pathMap;
}

async function updateDatabaseReferences(pathMap) {
  if (!supabase) {
    console.log('\nSupabase client tidak tersedia, lewati update database.');
    return;
  }

  console.log('\n==================================================');
  console.log('2. MEMPERBARUI REFERENSI DATABASE LOKAL KE WEBP');
  console.log('==================================================');

  // 1. site_content
  try {
    const { data: contents, error } = await supabase.from('site_content').select('content_key, content_value');
    if (!error && contents) {
      for (const row of contents) {
        if (!row.content_value) continue;
        let updatedVal = row.content_value;
        let changed = false;

        for (const [oldUrl, newUrl] of pathMap.entries()) {
          if (updatedVal.includes(oldUrl)) {
            updatedVal = updatedVal.replace(new RegExp(oldUrl, 'g'), newUrl);
            changed = true;
          }
        }

        // Generic regex for any /uploads/...png|jpg|jpeg
        if (updatedVal.match(/\/uploads\/[^"'\s]+\.(png|jpg|jpeg|gif)/i)) {
          updatedVal = updatedVal.replace(/\.(png|jpg|jpeg|gif)/gi, '.webp');
          changed = true;
        }

        if (changed) {
          await supabase
            .from('site_content')
            .update({ content_value: updatedVal, updated_at: new Date().toISOString() })
            .eq('content_key', row.content_key);
          console.log(`[DB site_content] Updated ${row.content_key} -> ${updatedVal}`);
        }
      }
    }
  } catch (err) {
    console.error('[DB site_content error]:', err.message);
  }

  // 2. profiles (jika ada yang menyimpan path lokal /uploads/)
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, foto_profil')
      .ilike('foto_profil', '%/uploads/%');

    if (!error && profiles) {
      for (const prof of profiles) {
        if (!prof.foto_profil) continue;
        let newUrl = prof.foto_profil;
        for (const [oldUrl, replUrl] of pathMap.entries()) {
          if (newUrl.includes(oldUrl)) {
            newUrl = newUrl.replace(oldUrl, replUrl);
          }
        }
        if (newUrl.match(/\.(png|jpg|jpeg|gif)$/i)) {
          newUrl = newUrl.replace(/\.(png|jpg|jpeg|gif)$/i, '.webp');
        }
        if (newUrl !== prof.foto_profil) {
          await supabase.from('profiles').update({ foto_profil: newUrl }).eq('id', prof.id);
          console.log(`[DB profiles local] Updated ${prof.nama_lengkap} -> ${newUrl}`);
        }
      }
    }
  } catch (err) {
    console.error('[DB profiles error]:', err.message);
  }

  // 3. galeri (jika ada path lokal)
  try {
    const { data: galeriList, error } = await supabase
      .from('galeri')
      .select('id, image_url')
      .ilike('image_url', '%/uploads/%');

    if (!error && galeriList) {
      for (const g of galeriList) {
        let newUrl = g.image_url;
        for (const [oldUrl, replUrl] of pathMap.entries()) {
          if (newUrl.includes(oldUrl)) {
            newUrl = newUrl.replace(oldUrl, replUrl);
          }
        }
        if (newUrl.match(/\.(png|jpg|jpeg|gif)$/i)) {
          newUrl = newUrl.replace(/\.(png|jpg|jpeg|gif)$/i, '.webp');
        }
        if (newUrl !== g.image_url) {
          await supabase.from('galeri').update({ image_url: newUrl }).eq('id', g.id);
          console.log(`[DB galeri local] Updated ${g.id} -> ${newUrl}`);
        }
      }
    }
  } catch (err) {
    console.error('[DB galeri error]:', err.message);
  }
}

async function convertSupabaseStorageBuckets() {
  if (!supabase) return;

  console.log('\n==================================================');
  console.log('3. MENGONVERSI GAMBAR DI SUPABASE STORAGE KE WEBP');
  console.log('==================================================');

  // Helper batch runner
  async function runInBatches(items, batchSize, fn) {
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      await Promise.all(chunk.map(fn));
    }
  }

  // A. Profiles Bucket
  try {
    const { data: profs, error } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, foto_profil')
      .not('foto_profil', 'is', null);

    if (!error && profs) {
      const nonWebpProfs = profs.filter(p => p.foto_profil && !p.foto_profil.endsWith('.webp'));
      console.log(`Ditemukan ${nonWebpProfs.length} foto profil remote yang belum berformat .webp`);

      await runInBatches(nonWebpProfs, 2, async (p) => {
        let attempts = 0;
        let success = false;

        while (attempts < 2 && !success) {
          attempts++;
          try {
            const url = p.foto_profil;
            const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
            if (!match) return;

            const matchedBucket = match[1];
            const fullFilePath = decodeURIComponent(match[2]);

            // Fetch via CDN with 30s timeout
            const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) {
              console.warn(`[STORAGE DL WARN] HTTP ${res.status} for ${url}`);
              return;
            }

            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Konversi ke WebP
            let webpBuffer;
            try {
              webpBuffer = await sharp(buffer)
                .rotate()
                .webp({ quality: 85, effort: 4 })
                .toBuffer();
            } catch (sharpErr) {
              console.warn(`[SHARP CONVERT SKIP] Format tidak didukung sharp untuk ${p.nama_lengkap}: ${sharpErr.message}`);
              return;
            }

            const ext = path.extname(fullFilePath);
            const newFilePath = fullFilePath.slice(0, -ext.length) + '.webp';

            // Upload versi WebP
            const { error: upError } = await supabase.storage
              .from(matchedBucket)
              .upload(newFilePath, webpBuffer, {
                contentType: 'image/webp',
                upsert: true,
              });

            if (upError) {
              console.error(`[STORAGE UP ERROR] Gagal upload ${newFilePath}:`, upError.message);
              return;
            }

            const { data: { publicUrl: newPublicUrl } } = supabase.storage
              .from(matchedBucket)
              .getPublicUrl(newFilePath);

            // Update foto_profil di database
            await supabase
              .from('profiles')
              .update({ foto_profil: newPublicUrl })
              .eq('id', p.id);

            console.log(`[STORAGE PROFILES WEBP] ${p.nama_lengkap}: -> ${newFilePath}`);
            success = true;
          } catch (itemErr) {
            if (attempts >= 2) {
              console.error(`[STORAGE CONVERT ERROR] Profile ${p.nama_lengkap} (gagal setelah 2x coba):`, itemErr.message);
            } else {
              console.warn(`[RETRY] Profile ${p.nama_lengkap}: mencoba lagi...`);
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('[STORAGE PROFILES ERROR]:', err.message);
  }

  // B. Galeri Bucket
  try {
    const { data: gals, error } = await supabase
      .from('galeri')
      .select('id, image_url')
      .not('image_url', 'is', null);

    if (!error && gals) {
      const nonWebpGals = gals.filter(g => g.image_url && !g.image_url.endsWith('.webp'));
      console.log(`Ditemukan ${nonWebpGals.length} gambar galeri remote yang belum berformat .webp`);

      await runInBatches(nonWebpGals, 5, async (g) => {
        try {
          const url = g.image_url;
          const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
          if (!match) return;

          const matchedBucket = match[1];
          const fullFilePath = decodeURIComponent(match[2]);

          const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) {
            console.warn(`[STORAGE DL WARN] HTTP ${res.status} for ${url}`);
            return;
          }

          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const webpBuffer = await sharp(buffer)
            .rotate()
            .webp({ quality: 85, effort: 4 })
            .toBuffer();

          const ext = path.extname(fullFilePath);
          const newFilePath = fullFilePath.slice(0, -ext.length) + '.webp';

          const { error: upError } = await supabase.storage
            .from(matchedBucket)
            .upload(newFilePath, webpBuffer, {
              contentType: 'image/webp',
              upsert: true,
            });

          if (upError) {
            console.error(`[STORAGE UP ERROR] Gagal upload ${newFilePath}:`, upError.message);
            return;
          }

          const { data: { publicUrl: newPublicUrl } } = supabase.storage
            .from(matchedBucket)
            .getPublicUrl(newFilePath);

          await supabase
            .from('galeri')
            .update({ image_url: newPublicUrl })
            .eq('id', g.id);

          console.log(`[STORAGE GALERI WEBP] Galeri ${g.id}: -> ${newFilePath}`);
        } catch (itemErr) {
          console.error(`[STORAGE CONVERT ERROR] Galeri ${g.id}:`, itemErr.message);
        }
      });
    }
  } catch (err) {
    console.error('[STORAGE GALERI ERROR]:', err.message);
  }
}

async function main() {
  console.log('Starting WebP migration process...');
  const pathMap = await convertLocalUploads();
  await updateDatabaseReferences(pathMap);
  await convertSupabaseStorageBuckets();
  console.log('\n==================================================');
  console.log('MIGRASI KE WEBP SELESAI DENGAN SUKSES!');
  console.log('==================================================');
}

main().catch(console.error);
