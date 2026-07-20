'use server'

import { auth } from '@/lib/auth'

/**
 * Require the user to be authenticated.
 * Returns the user's id and role from the session.
 * Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Not authenticated')
  }
  const user = session.user as any
  if (!user.id) {
    throw new Error('Not authenticated')
  }
  return { userId: user.id as string, role: (user.role as string) || 'AGENT' }
}

/**
 * Require the user to be an ADMIN or SUPER_ADMIN.
 * Throws if not authenticated or not an admin.
 */
export async function requireAdmin() {
  const { userId, role } = await requireAuth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
    throw new Error('Forbidden: Admin access required')
  }
  return { userId, role }
}

/**
 * Require the user to be an EDITOR, ADMIN, or SUPER_ADMIN.
 * Throws if not authenticated or insufficient role.
 */
export async function requireEditor() {
  const { userId, role } = await requireAuth()
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role)) {
    throw new Error('Forbidden: Editor access required')
  }
  return { userId, role }
}
