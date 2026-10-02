import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  Users2, 
  TrendingUp, 
  CalendarCheck, 
  DollarSign, 
  Layers, 
  FileText, 
  FileEdit, 
  Star, 
  Plus, 
  ShieldCheck, 
  UserCheck, 
  PenTool, 
  Sparkles,
  Clock,
  CheckSquare,
  AlertTriangle,
  Award,
  ArrowRight,
  Handshake,
  CheckCircle2
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentLeads } from '@/components/dashboard/RecentLeads'
import { RecentMessages } from '@/components/dashboard/RecentMessages'
import { LeadStatusChart } from '@/components/dashboard/LeadStatusChart'
import { PropertyTypeChart } from '@/components/dashboard/PropertyTypeChart'
import { TodayTasksModal } from '@/components/dashboard/TodayTasksModal'
import { formatDate, formatPrice, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as { id?: string; name?: string; role?: string }
  const role = user?.role || 'AGENT'
  const userId = user?.id || ''

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // ==========================================
  // 1. EDITOR DASHBOARD VIEW
  // ==========================================
  if (role === 'EDITOR') {
    let publishedBlogs = 0, draftBlogs = 0, featuredBlogs = 0, testimonialsCount = 0
    let recentBlogs: any[] = []

    try {
      const results = await Promise.all([
        prisma.blog.count({ where: { published: true } }),
        prisma.blog.count({ where: { published: false } }),
        prisma.blog.count({ where: { isFeatured: true } }),
        prisma.testimonial.count(),
        prisma.blog.findMany({ take: 6, orderBy: { createdAt: 'desc' }, include: { author: true } }),
      ])
      ;[publishedBlogs, draftBlogs, featuredBlogs, testimonialsCount, recentBlogs] = results
    } catch {
      console.error('DB error fetching editor dashboard data')
    }

    const editorStats = [
      { label: 'Published Blogs', value: publishedBlogs, icon: FileText, color: 'emerald', change: '+3 this month' },
      { label: 'Draft / Private Posts', value: draftBlogs, icon: Clock, color: 'orange', change: `${draftBlogs} pending` },
      { label: 'Featured Blog Posts', value: featuredBlogs, icon: Sparkles, color: 'purple', change: 'Featured' },
      { label: 'Customer Testimonials', value: testimonialsCount, icon: Star, color: 'cyan', change: 'Reviews' },
    ]

    return (
      <div className="space-y-6">
        {/* Editor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Editor Dashboard</h1>
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <PenTool className="h-3.5 w-3.5" /> Content Editor Mode
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-gray-800">{user.name}</span>! Manage blog posts, CMS content, and customer stories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" /> New Blog Post
            </Link>
            <Link
              href="/content"
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <FileEdit className="h-4 w-4 text-emerald-600" /> Edit CMS Content
            </Link>
          </div>
        </div>

        {/* Editor Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {editorStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Quick Shortcut Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/blogs"
            className="group bg-linear-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl text-white shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-xs">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Blogs & News Manager</h3>
              <p className="text-emerald-100 text-xs mt-1">Publish new real estate market updates, news, and guides for customers.</p>
            </div>
            <span className="text-xs font-semibold mt-4 text-white/90 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Go to Blogs &rarr;
            </span>
          </Link>

          <Link
            href="/content"
            className="group bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-xs">
                <FileEdit className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Website Banners & Content</h3>
              <p className="text-blue-100 text-xs mt-1">Update hero titles, promo banners, about text, and home sections.</p>
            </div>
            <span className="text-xs font-semibold mt-4 text-white/90 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Manage Content &rarr;
            </span>
          </Link>

          <Link
            href="/content"
            className="group bg-linear-to-br from-purple-600 to-pink-700 p-6 rounded-2xl text-white shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-xs">
                <Star className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Testimonials & Reviews</h3>
              <p className="text-purple-100 text-xs mt-1">Add client feedback, ratings, company achievements, and stats.</p>
            </div>
            <span className="text-xs font-semibold mt-4 text-white/90 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Manage Testimonials &rarr;
            </span>
          </Link>
        </div>
      </div>
    )
  }

  // ==========================================
  // 2. AGENT DASHBOARD VIEW
  // ==========================================
  if (role === 'AGENT') {
    let myPropertiesCount = 0, myActiveCount = 0, mySoldCount = 0, myLeadsCount = 0, myVisitsCount = 0, myDealsCount = 0
    let myPendingTasksCount = 0, myStars = 0, myPoints = 0, myCommissionEarned = 0
    let myRecentLeads: any[] = [], myUpcomingVisits: any[] = [], myTodayTasks: any[] = [], myDeals: any[] = []

    try {
      const results = await Promise.all([
        prisma.property.count({ where: { agentId: userId } }),
        prisma.property.count({ where: { agentId: userId, status: 'AVAILABLE' } }),
        prisma.property.count({ where: { agentId: userId, status: 'SOLD' } }),
        prisma.lead.count({ where: { agentId: userId } }),
        prisma.visit.count({ where: { agentId: userId, status: { in: ['SCHEDULED', 'CONFIRMED'] } } }),
        prisma.deal.count({ where: { agentId: userId, status: { in: ['PAID', 'SOLD', 'COMPLETED'] } } }),
        prisma.task.count({ where: { assignedToId: userId, status: { in: ['PENDING', 'IN_PROGRESS', 'NEEDS_REVISION'] } } }),
        prisma.user.findUnique({ where: { id: userId }, select: { stars: true, performancePoints: true } }),
        prisma.commission.aggregate({ where: { agentId: userId }, _sum: { commissionAmount: true } }),
        prisma.task.findMany({
          where: {
            assignedToId: userId,
            dueDate: { gte: todayStart, lte: todayEnd },
          },
          include: { customer: true, property: true },
          orderBy: { priority: 'desc' },
        }),
        prisma.visit.findMany({
          where: { agentId: userId, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
          take: 4,
          orderBy: { date: 'asc' },
          include: { customer: true, property: true },
        }),
        prisma.lead.findMany({
          where: { agentId: userId },
          take: 5,
          orderBy: { created_at: 'desc' },
          include: { property: true, agent: true },
        }),
        prisma.deal.findMany({
          where: { agentId: userId },
          take: 5,
          orderBy: { closingDate: 'desc' },
          include: { property: true, buyer: true },
        }),
      ])

      ;[
        myPropertiesCount, myActiveCount, mySoldCount, myLeadsCount,
        myVisitsCount, myDealsCount, myPendingTasksCount,
        results[7], results[8], myTodayTasks, myUpcomingVisits, myRecentLeads, myDeals
      ] = results

      myStars = results[7]?.stars || 0
      myPoints = results[7]?.performancePoints || 0
      myCommissionEarned = results[8]?._sum?.commissionAmount || 0
    } catch {
      console.error('DB error fetching agent dashboard data')
    }

    const agentStats = [
      { label: 'My Performance Stars', value: myStars, icon: Star, color: 'purple', change: `${myPoints} pts` },
      { label: 'Pending Duties', value: myPendingTasksCount, icon: CheckSquare, color: 'orange', change: `${myTodayTasks.length} today` },
      { label: 'Scheduled Visits', value: myVisitsCount, icon: CalendarCheck, color: 'cyan', change: 'Upcoming' },
      { label: 'Assigned Leads', value: myLeadsCount, icon: Users2, color: 'blue', change: 'Clients' },
      { label: 'Closed Deals', value: myDealsCount, icon: DollarSign, color: 'emerald', change: `${mySoldCount} sold` },
      { label: 'Commission Earned', value: formatPrice(myCommissionEarned), icon: Award, color: 'green', change: 'Ledger' },
    ]

    return (
      <div className="space-y-6">
        {/* Today's Tasks Modal Popup */}
        <TodayTasksModal tasks={myTodayTasks} userName={user.name || 'Agent'} />

        {/* Agent Header & Daily Goal Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Agent Portfolio Dashboard</h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> Active Consultant
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-gray-800">{user.name}</span>! Here is what is on your agenda today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/visits"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" /> Schedule Visit
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <CheckSquare className="h-4 w-4 text-emerald-600" /> My Tasks ({myPendingTasksCount})
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {agentStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Today's Agenda Row: Today's Tasks + Upcoming Visits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks Box */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" /> Today&apos;s Assigned Duties ({myTodayTasks.length})
              </h3>
              <Link href="/tasks" className="text-xs text-emerald-600 font-bold hover:underline">
                View All Tasks &rarr;
              </Link>
            </div>

            {myTodayTasks.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-gray-700">No tasks due today!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">You are all caught up on your daily assignments.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myTodayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 hover:border-emerald-200 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-900 truncate">{t.title}</p>
                        <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded-sm">
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {t.dueTime ? `⏰ ${t.dueTime}` : ''} {t.customer ? `· 👤 ${t.customer.name}` : ''}
                      </p>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Visits Box */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-600" /> Upcoming Customer Visits ({myUpcomingVisits.length})
              </h3>
              <Link href="/visits" className="text-xs text-emerald-600 font-bold hover:underline">
                Open Calendar &rarr;
              </Link>
            </div>

            {myUpcomingVisits.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <CalendarCheck className="h-8 w-8 text-blue-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-gray-700">No upcoming walkthroughs scheduled</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Use the Schedule Visit button to arrange a property walkthrough.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myUpcomingVisits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 hover:border-emerald-200 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        👤 {v.customer.name} · {v.property.title}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        📅 {formatDate(v.date)} at {v.time}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Recent Activity: Leads & Deals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentLeads leads={myRecentLeads} />
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Handshake className="h-5 w-5 text-emerald-600" /> My Recent Deals & Sales
              </h3>
              <Link href="/deals" className="text-xs text-emerald-600 font-bold hover:underline">
                View Ledger &rarr;
              </Link>
            </div>

            {myDeals.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <DollarSign className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-gray-700">No deals logged yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Log a closed deal to generate commission records.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myDeals.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{d.title}</p>
                      <p className="text-[11px] text-gray-500">
                        {formatPrice(d.finalPrice || d.dealValue)} · {formatDate(d.closingDate)}
                      </p>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // 3. SUPER ADMIN & ADMIN DASHBOARD VIEW
  // ==========================================
  let totalProperties = 0, activeListings = 0, soldProperties = 0, totalLeads = 0, scheduledVisits = 0
  let totalCustomers = 0, activeAgents = 0, totalRevenue = 0, pendingCommissionTotal = 0
  let pendingTasksCount = 0, awaitingVerificationCount = 0
  let todayVisits: any[] = [], todayTasks: any[] = [], topEmployees: any[] = []
  let recentLeads: any[] = [], recentMessages: any[] = [], leadsByStatus: any[] = [], propertiesByType: any[] = []

  try {
    const results = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'AVAILABLE' } }),
      prisma.property.count({ where: { status: 'SOLD' } }),
      prisma.lead.count(),
      prisma.visit.count({ where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } } }),
      prisma.customer.count(),
      prisma.user.count({ where: { role: 'AGENT', isActive: true } }),
      prisma.deal.aggregate({
        where: { status: { in: ['SOLD', 'COMPLETED', 'PAID'] } },
        _sum: { dealValue: true },
      }),
      prisma.commission.aggregate({
        where: { status: 'PENDING' },
        _sum: { commissionAmount: true },
      }),
      prisma.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.task.count({ where: { status: 'COMPLETED' } }), // Awaiting verification
      prisma.visit.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        include: { customer: true, property: true, agent: true },
        orderBy: { date: 'asc' },
      }),
      prisma.task.findMany({
        where: { dueDate: { gte: todayStart, lte: todayEnd } },
        include: { assignedTo: true, customer: true, property: true },
        orderBy: { priority: 'desc' },
      }),
      prisma.user.findMany({
        where: { isActive: true, role: 'AGENT' },
        select: { id: true, name: true, designation: true, stars: true, performancePoints: true },
        orderBy: { performancePoints: 'desc' },
        take: 4,
      }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { property: true, agent: true },
      }),
      prisma.message.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.lead.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.property.groupBy({ by: ['property_type'], _count: { property_type: true } }),
    ])

    ;[
      totalProperties, activeListings, soldProperties, totalLeads, scheduledVisits,
      totalCustomers, activeAgents, results[7], results[8],
      pendingTasksCount, awaitingVerificationCount, todayVisits, todayTasks,
      topEmployees, recentLeads, recentMessages, leadsByStatus, propertiesByType
    ] = results

    totalRevenue = results[7]?._sum?.dealValue || 0
    pendingCommissionTotal = results[8]?._sum?.commissionAmount || 0
  } catch (err) {
    console.error('Database query error in Admin Dashboard:', err)
  }

  const adminStats = [
    { label: 'Total Properties', value: totalProperties, icon: Building2, color: 'emerald', change: `${activeListings} available` },
    { label: 'Sold Properties', value: soldProperties, icon: TrendingUp, color: 'purple', change: `${soldProperties} closed` },
    { label: 'Total Customers', value: totalCustomers, icon: Users2, color: 'blue', change: `${totalLeads} inquiries` },
    { label: 'Active Agents', value: activeAgents, icon: UserCheck, color: 'cyan', change: 'Team' },
    { label: 'Total Sales Volume', value: formatPrice(totalRevenue), icon: DollarSign, color: 'green', change: 'Closed' },
    { label: 'Pending Commission', value: formatPrice(pendingCommissionTotal), icon: Award, color: 'orange', change: 'Ledger' },
  ]

  return (
    <div className="space-y-6">
      {/* Today's Tasks Modal Popup */}
      <TodayTasksModal tasks={todayTasks} userName={user.name || 'Admin'} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {role === 'SUPER_ADMIN' ? 'Super Admin Command Center' : 'CRM Admin Dashboard'}
            </h1>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1',
                role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {role === 'SUPER_ADMIN' ? 'Super Admin — Full Authority' : 'CRM Manager'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <span className="font-semibold text-gray-800">{user.name}</span>! Master oversight of property transactions, team duties, and agent rankings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {awaitingVerificationCount > 0 && (
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors animate-pulse"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600" /> {awaitingVerificationCount} Tasks Awaiting Verification
            </Link>
          )}

          <Link
            href="/visits"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" /> Schedule Visit
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <CheckSquare className="h-4 w-4 text-emerald-600" /> Assign Tasks
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Today's Activity: Visits + Tasks Pending Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Scheduled Visits */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-emerald-600" /> Today&apos;s Site Visits ({todayVisits.length})
            </h3>
            <Link href="/visits" className="text-xs text-emerald-600 font-bold hover:underline">
              Visits &rarr;
            </Link>
          </div>

          {todayVisits.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No site visits scheduled for today.</p>
          ) : (
            <div className="space-y-2.5">
              {todayVisits.map((v) => (
                <div key={v.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-900">{v.customer.name}</p>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      {v.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{v.property.title}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">Agent: {v.agent?.name || 'Unassigned'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Due Tasks */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-600" /> Today&apos;s Team Duties ({todayTasks.length})
            </h3>
            <Link href="/tasks" className="text-xs text-emerald-600 font-bold hover:underline">
              Tasks &rarr;
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No employee tasks due today.</p>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((t) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-900 truncate">{t.title}</p>
                    <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded-sm">
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Assigned: <strong className="text-gray-700">{t.assignedTo?.name}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Consultant Leaders */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Top Consultants & Stars
            </h3>
            <Link href="/performance" className="text-xs text-emerald-600 font-bold hover:underline">
              Leaderboard &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {topEmployees.map((emp, idx) => (
              <div key={emp.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-amber-600 w-5">#{idx + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{emp.name}</p>
                    <p className="text-[10px] text-gray-400">{emp.designation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Star className="h-3 w-3 fill-amber-400" /> {emp.stars} ⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadStatusChart data={leadsByStatus as any} />
        <PropertyTypeChart data={propertiesByType as any} />
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeads leads={recentLeads} />
        <RecentMessages messages={recentMessages} />
      </div>
    </div>
  )
}
