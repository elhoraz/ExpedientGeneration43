import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image
     * - static public folders: assets, images, fonts, sequence, uploads, vendor
     * - static root files: favicon, robots, sitemap, manifest, sw, workbox
     * - all media & static extensions (audio, video, images, fonts, models, manifests)
     */
    '/((?!_next/static|_next/image|assets|images|fonts|sequence|uploads|vendor|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|manifest\\.json|sw\\.js|workbox-.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|css|js|woff|woff2|ttf|eot|otf|txt|xml|html|mp3|m4a|wav|ogg|aac|flac|mp4|webm|ogv|json|webmanifest|glb|gltf|bin)$).*)',
  ],
}

