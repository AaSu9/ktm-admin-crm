import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createProperty } from '@/app/actions/properties'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'

export default async function NewPropertyPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await searchParamsPromise
  const errorMsg = searchParams.error
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
    const property_id = formData.get('property_id') as string
    const category = formData.get('category') as string
    const property_type = formData.get('property_type') as string
    const bedroomsStr = formData.get('bedrooms') as string
    const bathroomsStr = formData.get('bathrooms') as string
    const areaStr = formData.get('area_sqft') as string
    const imageUrl = formData.get('image_url') as string
    const featuresStr = formData.get('features') as string
    const video_url = formData.get('video_url') as string
    const youtube_url = formData.get('youtube_url') as string
    const tiktok_url = formData.get('tiktok_url') as string
    const map_url = formData.get('map_url') as string
    const latitudeStr = formData.get('latitude') as string
    const longitudeStr = formData.get('longitude') as string
    const status = formData.get('status') as string
    const agentId = formData.get('agentId') as string

    // New Fields
    const pillarSize = formData.get('pillarSize') as string
    const tankCapacity = formData.get('tankCapacity') as string
    const roadSize = formData.get('roadSize') as string
    const roadType = formData.get('roadType') as string
    const landArea = formData.get('landArea') as string
    const livingRoomsStr = formData.get('livingRooms') as string
    const kitchensStr = formData.get('kitchens') as string
    const faceDirection = formData.get('faceDirection') as string
    const parking = formData.get('parking') as string
    const totalFloorsStr = formData.get('totalFloors') as string
    const yearBuiltStr = formData.get('yearBuilt') as string
    const furnishing = formData.get('furnishing') as string
    const negotiable = formData.get('negotiable') === 'on'
    const cityArea = formData.get('cityArea') as string
    const municipality = formData.get('municipality') as string
    const wardNumberStr = formData.get('wardNumber') as string
    const dimension = formData.get('dimension') as string

    const features = featuresStr ? featuresStr.split(',').map((f) => f.trim()) : []
    const images = imageUrl ? [imageUrl.trim()] : []

    const result = await createProperty({
      property_id,
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
      youtube_url,
      tiktok_url,
      map_url,
      latitude: latitudeStr ? Number(latitudeStr) : undefined,
      longitude: longitudeStr ? Number(longitudeStr) : undefined,
      status,
      agentId: agentId === 'unassigned' ? undefined : agentId,
      pillarSize,
      tankCapacity,
      roadSize,
      roadType,
      landArea,
      livingRooms: livingRoomsStr ? Number(livingRoomsStr) : undefined,
      kitchens: kitchensStr ? Number(kitchensStr) : undefined,
      faceDirection,
      parking,
      totalFloors: totalFloorsStr ? Number(totalFloorsStr) : undefined,
      yearBuilt: yearBuiltStr ? Number(yearBuiltStr) : undefined,
      furnishing,
      negotiable,
      cityArea,
      municipality,
      wardNumber: wardNumberStr ? Number(wardNumberStr) : undefined,
      dimension,
    })

    if (result.success) {
      redirect('/properties')
    } else {
      console.error(result.error)
      redirect(`/properties/new?error=${encodeURIComponent(result.error || 'Failed to create property')}`)
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
          <p className="text-gray-500 text-sm">List a new property in the KTM RealEstate system.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Sandbox Mode:</strong> The local database is not connected. Submitting this form will showcase the client-side flow.
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form action={handleCreateAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SECTION 1: Core Details */}
            <div className="md:col-span-2">
              <h3 className="text-md font-bold text-gray-800">Core Details</h3>
              <p className="text-xs text-gray-400">Basic details of the listing.</p>
            </div>

            {/* Property ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property ID *</label>
              <input type="text" name="property_id" required placeholder="e.g. prop-101"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Title *</label>
              <input type="text" name="title" required placeholder="e.g. Modern 3BHK Apartment in Lazimpat"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea name="description" placeholder="Provide a detailed description..." rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 resize-none" />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Price (NPR) *</label>
              <input type="number" name="price" required placeholder="e.g. 15000000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Category *</label>
              <select name="category" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Type *</label>
              <select name="property_type" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
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

            {/* SECTION 2: Structure & Technical Specs */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Structure & Specifications</h3>
              <p className="text-xs text-gray-400">Dimensions, capacity, rooms, and architectural metrics.</p>
            </div>

            {/* Land Area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Land Area (e.g. Aana/Ropani)</label>
              <input type="text" name="landArea" placeholder="e.g. 6.5 Aana, 7 Aana 1 Paisa"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Area Sqft */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Built-up Area (Sqft)</label>
              <input type="number" name="area_sqft" placeholder="e.g. 1800"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Dimension */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Dimension (Haat/Feet)</label>
              <input type="text" name="dimension" placeholder="e.g. H 28 | H 52 Haat"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Total Floors */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Total Floors</label>
              <input type="number" step="0.1" name="total_floors" placeholder="e.g. 2.5"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bedrooms</label>
              <input type="number" name="bedrooms" placeholder="e.g. 5"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bathrooms</label>
              <input type="number" name="bathrooms" placeholder="e.g. 4"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Living Rooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Living Rooms</label>
              <input type="number" name="livingRooms" placeholder="e.g. 2"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Kitchens */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Kitchens</label>
              <input type="number" name="kitchens" placeholder="e.g. 1"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Pillar Size */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Pillar Size</label>
              <input type="text" name="pillarSize" placeholder="e.g. 14*14 Inchs, 12*12 Inchs"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Tank Capacity */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Water Tank Capacity</label>
              <input type="text" name="tankCapacity" placeholder="e.g. 16,000 Litres, 10,000 Litres"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Year Built */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Year Built (e.g. BS / AD)</label>
              <input type="number" name="yearBuilt" placeholder="e.g. 2075"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* SECTION 3: Road & Exterior */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Road & Exterior</h3>
              <p className="text-xs text-gray-400">Road access details, parking, and direction orientations.</p>
            </div>

            {/* Road Size */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Road Access Size</label>
              <input type="text" name="roadSize" placeholder="e.g. 20 Feet, 15 Feet"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Road Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Road Type</label>
              <select name="roadType" defaultValue=""
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="">Select road type</option>
                <option value="Pitched">Pitched</option>
                <option value="Gravelled">Gravelled</option>
                <option value="Soil Joint">Soil Joint</option>
                <option value="Paved">Paved</option>
              </select>
            </div>

            {/* Face Direction */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Face Direction</label>
              <input type="text" name="faceDirection" placeholder="e.g. West, East-South, North"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Parking */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Parking Space Details</label>
              <input type="text" name="parking" placeholder="e.g. 3 Cars & 4 Bikes"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* SECTION 4: Detailed Location */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Detailed Location</h3>
              <p className="text-xs text-gray-400">Full location mapping coordinates and labels.</p>
            </div>

            {/* Location (Central Address) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Address *</label>
              <input type="text" name="location" required placeholder="e.g. Lazimpat, Kathmandu"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* City & Area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">City & Area</label>
              <input type="text" name="cityArea" placeholder="e.g. Pokhara, Amarsinghchowk"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Municipality */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Municipality / Local Government</label>
              <input type="text" name="municipality" placeholder="e.g. Pokhara, Kathmandu"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Ward Number */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Ward Number</label>
              <input type="number" name="wardNumber" placeholder="e.g. 10"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* SECTION 5: Additional Options & Media */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Media & Additional Options</h3>
              <p className="text-xs text-gray-400">Status, negotiability, images, map links, walkthroughs, etc.</p>
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

            {/* Furnishing */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Furnishing Details</label>
              <select name="furnishing" defaultValue=""
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50">
                <option value="">Select furnishing status</option>
                <option value="Full Furnished">Full Furnished</option>
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
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

            {/* Video Walkthrough URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Walkthrough Video URL (direct mp4/webm)</label>
              <input type="url" name="video_url" placeholder="e.g. https://domain.com/video.mp4"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* YouTube URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">YouTube Video URL</label>
              <input type="url" name="youtube_url" placeholder="e.g. https://youtube.com/watch?v=..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* TikTok URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">TikTok Video URL</label>
              <input type="url" name="tiktok_url" placeholder="e.g. https://tiktok.com/@user/video/..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Map URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Google Map Location / Embed URL</label>
              <input type="url" name="map_url" placeholder="e.g. https://google.com/maps/..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Latitude */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Latitude</label>
              <input type="number" step="any" name="latitude" placeholder="e.g. 27.7172"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Longitude */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Longitude</label>
              <input type="number" step="any" name="longitude" placeholder="e.g. 85.3240"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50" />
            </div>

            {/* Negotiable Checkbox */}
            <div className="flex items-center gap-2 pt-2 md:col-span-2">
              <input
                type="checkbox"
                name="negotiable"
                id="negotiable"
                defaultChecked
                className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="negotiable" className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                Price is Negotiable
              </label>
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
