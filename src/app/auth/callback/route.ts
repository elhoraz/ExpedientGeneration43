import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRequestOrigin } from '@/lib/url'

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/beranda'

  const errDesc = searchParams.get('error_description')
  if (errDesc) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errDesc)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      // Set is_active to true
      const { createServerClient } = await import('@supabase/ssr');
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        }
      );
      await adminSupabase.from('profiles').update({ is_active: true }).eq('id', data.session.user.id);
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Tautan verifikasi sudah kedaluwarsa atau tidak valid.")}`)
    }
  }

  // Fallback if no code and no error (e.g. implicit flow)
  return NextResponse.redirect(`${origin}/login?success=${encodeURIComponent("Verifikasi berhasil! Silakan login.")}`)
}
