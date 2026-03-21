import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ─── Categories ──────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all active categories' })
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.catalogService.getCategoryBySlug(slug);
  }

  @Post('categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (Admin)' })
  async createCategory(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      parentId?: string;
    },
  ) {
    return this.catalogService.createCategory(body);
  }

  // ─── Brands ──────────────────────────────────────────────

  @Get('brands')
  @ApiOperation({ summary: 'Get all brands' })
  async getBrands(@Query() query: PaginationDto) {
    return this.catalogService.getBrands(query);
  }

  @Get('brands/:slug')
  @ApiOperation({ summary: 'Get brand by slug' })
  async getBrandBySlug(@Param('slug') slug: string) {
    return this.catalogService.getBrandBySlug(slug);
  }

  @Post('brands')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create brand (Admin)' })
  async createBrand(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      logoUrl?: string;
    },
  ) {
    return this.catalogService.createBrand(body);
  }

  // ─── Products ────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Get products with filters' })
  async getProducts(
    @Query() query: PaginationDto & { categoryId?: string; brandId?: string },
  ) {
    return this.catalogService.getProducts(query);
  }

  @Get('products/slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  async getProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProductById(@Param('id') id: string) {
    return this.catalogService.getProductById(id);
  }

  @Post('products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (Admin)' })
  async createProduct(@Body() body: any) {
    return this.catalogService.createProduct(body);
  }

  @Patch('products/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (Admin)' })
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateProduct(id, body);
  }

  @Delete('products/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete product (Admin)' })
  async deleteProduct(@Param('id') id: string) {
    return this.catalogService.softDeleteProduct(id);
  }
}
