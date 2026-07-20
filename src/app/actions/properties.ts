'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/authGuard'

export async function createProperty(formData: {
  property_id: string
  title: string
  description?: string
  location: string
  price: number
  category: string
  property_type: string
  bedrooms?: number
  bathrooms?: number
  area_sqft?: number
  images?: string[]
  features?: string[]
  video_url?: string
  youtube_url?: string
  tiktok_url?: string
  map_url?: string
  latitude?: number
  longitude?: number
  status?: string
  agentId?: string
}) {
  try {
    // Require authentication
    await requireAuth()

    // Check if property_id already exists
    const existing = await prisma.property.findUnique({
      where: { property_id: formData.property_id }
    })
    if (existing) {
      return { success: false, error: 'Property ID already exists. Please choose a unique Property ID.' }
    }

    const property = await prisma.property.create({
      data: {
        property_id: formData.property_id,
        title: formData.title,
        description: formData.description || null,
        location: formData.location,
        price: Number(formData.price),
        category: formData.category,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        area_sqft: formData.area_sqft ? Number(formData.area_sqft) : null,
        images: formData.images || [],
        features: formData.features || [],
        video_url: formData.video_url || null,
        youtube_url: formData.youtube_url || null,
        tiktok_url: formData.tiktok_url || null,
        map_url: formData.map_url || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        status: formData.status || 'AVAILABLE',
        agentId: formData.agentId || null,
      },
    })
    revalidatePath('/properties')
    return { success: true, property }
  } catch (error: any) {
    console.error('Failed to create property:', error)
    return { success: false, error: error.message }
  }
}

export async function updateProperty(
  id: string,
  formData: {
    property_id?: string
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
    features?: string[]
    video_url?: string
    youtube_url?: string
    tiktok_url?: string
    map_url?: string
    latitude?: number
    longitude?: number
    status?: string
    agentId?: string
  }
) {
  try {
    // Require authentication
    await requireAuth()

    if (formData.property_id) {
      const existing = await prisma.property.findUnique({
        where: { property_id: formData.property_id }
      })
      if (existing && existing.id !== id) {
        return { success: false, error: 'Property ID already exists. Please choose a unique Property ID.' }
      }
    }

    // Whitelist allowed fields — prevents mass assignment
    const data: any = {}
    if (formData.property_id !== undefined) data.property_id = formData.property_id
    if (formData.title !== undefined) data.title = formData.title
    if (formData.description !== undefined) data.description = formData.description
    if (formData.location !== undefined) data.location = formData.location
    if (formData.price !== undefined) data.price = Number(formData.price)
    if (formData.category !== undefined) data.category = formData.category
    if (formData.property_type !== undefined) data.property_type = formData.property_type
    if (formData.bedrooms !== undefined) data.bedrooms = formData.bedrooms ? Number(formData.bedrooms) : null
    if (formData.bathrooms !== undefined) data.bathrooms = formData.bathrooms ? Number(formData.bathrooms) : null
    if (formData.area_sqft !== undefined) data.area_sqft = formData.area_sqft ? Number(formData.area_sqft) : null
    if (formData.images !== undefined) data.images = formData.images
    if (formData.features !== undefined) data.features = formData.features
    if (formData.video_url !== undefined) data.video_url = formData.video_url || null
    if (formData.youtube_url !== undefined) data.youtube_url = formData.youtube_url || null
    if (formData.tiktok_url !== undefined) data.tiktok_url = formData.tiktok_url || null
    if (formData.map_url !== undefined) data.map_url = formData.map_url || null
    if (formData.latitude !== undefined) data.latitude = formData.latitude ? Number(formData.latitude) : null
    if (formData.longitude !== undefined) data.longitude = formData.longitude ? Number(formData.longitude) : null
    if (formData.status !== undefined) data.status = formData.status
    if (formData.agentId !== undefined) data.agentId = formData.agentId || null

    const property = await prisma.property.update({
      where: { id },
      data,
    })
    revalidatePath('/properties')
    revalidatePath(`/properties/${id}`)
    return { success: true, property }
  } catch (error: any) {
    console.error('Failed to update property:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteProperty(id: string) {
  try {
    // Require authentication
    await requireAuth()

    await prisma.$transaction([
      // 1. Disconnect any Leads linked to this property
      prisma.lead.updateMany({
        where: { property_id: id },
        data: { property_id: null },
      }),
      // 2. Delete any site Visits scheduled for this property
      prisma.visit.deleteMany({
        where: { propertyId: id },
      }),
      // 3. Delete any Deals linked to this property
      prisma.deal.deleteMany({
        where: { propertyId: id },
      }),
      // 4. Finally delete the Property
      prisma.property.delete({
        where: { id },
      }),
    ])
    revalidatePath('/properties')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete property:', error)
    return { success: false, error: error.message }
  }
}
