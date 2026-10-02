'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  DollarSign, 
  Plus, 
  Coins, 
  ClipboardCheck, 
  AlertCircle, 
  Calendar, 
  Trash2, 
  Handshake, 
  Building2, 
  User, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Percent,
  FileText,
  X,
  CreditCard,
  UserPlus
} from 'lucide-react'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { createDeal, updateDealStatus, updateDealDetails, deleteDeal } from '@/app/actions/deals'
import { updateCommissionStatus } from '@/app/actions/commissions'
import { toast } from 'sonner'
import { DealsExportButton } from '@/components/dashboard/DataExportButtons'

export interface DealRecord {
  id: string
  title: string
  dealValue: number
  propertySalePrice: number | null
  discount: number | null
  finalPrice: number | null
  paymentStatus: string | null
  amountPaid: number | null
  remainingAmount: number | null
  commissionRate: number
  commissionEarned: number
  status: string
  dealStatus: string | null
  saleDate: string | Date | null
  closingDate: string | Date
  notes: string | null
  property: { id: string; title: string; location: string; price: number; status: string | null }
  agent: { id: string; name: string; email?: string | null }
  buyer?: { id: string; name: string; phone: string } | null
  seller?: { id: string; name: string; phone: string } | null
  visit?: { id: string; time: string; date: Date | string } | null
  commissions?: {
    id: string
    status: string
    commissionAmount: number
    paidAmount: number
    paidAt: Date | string | null
  }[]
}

interface DealsClientProps {
  deals: DealRecord[]
  properties: { id: string; title: string; location: string; price: number; status: string | null }[]
  customers: { id: string; name: string; phone: string }[]
  agents: { id: string; name: string; email?: string | null }[]
  visits: { id: string; time: string; date: Date | string; customer: { name: string } }[]
  currentUserId: string
  currentUserRole: string
  initialFromVisit?: string
  initialPropertyId?: string
  initialBuyerId?: string
}

