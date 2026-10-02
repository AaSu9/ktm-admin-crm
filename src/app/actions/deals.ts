'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createNotification, notifyAdmins } from './notifications'
import { requireAuth } from '@/lib/authGuard'
import { logAudit } from '@/lib/audit'

export interface CreateDealInput {
  title: string
  propertyId: string
  buyerId?: string
  sellerId?: string
  newBuyer?: {
    name: string
    phone: string
    email?: string
    address?: string
  }
  agentId: string
  visitId?: string
  dealValue: number // Property Sale Price
  discount?: number
  paymentStatus?: string // PENDING | PARTIAL | PAID
  amountPaid?: number
  commissionRate: number // percentage
  status?: string // INTERESTED | NEGOTIATION | OFFER_SUBMITTED | AGREEMENT | SOLD | COMPLETED | CANCELLED
  saleDate?: string
  closingDate: string
  notes?: string
  allowSoldPropertyOverride?: boolean
}

/**
 * Create a new deal in the pipeline
 */
export async function createDeal(input: CreateDealInput) {
  try {
    const authUser = await requireAuth()

    let buyerId = input.buyerId

    // Create inline buyer if newBuyer provided
    if (!buyerId && input.newBuyer && input.newBuyer.name) {
      const createdBuyer = await prisma.customer.create({
        data: {
          name: input.newBuyer.name.trim(),
          phone: input.newBuyer.phone?.trim() || '',
          email: input.newBuyer.email?.trim() || null,
          address: input.newBuyer.address?.trim() || null,
          type: 'BUYER',
          source: 'DEAL_INLINE',
        },
      })
      buyerId = createdBuyer.id
    }

    const dealValue = Number(input.dealValue) || 0
    const discount = Number(input.discount) || 0
    const finalPrice = Math.max(0, dealValue - discount)
    const amountPaid = Number(input.amountPaid) || 0
    const remainingAmount = Math.max(0, finalPrice - amountPaid)
    const commissionRate = Number(input.commissionRate) || 2.5
    const commissionEarned = finalPrice * (commissionRate / 100)

    const dealStatus = input.status || 'INTERESTED'

    // Check target property status
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    })

    if (!property) {
      return { success: false, error: 'Target property not found.' }
    }

    // Property Sold Workflow validation
    if ((dealStatus === 'SOLD' || dealStatus === 'COMPLETED') && property.status === 'SOLD' && !input.allowSoldPropertyOverride) {
      if (authUser.role !== 'SUPER_ADMIN') {
        return {
          success: false,
          error: 'This property has already been marked SOLD. Only Super Admin can override.',
        }
      }
    }

    // Determine agent ID
    let assignedAgentId = input.agentId
    if (!assignedAgentId || assignedAgentId === 'unassigned') {
      assignedAgentId = authUser.userId
    }

    const deal = await prisma.deal.create({
      data: {
        title: input.title,
        propertyId: input.propertyId,
        buyerId: buyerId && buyerId !== 'none' ? buyerId : null,
        sellerId: input.sellerId && input.sellerId !== 'none' ? input.sellerId : null,
        agentId: assignedAgentId,
        visitId: input.visitId && input.visitId !== 'none' ? input.visitId : null,
        dealValue,
        propertySalePrice: dealValue,
        discount,
        finalPrice,
        paymentStatus: input.paymentStatus || (amountPaid >= finalPrice && finalPrice > 0 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'PENDING'),
        amountPaid,
        remainingAmount,
        commissionRate,
        commissionEarned,
        status: dealStatus,
        dealStatus: dealStatus,
        saleDate: input.saleDate ? new Date(input.saleDate) : (dealStatus === 'SOLD' || dealStatus === 'COMPLETED' ? new Date() : null),
        closingDate: new Date(input.closingDate || Date.now()),
        notes: input.notes || null,
      },
      include: {
        property: true,
        buyer: true,
        agent: true,
      },
    })

    // Link property to agent if not already assigned or if this agent is closing the deal
    if (property && (!property.agentId || property.agentId !== assignedAgentId)) {
      await prisma.property.update({
        where: { id: input.propertyId },
        data: { agentId: assignedAgentId },
      }).catch(() => {})
    }

    // Log Audit
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_DEAL',
      entityType: 'DEAL',
      entityId: deal.id,
      description: `${authUser.name} logged deal "${deal.title}" (Status: ${dealStatus}, Value: NPR ${dealValue.toLocaleString()})`,
      metadata: { finalPrice, commissionEarned, agent: deal.agent.name },
    })

    // If deal is SOLD or COMPLETED, trigger Property Sold & Commission Workflow
    if (dealStatus === 'SOLD' || dealStatus === 'COMPLETED') {
      await handlePropertySoldWorkflow(deal.id, authUser)
    }

    revalidatePath('/deals')
    revalidatePath('/dashboard')
    revalidatePath('/properties')
    revalidatePath(`/properties/${input.propertyId}`)
    if (buyerId) revalidatePath(`/customers/${buyerId}`)

    // Notifications
    createNotification({
      userId: assignedAgentId,
      title: 'Deal Created',
      message: `${deal.title} — Status: ${dealStatus} (NPR ${finalPrice.toLocaleString()})`,
      type: 'info',
      link: '/deals',
    }).catch(() => {})

    notifyAdmins(
      'New Deal Pipeline Entry',
      `${authUser.name} created deal "${deal.title}" (${deal.property.title})`,
      'info'
    ).catch(() => {})

    return { success: true, deal }
  } catch (error) {
    console.error('Failed to create deal:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create deal' }
  }
}

