import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DirektoriClient from "./DirektoriClient";

export const metadata = {
  title: "The Archive - 42nd Expedient",
};

export default async function DirektoriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get all users
  const { data: alumni } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: true });

  return <DirektoriClient alumni={alumni || []} isLoggedIn={!!user} />;
}
