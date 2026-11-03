import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EnigmaClient from "./EnigmaClient";

export const metadata = {
  title: "Teka-Teki Sandi Santri - Expedient 43",
};

export default async function EnigmaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch actual enigma_progress from Supabase
  const { data: progressData } = await supabase
    .from("enigma_progress")
    .select("is_completed, current_level")
    .eq("user_id", user.id)
    .single();
    
  const isCompleted = progressData?.is_completed || false;
  const currentLevel = progressData?.current_level || 1;

  return (
    <EnigmaClient isCompleted={isCompleted} userId={user.id} />
  );
}
