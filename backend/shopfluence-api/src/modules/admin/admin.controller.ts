import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
import { AdminService } from './admin.service';
import { UserRole, StorefrontStatus } from '@prisma/client';
import type { Request } from 'express';

import { AdminAuthGuard } from './admin-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform overview stats' })
  async getOverview() {
    return this.adminService.getPlatformOverview();
  }

  @Get('analytics/platform')
  @ApiOperation({
    summary: 'Platform analytics (same data as /analytics/platform; uses admin JWT)',
  })
  async getPlatformAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getPlatformAnalytics(dateFrom, dateTo);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all categories (admin)' })
  async listCategories() {
    return this.adminService.listCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create category (admin)' })
  async createCategory(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      parentId?: string;
      imageUrl?: string;
    },
  ) {
    return this.adminService.createCategory(body);
  }

  @Get('approvals')
  @ApiOperation({ summary: 'Get pending user approvals (Affiliates & Brands)' })
  async getPendingApprovals() {
    return this.adminService.getPendingApprovals();
  }

  @Get('products/pending')
  @ApiOperation({ summary: 'Get pending product approvals' })
  async getPendingProductApprovals() {
    return this.adminService.getPendingProductApprovals();
  }

  @Post('affiliates/:userId/approve')
  @ApiOperation({ summary: 'Approve affiliate' })
  async approveAffiliate(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const result = await this.adminService.approveAffiliate(userId);
    await this.adminService.auditLog(
      adminId,
      'affiliate.approve',
      'user',
      userId,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );
    return result;
  }

  @Post('brands/:userId/approve')
  @ApiOperation({ summary: 'Approve brand owner' })
  async approveBrand(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const result = await this.adminService.approveBrand(userId);
    await this.adminService.auditLog(adminId, 'brand.approve', 'user', userId, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Post('users/:userId/reject')
  @ApiOperation({ summary: 'Reject user registration' })
  async rejectUser(
    @Param('userId') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectUser(userId, reason);
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

  @Post('products/:id/approve')
  @ApiOperation({ summary: 'Approve product' })
  async approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Patch('brands/:id/commission')
  @ApiOperation({ summary: 'Update brand commission' })
  async updateCommission(@Param('id') id: string, @Body('rate') rate: number) {
    return this.adminService.updateBrandCommission(id, rate);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Monitor transactions' })
  async getTransactions() {
    return this.adminService.getTransactions();
  }

  @Get('users/:role')
  @ApiOperation({ summary: 'Get users by role' })
  async getUsersByRole(@Param('role') role: string) {
    return this.adminService.getUsersByRole(role);
  }

  @Post('users/:userId/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const result = await this.adminService.suspendUser(userId);
    await this.adminService.auditLog(adminId, 'user.suspend', 'user', userId, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product info' })
  async updateProduct(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateProduct(id, data);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete (Soft) product' })
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get platform setting' })
  async getSetting(@Param('key') key: string) {
    return this.adminService.getPlatformSetting(key);
  }

  @Post('settings')
  @ApiOperation({ summary: 'Update platform setting' })
  async updateSetting(
    @Body() body: { key: string; value: any },
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.updatePlatformSetting(
      body.key,
      body.value,
      adminId,
    );
  }
}
