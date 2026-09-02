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

  const { title, event_date, location, description } = await request.json();

  if (!title || !event_date || !description) {
    return NextResponse.json({ error: "Data agenda tidak lengkap" }, { status: 400 });
  }

  // Insert event
  const { data, error } = await supabase
    .from("events")
    .insert([{ 
      creator_id: user.id, 
      title, 
      event_date, 
      location, 
      description 
    }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add Prestise Points (CREATE_EVENT)
  await addPrestise(supabase as any, user.id, 'CREATE_EVENT', 20);

  // Todo: Broadcast WA or Push Notif

  return NextResponse.json(data[0], { status: 200 });
}
