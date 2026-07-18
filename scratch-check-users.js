const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany();
  console.log("Users:", users);
  
  const tables = await p.$queryRawUnsafe(`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`);
  console.log("Tables with RLS info:", tables);
}
main().catch(console.error).finally(() => p.$disconnect());
