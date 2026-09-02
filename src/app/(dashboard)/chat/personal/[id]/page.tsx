import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PersonalChatClient from "./PersonalChatClient";
import "../../chat.css";

export const metadata = {
  title: "Ruang Obrolan | Expedient",
};

export default async function PersonalChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: contactId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  if (user.id === contactId) {
    return redirect("/chat"); // Cannot chat with yourself
  }

  // Ambil profil kontak
  const { data: contact } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, foto_profil")
    .eq("id", contactId)
    .single();

  if (!contact) {
    return redirect("/chat");
  }

  // Fetch initial messages between user and contact
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id, message, image_url, audio_url, video_url, message_type, created_at, sender_id, receiver_id, is_deleted, is_read")
    .eq("is_lounge", false)
    .eq("is_deleted", false)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark messages as read
  if (messages && messages.some(m => m.sender_id === contactId && !m.is_read)) {
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("sender_id", contactId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);
  }

  if (error) {
    console.error("Error fetching messages:", error);
  }

  const sortedMessages = messages ? [...messages].reverse() : [];

  return (
    <PersonalChatClient 
      initialMessages={sortedMessages} 
      userId={user.id} 
      contact={contact} 
    />
  );
}
