import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, UserStatus, StorefrontStatus, BrandStatus } from '@prisma/client';
import { AdminRealtimeService } from './admin-realtime.service';
import { CatalogService } from '../catalog/catalog.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminRealtime: AdminRealtimeService,
    private readonly catalogService: CatalogService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  private pushRealtime(...scopes: string[]) {
    this.adminRealtime.emit(scopes);
  }

  /**
   * Approve affiliate registration
   */
  async approveAffiliate(userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
      }),
      this.prisma.influencerProfile.update({
        where: { userId },
        data: { approvedAt: new Date(), isVerified: true },
      }),
    ]);

    this.logger.log(`Affiliate approved: ${userId}`);
    this.pushRealtime('overview', 'approvals', 'users');
    return { message: 'Affiliate approved successfully' };
  }

  /**
   * Reject user
   */
  async rejectUser(userId: string, reason?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE },
    });

    this.logger.log(`User rejected: ${userId} — ${reason}`);
    this.pushRealtime('overview', 'approvals', 'users');
    return { message: 'User rejected' };
  }

  /**
   * Approve Brand
   */
  async approveBrand(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    // Search for the brand linked to this user and activate it
    await this.prisma.brand.updateMany({
      where: { ownerId: userId },
      data: { isActive: true, status: BrandStatus.ACTIVE },
    });

    this.logger.log(`Brand approved: ${userId}`);
    this.pushRealtime('overview', 'approvals', 'users');
    return { message: 'Brand approved successfully' };
  }

  /**
   * Approve Product
   */
  async approveProduct(productId: string) {
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(`Product approved: ${productId}`);
    this.pushRealtime('overview', 'products');
    return { message: 'Product approved successfully' };
  }

  /**
   * Update Brand Commission
   */
  async updateBrandCommission(brandId: string, rate: number) {
    const out = await this.prisma.brand.update({
      where: { id: brandId },
      data: { commissionRate: rate },
    });
    this.pushRealtime('overview', 'users');
    return out;
  }

  /**
   * Get All Transactions
   */
  async getTransactions(limit = 100) {
    return this.prisma.order.findMany({
      include: {
        user: true,
        items: true,
        affiliateConversion: {
          include: {
            influencer: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPlatformAnalytics(dateFrom?: string, dateTo?: string) {
    return this.analyticsService.getPlatformAnalytics(dateFrom, dateTo);
  }

  listCategories() {
    return this.catalogService.getCategories(false);
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
  }) {
    const out = await this.catalogService.createCategory(data);
    this.pushRealtime('overview', 'products');
    return out;
  }

  /**
   * Assign brand to influencer
   */
  async assignBrand(influencerId: string, brandId: string) {
    const out = await this.prisma.influencerBrand.create({
      data: { influencerId, brandId },
    });
    this.pushRealtime('overview', 'users');
    return out;
  }

  /**
   * Remove brand from influencer
   */
  async removeBrand(influencerId: string, brandId: string) {
    return this.prisma.influencerBrand.deleteMany({
      where: { influencerId, brandId },
    });
  }

  /**
   * Enable/disable storefront
   */
  async setStorefrontStatus(storefrontId: string, status: StorefrontStatus) {
    const out = await this.prisma.storefront.update({
      where: { id: storefrontId },
      data: { status },
    });
    this.pushRealtime('overview');
    return out;
  }

  /**
   * Get pending approvals (Affiliates & Brands)
   */
  async getPendingApprovals() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['AFFILIATE', 'BRAND'] },
        status: UserStatus.PENDING_APPROVAL,
      },
      include: {
        influencerProfile: true,
        managedBrands: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pending product approvals
   */
  async getPendingProductApprovals() {
    return this.prisma.product.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: { brand: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Platform overview stats
   */
  async getPlatformOverview() {
    const [
      totalUsers,
      totalAffiliates,
      totalBrands,
      activeStorefronts,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCommissions,
      pendingUserApprovals,
      pendingProductApprovals,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.influencerProfile.count({ where: { isVerified: true } }),
      this.prisma.brand.count({ where: { isActive: true } }),
      this.prisma.storefront.count({
        where: { status: StorefrontStatus.PUBLISHED },
      }),
      this.prisma.product.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.order.count({
        where: {
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.affiliateConversion.aggregate({
        where: { status: { in: ['CONFIRMED', 'PAID_OUT'] } },
        _sum: { commissionAmount: true },
      }),
      this.prisma.user.count({
        where: {
          role: { in: ['AFFILIATE', 'BRAND'] },
          status: UserStatus.PENDING_APPROVAL,
        },
      }),
      this.prisma.product.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    return {
      totalUsers,
      totalAffiliates,
      totalBrands,
      activeStorefronts,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalCommissions: totalCommissions._sum.commissionAmount || 0,
      pendingUserApprovals,
      pendingProductApprovals,
    };
  }

  /**
   * Record audit log
   */
  async auditLog(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    data?: {
      oldValues?: any;
      newValues?: any;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues: data?.oldValues,
        newValues: data?.newValues,
        ipAddress: data?.ipAddress,
        userAgent: data?.userAgent,
      },
    });
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string) {
    const normalized = role.toUpperCase() as UserRole;
    if (!Object.values(UserRole).includes(normalized)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }
    return this.prisma.user.findMany({
      where: { role: normalized, deletedAt: null },
      include: {
        influencerProfile: true,
        managedBrands: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string) {
    const out = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });
    this.pushRealtime('overview', 'approvals', 'users');
    return out;
  }

  /**
   * Delete product (Soft delete)
   */
  async deleteProduct(productId: string) {
    const out = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: 'DISCONTINUED',
        deletedAt: new Date(),
      },
    });
    this.pushRealtime('overview', 'products');
    return out;
  }

  /**
   * Update product info (Admin)
   */
  async updateProduct(productId: string, data: Record<string, unknown>) {
    const { updatedAt: _ignore, ...rest } = data || {};
    const out = await this.prisma.product.update({
      where: { id: productId },
      data: rest as any,
    });
    this.pushRealtime('overview', 'products');
    return out;
  }

  /**
   * Get platform setting
   */
  async getPlatformSetting(key: string) {
    return this.prisma.platformSetting.findUnique({
      where: { key },
    });
  }

  /**
   * Update platform setting
   */
  async updatePlatformSetting(key: string, value: any, adminId: string) {
    const out = await this.prisma.platformSetting.upsert({
      where: { key },
      update: {
        value,
        updatedBy: adminId,
      },
      create: {
        key,
        value,
        updatedBy: adminId,
      },
    });
    this.pushRealtime('settings', 'overview');
    return out;
  }
}
