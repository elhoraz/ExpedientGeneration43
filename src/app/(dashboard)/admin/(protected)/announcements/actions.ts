"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteAnnouncement(formData: FormData) {
  const cookieStore = await cookies();
  
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminClient();

  const id = formData.get("id") as string;
  if (!id) return;

  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
}
