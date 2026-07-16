import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getContentByKey, updateContent } from '@/app/actions/content'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

const SECTION_META: Record<string, { label: string; description: string }> = {
  hero: { label: 'Hero Banner', description: 'Main homepage hero section with title, subtitle, and CTA.' },
  about: { label: 'About Us', description: 'Company story, mission, and vision content.' },
  testimonials: { label: 'Testimonials', description: 'Client testimonials displayed on the homepage.' },
  banners: { label: 'Promotional Banners', description: 'Special offer announcements and promotional content.' },
  faqs: { label: 'FAQs', description: 'Frequently asked questions shown to visitors.' },
  blog: { label: 'Blog / News', description: 'Articles, market updates, and property guides.' },
}

export default async function ContentEditorPage({ params: paramsPromise }: { params: Promise<{ key: string }> }) {
  const params = await paramsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const sectionKey = params.key
  const meta = SECTION_META[sectionKey]

  if (!meta) {
    redirect('/content')
  }

  let content: any = null
  try {
    const result = await getContentByKey(sectionKey)
    content = result.content
  } catch (error) {
    console.error('Failed to load content:', error)
  }

  async function handleSave(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const body = formData.get('body') as string
    const isActive = formData.get('isActive') === 'on'

    await updateContent({
      key: sectionKey,
      title: title || undefined,
      subtitle: subtitle || undefined,
      body: body || undefined,
      isActive,
    })

    redirect('/content')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/content" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit: {meta.label}</h1>
          <p className="text-gray-500 text-sm">{meta.description}</p>
        </div>
      </div>

      {/* Form */}
      <form action={handleSave} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
          <input
            name="title"
            defaultValue={content?.title || ''}
            placeholder={`Enter ${meta.label.toLowerCase()} title...`}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtitle</label>
          <input
            name="subtitle"
            defaultValue={content?.subtitle || ''}
            placeholder="Enter subtitle or tagline..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Body Content</label>
          <textarea
            name="body"
            defaultValue={content?.body || ''}
            placeholder="Enter the main content here..."
            rows={10}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            defaultChecked={content?.isActive !== false}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible on website)</label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" /> Save Content
          </button>
          <Link href="/content" className="text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</Link>
        </div>
      </form>

      {/* Meta info */}
      {content && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400">
            Last updated: {new Date(content.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kathmandu' })}
          </p>
        </div>
      )}
    </div>
  )
}
