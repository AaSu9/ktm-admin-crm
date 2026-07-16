import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { createDeal, updateDealStatus, deleteDeal } from '@/app/actions/deals'
import Link from 'next/link'
import { DollarSign, Plus, Coins, ClipboardCheck, AlertCircle, Calendar, Trash2, Tag, Handshake } from 'lucide-react'
import { DealsExportButton } from '@/components/dashboard/DataExportButtons'
import DeleteForm from '@/components/DeleteForm'

export default async function DealsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let deals: any[] = []
  let properties: any[] = []
  let customers: any[] = []
  let agents: any[] = []
  let dbError = false

  try {
    deals = await prisma.deal.findMany({
      orderBy: { closingDate: 'desc' },
      include: { property: true, agent: true, buyer: true, seller: true }
    })

    properties = await prisma.property.findMany({
      where: { status: { in: ['AVAILABLE', 'PENDING'] } },
      orderBy: { title: 'asc' }
    })

    customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    })

    agents = await prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error("DB Query failed in Deals Page, showing mock fallback:", error)
    dbError = true
  }

  // Fallback Mock Data for demo mode
  if (dbError || deals.length === 0) {
    deals = [
      {
        id: 'mock-deal-1',
        title: 'Lazimpat 3BHK Sale - Bikash',
        dealValue: 15000000,
        commissionRate: 3.5,
        commissionEarned: 525000,
        status: 'PAID',
        closingDate: new Date('2026-06-25'),
        notes: 'Smooth closing, payment cleared via wire transfer.',
        property: { title: 'Luxury 3BHK Apartment in Lazimpat' },
        agent: { name: 'Raj Kumar Sharma' },
        buyer: { name: 'Bikash Shrestha' },
        seller: { name: 'Sunita Maharjan' }
      },
      {
        id: 'mock-deal-2',
        title: 'Budhanilkantha Villa Lease - Ramesh',
        dealValue: 45000000,
        commissionRate: 2.0,
        commissionEarned: 900000,
        status: 'PENDING',
        closingDate: new Date('2026-07-28'),
        notes: 'Lease agreement signed, first installment pending.',
        property: { title: 'Modern Villa in Budhanilkantha' },
        agent: { name: 'Raj Kumar Sharma' },
        buyer: { name: 'Ramesh Adhikari' },
        seller: { name: 'Sunita Maharjan' }
      }
    ]

    properties = [
      { id: 'mock-prop-1', title: 'Luxury 3BHK Apartment in Lazimpat', price: 15000000 },
      { id: 'mock-prop-2', title: 'Modern Villa in Budhanilkantha', price: 45000000 }
    ]

    customers = [
      { id: 'mock-cust-1', name: 'Bikash Shrestha' },
      { id: 'mock-cust-2', name: 'Sunita Maharjan' },
      { id: 'mock-cust-3', name: 'Ramesh Adhikari' }
    ]

    agents = [
      { id: 'mock-agent-1', name: 'Raj Kumar Sharma' },
      { id: 'mock-agent-2', name: 'Priya Thapa' }
    ]
  }

  // Calculate stats
  const totalVolume = deals
    .filter((d) => d.status === 'PAID')
    .reduce((sum, d) => sum + d.dealValue, 0)

  const commissionEarned = deals
    .filter((d) => d.status === 'PAID')
    .reduce((sum, d) => sum + d.commissionEarned, 0)

  const pendingCommission = deals
    .filter((d) => d.status === 'PENDING')
    .reduce((sum, d) => sum + d.commissionEarned, 0)

  const activeDealsCount = deals.filter((d) => d.status === 'PENDING').length

  // Server actions wrappers
  async function handleCreateDealAction(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const propertyId = formData.get('propertyId') as string
    const buyerId = formData.get('buyerId') as string
    const sellerId = formData.get('sellerId') as string
    const agentId = formData.get('agentId') as string
    const dealValueStr = formData.get('dealValue') as string
    const commissionRateStr = formData.get('commissionRate') as string
    const status = formData.get('status') as string
    const closingDate = formData.get('closingDate') as string
    const notes = formData.get('notes') as string

    await createDeal({
      title,
      propertyId,
      buyerId: buyerId === 'none' ? undefined : buyerId,
      sellerId: sellerId === 'none' ? undefined : sellerId,
      agentId,
      dealValue: Number(dealValueStr),
      commissionRate: Number(commissionRateStr),
      status,
      closingDate,
      notes
    })
  }

  async function handleStatusChange(id: string, status: string) {
    'use server'
    await updateDealStatus(id, status)
  }

  async function handleDeleteDeal(id: string) {
    'use server'
    await deleteDeal(id)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Handshake className="h-6 w-6 text-emerald-600" /> Deals & Commission Ledger
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track closed transactions, agency commission percentages, and payments.</p>
        </div>
        <div className="flex gap-2">
          {dbError && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl mr-2">
              Sandbox Mode
            </span>
          )}
          <DealsExportButton deals={deals} />
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Transaction Volume', val: formatPrice(totalVolume), icon: Coins, bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Commissions Received', val: formatPrice(commissionEarned), icon: DollarSign, bg: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Pending Commissions', val: formatPrice(pendingCommission), icon: ClipboardCheck, bg: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Active Deals (Pending)', val: activeDealsCount, icon: AlertCircle, bg: 'bg-purple-50 border-purple-200 text-purple-700' },
        ].map((s, i) => (
          <div key={i} className={cn('border rounded-2xl p-5 flex items-center justify-between shadow-sm', s.bg)}>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-85">{s.label}</p>
              <p className="text-2xl font-black">{s.val}</p>
            </div>
            <div className="p-3 bg-white/50 rounded-xl">
              <s.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Log Deal Form and Transactions Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Log new deal */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 text-md">Log Closed Transaction</h3>

          <form action={handleCreateDealAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Deal Title</label>
              <input type="text" name="title" required placeholder="e.g. Lazimpat 3BHK Sale - Bikash"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Target Property</label>
              <select name="propertyId" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="" disabled selected>Select Property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({formatPrice(p.price)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Buyer (Client)</label>
              <select name="buyerId" defaultValue="none"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="none">None / Outside Buyer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Seller (Client)</label>
              <select name="sellerId" defaultValue="none"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="none">None / Outside Seller</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Responsible Agent</label>
              <select name="agentId" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="" disabled selected>Select Agent...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Deal Value (NPR)</label>
                <input type="number" name="dealValue" required placeholder="15000000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Comm. Rate (%)</label>
                <input type="number" step="0.1" name="commissionRate" required placeholder="3.0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Deal Status</label>
                <select name="status" defaultValue="PENDING"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Closing Date</label>
                <input type="date" name="closingDate" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Transaction Notes</label>
              <textarea name="notes" placeholder="e.g. Check details, payout structure..." rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" />
            </div>

            <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
              Log Deal & Commission
            </button>
          </form>
        </div>

        {/* Right Ledger Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-md">Transaction Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Deal Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Property</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Agent</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Value & Commission</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      No transaction records.
                    </td>
                  </tr>
                ) : (
                  deals.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800 text-sm truncate max-w-[130px]">{d.title}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                          <Calendar className="h-3 w-3" /> {formatDate(d.closingDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell max-w-[120px] truncate">{d.property?.title || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{d.agent?.name}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800 text-xs">{formatPrice(d.dealValue)}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">Comm: {formatPrice(d.commissionEarned)} ({d.commissionRate}%)</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                          d.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : d.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-red-50 text-red-700 border border-red-100'
                        )}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          {d.status === 'PENDING' && (
                            <form action={handleStatusChange.bind(null, d.id, 'PAID')}>
                              <button type="submit" className="text-emerald-600 hover:underline font-semibold">Mark Paid</button>
                            </form>
                          )}
                          <DeleteForm action={handleDeleteDeal.bind(null, d.id)} confirmMessage="Delete transaction record?" className="inline">
                            <button type="submit" className="text-red-500 hover:text-red-700 hover:underline">
                              Delete
                            </button>
                          </DeleteForm>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
