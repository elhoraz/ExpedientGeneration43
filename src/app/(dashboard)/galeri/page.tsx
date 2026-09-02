import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GaleriClient from "./GaleriClient";

export const metadata = {
  title: "Arsip Visual 5D | The Syndicate Yearbook",
};

export default async function GaleriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <GaleriClient />;
}
