import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate, getStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, Phone, Mail, UserRound } from 'lucide-react'
import { LeadsExportButton } from '@/components/dashboard/DataExportButtons'

const PIPELINE_STAGES = [
  { id: 'NEW', label: 'New', color: 'bg-blue-500' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-purple-500' },
  { id: 'INTERESTED', label: 'Interested', color: 'bg-orange-500' },
  { id: 'VISIT_SCHEDULED', label: 'Visit Scheduled', color: 'bg-cyan-500' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-yellow-500' },
  { id: 'CLOSED_WON', label: 'Closed Won', color: 'bg-emerald-500' },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-500' },
]

export default async function LeadsPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ view?: string; search?: string; source?: string; priority?: string }> }) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const view = searchParams.view || 'table'
  const where: any = {}
  if (searchParams.search) {
    where.OR = [
      { full_name: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
      { phone: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }
  if (searchParams.source) where.source = searchParams.source
  if (searchParams.priority) where.priority = searchParams.priority

  let leads: any[] = []
  try {
    leads = await prisma.lead.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { property: true, agent: true },
    })
  } catch (error) {
    console.error('DB Query failed in Leads Page:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads CRM</h1>
          <p className="text-gray-500 text-sm">{leads.length} total leads</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LeadsExportButton leads={leads} />
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            <Link href="/leads?view=table" className={cn('px-3 py-2 text-xs font-medium transition-colors', view === 'table' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50')}>
              Table
            </Link>
            <Link href="/leads?view=kanban" className={cn('px-3 py-2 text-xs font-medium transition-colors', view === 'kanban' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50')}>
              Kanban
            </Link>
          </div>
          <Link href="/leads/new" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Lead
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input name="search" defaultValue={searchParams.search} placeholder="Search leads by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50" />
          </div>
          <select name="source" defaultValue={searchParams.source}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social">Social Media</option>
            <option value="walk-in">Walk-in</option>
          </select>
          <select name="priority" defaultValue={searchParams.priority}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <input type="hidden" name="view" value={view} />
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">Filter</button>
        </form>
      </div>

      {view === 'kanban' ? (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.id)
            return (
              <div key={stage.id} className="flex-shrink-0 w-64 bg-gray-100/70 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-2.5 h-2.5 rounded-full', stage.color)} />
                  <h3 className="text-sm font-semibold text-gray-700">{stage.label}</h3>
                  <span className="ml-auto text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded-full">{stageLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs">No leads</div>
                  ) : (
                    stageLeads.map((lead) => (
                      <Link key={lead.id} href={`/leads/${lead.id}`}
                        className="block bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all">
                        <p className="font-medium text-gray-800 text-sm truncate">{lead.full_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.property?.title || 'No property'}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium',
                            lead.priority === 'HIGH' ? 'bg-red-100 text-red-600' : lead.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'
                          )}>{lead.priority}</span>
                          <span className="text-xs text-gray-400 ml-auto">{formatDate(lead.created_at)}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Lead</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Property</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden xl:table-cell">Agent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <UserRound className="h-10 w-10 mx-auto mb-2 opacity-30" />No leads found
                </td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {lead.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{lead.full_name}</p>
                        <p className="text-xs text-gray-400">{lead.source || 'Unknown'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="h-3 w-3" />{lead.phone}</div>
                      {lead.email && <div className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{lead.email}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell max-w-[150px] truncate">{lead.property?.title || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(lead.status || 'NEW'))}>
                      {(lead.status || 'NEW').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(lead.priority))}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">{lead.agent?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/leads/${lead.id}`} className="text-xs text-emerald-600 hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
