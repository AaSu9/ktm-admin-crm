'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ImageUploadField from '@/components/dashboard/ImageUploadField'
import { updateProperty, uploadImage } from '@/app/actions/properties'

interface PropertyData {
  id?: string
  title?: string
  description?: string
  location?: string
  price?: number
  category?: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  area_sqft?: number
  images?: string[]
  status?: string
  features?: string[]
  agentId?: string
  video_url?: string
  youtube_url?: string
  tiktok_url?: string
  map_url?: string
  latitude?: number
  longitude?: number
  pillarSize?: string
  tankCapacity?: string
  roadSize?: string
  roadType?: string
  landArea?: string
  livingRooms?: number
  kitchens?: number
  faceDirection?: string
  parking?: string
  totalFloors?: number
  yearBuilt?: number
  furnishing?: string
  negotiable?: boolean
  cityArea?: string
  municipality?: string
  wardNumber?: number
  dimension?: string
  property_id?: string
  [key: string]: unknown
}

interface EditPropertyFormProps {
  propId: string
  property: PropertyData
  agents: Array<{ id: string; name: string }>
  dbError?: boolean
}

export default function EditPropertyForm({ propId, property, agents, dbError }: EditPropertyFormProps) {
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

      const targetId = (property?.id as string) || (property?.property_id as string) || propId

      const result = await updateProperty(targetId, {
        property_id,
        title,
        description: description || undefined,
        location,
        price: Number(priceStr),
        category,
        property_type,
        bedrooms: bedroomsStr ? Number(bedroomsStr) : undefined,
        bathrooms: bathroomsStr ? Number(bathroomsStr) : undefined,
        area_sqft: areaStr ? Number(areaStr) : undefined,
        images: images.length > 0 ? images : undefined,
        features,
        video_url: video_url || undefined,
        youtube_url: youtube_url || undefined,
        tiktok_url: tiktok_url || undefined,
        map_url: map_url || undefined,
        latitude: latitudeStr ? Number(latitudeStr) : undefined,
        longitude: longitudeStr ? Number(longitudeStr) : undefined,
        status,
        agentId: agentId === 'unassigned' ? undefined : agentId,
        pillarSize: pillarSize || undefined,
        tankCapacity: tankCapacity || undefined,
        roadSize: roadSize || undefined,
        roadType: roadType || undefined,
        landArea: landArea || undefined,
        livingRooms: livingRoomsStr ? Number(livingRoomsStr) : undefined,
        kitchens: kitchensStr ? Number(kitchensStr) : undefined,
        faceDirection: faceDirection || undefined,
        parking: parking || undefined,
        totalFloors: totalFloorsStr ? Number(totalFloorsStr) : undefined,
        yearBuilt: yearBuiltStr ? Number(yearBuiltStr) : undefined,
        furnishing: furnishing || undefined,
        negotiable,
        cityArea: cityArea || undefined,
        municipality: municipality || undefined,
        wardNumber: wardNumberStr ? Number(wardNumberStr) : undefined,
        dimension: dimension || undefined,
      })

      if (result.success) {
        // BLUE Toast on UPDATE
        toast.info('Property updated successfully', {
          description: 'The property parameters have been updated.',
          style: {
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            borderColor: '#93c5fd',
          },
        })
        router.push('/properties')
        router.refresh()
      } else {
        // RED Error Toast on Failure, stay on form
        toast.error(result.error || 'Failed to update property')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error updating property:', error)
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred while updating property'
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-500 text-sm">Update parameters for {property.title || 'Property'}.</p>
        </div>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          ⚠️ <strong>Sandbox Mode:</strong> Running with fallback data.
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
              <label className="text-sm font-semibold text-gray-700">Property ID *</label>
              <input type="text" name="property_id" required defaultValue={property.property_id || ''} placeholder="e.g. prop-101" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Title *</label>
              <input type="text" name="title" required defaultValue={property.title || ''} placeholder="e.g. Modern 3BHK Apartment" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea name="description" defaultValue={property.description || ''} placeholder="Detailed description..." rows={4} disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 resize-none disabled:opacity-60" />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Price (NPR) *</label>
              <input type="number" name="price" required defaultValue={property.price || ''} placeholder="e.g. 15000000" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Category *</label>
              <select name="category" defaultValue={property.category || 'sale'} required disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Type *</label>
              <select name="property_type" defaultValue={property.property_type || 'house'} required disabled={isSubmitting}
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
              <select name="agentId" defaultValue={property.agentId || 'unassigned'} disabled={isSubmitting}
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
              <input type="text" name="landArea" defaultValue={property.landArea || ''} placeholder="e.g. 6.5 Aana, 7 Aana 1 Paisa" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Area Sqft */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Built-up Area (Sqft)</label>
              <input type="number" name="area_sqft" defaultValue={property.area_sqft || ''} placeholder="e.g. 1800" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Dimension */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Dimension (Haat/Feet)</label>
              <input type="text" name="dimension" defaultValue={property.dimension || ''} placeholder="e.g. H 28 | H 52 Haat" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Total Floors */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Total Floors</label>
              <input type="number" step="0.1" name="totalFloors" defaultValue={property.totalFloors || ''} placeholder="e.g. 2.5" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bedrooms</label>
              <input type="number" name="bedrooms" defaultValue={property.bedrooms || ''} placeholder="e.g. 5" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Bathrooms</label>
              <input type="number" name="bathrooms" defaultValue={property.bathrooms || ''} placeholder="e.g. 4" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Living Rooms */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Living Rooms</label>
              <input type="number" name="livingRooms" defaultValue={property.livingRooms || ''} placeholder="e.g. 2" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Kitchens */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Kitchens</label>
              <input type="number" name="kitchens" defaultValue={property.kitchens || ''} placeholder="e.g. 1" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Pillar Size */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Pillar Size</label>
              <input type="text" name="pillarSize" defaultValue={property.pillarSize || ''} placeholder="e.g. 14*14 Inchs" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Tank Capacity */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Water Tank Capacity</label>
              <input type="text" name="tankCapacity" defaultValue={property.tankCapacity || ''} placeholder="e.g. 16,000 Litres" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Year Built */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Year Built</label>
              <input type="number" name="yearBuilt" defaultValue={property.yearBuilt || ''} placeholder="e.g. 2075" disabled={isSubmitting}
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
              <input type="text" name="roadSize" defaultValue={property.roadSize || ''} placeholder="e.g. 20 Feet" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Road Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Road Type</label>
              <select name="roadType" defaultValue={property.roadType || ''} disabled={isSubmitting}
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
              <input type="text" name="faceDirection" defaultValue={property.faceDirection || ''} placeholder="e.g. West, East-South" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Parking */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Parking Space Details</label>
              <input type="text" name="parking" defaultValue={property.parking || ''} placeholder="e.g. 3 Cars & 4 Bikes" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* SECTION 4: Detailed Location */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-md font-bold text-gray-800">Detailed Location</h3>
              <p className="text-xs text-gray-400">Full location mapping coordinates and labels.</p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Address *</label>
              <input type="text" name="location" required defaultValue={property.location || ''} placeholder="e.g. Lazimpat, Kathmandu" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* City & Area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">City & Area</label>
              <input type="text" name="cityArea" defaultValue={property.cityArea || ''} placeholder="e.g. Pokhara, Amarsinghchowk" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Municipality */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Municipality / Local Government</label>
              <input type="text" name="municipality" defaultValue={property.municipality || ''} placeholder="e.g. Pokhara, Kathmandu" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Ward Number */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Ward Number</label>
              <input type="number" name="wardNumber" defaultValue={property.wardNumber || ''} placeholder="e.g. 10" disabled={isSubmitting}
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
              <select name="status" defaultValue={property.status || 'AVAILABLE'} disabled={isSubmitting}
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
              <select name="furnishing" defaultValue={property.furnishing || ''} disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60">
                <option value="">Select furnishing status</option>
                <option value="Full Furnished">Full Furnished</option>
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Image Upload Area */}
            <div className="md:col-span-2">
              <ImageUploadField defaultImages={property.images || []} />
            </div>

            {/* Features */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Features / Amenities (Comma Separated)</label>
              <input type="text" name="features" defaultValue={property.features?.join(', ') || ''} placeholder="Parking, Gym, Security" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Video Walkthrough URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Walkthrough Video URL (direct mp4/webm)</label>
              <input type="text" name="video_url" defaultValue={property.video_url || ''} placeholder="e.g. https://domain.com/video.mp4" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* YouTube URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">YouTube Video URL</label>
              <input type="text" name="youtube_url" defaultValue={property.youtube_url || ''} placeholder="e.g. https://youtube.com/watch?v=..." disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* TikTok URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">TikTok Video URL</label>
              <input type="text" name="tiktok_url" defaultValue={property.tiktok_url || ''} placeholder="e.g. https://tiktok.com/@user/video/..." disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Map URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Google Map Location / Embed URL</label>
              <input type="text" name="map_url" defaultValue={property.map_url || ''} placeholder="e.g. https://google.com/maps/... or https://maps.app.goo.gl/..." disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Latitude */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Latitude</label>
              <input type="number" step="any" name="latitude" defaultValue={property.latitude || ''} placeholder="e.g. 27.7172" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Longitude */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Longitude</label>
              <input type="number" step="any" name="longitude" defaultValue={property.longitude || ''} placeholder="e.g. 85.3240" disabled={isSubmitting}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
            </div>

            {/* Negotiable Checkbox */}
            <div className="flex items-center gap-2 pt-2 md:col-span-2">
              <input
                type="checkbox"
                name="negotiable"
                id="negotiable"
                defaultChecked={property.negotiable !== false}
                disabled={isSubmitting}
                className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
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
                  Updating Property...
                </>
              ) : (
                'Update Property'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
