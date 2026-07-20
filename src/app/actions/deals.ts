'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createNotification, notifyAdmins } from './notifications'
import { requireAuth } from '@/lib/authGuard'

export async function createDeal(formData: {
  title: string
  propertyId: string
  buyerId?: string
  sellerId?: string
  agentId: string
  dealValue: number
  commissionRate: number
  status: string
  closingDate: string
  notes?: string
}) {
  try {
    await requireAuth()
    const dealValue = Number(formData.dealValue)
    const commissionRate = Number(formData.commissionRate)
    const commissionEarned = dealValue * (commissionRate / 100)

    const deal = await prisma.deal.create({
      data: {
        title: formData.title,
        propertyId: formData.propertyId,
        buyerId: formData.buyerId || null,
        sellerId: formData.sellerId || null,
        agentId: formData.agentId,
        dealValue,
        commissionRate,
        commissionEarned,
        status: formData.status || 'PENDING',
        closingDate: new Date(formData.closingDate),
        notes: formData.notes || null,
      },
    })

    // Optionally update the property status to SOLD if it is closed won/won
    if (formData.status === 'PAID' || formData.status === 'CLOSED_WON') {
      await prisma.property.update({
        where: { id: formData.propertyId },
        data: { status: 'SOLD' },
      })
    }

    revalidatePath('/deals')
    revalidatePath('/dashboard')
    revalidatePath(`/properties/${formData.propertyId}`)
    if (formData.buyerId) revalidatePath(`/customers/${formData.buyerId}`)
    if (formData.sellerId) revalidatePath(`/customers/${formData.sellerId}`)

    // Auto-notify agent
    createNotification({
      userId: formData.agentId,
      title: 'Deal Logged',
      message: `${formData.title} — Value: NPR ${dealValue.toLocaleString()}`,
      type: 'success',
    }).catch(() => {})
    // Notify admins
    notifyAdmins('New Deal', `${formData.title} — NPR ${dealValue.toLocaleString()}`, 'success').catch(() => {})
    
    return { success: true, deal }
  } catch (error: any) {
    console.error('Failed to create deal:', error)
    return { success: false, error: error.message }
  }
}

export async function updateDealStatus(id: string, status: string) {
  try {
    await requireAuth()
    const deal = await prisma.deal.update({
      where: { id },
      data: { status },
    })

    // If deal status is paid, we can set property to sold
    if (status === 'PAID') {
      await prisma.property.update({
        where: { id: deal.propertyId },
        data: { status: 'SOLD' },
      })
    }

    revalidatePath('/deals')
    revalidatePath('/dashboard')
    revalidatePath(`/properties/${deal.propertyId}`)
    if (deal.buyerId) revalidatePath(`/customers/${deal.buyerId}`)
    if (deal.sellerId) revalidatePath(`/customers/${deal.sellerId}`)
    
    return { success: true, deal }
  } catch (error: any) {
    console.error('Failed to update deal status:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteDeal(id: string) {
  try {
    await requireAuth()
    const deal = await prisma.deal.delete({
      where: { id },
    })
    revalidatePath('/deals')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete deal:', error)
    return { success: false, error: error.message }
  }
}
