import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/url";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/login`, {
    status: 303,
  });
}
