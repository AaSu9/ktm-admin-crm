import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatPrice, formatDate, getStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, Building2, Eye, Pencil, Trash2 } from 'lucide-react'
import { deleteProperty } from '@/app/actions/properties'
import { PropertiesExportButton } from '@/components/dashboard/DataExportButtons'
import DeleteForm from '@/components/DeleteForm'

export default async function PropertiesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; category?: string }>
}) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  if (!session) redirect('/login')

  async function handleDeleteProperty(id: string) {
    'use server'
    await deleteProperty(id)
  }

  const page = parseInt(searchParams.page || '1')
  const limit = 10
  const skip = (page - 1) * limit

  const where: any = {}
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { location: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.category) where.category = searchParams.category

  let properties: any[] = []
  let total = 0

  try {
    const results = await Promise.all([
      prisma.property.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' }, include: { agent: true } }),
      prisma.property.count({ where }),
    ])
    properties = results[0]
    total = results[1]
  } catch (error) {
    console.error("DB not connected")
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm">{total} total properties</p>
        </div>
        <div className="flex gap-2">
          <PropertiesExportButton properties={properties} />
          <Link href="/properties/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Property
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <form className="flex flex-wrap gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input name="search" defaultValue={searchParams.search} placeholder="Search properties..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50" />
          </div>
          <select name="status" defaultValue={searchParams.status}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="SOLD">Sold</option>
            <option value="PENDING">Pending</option>
            <option value="RENTED">Rented</option>
          </select>
          <select name="category" defaultValue={searchParams.category}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Categories</option>
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
          </select>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Property</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden xl:table-cell">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No properties found
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Building2 className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[160px]">{p.title}</p>
                          <p className="text-xs text-gray-400 capitalize">{p.property_type} · {p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell max-w-[140px] truncate">{p.location}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getStatusColor(p.status))}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{p.agent?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden xl:table-cell">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/properties/${p.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link href={`/properties/${p.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteForm action={handleDeleteProperty.bind(null, p.id)} confirmMessage="Delete this property permanently?" className="inline">
                          <button type="submit" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title="Delete Property">
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/properties?page=${p}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                  className={cn('w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    p === page ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 text-gray-600')}>
                  {p}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
