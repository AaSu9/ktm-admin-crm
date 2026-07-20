'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/authGuard'

export async function createAgent(formData: {
  name: string
  email: string
  password: string
  phone?: string
  role?: 'AGENT' | 'ADMIN' | 'EDITOR'
}) {
  try {
    // Only ADMIN/SUPER_ADMIN can create agents
    await requireAdmin()

    const existing = await prisma.user.findUnique({
      where: { email: formData.email },
    })
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' }
    }

    const hashedPassword = await bcrypt.hash(formData.password, 12)

    const agent = await prisma.user.create({
      data: {
        name: formData.name,
        email: formData.email,
        password: hashedPassword,
        phone: formData.phone || null,
        role: formData.role || 'AGENT',
        isActive: true,
      },
    })

    revalidatePath('/agents')
    revalidatePath('/dashboard')
    return { success: true, agent: { id: agent.id, name: agent.name, email: agent.email } }
  } catch (error: any) {
    console.error('Failed to create agent:', error)
    return { success: false, error: error.message }
  }
}

export async function updateAgent(
  id: string,
  formData: {
    name?: string
    email?: string
    phone?: string
    role?: 'AGENT' | 'ADMIN' | 'EDITOR'
    isActive?: boolean
  }
) {
  try {
    // Only ADMIN/SUPER_ADMIN can update agents
    await requireAdmin()

    // Whitelist only allowed fields — prevent mass assignment
    const agent = await prisma.user.update({
      where: { id },
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone !== undefined ? formData.phone || null : undefined,
        role: formData.role,
        isActive: formData.isActive,
      },
    })
    revalidatePath('/agents')
    revalidatePath('/dashboard')
    return { success: true, agent }
  } catch (error: any) {
    console.error('Failed to update agent:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteAgent(id: string) {
  try {
    // Only ADMIN/SUPER_ADMIN can deactivate agents
    await requireAdmin()

    // Soft-deactivate instead of hard delete to preserve data integrity
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })
    revalidatePath('/agents')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to deactivate agent:', error)
    return { success: false, error: error.message }
  }
}
