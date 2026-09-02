import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export const metadata = {
  title: "The Lounge - Expedient",
};

export default async function ChatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch initial messages (limit to 50 for the lounge)
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(`
      id,
      message,
      image_url,
      audio_url,
      video_url,
      message_type,
      created_at,
      sender_id,
      receiver_id,
      is_lounge,
      profiles!sender_id (
        nama_lengkap,
        nama_panggilan,
        foto_profil
      )
    `)
    .eq("is_lounge", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching messages:", error);
  }

  const sortedMessages = messages ? [...messages].reverse() : [];

  return <ChatClient initialMessages={sortedMessages} userId={user.id} />;
}
