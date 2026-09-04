import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "error", message: "Sesi tidak sah atau telah berakhir." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { face_data } = body;

    if (!face_data) {
      return NextResponse.json(
        { status: "error", message: "Data biometrik wajah wajib disertakan." },
        { status: 400 }
      );
    }

    // Standardize face_data as JSON string of 128 floats
    let faceDataString = "";
    if (typeof face_data === "string") {
      faceDataString = face_data;
    } else if (Array.isArray(face_data)) {
      faceDataString = JSON.stringify(face_data);
    } else {
      faceDataString = JSON.stringify(Array.from(face_data));
    }

    // Validate that it contains valid numbers
    try {
      const parsed = JSON.parse(faceDataString);
      if (!Array.isArray(parsed) || parsed.length < 64) {
        return NextResponse.json(
          { status: "error", message: "Format vektor biometrik tidak valid." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { status: "error", message: "Parsing vektor biometrik gagal." },
        { status: 400 }
      );
    }

    // Use service role to update profiles table safely
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

    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        face_data: faceDataString,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Supabase face_data update error:", updateError);
      return NextResponse.json(
        { status: "error", message: "Gagal menyimpan biometrik ke database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Data biometrik wajah berhasil disahkan dan disimpan.",
    });
  } catch (err: any) {
    console.error("Internal error in /api/profile/face-data:", err);
    return NextResponse.json(
      { status: "error", message: err.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
