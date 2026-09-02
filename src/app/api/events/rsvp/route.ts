import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { addPrestise } from "@/lib/gamification";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event_id, status } = await request.json();

  if (!event_id || !status) {
    return NextResponse.json({ error: "Data RSVP tidak lengkap" }, { status: 400 });
  }

  // Delete existing RSVP if any
  await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", event_id)
    .eq("user_id", user.id);

  // Insert new RSVP
  const { data, error } = await supabase
    .from("event_rsvps")
    .insert([{ 
      event_id, 
      user_id: user.id, 
      status 
    }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add Prestise Points (RSVP_EVENT) - we might want to check if they already got points for this event
  // For simplicity, we just trigger it and let anti-spam logic in GamificationService handle it
  await addPrestise(supabase as any, user.id, `RSVP_EVENT_${event_id}`, 5);

  return NextResponse.json(data[0], { status: 200 });
}
