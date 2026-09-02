import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import CmsClient from "./CmsClient";
import "../admin.css";

export const metadata = {
  title: "CMS Manager | Admin",
};

export default async function CmsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: contents } = await supabase
    .from("site_content")
    .select("*")
    .order("content_key", { ascending: true });

  const { data: galeri } = await supabase
    .from("galeri")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="admin-wrapper">
      <CmsClient initialContents={contents || []} initialGaleri={galeri || []} />
    </div>
  );
}
