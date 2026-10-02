'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/lib/authGuard'
import { logAudit } from '@/lib/audit'
import { createNotification, notifyAdmins } from './notifications'
import { getPerformanceSettings } from './commissions'

export interface CreateTaskInput {
  title: string
  description?: string
  assignedToId: string
  assignedRole?: string
  customerId?: string
  propertyId?: string
  dealId?: string
  visitId?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string // YYYY-MM-DD
  dueTime?: string // e.g. "10:00 AM"
  attachmentUrl?: string
  notes?: string
}

/**
 * Create a new task (Super Admin or Admin)
 */
export async function createTask(input: CreateTaskInput) {
  try {
    const authUser = await requireAuth()

    if (!input.title || !input.assignedToId || !input.dueDate) {
      return { success: false, error: 'Task title, assigned employee, and due date are required.' }
    }

    const assignedEmployee = await prisma.user.findUnique({
      where: { id: input.assignedToId },
      select: { id: true, name: true, role: true, email: true },
    })

    if (!assignedEmployee) {
      return { success: false, error: 'Selected assigned employee not found.' }
    }

    const task = await prisma.task.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        assignedToId: input.assignedToId,
        createdById: authUser.userId,
        assignedRole: input.assignedRole || assignedEmployee.role,
        customerId: input.customerId && input.customerId !== 'none' ? input.customerId : null,
        propertyId: input.propertyId && input.propertyId !== 'none' ? input.propertyId : null,
        dealId: input.dealId && input.dealId !== 'none' ? input.dealId : null,
        visitId: input.visitId && input.visitId !== 'none' ? input.visitId : null,
        priority: input.priority || 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date(input.dueDate),
        dueTime: input.dueTime || null,
        attachmentUrl: input.attachmentUrl?.trim() || null,
        notes: input.notes?.trim() || null,
      },
      include: {
        assignedTo: true,
        createdBy: true,
        customer: true,
        property: true,
      },
    })

    // Log Audit
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_TASK',
      entityType: 'TASK',
      entityId: task.id,
      description: `${authUser.name} assigned task "${task.title}" to ${assignedEmployee.name} (Due: ${input.dueDate} ${input.dueTime || ''})`,
      metadata: { priority: input.priority, due: input.dueDate },
    })

    // Notify assigned employee
    createNotification({
      userId: input.assignedToId,
      title: 'New Task Assigned',
      message: `"${task.title}" has been assigned to you. Due: ${input.dueDate} ${input.dueTime || ''}`,
      type: 'info',
      link: '/tasks',
    }).catch(() => {})

    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { success: true, task }
  } catch (error) {
    console.error('Failed to create task:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create task' }
  }
}

/**
 * Agent starts task (changes status to IN_PROGRESS)
 */
export async function startTask(id: string) {
  try {
    const authUser = await requireAuth()

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return { success: false, error: 'Task not found' }

    if (authUser.role === 'AGENT' && task.assignedToId !== authUser.userId) {
      return { success: false, error: 'You can only start tasks assigned to you.' }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    })

    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { success: true, task: updated }
  } catch (error) {
    console.error('Failed to start task:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to start task' }
  }
}

/**
 * Agent marks task as completed (moves to COMPLETED awaiting Admin verification)
 */
export async function completeTask(id: string, notes?: string) {
  try {
    const authUser = await requireAuth()

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true, createdBy: true },
    })
    if (!task) return { success: false, error: 'Task not found' }

    if (authUser.role === 'AGENT' && task.assignedToId !== authUser.userId) {
      return { success: false, error: 'You can only complete tasks assigned to you.' }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: notes !== undefined ? notes : task.notes,
      },
    })

    // Log audit
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'COMPLETE_TASK',
      entityType: 'TASK',
      entityId: id,
      description: `${authUser.name} marked task "${task.title}" as completed (Awaiting Admin Verification)`,
    })

    // Notify Super Admin / creator that task is waiting for verification
    notifyAdmins(
      'Task Awaiting Verification',
      `${authUser.name} completed "${task.title}" and is waiting for your verification.`,
      'info'
    ).catch(() => {})

    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { success: true, task: updated }
  } catch (error) {
    console.error('Failed to complete task:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to complete task' }
  }
}

