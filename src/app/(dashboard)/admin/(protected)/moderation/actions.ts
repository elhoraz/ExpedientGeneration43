"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteAdminContent(formData: FormData) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;
  // Verify Admin Session (HMAC-SHA256)
  if (!(await verifySignedAdminSession(adminToken))) {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminClient();

  const type = formData.get("type") as string;
  const id = formData.get("id") as string;

  if (!type || !id) return;

  switch (type) {
    case "chat":
      await supabase.from("chat_messages").update({ is_deleted: true }).eq("id", id);
      break;
    case "majlis":
      await supabase.from("majlis_topics").delete().eq("id", id);
      break;
    case "syndicate":
      await supabase.from("syndicate").delete().eq("id", id);
      break;
    case "bukutamu":
      await supabase.from("buku_tamu").delete().eq("id", id);
      break;
  }

  revalidatePath("/admin/moderation");
}
