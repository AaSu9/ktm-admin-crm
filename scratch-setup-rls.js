const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log("Enabling public RLS read access for User (Agents) and blogs...");
  
  // Public select for User where role = 'AGENT' and isActive = true
  await p.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'User' AND policyname = 'Public Agent Read Access'
      ) THEN
        CREATE POLICY "Public Agent Read Access" ON "public"."User"
          FOR SELECT
          USING (role = 'AGENT' AND "isActive" = true);
      END IF;
    END
    $$;
  `);

  // Public select for blogs
  await p.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Public Blogs Read Access'
      ) THEN
        CREATE POLICY "Public Blogs Read Access" ON "public"."blogs"
          FOR SELECT
          USING (published = true);
      END IF;
    END
    $$;
  `);

  console.log("RLS policies created successfully!");
}

main().catch(console.error).finally(() => p.$disconnect());
