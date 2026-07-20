'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { requireAuth } from '@/lib/authGuard'

export async function getNotifications() {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, notifications: [], unreadCount: 0 }

    const userId = (session.user as any).id
    if (!userId || userId === 'demo-admin-id') {
      // Return demo notifications for demo mode
      return {
        success: true,
        notifications: [
          { id: 'demo-1', title: 'New Lead', message: 'Anup Gurung submitted an inquiry', type: 'info', read: false, createdAt: new Date() },
          { id: 'demo-2', title: 'Visit Scheduled', message: 'Bikash Shrestha — Tomorrow at 10 AM', type: 'success', read: false, createdAt: new Date(Date.now() - 3600000) },
          { id: 'demo-3', title: 'Property Sold', message: 'Land Plot in Bhaktapur has been sold', type: 'success', read: true, createdAt: new Date(Date.now() - 7200000) },
        ],
        unreadCount: 2,
      }
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return { success: true, notifications, unreadCount }
  } catch (error: any) {
    console.error('Failed to get notifications:', error)
    return { success: false, notifications: [], unreadCount: 0 }
  }
}

export async function markNotificationRead(id: string) {
  try {
    const { userId } = await requireAuth()
    if (id.startsWith('demo-')) return { success: true }

    // Add ownership check to prevent marking others' notifications as read
    const notification = await prisma.notification.findUnique({ where: { id } })
    if (notification?.userId !== userId) {
         throw new Error('Forbidden')
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to mark notification read:', error)
    return { success: false, error: error.message }
  }
}

export async function markAllNotificationsRead() {
  try {
    const session = await auth()
    if (!session?.user) return { success: false }

    const userId = (session.user as any).id
    if (!userId || userId === 'demo-admin-id') return { success: true }

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to mark all notifications read:', error)
    return { success: false, error: error.message }
  }
}

export async function createNotification(data: {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}) {
  try {
    if (data.userId === 'demo-admin-id') return { success: true }

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    })
    return { success: true, notification }
  } catch (error: any) {
    console.error('Failed to create notification:', error)
    return { success: false, error: error.message }
  }
}

// Helper: notify all admins (used by system events)
export async function notifyAdmins(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      select: { id: true },
    })

    await Promise.all(
      admins.map((admin) =>
        createNotification({ userId: admin.id, title, message, type })
      )
    )
    return { success: true }
  } catch (error: any) {
    console.error('Failed to notify admins:', error)
    return { success: false }
  }
}
