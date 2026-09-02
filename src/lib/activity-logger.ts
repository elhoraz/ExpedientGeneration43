import { createClient } from "@/lib/supabase/server";

export async function logActivity(action: string, details?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("activity_logs").insert([{
      user_id: user.id,
      action,
      details: details || null,
    }]);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
