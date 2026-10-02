import { prisma } from '@/lib/prisma'
import { logAudit } from './audit'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI
  const baseUrl = process.env.NEXTAUTH_URL || 
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ktm-admin-crm.vercel.app'))
  return `${baseUrl.replace(/\/+$/, '')}/api/auth/google/callback`
}

const CALENDAR_TIMEZONE = 'Asia/Kathmandu' // Nepal Standard Time (UTC+5:45)

/**
 * Returns Google OAuth 2.0 URL to authorize Calendar access
 */
export function getGoogleAuthUrl(userId: string, returnPath: string = '/visits') {
  const redirectUri = getGoogleRedirectUri()
  if (!GOOGLE_CLIENT_ID) {
    // If credentials aren't set in env, we gracefully inform or return placeholder config
    const state = Buffer.from(JSON.stringify({ userId, returnPath })).toString('base64')
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID || 'PENDING_CONFIG',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  const state = Buffer.from(JSON.stringify({ userId, returnPath })).toString('base64')
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchanges Google auth code for access & refresh tokens and stores in user profile
 */
export async function exchangeGoogleAuthCode(code: string, userId: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured.')
  }

  const redirectUri = getGoogleRedirectUri()
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    const errData = await tokenResponse.json().catch(() => ({}))
    throw new Error(errData.error_description || 'Failed to exchange Google OAuth code')
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token
  const refreshToken = tokenData.refresh_token
  const expiresIn = tokenData.expires_in || 3600
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000)

  // Fetch Google User Email
  let googleEmail = ''
  try {
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (userinfoRes.ok) {
      const userInfo = await userinfoRes.json()
      googleEmail = userInfo.email || ''
    }
  } catch (err) {
    console.error('Error fetching Google user profile:', err)
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken || undefined, // keep existing refresh token if not returned
      googleTokenExpiry: tokenExpiry,
      googleEmail: googleEmail || undefined,
      googleCalendarId: 'primary',
      isGoogleConnected: true,
    },
  })

  await logAudit({
    userId,
    action: 'CONNECT_GOOGLE_CALENDAR',
    entityType: 'GOOGLE_CALENDAR',
    description: `Connected Google Calendar (${googleEmail || 'primary'})`,
  })

  return { success: true, email: googleEmail }
}

/**
 * Disconnect Google Calendar for user
 */
export async function disconnectGoogleCalendar(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleCalendarId: null,
      googleEmail: null,
      isGoogleConnected: false,
    },
  })

  await logAudit({
    userId,
    action: 'DISCONNECT_GOOGLE_CALENDAR',
    entityType: 'GOOGLE_CALENDAR',
    description: 'Disconnected Google Calendar integration',
  })

  return { success: true }
}

/**
 * Returns a valid access token for the given user, automatically refreshing if needed
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
      isGoogleConnected: true,
    },
  })

  if (!user || !user.isGoogleConnected || !user.googleAccessToken) {
    return null
  }

  // Check if token is still valid with 2 minutes grace period
  const isExpired = !user.googleTokenExpiry || new Date(user.googleTokenExpiry).getTime() - Date.now() < 120000

  if (!isExpired) {
    return user.googleAccessToken
  }

  // Token is expired, refresh it using refresh token
  if (!user.googleRefreshToken) {
    return null
  }

  try {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!refreshRes.ok) {
      console.error('Failed to refresh Google token')
      return null
    }

    const refreshData = await refreshRes.json()
    const newAccessToken = refreshData.access_token
    const expiresIn = refreshData.expires_in || 3600
    const newExpiry = new Date(Date.now() + expiresIn * 1000)

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: newAccessToken,
        googleTokenExpiry: newExpiry,
      },
    })

    return newAccessToken
  } catch (error) {
    console.error('Error refreshing Google access token:', error)
    return null
  }
}

/**
 * Helper to build ISO start and end strings with Nepal Timezone
 */
