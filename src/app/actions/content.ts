'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getContentByKey(key: string) {
  try {
    const content = await prisma.content.findUnique({
      where: { key },
    })
    return { success: true, content }
  } catch (error: any) {
    console.error('Failed to get content:', error)
    return { success: false, error: error.message, content: null }
  }
}

export async function updateContent(formData: {
  key: string
  title?: string
  subtitle?: string
  body?: string
  images?: string[]
  isActive?: boolean
}) {
  try {
    const content = await prisma.content.upsert({
      where: { key: formData.key },
      update: {
        title: formData.title ?? undefined,
        subtitle: formData.subtitle ?? undefined,
        body: formData.body ?? undefined,
        images: formData.images ?? undefined,
        isActive: formData.isActive ?? undefined,
      },
      create: {
        key: formData.key,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        body: formData.body || null,
        images: formData.images || [],
        isActive: formData.isActive ?? true,
      },
    })
    revalidatePath('/content')
    revalidatePath(`/content/${formData.key}`)
    return { success: true, content }
  } catch (error: any) {
    console.error('Failed to update content:', error)
    return { success: false, error: error.message }
  }
}
