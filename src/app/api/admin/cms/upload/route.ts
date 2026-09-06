export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { verifySignedAdminSession } from "@/lib/admin-auth";

async function getAdminContext() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const isSignedAdmin = await verifySignedAdminSession(adminToken);
  const isLegacyUnlocked = adminToken === "unlocked";

  if (isSignedAdmin || isLegacyUnlocked) {
    return { ok: true, supabase };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "superadmin") {
        return { ok: true, supabase };
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
    if (!auth.ok || !auth.supabase) {
      return NextResponse.json({ message: auth.error }, { status: auth.status || 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "cms-assets";
    const folder = (formData.get("folder") as string) || "cms";

    if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
      return NextResponse.json({ message: "Tidak ada file yang dipilih untuk diunggah." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await auth.supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[ADMIN-STORAGE-UPLOAD-ERR]:", uploadError);
      return NextResponse.json(
        { message: "Gagal mengunggah file ke penyimpanan Supabase: " + uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = auth.supabase.storage.from(bucket).getPublicUrl(fileName);

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
