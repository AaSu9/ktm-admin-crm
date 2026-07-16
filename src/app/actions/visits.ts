'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { VisitStatus } from '@prisma/client'
import { createNotification } from './notifications'

export async function scheduleVisit(formData: {
  customerId: string
  propertyId: string
  agentId?: string
  date: string // YYYY-MM-DD
  time: string // HH:MM AM/PM
  notes?: string
}) {
  try {
    const visit = await prisma.visit.create({
      data: {
        customerId: formData.customerId,
        propertyId: formData.propertyId,
        agentId: formData.agentId || null,
        date: new Date(formData.date),
        time: formData.time,
        status: 'SCHEDULED',
        notes: formData.notes || null,
      },
    })
    revalidatePath('/visits')
    revalidatePath(`/customers/${formData.customerId}`)
    revalidatePath(`/properties/${formData.propertyId}`)

    // Auto-notify assigned agent
    if (visit.agentId) {
      createNotification({
        userId: visit.agentId,
        title: 'Visit Scheduled',
        message: `New visit on ${formData.date} at ${formData.time}`,
        type: 'info',
      }).catch(() => {})
    }

    return { success: true, visit }
  } catch (error: any) {
    console.error('Failed to schedule visit:', error)
    return { success: false, error: error.message }
  }
}

export async function updateVisitStatus(
  id: string,
  status: VisitStatus,
  notes?: string
) {
  try {
    const data: any = { status }
    if (notes !== undefined) {
      data.notes = notes
    }
    const visit = await prisma.visit.update({
      where: { id },
      data,
    })
    revalidatePath('/visits')
    revalidatePath(`/customers/${visit.customerId}`)
    revalidatePath(`/properties/${visit.propertyId}`)
    return { success: true, visit }
  } catch (error: any) {
    console.error('Failed to update visit status:', error)
    return { success: false, error: error.message }
  }
}

export async function addVisitNotes(id: string, notes: string) {
  try {
    const visit = await prisma.visit.update({
      where: { id },
      data: { notes },
    })
    revalidatePath('/visits')
    revalidatePath(`/customers/${visit.customerId}`)
    revalidatePath(`/properties/${visit.propertyId}`)
    return { success: true, visit }
  } catch (error: any) {
    console.error('Failed to add visit notes:', error)
    return { success: false, error: error.message }
  }
}
