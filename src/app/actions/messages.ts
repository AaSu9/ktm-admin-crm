'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function markMessageRead(id: string) {
  try {
    const message = await prisma.lead.update({
      where: { id },
      data: { status: 'CONTACTED' },
    })
    revalidatePath('/messages')
    return { success: true, message }
  } catch (error: any) {
    console.error('Failed to mark message as read:', error)
    return { success: false, error: error.message }
  }
}

export async function replyToMessage(id: string, reply: string) {
  try {
    const message = await prisma.lead.update({
      where: { id },
      data: { 
        status: 'CONTACTED',
        notes: { set: [reply] } 
      },
    })
    revalidatePath('/messages')
    return { success: true, message }
  } catch (error: any) {
    console.error('Failed to reply to message:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteMessage(id: string) {
  try {
    await prisma.lead.delete({ where: { id } })
    revalidatePath('/messages')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete message:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkMarkMessagesRead(ids: string[]) {
  try {
    await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data: { status: 'CONTACTED' },
    })
    revalidatePath('/messages')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to bulk mark messages:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkDeleteMessages(ids: string[]) {
  try {
    await prisma.lead.deleteMany({
      where: { id: { in: ids } },
    })
    revalidatePath('/messages')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to bulk delete messages:', error)
    return { success: false, error: error.message }
  }
}
