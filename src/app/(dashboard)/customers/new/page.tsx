import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createCustomer } from '@/app/actions/customers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewCustomerPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let dbError = false
  try {
    // just testing connection
    await prisma.customer.count()
  } catch (error) {
    dbError = true
  }

  async function handleCreateAction(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string
    const type = formData.get('type') as string
    const notes = formData.get('notes') as string

    await createCustomer({
      name,
      phone,
      email,
      address,
      notes,
      type
    })

    redirect('/customers')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/customers" className="p-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
          <p className="text-gray-500 text-sm">Register a new client contact for buying, selling, or leasing properties.</p>
        </div>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Sandbox Mode:</strong> Database is offline. Submitting will showcase frontend flow.
        </div>
      )}

      {/* Card Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form action={handleCreateAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</label>
              <input type="text" name="name" required placeholder="e.g. Bikash Shrestha"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone number</label>
              <input type="text" name="phone" required placeholder="e.g. +977-9841234567"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
              <input type="email" name="email" placeholder="e.g. bikash@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Client Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Type</label>
              <select name="type" defaultValue="BUYER"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="BUYER">Buyer (Looking to Purchase)</option>
                <option value="SELLER">Seller (Looking to Dispose Listing)</option>
                <option value="TENANT">Tenant (Looking to Lease)</option>
              </select>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location / Address</label>
              <input type="text" name="address" placeholder="e.g. Patan, Lalitpur"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Notes */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Intentions & Profile Notes</label>
              <textarea name="notes" placeholder="e.g. Looking for a 3BHK in Kathmandu valley, budget 2 Crore maximum..." rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Link href="/customers" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
