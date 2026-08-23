'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ImageUploadField from '@/components/dashboard/ImageUploadField'
import { createProperty, uploadImage } from '@/app/actions/properties'

interface NewPropertyFormProps {
  agents: Array<{ id: string; name: string }>
  dbError?: boolean
}

export default function NewPropertyForm({ agents, dbError }: NewPropertyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const form = e.currentTarget
    const formData = new FormData(form)

    const title = (formData.get('title') as string || '').trim()
    const location = (formData.get('location') as string || '').trim()
    const priceStr = (formData.get('price') as string || '').trim()
    const category = (formData.get('category') as string || '').trim()
    const property_type = (formData.get('property_type') as string || '').trim()

    if (!title || !location || !priceStr || !category || !property_type) {
      toast.error('Please fill in all required fields marked with *')
      return
    }

    setIsSubmitting(true)

    try {
      const property_id = (formData.get('property_id') as string || '').trim()
      const description = (formData.get('description') as string || '').trim()
      const bedroomsStr = formData.get('bedrooms') as string
      const bathroomsStr = formData.get('bathrooms') as string
      const areaStr = formData.get('area_sqft') as string
      const uploadedImagesStr = formData.get('uploaded_images') as string
      const featuresStr = formData.get('features') as string
      const video_url = (formData.get('video_url') as string || '').trim()
      const youtube_url = (formData.get('youtube_url') as string || '').trim()
      const tiktok_url = (formData.get('tiktok_url') as string || '').trim()
      let map_url = (formData.get('map_url') as string || '').trim()
      if (map_url.includes('<iframe')) {
        const match = map_url.match(/src="([^"]+)"/)
        if (match && match[1]) map_url = match[1]
      }
      const latitudeStr = formData.get('latitude') as string
      const longitudeStr = formData.get('longitude') as string
      const status = formData.get('status') as string
      const agentId = formData.get('agentId') as string

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

      const features = featuresStr ? featuresStr.split(',').map((f) => f.trim()).filter(Boolean) : []
      
      const base64Images = uploadedImagesStr ? JSON.parse(uploadedImagesStr) : []
      const images: string[] = []
      for (const base64 of base64Images) {
        if (base64.startsWith('data:image')) {
          const url = await uploadImage(base64)
          images.push(url)
        } else {
          images.push(base64)
        }
      }

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
        // GREEN Toast on ADD
        toast.success('Property added successfully', {
          description: 'The property has been added to the database.',
        })
        router.push('/properties')
        router.refresh()
      } else {
        // RED Error Toast on Failure, stay on form
        toast.error(result.error || 'Failed to add property')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error creating property:', error)
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred while adding property'
      toast.error(errorMsg)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link href="/properties" className="p-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all shadow-xs">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-500 text-sm">List a new property in the KTM RealEstate system.</p>
        </div>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Sandbox Mode:</strong> The local database is not connected. Submitting this form will showcase the client-side flow.
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* SECTION 1: Core Details */}
            <div className="md:col-span-2">
              <h3 className="text-md font-bold text-gray-800">Core Details</h3>
              <p className="text-xs text-gray-400">Basic details of the listing.</p>
            </div>

            {/* Property ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property ID (Auto-generated if blank)</label>
              <input type="text" name="property_id" placeholder="e.g. prop-101" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Title *</label>
              <input type="text" name="title" required placeholder="e.g. Modern 3BHK Apartment in Lazimpat" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea name="description" placeholder="Provide a detailed description..." rows={4} disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 resize-none disabled:opacity-60" />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Price (NPR) *</label>
              <input type="number" name="price" required placeholder="e.g. 15000000" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Category *</label>
              <select name="category" required disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Type *</label>
              <select name="property_type" required disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            {/* Assigned Agent */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Assign Agent</label>
              <select name="agentId" defaultValue="unassigned" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
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
              <input type="text" name="landArea" placeholder="e.g. 6.5 Aana, 7 Aana 1 Paisa" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Area Sqft */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Built-up Area (Sqft)</label>
              <input type="number" name="area_sqft" placeholder="e.g. 1800" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Dimension */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Dimension (Haat/Feet)</label>
              <input type="text" name="dimension" placeholder="e.g. H 28 | H 52 Haat" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Total Floors */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Total Floors</label>
              <input type="number" step="0.1" name="totalFloors" placeholder="e.g. 2.5" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bedrooms</label>
              <input type="number" name="bedrooms" placeholder="e.g. 5" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bathrooms</label>
              <input type="number" name="bathrooms" placeholder="e.g. 4" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Living Rooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Living Rooms</label>
              <input type="number" name="livingRooms" placeholder="e.g. 2" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Kitchens */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Kitchens</label>
              <input type="number" name="kitchens" placeholder="e.g. 1" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Pillar Size */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Pillar Size</label>
              <input type="text" name="pillarSize" placeholder="e.g. 14*14 Inchs, 12*12 Inchs" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Tank Capacity */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Water Tank Capacity</label>
              <input type="text" name="tankCapacity" placeholder="e.g. 16,000 Litres, 10,000 Litres" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Year Built */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Year Built (e.g. BS / AD)</label>
              <input type="number" name="yearBuilt" placeholder="e.g. 2075" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* SECTION 3: Road & Exterior */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Road & Exterior</h3>
              <p className="text-xs text-gray-400">Road access details, parking, and direction orientations.</p>
            </div>

            {/* Road Size */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Road Access Size</label>
              <input type="text" name="roadSize" placeholder="e.g. 20 Feet, 15 Feet" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Road Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Road Type</label>
              <select name="roadType" defaultValue="" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
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
              <input type="text" name="faceDirection" placeholder="e.g. West, East-South, North" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Parking */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Parking Space Details</label>
              <input type="text" name="parking" placeholder="e.g. 3 Cars & 4 Bikes" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* SECTION 4: Detailed Location */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Detailed Location</h3>
              <p className="text-xs text-gray-400">Full location mapping coordinates and labels.</p>
            </div>

            {/* Location (Central Address) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Address *</label>
              <input type="text" name="location" required placeholder="e.g. Lazimpat, Kathmandu" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* City & Area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">City & Area</label>
              <input type="text" name="cityArea" placeholder="e.g. Pokhara, Amarsinghchowk" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Municipality */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Municipality / Local Government</label>
              <input type="text" name="municipality" placeholder="e.g. Pokhara, Kathmandu" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Ward Number */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Ward Number</label>
              <input type="number" name="wardNumber" placeholder="e.g. 10" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* SECTION 5: Additional Options & Media */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Media & Additional Options</h3>
              <p className="text-xs text-gray-400">Status, negotiability, images, map links, walkthroughs, etc.</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select name="status" defaultValue="AVAILABLE" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
                <option value="AVAILABLE">Available</option>
                <option value="PENDING">Pending</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>

            {/* Furnishing */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Furnishing Details</label>
              <select name="furnishing" defaultValue="" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
                <option value="">Select furnishing status</option>
                <option value="Full Furnished">Full Furnished</option>
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Image Upload Area */}
            <div className="md:col-span-2">
              <ImageUploadField />
            </div>

            {/* Features */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Features / Amenities (Comma Separated)</label>
              <input type="text" name="features" placeholder="Parking, Gym, Swimming Pool, 24/7 Security" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Video Walkthrough URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Walkthrough Video URL (direct mp4/webm)</label>
              <input type="text" name="video_url" placeholder="e.g. https://domain.com/video.mp4" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* YouTube URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">YouTube Video URL</label>
              <input type="text" name="youtube_url" placeholder="e.g. https://youtube.com/watch?v=..." disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* TikTok URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">TikTok Video URL</label>
              <input type="text" name="tiktok_url" placeholder="e.g. https://tiktok.com/@user/video/..." disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Map URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Google Map Location / Embed URL</label>
              <input type="text" name="map_url" placeholder="e.g. https://google.com/maps/... or https://maps.app.goo.gl/..." disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Latitude */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Latitude</label>
              <input type="number" step="any" name="latitude" placeholder="e.g. 27.7172" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Longitude */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Longitude</label>
              <input type="number" step="any" name="longitude" placeholder="e.g. 85.3240" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Negotiable Checkbox */}
            <div className="flex items-center gap-2 pt-2 md:col-span-2">
              <input
                type="checkbox"
                name="negotiable"
                id="negotiable"
                defaultChecked
                disabled={isSubmitting}
                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Property...
                </>
              ) : (
                'Save Property'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
