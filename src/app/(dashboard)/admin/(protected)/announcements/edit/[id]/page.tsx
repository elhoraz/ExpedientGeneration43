import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import "../../../admin.css";
import AdminLockBtn from "../../../../AdminLockBtn";
import EditAnnouncementForm from "./EditAnnouncementForm";

export const metadata = {
  title: "Edit Pengumuman | Admin",
};

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: announcement } = await supabase
    .from("announcements")
    .select("id, title, content, category, is_pinned, published_at")
    .eq("id", id)
    .single();

  if (!announcement) {
    notFound();
  }

  return (
    <div className="admin-wrapper" style={{ maxWidth: "800px" }}>
      <div className="admin-header" style={{ justifyContent: "center", position: "relative", paddingRight: "160px" }}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ textAlign: "center", width: "100%" }}>
          <h1 className="admin-title">Edit Pengumuman</h1>
          <p className="admin-subtitle">Perbarui konten dan status pengumuman Expedient 43</p>
        </div>
      </div>

      <EditAnnouncementForm announcement={announcement} />
    </div>
  );
}
