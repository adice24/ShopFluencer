import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
    // Check influencer_stores columns
    const cols = await p.$queryRaw<any[]>`
        SELECT column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'influencer_stores'
        ORDER BY ordinal_position
    `;
    console.log("influencer_stores cols:", cols.map((c: any) => c.column_name).join(', '));

    // Check actual is_active values for the stores
    const stores = await p.$queryRaw<any[]>`
        SELECT id, slug, is_approved, is_active FROM influencer_stores
    `;
    console.log("Store is_active values:", JSON.stringify(stores, null, 2));
}

main().catch(e => console.error(e.message)).finally(() => p.$disconnect());
