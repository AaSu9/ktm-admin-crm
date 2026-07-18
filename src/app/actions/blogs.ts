'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createBlog(formData: {
  title: string
  excerpt?: string
  content: string
  imageUrl?: string
  published?: boolean
  isFeatured?: boolean
}) {
  try {
    // Get a default author (first agent or admin)
    const author = await prisma.user.findFirst({
      where: { OR: [{ role: 'SUPER_ADMIN' }, { role: 'AGENT' }] },
    })

    if (!author) {
      throw new Error("No users exist to assign as author")
    }

    const blog = await (prisma as any).blog.create({
      data: {
        title: formData.title,
        excerpt: formData.excerpt || null,
        content: formData.content,
        imageUrl: formData.imageUrl || null,
        published: formData.published ?? true,
        isFeatured: formData.isFeatured ?? false,
        authorId: author.id,
      },
    })
    revalidatePath('/blogs')
    return { success: true, blog }
  } catch (error: any) {
    console.error('Failed to create blog:', error)
    return { success: false, error: error.message || 'Failed to create blog' }
  }
}

export async function deleteBlog(id: string) {
  try {
    await (prisma as any).blog.delete({
      where: { id },
    })
    revalidatePath('/blogs')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete blog:', error)
    return { success: false, error: error.message || 'Failed to delete blog' }
  }
}

export async function toggleBlogStatus(id: string, published: boolean) {
  try {
    const blog = await (prisma as any).blog.update({
      where: { id },
      data: { published },
    })
    revalidatePath('/blogs')
    return { success: true, blog }
  } catch (error: any) {
    console.error('Failed to update blog status:', error)
    return { success: false, error: error.message || 'Failed to update blog status' }
  }
}
export async function getBlog(id: string) {
  try {
    const blog = await (prisma as any).blog.findUnique({
      where: { id },
      include: { author: true },
    })
    return { success: true, blog }
  } catch (error: any) {
    console.error('Failed to get blog:', error)
    return { success: false, error: error.message || 'Failed to get blog' }
  }
}

export async function updateBlog(id: string, data: { title?: string; excerpt?: string; content?: string; imageUrl?: string; published?: boolean; isFeatured?: boolean }) {
  try {
    const blog = await (prisma as any).blog.update({
      where: { id },
      data,
    })
    revalidatePath('/blogs')
    return { success: true, blog }
  } catch (error: any) {
    console.error('Failed to update blog:', error)
    return { success: false, error: error.message || 'Failed to update blog' }
  }
}
