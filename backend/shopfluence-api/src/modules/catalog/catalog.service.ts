import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { Prisma, ProductStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ──────────────────────────────────────────

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
  }) {
    return this.prisma.category.create({ data });
  }

  async getCategories(activeOnly = true) {
    return this.prisma.category.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { sortOrder: 'asc' },
      include: { children: true },
    });
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: { where: { status: 'ACTIVE', deletedAt: null }, take: 50 },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // ─── Brands ──────────────────────────────────────────────

  async createBrand(data: {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    websiteUrl?: string;
    contactEmail?: string;
  }) {
    return this.prisma.brand.create({ data });
  }

  async getBrands(query: PaginationDto) {
    const where: Prisma.BrandWhereInput = { isActive: true, deletedAt: null };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: { [query.sortBy || 'name']: query.sortOrder || 'asc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return paginate(data, total, query.page || 1, query.limit || 20);
  }

  async getBrandBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand || brand.deletedAt)
      throw new NotFoundException('Brand not found');
    return brand;
  }

  // ─── Products ────────────────────────────────────────────

  async createProduct(data: Prisma.ProductCreateInput) {
    const product = await this.prisma.product.create({
      data,
      include: { category: true, brand: true, images: true, variants: true },
    });
    this.logger.log(`Product created: ${product.name} (${product.id})`);
    return product;
  }

  async getProducts(
    query: PaginationDto & {
      categoryId?: string;
      brandId?: string;
      status?: ProductStatus;
      minPrice?: number;
      maxPrice?: number;
      featured?: boolean;
    },
  ) {
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (query.status) where.status = query.status;
    else where.status = ProductStatus.ACTIVE;

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }
    if (query.minPrice || query.maxPrice) {
      where.basePrice = {};
      if (query.minPrice) where.basePrice.gte = query.minPrice;
      if (query.maxPrice) where.basePrice.lte = query.maxPrice;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        skip: query.skip,
        take: query.take,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          images: { orderBy: { sortOrder: 'asc' }, take: 3 },
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(data, total, query.page || 1, query.limit || 20);
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product || product.deletedAt)
      throw new NotFoundException('Product not found');
    return product;
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product || product.deletedAt)
      throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true, brand: true, images: true, variants: true },
    });
  }

  async softDeleteProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DISCONTINUED' },
    });
  }

  // ─── Product Variants ────────────────────────────────────

  async createVariant(data: Prisma.ProductVariantUncheckedCreateInput) {
    return this.prisma.productVariant.create({ data });
  }

  async updateVariantStock(variantId: string, quantity: number) {
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { decrement: quantity } },
    });
  }
}
