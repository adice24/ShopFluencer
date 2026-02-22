import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    try {
        const res = await prisma.$queryRawUnsafe(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'influencer_stores';
    `);
        console.log("Current Policies:", res);

        const policies = res as any[];
        for (const p of policies) {
            await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${p.policyname}" ON influencer_stores;`);
        }

        await prisma.$executeRawUnsafe(`ALTER TABLE influencer_stores DISABLE ROW LEVEL SECURITY;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE influencer_stores ENABLE ROW LEVEL SECURITY;`);

        await prisma.$executeRawUnsafe(`
      CREATE POLICY "public_read_stores" 
      ON influencer_stores FOR SELECT 
      USING (true);
    `);

        await prisma.$executeRawUnsafe(`
      CREATE POLICY "user_insert_store" 
      ON influencer_stores FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    `);

        await prisma.$executeRawUnsafe(`
      CREATE POLICY "user_update_store" 
      ON influencer_stores FOR UPDATE 
      USING (auth.uid() = user_id);
    `);

        console.log("RLS successfully fixed and replaced.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
