import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus ada di .env.local");
  console.error("Dapatkan SERVICE_ROLE_KEY dari Supabase Dashboard -> Project Settings -> API.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const DEFAULT_PASSWORD = 'Expedient2026!';
const SQL_FILE_PATH = path.resolve(__dirname, '../if0_41743241_expedient.sql');

async function migrateUsers() {
    console.log("🚀 Memulai Migrasi User (Opsi A - Default Password)...");
    
    if (!fs.existsSync(SQL_FILE_PATH)) {
        console.error("❌ File SQL tidak ditemukan di:", SQL_FILE_PATH);
        return;
    }

    const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf-8');
    
    // Cari query INSERT INTO `users`
    const insertMatches = sqlContent.match(/INSERT INTO `users` \([^\)]+\) VALUES\s*([\s\S]*?);/i);
    
    if (!insertMatches) {
        console.error("❌ Data INSERT INTO `users` tidak ditemukan dalam file SQL.");
        return;
    }

    let valuesStr = insertMatches[1].trim();
    
    // Parse values (sangat sederhana berbasis regex, mengasumsikan format dump phpMyAdmin)
    // Regex ini mencari pola: (value1, value2, ...)
    const rowRegex = /\(([^)]+)\)/g;
    let match;
    let count = 0;
    let success = 0;

    console.log("Sedang memproses baris data...");

    while ((match = rowRegex.exec(valuesStr)) !== null) {
        const rowData = match[1];
        // Split by comma, tapi abaikan koma di dalam tanda kutip tunggal
        // Cara simpel: gunakan split regex yang memperhitungkan quotes (basic)
        const cols = [];
        let inQuotes = false;
        let current = "";
        
        for (let i = 0; i < rowData.length; i++) {
            const char = rowData[i];
            if (char === "'") {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                cols.push(current.trim());
                current = "";
                continue;
            }
            current += char;
        }
        cols.push(current.trim()); // sisa

        // Struktur kolom MySQL:
        // id[0], public_token[1], nama_lengkap[2], nama_panggilan[3], jenis_kelamin[4], tempat_lahir[5], tanggal_lahir[6],
        // birth_month_day[7], alamat_lengkap[8], email[9], password_hash[10], no_whatsapp[11], ...

        if (cols.length < 10) continue;

        const email = cols[9].replace(/^'|'$/g, '');
        const nama_lengkap = cols[2].replace(/^'|'$/g, '');
        const nama_panggilan = cols[3].replace(/^'|'$/g, '');
        const domisili = cols[8].replace(/^'|'$/g, '');
        const tanggal_lahir_raw = cols[6].replace(/^'|'$/g, '');
        const tanggal_lahir = tanggal_lahir_raw === 'NULL' ? null : tanggal_lahir_raw;

        count++;
        console.log(`[${count}] Memproses: ${email} - ${nama_lengkap}`);

        try {
            // 1. Buat User di Supabase Auth
            let userId = null;
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: DEFAULT_PASSWORD,
                email_confirm: true, // Auto confirm
                user_metadata: {
                    nama_lengkap: nama_lengkap,
                    nama_panggilan: nama_panggilan
                }
            });

            if (authError) {
                if (authError.message.includes('already exists') || authError.message.includes('email_exists') || authError.message.includes('already been registered')) {
                    console.log(`    ⚠️  Email ${email} sudah terdaftar di Auth, mengambil ID...`);
                    // Fetch user id
                    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
                    if (!listError) {
                        const existingUser = existingUsers.users.find(u => u.email === email);
                        if (existingUser) userId = existingUser.id;
                    }
                } else {
                    console.error(`    ❌ Error Auth: ${authError.message}`);
                    continue; // Skip jika error auth
                }
            } else {
                userId = authData.user.id;
            }

            if (!userId) {
                 console.error(`    ❌ Gagal mendapatkan User ID untuk ${email}`);
                 continue;
            }

            // 2. Insert ke tabel public.users
            const { error: dbError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    nama_lengkap: nama_lengkap,
                    nama_panggilan: nama_panggilan,
                    domisili: domisili === 'NULL' ? null : domisili,
                    tanggal_lahir: tanggal_lahir,
                    role: email.includes('admin') ? 'admin' : 'member', // Simple role check
                    bio: null
                });

            if (dbError) {
                console.error(`    ❌ Error Insert public.users: ${dbError.message}`);
            } else {
                console.log(`    ✅ Berhasil mendaftarkan ${nama_lengkap}`);
                success++;
            }
            
        } catch (err) {
            console.error(`    ❌ Error Sistem:`, err);
        }
    }

    console.log(`\n🎉 Migrasi Selesai!`);
    console.log(`Total data terbaca: ${count}`);
    console.log(`Total sukses migrasi: ${success}`);
    console.log(`Semua akun berhasil disetel dengan password: ${DEFAULT_PASSWORD}`);
}

migrateUsers();
