import { PrismaClient, UserRole, UserStatus, ProductType, ProductStatus, StorefrontStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    // ── Admin User ──────────────────────────────
    const adminHash = await bcrypt.hash('Admin@2026!', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@shopfluence.com' },
        update: {},
        create: {
            email: 'admin@shopfluence.com',
            passwordHash: adminHash,
            firstName: 'Super',
            lastName: 'Admin',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
    });
    console.log(`✅ Admin: ${admin.email}`);

    // ── Sample Influencer ───────────────────────
    const influencerHash = await bcrypt.hash('Influencer@2026!', 12);
    const influencer = await prisma.user.upsert({
        where: { email: 'alex@shopfluence.com' },
        update: {},
        create: {
            email: 'alex@shopfluence.com',
            passwordHash: influencerHash,
            firstName: 'Alex',
            lastName: 'Chen',
            role: UserRole.INFLUENCER,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
    });

    const influencerProfile = await prisma.influencerProfile.upsert({
        where: { userId: influencer.id },
        update: {},
        create: {
            userId: influencer.id,
            displayName: 'Alex Chen',
            bio: 'Wellness & lifestyle influencer helping you live your best life 🌿',
            tier: 'MID',
            instagramHandle: '@alexchen',
            youtubeHandle: '@alexchenwellness',
            followerCount: 250000,
            isVerified: true,
            commissionRate: 12.5,
            approvedAt: new Date(),
        },
    });
    console.log(`✅ Influencer: ${influencer.email}`);

    // ── Categories ──────────────────────────────
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: 'wellness' },
            update: {},
            create: { name: 'Wellness', slug: 'wellness', description: 'Health & wellness products', sortOrder: 1 },
        }),
        prisma.category.upsert({
            where: { slug: 'fitness' },
            update: {},
            create: { name: 'Fitness', slug: 'fitness', description: 'Fitness equipment & gear', sortOrder: 2 },
        }),
        prisma.category.upsert({
            where: { slug: 'beauty' },
            update: {},
            create: { name: 'Beauty', slug: 'beauty', description: 'Skincare & beauty products', sortOrder: 3 },
        }),
        prisma.category.upsert({
            where: { slug: 'fashion' },
            update: {},
            create: { name: 'Fashion', slug: 'fashion', description: 'Clothing & accessories', sortOrder: 4 },
        }),
        prisma.category.upsert({
            where: { slug: 'tech' },
            update: {},
            create: { name: 'Tech', slug: 'tech', description: 'Technology & gadgets', sortOrder: 5 },
        }),
    ]);
    console.log(`✅ Categories: ${categories.length} created`);

    // ── Brands ──────────────────────────────────
    const brands = await Promise.all([
        prisma.brand.upsert({
            where: { slug: 'glow-naturals' },
            update: {},
            create: { name: 'Glow Naturals', slug: 'glow-naturals', description: 'Premium organic skincare', contactEmail: 'brand@glownaturals.com', commissionRate: 15 },
        }),
        prisma.brand.upsert({
            where: { slug: 'peak-performance' },
            update: {},
            create: { name: 'Peak Performance', slug: 'peak-performance', description: 'Athletic performance wear', contactEmail: 'brand@peakperformance.com', commissionRate: 12 },
        }),
        prisma.brand.upsert({
            where: { slug: 'zenith-tech' },
            update: {},
            create: { name: 'Zenith Tech', slug: 'zenith-tech', description: 'Next-gen tech accessories', contactEmail: 'brand@zenithtech.com', commissionRate: 10 },
        }),
    ]);
    console.log(`✅ Brands: ${brands.length} created`);

    // ── Assign Brands to Influencer ─────────────
    for (const brand of brands) {
        await prisma.influencerBrand.upsert({
            where: { influencerId_brandId: { influencerId: influencerProfile.id, brandId: brand.id } },
            update: {},
            create: { influencerId: influencerProfile.id, brandId: brand.id },
        });
    }
    console.log('✅ Brands assigned to influencer');

    // ── Products ────────────────────────────────
    const products = await Promise.all([
        prisma.product.upsert({
            where: { slug: 'glow-vitamin-c-serum' },
            update: {},
            create: {
                name: 'Vitamin C Radiance Serum',
                slug: 'glow-vitamin-c-serum',
                description: 'Brightening vitamin C serum with hyaluronic acid for radiant, youthful skin.',
                shortDescription: 'Brightening vitamin C serum',
                type: ProductType.PHYSICAL,
                status: ProductStatus.ACTIVE,
                basePrice: 1299,
                compareAtPrice: 1799,
                costPrice: 450,
                categoryId: categories[2].id, // Beauty
                brandId: brands[0].id, // Glow Naturals
                taxRate: 18,
                weight: 50,
                metaTitle: 'Vitamin C Serum - Glow Naturals',
                metaDescription: 'Premium vitamin C serum for brightening and anti-aging',
                tags: ['skincare', 'vitamin-c', 'serum', 'anti-aging'],
                isFeatured: true,
            },
        }),
        prisma.product.upsert({
            where: { slug: 'peak-performance-tee' },
            update: {},
            create: {
                name: 'Performance Dry-Fit Tee',
                slug: 'peak-performance-tee',
                description: 'Moisture-wicking performance tee for intense workouts. Lightweight and breathable.',
                shortDescription: 'Dry-fit workout tee',
                type: ProductType.PHYSICAL,
                status: ProductStatus.ACTIVE,
                basePrice: 899,
                compareAtPrice: 1299,
                costPrice: 300,
                categoryId: categories[1].id, // Fitness
                brandId: brands[1].id, // Peak Performance
                taxRate: 12,
                weight: 180,
                tags: ['fitness', 'sportswear', 'tshirt'],
                isFeatured: true,
            },
        }),
        prisma.product.upsert({
            where: { slug: 'zenith-wireless-earbuds' },
            update: {},
            create: {
                name: 'ZenPods Pro Wireless Earbuds',
                slug: 'zenith-wireless-earbuds',
                description: 'True wireless earbuds with ANC, 30hr battery life, and premium sound quality.',
                shortDescription: 'Wireless ANC earbuds',
                type: ProductType.PHYSICAL,
                status: ProductStatus.ACTIVE,
                basePrice: 3499,
                compareAtPrice: 4999,
                costPrice: 1200,
                categoryId: categories[4].id, // Tech
                brandId: brands[2].id, // Zenith Tech
                taxRate: 18,
                weight: 55,
                tags: ['earbuds', 'wireless', 'anc', 'audio'],
                isFeatured: true,
            },
        }),
    ]);
    console.log(`✅ Products: ${products.length} created`);

    // ── Product Variants ────────────────────────
    // Serum variants
    await prisma.productVariant.upsert({
        where: { sku: 'GLOW-VCS-30ML' },
        update: {},
        create: { productId: products[0].id, sku: 'GLOW-VCS-30ML', name: '30ml', price: 1299, stock: 200, attributes: { size: '30ml' } },
    });
    await prisma.productVariant.upsert({
        where: { sku: 'GLOW-VCS-50ML' },
        update: {},
        create: { productId: products[0].id, sku: 'GLOW-VCS-50ML', name: '50ml', price: 1899, stock: 150, attributes: { size: '50ml' } },
    });

    // Tee variants
    for (const size of ['S', 'M', 'L', 'XL']) {
        for (const color of ['Black', 'Navy']) {
            await prisma.productVariant.upsert({
                where: { sku: `PEAK-TEE-${color.toUpperCase()}-${size}` },
                update: {},
                create: {
                    productId: products[1].id,
                    sku: `PEAK-TEE-${color.toUpperCase()}-${size}`,
                    name: `${color} / ${size}`,
                    price: 899,
                    stock: 50,
                    attributes: { color, size },
                },
            });
        }
    }

    // Earbuds variants
    for (const color of ['Midnight Black', 'Cloud White', 'Ocean Blue']) {
        await prisma.productVariant.upsert({
            where: { sku: `ZEN-PODS-${color.replace(/\s/g, '-').toUpperCase()}` },
            update: {},
            create: {
                productId: products[2].id,
                sku: `ZEN-PODS-${color.replace(/\s/g, '-').toUpperCase()}`,
                name: color,
                price: 3499,
                stock: 75,
                attributes: { color },
            },
        });
    }
    console.log('✅ Product variants created');

    // ── Storefront ──────────────────────────────
    const storefront = await prisma.storefront.upsert({
        where: { influencerId: influencerProfile.id },
        update: {},
        create: {
            influencerId: influencerProfile.id,
            slug: 'alex-chen',
            title: "Alex Chen's Wellness Store",
            tagline: 'Curated products for mindful living',
            description: 'My handpicked selection of wellness, fitness, and lifestyle products that I personally use and love.',
            status: StorefrontStatus.PUBLISHED,
            themeColor: '#2d6b6b',
            metaTitle: "Alex Chen's Store - Wellness & Lifestyle Products",
            metaDescription: 'Shop Alex Chen\'s personally curated wellness, fitness, and tech products.',
            publishedAt: new Date(),
        },
    });

    // Add products to storefront
    for (const product of products) {
        await prisma.storefrontProduct.upsert({
            where: { storefrontId_productId: { storefrontId: storefront.id, productId: product.id } },
            update: {},
            create: { storefrontId: storefront.id, productId: product.id },
        });
    }
    console.log(`✅ Storefront created: /store/${storefront.slug}`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:      admin@shopfluence.com / Admin@2026!');
    console.log('   Influencer: alex@shopfluence.com / Influencer@2026!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
