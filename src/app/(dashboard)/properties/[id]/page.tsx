import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { formatDate, formatPrice, getStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, DollarSign, User, Shield, Calendar, Users, Sparkles, CheckCircle, Tag, Eye } from 'lucide-react'
import { deleteProperty } from '@/app/actions/properties'
import DeleteForm from '@/components/DeleteForm'

export default async function PropertyDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const propId = params.id
  let property: any = null
  let matchedLeads: any[] = []
  let visits: any[] = []
  let dbError = false

  try {
    property = await prisma.property.findUnique({
      where: { id: propId },
      include: { agent: true, visits: { include: { customer: true } } },
    })

    if (!property && propId !== 'demo-id') {
      return notFound()
    }

    if (property) {
      // Find leads whose budget >= property price and categories/types match
      matchedLeads = await prisma.lead.findMany({
        where: {
          AND: [
            { OR: [{ budget: null }, { budget: { gte: property.price } }] },
            property.category ? { inquiry_type: { equals: property.category, mode: 'insensitive' } } : {},
            property.property_type ? { property_interest: { equals: property.property_type, mode: 'insensitive' } } : {},
          ]
        },
        take: 5,
      })

      visits = property.visits
    }
  } catch (error) {
    console.error("DB Query failed in Property Detail Page, showing mock fallback:", error)
    dbError = true
  }

  // Fallback Mock Data for demo mode
  if (dbError || propId === 'demo-id') {
    property = property || {
      id: 'demo-id',
      property_id: 'prop-1',
      title: 'Luxury 3BHK Apartment in Lazimpat',
      description: 'A stunning luxury apartment with modern amenities in the heart of Kathmandu. Spacious rooms, modular kitchen, large balcony with valley views, and 24/7 security services.',
      location: 'Lazimpat, Kathmandu',
      price: 15000000,
      category: 'sale',
      property_type: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1800,
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
      status: 'AVAILABLE',
      features: ['Parking', 'Gym', 'Swimming Pool', '24/7 Security'],
      agent: {
        name: 'Raj Kumar Sharma',
        phone: '+977-9812345678',
      },
    }

    matchedLeads = [
      {
        id: 'mock-lead-1',
        full_name: 'Anup Gurung',
        phone: '+977-9811234567',
        email: 'anup@email.com',
        budget: 20000000,
        priority: 'HIGH',
        status: 'NEW',
      },
      {
        id: 'mock-lead-2',
        full_name: 'Deepak Bista',
        phone: '+977-9833456789',
        email: 'deepak@email.com',
        budget: 16000000,
        priority: 'MEDIUM',
        status: 'INTERESTED',
      }
    ]

    visits = [
      {
        id: 'mock-visit-1',
        customer: {
          name: 'Bikash Shrestha',
          phone: '+977-9841234567',
        },
        date: new Date('2026-06-28'),
        time: '10:00 AM',
        status: 'SCHEDULED',
        notes: 'Client wants to inspect building safety and garage space.'
      }
    ]
  }

  async function handleDeleteAction() {
    'use server'
    await deleteProperty(property.id)
    redirect('/properties')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
        <div className="flex gap-2">
          {dbError && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              ⚠️ Sandbox Mode
            </span>
          )}
          <Link href={`/properties/${property.id}/edit`} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            Edit Property
          </Link>
          <DeleteForm action={handleDeleteAction} confirmMessage="Delete this property permanently?" className="inline">
            <button type="submit" className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
              Delete
            </button>
          </DeleteForm>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image, Info, Features */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Gallery Image */}
            <div className="h-80 w-full bg-gray-100 relative">
              <img src={property.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'} alt={property.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-emerald-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-xl shadow">
                  For {property.category}
                </span>
                <span className={cn('font-bold text-xs uppercase px-3 py-1 rounded-xl shadow', getStatusColor(property.status))}>
                  {property.status}
                </span>
              </div>
            </div>

            {/* Profile body */}
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{property.title}</h1>
                <p className="flex items-center gap-1 text-sm text-gray-400 mt-2">
                  <MapPin className="h-4 w-4 text-gray-400" /> {property.location}
                </p>
              </div>

              {/* Price & ID Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Property Price</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{formatPrice(property.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Property ID</p>
                  <p className="text-sm font-bold text-gray-800 mt-2">{property.property_id}</p>
                </div>
              </div>

              {/* Specifications */}
              <div className="grid grid-cols-3 gap-2 text-center border-y border-gray-100 py-4">
                <div>
                  <p className="text-lg font-bold text-gray-800">{property.bedrooms || '—'}</p>
                  <p className="text-xs text-gray-400">Bedrooms</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{property.bathrooms || '—'}</p>
                  <p className="text-xs text-gray-400">Bathrooms</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{property.area_sqft ? `${property.area_sqft} sqft` : '—'}</p>
                  <p className="text-xs text-gray-400">Area</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{property.description || 'No description provided.'}</p>
              </div>

              {/* Features */}
              <div className="space-y-3.5 pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-800">Features & Amenities</h3>
                {property.features?.length === 0 ? (
                  <p className="text-gray-400 text-xs italic">No features listed.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {property.features?.map((f: string, i: number) => (
                      <span key={i} className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-xl">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Links & Geolocation Section */}
              {(property.video_url || property.youtube_url || property.tiktok_url || property.map_url || property.latitude || property.longitude) && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800">Links & Geolocation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Walkthrough Video */}
                    {property.video_url && (
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Walkthrough Video</p>
                        <a href={property.video_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 break-all hover:underline">
                          View Video File
                        </a>
                      </div>
                    )}

                    {/* YouTube Video */}
                    {property.youtube_url && (
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">YouTube Walkthrough</p>
                        <a href={property.youtube_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-red-600 hover:text-red-700 break-all hover:underline">
                          Watch on YouTube
                        </a>
                      </div>
                    )}

                    {/* TikTok Video */}
                    {property.tiktok_url && (
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">TikTok Walkthrough</p>
                        <a href={property.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-800 hover:text-black break-all hover:underline">
                          Watch on TikTok
                        </a>
                      </div>
                    )}

                    {/* Google Map URL */}
                    {property.map_url && (
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Map Location</p>
                        <a href={property.map_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-700 break-all hover:underline">
                          Open in Google Maps
                        </a>
                      </div>
                    )}

                    {/* Coordinates */}
                    {(property.latitude || property.longitude) && (
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1 sm:col-span-2">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Coordinates (GPS)</p>
                        <p className="text-sm font-bold text-gray-700">
                          Latitude: {property.latitude || '—'} · Longitude: {property.longitude || '—'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Agent Profile, Visits, Matched Leads */}
        <div className="space-y-6">
          {/* Agent info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-md">Assigned Agent</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 font-bold rounded-2xl flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{property.agent?.name || 'Unassigned'}</p>
                <p className="text-xs text-gray-400">{property.agent?.phone || 'No phone number'}</p>
              </div>
            </div>
          </div>

          {/* Matched Leads */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-md flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Matches Found ({matchedLeads.length})
            </h3>
            <p className="text-xs text-gray-400">Leads looking for a similar property ({property.property_type} for {property.category}) with a matching budget:</p>
            <div className="space-y-3 pt-1">
              {matchedLeads.length === 0 ? (
                <p className="text-gray-400 text-xs italic">No matching leads found.</p>
              ) : (
                matchedLeads.map((l) => (
                  <div key={l.id} className="border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:border-emerald-100 transition-all">
                    <div>
                      <p className="font-bold text-gray-800 text-xs">{l.full_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Budget: {l.budget ? formatPrice(l.budget) : 'none'}</p>
                    </div>
                    <Link href={`/leads/${l.id}`} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Visits schedule */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-md flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" /> Scheduled Site Visits
            </h3>
            <div className="space-y-3">
              {visits.length === 0 ? (
                <p className="text-gray-400 text-xs italic">No site visits scheduled for this property.</p>
              ) : (
                visits.map((v) => (
                  <div key={v.id} className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
                    <p className="font-bold text-gray-800 text-xs">{v.customer.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(v.date)} at {v.time}</p>
                    <span className={cn('inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1',
                      v.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' : v.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    )}>
                      {v.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
