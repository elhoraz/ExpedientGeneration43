import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BukuTamuClient from "./BukuTamuClient";

export const metadata = {
  title: "Buku Tamu - Expedient",
};

export default async function BukuTamuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch buku tamu
  const { data: messages } = await supabase
    .from("buku_tamu")
    .select("*, profiles!buku_tamu_user_id_fkey(nama_panggilan)")
    .order("created_at", { ascending: false });

  return (
    <BukuTamuClient initialMessages={messages || []} userId={user.id} />
  );
}
