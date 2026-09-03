import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/avatar";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Query profile by id
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, no_whatsapp, motivasi_hidup, foto_profil, alamat_lengkap, cita_cita")
      .eq("id", id)
      .maybeSingle();

    if (error || !profile) {
      console.warn("Profile not found for vCard ID:", id, error);
      return new NextResponse("Profile not found", { status: 404 });
    }

    const name = profile.nama_lengkap || profile.nama_panggilan || "Kolega Expedient";
    const nick = profile.nama_panggilan || "";
    
    // Format phone to international E.164 (+62...)
    let rawPhone = profile.no_whatsapp ? profile.no_whatsapp.replace(/\D/g, "") : "";
    if (rawPhone.startsWith("0")) {
      rawPhone = "62" + rawPhone.slice(1);
    }
    const phone = rawPhone ? `+${rawPhone}` : "";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://expedientgeneration.vercel.app";
    const photoUrl = profile.foto_profil ? getAvatarUrl(profile.foto_profil, name) : "";
    const safeNick = (nick || name).replace(/[^a-zA-Z0-9_-]/g, "_");

    // Standard RFC-compliant vCard 3.0 lines with CRLF
    const vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `N:${name};;;;`,
    ];

    if (nick) {
      vcardLines.push(`NICKNAME:${nick}`);
    }

    vcardLines.push("ORG:Expedient Generation 43");
    vcardLines.push("TITLE:Alumni");

    if (phone) {
      vcardLines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
    }

    if (photoUrl && photoUrl.startsWith("http")) {
      vcardLines.push(`PHOTO;VALUE=URI:${photoUrl}`);
    }

    vcardLines.push(`URL:${siteUrl}/dossier/${profile.id}`);

    const notes = [profile.motivasi_hidup, profile.cita_cita ? `Aspirasi: ${profile.cita_cita}` : ""]
      .filter(Boolean)
      .join(" | ");

    if (notes) {
      vcardLines.push(`NOTE:${notes}`);
    }

    if (profile.alamat_lengkap) {
      vcardLines.push(`ADR;TYPE=HOME:;;${profile.alamat_lengkap};;;;`);
    }

    vcardLines.push("END:VCARD");
    const vcardContent = vcardLines.join("\r\n") + "\r\n";

    return new NextResponse(vcardContent, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="Expedient_${safeNick}.vcf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    console.error("vCard generation error:", err);
    return new NextResponse("Internal Server Error: " + (err?.message || ""), { status: 500 });
  }
}
