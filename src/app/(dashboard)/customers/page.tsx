import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate, getStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, UserRound, Phone, Mail } from 'lucide-react'
import { CustomersExportButton } from '@/components/dashboard/DataExportButtons'

export default async function CustomersPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ search?: string; type?: string }> }) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const where: any = {}
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
      { phone: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }
  if (searchParams.type) where.type = searchParams.type

  let customers: any[] = []
  try {
    customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { leads: true, visits: true },
    })
  } catch (error) {
    console.error('DB Query failed in Customers Page:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">{customers.length} total customers</p>
        </div>
        <div className="flex gap-2">
          <CustomersExportButton customers={customers} />
          <Link href="/customers/new" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Customer
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input name="search" defaultValue={searchParams.search} placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50" />
          </div>
          <select name="type" defaultValue={searchParams.type}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Types</option>
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
            <option value="TENANT">Tenant</option>
          </select>
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Filter</button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <UserRound className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No customers found</p>
          </div>
        ) : customers.map((customer) => (
          <Link key={customer.id} href={`/customers/${customer.id}`}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                {customer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{customer.name}</p>
                <p className="text-xs text-gray-400 truncate">{customer.address || 'No address'}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3.5 w-3.5 text-gray-400" />{customer.phone}
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /><span className="truncate">{customer.email}</span>
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-gray-800">{customer.leads.length}</p>
                <p className="text-xs text-gray-400">Leads</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-gray-800">{customer.visits.length}</p>
                <p className="text-xs text-gray-400">Visits</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs font-medium text-gray-600">{formatDate(customer.createdAt)}</p>
                <p className="text-xs text-gray-400">Joined</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
