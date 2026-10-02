'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CalendarCheck, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Trash2, 
  DollarSign, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  X,
  UserPlus
} from 'lucide-react'
import { formatDate, cn, formatPrice } from '@/lib/utils'
import { 
  scheduleVisit, 
  updateVisitStatus, 
  updateVisit, 
  retryVisitGoogleSync, 
  deleteVisit 
} from '@/app/actions/visits'
import { toast } from 'sonner'
import { VisitsExportButton } from '@/components/dashboard/DataExportButtons'

export interface VisitRecord {
  id: string
  date: string | Date
  time: string
  endTime: string | null
  visitType: string | null
  location: string | null
  purpose: string | null
  notes: string | null
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW'
  googleCalendarEventId: string | null
  googleSyncStatus: string | null
  googleSyncError: string | null
  customer: {
    id: string
    name: string
    phone: string
    email?: string | null
    address?: string | null
  }
  property: {
    id: string
    title: string
    location: string
    price: number
  }
  agent: {
    id: string
    name: string
    email?: string | null
  } | null
}

interface VisitsClientProps {
  visits: VisitRecord[]
  customers: { id: string; name: string; phone: string; email?: string | null }[]
  properties: { id: string; title: string; location: string; price: number }[]
  agents: { id: string; name: string; email?: string | null }[]
  currentUserId: string
  currentUserRole: string
  isGoogleConnected: boolean
  googleEmail?: string | null
}

