import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { getRequestOrigin } from "@/lib/url";

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  const formData = await request.formData();
  
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const nama_lengkap = String(formData.get("nama_lengkap"));
  const nama_panggilan = String(formData.get("nama_panggilan"));
  const jenis_kelamin = String(formData.get("jenis_kelamin"));
  const tempat_lahir = String(formData.get("tempat_lahir"));
  const tanggal_lahir = String(formData.get("tanggal_lahir"));
  const alamat_lengkap = String(formData.get("alamat_lengkap"));
  const no_whatsapp = String(formData.get("no_whatsapp"));

  const motivasi_hidup = String(formData.get("motivasi_hidup") || "");
  const cita_cita = String(formData.get("cita_cita") || "");
  const akun_ig = String(formData.get("akun_ig") || "");
  const akun_tiktok = String(formData.get("akun_tiktok") || "");
  
  const face_data = String(formData.get("face_data") || "");
  const foto_profil_base64 = String(formData.get("foto_profil_base64") || "");

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama_lengkap,
        nama_panggilan,
        jenis_kelamin,
        tempat_lahir,
        tanggal_lahir,
        alamat_lengkap,
        no_whatsapp,
        motivasi_hidup,
        cita_cita,
        akun_ig,
        akun_tiktok,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  const isJsonRequest = 
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("content-type")?.includes("application/json") ||
    new URL(request.url).searchParams.get("json") === "true";

  if (error) {
    let errorMessage = "Pendaftaran gagal.";
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      errorMessage = "Email ini sudah terdaftar. Silakan langsung login.";
    } else {
      errorMessage = error.message;
    }

    if (isJsonRequest) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.redirect(`${origin}/register?error=${encodeURIComponent(errorMessage)}`, {
      status: 303,
    });
  }

  // Use Service Role to bypass RLS completely (without cookie interference)
  if (data.user) {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    let foto_profil = null;

    if (foto_profil_base64 && foto_profil_base64.startsWith("data:image")) {
      try {
        const commaIndex = foto_profil_base64.indexOf(",");
        const header = foto_profil_base64.substring(0, commaIndex);
        const base64Data = foto_profil_base64.substring(commaIndex + 1);
        const buffer = Buffer.from(base64Data, "base64");

        // Safe MIME and extension extraction
        const mimeMatch = header.match(/data:image\/([a-zA-Z0-9+.-]+)/);
        let ext = mimeMatch ? mimeMatch[1].toLowerCase() : "jpg";
        if (ext === "jpeg") ext = "jpg";
        const contentType = mimeMatch ? `image/${mimeMatch[1]}` : "image/jpeg";
        const fileName = `${data.user.id}_${Date.now()}.${ext}`;

        const { error: uploadError } = await adminSupabase.storage
          .from("profile-photos")
          .upload(fileName, buffer, {
            contentType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrl } = adminSupabase.storage
            .from("profile-photos")
            .getPublicUrl(fileName);
          foto_profil = publicUrl.publicUrl;
        } else {
          console.error("Supabase storage upload error from base64:", uploadError);
        }
      } catch (err) {
        console.error("Error uploading profile photo from base64:", err);
      }
    }

    // Fallback: If base64 was not present or failed, check raw multipart file
    if (!foto_profil) {
      const rawFile = formData.get("foto_profil_file");
      if (rawFile && typeof rawFile === "object" && "arrayBuffer" in rawFile && (rawFile as File).size > 0) {
        try {
          const fileObj = rawFile as File;
          const arrayBuffer = await fileObj.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const rawExt = (fileObj.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
          const ext = rawExt === "jpeg" ? "jpg" : (rawExt || "jpg");
          const fileName = `${data.user.id}_${Date.now()}.${ext}`;
          const contentType = fileObj.type || `image/${ext}`;

          const { error: uploadError } = await adminSupabase.storage
            .from("profile-photos")
            .upload(fileName, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicUrl } = adminSupabase.storage
              .from("profile-photos")
              .getPublicUrl(fileName);
            foto_profil = publicUrl.publicUrl;
          } else {
            console.error("Supabase storage raw file upload error:", uploadError);
          }
        } catch (err) {
          console.error("Error uploading raw profile file:", err);
        }
      }
    }

    const { error: upsertError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        nama_lengkap,
        nama_panggilan,
        jenis_kelamin,
        tempat_lahir,
        tanggal_lahir,
        alamat_lengkap,
        no_whatsapp,
        motivasi_hidup,
        cita_cita,
        akun_ig,
        akun_tiktok,
        is_active: false,
        face_data: face_data ? face_data : null,
        ...(foto_profil ? { foto_profil } : {})
      }, { onConflict: "id" });

    if (upsertError) {
      console.error("Error upserting profile after registration:", upsertError);
    }
  }

  // Jika dipanggil via AJAX / Fetch dari frontend (alur modal OTP 2-step)
  if (isJsonRequest) {
    return NextResponse.json({
      success: true,
      email,
      no_whatsapp,
      nama_lengkap,
      nama_panggilan,
      userId: data.user?.id,
      message: "Pendaftaran awal berhasil. Silakan pilih saluran verifikasi OTP Anda.",
    });
  }

  // Fallback untuk browser form submit standar
  return NextResponse.redirect(`${origin}/register?registered=true&email=${encodeURIComponent(email)}`, {
    status: 303,
  });
}
