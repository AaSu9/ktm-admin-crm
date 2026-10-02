import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export interface LogAuditParams {
  action: string
  entityType: string
  entityId?: string
  description: string
  metadata?: Record<string, any>
  userId?: string
  userName?: string
  userRole?: string
}

/**
 * Centrally log significant actions to the Audit Log.
 * Safe to invoke in server actions, APIs, or background operations.
 */
export async function logAudit(params: LogAuditParams) {
  try {
    let userId = params.userId
    let userName = params.userName
    let userRole = params.userRole

    // If caller didn't provide user details, attempt to resolve from current session
    if (!userId) {
      try {
        const session = await auth()
        if (session?.user) {
          const u = session.user as { id?: string; name?: string; role?: string }
          userId = u.id
          userName = u.name || undefined
          userRole = u.role || undefined
        }
      } catch {
        // Session not available in this context
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userName: userName || null,
        userRole: userRole || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        description: params.description,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