export function VisitsClient({
  visits,
  customers,
  properties,
  agents,
  currentUserId,
  currentUserRole,
  isGoogleConnected,
  googleEmail,
}: VisitsClientProps) {
  const router = useRouter()
  const [filterTab, setFilterTab] = useState<string>('UPCOMING')
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isCreatingNewCustomerInline, setIsCreatingNewCustomerInline] = useState(false)
  const [selectedVisitDetails, setSelectedVisitDetails] = useState<VisitRecord | null>(null)
  const [editingVisit, setEditingVisit] = useState<VisitRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)

  // Date filters helper
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()))

  const filteredVisits = visits.filter((v) => {
    const vDateStr = new Date(v.date).toISOString().split('T')[0]
    const vDate = new Date(v.date)

    // Tab filter
    if (filterTab === 'TODAY' && vDateStr !== todayStr) return false
    if (filterTab === 'TOMORROW' && vDateStr !== tomorrowStr) return false
    if (filterTab === 'THIS_WEEK' && (vDate < new Date(now.setHours(0,0,0,0)) || vDate > endOfWeek)) return false
    if (filterTab === 'UPCOMING' && v.status !== 'SCHEDULED' && v.status !== 'CONFIRMED') return false
    if (filterTab === 'COMPLETED' && v.status !== 'COMPLETED') return false
    if (filterTab === 'CANCELLED' && v.status !== 'CANCELLED') return false

    // Agent filter
    if (agentFilter && v.agent?.id !== agentFilter) return false

    // Property filter
    if (propertyFilter && v.property.id !== propertyFilter) return false

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const custMatch = v.customer.name.toLowerCase().includes(q) || v.customer.phone.includes(q)
      const propMatch = v.property.title.toLowerCase().includes(q) || v.property.location.toLowerCase().includes(q)
      const agentMatch = v.agent?.name.toLowerCase().includes(q)
      if (!custMatch && !propMatch && !agentMatch) return false
    }

    return true
  })

  // Metric counts
  const totalCount = visits.length
  const upcomingCount = visits.filter((v) => v.status === 'SCHEDULED' || v.status === 'CONFIRMED').length
  const completedCount = visits.filter((v) => v.status === 'COMPLETED').length
  const cancelledCount = visits.filter((v) => v.status === 'CANCELLED').length
  const todayCount = visits.filter((v) => new Date(v.date).toISOString().split('T')[0] === todayStr).length

  // Action triggers
  const handleStatusChange = async (id: string, status: any) => {
    setIsSubmitting(true)
    try {
      const res = await updateVisitStatus(id, status)
      if (res.success) {
        toast.success(`Visit marked as ${status}`)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update visit status')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetryGoogleSync = async (id: string) => {
    setSyncingId(id)
    try {
      const res = await retryVisitGoogleSync(id)
      if (res.success) {
        toast.success('Visit synchronized to Google Calendar!')
        router.refresh()
      } else {
        toast.error(res.error || 'Google Calendar sync failed')
      }
    } finally {
      setSyncingId(null)
    }
  }

  const handleDeleteVisit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visit schedule?')) return
    setIsSubmitting(true)
    try {
      const res = await deleteVisit(id)
      if (res.success) {
        toast.success('Visit deleted')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete visit')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      let newCustomerPayload = undefined
      if (isCreatingNewCustomerInline) {
        newCustomerPayload = {
          name: formData.get('cust_name') as string,
          phone: formData.get('cust_phone') as string,
          email: (formData.get('cust_email') as string) || undefined,
          address: (formData.get('cust_address') as string) || undefined,
          notes: (formData.get('cust_notes') as string) || undefined,
          source: (formData.get('cust_source') as string) || 'DIRECT_VISIT',
        }
      }

      const res = await scheduleVisit({
        customerId: !isCreatingNewCustomerInline ? (formData.get('customerId') as string) : undefined,
        newCustomer: newCustomerPayload,
        propertyId: formData.get('propertyId') as string,
        agentId: (formData.get('agentId') as string) || undefined,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        endTime: (formData.get('endTime') as string) || undefined,
        visitType: (formData.get('visitType') as string) || 'Site Walkthrough',
        location: (formData.get('location') as string) || undefined,
        purpose: (formData.get('purpose') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
      })

      if (res.success) {
        if (res.googleWarning) {
          toast.warning(res.message)
        } else {
          toast.success(res.message || 'Visit scheduled successfully!')
        }
        setIsScheduleModalOpen(false)
        setIsCreatingNewCustomerInline(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to schedule visit')
      }
    } catch {
      toast.error('Unexpected error scheduling visit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingVisit) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const res = await updateVisit(editingVisit.id, {
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        endTime: (formData.get('endTime') as string) || undefined,
        agentId: (formData.get('agentId') as string) || null,
        propertyId: formData.get('propertyId') as string,
        visitType: (formData.get('visitType') as string) || undefined,
        location: (formData.get('location') as string) || undefined,
        purpose: (formData.get('purpose') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
        status: formData.get('status') as any,
      })

      if (res.success) {
        toast.success('Visit details and calendar synchronized!')
        setEditingVisit(null)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update visit')
      }
    } catch {
      toast.error('Error updating visit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-emerald-600" /> Visits & Schedule Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Coordinate customer walkthroughs, manage calendars, and sync visits with Google Calendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Calendar Connection Status Banner */}
          {isGoogleConnected ? (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Calendar: {googleEmail || 'Connected'}</span>
            </div>
          ) : (
            <a
              href="/api/auth/google/connect?returnPath=/visits"
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-600" /> Connect Google Calendar
            </a>
          )}

          <VisitsExportButton visits={visits as any} />

          <button
            onClick={() => {
              setIsCreatingNewCustomerInline(false)
              setIsScheduleModalOpen(true)
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Schedule Visit
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'TODAY', label: "Today's Visits", count: todayCount, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { key: 'UPCOMING', label: 'Upcoming / Scheduled', count: upcomingCount, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { key: 'COMPLETED', label: 'Completed Visits', count: completedCount, color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { key: 'CANCELLED', label: 'Cancelled', count: cancelledCount, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterTab(s.key)}
            className={cn('border rounded-2xl p-4 text-center transition-all hover:shadow-xs cursor-pointer', s.color, filterTab === s.key && 'ring-2 ring-emerald-500')}
          >
            <p className="text-3xl font-black">{s.count}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
          {[
            { key: 'ALL', label: 'All Visits' },
            { key: 'TODAY', label: 'Today' },
            { key: 'TOMORROW', label: 'Tomorrow' },
            { key: 'THIS_WEEK', label: 'This Week' },
            { key: 'UPCOMING', label: 'Upcoming' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                filterTab === tab.key ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Agent Filter */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-70">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, property, phone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="border border-gray-200 rounded-xl text-xs px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Scheduled Appointments ({filteredVisits.length})</h3>
          <span className="text-xs text-gray-400">Timezone: Asia/Kathmandu (UTC+5:45)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs font-semibold">
                <th className="px-5 py-3.5 text-left">Customer</th>
                <th className="px-4 py-3.5 text-left">Property</th>
                <th className="px-4 py-3.5 text-left">Assigned Agent</th>
                <th className="px-4 py-3.5 text-left">Date & Time</th>
                <th className="px-4 py-3.5 text-left">Calendar Sync</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                    <p className="font-medium text-gray-500">No visits found matching your filters</p>
                    <p className="text-xs mt-1">Schedule a site walkthrough or adjust your search.</p>
                  </td>
                </tr>
              ) : (
                filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <button
                          onClick={() => setSelectedVisitDetails(v)}
                          className="font-bold text-gray-900 hover:text-emerald-600 text-left transition-colors text-sm"
                        >
                          {v.customer.name}
                        </button>
                        <p className="text-xs text-gray-500">{v.customer.phone}</p>
                      </div>
                    </td>

                    {/* Property */}
                    <td className="px-4 py-4">
                      <div className="space-y-0.5 max-w-50">
                        <p className="font-medium text-gray-800 text-xs truncate">{v.property.title}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {v.property.location}
                        </p>
                      </div>
                    </td>

                    {/* Agent */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px]">
                          {v.agent?.name?.charAt(0) || '—'}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{v.agent?.name || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-800 text-xs">{formatDate(v.date)}</p>
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {v.time} {v.endTime ? `– ${v.endTime}` : ''}
                        </p>
                      </div>
                    </td>

                    {/* Google Sync */}
                    <td className="px-4 py-4">
                      {v.googleSyncStatus === 'SYNCED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Synced
                        </span>
                      ) : v.googleSyncStatus === 'FAILED' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200" title={v.googleSyncError || 'Sync failed'}>
                            <AlertTriangle className="h-3 w-3" /> Failed
                          </span>
                          <button
                            onClick={() => handleRetryGoogleSync(v.id)}
                            disabled={syncingId === v.id}
                            className="p-1 text-gray-400 hover:text-emerald-600 rounded-md"
                            title="Retry Calendar Sync"
                          >
                            <RefreshCw className={cn('h-3.5 w-3.5', syncingId === v.id && 'animate-spin')} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">Not Synced</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded-full',
                          v.status === 'COMPLETED' && 'bg-emerald-100 text-emerald-800',
                          v.status === 'CONFIRMED' && 'bg-blue-100 text-blue-800',
                          v.status === 'SCHEDULED' && 'bg-yellow-100 text-yellow-800',
                          v.status === 'CANCELLED' && 'bg-red-100 text-red-800',
                          v.status === 'RESCHEDULED' && 'bg-purple-100 text-purple-800',
                          v.status === 'NO_SHOW' && 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {v.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs">
                        {v.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleStatusChange(v.id, 'COMPLETED')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}

                        {v.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleStatusChange(v.id, 'CANCELLED')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() => setEditingVisit(v)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setSelectedVisitDetails(v)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>

                        {isSuperAdminOrAdmin && (
                          <button
                            onClick={() => handleDeleteVisit(v.id)}
                            disabled={isSubmitting}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Visit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visit Details Modal */}
      {selectedVisitDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                  Visit Appointment #{selectedVisitDetails.id.slice(0, 8)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedVisitDetails.customer.name} · {selectedVisitDetails.property.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVisitDetails(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400">Customer Phone:</span>
                  <p className="font-bold text-gray-800">{selectedVisitDetails.customer.phone}</p>
                </div>
                <div>
                  <span className="text-gray-400">Customer Email:</span>
                  <p className="font-bold text-gray-800">{selectedVisitDetails.customer.email || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Assigned Agent:</span>
                  <p className="font-bold text-gray-800">{selectedVisitDetails.agent?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Date & Time:</span>
                  <p className="font-bold text-gray-800">
                    {formatDate(selectedVisitDetails.date)} at {selectedVisitDetails.time}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Visit Type:</span>
                  <p className="font-bold text-gray-800">{selectedVisitDetails.visitType || 'Site Walkthrough'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Location / Meetup:</span>
                  <p className="font-bold text-gray-800">{selectedVisitDetails.location || selectedVisitDetails.property.location}</p>
                </div>
              </div>

              {selectedVisitDetails.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-400">Notes & Instructions:</span>
                  <p className="mt-0.5 text-gray-800">{selectedVisitDetails.notes}</p>
                </div>
              )}

              {/* Google Sync Information */}
              <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">Google Calendar Status:</p>
                  <p className="text-[11px] text-gray-500">
                    {selectedVisitDetails.googleSyncStatus === 'SYNCED'
                      ? `Event ID: ${selectedVisitDetails.googleCalendarEventId || 'Active'}`
                      : selectedVisitDetails.googleSyncError || 'Not synchronized'}
                  </p>
                </div>
                {selectedVisitDetails.googleSyncStatus !== 'SYNCED' && (
                  <button
                    onClick={() => handleRetryGoogleSync(selectedVisitDetails.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/deals?fromVisit=${selectedVisitDetails.id}&propertyId=${selectedVisitDetails.property.id}&buyerId=${selectedVisitDetails.customer.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                <DollarSign className="h-3.5 w-3.5" /> Convert to Deal
              </Link>

              <button
                onClick={() => setSelectedVisitDetails(null)}
                className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Visit Modal */}
      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Edit / Reschedule Visit</h3>
              <button onClick={() => setEditingVisit(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Visit Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date(editingVisit.date).toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Start Time *</label>
                  <input
                    type="text"
                    name="time"
                    required
                    defaultValue={editingVisit.time}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">End Time</label>
                  <input
                    type="text"
                    name="endTime"
                    defaultValue={editingVisit.endTime || ''}
                    placeholder="e.g. 11:30 AM"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Status</label>
                  <select
                    name="status"
                    defaultValue={editingVisit.status}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                    <option value="NO_SHOW">No Show</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Property</label>
                <select
                  name="propertyId"
                  defaultValue={editingVisit.property.id}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              {isSuperAdminOrAdmin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Assigned Agent</label>
                  <select
                    name="agentId"
                    defaultValue={editingVisit.agent?.id || ''}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Visit Notes / Feedback</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingVisit.notes || ''}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Update & Synchronize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal (Supports Selecting or Creating Customer inline!) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-emerald-600" /> Schedule Property Walkthrough
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record a customer site visit. Automatically syncs with Google Calendar.
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {/* Customer Switch: Select Existing vs Create New Inline */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">Customer Source</label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewCustomerInline(!isCreatingNewCustomerInline)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    {isCreatingNewCustomerInline ? (
                      '← Select from Existing Customers'
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" /> + Create New / Met Outside
                      </>
                    )}
                  </button>
                </div>

                {!isCreatingNewCustomerInline ? (
                  <div className="space-y-1.5">
                    <select
                      name="customerId"
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="" disabled selected>
                        Choose Registered Customer...
                      </option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="cust_name"
                        required
                        placeholder="Full Name *"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="tel"
                        name="cust_phone"
                        required
                        placeholder="Phone Number *"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        name="cust_email"
                        placeholder="Email (for Google Calendar Invite)"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        name="cust_address"
                        placeholder="Customer Address"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Property Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Select Property *</label>
                <select
                  name="propertyId"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="" disabled selected>
                    Choose Property...
                  </option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.location}) — {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Visit Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={todayStr}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Start Time *</label>
                  <input
                    type="text"
                    name="time"
                    required
                    placeholder="10:00 AM"
                    defaultValue="10:00 AM"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">End Time</label>
                  <input
                    type="text"
                    name="endTime"
                    placeholder="11:00 AM"
                    defaultValue="11:00 AM"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Agent & Visit Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Assigned Agent (Host)</label>
                  <select
                    name="agentId"
                    defaultValue={currentUserId}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {isSuperAdminOrAdmin && <option value="unassigned">Auto Assign / None</option>}
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Visit Type</label>
                  <select
                    name="visitType"
                    defaultValue="Site Walkthrough"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Site Walkthrough">Site Walkthrough</option>
                    <option value="Virtual Tour">Virtual Tour</option>
                    <option value="Structural Inspection">Structural Inspection</option>
                    <option value="Final Review">Final Review & Sign-off</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Instructions & Directions Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Key lockbox code, meetup landmark, specific questions to address..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm & Schedule Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
