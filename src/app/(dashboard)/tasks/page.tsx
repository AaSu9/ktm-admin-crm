import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TasksClient, TaskRecord } from '@/components/dashboard/TasksClient'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as { id?: string; name?: string; role?: string }
  const currentUserId = user.id || ''
  const currentUserRole = user.role || 'AGENT'

  let tasks: TaskRecord[] = []
  let employees: any[] = []
  let customers: any[] = []
  let properties: any[] = []
  let deals: any[] = []
  let visits: any[] = []

  try {
    const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)

    const [tasksData, employeesData, customersData, propertiesData, dealsData, visitsData] = await Promise.all([
      prisma.task.findMany({
        where: isSuperAdminOrAdmin ? {} : { assignedToId: currentUserId },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          createdBy: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
          property: { select: { id: true, title: true, location: true } },
          deal: { select: { id: true, title: true } },
          visit: { select: { id: true, time: true } },
        },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, role: true, designation: true },
        orderBy: { name: 'asc' },
      }),
      prisma.customer.findMany({
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      }),
      prisma.property.findMany({
        select: { id: true, title: true, location: true },
        orderBy: { title: 'asc' },
      }),
      prisma.deal.findMany({
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      }),
      prisma.visit.findMany({
        select: { id: true, time: true, date: true },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ])

    tasks = tasksData as unknown as TaskRecord[]
    employees = employeesData
    customers = customersData
    properties = propertiesData
    deals = dealsData
    visits = visitsData
  } catch (error) {
    console.error('Error fetching tasks page data:', error)
  }

  return (
    <TasksClient
      tasks={tasks}
      employees={employees}
      customers={customers}
      properties={properties}
      deals={deals}
      visits={visits}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  )
}
