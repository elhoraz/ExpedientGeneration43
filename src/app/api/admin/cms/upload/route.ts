export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";

async function getAdminContext() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;

  // 1. Verifikasi via Token Sesi Admin HMAC
  const isSignedAdmin = await verifySignedAdminSession(adminToken);
  const isLegacyUnlocked = adminToken === "unlocked";

  if (isSignedAdmin || isLegacyUnlocked) {
    return { ok: true, adminSupabase: createAdminClient() };
  }

  // 2. Verifikasi via Sesi Login Supabase (role: admin / superadmin)
  try {
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (user) {
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "superadmin") {
        return { ok: true, adminSupabase: adminClient };
      }
    }
  } catch (err) {
    console.warn("[ADMIN-UPLOAD-AUTH-WARN]:", err);
  }

  return { 
    ok: false, 
    error: "Sesi admin Anda tidak valid atau telah kedaluwarsa. Silakan masukkan sandi admin kembali di /admin/unlock.", 
    status: 401 
  };
}

export async function POST(request: Request) {
  try {
    const auth = await getAdminContext();
    if (!auth.ok || !auth.adminSupabase) {
      return NextResponse.json({ message: auth.error }, { status: auth.status || 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let bucket = (formData.get("bucket") as string) || "cms-assets";
    const folder = (formData.get("folder") as string) || "cms";

    if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
      return NextResponse.json({ message: "Tidak ada file yang dipilih untuk diunggah." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Pastikan bucket target ada, jika belum coba buat bucket publik
    try {
      const { data: buckets } = await auth.adminSupabase.storage.listBuckets();
      const bucketExists = buckets?.some((b: any) => b.name === bucket || b.id === bucket);
      if (!bucketExists) {
        await auth.adminSupabase.storage.createBucket(bucket, { public: true });
      }
    } catch (bErr) {
      console.warn("[ADMIN-BUCKET-CHECK-WARN]:", bErr);
    }

    // Upload menggunakan Service Role client (Bypass RLS)
    let { error: uploadError } = await auth.adminSupabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    // Fallback: Jika bucket spesifik gagal, coba bucket profile-photos yang sudah pasti ada
    if (uploadError && bucket !== "profile-photos") {
      console.warn(`[STORAGE-FALLBACK]: Bucket ${bucket} gagal (${uploadError.message}), mencoba fallback ke profile-photos`);
      bucket = "profile-photos";
      const fallbackResult = await auth.adminSupabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });
      uploadError = fallbackResult.error;
    }

    if (uploadError) {
      console.error("[ADMIN-STORAGE-UPLOAD-ERR]:", uploadError);
      return NextResponse.json(
        { message: "Gagal mengunggah file ke penyimpanan Supabase: " + uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = auth.adminSupabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (err: any) {
    console.error("[ADMIN-CMS-UPLOAD-EXCEPTION]:", err);
    return NextResponse.json(
      { message: err?.message || "Terjadi kesalahan server saat mengunggah file." },
      { status: 500 }
    );
  }
}
