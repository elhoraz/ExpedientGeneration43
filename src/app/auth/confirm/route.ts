import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient, type EmailOtpType } from '@supabase/supabase-js'
import { getRequestOrigin } from '@/lib/url'

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/beranda'

  const errDesc = searchParams.get('error_description')
  if (errDesc) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errDesc)}&expired=true`)
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const supabase = await createClient()

  // 1. Verify token_hash if present
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error && (data.session || data.user)) {
      const userId = data.user?.id || data.session?.user?.id
      if (userId) {
        await adminSupabase.from('profiles').update({ is_active: true }).eq('id', userId)
      }
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.warn("verifyOtp error in /auth/confirm:", error)
    }
  }

  // 2. Verify PKCE code if present
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      await adminSupabase.from('profiles').update({ is_active: true }).eq('id', data.session.user.id)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.warn("exchangeCodeForSession error in /auth/confirm:", error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Tautan verifikasi sudah kedaluwarsa atau tidak valid.")}&expired=true`)
    }
  }

  return NextResponse.redirect(`${origin}/login?success=${encodeURIComponent("Verifikasi berhasil! Silakan login.")}`)
}
