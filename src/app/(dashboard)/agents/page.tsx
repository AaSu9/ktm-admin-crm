import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AgentsClient } from '@/components/dashboard/AgentsClient'

export default async function AgentsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let agents: any[] = []
  let dbError = false

  try {
    agents = await prisma.user.findMany({
      where: { role: { in: ['AGENT', 'ADMIN', 'EDITOR'] } },
      include: {
        leads: true,
        properties: true,
        visits: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('DB Query failed in Agents Page:', error)
    dbError = true
  }

  // Fallback mock data for demo mode
  if (dbError || agents.length === 0) {
    agents = [
      {
        id: 'mock-agent-1', name: 'Raj Kumar Sharma', email: 'raj@realtocrm.com',
        phone: '+977-9841234567', role: 'AGENT', isActive: true, createdAt: new Date('2026-01-15'),
        leads: [{ status: 'NEW' }, { status: 'CONTACTED' }, { status: 'CLOSED_WON' }, { status: 'CLOSED_WON' }],
        properties: [{}, {}], visits: [{ status: 'COMPLETED' }, { status: 'SCHEDULED' }],
      },
      {
        id: 'mock-agent-2', name: 'Priya Thapa', email: 'priya@realtocrm.com',
        phone: '+977-9852345678', role: 'AGENT', isActive: true, createdAt: new Date('2026-03-10'),
        leads: [{ status: 'INTERESTED' }, { status: 'NEGOTIATION' }, { status: 'CLOSED_WON' }],
        properties: [{}], visits: [{ status: 'COMPLETED' }, { status: 'COMPLETED' }, { status: 'SCHEDULED' }],
      },
      {
        id: 'mock-agent-3', name: 'Sita Gurung', email: 'sita@realtocrm.com',
        phone: null, role: 'EDITOR', isActive: false, createdAt: new Date('2026-05-01'),
        leads: [], properties: [], visits: [],
      },
    ]
  }

  return <AgentsClient initialAgents={agents} />
}
