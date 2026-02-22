import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserStatus, StorefrontStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Approve influencer registration
     */
    async approveInfluencer(userId: string) {
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

        this.logger.log(`Influencer approved: ${userId}`);
        return { message: 'Influencer approved successfully' };
    }

    /**
     * Reject influencer
     */
    async rejectInfluencer(userId: string, reason?: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.INACTIVE },
        });

        this.logger.log(`Influencer rejected: ${userId} — ${reason}`);
        return { message: 'Influencer rejected' };
    }

    /**
     * Assign brand to influencer
     */
    async assignBrand(influencerId: string, brandId: string) {
        return this.prisma.influencerBrand.create({
            data: { influencerId, brandId },
        });
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
        return this.prisma.storefront.update({
            where: { id: storefrontId },
            data: { status },
        });
    }

    /**
     * Get pending influencer approvals
     */
    async getPendingApprovals() {
        return this.prisma.user.findMany({
            where: { role: 'INFLUENCER', status: UserStatus.PENDING_APPROVAL },
            include: {
                influencerProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Platform overview stats
     */
    async getPlatformOverview() {
        const [
            totalUsers,
            totalInfluencers,
            activeStorefronts,
            totalProducts,
            totalOrders,
            totalRevenue,
            pendingApprovals,
        ] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.influencerProfile.count({ where: { isVerified: true } }),
            this.prisma.storefront.count({ where: { status: StorefrontStatus.PUBLISHED } }),
            this.prisma.product.count({ where: { status: 'ACTIVE', deletedAt: null } }),
            this.prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }),
            this.prisma.order.aggregate({
                where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
                _sum: { totalAmount: true },
            }),
            this.prisma.user.count({ where: { role: 'INFLUENCER', status: UserStatus.PENDING_APPROVAL } }),
        ]);

        return {
            totalUsers,
            totalInfluencers,
            activeStorefronts,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            pendingApprovals,
        };
    }

    /**
     * Record audit log
     */
    async auditLog(userId: string, action: string, entityType: string, entityId: string, data?: {
        oldValues?: any;
        newValues?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
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
}
