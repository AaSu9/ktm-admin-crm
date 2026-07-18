import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MessagesClient } from '@/components/dashboard/MessagesClient'
import { MessageSquare } from 'lucide-react'

export default async function MessagesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let messages: any[] = []
  let dbError = false

  try {
    const leads = await prisma.lead.findMany({
      orderBy: { created_at: 'desc' },
    })
    messages = leads.map((lead) => ({
      id: lead.id,
      senderName: lead.full_name,
      email: lead.email,
      phone: lead.phone,
      subject: lead.inquiry_type === 'contact_form' 
        ? 'Website General Message' 
        : `Property Inquiry: ${lead.property_interest || 'General'}`,
      content: lead.message || 'No content provided.',
      reply: lead.notes?.[0] || null,
      status: lead.status === 'NEW' 
        ? 'UNREAD' 
        : (lead.notes && lead.notes.length > 0 ? 'REPLIED' : 'READ'),
      createdAt: lead.created_at,
    }))
  } catch (error) {
    console.error('DB Query failed in Messages Page:', error)
    dbError = true
  }

  // Fallback mock data for demo mode
  if (dbError || messages.length === 0) {
    messages = [
      {
        id: 'mock-msg-1',
        senderName: 'Anup Gurung',
        email: 'anup@gmail.com',
        phone: '+977-9811234567',
        subject: 'Interested in 3BHK Apartment',
        content: 'Hello, I saw your listing for the 3BHK apartment in Lazimpat. Could you provide more details about the property and schedule a visit?',
        reply: null,
        status: 'UNREAD',
        createdAt: new Date('2026-07-12T10:00:00'),
      },
      {
        id: 'mock-msg-2',
        senderName: 'Kamala Tamang',
        email: 'kamala.tamang@email.com',
        phone: '+977-9822345678',
        subject: 'Land in Bhaktapur',
        content: 'I would like to know the exact location and price for the land plot listed in Bhaktapur. Is it negotiable?',
        reply: 'Thank you for your interest! The land is located in Suryabinayak, Bhaktapur. The price is slightly negotiable. Shall we arrange a site visit?',
        status: 'REPLIED',
        createdAt: new Date('2026-07-11T14:30:00'),
      },
      {
        id: 'mock-msg-3',
        senderName: 'Deepak Bista',
        email: 'deepak.bista@company.com',
        phone: null,
        subject: 'Commercial space inquiry',
        content: 'Looking for a commercial space for our new office. We need at least 2000 sqft in the Kathmandu area.',
        reply: null,
        status: 'READ',
        createdAt: new Date('2026-07-10T09:15:00'),
      },
      {
        id: 'mock-msg-4',
        senderName: 'Sunita Maharjan',
        email: 'sunita.m@gmail.com',
        phone: '+977-9833456789',
        subject: null,
        content: 'Can you send me the brochure for the villa in Budhanilkantha? My budget is around 4-5 crore.',
        reply: null,
        status: 'UNREAD',
        createdAt: new Date('2026-07-09T16:45:00'),
      },
    ]
  }

  return <MessagesClient initialMessages={messages} />
}
