import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/dashboard/SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <SettingsClient
      userName={session.user?.name || ''}
      userEmail={session.user?.email || ''}
      userRole={(session.user as any)?.role || 'ADMIN'}
    />
  )
}