/**
 * Super Admin or Admin verifies completed task (awards performance points and stars)
 * Strictly prevents an agent from verifying their own task!
 */
export async function verifyTask(id: string) {
  try {
    const authUser = await requireAdmin()

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true },
    })

    if (!task) return { success: false, error: 'Task not found' }

    // Security check: Agent cannot verify their own task!
    if (authUser.role === 'AGENT' || task.assignedToId === authUser.userId) {
      return { success: false, error: 'Security violation: You cannot verify your own task.' }
    }

    // Load performance scoring rules
    const settings = await getPerformanceSettings()

    let points = settings.normalTaskPoints
    let stars = 1
    if (task.priority === 'HIGH') {
      points = settings.highTaskPoints
      stars = 2
    } else if (task.priority === 'URGENT') {
      points = settings.urgentTaskPoints
      stars = 3
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: authUser.userId,
        pointsAwarded: points,
        starsAwarded: stars,
        rejectionReason: null,
      },
    })

    // Award performance points & stars to the assigned employee
    await prisma.user.update({
      where: { id: task.assignedToId },
      data: {
        stars: { increment: stars },
        performancePoints: { increment: points },
      },
    })

    // Log Audit
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'VERIFY_TASK',
      entityType: 'TASK',
      entityId: id,
      description: `${authUser.name} verified task "${task.title}" for ${task.assignedTo.name} (+${stars} ⭐, +${points} pts)`,
    })

    // Notify employee that task is verified
    createNotification({
      userId: task.assignedToId,
      title: 'Task Verified! ⭐',
      message: `Your task "${task.title}" was verified by ${authUser.name}! You earned +${stars} Star(s) and +${points} performance points.`,
      type: 'success',
      link: '/tasks',
    }).catch(() => {})

    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    revalidatePath('/performance')
    return { success: true, task: updated }
  } catch (error) {
    console.error('Failed to verify task:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to verify task' }
  }
}

/**
 * Super Admin or Admin rejects task and requests revision with comment
 */
export async function rejectTask(id: string, reason: string) {
  try {
    const authUser = await requireAdmin()

    if (!reason || !reason.trim()) {
      return { success: false, error: 'A revision reason or comment is required when rejecting a task.' }
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true },
    })

    if (!task) return { success: false, error: 'Task not found' }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'NEEDS_REVISION',
        rejectionReason: reason.trim(),
      },
    })

    // Log audit
    await logAudit({
      userId: authUser.userId,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'REJECT_TASK',
      entityType: 'TASK',
      entityId: id,
      description: `${authUser.name} returned task "${task.title}" for revision: "${reason}"`,
      metadata: { reason },
    })

    // Notify employee of required revision
    createNotification({
      userId: task.assignedToId,
      title: 'Task Needs Revision ⚠️',
      message: `Your task "${task.title}" needs revision: "${reason}"`,
      type: 'warning',
      link: '/tasks',
    }).catch(() => {})

    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { success: true, task: updated }
  } catch (error) {
    console.error('Failed to reject task:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reject task' }
  }
}

/**
 * Delete task (Super Admin or Admin only)
 */
export async function deleteTask(id: string) {
  try {
    const authUser = await requireAdmin()

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return { success: false, error: 'Task not found' }

    await prisma.task.delete({ where: { id } })

    await logAudit({
      userId: authUser.userId,
      action: 'DELETE_TASK',
      entityType: 'TASK',
      entityId: id,
      description: `${authUser.name} deleted task "${task.title}"`,
    })

    revalidatePath('/tasks')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete task:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task' }
  }
}
