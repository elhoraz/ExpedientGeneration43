import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InboxClient from "./InboxClient";
import { getWhatsAppConversations } from "@/lib/whatsapp-inbox";

export const metadata = {
  title: "WhatsApp Inbox & Chat Bot - Admin Expedient",
  description: "Kotak masuk dan manajemen pesan WhatsApp Cloud API resmi Expedient Generation",
};

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Pre-load seluruh percakapan di server untuk performa instan tanpa loading spinner
  const conversations = await getWhatsAppConversations();

  return <InboxClient initialConversations={conversations} />;
}
