import { createAdminClient } from "@/lib/supabase/admin";

export type MessageItem = {
  id: number;
  direction: "incoming" | "outgoing";
  message: string;
  status: string;
  timestamp: string;
  senderNote?: string;
};

export type Conversation = {
  phoneNumber: string;
  displayName: string;
  userRole: string;
  avatarUrl?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: MessageItem[];
};

/**
 * Mengambil dan mengelompokkan seluruh riwayat pesan WhatsApp masuk & keluar
 */
export async function getWhatsAppConversations(): Promise<Conversation[]> {
  try {
    const adminSupabase = createAdminClient();

    // 1. Ambil 250 pesan WhatsApp terbaru
    const { data: rawMessages, error } = await adminSupabase
      .from("whatsapp_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      console.error("[GET-WA-CONVERSATIONS-QUERY-ERROR]:", error);
      return [];
    }

    // 2. Ambil seluruh profil alumni untuk pencocokan nomor telepon
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, no_whatsapp, role, foto_url, foto_profil")
      .not("no_whatsapp", "is", null);

    const profileMap = new Map<string, any>();
    if (profiles) {
      for (const p of profiles) {
        if (!p.no_whatsapp) continue;
        const norm = String(p.no_whatsapp).replace(/\D/g, "");
        profileMap.set(norm, p);
        if (norm.startsWith("62")) profileMap.set("0" + norm.substring(2), p);
        if (norm.startsWith("0")) profileMap.set("62" + norm.substring(1), p);
      }
    }

    // 3. Kelompokkan berdasarkan nomor kontak
    const conversationsMap = new Map<string, Conversation>();

    for (const item of (rawMessages || []).reverse()) {
      const num = String(item.no_whatsapp || "").replace(/\D/g, "");
      if (!num) continue;

      const profile = profileMap.get(num);
      const displayName =
        profile?.nama_lengkap ||
        profile?.nama_panggilan ||
        (item.error_message?.startsWith("Nama: ")
          ? item.error_message.replace("Nama: ", "")
          : `+${num}`);

      const userRole = profile?.role ? String(profile.role).toUpperCase() : "ALUMNI";
      const avatarUrl = profile?.foto_url || profile?.foto_profil;
      const isIncoming = item.status === "received";

      if (!conversationsMap.has(num)) {
        conversationsMap.set(num, {
          phoneNumber: num,
          displayName,
          userRole,
          avatarUrl,
          lastMessage: item.message,
          lastTimestamp: item.created_at,
          unreadCount: isIncoming ? 1 : 0,
          messages: [],
        });
      }

      const conv = conversationsMap.get(num)!;
      conv.lastMessage = item.message;
      conv.lastTimestamp = item.created_at;
      if (isIncoming) conv.unreadCount += 1;

      conv.messages.push({
        id: item.id,
        direction: isIncoming ? "incoming" : "outgoing",
        message: item.message,
        status: item.status,
        timestamp: item.created_at,
        senderNote: item.error_message,
      });
    }

    // Urutkan berdasarkan waktu pesan terbaru
    return Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  } catch (err) {
    console.error("[GET-WA-CONVERSATIONS-EXCEPTION]:", err);
    return [];
  }
}
