"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteAnnouncement(formData: FormData) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;
  if (!(await verifySignedAdminSession(adminToken))) {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminClient();

  const id = formData.get("id") as string;
  if (!id) return;

  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
}
