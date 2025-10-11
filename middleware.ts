import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware is a minimal pass-through to fix middleware-manifest.json generation
// The actual authentication logic is handled by the AuthContext on the client side
export function middleware(request: NextRequest) {
  // Simply pass through all requests
  return NextResponse.next()
}

// Configure matcher to exclude static assets and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public folder files (images, fonts, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
}
