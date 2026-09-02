import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Update progress to not completed
  const { data: progress } = await supabase.from('enigma_progress').select('*').eq('user_id', user.id).single();
  
  if (progress) {
    await supabase.from('enigma_progress').update({
      is_completed: false,
      completed_at: null
    }).eq('id', progress.id);
  }

  return NextResponse.json({ success: true });
}
