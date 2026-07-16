import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate, getStatusColor, cn } from '@/lib/utils'
import { CalendarCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { updateVisitStatus } from '@/app/actions/visits'
import { VisitsExportButton } from '@/components/dashboard/DataExportButtons'

export default async function VisitsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let visits: any[] = []
  let dbError = false

  try {
    visits = await prisma.visit.findMany({
      orderBy: { date: 'asc' },
      include: { customer: true, property: true, agent: true },
    })
  } catch (error) {
    console.error("DB Query failed in Visits Page, showing fallback data:", error)
    dbError = true
  }

  // Fallback Mock Data for demo mode
  if (dbError || visits.length === 0) {
    visits = [
      {
        id: 'mock-visit-1',
        customer: { name: 'Bikash Shrestha', phone: '+977-9841234567' },
        property: { title: 'Luxury 3BHK Apartment in Lazimpat' },
        date: new Date('2026-06-28'),
        time: '10:00 AM',
        status: 'SCHEDULED',
        agent: { name: 'Raj Kumar Sharma' }
      },
      {
        id: 'mock-visit-2',
        customer: { name: 'Sunita Maharjan', phone: '+977-9852345678' },
        property: { title: 'Commercial Space in New Road' },
        date: new Date('2026-06-26'),
        time: '2:00 PM',
        status: 'COMPLETED',
        agent: { name: 'Priya Thapa' }
      }
    ]
  }

  const upcoming = visits.filter(v => v.status === 'SCHEDULED')
  const completed = visits.filter(v => v.status === 'COMPLETED')
  const cancelled = visits.filter(v => v.status === 'CANCELLED')

  // Server Action Wrappers
  async function handleConfirmAction(id: string) {
    'use server'
    await updateVisitStatus(id, 'COMPLETED')
  }

  async function handleCancelAction(id: string) {
    'use server'
    await updateVisitStatus(id, 'CANCELLED')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit Scheduling</h1>
          <p className="text-gray-500 text-sm">{visits.length} total visits</p>
        </div>
        <div className="flex gap-2">
          {dbError && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center">
              Sandbox Mode
            </span>
          )}
          <VisitsExportButton visits={visits} />
          <Link href="/visits/new" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Schedule Visit
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Upcoming', count: upcoming.length, color: 'bg-blue-50 border-blue-200', badge: 'text-blue-700' },
          { label: 'Completed', count: completed.length, color: 'bg-emerald-50 border-emerald-200', badge: 'text-emerald-700' },
          { label: 'Cancelled', count: cancelled.length, color: 'bg-red-50 border-red-200', badge: 'text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.badge}`}>{s.count}</p>
            <p className="text-sm text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">All Visits</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Property</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date & Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visits.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />No visits scheduled
                </td></tr>
              ) : visits.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{v.customer.name}</p>
                    <p className="text-xs text-gray-400">{v.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell max-w-[160px] truncate">{v.property.title}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{formatDate(v.date)}</p>
                    <p className="text-xs text-gray-400">{v.time}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{v.agent?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getStatusColor(v.status))}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      {v.status === 'SCHEDULED' && (
                        <>
                          <form action={handleConfirmAction.bind(null, v.id)}>
                            <button type="submit" className="text-emerald-600 hover:underline font-medium">Confirm</button>
                          </form>
                          <form action={handleCancelAction.bind(null, v.id)}>
                            <button type="submit" className="text-red-500 hover:underline font-medium">Cancel</button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
