import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EditPropertyForm from '@/components/dashboard/EditPropertyForm'

export default async function EditPropertyPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = await paramsPromise
  const session = await auth()
  if (!session) redirect('/login')

  const propId = params.id
  let property: Record<string, unknown> | null = null
  let agents: Array<{ id: string; name: string }> = []
  let dbError = false

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propId)

  try {
    if (isUuid) {
      property = (await prisma.property.findUnique({
        where: { id: propId },
      })) as Record<string, unknown> | null
    }
    if (!property) {
      property = (await prisma.property.findUnique({
        where: { property_id: propId },
      })) as Record<string, unknown> | null
    }

    agents = await prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error("DB Query failed in Edit Property Page, showing mock fallback:", error)
    dbError = true
  }

  // Fallback Mock Data for demo mode
  if (dbError || propId === 'demo-id' || !property) {
    property = property || {
      id: 'demo-id',
      property_id: 'demo-id',
      title: 'Luxury 3BHK Apartment in Lazimpat',
      description: 'A stunning luxury apartment with modern amenities in the heart of Kathmandu.',
      location: 'Lazimpat, Kathmandu',
      price: 15000000,
      category: 'sale',
      property_type: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1800,
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
      status: 'AVAILABLE',
      features: ['Parking', 'Gym', 'Swimming Pool', '24/7 Security'],
      agentId: 'mock-agent-1',
      video_url: '',
    }
    agents = [{ id: 'mock-agent-1', name: 'Raj Kumar Sharma' }, { id: 'mock-agent-2', name: 'Priya Thapa' }]
  }

  return <EditPropertyForm propId={propId} property={property} agents={agents} dbError={dbError} />
}
