"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addPrestise } from "@/lib/gamification";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const event_date = formData.get("event_date")?.toString();
  const location = formData.get("location")?.toString() || "";

  if (!title || !description || !event_date) {
    return { success: false, error: "Data agenda tidak lengkap" };
  }

  // Insert event
  const { data: newEvent, error: insertError } = await supabase
    .from("events")
    .insert([{
      title,
      description,
      event_date,
      location,
      creator_id: user.id
    }])
    .select()
    .single();

  if (insertError) {
    console.error("Error creating event:", insertError);
    return { success: false, error: "Gagal membuat agenda" };
  }

  if (newEvent) {
    // Auto RSVP 'Hadir' for creator
    await supabase
      .from("event_rsvps")
      .insert([{
        event_id: newEvent.id,
        user_id: user.id,
        status: "Hadir"
      }]);

    // Give prestise points (Gamification: CREATE_EVENT = 20)
    await addPrestise(supabase as any, user.id, `CREATE_EVENT_${newEvent.id}`, 20);
  }

  revalidatePath("/event");
  
  return { success: true };
}
