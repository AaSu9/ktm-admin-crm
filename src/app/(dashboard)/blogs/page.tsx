import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

export default async function BlogsPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ search?: string, delete?: string }> }) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const where: any = {}
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }

  if (searchParams.delete) {
    const { deleteBlog } = await import('@/app/actions/blogs')
    await deleteBlog(searchParams.delete)
    redirect('/blogs')
  }

  let blogs: any[] = []
  try {
    blogs = await (prisma as any).blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    })
  } catch (error) {
    console.error('DB Query failed in Blogs Page:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-500 text-sm">{blogs.length} total articles</p>
        </div>
        <Link href="/blogs/new" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Blog
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <form className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="search"
              placeholder="Search blogs..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              defaultValue={searchParams.search}
            />
          </form>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No blogs found. Create your first article!
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{blog.title}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {blog.author?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${blog.published ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-500/20'}`}>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(blog.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-3 justify-end">
                       <Link href={`/blogs/new?id=${blog.id}`} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                         <Edit className="h-4 w-4" /> Edit
                       </Link>
                       <Link href={`?delete=${blog.id}`} className="text-red-600 hover:text-red-700 flex items-center gap-1">
                         <Trash2 className="h-4 w-4" /> Delete
                       </Link>
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
  )
}
