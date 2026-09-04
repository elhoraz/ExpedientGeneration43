import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifySignedAdminSession } from '@/lib/admin-auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-site tracking.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')

  const isPublicRoute = 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/robots.txt' ||
    request.nextUrl.pathname === '/sitemap.xml' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/beranda') ||
    request.nextUrl.pathname.startsWith('/direktori') ||
    request.nextUrl.pathname.startsWith('/galeri');

  if (!user && !isPublicRoute) {
    // If not logged in and not accessing public routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
       // Do not redirect API requests, let them handle it or return 401
    } else {
       const url = request.nextUrl.clone()
       url.pathname = '/login'
       return NextResponse.redirect(url)
    }
  }

  if (user && isAuthRoute) {
    // If logged in and accessing auth routes, redirect to beranda
    const url = request.nextUrl.clone()
    url.pathname = '/beranda'
    return NextResponse.redirect(url)
  }

  // Admin Panel Protection (Cryptographic Signed Session verification)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isUnlockRoute = request.nextUrl.pathname === '/admin/unlock'
  
  if (isAdminRoute && !isUnlockRoute) {
    const adminSession = request.cookies.get('expedient_admin_session')
    const isValidAdmin = await verifySignedAdminSession(adminSession?.value)
    if (!isValidAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/unlock'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
