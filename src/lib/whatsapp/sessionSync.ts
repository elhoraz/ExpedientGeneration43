import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "wa-session-backup";
const FILE_NAME = "wa_session.gz";

/**
 * Cadangkan seluruh file sesi Baileys (.baileys_auth) ke Supabase Storage (terkompresi gzip)
 */
export async function backupSessionToSupabase(authDir: string): Promise<boolean> {
  try {
    if (!fs.existsSync(authDir)) return false;

    const files = fs.readdirSync(authDir);
    if (!files.includes("creds.json")) {
      return false; // Jangan backup jika belum terdaftar kredensial valid
    }

    const payload: Record<string, string> = {};
    for (const f of files) {
      const fullPath = path.join(authDir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && f.endsWith(".json")) {
        payload[f] = fs.readFileSync(fullPath, "utf8");
      }
    }

    const jsonStr = JSON.stringify(payload);
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonStr, "utf8"));

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(FILE_NAME, compressedBuffer, {
        contentType: "application/gzip",
        upsert: true,
      });

    if (error) {
      console.warn("[SESSION-SYNC-BACKUP-WARN] Gagal backup ke Supabase Storage:", error.message);
      return false;
    }

    console.log(`☁️ [SESSION-SYNC-SUCCESS] Berhasil mencadangkan ${Object.keys(payload).length} file sesi ke Supabase Storage (${(compressedBuffer.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err: any) {
    console.warn("[SESSION-SYNC-BACKUP-ERROR]:", err.message);
    return false;
  }
}

/**
 * Pulihkan seluruh file sesi Baileys dari Supabase Storage jika di container cloud belum ada sesi
 */
export async function restoreSessionFromSupabase(authDir: string): Promise<boolean> {
  try {
    const credsPath = path.join(authDir, "creds.json");
    if (fs.existsSync(credsPath)) {
      try {
        const rawCreds = fs.readFileSync(credsPath, "utf8");
        const parsed = JSON.parse(rawCreds);
        if (parsed?.me?.id) {
          console.log("💾 [SESSION-RESTORE] Folder sesi lokal sudah memiliki creds.json valid, menggunakan sesi lokal.");
          return true;
        }
      } catch (_) {}
      console.log("ℹ️ [SESSION-RESTORE] File creds lokal belum terautentikasi (belum ada me.id), mencoba pulihkan dari Supabase Storage...");
    }

    console.log("☁️ [SESSION-RESTORE] Memeriksa cadangan sesi di Supabase Storage...");
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(FILE_NAME);

    if (error || !data) {
      console.log("ℹ️ [SESSION-RESTORE] Belum ada cadangan sesi di Supabase Storage.");
      return false;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const decompressed = zlib.gunzipSync(buffer).toString("utf8");
    const payload: Record<string, string> = JSON.parse(decompressed);

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    let fileCount = 0;
    for (const [filename, content] of Object.entries(payload)) {
      fs.writeFileSync(path.join(authDir, filename), content, "utf8");
      fileCount++;
    }

    console.log(`✅ [SESSION-RESTORE-SUCCESS] Berhasil memulihkan ${fileCount} file sesi WhatsApp dari Supabase Storage!`);
    return true;
  } catch (err: any) {
    console.warn("[SESSION-RESTORE-ERROR]:", err.message);
    return false;
  }
}
