import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastWhatsAppMessage } from "@/lib/whatsapp";
import { verifySignedAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("expedient_admin_session")?.value;
    const isValidAdmin = await verifySignedAdminSession(adminToken);
    if (!isValidAdmin) {
      return NextResponse.json({ message: "Unauthorized: Sesi admin tidak valid atau telah kedaluwarsa" }, { status: 401 });
    }

    const { title, content, category, isPinned } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ message: "Judul dan konten wajib diisi." }, { status: 400 });
    }

    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    const supabase = createAdminClient();

    const { data, error } = await supabase.from("announcements").insert([
      {
        title,
        content,
        category: category || "general",
        is_pinned: isPinned,
        created_by: user?.id || null,
        published_at: new Date().toISOString(),
      },
    ]).select();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // ========================================================================
    // AUTO-NOTIFICATION TO ALL USERS (Except sender)
    // ========================================================================
    // Note: In production with many users, this should be done via Edge Functions or background jobs
    try {
      const { data: profiles } = await supabase.from("profiles").select("id, no_whatsapp").neq("id", user?.id || "");
      if (profiles && profiles.length > 0) {
        // 1. In-App Notifications
        const notifs = profiles.map(p => ({
          user_id: p.id,
          title: `Pengumuman Baru: ${title}`,
          message: `Admin mempublikasikan pengumuman baru di kategori ${category}.`,
          link: "/beranda",
        }));
        await supabase.from("notifications").insert(notifs);

        // 2. WhatsApp Broadcast (SVC-01)
        const waTargets = profiles.map(p => p.no_whatsapp).filter(Boolean);
        if (waTargets.length > 0) {
          const waMessage = `📢 *Pengumuman Baru Expedient*\n\n*${title}*\n\nSilakan cek selengkapnya di portal Sovereign Nexus.`;
          await broadcastWhatsAppMessage(waTargets as string[], waMessage);
        }
      }
    } catch (e) {
      console.error("Gagal mengirim notifikasi massal:", e);
    }

    return NextResponse.json({ status: "success", data });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
