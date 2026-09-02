import WrappedClient from "./WrappedClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Expedient Wrapped 2026",
};

export default async function WrappedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch actual real statistics for the wrapped experience
  const { data: profile } = await supabase
    .from("profiles")
    .select("nama_panggilan, role, prestise_points")
    .eq("id", user.id)
    .single();

  const { count: chatCount } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", user.id);

  return (
    <WrappedClient 
        profile={profile} 
        stats={{ chatCount: chatCount || 0, prestisePoints: profile?.prestise_points || 0 }} 
    />
  );
}
