import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/dashboard/SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = (session.user as { role?: string })?.role
  if (role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <SettingsClient
      userName={session.user?.name || ''}
      userEmail={session.user?.email || ''}
      userRole={(session.user as any)?.role || 'ADMIN'}
    />
  )
}