/**
 * Update deal status in pipeline and trigger appropriate workflows
 */
export async function updateDealStatus(id: string, newStatus: string) {
  try {
    const authUser = await requireAuth()

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { property: true, agent: true },
    })

    if (!deal) return { success: false, error: 'Deal not found' }

    if (authUser.role === 'AGENT' && deal.agentId !== authUser.userId) {
      return { success: false, error: 'You do not have permission to modify this deal.' }
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        status: newStatus,
        dealStatus: newStatus,
        saleDate: (newStatus === 'SOLD' || newStatus === 'COMPLETED') && !deal.saleDate ? new Date() : undefined,
      },
      include: { property: true, agent: true, buyer: true },
    })

    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'UPDATE_DEAL_STATUS',
      entityType: 'DEAL',
      entityId: id,
      description: `${authUser.name} updated deal status to "${newStatus}" for "${deal.title}"`,
    })

    // If deal transitioned to SOLD or COMPLETED, trigger automatic Property Sold & Commission creation
    if (newStatus === 'SOLD' || newStatus === 'COMPLETED') {
      await handlePropertySoldWorkflow(id, authUser)
    }

    revalidatePath('/deals')
    revalidatePath('/dashboard')
    revalidatePath('/properties')
    revalidatePath(`/properties/${deal.propertyId}`)
    if (deal.buyerId) revalidatePath(`/customers/${deal.buyerId}`)

    return { success: true, deal: updatedDeal }
  } catch (error) {
    console.error('Failed to update deal status:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update deal status' }
  }
}

/**
 * Handles automatic Property Sold state, Commission generation, and Agent Performance Points & Notifications
 */
async function handlePropertySoldWorkflow(dealId: string, authUser: { userId: string; name: string; role: string }) {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { property: true, agent: true, buyer: true },
    })

    if (!deal) return

    // 1. Update Property Status to SOLD and ensure agent is assigned
    await prisma.property.update({
      where: { id: deal.propertyId },
      data: {
        status: 'SOLD',
        agentId: deal.agentId,
      },
    })

    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'MARK_PROPERTY_SOLD',
      entityType: 'PROPERTY',
      entityId: deal.propertyId,
      description: `Property "${deal.property.title}" marked as SOLD via Deal #${deal.id.slice(0, 8)}`,
    })

    // 2. Fetch performance setting for dynamic point & star calculation
    const settings = await prisma.performanceSetting.findFirst()
    const salePoints = settings?.saleClosePoints || 10
    const starsBonus = Math.max(1, Math.floor(salePoints / 5))

    // 3. Check if Commission record already exists for this deal to prevent duplicates
    const existingCommission = await prisma.commission.findFirst({
      where: { dealId: deal.id },
    })

    const saleValue = deal.finalPrice || deal.dealValue
    const commissionAmount = deal.commissionEarned || (saleValue * (deal.commissionRate / 100))

    if (!existingCommission) {
      await prisma.commission.create({
        data: {
          dealId: deal.id,
          agentId: deal.agentId,
          propertyId: deal.propertyId,
          customerId: deal.buyerId || null,
          saleValue,
          commissionRate: deal.commissionRate,
          commissionAmount,
          status: 'PENDING',
          notes: `Automatic commission generated from closed deal: ${deal.title}`,
        },
      })

      await logAudit({
        userId: authUser.userId,
        userName: authUser.name,
        userRole: authUser.role,
        action: 'GENERATE_COMMISSION',
        entityType: 'COMMISSION',
        description: `Generated commission of NPR ${commissionAmount.toLocaleString()} (${deal.commissionRate}%) for agent ${deal.agent?.name || 'Agent'}`,
      })
    }

    // 4. Award performance points and stars to Agent for closed sale
    const updatedAgent = await prisma.user.update({
      where: { id: deal.agentId },
      data: {
        performancePoints: { increment: salePoints },
        stars: { increment: starsBonus },
      },
    })

    // 5. Notify Agent with complete celebration and breakdown
    await createNotification({
      userId: deal.agentId,
      title: '🎉 Property Sold & Commission Ready!',
      message: `Deal "${deal.title}" for "${deal.property.title}" is marked SOLD! Generated commission: NPR ${commissionAmount.toLocaleString()} (Pending). You received +${salePoints} performance points & +${starsBonus} Star ⭐! Total Stars: ${updatedAgent.stars || 0}.`,
      type: 'success',
      link: '/deals',
    }).catch(() => {})

    // 6. Notify Admins & Super Admin
    await notifyAdmins(
      '🏆 Property Sale Closed!',
      `Property "${deal.property.title}" was successfully marked SOLD by ${deal.agent?.name || 'Agent'}. Sale Price: NPR ${saleValue.toLocaleString()}. Commission: NPR ${commissionAmount.toLocaleString()} awaiting approval.`,
      'success'
    ).catch(() => {})

    // 7. Update any other scheduled visits on this property to inform agents
    const otherVisits = await prisma.visit.findMany({
      where: {
        propertyId: deal.propertyId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { agent: true },
    })

    for (const v of otherVisits) {
      if (v.agentId && v.agentId !== deal.agentId) {
        await createNotification({
          userId: v.agentId,
          title: 'Property Notice: Property Sold',
          message: `Notice: Property "${deal.property.title}" has been sold. Please review your scheduled appointment on ${new Date(v.date).toLocaleDateString()}.`,
          type: 'warning',
          link: '/visits',
        }).catch(() => {})
      }
    }
  } catch (error) {
    console.error('Error executing Property Sold workflow:', error)
  }
}

