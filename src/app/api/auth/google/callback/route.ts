import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleAuthCode } from '@/lib/googleCalendar'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  let returnPath = '/visits'
  let userId = ''

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
      if (decoded.returnPath) returnPath = decoded.returnPath
      if (decoded.userId) userId = decoded.userId
    } catch {
      // Ignored
    }
  }

  if (error || !code || !userId) {
    console.error('Google OAuth callback failed:', error)
    const redirectUrl = new URL(returnPath, req.url)
    redirectUrl.searchParams.set('google_sync', 'error')
    redirectUrl.searchParams.set('google_msg', error || 'Missing authorization code')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const result = await exchangeGoogleAuthCode(code, userId)
    const redirectUrl = new URL(returnPath, req.url)
    redirectUrl.searchParams.set('google_sync', 'connected')
    if (result.email) {
      redirectUrl.searchParams.set('google_email', result.email)
    }
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('Failed to exchange Google OAuth code:', err)
    const redirectUrl = new URL(returnPath, req.url)
    redirectUrl.searchParams.set('google_sync', 'error')
    redirectUrl.searchParams.set('google_msg', err instanceof Error ? err.message : 'Auth failed')
    return NextResponse.redirect(redirectUrl)
  }
}
