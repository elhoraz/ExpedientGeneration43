import "./landing.css";
import LandingContent from "@/components/landing/LandingContent";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const totalAlumni = count || 0;

  return <LandingContent totalAlumni={totalAlumni} />;
}
