import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VisitsClient, VisitRecord } from '@/components/dashboard/VisitsClient'

export const dynamic = 'force-dynamic'

export default async function VisitsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as { id?: string; name?: string; role?: string }
  const currentUserId = user.id || ''
  const currentUserRole = user.role || 'AGENT'

  let visits: VisitRecord[] = []
  let customers: any[] = []
  let properties: any[] = []
  let agents: any[] = []
  let isGoogleConnected = false
  let googleEmail: string | null = null

  try {
    const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)

    const [visitsData, customersData, propertiesData, agentsData, userData] = await Promise.all([
      prisma.visit.findMany({
        where: isSuperAdminOrAdmin ? {} : { agentId: currentUserId },
        orderBy: { date: 'asc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true, address: true },
          },
          property: {
            select: { id: true, title: true, location: true, price: true },
          },
          agent: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.customer.findMany({
        select: { id: true, name: true, phone: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.property.findMany({
        where: { status: { in: ['AVAILABLE', 'PENDING'] } },
        select: { id: true, title: true, location: true, price: true },
        orderBy: { title: 'asc' },
      }),
      prisma.user.findMany({
        where: { isActive: true, role: { in: ['AGENT', 'ADMIN', 'SUPER_ADMIN'] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: currentUserId },
        select: { isGoogleConnected: true, googleEmail: true },
      }),
    ])

    visits = visitsData as unknown as VisitRecord[]
    customers = customersData
    properties = propertiesData
    agents = agentsData
    isGoogleConnected = !!userData?.isGoogleConnected
    googleEmail = userData?.googleEmail || null
  } catch (error) {
    console.error('Error loading Visits Page data:', error)
  }

  return (
    <VisitsClient
      visits={visits}
      customers={customers}
      properties={properties}
      agents={agents}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      isGoogleConnected={isGoogleConnected}
      googleEmail={googleEmail}
    />
  )
}
