import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .or(`id.eq.${id},public_token.eq.${id}`)
      .maybeSingle();

    if (!profile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const name = profile.nama_lengkap || profile.nama_panggilan || "Anggota";
    const phone = profile.no_whatsapp ? `+${profile.no_whatsapp.replace(/\D/g, '')}` : "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://expedientgeneration.com";
    const photoUrl = profile.foto_profil 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/${profile.foto_profil}` 
        : "";

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
NICKNAME:${profile.nama_panggilan || ""}
TEL;TYPE=CELL:${phone}
PHOTO;VALUE=URL:${photoUrl}
URL:${siteUrl}/dossier/${id}
NOTE:${profile.motivasi_hidup || ""}
END:VCARD`;

    return new NextResponse(vcard, {
      headers: {
        "Content-Type": "text/x-vcard",
        "Content-Disposition": `attachment; filename="Expedient_${profile.nama_panggilan || 'Contact'}.vcf"`,
      },
    });
  } catch (err) {
    console.error("vCard error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
