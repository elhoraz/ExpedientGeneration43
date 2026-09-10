import { createAdminClient } from "@/lib/supabase/admin";
import CmsClient from "./CmsClient";
import "../admin.css";

export const metadata = {
  title: "CMS Manager | Admin",
};

export default async function CmsPage() {
  const supabase = createAdminClient();

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
