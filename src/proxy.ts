import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl, auth: session } = req as { nextUrl: URL; auth?: { user?: { role?: string } } }
  const isLoggedIn = !!session?.user
  const userRole = session?.user?.role || 'AGENT'

  const pathname = nextUrl.pathname
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/api/auth')

  // If visiting /login while logged in, redirect to dashboard
  if (isPublicRoute) {
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // If not logged in, redirect to login page
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route enforcement
  if (pathname.startsWith('/agents') || pathname.startsWith('/settings') || pathname.startsWith('/audit-logs')) {
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', nextUrl))
    }
  }

  if (pathname.startsWith('/messages') || pathname.startsWith('/analytics')) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', nextUrl))
    }
  }

  // Response with strict no-cache headers to prevent browser back-button caching after logout
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png).*)',
  ],
}
