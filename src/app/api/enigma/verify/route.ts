import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();

  if (!json.combination || !Array.isArray(json.combination) || json.combination.length !== 3) {
    return NextResponse.json({ success: false, message: "Sinyal tidak valid." }, { status: 400 });
  }

  const combo = json.combination;

  // Target: [3, 1, 9] (Outer, Middle, Inner) as seen in EnigmaClient.tsx logic
  // In CI4 it was [7, 4, 0], but the Next.js client checks for [3, 1, 9]
  if (combo[0] === 3 && combo[1] === 1 && combo[2] === 9) {
    // Jawaban Benar
    
    // Check if progress exists
    const { data: progress } = await supabase.from('enigma_progress').select('*').eq('user_id', user.id).single();
    
    if (progress) {
      await supabase.from('enigma_progress').update({
        is_completed: true,
        completed_at: new Date().toISOString()
      }).eq('id', progress.id);
    } else {
      await supabase.from('enigma_progress').insert([{
        user_id: user.id,
        puzzle_seed: 'COMBINATION_LOCK',
        current_level: 3,
        is_completed: true,
        completed_at: new Date().toISOString()
      }]);
    }

    return NextResponse.json({ success: true });
  }

  // Jawaban Salah
  return NextResponse.json({ success: false });
}
