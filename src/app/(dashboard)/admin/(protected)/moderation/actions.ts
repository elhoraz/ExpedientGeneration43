"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteAdminContent(formData: FormData) {
  const cookieStore = await cookies();
  
  // Verify Admin Session
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
    throw new Error("Unauthorized");
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypass RLS
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

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
