'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'

export async function updateProfile(formData: {
  name: string
  phone?: string
}) {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Not authenticated' }

    const userId = (session.user as any).id
    if (!userId) {
      return { success: false, error: 'User ID not found' }
    }
    
    if (userId === 'demo-admin-id') {
      return { success: false, error: 'You are using an old demo session. Please log out and log back in to update your profile.' }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: formData.name,
        phone: formData.phone || null,
      },
    })

    revalidatePath('/settings')
    return { success: true, user: { name: user.name, phone: user.phone } }
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    return { success: false, error: error.message }
  }
}

export async function changePassword(formData: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: 'Not authenticated' }

    const userId = (session.user as any).id
    if (!userId) {
      return { success: false, error: 'User ID not found' }
    }
    
    if (userId === 'demo-admin-id') {
      return { success: false, error: 'You are using an old demo session. Please log out and log back in to change your password.' }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) return { success: false, error: 'User not found' }

    const isValid = await bcrypt.compare(formData.currentPassword, user.password)
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    if (formData.newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters' }
    }

    const hashedPassword = await bcrypt.hash(formData.newPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to change password:', error)
    return { success: false, error: error.message }
  }
}
