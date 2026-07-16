import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createLead } from '@/app/actions/leads'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export default async function NewLeadPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let agents: any[] = []
  let properties: any[] = []
  let dbError = false

  try {
    agents = await prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
      orderBy: { name: 'asc' },
    })

    properties = await prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { title: 'asc' },
    })
  } catch (error) {
    console.error("DB Query failed in New Lead Page, using fallbacks:", error)
    dbError = true
  }

  if (dbError) {
    agents = [{ id: 'mock-agent-1', name: 'Raj Kumar Sharma' }, { id: 'mock-agent-2', name: 'Priya Thapa' }]
    properties = [{ id: 'mock-prop-1', title: 'Luxury 3BHK Apartment in Lazimpat' }]
  }

  async function handleCreateAction(formData: FormData) {
    'use server'
    const full_name = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const source = formData.get('source') as string
    const priority = formData.get('priority') as any
    const budgetStr = formData.get('budget') as string
    const inquiry_type = formData.get('inquiry_type') as string
    const property_interest = formData.get('property_interest') as string
    const agentId = formData.get('agentId') as string
    const property_id = formData.get('propertyId') as string

    const result = await createLead({
      full_name,
      phone,
      email,
      source,
      priority,
      budget: budgetStr ? Number(budgetStr) : undefined,
      property_id: property_id === 'none' ? undefined : property_id,
      agentId: agentId === 'unassigned' ? undefined : agentId,
    })

    // Update inquiry details directly if database is connected
    if (result.success && result.lead && !dbError) {
      await prisma.lead.update({
        where: { id: result.lead.id },
        data: {
          inquiry_type,
          property_interest
        }
      })
    }

    redirect('/leads')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads" className="p-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-gray-500 text-sm">Register a new prospective buyer or tenant inquiry.</p>
        </div>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Sandbox Mode:</strong> Running with local fallback data.
        </div>
      )}

      {/* Card Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form action={handleCreateAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
              <input type="text" name="full_name" required placeholder="e.g. Anup Gurung"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone number</label>
              <input type="text" name="phone" required placeholder="e.g. +977-9811234567"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
              <input type="email" name="email" required placeholder="e.g. anup@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Inquiry Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Preference</label>
              <select name="inquiry_type" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="sale">Buy Property (Sale)</option>
                <option value="rent">Rent Property (Lease)</option>
              </select>
            </div>

            {/* Property Interest */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Type Interest</label>
              <select name="property_interest" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="land">Land Plot</option>
                <option value="commercial">Commercial Space</option>
              </select>
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Budget (NPR)</label>
              <input type="number" name="budget" placeholder="e.g. 20000000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Priority</label>
              <select name="priority" defaultValue="MEDIUM"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acquisition Source</label>
              <select name="source" defaultValue="website"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="website">Website Form</option>
                <option value="referral">Referral / Agent</option>
                <option value="social">Social Media</option>
                <option value="walk-in">Walk-in Inquiry</option>
              </select>
            </div>

            {/* Assign Agent */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign Agent</label>
              <select name="agentId" defaultValue="unassigned"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Linked Property */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Linked Target Property</label>
              <select name="propertyId" defaultValue="none"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="none">None / General interest</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({formatPrice(p.price)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Link href="/leads" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
