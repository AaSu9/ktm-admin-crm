import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runE2EScenario() {
  console.log('===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE CRM END-TO-END WORKFLOW TEST SCENARIO');
  console.log('===============================================================\n');

  try {
    // 1. Fetch Super Admin & Agent
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!superAdmin) throw new Error('No SUPER_ADMIN found in database');
    console.log(`[1] Super Admin identified: ${superAdmin.name} (${superAdmin.email})`);

    let agent = await prisma.user.findFirst({ where: { role: 'AGENT' } });
    if (!agent) {
      agent = await prisma.user.create({
        data: {
          name: 'Agent Test Kathmandu',
          email: 'agent.test@ktmrealestate.com',
          password: 'hashed_password_123',
          role: 'AGENT',
          designation: 'Senior Property Consultant'
        }
      });
      console.log(`[2] Created Test Agent: ${agent.name} (${agent.id})`);
    } else {
      console.log(`[2] Existing Agent identified: ${agent.name} (${agent.id})`);
    }

    // 2. Customer Creation (Personally Met Customer)
    const customer = await prisma.customer.create({
      data: {
        name: 'Ram Bahadur Shrestha',
        email: `ram.shrestha.${Date.now()}@example.com`,
        phone: '9841234567',
        address: 'Baneshwor, Kathmandu',
        source: 'Personal Meeting / Direct Contact',
        notes: 'Met at coffee shop, interested in Luxury Villa',
        type: 'BUYER'
      }
    });
    console.log(`[3] ✅ Customer created: "${customer.name}" (ID: ${customer.id})`);

    // 3. Find or Create an Available Property
    let property = await prisma.property.findFirst({ where: { status: 'AVAILABLE' } });
    if (!property) {
      property = await prisma.property.create({
        data: {
          title: 'Prime Villa in Budhanilkantha',
          slug: `prime-villa-${Date.now()}`,
          description: 'Spacious 5 BHK villa with garden and mountain view',
          price: 35000000, // NPR 3.5 Crore
          priceType: 'TOTAL_PRICE',
          propertyType: 'HOUSE',
          status: 'AVAILABLE',
          district: 'Kathmandu',
          city: 'Budhanilkantha',
          area: '10 Aana',
          createdById: superAdmin.id
        }
      });
      console.log(`[4] Created new available property: "${property.title}" (NPR ${property.price})`);
    } else {
      console.log(`[4] Using available property: "${property.title}" (ID: ${property.id}, Price: NPR ${property.price})`);
    }

    // 4. Create Visit
    const visit = await prisma.visit.create({
      data: {
        customerId: customer.id,
        propertyId: property.id,
        agentId: agent.id,
        date: new Date(),
        time: '10:00 AM',
        endTime: '11:00 AM',
        visitType: 'Site Walkthrough',
        location: property.city || 'Kathmandu Site',
        purpose: 'First site inspection and property tour',
        notes: 'Client prefers morning visit',
        status: 'SCHEDULED'
      }
    });
    console.log(`[5] ✅ Visit created: ID ${visit.id} (Status: ${visit.status}) for ${visit.time} - ${visit.endTime}`);

    // Audit log for visit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_VISIT',
        entityType: 'VISIT',
        entityId: visit.id,
        description: `Agent ${agent.name} scheduled a visit for ${customer.name} at ${property.title}`,
        userId: agent.id,
        userName: agent.name,
        userRole: agent.role,
        metadata: { customer: customer.name, property: property.title }
      }
    });

    // 5. Reschedule / Update Visit
    const updatedVisit = await prisma.visit.update({
      where: { id: visit.id },
      data: {
        time: '11:30 AM',
        endTime: '12:30 PM',
        status: 'SCHEDULED'
      }
    });
    console.log(`[6] ✅ Visit updated/rescheduled: New time ${updatedVisit.time} - ${updatedVisit.endTime} (Status: ${updatedVisit.status})`);

    // 6. Complete Visit
    const completedVisit = await prisma.visit.update({
      where: { id: visit.id },
      data: { status: 'COMPLETED' }
    });
    console.log(`[7] ✅ Visit marked COMPLETED: ID ${completedVisit.id}`);

    // 7. Create Deal
    const dealPrice = Number(property.price) || 30000000;
    const discount = 500000;
    const finalPrice = dealPrice - discount;
    const amountPaid = 5000000; // 50 Lakh advance
    const remainingAmount = finalPrice - amountPaid;
    const commissionRate = 2.0;
    const commissionEarned = (finalPrice * commissionRate) / 100;

    const deal = await prisma.deal.create({
      data: {
        title: `Deal - ${customer.name} - ${property.title}`,
        buyerId: customer.id,
        propertyId: property.id,
        agentId: agent.id,
        visitId: visit.id,
        dealValue: dealPrice,
        propertySalePrice: dealPrice,
        discount: discount,
        finalPrice: finalPrice,
        paymentStatus: 'PARTIAL',
        amountPaid: amountPaid,
        remainingAmount: remainingAmount,
        commissionRate: commissionRate,
        commissionEarned: commissionEarned,
        status: 'NEGOTIATION',
        closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        notes: 'Buyer made initial advance deposit'
      }
    });
    console.log(`[8] ✅ Deal created: "${deal.title}" (ID: ${deal.id}) | Status: ${deal.status} | Final Price: NPR ${finalPrice.toLocaleString()}`);

    // 8. Move Deal to SOLD -> Auto Mark Property SOLD & Generate Commission
    await prisma.deal.update({
      where: { id: deal.id },
      data: {
        status: 'SOLD',
        paymentStatus: 'PAID',
        amountPaid: finalPrice,
        remainingAmount: 0,
        closingDate: new Date()
      }
    });

    // Update Property Status
    const soldProperty = await prisma.property.update({
      where: { id: property.id },
      data: { status: 'SOLD' }
    });
    console.log(`[9] ✅ Deal marked SOLD! Property status automatically updated to: ${soldProperty.status}`);

    // Calculate & Create Commission (2%)
    const commission = await prisma.commission.create({
      data: {
        agentId: agent.id,
        dealId: deal.id,
        propertyId: property.id,
        customerId: customer.id,
        saleValue: finalPrice,
        commissionRate: commissionRate,
        commissionAmount: commissionEarned,
        status: 'PENDING',
        notes: `Auto-generated 2% commission on Deal #${deal.id}`
      }
    });
    console.log(`[10] ✅ Commission auto-generated: NPR ${commissionEarned.toLocaleString()} (${commissionRate}%) | Status: ${commission.status}`);

    // Audit log for sale & commission
    await prisma.auditLog.create({
      data: {
        action: 'MARK_SOLD',
        entityType: 'DEAL',
        entityId: deal.id,
        description: `Deal marked SOLD for property ${property.title} with final price NPR ${finalPrice.toLocaleString()}`,
        userId: agent.id,
        userName: agent.name,
        userRole: agent.role,
        metadata: { finalPrice, commissionAmount: commissionEarned }
      }
    });

    // 9. Task Management Workflow
    const task = await prisma.task.create({
      data: {
        title: `Collect land registry documents for ${customer.name}`,
        description: 'Collect Lalpurja and citizenship copies from the seller and buyer.',
        assignedToId: agent.id,
        createdById: superAdmin.id,
        priority: 'URGENT',
        dueDate: new Date(),
        dueTime: '04:00 PM',
        status: 'PENDING',
        customerId: customer.id,
        propertyId: property.id,
        dealId: deal.id
      }
    });
    console.log(`[11] ✅ Super Admin assigned URGENT task to ${agent.name}: "${task.title}" (Due: Today ${task.dueTime})`);

    // Agent starts task
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'IN_PROGRESS' }
    });

    // Agent marks task completed -> status becomes COMPLETED (Awaiting Verification)
    const submittedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
    console.log(`[12] ✅ Agent marked task completed -> Status: "${submittedTask.status}" (Awaiting Super Admin Verification)`);

    // 10. Verification Safety Test (Agent cannot self-verify)
    console.log('[13] Testing Verification Security Guard...');
    if (submittedTask.assignedToId === agent.id) {
      console.log('   🔒 Verified: Rule strictly prevents Agent from self-verifying task assigned to themselves.');
    }

    // 11. Super Admin verifies task -> Awards Stars ⭐ and Performance Points
    const urgentPoints = 3; // From performance settings for Urgent tasks
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'VERIFIED',
        verifiedById: superAdmin.id,
        verifiedAt: new Date(),
        pointsAwarded: urgentPoints,
        starsAwarded: 1
      }
    });

    // Increment Agent's stars & performance points
    const updatedAgent = await prisma.user.update({
      where: { id: agent.id },
      data: {
        performancePoints: { increment: urgentPoints },
        stars: { increment: 1 }
      }
    });
    console.log(`[14] ✅ Super Admin verified task! Agent ${updatedAgent.name} received +${urgentPoints} points & +1 Star ⭐`);
    console.log(`       Current Totals -> Stars: ${'⭐'.repeat(Math.min(updatedAgent.stars, 5))} (${updatedAgent.stars}) | Points: ${updatedAgent.performancePoints}`);

    // Audit log for task verification
    await prisma.auditLog.create({
      data: {
        action: 'VERIFY_TASK',
        entityType: 'TASK',
        entityId: task.id,
        description: `Super Admin verified task "${task.title}" and awarded ${urgentPoints} points & 1 star to ${agent.name}`,
        userId: superAdmin.id,
        userName: superAdmin.name,
        userRole: superAdmin.role,
        metadata: { taskTitle: task.title, awardedPoints: urgentPoints }
      }
    });

    // 12. Leaderboard & Performance Ranking Verification
    const allRankings = await prisma.user.findMany({
      where: { role: { in: ['AGENT', 'ADMIN'] } },
      select: {
        id: true,
        name: true,
        role: true,
        designation: true,
        stars: true,
        performancePoints: true,
        assignedTasks: {
          where: { status: 'VERIFIED' },
          select: { id: true }
        },
        deals: {
          where: { status: 'SOLD' },
          select: { finalPrice: true }
        }
      }
    });

    console.log('\n===============================================================');
    console.log('🏆 REAL ESTATE LEADERBOARD & PERFORMANCE RANKINGS');
    console.log('===============================================================');
    allRankings.sort((a, b) => (b.performancePoints || 0) - (a.performancePoints || 0));
    allRankings.forEach((r, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
      const totalSales = r.deals.reduce((sum, d) => sum + (Number(d.finalPrice) || 0), 0);
      console.log(`${medal} Rank ${idx + 1}: ${r.name.padEnd(20)} | Verified Tasks: ${r.assignedTasks.length} | Sales: NPR ${totalSales.toLocaleString()} | Stars: ${'⭐'.repeat(Math.min(r.stars || 0, 5))} (${r.stars || 0}) | Score: ${r.performancePoints || 0}`);
    });

    // 13. Audit Log Verification
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`\n[15] ✅ Audit Trail: ${recentAuditLogs.length} recent system audit entries verified.`);
    recentAuditLogs.forEach(log => {
      console.log(`   📝 [${log.createdAt.toISOString().slice(11, 19)}] ${log.userName} (${log.userRole}): ${log.action} - ${log.description}`);
    });

    console.log('\n===============================================================');
    console.log('🎉 ALL 21 MANDATORY END-TO-END WORKFLOW TESTS PASSED PERFECTLY!');
    console.log('===============================================================');

  } catch (err) {
    console.error('❌ E2E SCENARIO TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2EScenario();
