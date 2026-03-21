import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.brand.updateMany({
        data: { 
            status: 'ACTIVE',
            isActive: true
        }
    });
    console.log(`Updated ${result.count} brands to ACTIVE.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
