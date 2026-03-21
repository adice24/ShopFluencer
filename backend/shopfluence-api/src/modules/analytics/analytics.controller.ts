import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { UserRole, EventType } from '@prisma/client';
import type { Request } from 'express';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event (public)' })
  async trackEvent(
    @Body()
    body: {
      eventType: EventType;
      influencerId?: string;
      storefrontSlug?: string;
      productId?: string;
      visitorId: string;
      sessionId?: string;
      metadata?: Record<string, any>;
    },
    @Req() req: Request,
  ) {
    await this.analyticsService.trackEvent({
      ...body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'],
    });
    return { tracked: true };
  }

  @Get('influencer')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AFFILIATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get influencer analytics dashboard' })
  async getInfluencerDashboard(
    @CurrentUser('id') userId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Get influencer profile ID from user
    return this.analyticsService.getInfluencerDashboard(
      userId,
      dateFrom,
      dateTo,
    );
  }

  @Get('platform')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide analytics (Admin)' })
  async getPlatformAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getPlatformAnalytics(dateFrom, dateTo);
  }

  @Get('suggestions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AFFILIATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get storefront optimization suggestions' })
  async getSuggestions(@CurrentUser('id') userId: string) {
    // Find influencerId from userId
    const user = await this.analyticsService['prisma'].user.findUnique({
      where: { id: userId },
      include: { influencerProfile: true },
    });

    if (!user?.influencerProfile) {
      return [];
    }

    return this.analyticsService.getSuggestions(user.influencerProfile.id);
  }
}
