import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
    // Check get_store_stats function definition
    const def = await p.$queryRaw<any[]>`
        SELECT prosrc FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_store_stats'
    `;
    console.log("get_store_stats definition:\n", def[0]?.prosrc);

    // Check orders data
    const orders = await p.$queryRaw<any[]>`SELECT store_id, status, total, created_at FROM orders LIMIT 5`;
    console.log("\norders:", orders);

    // Check link_clicks data
    const clicks = await p.$queryRaw<any[]>`SELECT link_id, store_id, created_at FROM link_clicks LIMIT 5`;
    console.log("\nlink_clicks:", clicks);
}

main().catch(e => console.error(e.message)).finally(() => p.$disconnect());
