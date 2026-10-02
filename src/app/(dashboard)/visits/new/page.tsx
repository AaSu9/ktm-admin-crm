import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { scheduleVisit } from '@/app/actions/visits'
import Link from 'next/link'
import { ArrowLeft, CalendarCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewVisitPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as { id?: string; name?: string; role?: string }
  const currentUserId = user.id || ''
  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user.role || 'AGENT')

  let customers: any[] = []
  let properties: any[] = []
  let agents: any[] = []

  try {
    const [customersData, propertiesData, agentsData] = await Promise.all([
      prisma.customer.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, phone: true } }),
      prisma.property.findMany({ where: { status: 'AVAILABLE' }, orderBy: { title: 'asc' }, select: { id: true, title: true, location: true } }),
      prisma.user.findMany({ where: { isActive: true, role: { in: ['AGENT', 'ADMIN', 'SUPER_ADMIN'] } }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ])
    customers = customersData
    properties = propertiesData
    agents = agentsData
  } catch (error) {
    console.error('Error fetching new visit page data:', error)
  }

  async function handleScheduleAction(formData: FormData) {
    'use server'
    const customerId = formData.get('customerId') as string
    const newCustName = formData.get('cust_name') as string
    const newCustPhone = formData.get('cust_phone') as string
    const newCustEmail = formData.get('cust_email') as string
    const newCustAddress = formData.get('cust_address') as string

    const propertyId = formData.get('propertyId') as string
    const agentId = formData.get('agentId') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const endTime = formData.get('endTime') as string
    const visitType = formData.get('visitType') as string
    const location = formData.get('location') as string
    const purpose = formData.get('purpose') as string
    const notes = formData.get('notes') as string

    await scheduleVisit({
      customerId: customerId && customerId !== 'new' ? customerId : undefined,
      newCustomer: newCustName ? {
        name: newCustName,
        phone: newCustPhone || '',
        email: newCustEmail || undefined,
        address: newCustAddress || undefined,
        source: 'DIRECT_VISIT',
      } : undefined,
      propertyId,
      agentId: agentId === 'unassigned' ? undefined : agentId,
      date,
      time,
      endTime: endTime || undefined,
      visitType: visitType || 'Site Walkthrough',
      location: location || undefined,
      purpose: purpose || undefined,
      notes: notes || undefined,
    })

    redirect('/visits')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/visits" className="p-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all shadow-xs">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-emerald-600" /> Schedule Property Walkthrough
          </h1>
          <p className="text-gray-500 text-sm">Create a customer site visit appointment with automatic calendar sync.</p>
        </div>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100">
        <form action={handleScheduleAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Dropdown */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Select Customer</label>
              <select name="customerId"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="">Or create new customer below...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* If New Customer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">New Customer Name (if not registered)</label>
              <input type="text" name="cust_name" placeholder="Full Name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">New Customer Phone</label>
              <input type="tel" name="cust_phone" placeholder="+977-98..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Property Dropdown */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Property *</label>
              <select name="propertyId" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="" disabled selected>Choose Property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.location})</option>
                ))}
              </select>
            </div>

            {/* Date Pick */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date of Visit *</label>
              <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Time Pick */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Time *</label>
              <input type="text" name="time" required placeholder="10:00 AM" defaultValue="10:00 AM"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">End Time</label>
              <input type="text" name="endTime" placeholder="11:00 AM" defaultValue="11:00 AM"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Visit Type</label>
              <select name="visitType" defaultValue="Site Walkthrough"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="Site Walkthrough">Site Walkthrough</option>
                <option value="Virtual Tour">Virtual Tour</option>
                <option value="Structural Inspection">Structural Inspection</option>
                <option value="Final Review">Final Review & Sign-off</option>
              </select>
            </div>

            {/* Assigned Agent */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Agent (Host)</label>
              <select name="agentId" defaultValue={currentUserId}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                {isSuperAdminOrAdmin && <option value="unassigned">Unassigned / Auto Assign</option>}
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Instructions & Follow-up Notes</label>
              <textarea name="notes" placeholder="Specific notes: direction details, keys required, client questions..." rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Link href="/visits" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all">
              Schedule Visit & Sync Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
