import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CelestialClient from "./CelestialClient";

export const metadata = {
  title: "The Celestial Codex",
};

export default async function CelestialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Similar to Divine Verse, we can mock the array of Tarot cards to stand alone
  // without needing a database seeder for Phase 4.

  return (
    <CelestialClient />
  );
}
