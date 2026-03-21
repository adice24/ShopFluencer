import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorefrontStatus, UserRole } from '@prisma/client';
import { UpsertStorefrontDto } from './dto/upsert-storefront.dto';

@Injectable()
export class StorefrontService {
  private readonly logger = new Logger(StorefrontService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getInfluencerId(
    userId: string,
    role: string,
    providedInfluencerId?: string,
  ): Promise<string> {
    if (role === UserRole.ADMIN && providedInfluencerId) {
      return providedInfluencerId;
    }

    const profile = await this.prisma.influencerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Influencer profile not found for this user');
    }

    return profile.id;
  }

  private async checkStorefrontOwnership(
    influencerId: string,
    storefrontId: string,
  ) {
    const storefront = await this.prisma.storefront.findUnique({
      where: { id: storefrontId },
    });
    if (!storefront) throw new NotFoundException('Storefront not found');
    if (storefront.influencerId !== influencerId) {
      throw new ForbiddenException(
        'You do not have permission to modify this storefront',
      );
    }
    return storefront;
  }

  /**
   * Get storefront by slug — public, cached endpoint
   * This is the most read-heavy endpoint in the platform
   */
  async getBySlug(slug: string) {
    const storefront = await this.prisma.storefront.findUnique({
      where: { slug },
      include: {
        influencer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        products: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' }, take: 3 },
                brand: { select: { name: true, slug: true, logoUrl: true } },
                variants: {
                  where: { isActive: true, stock: { gt: 0 } },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!storefront || storefront.status !== StorefrontStatus.PUBLISHED) {
      throw new NotFoundException('Storefront not found');
    }

    // Increment view count asynchronously (fire-and-forget)
    this.prisma.storefront
      .update({
        where: { id: storefront.id },
        data: { totalViews: { increment: 1 } },
      })
      .catch(() => {}); // Don't block the response

    return {
      ...storefront,
      // SEO meta generation
      meta: {
        title: storefront.metaTitle || `${storefront.title} | ShopFluence`,
        description:
          storefront.metaDescription ||
          storefront.description ||
          `Shop ${storefront.title}'s curated products`,
        ogImage: storefront.bannerUrl || storefront.influencer.user.avatarUrl,
        canonical: `/store/${storefront.slug}`,
      },
    };
  }

  /**
   * Create or update storefront for an influencer
   */
  async upsert(userId: string, role: string, data: UpsertStorefrontDto) {
    const influencerId = await this.getInfluencerId(
      userId,
      role,
      data.influencerId,
    );

    const existingWithSlug = await this.prisma.storefront.findUnique({
      where: { slug: data.slug },
    });
    if (existingWithSlug && existingWithSlug.influencerId !== influencerId) {
      throw new ConflictException(
        'Slug is already taken by another storefront',
      );
    }

    const { influencerId: _omitted, ...upsertData } = data;

    return this.prisma.storefront.upsert({
      where: { influencerId },
      create: { influencerId, ...upsertData },
      update: upsertData,
    });
  }

  /**
   * Publish / unpublish storefront
   */
  async setStatus(storefrontId: string, status: StorefrontStatus) {
    const storefront = await this.prisma.storefront.update({
      where: { id: storefrontId },
      data: {
        status,
        publishedAt:
          status === StorefrontStatus.PUBLISHED ? new Date() : undefined,
      },
    });

    this.logger.log(`Storefront ${storefrontId} status set to ${status}`);
    return storefront;
  }

  /**
   * Add product to storefront
   */
  async addProduct(
    userId: string,
    role: string,
    storefrontId: string,
    productId: string,
    customNote?: string,
  ) {
    if (role !== UserRole.ADMIN) {
      const influencerId = await this.getInfluencerId(userId, role);
      await this.checkStorefrontOwnership(influencerId, storefrontId);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.storefrontProduct.upsert({
      where: {
        storefrontId_productId: { storefrontId, productId },
      },
      create: { storefrontId, productId, customNote },
      update: { customNote },
    });
  }

  /**
   * Remove product from storefront
   */
  async removeProduct(
    userId: string,
    role: string,
    storefrontId: string,
    productId: string,
  ) {
    if (role !== UserRole.ADMIN) {
      const influencerId = await this.getInfluencerId(userId, role);
      await this.checkStorefrontOwnership(influencerId, storefrontId);
    }

    return this.prisma.storefrontProduct.deleteMany({
      where: { storefrontId, productId },
    });
  }

  /**
   * Get all storefronts (admin)
   */
  async findAll(status?: StorefrontStatus) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.storefront.findMany({
      where,
      include: {
        influencer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
