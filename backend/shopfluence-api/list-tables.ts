import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    .then((r: any[]) => console.log(r.map((x: any) => x.tablename).join('\n')))
    .finally(() => p.$disconnect());
