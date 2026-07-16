import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileEdit, Layout, Star, HelpCircle, FileText, Image } from 'lucide-react'

const contentSections = [
  { key: 'hero', label: 'Hero Banner', desc: 'Edit main homepage hero section title, subtitle, and CTA button.', icon: Layout, color: 'bg-blue-100 text-blue-600' },
  { key: 'about', label: 'About Us', desc: 'Update company story, mission, and vision content.', icon: FileText, color: 'bg-emerald-100 text-emerald-600' },
  { key: 'testimonials', label: 'Testimonials', desc: 'Add or remove client testimonials displayed on the homepage.', icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  { key: 'banners', label: 'Promotional Banners', desc: 'Manage promotional banners and special offer announcements.', icon: Image, color: 'bg-purple-100 text-purple-600' },
  { key: 'faqs', label: 'FAQs', desc: 'Manage frequently asked questions shown to visitors.', icon: HelpCircle, color: 'bg-orange-100 text-orange-600' },
  { key: 'blog', label: 'Blog / News', desc: 'Publish new articles, market updates, and property guides.', icon: FileEdit, color: 'bg-cyan-100 text-cyan-600' },
]

export default async function ContentPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-500 text-sm">Edit your website content directly from the CRM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {contentSections.map((section) => (
          <Link key={section.key} href={`/content/${section.key}`} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer block">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${section.color}`}>
              <section.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{section.label}</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{section.desc}</p>
            <span className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1 group-hover:gap-2 transition-all">
              Edit content <span>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
