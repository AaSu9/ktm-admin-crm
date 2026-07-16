import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Building2, Users2, TrendingUp, CalendarCheck, DollarSign, Layers } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentLeads } from '@/components/dashboard/RecentLeads'
import { RecentMessages } from '@/components/dashboard/RecentMessages'
import { LeadStatusChart } from '@/components/dashboard/LeadStatusChart'
import { PropertyTypeChart } from '@/components/dashboard/PropertyTypeChart'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let totalProperties = 0, activeListings = 0, soldProperties = 0, totalLeads = 0, scheduledVisits = 0, wonLeads = 0
  let recentLeads: any[] = [], recentMessages: any[] = [], leadsByStatus: any[] = [], propertiesByType: any[] = []

  try {
    const results = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'AVAILABLE' } }),
      prisma.property.count({ where: { status: 'SOLD' } }),
      prisma.lead.count(),
      prisma.visit.count({ where: { status: 'SCHEDULED' } }),
      prisma.lead.findMany({ take: 5, orderBy: { created_at: 'desc' }, include: { property: true, agent: true } }),
      prisma.message.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.lead.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.property.groupBy({ by: ['property_type'], _count: { property_type: true } }),
    ])

    ;[
      totalProperties, activeListings, soldProperties, totalLeads, scheduledVisits,
      recentLeads, recentMessages, leadsByStatus, propertiesByType
    ] = results

    wonLeads = await prisma.lead.count({ where: { status: 'CLOSED_WON' } })
  } catch (error) {
    console.error("Database not connected yet - showing empty dashboard state")
  }

  const stats = [
    { label: 'Total Properties', value: totalProperties, icon: Building2, color: 'emerald', change: '+12%' },
    { label: 'Active Listings', value: activeListings, icon: Layers, color: 'blue', change: '+5%' },
    { label: 'Sold Properties', value: soldProperties, icon: TrendingUp, color: 'purple', change: '+8%' },
    { label: 'Total Leads', value: totalLeads, icon: Users2, color: 'orange', change: '+23%' },
    { label: 'Scheduled Visits', value: scheduledVisits, icon: CalendarCheck, color: 'cyan', change: '+3' },
    { label: 'Deals Closed', value: wonLeads, icon: DollarSign, color: 'green', change: '+2' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadStatusChart data={leadsByStatus} />
        <PropertyTypeChart data={propertiesByType} />
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeads leads={recentLeads as any} />
        <RecentMessages messages={recentMessages as any} />
      </div>
    </div>
  )
}
