import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGoogleAuthUrl } from '@/lib/googleCalendar'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const searchParams = req.nextUrl.searchParams
    const returnPath = searchParams.get('returnPath') || '/visits'

    const authUrl = getGoogleAuthUrl(userId, returnPath)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error)
    return NextResponse.redirect(new URL('/visits?error=google_auth_failed', req.url))
  }
}
