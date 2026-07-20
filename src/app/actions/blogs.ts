'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireEditor } from '@/lib/authGuard'

export async function createBlog(formData: {
  title: string
  excerpt?: string
  content: string
  imageUrl?: string
  published?: boolean
  isFeatured?: boolean
}) {
  try {
    // Only EDITOR/ADMIN/SUPER_ADMIN can create blogs
    const { userId } = await requireEditor()

    // Use the authenticated user as the author
    const blog = await (prisma as any).blog.create({
      data: {
        title: formData.title,
        excerpt: formData.excerpt || null,
        content: formData.content,
        imageUrl: formData.imageUrl || null,
        published: formData.published ?? true,
        isFeatured: formData.isFeatured ?? false,
        authorId: userId,
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
    // Only EDITOR/ADMIN/SUPER_ADMIN can delete blogs
    await requireEditor()

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
    // Only EDITOR/ADMIN/SUPER_ADMIN can toggle blog status
    await requireEditor()

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
    // Require authentication to view blog in CRM
    await requireAuth()

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
    // Only EDITOR/ADMIN/SUPER_ADMIN can update blogs
    await requireEditor()

    // Whitelist allowed fields only — prevents mass assignment of authorId etc.
    const safeData: any = {}
    if (data.title !== undefined) safeData.title = data.title
    if (data.excerpt !== undefined) safeData.excerpt = data.excerpt
    if (data.content !== undefined) safeData.content = data.content
    if (data.imageUrl !== undefined) safeData.imageUrl = data.imageUrl
    if (data.published !== undefined) safeData.published = data.published
    if (data.isFeatured !== undefined) safeData.isFeatured = data.isFeatured

    const blog = await (prisma as any).blog.update({
      where: { id },
      data: safeData,
    })
    revalidatePath('/blogs')
    return { success: true, blog }
  } catch (error: any) {
    console.error('Failed to update blog:', error)
    return { success: false, error: error.message || 'Failed to update blog' }
  }
}
