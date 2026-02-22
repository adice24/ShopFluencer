import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'influencer_stores' ORDER BY ordinal_position`
    .then((r: any[]) => {
        console.log("influencer_stores cols:", r.map((x: any) => x.column_name).join(', '));
        return p.$queryRaw`SELECT * FROM influencer_stores LIMIT 2`;
    })
    .then((r: any[]) => console.log("sample:", r))
    .catch((e: any) => console.error("Error:", e.message))
    .finally(() => p.$disconnect());
