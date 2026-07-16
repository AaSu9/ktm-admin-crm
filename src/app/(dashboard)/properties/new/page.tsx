import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createProperty } from '@/app/actions/properties'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'

export default async function NewPropertyPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let agents: any[] = []
  let dbError = false

  try {
    agents = await prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error("DB Query failed in New Property Page, showing unassigned option:", error)
    dbError = true
  }

  if (dbError) {
    agents = [{ id: 'mock-agent-1', name: 'Raj Kumar Sharma' }, { id: 'mock-agent-2', name: 'Priya Thapa' }]
  }

  async function handleCreateAction(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const priceStr = formData.get('price') as string
    const category = formData.get('category') as string
    const property_type = formData.get('property_type') as string
    const bedroomsStr = formData.get('bedrooms') as string
    const bathroomsStr = formData.get('bathrooms') as string
    const areaStr = formData.get('area_sqft') as string
    const imageUrl = formData.get('image_url') as string
    const featuresStr = formData.get('features') as string
    const video_url = formData.get('video_url') as string
    const status = formData.get('status') as string
    const agentId = formData.get('agentId') as string

    const features = featuresStr ? featuresStr.split(',').map((f) => f.trim()) : []
    const images = imageUrl ? [imageUrl.trim()] : []

    const result = await createProperty({
      title,
      description,
      location,
      price: Number(priceStr),
      category,
      property_type,
      bedrooms: bedroomsStr ? Number(bedroomsStr) : undefined,
      bathrooms: bathroomsStr ? Number(bathroomsStr) : undefined,
      area_sqft: areaStr ? Number(areaStr) : undefined,
      images,
      features,
      video_url,
      status,
      agentId: agentId === 'unassigned' ? undefined : agentId,
    })

    if (result.success) {
      redirect('/properties')
    } else {
      console.error(result.error)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link href="/properties" className="p-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-500 text-sm">List a new property in the KTM RealState system.</p>
        </div>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Sandbox Mode:</strong> The local database is not connected. Submitting this form will showcase the client-side flow.
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form action={handleCreateAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Property Title</label>
              <input type="text" name="title" required placeholder="e.g. Modern 3BHK Apartment in Lazimpat"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea name="description" placeholder="Provide a detailed description of the property, its amenities, accessibility, and features..." rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 resize-none" />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Location</label>
              <input type="text" name="location" required placeholder="e.g. Lazimpat, Kathmandu"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Price (NPR)</label>
              <input type="number" name="price" required placeholder="e.g. 15000000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <select name="category" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Type</label>
              <select name="property_type" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bedrooms</label>
              <input type="number" name="bedrooms" placeholder="e.g. 3 (leave blank for Land)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bathrooms</label>
              <input type="number" name="bathrooms" placeholder="e.g. 2"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Area Sqft */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Area (Sqft)</label>
              <input type="number" name="area_sqft" placeholder="e.g. 1800"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select name="status" defaultValue="AVAILABLE"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="AVAILABLE">Available</option>
                <option value="PENDING">Pending</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>

            {/* Image URL */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Image URL</label>
              <input type="url" name="image_url" placeholder="Paste image link, e.g. https://images.unsplash.com/photo-..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Features (comma separated) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Features / Amenities (Comma Separated)</label>
              <input type="text" name="features" placeholder="Parking, Gym, Swimming Pool, 24/7 Security"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Walkthrough Video URL (YouTube/TikTok)</label>
              <input type="url" name="video_url" placeholder="e.g. https://youtube.com/..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Assigned Agent */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Assign Agent</label>
              <select name="agentId" defaultValue="unassigned"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Link href="/properties" className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
              Save Property
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
