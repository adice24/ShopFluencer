import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Activate all Brands
    const brands = await prisma.brand.updateMany({
        data: { 
            status: 'ACTIVE',
            isActive: true
        }
    });
    console.log(`Updated ${brands.count} brands to ACTIVE.`);

    // 2. Verify all Influencers
    const influencers = await prisma.influencerProfile.updateMany({
        data: { 
            isVerified: true,
            approvedAt: new Date()
        }
    });
    console.log(`Updated ${influencers.count} influencer profiles to VERIFIED.`);

    // 3. Set all Users to ACTIVE and ADMIN (optional, but keep it for testing)
    const users = await prisma.user.updateMany({
        data: { 
            status: 'ACTIVE',
            role: 'ADMIN' 
        }
    });
    console.log(`Updated ${users.count} users to ACTIVE ADMIN.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
