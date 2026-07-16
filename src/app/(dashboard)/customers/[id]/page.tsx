import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { formatDate, formatPrice, getStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, User, Shield, CalendarCheck, Home, FileText, Settings, Coins, Trash2 } from 'lucide-react'
import { updateCustomer, deleteCustomer } from '@/app/actions/customers'
import DeleteForm from '@/components/DeleteForm'

export default async function CustomerDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const custId = params.id
  let customer: any = null
  let dbError = false

  try {
    customer = await prisma.customer.findUnique({
      where: { id: custId },
      include: {
        leads: { include: { property: true } },
        visits: { include: { property: true } },
        buyerDeals: { include: { property: true } },
        sellerDeals: { include: { property: true } },
      },
    })

    if (!customer && custId !== 'demo-id') {
      return notFound()
    }
  } catch (error) {
    console.error("DB Query failed in Customer Detail Page, showing mock fallback:", error)
    dbError = true
  }

  // Fallback Mock Data for demo mode
  if (dbError || custId === 'demo-id') {
    customer = customer || {
      id: 'demo-id',
      name: 'Bikash Shrestha',
      phone: '+977-9841234567',
      email: 'bikash@email.com',
      address: 'Patan, Lalitpur',
      notes: 'Interested in buying a 3BHK Apartment inside Kathmandu Valley. Ready buyer with pre-approved financing. Preferred locations: Lazimpat, Jhamsikhel.',
      type: 'BUYER',
      createdAt: new Date(),
      updatedAt: new Date(),
      leads: [
        {
          id: 'mock-lead-1',
          full_name: 'Anup Gurung',
          budget: 20000000,
          status: 'NEW',
          property: {
            title: 'Luxury 3BHK Apartment in Lazimpat',
            price: 15000000,
          }
        }
      ],
      visits: [
        {
          id: 'mock-visit-1',
          date: new Date('2026-06-28'),
          time: '10:00 AM',
          status: 'SCHEDULED',
          property: {
            title: 'Luxury 3BHK Apartment in Lazimpat',
          }
        }
      ],
      buyerDeals: [],
      sellerDeals: [],
    }
  }

  async function handleUpdateCustomerAction(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string
    const notes = formData.get('notes') as string
    const type = formData.get('type') as string

    await updateCustomer(customer.id, {
      name,
      phone,
      email,
      address,
      notes,
      type,
    })
  }

  async function handleDeleteCustomerAction() {
    'use server'
    await deleteCustomer(customer.id)
    redirect('/customers')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="flex gap-2">
          {dbError && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              ⚠️ Sandbox Mode
            </span>
          )}
          <DeleteForm action={handleDeleteCustomerAction} confirmMessage="Delete this customer permanently?" className="inline">
            <button type="submit" className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" title="Delete Customer">
              <Trash2 className="h-5 w-5" />
            </button>
          </DeleteForm>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full opacity-40" />
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {customer.name.charAt(0)}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{customer.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                    customer.type === 'BUYER' ? 'bg-blue-100 text-blue-700' : customer.type === 'SELLER' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    {customer.type}
                  </span>
                  <span className="text-xs text-gray-400 font-medium px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                    Joined {formatDate(customer.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 text-sm">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Phone className="h-4.5 w-4.5 text-gray-400" />
                <a href={`tel:${customer.phone}`} className="hover:underline font-medium text-gray-800">{customer.phone}</a>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Mail className="h-4.5 w-4.5 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="hover:underline font-medium text-gray-800 truncate">{customer.email || 'No email address'}</a>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600 sm:col-span-2">
                <Home className="h-4.5 w-4.5 text-gray-400" />
                <span>Address: <strong className="text-gray-800 font-medium">{customer.address || 'No address registered'}</strong></span>
              </div>
            </div>
          </div>

          {/* Leads & Visits Tab lists */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
            {/* Active Leads */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-md flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-emerald-600" /> Associated Inquiries & Leads ({customer.leads?.length || 0})
              </h3>
              {customer.leads?.length === 0 ? (
                <p className="text-gray-400 text-xs italic pl-1">No active leads logged.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {customer.leads?.map((lead: any) => (
                    <div key={lead.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{lead.full_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Budget: {lead.budget ? formatPrice(lead.budget) : 'none'} · Property: {lead.property?.title || 'General inquiry'}</p>
                      </div>
                      <Link href={`/leads/${lead.id}`} className="text-xs text-emerald-600 hover:underline font-semibold">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visit History */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 text-md flex items-center gap-1.5">
                <CalendarCheck className="h-4.5 w-4.5 text-emerald-600" /> Scheduled Site Visits ({customer.visits?.length || 0})
              </h3>
              {customer.visits?.length === 0 ? (
                <p className="text-gray-400 text-xs italic pl-1">No visits scheduled.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {customer.visits?.map((v: any) => (
                    <div key={v.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{v.property.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(v.date)} at {v.time} · Status: <span className="font-medium text-emerald-600">{v.status}</span></p>
                      </div>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        v.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' : v.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      )}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deals Tracking */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 text-md flex items-center gap-1.5">
                <Coins className="h-4.5 w-4.5 text-emerald-600" /> Deals Logged
              </h3>
              {(!customer.buyerDeals || customer.buyerDeals.length === 0) && (!customer.sellerDeals || customer.sellerDeals.length === 0) ? (
                <p className="text-gray-400 text-xs italic pl-1">No transaction deals closed yet for this customer.</p>
              ) : (
                <div className="space-y-2">
                  {customer.buyerDeals?.map((d: any) => (
                    <div key={d.id} className="border border-gray-100 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{d.title}</p>
                        <p className="text-gray-400 mt-0.5">Role: Buyer · Property: {d.property.title}</p>
                      </div>
                      <span className="font-bold text-emerald-600">{formatPrice(d.dealValue)}</span>
                    </div>
                  ))}
                  {customer.sellerDeals?.map((d: any) => (
                    <div key={d.id} className="border border-gray-100 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{d.title}</p>
                        <p className="text-gray-400 mt-0.5">Role: Seller · Property: {d.property.title}</p>
                      </div>
                      <span className="font-bold text-purple-600">{formatPrice(d.dealValue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Update customer panel */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 text-md flex items-center gap-1.5">
            <Settings className="h-4.5 w-4.5 text-gray-400" /> Edit Contact Info
          </h3>

          <form action={handleUpdateCustomerAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Customer Name</label>
              <input type="text" name="name" required defaultValue={customer.name}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Phone number</label>
              <input type="text" name="phone" required defaultValue={customer.phone}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Email Address</label>
              <input type="email" name="email" defaultValue={customer.email || ''} placeholder="e.g. customer@email.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Address / Location</label>
              <input type="text" name="address" defaultValue={customer.address || ''} placeholder="e.g. Lalitpur"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Client Category</label>
              <select name="type" defaultValue={customer.type || 'BUYER'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
                <option value="TENANT">Tenant</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Internal Notes / Intentions</label>
              <textarea name="notes" defaultValue={customer.notes || ''} placeholder="Client properties criteria, urgency, budget ranges..." rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" />
            </div>

            <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
              Save Customer Info
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
