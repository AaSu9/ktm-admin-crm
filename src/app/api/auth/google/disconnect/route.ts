import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { disconnectGoogleCalendar } from '@/lib/googleCalendar'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await disconnectGoogleCalendar(userId)
    return NextResponse.json({ success: true, message: 'Google Calendar disconnected successfully' })
  } catch (error) {
    console.error('Failed to disconnect Google Calendar:', error)
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 })
  }
}
