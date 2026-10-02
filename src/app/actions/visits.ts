'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { VisitStatus } from '@prisma/client'
import { createNotification } from './notifications'
import { requireAuth } from '@/lib/authGuard'
import { logAudit } from '@/lib/audit'
import { syncVisitToGoogleCalendar, deleteGoogleCalendarVisit } from '@/lib/googleCalendar'

export interface CreateVisitInput {
  // Existing Customer OR New Customer Inline
  customerId?: string
  newCustomer?: {
    name: string
    phone: string
    email?: string
    address?: string
    notes?: string
    source?: string
    type?: string
  }
  propertyId: string
  agentId?: string
  date: string // YYYY-MM-DD
  time: string // Start time, e.g. "10:00 AM"
  endTime?: string // End time, e.g. "11:00 AM"
  visitType?: string // Site Walkthrough, Virtual Tour, Inspection, Final Review
  location?: string
  purpose?: string
  notes?: string
  status?: VisitStatus
}

/**
 * Schedule / Create a customer visit (Admin or Agent)
 */
export async function scheduleVisit(input: CreateVisitInput) {
  try {
    const authUser = await requireAuth()

    let finalCustomerId = input.customerId

    // If new customer details provided, create the customer first
    if (!finalCustomerId && input.newCustomer) {
      if (!input.newCustomer.name || !input.newCustomer.phone) {
        return { success: false, error: 'Customer name and phone number are required.' }
      }

      // Check if customer with this email or phone already exists
      let existingCustomer = null
      if (input.newCustomer.email) {
        existingCustomer = await prisma.customer.findUnique({
          where: { email: input.newCustomer.email },
        })
      }

      if (!existingCustomer) {
        const createdCustomer = await prisma.customer.create({
          data: {
            name: input.newCustomer.name.trim(),
            phone: input.newCustomer.phone.trim(),
            email: input.newCustomer.email?.trim() || null,
            address: input.newCustomer.address?.trim() || null,
            notes: input.newCustomer.notes?.trim() || null,
            source: input.newCustomer.source || 'DIRECT_VISIT',
            type: input.newCustomer.type || 'BUYER',
          },
        })
        finalCustomerId = createdCustomer.id

        await logAudit({
          userId: authUser.userId,
          action: 'CREATE_CUSTOMER',
          entityType: 'CUSTOMER',
          entityId: createdCustomer.id,
          description: `Created customer "${createdCustomer.name}" during visit scheduling`,
        })
      } else {
        finalCustomerId = existingCustomer.id
      }
    }

    if (!finalCustomerId) {
      return { success: false, error: 'Please select an existing customer or provide new customer details.' }
    }

    if (!input.propertyId) {
      return { success: false, error: 'Property selection is required.' }
    }

    if (!input.date || !input.time) {
      return { success: false, error: 'Visit date and time are required.' }
    }

    // Agent assignment logic:
    // If Super Admin/Admin creates, they can assign to any agent or themselves.
    // If Agent creates, if no agent specified, defaults to the logged-in agent.
    let assignedAgentId = input.agentId
    if (!assignedAgentId || assignedAgentId === 'unassigned') {
      if (authUser.role === 'AGENT') {
        assignedAgentId = authUser.userId
      } else {
        assignedAgentId = undefined
      }
    }

    const visit = await prisma.visit.create({
      data: {
        customerId: finalCustomerId,
        propertyId: input.propertyId,
        agentId: assignedAgentId || null,
        date: new Date(input.date),
        time: input.time,
        endTime: input.endTime || null,
        visitType: input.visitType || 'Site Walkthrough',
        location: input.location || null,
        purpose: input.purpose || null,
        notes: input.notes || null,
        status: input.status || 'SCHEDULED',
      },
      include: {
        customer: true,
        property: true,
        agent: true,
      },
    })

    // Log Audit
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_VISIT',
      entityType: 'VISIT',
      entityId: visit.id,
      description: `${authUser.name} scheduled visit #${visit.id.slice(0, 8)} for ${visit.customer.name} on property "${visit.property.title}"`,
      metadata: {
        date: input.date,
        time: input.time,
        agent: visit.agent?.name,
        property: visit.property.title,
      },
    })

    // Auto-notify assigned agent if different from author
    if (visit.agentId && visit.agentId !== authUser.userId) {
      createNotification({
        userId: visit.agentId,
        title: 'New Visit Assigned',
        message: `Visit with ${visit.customer.name} on ${input.date} at ${input.time}`,
        type: 'info',
        link: '/visits',
      }).catch(() => {})
    }

    // Synchronize to Google Calendar
    let googleSyncMsg = ''
    try {
      const googleResult = await syncVisitToGoogleCalendar(visit.id, authUser.userId)
      if (!googleResult.success && googleResult.error !== 'Google Calendar is not connected.') {
        googleSyncMsg = 'Visit created, but Google Calendar synchronization failed.'
      }
    } catch (gErr) {
      console.error('Google Calendar sync failed during visit creation:', gErr)
      googleSyncMsg = 'Visit created, but Google Calendar synchronization failed.'
    }

    revalidatePath('/visits')
    revalidatePath('/dashboard')
    revalidatePath(`/customers/${finalCustomerId}`)
    revalidatePath(`/properties/${input.propertyId}`)

    return {
      success: true,
      visit,
      message: googleSyncMsg || 'Visit scheduled successfully.',
      googleWarning: !!googleSyncMsg,
    }
  } catch (error) {
    console.error('Failed to schedule visit:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule visit' }
  }
}

