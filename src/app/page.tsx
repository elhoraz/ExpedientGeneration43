import "./landing.css";
import LandingContent from "@/components/landing/LandingContent";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();

  // Fetch dynamic CMS content
  const { data: siteContents } = await supabase
    .from("site_content")
    .select("*")
    .like("content_key", "landing_%");
  const cms = siteContents || [];

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const totalAlumni = count || 0;

  return <LandingContent totalAlumni={totalAlumni} cms={cms} />;
}
