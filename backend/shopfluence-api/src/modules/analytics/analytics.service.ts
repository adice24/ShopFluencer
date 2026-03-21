import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventType, Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track an analytics event (fire-and-forget pattern)
   */
  async trackEvent(data: {
    eventType: EventType;
    influencerId?: string;
    storefrontSlug?: string;
    productId?: string;
    visitorId: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: data.eventType,
          influencerId: data.influencerId || null,
          storefrontSlug: data.storefrontSlug || null,
          productId: data.productId || null,
          visitorId: data.visitorId,
          sessionId: data.sessionId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          referrer: data.referrer || null,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      // Don't let analytics failures break the app
      this.logger.error(`Failed to track event: ${error}`);
    }
  }

  /**
   * Get dashboard summary for an influencer
   */
  async getInfluencerDashboard(
    influencerId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const where: Prisma.AnalyticsEventWhereInput = {
      influencerId,
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    };

    const [totalViews, totalClicks, totalPurchases, recentEvents] =
      await Promise.all([
        this.prisma.analyticsEvent.count({
          where: { ...where, eventType: EventType.STOREFRONT_VIEW },
        }),
        this.prisma.analyticsEvent.count({
          where: { ...where, eventType: EventType.PRODUCT_CLICK },
        }),
        this.prisma.analyticsEvent.count({
          where: { ...where, eventType: EventType.PURCHASE },
        }),
        this.prisma.analyticsEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            eventType: true,
            storefrontSlug: true,
            productId: true,
            createdAt: true,
          },
        }),
      ]);

    const conversionRate =
      totalViews > 0
        ? ((totalPurchases / totalViews) * 100).toFixed(2)
        : '0.00';

    // Get revenue from affiliate conversions
    const revenue = await this.prisma.affiliateConversion.aggregate({
      where: {
        influencerId,
        status: { in: ['CONFIRMED', 'PAID_OUT'] },
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      _sum: { orderAmount: true, commissionAmount: true },
      _count: true,
    });

    return {
      summary: {
        totalViews,
        totalClicks,
        totalPurchases,
        conversionRate: `${conversionRate}%`,
        totalRevenue: revenue._sum.orderAmount || 0,
        totalCommission: revenue._sum.commissionAmount || 0,
        totalOrders: revenue._count,
      },
      recentEvents,
    };
  }

  /**
   * Get platform-wide analytics (admin)
   */
  async getPlatformAnalytics(dateFrom?: string, dateTo?: string) {
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const where: Prisma.AnalyticsEventWhereInput = Object.keys(dateFilter)
      .length
      ? { createdAt: dateFilter }
      : {};

    const [
      totalStorefrontViews,
      totalProductClicks,
      totalPurchases,
      activeInfluencers,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { ...where, eventType: EventType.STOREFRONT_VIEW },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...where, eventType: EventType.PRODUCT_CLICK },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...where, eventType: EventType.PURCHASE },
      }),
      this.prisma.influencerProfile.count({
        where: { isVerified: true },
      }),
      this.prisma.order.count({
        where: {
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Daily revenue chart (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyAggregates = await this.prisma.analyticsDailyAggregate.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    return {
      summary: {
        totalStorefrontViews,
        totalProductClicks,
        totalPurchases,
        activeInfluencers,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        platformConversionRate:
          totalStorefrontViews > 0
            ? `${((totalPurchases / totalStorefrontViews) * 100).toFixed(2)}%`
            : '0.00%',
      },
      dailyChart: dailyAggregates,
    };
  }

  /**
   * Aggregate daily analytics (called by cron job)
   */
  async aggregateDaily(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { gte: startOfDay, lte: endOfDay } };

    // Get all influencer IDs that had events
    const influencerEvents = await this.prisma.analyticsEvent.groupBy({
      by: ['influencerId', 'storefrontSlug'],
      where: { ...dateFilter, influencerId: { not: null } },
      _count: true,
    });

    for (const group of influencerEvents) {
      if (!group.influencerId) continue;

      const views = await this.prisma.analyticsEvent.count({
        where: {
          ...dateFilter,
          influencerId: group.influencerId,
          eventType: EventType.STOREFRONT_VIEW,
        },
      });

      const uniqueVisitors = await this.prisma.analyticsEvent.groupBy({
        by: ['visitorId'],
        where: {
          ...dateFilter,
          influencerId: group.influencerId,
          eventType: EventType.STOREFRONT_VIEW,
        },
      });

      const clicks = await this.prisma.analyticsEvent.count({
        where: {
          ...dateFilter,
          influencerId: group.influencerId,
          eventType: EventType.PRODUCT_CLICK,
        },
      });

      const orders = await this.prisma.affiliateConversion.count({
        where: {
          influencerId: group.influencerId,
          ...dateFilter,
          status: 'CONFIRMED',
        },
      });

      const revenue = await this.prisma.affiliateConversion.aggregate({
        where: {
          influencerId: group.influencerId,
          ...dateFilter,
          status: 'CONFIRMED',
        },
        _sum: { orderAmount: true },
      });

      await this.prisma.analyticsDailyAggregate.upsert({
        where: {
          date_influencerId_storefrontSlug: {
            date: startOfDay,
            influencerId: group.influencerId,
            storefrontSlug: group.storefrontSlug || '',
          },
        },
        create: {
          date: startOfDay,
          influencerId: group.influencerId,
          storefrontSlug: group.storefrontSlug,
          totalViews: views,
          uniqueVisitors: uniqueVisitors.length,
          productClicks: clicks,
          orders,
          revenue: Number(revenue._sum.orderAmount || 0),
          conversionRate: views > 0 ? orders / views : 0,
        },
        update: {
          totalViews: views,
          uniqueVisitors: uniqueVisitors.length,
          productClicks: clicks,
          orders,
          revenue: Number(revenue._sum.orderAmount || 0),
          conversionRate: views > 0 ? orders / views : 0,
        },
      });
    }

    this.logger.log(
      `Daily analytics aggregated for ${startOfDay.toISOString().slice(0, 10)}`,
    );
  }

  /**
   * Get storefront optimization suggestions
   */
  async getSuggestions(influencerId: string) {
    // Calculate basic metrics to give personalized suggestions
    const metrics = await this.getInfluencerDashboard(influencerId);
    const { totalViews, totalClicks, conversionRate } = metrics.summary;
    const convRateNum = parseFloat(conversionRate);

    const suggestions = [];

    // 1. Bio / Profile Completeness
    const profile = await this.prisma.influencerProfile.findUnique({
      where: { id: influencerId },
    });

    if (profile && !profile.bio) {
      suggestions.push({
        type: 'PROFILE',
        title: 'Add a Bio',
        description:
          'A compelling bio increases trust. Tell your audience why you recommend these products.',
        actionText: 'Update Profile',
        actionLink: '/dashboard/settings',
        priority: 'HIGH',
      });
    }

    // 2. Click-through optimization
    if (totalViews > 100 && totalClicks < totalViews * 0.1) {
      suggestions.push({
        type: 'STOREFRONT',
        title: 'Low Click-Through Rate',
        description: `Your CTR is ${((totalClicks / totalViews) * 100).toFixed(1)}%. Consider updating product thumbnails or rearranging your top products.`,
        actionText: 'Manage Products',
        actionLink: '/dashboard/products',
        priority: 'MEDIUM',
      });
    }

    // 3. Conversion optimization
    if (totalClicks > 50 && convRateNum < 2.0) {
      suggestions.push({
        type: 'CONVERSION',
        title: 'Improve Conversions',
        description: `Your conversion rate is ${conversionRate}. Try adding personal reviews or highlighting discounts.`,
        actionText: 'Add Reviews',
        actionLink: '/dashboard/products',
        priority: 'HIGH',
      });
    }

    // 4. Default suggestion if they are doing well
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'GROWTH',
        title: 'Share Your Store',
        description:
          'You are doing great! Share your link on new platforms to get more traffic.',
        actionText: 'Copy Link',
        actionLink: '/dashboard/links',
        priority: 'LOW',
      });
    }

    return suggestions;
  }
}