/**
 * Update visit details (Date, Time, Location, Agent, Notes, etc.)
 */
export async function updateVisit(
  id: string,
  data: {
    date?: string
    time?: string
    endTime?: string
    agentId?: string | null
    propertyId?: string
    customerId?: string
    visitType?: string
    location?: string
    purpose?: string
    notes?: string
    status?: VisitStatus
  }
) {
  try {
    const authUser = await requireAuth()

    const existing = await prisma.visit.findUnique({
      where: { id },
      include: { agent: true, customer: true, property: true },
    })

    if (!existing) return { success: false, error: 'Visit not found' }

    // Permission check: Agents can only edit their own visits, Admin/Super Admin can edit any
    if (authUser.role === 'AGENT' && existing.agentId && existing.agentId !== authUser.userId) {
      return { success: false, error: 'You do not have permission to modify this visit.' }
    }

    const updatePayload: Record<string, any> = {}
    if (data.date) updatePayload.date = new Date(data.date)
    if (data.time) updatePayload.time = data.time
    if (data.endTime !== undefined) updatePayload.endTime = data.endTime
    if (data.agentId !== undefined) updatePayload.agentId = data.agentId || null
    if (data.propertyId) updatePayload.propertyId = data.propertyId
    if (data.customerId) updatePayload.customerId = data.customerId
    if (data.visitType) updatePayload.visitType = data.visitType
    if (data.location !== undefined) updatePayload.location = data.location
    if (data.purpose !== undefined) updatePayload.purpose = data.purpose
    if (data.notes !== undefined) updatePayload.notes = data.notes
    if (data.status) updatePayload.status = data.status

    const updated = await prisma.visit.update({
      where: { id },
      data: updatePayload,
      include: { customer: true, property: true, agent: true },
    })

    // Log Audit
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'UPDATE_VISIT',
      entityType: 'VISIT',
      entityId: id,
      description: `${authUser.name} updated visit #${id.slice(0, 8)} (${updated.customer.name})`,
      metadata: updatePayload,
    })

    // If cancelled, delete from Google Calendar; otherwise update event
    if (data.status === 'CANCELLED') {
      await deleteGoogleCalendarVisit(id, authUser.userId).catch(() => {})
    } else {
      await syncVisitToGoogleCalendar(id, authUser.userId).catch(() => {})
    }

    revalidatePath('/visits')
    revalidatePath('/dashboard')
    revalidatePath(`/customers/${updated.customerId}`)
    revalidatePath(`/properties/${updated.propertyId}`)

    return { success: true, visit: updated }
  } catch (error) {
    console.error('Failed to update visit:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update visit' }
  }
}

/**
 * Update visit status (e.g. Completed, Confirmed, Cancelled, Rescheduled)
 */
export async function updateVisitStatus(
  id: string,
  status: VisitStatus,
  notes?: string
) {
  try {
    const authUser = await requireAuth()

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { customer: true, property: true, agent: true },
    })
    if (!visit) return { success: false, error: 'Visit not found' }

    if (authUser.role === 'AGENT' && visit.agentId && visit.agentId !== authUser.userId) {
      return { success: false, error: 'You do not have permission to update this visit.' }
    }

    const data: Record<string, unknown> = { status }
    if (notes !== undefined) {
      data.notes = notes
    }

    const updated = await prisma.visit.update({
      where: { id },
      data,
    })

    // Audit log
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: status === 'COMPLETED' ? 'COMPLETE_VISIT' : status === 'CANCELLED' ? 'CANCEL_VISIT' : 'UPDATE_VISIT_STATUS',
      entityType: 'VISIT',
      entityId: id,
      description: `${authUser.name} marked visit #${id.slice(0, 8)} as ${status}`,
    })

    // If cancelled, remove Google event; otherwise sync update
    if (status === 'CANCELLED') {
      await deleteGoogleCalendarVisit(id, authUser.userId).catch(() => {})
    } else {
      await syncVisitToGoogleCalendar(id, authUser.userId).catch(() => {})
    }

    revalidatePath('/visits')
    revalidatePath('/dashboard')
    revalidatePath(`/customers/${visit.customerId}`)
    revalidatePath(`/properties/${visit.propertyId}`)
    return { success: true, visit: updated }
  } catch (error) {
    console.error('Failed to update visit status:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update visit status' }
  }
}

/**
 * Manually retry Google Calendar synchronization for a visit
 */
export async function retryVisitGoogleSync(visitId: string) {
  try {
    const authUser = await requireAuth()
    const result = await syncVisitToGoogleCalendar(visitId, authUser.userId)
    revalidatePath('/visits')
    return result
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Sync failed' }
  }
}

/**
 * Delete a visit (Super Admin / Admin or assigned Agent)
 */
export async function deleteVisit(id: string) {
  try {
    const authUser = await requireAuth()
    const visit = await prisma.visit.findUnique({ where: { id } })
    if (!visit) return { success: false, error: 'Visit not found' }

    if (authUser.role === 'AGENT' && visit.agentId !== authUser.userId) {
      return { success: false, error: 'Unauthorized to delete this visit' }
    }

    // Delete Google Calendar event first if synced
    await deleteGoogleCalendarVisit(id, authUser.userId).catch(() => {})

    await prisma.visit.delete({ where: { id } })

    await logAudit({
      userId: authUser.userId,
      action: 'DELETE_VISIT',
      entityType: 'VISIT',
      entityId: id,
      description: `${authUser.name} deleted visit #${id.slice(0, 8)}`,
    })

    revalidatePath('/visits')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete visit:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete visit' }
  }
}
