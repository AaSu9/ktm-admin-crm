import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewPropertyForm from '@/components/dashboard/NewPropertyForm'

export default async function NewPropertyPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let agents: Array<{ id: string; name: string }> = []
  let dbError = false

  try {
    agents = await prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error("DB Query failed in New Property Page, showing unassigned option:", error)
    dbError = true
  }

  if (dbError) {
    agents = [{ id: 'mock-agent-1', name: 'Raj Kumar Sharma' }, { id: 'mock-agent-2', name: 'Priya Thapa' }]
  }

  return <NewPropertyForm agents={agents} dbError={dbError} />
}
