import { Controller, Post, Get, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AffiliatesService } from './affiliates.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

@ApiTags('Affiliates')
@Controller('affiliates')
export class AffiliatesController {
    constructor(private readonly affiliatesService: AffiliatesService) { }

    @Post('click')
    @ApiOperation({ summary: 'Record an affiliate click (public)' })
    async recordClick(@Body() body: any, @Req() req: Request) {
        return this.affiliatesService.recordClick({
            ...body,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            referrerUrl: req.headers['referer'],
        });
    }

    @Get('conversions')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.INFLUENCER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my conversions (Influencer)' })
    async getConversions(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
        return this.affiliatesService.getInfluencerConversions(userId, query);
    }

    @Get('commissions')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.INFLUENCER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get commission summary (Influencer)' })
    async getCommissions(@CurrentUser('id') userId: string) {
        return this.affiliatesService.getCommissionSummary(userId);
    }

    @Get('clicks')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.INFLUENCER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get click analytics (Influencer)' })
    async getClicks(@CurrentUser('id') userId: string, @Query('days') days?: number) {
        return this.affiliatesService.getClickAnalytics(userId, days);
    }
}
