import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StorefrontService } from './storefront.service';
import { UserRole, StorefrontStatus } from '@prisma/client';
import { UpsertStorefrontDto } from './dto/upsert-storefront.dto';
import { AddStorefrontProductDto } from './dto/add-storefront-product.dto';

@ApiTags('Storefront')
@Controller('storefront')
export class StorefrontController {
    constructor(private readonly storefrontService: StorefrontService) { }

    @Get(':slug')
    @ApiOperation({ summary: 'Get storefront by slug (public)' })
    async getBySlug(@Param('slug') slug: string) {
        return this.storefrontService.getBySlug(slug);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.INFLUENCER, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create/update storefront' })
    async upsert(@Req() req: any, @Body() body: UpsertStorefrontDto) {
        return this.storefrontService.upsert(req.user.id, req.user.role, body);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Set storefront status (Admin)' })
    async setStatus(@Param('id') id: string, @Body('status') status: StorefrontStatus) {
        return this.storefrontService.setStatus(id, status);
    }

    @Post(':id/products')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add product to storefront' })
    async addProduct(@Req() req: any, @Param('id') id: string, @Body() body: AddStorefrontProductDto) {
        return this.storefrontService.addProduct(req.user.id, req.user.role, id, body.productId, body.customNote);
    }

    @Delete(':id/products/:productId')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.INFLUENCER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove product from storefront' })
    async removeProduct(@Req() req: any, @Param('id') id: string, @Param('productId') productId: string) {
        return this.storefrontService.removeProduct(req.user.id, req.user.role, id, productId);
    }
}
