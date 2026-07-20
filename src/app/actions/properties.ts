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
        pillarSize: formData.pillarSize || null,
        tankCapacity: formData.tankCapacity || null,
        roadSize: formData.roadSize || null,
        roadType: formData.roadType || null,
        landArea: formData.landArea || null,
        livingRooms: formData.livingRooms ? Number(formData.livingRooms) : null,
        kitchens: formData.kitchens ? Number(formData.kitchens) : null,
        faceDirection: formData.faceDirection || null,
        parking: formData.parking || null,
        totalFloors: formData.totalFloors ? Number(formData.totalFloors) : null,
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : null,
        furnishing: formData.furnishing || null,
        negotiable: formData.negotiable !== undefined ? formData.negotiable : true,
        cityArea: formData.cityArea || null,
        municipality: formData.municipality || null,
        wardNumber: formData.wardNumber ? Number(formData.wardNumber) : null,
        dimension: formData.dimension || null,
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
    
    // Add new fields to whitelist
    if (formData.pillarSize !== undefined) data.pillarSize = formData.pillarSize || null
    if (formData.tankCapacity !== undefined) data.tankCapacity = formData.tankCapacity || null
    if (formData.roadSize !== undefined) data.roadSize = formData.roadSize || null
    if (formData.roadType !== undefined) data.roadType = formData.roadType || null
    if (formData.landArea !== undefined) data.landArea = formData.landArea || null
    if (formData.livingRooms !== undefined) data.livingRooms = formData.livingRooms ? Number(formData.livingRooms) : null
    if (formData.kitchens !== undefined) data.kitchens = formData.kitchens ? Number(formData.kitchens) : null
    if (formData.faceDirection !== undefined) data.faceDirection = formData.faceDirection || null
    if (formData.parking !== undefined) data.parking = formData.parking || null
    if (formData.totalFloors !== undefined) data.totalFloors = formData.totalFloors ? Number(formData.totalFloors) : null
    if (formData.yearBuilt !== undefined) data.yearBuilt = formData.yearBuilt ? Number(formData.yearBuilt) : null
    if (formData.furnishing !== undefined) data.furnishing = formData.furnishing || null
    if (formData.negotiable !== undefined) data.negotiable = formData.negotiable
    if (formData.cityArea !== undefined) data.cityArea = formData.cityArea || null
    if (formData.municipality !== undefined) data.municipality = formData.municipality || null
    if (formData.wardNumber !== undefined) data.wardNumber = formData.wardNumber ? Number(formData.wardNumber) : null
    if (formData.dimension !== undefined) data.dimension = formData.dimension || null

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
