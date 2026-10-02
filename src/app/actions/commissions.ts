'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/lib/authGuard'
import { logAudit } from '@/lib/audit'
import { createNotification } from './notifications'

/**
 * Update commission payment status (e.g. APPROVED, PARTIALLY_PAID, PAID, CANCELLED)
 * Super Admin or Admin only.
 */
export async function updateCommissionStatus(
  id: string,
  status: 'PENDING' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED',
  paidAmount?: number,
  notes?: string
) {
  try {
    const authUser = await requireAdmin()

    const commission = await prisma.commission.findUnique({
      where: { id },
      include: { agent: true, deal: true },
    })

    if (!commission) return { success: false, error: 'Commission record not found.' }

    const updateData: Record<string, any> = { status }
    if (paidAmount !== undefined) {
      updateData.paidAmount = Number(paidAmount)
    }
    if (status === 'PAID') {
      updateData.paidAmount = commission.commissionAmount
      updateData.paidAt = new Date()
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: status === 'PAID' ? 'PAY_COMMISSION' : status === 'APPROVED' ? 'APPROVE_COMMISSION' : 'UPDATE_COMMISSION_STATUS',
      entityType: 'COMMISSION',
      entityId: id,
      description: `${authUser.name} marked commission for ${commission.agent.name} (Deal: ${commission.deal.title}) as ${status}`,
      metadata: updateData,
    })

    // Notify agent of status update
    createNotification({
      userId: commission.agentId,
      title: `Commission ${status === 'PAID' ? 'Disbursed' : status === 'APPROVED' ? 'Approved' : 'Updated'}`,
      message: `Your commission for "${commission.deal.title}" (NPR ${commission.commissionAmount.toLocaleString()}) status is now ${status}.`,
      type: status === 'PAID' ? 'success' : 'info',
      link: '/deals',
    }).catch(() => {})

    revalidatePath('/deals')
    revalidatePath('/dashboard')
    return { success: true, commission: updated }
  } catch (error) {
    console.error('Failed to update commission status:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update commission' }
  }
}

/**
 * Configure global default commission settings and performance point rules (Super Admin only)
 */
export async function updatePerformanceSettings(data: {
  defaultCommissionRate?: number
  normalTaskPoints?: number
  highTaskPoints?: number
  urgentTaskPoints?: number
  dealClosePoints?: number
  saleClosePoints?: number
}) {
  try {
    const authUser = await requireAdmin()

    const setting = await prisma.performanceSetting.upsert({
      where: { id: 1 },
      update: {
        defaultCommissionRate: data.defaultCommissionRate !== undefined ? Number(data.defaultCommissionRate) : undefined,
        normalTaskPoints: data.normalTaskPoints !== undefined ? Number(data.normalTaskPoints) : undefined,
        highTaskPoints: data.highTaskPoints !== undefined ? Number(data.highTaskPoints) : undefined,
        urgentTaskPoints: data.urgentTaskPoints !== undefined ? Number(data.urgentTaskPoints) : undefined,
        dealClosePoints: data.dealClosePoints !== undefined ? Number(data.dealClosePoints) : undefined,
        saleClosePoints: data.saleClosePoints !== undefined ? Number(data.saleClosePoints) : undefined,
      },
      create: {
        id: 1,
        defaultCommissionRate: data.defaultCommissionRate !== undefined ? Number(data.defaultCommissionRate) : 2.5,
        normalTaskPoints: data.normalTaskPoints !== undefined ? Number(data.normalTaskPoints) : 1,
        highTaskPoints: data.highTaskPoints !== undefined ? Number(data.highTaskPoints) : 2,
        urgentTaskPoints: data.urgentTaskPoints !== undefined ? Number(data.urgentTaskPoints) : 3,
        dealClosePoints: data.dealClosePoints !== undefined ? Number(data.dealClosePoints) : 5,
        saleClosePoints: data.saleClosePoints !== undefined ? Number(data.saleClosePoints) : 10,
      },
    })

    await logAudit({
      userId: authUser.userId,
      action: 'UPDATE_COMMISSION_SETTINGS',
      entityType: 'COMMISSION',
      description: `${authUser.name} updated system commission and performance scoring rules`,
      metadata: data,
    })

    revalidatePath('/settings')
    revalidatePath('/deals')
    return { success: true, setting }
  } catch (error) {
    console.error('Failed to update performance settings:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update settings' }
  }
}

/**
 * Fetch performance & commission settings
 */
export async function getPerformanceSettings() {
  try {
    let setting = await prisma.performanceSetting.findUnique({ where: { id: 1 } })
    if (!setting) {
      setting = await prisma.performanceSetting.create({
        data: {
          id: 1,
          defaultCommissionRate: 2.5,
          normalTaskPoints: 1,
          highTaskPoints: 2,
          urgentTaskPoints: 3,
          dealClosePoints: 5,
          saleClosePoints: 10,
        },
      })
    }
    return setting
  } catch {
    return {
      id: 1,
      defaultCommissionRate: 2.5,
      normalTaskPoints: 1,
      highTaskPoints: 2,
      urgentTaskPoints: 3,
      dealClosePoints: 5,
      saleClosePoints: 10,
    }
  }
}
