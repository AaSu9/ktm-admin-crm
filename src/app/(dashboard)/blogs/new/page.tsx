'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBlog, updateBlog } from '@/app/actions/blogs'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

function BlogForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<any>(null)

  useEffect(() => {
    if (editId) {
      setLoading(true)
      fetch(`/api/blogs/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) setError(data.error)
          else setInitialData(data)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [editId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      excerpt: formData.get('excerpt') as string,
      content: formData.get('content') as string,
      imageUrl: formData.get('imageUrl') as string,
      published: formData.get('published') === 'true',
    }

    let result
    if (editId) {
      result = await updateBlog(editId, data)
    } else {
      result = await createBlog(data)
    }

    if (result.success) {
      router.push('/blogs')
      router.refresh()
    } else {
      setError(result.error || 'Something went wrong')
      setLoading(false)
    }
  }

  if (editId && loading && !initialData) {
    return <div className="p-8 text-center text-gray-500">Loading blog data...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/blogs" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Blog' : 'Create New Blog'}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Blog Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={initialData?.title || ''}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter blog title"
              />
            </div>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
                Short Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                defaultValue={initialData?.excerpt || ''}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Brief summary of the article"
              />
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                defaultValue={initialData?.imageUrl || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Full Content *
              </label>
              <textarea
                id="content"
                name="content"
                defaultValue={initialData?.content || ''}
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Write your article here..."
              />
            </div>

            <div>
              <label htmlFor="published" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="published"
                name="published"
                defaultValue={initialData ? String(initialData.published) : 'true'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="true">Published (Visible to public)</option>
                <option value="false">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link
              href="/blogs"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editId ? 'Update Blog' : 'Save Blog'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewBlogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading editor...</div>}>
      <BlogForm />
    </Suspense>
  )
}
