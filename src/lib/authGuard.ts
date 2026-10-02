'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get current session user safely without throwing.
 */
export async function getCurrentUser() {
  try {
    const session = await auth()
    if (!session?.user) return null
    const u = session.user as { id?: string; name?: string; email?: string; role?: string; avatar?: string }
    if (!u.id) return null
    return {
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      role: (u.role || 'AGENT') as 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'EDITOR',
      avatar: u.avatar || null,
    }
  } catch {
    return null
  }
}

/**
 * Require the user to be authenticated.
 * Returns the user's id, name, and role from the session.
 * Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Not authenticated')
  }
  const user = session.user as { id?: string; name?: string; email?: string; role?: string }
  if (!user.id) {
    throw new Error('Not authenticated')
  }
  return {
    userId: user.id,
    name: user.name || '',
    email: user.email || '',
    role: (user.role || 'AGENT') as 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'EDITOR',
  }
}

/**
 * Require the user to be a SUPER_ADMIN.
 * Throws if not authenticated or not a super admin.
 */
export async function requireSuperAdmin() {
  const user = await requireAuth()
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required')
  }
  return user
}

/**
 * Require the user to be an ADMIN or SUPER_ADMIN.
 * Throws if not authenticated or not an admin.
 */
export async function requireAdmin() {
  const user = await requireAuth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    throw new Error('Forbidden: Admin access required')
  }
  return user
}

/**
 * Require the user to be an EDITOR, ADMIN, or SUPER_ADMIN.
 * Throws if not authenticated or insufficient role.
 */
export async function requireEditor() {
  const user = await requireAuth()
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user.role)) {
    throw new Error('Forbidden: Editor access required')
  }
  return user
}
