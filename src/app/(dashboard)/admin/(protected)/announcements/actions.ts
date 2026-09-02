"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteAnnouncement(formData: FormData) {
  const cookieStore = await cookies();
  
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
    throw new Error("Unauthorized");
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const id = formData.get("id") as string;
  if (!id) return;

  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
}
