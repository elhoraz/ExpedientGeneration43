import "./landing.css";
import LandingContent from "@/components/landing/LandingContent";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  try {
    const supabase = await createClient();

    const withTimeout = <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> =>
      Promise.race([
        Promise.resolve(promise),
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 4000))
      ]);

    const [contentsRes, countRes] = await Promise.allSettled([
      withTimeout(
        supabase.from("site_content").select("*").like("content_key", "landing_%"),
        { data: [] } as any
      ),
      withTimeout(
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        { count: 0 } as any
      ),
    ]);

    const cms = (contentsRes.status === "fulfilled" && contentsRes.value.data) ? contentsRes.value.data : [];
    const totalAlumni = (countRes.status === "fulfilled" && countRes.value.count) ? countRes.value.count : 0;

    return <LandingContent totalAlumni={totalAlumni} cms={cms} />;
  } catch (err) {
    console.error("Landing page query error, rendering with fallbacks:", err);
    return <LandingContent totalAlumni={0} cms={[]} />;
  }
}