/**
 * Update full deal details (payment, discount, notes, dates)
 */
export async function updateDealDetails(
  id: string,
  data: {
    title?: string
    dealValue?: number
    discount?: number
    amountPaid?: number
    paymentStatus?: string
    commissionRate?: number
    status?: string
    closingDate?: string
    notes?: string
  }
) {
  try {
    const authUser = await requireAuth()

    const existing = await prisma.deal.findUnique({ where: { id } })
    if (!existing) return { success: false, error: 'Deal not found' }

    if (authUser.role === 'AGENT' && existing.agentId !== authUser.userId) {
      return { success: false, error: 'Unauthorized to edit this deal.' }
    }

    const dealValue = data.dealValue !== undefined ? Number(data.dealValue) : existing.dealValue
    const discount = data.discount !== undefined ? Number(data.discount) : (existing.discount || 0)
    const finalPrice = Math.max(0, dealValue - discount)
    const amountPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : (existing.amountPaid || 0)
    const remainingAmount = Math.max(0, finalPrice - amountPaid)
    const commissionRate = data.commissionRate !== undefined ? Number(data.commissionRate) : existing.commissionRate
    const commissionEarned = finalPrice * (commissionRate / 100)

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        title: data.title || existing.title,
        dealValue,
        discount,
        finalPrice,
        amountPaid,
        remainingAmount,
        commissionRate,
        commissionEarned,
        paymentStatus: data.paymentStatus || existing.paymentStatus,
        status: data.status || existing.status,
        dealStatus: data.status || existing.dealStatus,
        closingDate: data.closingDate ? new Date(data.closingDate) : existing.closingDate,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    })

    // If deal status changed to SOLD or COMPLETED
    if (data.status === 'SOLD' || data.status === 'COMPLETED') {
      await handlePropertySoldWorkflow(id, authUser)
    }

    revalidatePath('/deals')
    revalidatePath('/dashboard')
    return { success: true, deal: updated }
  } catch (error) {
    console.error('Failed to update deal:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update deal' }
  }
}

/**
 * Delete deal
 */
export async function deleteDeal(id: string) {
  try {
    const authUser = await requireAuth()

    const deal = await prisma.deal.findUnique({ where: { id } })
    if (!deal) return { success: false, error: 'Deal not found' }

    if (authUser.role === 'AGENT' && deal.agentId !== authUser.userId) {
      return { success: false, error: 'Unauthorized to delete this deal' }
    }

    await prisma.deal.delete({ where: { id } })

    await logAudit({
      userId: authUser.userId,
      action: 'DELETE_DEAL',
      entityType: 'DEAL',
      entityId: id,
      description: `${authUser.name} deleted deal "${deal.title}"`,
    })

    revalidatePath('/deals')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete deal:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete deal' }
  }
}
