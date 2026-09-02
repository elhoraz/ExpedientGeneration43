import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KontemplasiClient from "./KontemplasiClient";

export const metadata = {
  title: "Ruang Kontemplasi - The Sanctuary",
};

export default async function KontemplasiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user journals
  const { data: journals } = await supabase
    .from("kontemplasi_journals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <KontemplasiClient initialJournals={journals || []} userId={user.id} />
  );
}
