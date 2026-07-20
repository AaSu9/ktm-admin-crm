'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Priority } from '@prisma/client'
import { createNotification, notifyAdmins } from './notifications'
import { requireAuth } from '@/lib/authGuard'

export async function createLead(formData: {
  full_name: string
  phone: string
  email: string
  source?: string
  priority?: Priority
  budget?: number
  notes?: string[]
  property_id?: string
  agentId?: string
}) {
  try {
    const { userId, role } = await requireAuth()

    const lead = await prisma.lead.create({
      data: {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        source: formData.source || 'website',
        priority: formData.priority || 'MEDIUM',
        budget: formData.budget || null,
        notes: formData.notes || [],
        status: 'NEW',
        property_id: formData.property_id || null,
        agentId: formData.agentId || null,
      },
    })
    revalidatePath('/leads')

    // Auto-notify assigned agent
    if (lead.agentId) {
      createNotification({
        userId: lead.agentId,
        title: 'New Lead Assigned',
        message: `${formData.full_name} has been assigned to you.`,
        type: 'info',
      }).catch(() => {}) // fire-and-forget
    }
    // Notify admins
    notifyAdmins('New Lead', `${formData.full_name} submitted via ${formData.source || 'website'}`, 'info').catch(() => {})

    return { success: true, lead }
  } catch (error: any) {
    console.error('Failed to create lead:', error)
    return { success: false, error: error.message }
  }
}

export async function updateLead(
  id: string,
  formData: {
    full_name?: string
    phone?: string
    email?: string
    source?: string
    priority?: Priority
    budget?: number
    status?: string
    agentId?: string
  }
) {
  try {
    const { userId, role } = await requireAuth()

    if (role === 'AGENT') {
        const existingLead = await prisma.lead.findUnique({
            where: { id }
        })
        if(existingLead?.agentId !== userId) {
             throw new Error('Forbidden: You can only update your own leads')
        }
    }

    const updatedData: any = {}
    if (formData.full_name !== undefined) updatedData.full_name = formData.full_name
    if (formData.phone !== undefined) updatedData.phone = formData.phone
    if (formData.email !== undefined) updatedData.email = formData.email
    if (formData.source !== undefined) updatedData.source = formData.source
    if (formData.priority !== undefined) updatedData.priority = formData.priority
    if (formData.budget !== undefined) updatedData.budget = formData.budget
    if (formData.status !== undefined) updatedData.status = formData.status
    if (formData.agentId !== undefined) updatedData.agentId = formData.agentId
    
    const lead = await prisma.lead.update({
      where: { id },
      data: updatedData,
    })
    revalidatePath('/leads')
    revalidatePath(`/leads/${id}`)
    return { success: true, lead }
  } catch (error: any) {
    console.error('Failed to update lead:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteLead(id: string) {
  try {
    const { userId, role } = await requireAuth()

    if (role === 'AGENT') {
        const existingLead = await prisma.lead.findUnique({
            where: { id }
        })
        if(existingLead?.agentId !== userId) {
             throw new Error('Forbidden: You can only delete your own leads')
        }
    }

    await prisma.lead.delete({
      where: { id },
    })
    revalidatePath('/leads')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete lead:', error)
    return { success: false, error: error.message }
  }
}

export async function addLeadNote(id: string, note: string) {
  try {
    const { userId, role } = await requireAuth()
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { notes: true, agentId: true },
    })
    
    if (!lead) throw new Error('Lead not found')
    if (role === 'AGENT' && lead.agentId !== userId) {
         throw new Error('Forbidden: You can only add notes to your own leads')
    }
    
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })
    const formattedNote = `[${timestamp}] ${note}`
    
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        notes: {
          set: [...lead.notes, formattedNote],
        },
      },
    })
    revalidatePath(`/leads/${id}`)
    return { success: true, lead: updatedLead }
  } catch (error: any) {
    console.error('Failed to add note:', error)
    return { success: false, error: error.message }
  }
}
