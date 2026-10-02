import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AgentsClient } from '@/components/dashboard/AgentsClient'

export const revalidate = 60

export default async function AgentsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = (session.user as { role?: string })?.role
  if (role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  let agents: any[] = []
  let dbError = false

  try {
    // Fetch agents with full property details, deals, leads, and visits
    agents = await prisma.user.findMany({
      where: { role: { in: ['AGENT', 'ADMIN', 'EDITOR'] } },
      include: {
        _count: {
          select: { leads: true, properties: true, visits: true, deals: true },
        },
        leads: {
          select: { id: true, full_name: true, phone: true, email: true, status: true },
          take: 100,
        },
        properties: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            status: true,
            property_type: true,
            category: true,
            images: true,
            leads: { select: { id: true, full_name: true, phone: true, email: true, status: true } },
            visits: { select: { id: true, status: true, date: true, time: true, customer: { select: { name: true, phone: true } } } },
          },
          take: 100,
        },
        deals: {
          where: { status: 'SOLD' },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                location: true,
                price: true,
                status: true,
                property_type: true,
                category: true,
                images: true,
              },
            },
          },
          take: 100,
        },
        visits: {
          select: {
            id: true,
            status: true,
            date: true,
            time: true,
            customer: { select: { name: true, phone: true } },
            property: { select: { title: true } },
          },
          take: 100,
        },
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
