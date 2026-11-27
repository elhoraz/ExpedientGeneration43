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
    .select("id, content_key, content_type, content_value")
    .order("content_key", { ascending: true });

  const { data: galeri } = await supabase
    .from("galeri")
    .select("id, image_url, caption, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="admin-wrapper">
      <CmsClient initialContents={contents || []} initialGaleri={galeri || []} />
    </div>
  );
}
