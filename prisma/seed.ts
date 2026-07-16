import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding KTM Realstate CRM...')

  // Create admin users
  const hashedPassword = await bcrypt.hash('Admin@2059', 10)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@realtocrm.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@realtocrm.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      phone: '+977-9812345678',
    },
  })

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@realtocrm.com' },
    update: {},
    create: {
      name: 'Raj Kumar Sharma',
      email: 'agent1@realtocrm.com',
      password: hashedPassword,
      role: 'AGENT',
      phone: '+977-9823456789',
    },
  })

  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@realtocrm.com' },
    update: {},
    create: {
      name: 'Priya Thapa',
      email: 'agent2@realtocrm.com',
      password: hashedPassword,
      role: 'AGENT',
      phone: '+977-9834567890',
    },
  })

  console.log('✅ Users created')

  // Create sample properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
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
        is_featured: true,
        features: ['Parking', 'Gym', 'Swimming Pool', '24/7 Security'],
        agentId: agent1.id,
        views: 245,
        property_id: 'prop-1',
      },
    }),
    prisma.property.create({
      data: {
        title: 'Modern Villa in Budhanilkantha',
        description: 'Spacious villa with beautiful mountain views.',
        location: 'Budhanilkantha, Kathmandu',
        price: 45000000,
        category: 'sale',
        property_type: 'house',
        bedrooms: 5,
        bathrooms: 4,
        area_sqft: 4500,
        images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
        status: 'AVAILABLE',
        is_featured: true,
        features: ['Garden', 'Garage', 'Solar Power', 'Water Tank'],
        agentId: agent1.id,
        views: 189,
        property_id: 'prop-2',
      },
    }),
    prisma.property.create({
      data: {
        title: 'Commercial Space in New Road',
        description: 'Prime commercial space in a busy market area.',
        location: 'New Road, Kathmandu',
        price: 80000,
        category: 'rent',
        property_type: 'commercial',
        area_sqft: 600,
        images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
        status: 'AVAILABLE',
        agentId: agent2.id,
        views: 310,
        property_id: 'prop-3',
      },
    }),
    prisma.property.create({
      data: {
        title: '2BHK Apartment in Thamel',
        description: 'Cozy apartment perfect for young professionals.',
        location: 'Thamel, Kathmandu',
        price: 35000,
        category: 'rent',
        property_type: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        area_sqft: 950,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
        status: 'AVAILABLE',
        agentId: agent2.id,
        views: 127,
        property_id: 'prop-4',
      },
    }),
    prisma.property.create({
      data: {
        title: 'Land Plot in Bhaktapur',
        description: '5 anna land in prime location.',
        location: 'Bhaktapur',
        price: 12000000,
        category: 'sale',
        property_type: 'land',
        area_sqft: 2152,
        images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
        status: 'SOLD',
        agentId: agent1.id,
        views: 98,
        property_id: 'prop-5',
      },
    }),
  ])

  console.log('✅ Properties created')

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Bikash Shrestha',
        phone: '+977-9841234567',
        email: 'bikash@email.com',
        address: 'Patan, Lalitpur',
        notes: 'Looking for a 3BHK in Kathmandu valley',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Sunita Maharjan',
        phone: '+977-9852345678',
        email: 'sunita@email.com',
        address: 'Kirtipur, Kathmandu',
        notes: 'Interested in commercial properties',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Ramesh Adhikari',
        phone: '+977-9863456789',
        email: 'ramesh@email.com',
        address: 'Bhaktapur',
        notes: 'Budget is around 20-30 lakhs',
      },
    }),
  ])

  console.log('✅ Customers created')

  // Create sample leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        full_name: 'Anup Gurung',
        phone: '+977-9811234567',
        email: 'anup@email.com',
        source: 'website',
        priority: 'HIGH',
        status: 'NEW',
        notes: ['Interested in luxury apartments', 'Budget 1-2 Crore'],
        budget: 20000000,
        property_id: properties[0].id,
        agentId: agent1.id,
      },
    }),
    prisma.lead.create({
      data: {
        full_name: 'Kamala Tamang',
        phone: '+977-9822345678',
        email: 'kamala@email.com',
        source: 'referral',
        priority: 'MEDIUM',
        status: 'CONTACTED',
        notes: ['Called on June 20', 'Wants to visit this week'],
        property_id: properties[1].id,
        agentId: agent1.id,
      },
    }),
    prisma.lead.create({
      data: {
        full_name: 'Deepak Bista',
        phone: '+977-9833456789',
        email: 'deepak@email.com',
        source: 'social',
        priority: 'HIGH',
        status: 'VISIT_SCHEDULED',
        notes: ['Very interested', 'Visit scheduled for Sunday'],
        property_id: properties[0].id,
        agentId: agent2.id,
      },
    }),
    prisma.lead.create({
      data: {
        full_name: 'Manisha Karki',
        phone: '+977-9844567890',
        email: 'manisha@email.com',
        source: 'walk-in',
        priority: 'LOW',
        status: 'NEGOTIATION',
        notes: ['Negotiating on price', 'Wants 5% discount'],
        property_id: properties[2].id,
        agentId: agent2.id,
      },
    }),
    prisma.lead.create({
      data: {
        full_name: 'Santosh Poudel',
        phone: '+977-9855678901',
        email: 'santosh@email.com',
        source: 'website',
        priority: 'MEDIUM',
        status: 'CLOSED_WON',
        notes: ['Deal closed!', 'Commission received'],
        property_id: properties[4].id,
        agentId: agent1.id,
      },
    }),
  ])

  console.log('✅ Leads created')

  // Create sample visits
  await Promise.all([
    prisma.visit.create({
      data: {
        customerId: customers[0].id,
        propertyId: properties[0].id,
        agentId: agent1.id,
        date: new Date('2026-06-28'),
        time: '10:00 AM',
        status: 'SCHEDULED',
        notes: 'Customer wants to see the view from the roof',
      },
    }),
    prisma.visit.create({
      data: {
        customerId: customers[1].id,
        propertyId: properties[2].id,
        agentId: agent2.id,
        date: new Date('2026-06-26'),
        time: '2:00 PM',
        status: 'COMPLETED',
      },
    }),
    prisma.visit.create({
      data: {
        customerId: customers[2].id,
        propertyId: properties[1].id,
        agentId: agent1.id,
        date: new Date('2026-06-29'),
        time: '11:00 AM',
        status: 'SCHEDULED',
      },
    }),
  ])

  console.log('✅ Visits created')

  // Create sample messages
  await Promise.all([
    prisma.message.create({
      data: {
        senderName: 'Anil Joshi',
        email: 'anil@email.com',
        phone: '+977-9801234567',
        subject: 'Inquiry about 3BHK in Lazimpat',
        content: 'Hello, I am interested in the 3BHK apartment listed in Lazimpat. Can you please share more details and arrange a visit?',
        status: 'UNREAD',
      },
    }),
    prisma.message.create({
      data: {
        senderName: 'Rita Shrestha',
        email: 'rita@email.com',
        phone: '+977-9802345678',
        subject: 'Rental property inquiry',
        content: 'Looking for a 2BHK apartment in Thamel for rent. Budget is around 30,000-40,000 NPR per month.',
        status: 'READ',
        reply: 'Thank you for your inquiry. We have a perfect property for you. Please call us at +977-9812345678.',
      },
    }),
    prisma.message.create({
      data: {
        senderName: 'Pramod Khanal',
        email: 'pramod@email.com',
        subject: 'Land purchase inquiry',
        content: 'I would like to know the availability of land plots in Bhaktapur area.',
        status: 'REPLIED',
        reply: 'We have several options. Please visit our office or we can schedule a call.',
      },
    }),
  ])

  console.log('✅ Messages created')

  // Create notifications
  await prisma.notification.create({
    data: {
      title: 'New Lead',
      message: 'Anup Gurung submitted an inquiry for Lazimpat Apartment',
      type: 'info',
      userId: superAdmin.id,
    },
  })

  await prisma.notification.create({
    data: {
      title: 'Visit Scheduled',
      message: 'Bikash Shrestha has scheduled a visit for June 28',
      type: 'success',
      userId: superAdmin.id,
    },
  })

  console.log('✅ Notifications created')
  console.log('🎉 Seeding complete!')
  console.log('\n📧 Login Credentials:')
  console.log('   Email: admin@realtocrm.com')
  console.log('   Password: Admin@2059')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