function buildDateTimeRange(date: Date, startTimeStr: string, endTimeStr?: string | null) {
  const d = new Date(date)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  // Parse time (handles "10:00 AM", "14:30", "2:00 PM")
  const parseTimeTo24h = (time: string, defaultHour: number = 10) => {
    try {
      const match = time.match(/(\d+):(\d+)\s*(AM|PM)?/i)
      if (!match) return `${String(defaultHour).padStart(2, '0')}:00:00`
      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const modifier = match[3]?.toUpperCase()

      if (modifier === 'PM' && hours < 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
    } catch {
      return `${String(defaultHour).padStart(2, '0')}:00:00`
    }
  }

  const start24h = parseTimeTo24h(startTimeStr, 10)
  const end24h = endTimeStr ? parseTimeTo24h(endTimeStr, 11) : parseTimeTo24h(`${parseInt(start24h.slice(0, 2), 10) + 1}:00`, 11)

  // ISO timestamp with Nepal offset (+05:45)
  const startDateTime = `${dateStr}T${start24h}+05:45`
  const endDateTime = `${dateStr}T${end24h}+05:45`

  return { startDateTime, endDateTime }
}

/**
 * Synchronize a visit to the assigned agent's (or super admin's) Google Calendar
 */
export async function syncVisitToGoogleCalendar(visitId: string, currentUserId?: string) {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        customer: true,
        property: true,
        agent: true,
      },
    })

    if (!visit) return { success: false, error: 'Visit not found' }

    // Target user for sync: assigned agent or user performing the action
    const targetUserId = visit.agentId || currentUserId
    if (!targetUserId) {
      await prisma.visit.update({
        where: { id: visitId },
        data: { googleSyncStatus: 'NOT_CONNECTED', googleSyncError: 'No agent assigned to sync' },
      })
      return { success: false, error: 'No agent connected to sync with Google Calendar' }
    }

    const accessToken = await getValidAccessToken(targetUserId)
    if (!accessToken) {
      await prisma.visit.update({
        where: { id: visitId },
        data: {
          googleSyncStatus: 'NOT_CONNECTED',
          googleSyncError: 'Google Calendar not connected for this user',
        },
      })
      return { success: false, error: 'Google Calendar is not connected.' }
    }

    const { startDateTime, endDateTime } = buildDateTimeRange(visit.date, visit.time, visit.endTime)

    const eventPayload = {
      summary: `Property Visit - ${visit.customer.name} - ${visit.property.title}`,
      location: visit.location || visit.property.location || 'Kathmandu, Nepal',
      description: [
        `🏢 Property: ${visit.property.title}`,
        `📍 Location: ${visit.property.location}`,
        `👤 Customer: ${visit.customer.name}`,
        `📞 Phone: ${visit.customer.phone}`,
        visit.customer.email ? `📧 Email: ${visit.customer.email}` : '',
        visit.agent?.name ? `💼 Assigned Agent: ${visit.agent.name}` : '',
        `🎯 Purpose/Type: ${visit.visitType || 'Site Walkthrough'}`,
        visit.notes ? `📝 Notes: ${visit.notes}` : '',
        `🔗 CRM Visit ID: ${visit.id}`,
      ]
        .filter(Boolean)
        .join('\n'),
      start: {
        dateTime: startDateTime,
        timeZone: CALENDAR_TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: CALENDAR_TIMEZONE,
      },
      attendees: visit.customer.email ? [{ email: visit.customer.email, displayName: visit.customer.name }] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 120 },
        ],
      },
    }

    let calendarRes: Response

    // If event already exists, update it instead of creating duplicate
    if (visit.googleCalendarEventId) {
      calendarRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${visit.googleCalendarEventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      )
    } else {
      calendarRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      )
    }

    if (!calendarRes.ok) {
      const errText = await calendarRes.text()
      console.error('Google Calendar API Error:', errText)
      await prisma.visit.update({
        where: { id: visitId },
        data: {
          googleSyncStatus: 'FAILED',
          googleSyncError: `Google Calendar API error (${calendarRes.status})`,
        },
      })
      return { success: false, error: 'Google Calendar synchronization failed.' }
    }

    const eventData = (await calendarRes.json()) as { id: string }

    await prisma.visit.update({
      where: { id: visitId },
      data: {
        googleCalendarEventId: eventData.id,
        googleCalendarId: 'primary',
        googleSyncStatus: 'SYNCED',
        googleSyncError: null,
      },
    })

    await logAudit({
      userId: targetUserId,
      action: 'SYNC_GOOGLE_CALENDAR_VISIT',
      entityType: 'VISIT',
      entityId: visitId,
      description: `Synchronized visit #${visitId.slice(0, 8)} to Google Calendar (Event: ${eventData.id})`,
    })

    return { success: true, eventId: eventData.id }
  } catch (error) {
    console.error('Error during Google Calendar sync:', error)
    await prisma.visit.update({
      where: { id: visitId },
      data: {
        googleSyncStatus: 'FAILED',
        googleSyncError: error instanceof Error ? error.message : 'Unknown sync error',
      },
    }).catch(() => {})
    return { success: false, error: error instanceof Error ? error.message : 'Google Calendar sync failed' }
  }
}

/**
 * Remove/Cancel event in Google Calendar if visit is cancelled
 */
export async function deleteGoogleCalendarVisit(visitId: string, currentUserId?: string) {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
    })

    if (!visit || !visit.googleCalendarEventId) return { success: true }

    const targetUserId = visit.agentId || currentUserId
    if (!targetUserId) return { success: true }

    const accessToken = await getValidAccessToken(targetUserId)
    if (!accessToken) return { success: true }

    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${visit.googleCalendarEventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    ).catch(() => {})

    await prisma.visit.update({
      where: { id: visitId },
      data: {
        googleSyncStatus: 'NOT_CONNECTED',
      },
    })

    return { success: true }
  } catch (err) {
    console.error('Error deleting Google Calendar event:', err)
    return { success: false }
  }
}
