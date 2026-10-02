import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/dashboard/SettingsClient'
import { getPerformanceSettings } from '@/app/actions/commissions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as { id?: string }).id || ''
  const role = (session.user as { role?: string })?.role || 'AGENT'

  let userRecord = null
  let settings = null

  try {
    const [userFetch, settingsFetch] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isGoogleConnected: true,
          googleEmail: true,
          stars: true,
          performancePoints: true,
        },
      }),
      getPerformanceSettings(),
    ])
    userRecord = userFetch
    settings = settingsFetch
  } catch (error) {
    console.error('Error fetching settings page data:', error)
  }

  return (
    <SettingsClient
      userName={userRecord?.name || session.user?.name || ''}
      userEmail={userRecord?.email || session.user?.email || ''}
      userRole={userRecord?.role || role}
      userPhone={userRecord?.phone || ''}
      isGoogleConnected={!!userRecord?.isGoogleConnected}
      googleEmail={userRecord?.googleEmail || null}
      stars={userRecord?.stars || 0}
      performancePoints={userRecord?.performancePoints || 0}
      settings={settings || {
        defaultCommissionRate: 2.5,
        normalTaskPoints: 1,
        highTaskPoints: 2,
        urgentTaskPoints: 3,
        dealClosePoints: 5,
        saleClosePoints: 10,
      }}
    />
  )
}
