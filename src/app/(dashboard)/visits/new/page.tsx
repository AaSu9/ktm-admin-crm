import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { scheduleVisit } from '@/app/actions/visits'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewVisitPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let customers: any[] = []
  let properties: any[] = []
  let agents: any[] = []
  let dbError = false

  try {
    customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
    properties = await prisma.property.findMany({ where: { status: 'AVAILABLE' }, orderBy: { title: 'asc' } })
    agents = await prisma.user.findMany({ where: { role: 'AGENT', isActive: true }, orderBy: { name: 'asc' } })
  } catch (error) {
    console.error("DB Query failed in New Visit Page, using fallback data:", error)
    dbError = true
  }

  if (dbError) {
    customers = [{ id: 'mock-cust-1', name: 'Bikash Shrestha' }]
    properties = [{ id: 'mock-prop-1', title: 'Luxury 3BHK Apartment in Lazimpat' }]
    agents = [{ id: 'mock-agent-1', name: 'Raj Kumar Sharma' }]
  }

  async function handleScheduleAction(formData: FormData) {
    'use server'
    const customerId = formData.get('customerId') as string
    const propertyId = formData.get('propertyId') as string
    const agentId = formData.get('agentId') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const notes = formData.get('notes') as string

    await scheduleVisit({
      customerId,
      propertyId,
      agentId: agentId === 'unassigned' ? undefined : agentId,
      date,
      time,
      notes
    })

    redirect('/visits')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/visits" className="p-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Site Visit</h1>
          <p className="text-gray-500 text-sm">Schedule a properties visit walkthrough for a customer.</p>
        </div>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Sandbox Mode:</strong> Database is offline.
        </div>
      )}

      {/* Card Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form action={handleScheduleAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Customer</label>
              <select name="customerId" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="" disabled selected>Choose Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* Property Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Property</label>
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Visit</label>
              <input type="date" name="date" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Time Pick */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Time of Visit</label>
              <input type="text" name="time" required placeholder="e.g. 10:30 AM"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Assigned Agent */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Agent (Host)</label>
              <select name="agentId" defaultValue="unassigned"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="unassigned">Unassigned / Auto Assign</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instructions & Follow-up Notes</label>
              <textarea name="notes" placeholder="Specific notes: direction details, keys required, client questions..." rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Link href="/visits" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
              Schedule Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
