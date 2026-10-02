'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/authGuard'

export interface EmployeePerformanceData {
  id: string
  name: string
  email: string
  role: string
  designation: string
  avatar: string | null
  stars: number
  performancePoints: number
  totalTasks: number
  completedTasks: number
  verifiedTasks: number
  pendingTasks: number
  overdueTasks: number
  salesCount: number
  totalRevenue: number
  totalCommission: number
  score: number
  rank?: number
}

/**
 * Get comprehensive performance metrics and leaderboard for employees
 */
export async function getLeaderboardData(period: 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'all_time' = 'all_time') {
  await requireAuth()

  const now = new Date()
  let dateFilter: { gte?: Date } = {}

  if (period === 'this_week') {
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    dateFilter = { gte: startOfWeek }
  } else if (period === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    dateFilter = { gte: startOfMonth }
  } else if (period === 'this_quarter') {
    const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3
    const startOfQuarter = new Date(now.getFullYear(), currentQuarterMonth, 1)
    dateFilter = { gte: startOfQuarter }
  } else if (period === 'this_year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    dateFilter = { gte: startOfYear }
  }

  // Fetch all active employees (AGENTS, ADMINS, SUPER_ADMINS)
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ['AGENT', 'ADMIN', 'SUPER_ADMIN'] } },
    include: {
      assignedTasks: {
        where: dateFilter.gte ? { createdAt: dateFilter } : undefined,
      },
      deals: {
        where: {
          status: { in: ['PAID', 'SOLD', 'COMPLETED'] },
          ...(dateFilter.gte ? { closingDate: dateFilter } : {}),
        },
      },
      commissions: {
        where: dateFilter.gte ? { createdAt: dateFilter } : undefined,
      },
    },
  })

  const leaderboard: EmployeePerformanceData[] = users.map((user) => {
    const totalTasks = user.assignedTasks.length
    const verifiedTasks = user.assignedTasks.filter((t) => t.status === 'VERIFIED').length
    const completedTasks = user.assignedTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'VERIFIED').length
    const pendingTasks = user.assignedTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length
    
    // Overdue tasks
    const overdueTasks = user.assignedTasks.filter(
      (t) => t.status !== 'VERIFIED' && t.status !== 'COMPLETED' && new Date(t.dueDate) < now
    ).length

    const salesCount = user.deals.length
    const totalRevenue = user.deals.reduce((sum, d) => sum + (d.finalPrice || d.dealValue), 0)
    const totalCommission = user.commissions.reduce((sum, c) => sum + c.commissionAmount, 0)

    // Calculate dynamic stars earned during period (or all time user.stars)
    const periodStars = user.assignedTasks
      .filter((t) => t.status === 'VERIFIED')
      .reduce((sum, t) => sum + (t.starsAwarded || 1), 0)
    const stars = period === 'all_time' ? Math.max(user.stars, periodStars) : periodStars

    const periodPoints = user.assignedTasks
      .filter((t) => t.status === 'VERIFIED')
      .reduce((sum, t) => sum + (t.pointsAwarded || 1), 0) + (salesCount * 10)
    const performancePoints = period === 'all_time' ? Math.max(user.performancePoints, periodPoints) : periodPoints

    // Transparent Weighted Scoring formula:
    // Verified Tasks (10 pts each) + Sales (50 pts each) + Revenue factor (1 pt per 50,000 NPR) + Stars (20 pts each) + Points
    const revenueFactor = Math.floor(totalRevenue / 50000)
    const score = (verifiedTasks * 15) + (salesCount * 50) + revenueFactor + (stars * 20) + performancePoints

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation || 'Real Estate Consultant',
      avatar: user.avatar,
      stars,
      performancePoints,
      totalTasks,
      completedTasks,
      verifiedTasks,
      pendingTasks,
      overdueTasks,
      salesCount,
      totalRevenue,
      totalCommission,
      score,
    }
  })

  // Sort descending by calculated score
  leaderboard.sort((a, b) => b.score - a.score)

  // Assign ranks
  leaderboard.forEach((emp, index) => {
    emp.rank = index + 1
  })

  return leaderboard
}

/**
 * Calculate Employee of the Year
 */
export async function getEmployeeOfTheYear() {
  const yearlyLeaderboard = await getLeaderboardData('this_year')
  if (yearlyLeaderboard.length === 0) return null
  return yearlyLeaderboard[0]
}
