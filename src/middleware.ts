import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session to ensure cookies are up to date
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname

  // Define public pages that don't require authentication
  const publicPages = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
  ]

  const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + '/'))
  const isApiRoute = pathname.startsWith('/api')
  const isNextInternal = pathname.startsWith('/_next')

  // Protected pages require authentication
  const isProtectedPage = !isPublicPage && !isApiRoute && !isNextInternal

  // Redirect to login if accessing protected page without user
  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to bookings if accessing auth page with active user
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  if (user && isAuthPage) {
    // Check for redirect parameter
    const redirectTo = req.nextUrl.searchParams.get('redirectTo')
    const redirectPath = redirectTo && redirectTo !== '/login' ? redirectTo : '/bookings'
    return NextResponse.redirect(new URL(redirectPath, req.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
