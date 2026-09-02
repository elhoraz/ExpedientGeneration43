import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OracleClient from "./OracleClient";

export const metadata = {
  title: "The Oracle's Vision",
};

export default async function OraclePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's visions
  const { data: visions, error: visionError } = await supabase
    .from("oracle_visions")
    .select("*")
    .eq("user_id", user.id)
    .order("unlock_date", { ascending: true });

  // Fetch user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const safeVisions = visionError ? [] : visions;

  return (
    <OracleClient userId={user.id} initialVisions={safeVisions} userProfile={profile} />
  );
}
