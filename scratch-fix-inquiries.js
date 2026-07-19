// Fix: Restore the gen_random_uuid() default on the inquiries.id column
// This was removed when Prisma pushed its schema

const { PrismaClient } = require('@prisma/client')

async function fixInquiriesId() {
  const prisma = new PrismaClient()
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE inquiries ALTER COLUMN id SET DEFAULT gen_random_uuid()`
    )
    console.log('✅ Fixed: inquiries.id now has DEFAULT gen_random_uuid()')
    
    // Verify the fix
    const result = await prisma.$queryRawUnsafe(
      `SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'id'`
    )
    console.log('Verification:', result)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixInquiriesId()
