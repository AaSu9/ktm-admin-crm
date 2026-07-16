'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createProperty(formData: {
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
  status?: string
  agentId?: string
}) {
  try {
    // Generate a unique short property ID like prop-1234
    const count = await prisma.property.count()
    const property_id = `prop-${count + 1 + Math.floor(Math.random() * 1000)}`

    const property = await prisma.property.create({
      data: {
        property_id,
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
    status?: string
    agentId?: string
  }
) {
  try {
    const data: any = { ...formData }
    if (formData.price !== undefined) data.price = Number(formData.price)
    if (formData.bedrooms !== undefined) data.bedrooms = formData.bedrooms ? Number(formData.bedrooms) : null
    if (formData.bathrooms !== undefined) data.bathrooms = formData.bathrooms ? Number(formData.bathrooms) : null
    if (formData.area_sqft !== undefined) data.area_sqft = formData.area_sqft ? Number(formData.area_sqft) : null

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
    await prisma.property.delete({
      where: { id },
    })
    revalidatePath('/properties')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete property:', error)
    return { success: false, error: error.message }
  }
}
