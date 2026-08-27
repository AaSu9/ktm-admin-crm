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
  Clock
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentLeads } from '@/components/dashboard/RecentLeads'
import { RecentMessages } from '@/components/dashboard/RecentMessages'
import { LeadStatusChart } from '@/components/dashboard/LeadStatusChart'
import { PropertyTypeChart } from '@/components/dashboard/PropertyTypeChart'

export const revalidate = 60

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = session.user as { id?: string; name?: string; role?: string }
  const role = user?.role || 'AGENT'
  const userId = user?.id

  // ==========================================
  // 1. EDITOR DASHBOARD VIEW
  // ==========================================
  if (role === 'EDITOR') {
    let publishedBlogs = 0, draftBlogs = 0, featuredBlogs = 0, testimonialsCount = 0
    let recentBlogs: Record<string, unknown>[] = []

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
      console.error("DB error fetching editor dashboard data")
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

        {/* Recent Blogs Table */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-md flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" /> Recent Blog Posts
            </h3>
            <Link href="/blogs" className="text-xs text-emerald-600 font-semibold hover:underline">
              View All Posts &rarr;
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentBlogs.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No blog posts created yet.</p>
            ) : (
              recentBlogs.map((blog) => (
                <div key={blog.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{blog.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      By {blog.author?.name || 'Editor'} · {new Date(blog.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {blog.published ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Published</span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Draft</span>
                    )}
                    {blog.isFeatured && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Featured</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // 2. AGENT DASHBOARD VIEW
  // ==========================================
  if (role === 'AGENT') {
    let myPropertiesCount = 0, myActiveCount = 0, mySoldCount = 0, myLeadsCount = 0, myVisitsCount = 0, myDealsCount = 0
    let myRecentLeads: unknown[] = [], myLeadsByStatus: unknown[] = [], myPropertiesByType: unknown[] = []

    try {
      const results = await Promise.all([
        prisma.property.count({ where: { agentId: userId } }),
        prisma.property.count({ where: { agentId: userId, status: 'AVAILABLE' } }),
        prisma.property.count({ where: { agentId: userId, status: 'SOLD' } }),
        prisma.lead.count({ where: { agentId: userId } }),
        prisma.visit.count({ where: { agentId: userId, status: 'SCHEDULED' } }),
        prisma.lead.count({ where: { agentId: userId, status: 'CLOSED_WON' } }),
        prisma.lead.findMany({ 
          where: { agentId: userId }, 
          take: 5, 
          orderBy: { created_at: 'desc' }, 
          include: { property: true, agent: true } 
        }),
        prisma.lead.groupBy({ by: ['status'], where: { agentId: userId }, _count: { status: true } }),
        prisma.property.groupBy({ by: ['property_type'], where: { agentId: userId }, _count: { property_type: true } }),
      ])
      ;[
        myPropertiesCount, myActiveCount, mySoldCount, myLeadsCount, 
        myVisitsCount, myDealsCount, myRecentLeads, myLeadsByStatus, myPropertiesByType
      ] = results
    } catch {
      console.error("DB error fetching agent dashboard data")
    }

    const agentStats = [
      { label: 'My Assigned Properties', value: myPropertiesCount, icon: Building2, color: 'emerald', change: `${myActiveCount} active` },
      { label: 'My Active Listings', value: myActiveCount, icon: Layers, color: 'blue', change: 'Available' },
      { label: 'My Sold Properties', value: mySoldCount, icon: TrendingUp, color: 'purple', change: `${mySoldCount} sold` },
      { label: 'My Assigned Leads', value: myLeadsCount, icon: Users2, color: 'orange', change: 'Clients' },
      { label: 'My Scheduled Visits', value: myVisitsCount, icon: CalendarCheck, color: 'cyan', change: `${myVisitsCount} upcoming` },
      { label: 'My Closed Deals', value: myDealsCount, icon: DollarSign, color: 'green', change: 'Closed' },
    ]

    return (
      <div className="space-y-6">
        {/* Agent Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Agent Portfolio Dashboard</h1>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> Agent Mode
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-gray-800">{user.name}</span>! Here is your personal portfolio overview and assigned client activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/leads"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Users2 className="h-4 w-4" /> View My Leads
            </Link>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Building2 className="h-4 w-4 text-emerald-600" /> My Properties
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {agentStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadStatusChart data={myLeadsByStatus as unknown as { status: string; _count: { status: number } }[]} />
          <PropertyTypeChart data={myPropertiesByType as unknown as { property_type: string; _count: { property_type: number } }[]} />
        </div>

        {/* My Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentLeads leads={myRecentLeads as unknown as Parameters<typeof RecentLeads>[0]['leads']} />
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-md flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald-600" /> My Upcoming Client Visits
              </h3>
              <Link href="/visits" className="text-xs text-emerald-600 font-semibold hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="text-xs text-gray-500 py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <CalendarCheck className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-50" />
              Check your scheduled visits page for direct client visit appointments.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // 3. SUPER ADMIN & ADMIN DASHBOARD VIEW
  // ==========================================
  let totalProperties = 0, activeListings = 0, soldProperties = 0, totalLeads = 0, scheduledVisits = 0, wonLeads = 0
  let recentLeads: unknown[] = [], recentMessages: unknown[] = [], leadsByStatus: unknown[] = [], propertiesByType: unknown[] = []

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
      prisma.lead.count({ where: { status: 'CLOSED_WON' } }),
    ])

    ;[
      totalProperties, activeListings, soldProperties, totalLeads, scheduledVisits,
      recentLeads, recentMessages, leadsByStatus, propertiesByType, wonLeads
    ] = results
  } catch {
    console.error("Database query failed — showing default state")
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {role === 'SUPER_ADMIN' ? 'Super Admin Dashboard' : 'CRM Admin Dashboard'}
            </h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
            }`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {role === 'SUPER_ADMIN' ? 'Super Admin — Full Access' : 'Admin — CRM Manager'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <span className="font-semibold text-gray-800">{user.name}</span>! Overview of company properties, agent deals, and client leads.
          </p>
        </div>

        {role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2">
            <Link
              href="/agents"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <UserCheck className="h-4 w-4" /> Manage Team & Roles
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadStatusChart data={leadsByStatus as unknown as { status: string; _count: { status: number } }[]} />
        <PropertyTypeChart data={propertiesByType as unknown as { property_type: string; _count: { property_type: number } }[]} />
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeads leads={recentLeads as unknown as Parameters<typeof RecentLeads>[0]['leads']} />
        <RecentMessages messages={recentMessages as unknown as Parameters<typeof RecentMessages>[0]['messages']} />
      </div>
    </div>
  )
}

