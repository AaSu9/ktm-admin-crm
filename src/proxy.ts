import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl, auth: session } = req as any
  const isLoggedIn = !!session

  const isPublicRoute = nextUrl.pathname === '/login'

  if (isPublicRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', nextUrl))
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
