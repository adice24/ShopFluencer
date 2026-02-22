import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'analytics_events' ORDER BY ordinal_position`
    .then((r: any[]) => console.log("analytics_events cols:", r.map((x: any) => x.column_name).join(', ')))
    .catch((e: any) => console.error("Error:", e.message))
    .finally(() => p.$disconnect());
