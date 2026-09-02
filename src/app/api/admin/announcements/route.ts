import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { broadcastWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, content, category, isPinned } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ message: "Judul dan konten wajib diisi." }, { status: 400 });
    }

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

    // Dapatkan session admin jika ada (tapi admin auth kita bypass RLS, jadi kita catat created_by null atau ID user yang sedang login)
    const { data: { user } } = await supabase.auth.getUser();

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
