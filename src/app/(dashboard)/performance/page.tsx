import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PerformanceClient } from '@/components/dashboard/PerformanceClient'
import { getLeaderboardData, getEmployeeOfTheYear } from '@/app/actions/performance'
import { getPerformanceSettings } from '@/app/actions/commissions'

export const dynamic = 'force-dynamic'

export default async function PerformancePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ period?: 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'all_time' }>
}) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userRole = (session.user as { role?: string })?.role || 'AGENT'
  const period = searchParams.period || 'all_time'

  const [leaderboard, employeeOfTheYear, settings] = await Promise.all([
    getLeaderboardData(period),
    getEmployeeOfTheYear(),
    getPerformanceSettings(),
  ])

  return (
    <PerformanceClient
      initialLeaderboard={leaderboard}
      employeeOfTheYear={employeeOfTheYear}
      currentUserRole={userRole}
      settings={settings}
    />
  )
}
