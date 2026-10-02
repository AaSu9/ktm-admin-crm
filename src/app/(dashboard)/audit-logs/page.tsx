import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate, cn } from '@/lib/utils'
import { ShieldAlert, Search, Filter, Calendar, User, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ search?: string; action?: string; entity?: string }>
}) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userRole = (session.user as { role?: string })?.role || 'AGENT'
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard?error=unauthorized')
  }

  const where: any = {}
  if (searchParams.action) where.action = searchParams.action
  if (searchParams.entity) where.entityType = searchParams.entity
  if (searchParams.search) {
    where.OR = [
      { description: { contains: searchParams.search, mode: 'insensitive' } },
      { userName: { contains: searchParams.search, mode: 'insensitive' } },
      { action: { contains: searchParams.search, mode: 'insensitive' } },
      { entityType: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }

  let logs: any[] = []
  try {
    logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-emerald-600" /> Security Audit & Activity Trail
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Immutable log of all user activities, task completions, verifications, deal closings, and calendar syncs.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {logs.length} Recorded Events
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
        <form className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="search"
              defaultValue={searchParams.search}
              placeholder="Search user, action, target entity..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            name="entity"
            defaultValue={searchParams.entity || ''}
            className="border border-gray-200 rounded-xl text-xs px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="TASK">Tasks</option>
            <option value="VISIT">Visits</option>
            <option value="DEAL">Deals</option>
            <option value="PROPERTY">Properties</option>
            <option value="COMMISSION">Commissions</option>
            <option value="GOOGLE_CALENDAR">Google Calendar</option>
            <option value="CUSTOMER">Customers</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Filter Logs
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Activity Stream</h3>
          <span className="text-xs text-gray-400">Chronological Event History</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs font-semibold">
                <th className="px-5 py-3.5 text-left">Actor / User</th>
                <th className="px-4 py-3.5 text-left">Action</th>
                <th className="px-4 py-3.5 text-left">Target Entity</th>
                <th className="px-5 py-3.5 text-left">Description</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                    <p className="font-medium text-gray-500">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {log.userName?.charAt(0) || log.user?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{log.userName || log.user?.name || 'System'}</p>
                          <p className="text-[10px] text-gray-400">{log.userRole || log.user?.role || 'SYSTEM'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4">
                      <span className="font-mono text-[11px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {log.entityType}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-700 max-w-md">{log.description}</p>
                      {log.metadata && (
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-md">
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-4 text-right text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        timeZone: 'Asia/Kathmandu',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
