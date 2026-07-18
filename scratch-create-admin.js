const { PrismaClient } = require('@prisma/client'); 
const bcrypt = require('bcryptjs'); 
const prisma = new PrismaClient(); 

async function main() { 
  const hashedPassword = await bcrypt.hash('Admin@2059', 12); 
  await prisma.user.upsert({ 
    where: { email: 'admin@ktmrealstate.com' }, 
    update: { password: hashedPassword, role: 'SUPER_ADMIN' }, 
    create: { name: 'Super Admin', email: 'admin@ktmrealstate.com', password: hashedPassword, role: 'SUPER_ADMIN' } 
  }); 
  console.log('Admin user created/updated.'); 
} 

main().catch(console.error).finally(() => prisma.$disconnect());
