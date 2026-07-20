import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { formatDate, formatPrice, getStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, User, Shield, Tag, Calendar, Sparkles, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { addLeadNote, updateLead, deleteLead } from '@/app/actions/leads'
import { scheduleVisit } from '@/app/actions/visits'
import DeleteForm from '@/components/DeleteForm'

export default async function LeadDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const leadId = params.id
  let lead: any = null
  let agents: any[] = []
  let properties: any[] = []
  let matchedProperties: any[] = []
  let customers: any[] = []
  let dbError = false

  try {
    lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { property: true, agent: true, customer: true },
    })

    if (!lead && leadId !== 'demo-id') {
      return notFound()
    }

    agents = await prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
      orderBy: { name: 'asc' },
    })

    properties = await prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { created_at: 'desc' },
    })

    customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    })

    // Automatic Matching Logic
    if (lead) {
      matchedProperties = await prisma.property.findMany({
        where: {
          status: 'AVAILABLE',
          AND: [
            lead.budget ? { price: { lte: lead.budget } } : {},
            lead.inquiry_type ? { category: { equals: lead.inquiry_type, mode: 'insensitive' } } : {},
            lead.property_interest ? { property_type: { equals: lead.property_interest, mode: 'insensitive' } } : {},
          ],
        },
        take: 5,
      })
    }
  } catch (error) {
    console.error("DB Query failed in Lead Detail, using mock fallback:", error)
    dbError = true
  }

  // Fallback Mock Data for Demo mode
  if (dbError || leadId === 'demo-id') {
    lead = lead || {
      id: 'demo-id',
      full_name: 'Anup Gurung (Demo)',
      email: 'anup@email.com',
      phone: '+977-9811234567',
      source: 'website',
      priority: 'HIGH',
      status: 'NEW',
      budget: 20000000,
      notes: [
        '[7/12/2026, 3:00:00 PM] Initial inquiry received for Lazimpat Apartment.',
        '[7/12/2026, 4:15:00 PM] Attempted phone call, no answer. Sent follow-up email.'
      ],
      inquiry_type: 'sale',
      property_interest: 'apartment',
      created_at: new Date(),
      updated_at: new Date(),
      property: {
        id: 'mock-prop-id',
        title: 'Luxury 3BHK Apartment in Lazimpat',
        location: 'Lazimpat, Kathmandu',
        price: 15000000,
        category: 'sale',
        property_type: 'apartment',
      },
      agent: {
        id: 'mock-agent-id',
        name: 'Raj Kumar Sharma',
      },
    }

    matchedProperties = [
      {
        id: 'mock-match-1',
        title: 'Luxury 3BHK Apartment in Lazimpat',
        location: 'Lazimpat, Kathmandu',
        price: 15000000,
        category: 'sale',
        property_type: 'apartment',
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
      },
      {
        id: 'mock-match-2',
        title: 'Modern Apartment in Jhamsikhel',
        location: 'Jhamsikhel, Lalitpur',
        price: 18000000,
        category: 'sale',
        property_type: 'apartment',
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
      }
    ]

    agents = [{ id: 'mock-agent-1', name: 'Raj Kumar Sharma' }, { id: 'mock-agent-2', name: 'Priya Thapa' }]
  }

  // Server actions wrapper
  async function handleAddNoteAction(formData: FormData) {
    'use server'
    const noteContent = formData.get('note') as string
    if (!noteContent) return
    await addLeadNote(lead.id, noteContent)
  }

  async function handleUpdateLeadAction(formData: FormData) {
    'use server'
    const status = formData.get('status') as string
    const priority = formData.get('priority') as any
    const budgetStr = formData.get('budget') as string
    const agentId = formData.get('agentId') as string
    const propertyId = formData.get('propertyId') as string

    const data: any = {}
    if (status) data.status = status
    if (priority) data.priority = priority
    if (budgetStr) data.budget = Number(budgetStr)
    if (agentId) data.agentId = agentId === 'unassigned' ? null : agentId
    if (propertyId) data.property_id = propertyId === 'none' ? null : propertyId

    await updateLead(lead.id, data)
  }

  async function handleDeleteAction() {
    'use server'
    await deleteLead(lead.id)
    redirect('/leads')
  }

  async function handleScheduleVisitAction(formData: FormData) {
    'use server'
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const notes = formData.get('notes') as string
    const propertyId = formData.get('propertyId') as string
    const agentId = formData.get('agentId') as string

    let customerId = lead.customerId
    if (!customerId && !dbError) {
      // Find or create customer
      const existing = await prisma.customer.findFirst({
        where: { phone: lead.phone }
      })
      if (existing) {
        customerId = existing.id
      } else {
        const c = await prisma.customer.create({
          data: {
            name: lead.full_name,
            phone: lead.phone,
            email: lead.email,
            notes: `Created from Lead ID: ${lead.id}`,
            type: 'BUYER'
          }
        })
        customerId = c.id
      }
      
      // update lead link
      await prisma.lead.update({
        where: { id: lead.id },
        data: { customerId }
      })
    }

    if (customerId) {
      await scheduleVisit({
        customerId,
        propertyId,
        agentId: agentId || lead.agentId,
        date,
        time,
        notes
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Link>
        <div className="flex gap-2">
          {dbError && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              ⚠️ Sandbox Mode
            </span>
          )}
          <DeleteForm action={handleDeleteAction} confirmMessage="Delete this lead permanently?" className="inline">
            <button type="submit" className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" title="Delete Lead">
              <Trash2 className="h-5 w-5" />
            </button>
          </DeleteForm>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Profile & Edit Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Profile Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40" />
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {lead.full_name.charAt(0)}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{lead.full_name}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider', getStatusColor(lead.status))}>
                    {lead.status.replace(/_/g, ' ')}
                  </span>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium',
                    lead.priority === 'HIGH' ? 'bg-red-100 text-red-700' : lead.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {lead.priority} Priority
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 text-sm">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Phone className="h-4.5 w-4.5 text-gray-400" />
                <a href={`tel:${lead.phone}`} className="hover:underline font-medium text-gray-800">{lead.phone}</a>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Mail className="h-4.5 w-4.5 text-gray-400" />
                <a href={`mailto:${lead.email}`} className="hover:underline font-medium text-gray-800 truncate">{lead.email}</a>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Tag className="h-4.5 w-4.5 text-gray-400" />
                <span>Source: <strong className="text-gray-800 capitalize">{lead.source}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <User className="h-4.5 w-4.5 text-gray-400" />
                <span>Assigned Agent: <strong className="text-gray-800">{lead.agent?.name || 'Unassigned'}</strong></span>
              </div>
            </div>
          </div>

          {/* Card: Follow-up logs & notes */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" /> Site Visits & Follow-up History
            </h3>
            
            {/* Timeline */}
            <div className="space-y-4 pt-2">
              {lead.notes?.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No follow-up notes logged yet.</p>
              ) : (
                <div className="relative border-l-2 border-emerald-100 pl-4 ml-2 space-y-4">
                  {lead.notes.map((note: string, idx: number) => {
                    const match = note.match(/^\[(.*?)\] (.*)$/)
                    const time = match ? match[1] : 'Log'
                    const text = match ? match[2] : note
                    return (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-4 ring-emerald-50" />
                        <p className="text-xs text-gray-400 font-semibold">{time}</p>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{text}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Note input */}
            <form action={handleAddNoteAction} className="pt-4 border-t border-gray-100 flex gap-2">
              <input name="note" required placeholder="Type a follow-up or call outcome note..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50" />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                Add Log
              </button>
            </form>
          </div>

          {/* Card: Automatic Matchmaker */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> KTM RealEstate Smart Matcher
              </h3>
              <span className="text-xs text-emerald-600 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full">
                {lead.inquiry_type ? `${lead.inquiry_type} matching` : 'Smart matching'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Based on budget limit ({lead.budget ? formatPrice(lead.budget) : 'none'}), category preference ({lead.inquiry_type || 'any'}), and type ({lead.property_interest || 'any'}), the system has automatically matching the properties below:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {matchedProperties.length === 0 ? (
                <div className="col-span-full border border-dashed border-gray-200 rounded-2xl py-8 text-center text-gray-400 text-sm">
                  No properties currently match this lead&apos;s criteria.
                </div>
              ) : (
                matchedProperties.map((p: any) => (
                  <div key={p.id} className="border border-gray-100 rounded-2xl p-4 flex gap-3 hover:border-emerald-100 hover:shadow-sm transition-all group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100'} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-emerald-600">{p.title}</h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{p.location}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-900 text-xs">{formatPrice(p.price)}</span>
                        <Link href={`/properties/${p.id}`} className="text-xs text-emerald-600 hover:underline font-medium">
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Manage Details & Schedule visits */}
        <div className="space-y-6">
          {/* Card: Match Settings / Edit form */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-md">Lead Status & Info</h3>
            
            <form action={handleUpdateLeadAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Pipeline Status</label>
                <select name="status" defaultValue={lead.status}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="VISIT_SCHEDULED">Visit Scheduled</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="CLOSED_WON">Closed Won</option>
                  <option value="CLOSED_LOST">Closed Lost</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Priority Level</label>
                <select name="priority" defaultValue={lead.priority}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Max Budget (NPR)</label>
                <input type="number" name="budget" defaultValue={lead.budget || ''} placeholder="Set budget..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Assign Agent</label>
                <select name="agentId" defaultValue={lead.agentId || 'unassigned'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="unassigned">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Linked Property</label>
                <select name="propertyId" defaultValue={lead.property_id || 'none'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="none">None</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} ({formatPrice(p.price)})</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
                Save Changes
              </button>
            </form>
          </div>

          {/* Card: Quick Visit Scheduler */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-md flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" /> Schedule Site Visit
            </h3>

            <form action={handleScheduleVisitAction} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Date</label>
                <input type="date" name="date" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Time</label>
                <input type="text" name="time" placeholder="e.g. 10:00 AM" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Target Property</label>
                <select name="propertyId" defaultValue={lead.property_id || ''} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="" disabled>Select property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Follow-up Notes</label>
                <textarea name="notes" placeholder="Any client notes, directions, questions..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" />
              </div>

              <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm">
                Schedule Visit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
