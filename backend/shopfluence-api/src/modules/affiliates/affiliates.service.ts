import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { ConversionStatus } from '@prisma/client';

@Injectable()
export class AffiliatesService {
    private readonly logger = new Logger(AffiliatesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Record an affiliate click
     */
    async recordClick(data: {
        influencerId: string;
        storefrontId: string;
        visitorId: string;
        ipAddress?: string;
        userAgent?: string;
        referrerUrl?: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
    }) {
        return this.prisma.affiliateClick.create({ data });
    }

    /**
     * Get affiliate conversions for an influencer
     */
    async getInfluencerConversions(influencerId: string, query: PaginationDto & { status?: ConversionStatus }) {
        const where: any = { influencerId };
        if (query.status) where.status = query.status;

        const [data, total] = await Promise.all([
            this.prisma.affiliateConversion.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: query.skip,
                take: query.take,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            totalAmount: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            this.prisma.affiliateConversion.count({ where }),
        ]);

        return paginate(data, total, query.page || 1, query.limit || 20);
    }

    /**
     * Get commission summary for an influencer
     */
    async getCommissionSummary(influencerId: string) {
        const [pending, confirmed, paidOut] = await Promise.all([
            this.prisma.affiliateConversion.aggregate({
                where: { influencerId, status: ConversionStatus.PENDING },
                _sum: { commissionAmount: true },
                _count: true,
            }),
            this.prisma.affiliateConversion.aggregate({
                where: { influencerId, status: ConversionStatus.CONFIRMED },
                _sum: { commissionAmount: true },
                _count: true,
            }),
            this.prisma.affiliateConversion.aggregate({
                where: { influencerId, status: ConversionStatus.PAID_OUT },
                _sum: { commissionAmount: true },
                _count: true,
            }),
        ]);

        return {
            pending: {
                amount: pending._sum.commissionAmount || 0,
                count: pending._count,
            },
            confirmed: {
                amount: confirmed._sum.commissionAmount || 0,
                count: confirmed._count,
            },
            paidOut: {
                amount: paidOut._sum.commissionAmount || 0,
                count: paidOut._count,
            },
            totalEarnings: Number(confirmed._sum.commissionAmount || 0) + Number(paidOut._sum.commissionAmount || 0),
        };
    }

    /**
     * Get click analytics for an influencer
     */
    async getClickAnalytics(influencerId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const [totalClicks, uniqueVisitors, topReferrers] = await Promise.all([
            this.prisma.affiliateClick.count({
                where: { influencerId, createdAt: { gte: since } },
            }),
            this.prisma.affiliateClick.groupBy({
                by: ['visitorId'],
                where: { influencerId, createdAt: { gte: since } },
            }),
            this.prisma.affiliateClick.groupBy({
                by: ['utmSource'],
                where: { influencerId, createdAt: { gte: since }, utmSource: { not: null } },
                _count: true,
                orderBy: { _count: { utmSource: 'desc' } },
                take: 10,
            }),
        ]);

        return {
            totalClicks,
            uniqueVisitors: uniqueVisitors.length,
            topReferrers,
        };
    }
}