export function DealsClient({
  deals,
  properties,
  customers,
  agents,
  visits,
  currentUserId,
  currentUserRole,
  initialFromVisit,
  initialPropertyId,
  initialBuyerId,
}: DealsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'DEALS' | 'COMMISSIONS'>('DEALS')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLogDealModalOpen, setIsLogDealModalOpen] = useState(!!initialPropertyId)
  const [isCreatingNewBuyerInline, setIsCreatingNewBuyerInline] = useState(false)
  const [selectedDealDetails, setSelectedDealDetails] = useState<DealRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Deal Form Dynamic Calculations State
  const [formPropertyPrice, setFormPropertyPrice] = useState<number>(() => {
    if (initialPropertyId) {
      const p = properties.find((item) => item.id === initialPropertyId)
      return p ? p.price : 0
    }
    return 0
  })
  const [formDiscount, setFormDiscount] = useState<number>(0)
  const [formAmountPaid, setFormAmountPaid] = useState<number>(0)
  const [formCommissionRate, setFormCommissionRate] = useState<number>(2.5)

  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)

  // Calculate live numbers
  const calculatedFinalPrice = Math.max(0, formPropertyPrice - formDiscount)
  const calculatedRemaining = Math.max(0, calculatedFinalPrice - formAmountPaid)
  const calculatedCommissionEarned = calculatedFinalPrice * (formCommissionRate / 100)

  // Filter deals
  const filteredDeals = deals.filter((d) => {
    if (currentUserRole === 'AGENT' && d.agent.id !== currentUserId) {
      return false
    }

    if (statusFilter !== 'ALL' && d.status !== statusFilter && d.dealStatus !== statusFilter) {
      return false
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const titleMatch = d.title.toLowerCase().includes(q)
      const propMatch = d.property?.title?.toLowerCase().includes(q)
      const agentMatch = d.agent?.name?.toLowerCase().includes(q)
      const buyerMatch = d.buyer?.name?.toLowerCase().includes(q)
      if (!titleMatch && !propMatch && !agentMatch && !buyerMatch) return false
    }

    return true
  })

  // Financial Aggregates
  const totalVolume = filteredDeals
    .filter((d) => d.status === 'SOLD' || d.status === 'COMPLETED' || d.status === 'PAID')
    .reduce((sum, d) => sum + (d.finalPrice || d.dealValue), 0)

  const totalCommissionEarned = filteredDeals
    .filter((d) => d.status === 'SOLD' || d.status === 'COMPLETED' || d.status === 'PAID')
    .reduce((sum, d) => sum + d.commissionEarned, 0)

  const pendingCommission = filteredDeals
    .filter((d) => d.status !== 'PAID' && (d.status === 'SOLD' || d.status === 'COMPLETED' || d.status === 'PENDING'))
    .reduce((sum, d) => sum + d.commissionEarned, 0)

  const paidCommission = filteredDeals.reduce((sum, d) => {
    const paidComms = d.commissions?.filter((c) => c.status === 'PAID') || []
    return sum + paidComms.reduce((s, c) => s + c.commissionAmount, 0)
  }, 0)

  const activePipelineCount = filteredDeals.filter(
    (d) => !['SOLD', 'COMPLETED', 'CANCELLED', 'PAID'].includes(d.status)
  ).length

  // Action handlers
  const handleDealStatusChange = async (id: string, newStatus: string) => {
    setIsSubmitting(true)
    try {
      const res = await updateDealStatus(id, newStatus)
      if (res.success) {
        toast.success(`Deal status updated to ${newStatus}!`)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update deal status')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommissionStatusChange = async (
    commId: string,
    status: 'APPROVED' | 'PAID' | 'CANCELLED'
  ) => {
    setIsSubmitting(true)
    try {
      const res = await updateCommissionStatus(commId, status)
      if (res.success) {
        toast.success(`Commission marked as ${status}!`)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update commission')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal record?')) return
    setIsSubmitting(true)
    try {
      const res = await deleteDeal(id)
      if (res.success) {
        toast.success('Deal deleted')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete deal')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateDealSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const propertyId = formData.get('propertyId') as string
      const propertyObj = properties.find((p) => p.id === propertyId)

      // Alert if already sold
      if (propertyObj?.status === 'SOLD' && currentUserRole !== 'SUPER_ADMIN') {
        toast.error('This property is already SOLD. Only Super Admin can override.')
        setIsSubmitting(false)
        return
      }

      let newBuyerPayload = undefined
      if (isCreatingNewBuyerInline) {
        newBuyerPayload = {
          name: formData.get('new_buyer_name') as string,
          phone: formData.get('new_buyer_phone') as string,
          email: (formData.get('new_buyer_email') as string) || undefined,
          address: (formData.get('new_buyer_address') as string) || undefined,
        }
      }

      const res = await createDeal({
        title: formData.get('title') as string,
        propertyId,
        buyerId: !isCreatingNewBuyerInline ? (formData.get('buyerId') as string) : undefined,
        sellerId: (formData.get('sellerId') as string) || undefined,
        newBuyer: newBuyerPayload,
        agentId: formData.get('agentId') as string,
        visitId: (formData.get('visitId') as string) || undefined,
        dealValue: Number(formData.get('dealValue')),
        discount: Number(formData.get('discount')),
        amountPaid: Number(formData.get('amountPaid')),
        commissionRate: Number(formData.get('commissionRate')),
        status: formData.get('status') as string,
        saleDate: (formData.get('saleDate') as string) || undefined,
        closingDate: (formData.get('closingDate') as string) || new Date().toISOString().split('T')[0],
        notes: (formData.get('notes') as string) || undefined,
      })

      if (res.success) {
        toast.success('Deal logged in pipeline successfully!')
        setIsLogDealModalOpen(false)
        setIsCreatingNewBuyerInline(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to create deal')
      }
    } catch {
      toast.error('Unexpected error creating deal')
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
            <Handshake className="h-6 w-6 text-emerald-600" /> Deals Pipeline & Commission Ledger
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track transactions across the full lifecycle: Interested → Negotiation → Offer → Agreement → Sold → Completed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DealsExportButton deals={deals as any} />
          <button
            onClick={() => {
              setIsCreatingNewBuyerInline(false)
              setIsLogDealModalOpen(true)
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Log New Deal
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Closed Volume', val: formatPrice(totalVolume), icon: Coins, bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Commissions Earned', val: formatPrice(totalCommissionEarned), icon: DollarSign, bg: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Pending Commissions', val: formatPrice(pendingCommission), icon: ClipboardCheck, bg: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Active Pipeline Deals', val: activePipelineCount, icon: AlertCircle, bg: 'bg-purple-50 border-purple-200 text-purple-700' },
        ].map((s, i) => (
          <div key={i} className={cn('border rounded-2xl p-5 flex items-center justify-between shadow-xs', s.bg)}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-85">{s.label}</p>
              <p className="text-2xl font-black">{s.val}</p>
            </div>
            <div className="p-3 bg-white/60 rounded-xl shadow-xs">
              <s.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Section View Tabs (Deals Pipeline vs Commission Ledger) */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('DEALS')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'DEALS' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Deals Pipeline ({filteredDeals.length})
          </button>
          <button
            onClick={() => setActiveTab('COMMISSIONS')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'COMMISSIONS' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Commission Ledger
          </button>
        </div>

        {/* Pipeline Stage Filter & Search */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-75">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, clients, properties..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl text-xs px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Stages</option>
            <option value="INTERESTED">Interested</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="OFFER_SUBMITTED">Offer Submitted</option>
            <option value="AGREEMENT">Agreement</option>
            <option value="SOLD">Sold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Listing View */}
      {activeTab === 'DEALS' ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Deal Transactions</h3>
            <span className="text-xs text-gray-400">Automatic Property Sold & Commission Synchronization</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs font-semibold">
                  <th className="px-5 py-3.5 text-left">Deal & Property</th>
                  <th className="px-4 py-3.5 text-left">Client (Buyer)</th>
                  <th className="px-4 py-3.5 text-left hidden md:table-cell">Agent</th>
                  <th className="px-4 py-3.5 text-left">Financial Breakdown</th>
                  <th className="px-4 py-3.5 text-left">Pipeline Stage</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      <Handshake className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                      <p className="font-medium text-gray-500">No deals found matching your criteria</p>
                      <p className="text-xs mt-1">Log a transaction to start tracking in the pipeline</p>
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((d) => {
                    const finalVal = d.finalPrice || d.dealValue
                    return (
                      <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Title & Property */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <button
                              onClick={() => setSelectedDealDetails(d)}
                              className="font-bold text-gray-900 hover:text-emerald-600 text-left transition-colors text-sm"
                            >
                              {d.title}
                            </button>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {d.property?.title || '—'}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              <Calendar className="h-3 w-3" /> Closing: {formatDate(d.closingDate)}
                            </div>
                          </div>
                        </td>

                        {/* Buyer */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-800 text-xs">{d.buyer?.name || 'External / Walk-in'}</p>
                            {d.buyer?.phone && <p className="text-[11px] text-gray-400">{d.buyer.phone}</p>}
                          </div>
                        </td>

                        {/* Agent */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px]">
                              {d.agent?.name?.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-gray-700">{d.agent?.name}</span>
                          </div>
                        </td>

                        {/* Financials */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 text-xs">{formatPrice(finalVal)}</p>
                            {d.discount && d.discount > 0 ? (
                              <p className="text-[10px] text-gray-400">
                                Disc: -{formatPrice(d.discount)} (Orig: {formatPrice(d.dealValue)})
                              </p>
                            ) : null}
                            <p className="text-[11px] text-emerald-700 font-bold">
                              Comm: {formatPrice(d.commissionEarned)} ({d.commissionRate}%)
                            </p>
                          </div>
                        </td>

                        {/* Pipeline Stage */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <span
                              className={cn(
                                'text-xs font-bold px-2.5 py-1 rounded-full inline-block',
                                (d.status === 'SOLD' || d.status === 'COMPLETED' || d.status === 'PAID') && 'bg-emerald-100 text-emerald-800',
                                (d.status === 'AGREEMENT' || d.status === 'OFFER_SUBMITTED') && 'bg-blue-100 text-blue-800',
                                d.status === 'NEGOTIATION' && 'bg-purple-100 text-purple-800',
                                d.status === 'INTERESTED' && 'bg-yellow-100 text-yellow-800',
                                d.status === 'CANCELLED' && 'bg-red-100 text-red-800'
                              )}
                            >
                              {d.status.replace('_', ' ')}
                            </span>

                            {d.property?.status === 'SOLD' && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-sm block w-fit">
                                🏷️ Property Marked SOLD
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-xs">
                            {/* Stage progression shortcuts */}
                            {d.status === 'INTERESTED' && (
                              <button
                                onClick={() => handleDealStatusChange(d.id, 'NEGOTIATION')}
                                disabled={isSubmitting}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl"
                              >
                                Negotiation &rarr;
                              </button>
                            )}

                            {d.status === 'NEGOTIATION' && (
                              <button
                                onClick={() => handleDealStatusChange(d.id, 'AGREEMENT')}
                                disabled={isSubmitting}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl"
                              >
                                Agreement &rarr;
                              </button>
                            )}

                            {d.status === 'AGREEMENT' && (
                              <button
                                onClick={() => handleDealStatusChange(d.id, 'SOLD')}
                                disabled={isSubmitting}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                              >
                                Mark SOLD 🎉
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedDealDetails(d)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                              title="View Details"
                            >
                              <FileText className="h-4 w-4" />
                            </button>

                            {isSuperAdminOrAdmin && (
                              <button
                                onClick={() => handleDeleteDeal(d.id)}
                                disabled={isSubmitting}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete Deal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Commission Ledger View */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Agent Commission Ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Automated commission disbursements on closed deals</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Disbursed: {formatPrice(paidCommission)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs font-semibold">
                  <th className="px-5 py-3.5 text-left">Agent & Deal</th>
                  <th className="px-4 py-3.5 text-left">Sale Price</th>
                  <th className="px-4 py-3.5 text-left">Rate (%)</th>
                  <th className="px-4 py-3.5 text-left">Commission Amount</th>
                  <th className="px-4 py-3.5 text-left">Disbursement Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDeals.flatMap((deal) => {
                  const comms = deal.commissions || []
                  if (comms.length === 0) {
                    return [
                      {
                        id: `deal-auto-${deal.id}`,
                        agentName: deal.agent.name,
                        dealTitle: deal.title,
                        saleValue: deal.finalPrice || deal.dealValue,
                        commissionRate: deal.commissionRate,
                        commissionAmount: deal.commissionEarned,
                        status: deal.status === 'PAID' ? 'PAID' : 'PENDING',
                        isVirtual: true,
                        dealId: deal.id,
                      },
                    ]
                  }
                  return comms.map((c) => ({
                    id: c.id,
                    agentName: deal.agent.name,
                    dealTitle: deal.title,
                    saleValue: deal.finalPrice || deal.dealValue,
                    commissionRate: deal.commissionRate,
                    commissionAmount: c.commissionAmount,
                    status: c.status,
                    isVirtual: false,
                    dealId: deal.id,
                  }))
                }).map((comm, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900 text-sm">{comm.agentName}</p>
                      <p className="text-xs text-gray-500">{comm.dealTitle}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-800">
                      {formatPrice(comm.saleValue)}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-600">
                      {comm.commissionRate}%
                    </td>
                    <td className="px-4 py-4 font-bold text-emerald-700">
                      {formatPrice(comm.commissionAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded-full',
                          comm.status === 'PAID' && 'bg-emerald-100 text-emerald-800',
                          comm.status === 'APPROVED' && 'bg-blue-100 text-blue-800',
                          comm.status === 'PENDING' && 'bg-yellow-100 text-yellow-800',
                          comm.status === 'CANCELLED' && 'bg-red-100 text-red-800'
                        )}
                      >
                        {comm.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isSuperAdminOrAdmin && comm.status !== 'PAID' && !comm.isVirtual && (
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          {comm.status === 'PENDING' && (
                            <button
                              onClick={() => handleCommissionStatusChange(comm.id, 'APPROVED')}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleCommissionStatusChange(comm.id, 'PAID')}
                            disabled={isSubmitting}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                          >
                            Mark Paid
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deal Details Modal */}
      {selectedDealDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                  Deal #{selectedDealDetails.id.slice(0, 8)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedDealDetails.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDealDetails(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400">Target Property:</span>
                  <p className="font-bold text-gray-800">{selectedDealDetails.property.title}</p>
                </div>
                <div>
                  <span className="text-gray-400">Agent:</span>
                  <p className="font-bold text-gray-800">{selectedDealDetails.agent.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Buyer Client:</span>
                  <p className="font-bold text-gray-800">{selectedDealDetails.buyer?.name || 'Outside Buyer'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Closing Date:</span>
                  <p className="font-bold text-gray-800">{formatDate(selectedDealDetails.closingDate)}</p>
                </div>
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Property Sale Price:</span>
                  <span className="font-bold">{formatPrice(selectedDealDetails.dealValue)}</span>
                </div>
                {selectedDealDetails.discount ? (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(selectedDealDetails.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-gray-100 pt-1 font-black text-gray-900">
                  <span>Final Sale Price:</span>
                  <span className="text-emerald-700">{formatPrice(selectedDealDetails.finalPrice || selectedDealDetails.dealValue)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1">
                  <span>Commission ({selectedDealDetails.commissionRate}%):</span>
                  <span>{formatPrice(selectedDealDetails.commissionEarned)}</span>
                </div>
              </div>

              {selectedDealDetails.notes && (
                <div>
                  <span className="text-gray-400">Notes:</span>
                  <p className="mt-0.5 text-gray-700">{selectedDealDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDealDetails(null)}
                className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Deal Modal */}
      {isLogDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-emerald-600" /> Log Closed Transaction / Deal
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record property sales, calculate commission percentages, and update property availability.
                </p>
              </div>
              <button
                onClick={() => setIsLogDealModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDealSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Deal Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Lazimpat 3BHK Apartment Sale - Bikash"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Property Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Target Property *</label>
                <select
                  name="propertyId"
                  required
                  defaultValue={initialPropertyId || ''}
                  onChange={(e) => {
                    const selected = properties.find((p) => p.id === e.target.value)
                    if (selected) {
                      setFormPropertyPrice(selected.price)
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="" disabled selected>
                    Select Property...
                  </option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatPrice(p.price)}) {p.status === 'SOLD' ? '— [ALREADY SOLD]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer Selection with Inline Create */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">Buyer Client</label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewBuyerInline(!isCreatingNewBuyerInline)}
                    className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    {isCreatingNewBuyerInline ? '← Select Registered' : '+ New Buyer'}
                  </button>
                </div>

                {!isCreatingNewBuyerInline ? (
                  <select
                    name="buyerId"
                    defaultValue={initialBuyerId || 'none'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="none">Outside / Unregistered Buyer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="new_buyer_name"
                      required
                      placeholder="Buyer Name *"
                      className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white"
                    />
                    <input
                      type="tel"
                      name="new_buyer_phone"
                      placeholder="Buyer Phone"
                      className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Agent & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Assigned Agent *</label>
                  <select
                    name="agentId"
                    defaultValue={currentUserId}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Pipeline Stage *</label>
                  <select
                    name="status"
                    defaultValue="SOLD"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="INTERESTED">Interested</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="OFFER_SUBMITTED">Offer Submitted</option>
                    <option value="AGREEMENT">Agreement Signed</option>
                    <option value="SOLD">Sold (Auto Updates Property)</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* Financial Calculation Fields */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Sale Price (NPR)</label>
                    <input
                      type="number"
                      name="dealValue"
                      required
                      value={formPropertyPrice}
                      onChange={(e) => setFormPropertyPrice(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Discount (NPR)</label>
                    <input
                      type="number"
                      name="discount"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Comm. Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="commissionRate"
                      required
                      value={formCommissionRate}
                      onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Auto Calculated Summary */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-emerald-200/60 font-bold">
                  <span className="text-gray-700">
                    Final Price: <strong className="text-emerald-800">{formatPrice(calculatedFinalPrice)}</strong>
                  </span>
                  <span className="text-emerald-700">
                    Auto Commission: <strong>{formatPrice(calculatedCommissionEarned)}</strong>
                  </span>
                </div>
              </div>

              {/* Closing Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Closing Date *</label>
                  <input
                    type="date"
                    name="closingDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Payment Amount Received</label>
                  <input
                    type="number"
                    name="amountPaid"
                    defaultValue={0}
                    onChange={(e) => setFormAmountPaid(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Transaction Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Payment receipt number, wire details, seller agreements..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLogDealModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isSubmitting ? 'Recording Deal...' : 'Record Deal & Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
