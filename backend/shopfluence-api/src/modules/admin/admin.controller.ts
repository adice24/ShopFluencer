import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { UserRole, StorefrontStatus } from '@prisma/client';
import type { Request } from 'express';

import { AdminAuthGuard } from './admin-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('overview')
    @ApiOperation({ summary: 'Platform overview stats' })
    async getOverview() {
        return this.adminService.getPlatformOverview();
    }

    @Get('influencers/pending')
    @ApiOperation({ summary: 'Get pending influencer approvals' })
    async getPendingApprovals() {
        return this.adminService.getPendingApprovals();
    }

    @Post('influencers/:userId/approve')
    @ApiOperation({ summary: 'Approve influencer' })
    async approveInfluencer(
        @Param('userId') userId: string,
        @CurrentUser('id') adminId: string,
        @Req() req: Request,
    ) {
        const result = await this.adminService.approveInfluencer(userId);
        await this.adminService.auditLog(adminId, 'influencer.approve', 'user', userId, {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return result;
    }

    @Post('influencers/:userId/reject')
    @ApiOperation({ summary: 'Reject influencer' })
    async rejectInfluencer(@Param('userId') userId: string, @Body('reason') reason?: string) {
        return this.adminService.rejectInfluencer(userId, reason);
    }

    @Post('influencers/:influencerId/brands/:brandId')
    @ApiOperation({ summary: 'Assign brand to influencer' })
    async assignBrand(
        @Param('influencerId') influencerId: string,
        @Param('brandId') brandId: string,
    ) {
        return this.adminService.assignBrand(influencerId, brandId);
    }

    @Delete('influencers/:influencerId/brands/:brandId')
    @ApiOperation({ summary: 'Remove brand from influencer' })
    async removeBrand(
        @Param('influencerId') influencerId: string,
        @Param('brandId') brandId: string,
    ) {
        return this.adminService.removeBrand(influencerId, brandId);
    }

    @Patch('storefronts/:id/status')
    @ApiOperation({ summary: 'Enable/disable storefront' })
    async setStorefrontStatus(
        @Param('id') id: string,
        @Body('status') status: StorefrontStatus,
    ) {
        return this.adminService.setStorefrontStatus(id, status);
    }
}
