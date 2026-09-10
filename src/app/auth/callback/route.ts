import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const adminSupabase = createAdminClient()

  const supabase = await createClient()

  // 1. Check token_hash if present
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
      console.warn("verifyOtp error in /auth/callback:", error)
    }
  }

  // 2. Check code (PKCE flow)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      await adminSupabase.from('profiles').update({ is_active: true }).eq('id', data.session.user.id)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.warn("exchangeCodeForSession error in /auth/callback:", error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Tautan verifikasi sudah kedaluwarsa atau tidak valid.")}&expired=true`)
    }
  }

  // Fallback if no code and no error (e.g. implicit flow)
  return NextResponse.redirect(`${origin}/login?success=${encodeURIComponent("Verifikasi berhasil! Silakan login.")}`)
}

