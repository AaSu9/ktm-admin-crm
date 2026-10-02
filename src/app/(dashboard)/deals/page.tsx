import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DealsClient, DealRecord } from '@/components/dashboard/DealsClient'

export const dynamic = 'force-dynamic'

export default async function DealsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    fromVisit?: string
    propertyId?: string
    buyerId?: string
  }>
}) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as { id?: string; name?: string; role?: string }
  const currentUserId = user.id || ''
  const currentUserRole = user.role || 'AGENT'

  let deals: DealRecord[] = []
  let properties: any[] = []
  let customers: any[] = []
  let agents: any[] = []
  let visits: any[] = []

  try {
    const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)

    const [dealsData, propertiesData, customersData, agentsData, visitsData] = await Promise.all([
      prisma.deal.findMany({
        where: isSuperAdminOrAdmin ? {} : { agentId: currentUserId },
        orderBy: { closingDate: 'desc' },
        include: {
          property: {
            select: { id: true, title: true, location: true, price: true, status: true },
          },
          agent: {
            select: { id: true, name: true, email: true },
          },
          buyer: {
            select: { id: true, name: true, phone: true },
          },
          seller: {
            select: { id: true, name: true, phone: true },
          },
          visit: {
            select: { id: true, time: true, date: true },
          },
          commissions: {
            select: { id: true, status: true, commissionAmount: true, paidAmount: true, paidAt: true },
          },
        },
      }),
      prisma.property.findMany({
        orderBy: { title: 'asc' },
        select: { id: true, title: true, location: true, price: true, status: true },
      }),
      prisma.customer.findMany({
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { isActive: true, role: { in: ['AGENT', 'ADMIN', 'SUPER_ADMIN'] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.visit.findMany({
        orderBy: { date: 'desc' },
        take: 30,
        include: { customer: { select: { name: true } } },
      }),
    ])

    deals = dealsData as unknown as DealRecord[]
    properties = propertiesData
    customers = customersData
    agents = agentsData
    visits = visitsData as any[]
  } catch (error) {
    console.error('Error fetching Deals page data:', error)
  }

  return (
    <DealsClient
      deals={deals}
      properties={properties}
      customers={customers}
      agents={agents}
      visits={visits}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      initialFromVisit={searchParams.fromVisit}
      initialPropertyId={searchParams.propertyId}
      initialBuyerId={searchParams.buyerId}
    />
  )
}
