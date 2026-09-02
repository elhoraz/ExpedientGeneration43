import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BroadcastClient from "./BroadcastClient";

export const metadata = {
  title: "WhatsApp Broadcast - Admin",
};

export default async function BroadcastPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }



  // Fetch target list for the UI
  const { data: users } = await supabase
    .from("profiles")
    .select("id, nama_panggilan, no_whatsapp, role");

  return (
    <BroadcastClient initialUsers={users || []} />
  );
}
