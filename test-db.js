const { PrismaClient } = require('@prisma/client')

async function test() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
  const prisma = new PrismaClient()
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connected!', result)
    const count = await prisma.property.count()
    console.log('Properties count:', count)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()
