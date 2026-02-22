import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';

export class CreateOrderContextDto extends CreateOrderDto {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService
    ) { }

    /**
     * Create order — only creates with PENDING status
     * Payment must succeed before status changes to CONFIRMED
     */
    async createOrder(dto: CreateOrderContextDto) {
        return this.prisma.$transaction(async (tx: any) => {
            // 1. Fetch all products and variants
            const orderItems: any[] = [];
            let subtotal = 0;
            let totalTax = 0;

            for (const item of dto.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: { variants: { where: { id: item.variantId || '' } } },
                });

                if (!product || product.deletedAt || product.status !== 'ACTIVE') {
                    throw new BadRequestException(`Product ${item.productId} is not available`);
                }

                let unitPrice = Number(product.basePrice);
                let variantName: string | null = null;
                let sku: string | null = null;

                if (item.variantId) {
                    const variant = product.variants[0];
                    if (!variant || variant.stock < item.quantity) {
                        throw new BadRequestException(`Insufficient stock for variant ${item.variantId}`);
                    }
                    unitPrice = Number(variant.price);
                    variantName = variant.name;
                    sku = variant.sku;

                    // Decrement stock
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }

                const itemTotal = unitPrice * item.quantity;
                const itemTax = itemTotal * (Number(product.taxRate) / 100);

                orderItems.push({
                    productId: item.productId,
                    variantId: item.variantId || null,
                    productName: product.name,
                    variantName,
                    sku,
                    unitPrice,
                    quantity: item.quantity,
                    totalPrice: itemTotal,
                    taxAmount: itemTax,
                });

                subtotal += itemTotal;
                totalTax += itemTax;
            }

            // 2. Generate order number
            const orderNumber = `SF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 6).toUpperCase()}`;

            // 3. Create order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId: dto.userId || null,
                    status: OrderStatus.PENDING,
                    subtotal,
                    taxAmount: totalTax,
                    shippingAmount: 0, // TODO: Calculate based on weight/location
                    discountAmount: 0,
                    totalAmount: subtotal + totalTax,
                    shippingName: dto.shippingName,
                    shippingEmail: dto.shippingEmail,
                    shippingPhone: dto.shippingPhone,
                    shippingAddress: dto.shippingAddress,
                    shippingCity: dto.shippingCity,
                    shippingState: dto.shippingState,
                    shippingZip: dto.shippingZip,
                    shippingCountry: dto.shippingCountry || 'IN',
                    ipAddress: dto.ipAddress,
                    userAgent: dto.userAgent,
                    items: {
                        create: orderItems,
                    },
                },
                include: { items: true },
            });

            this.logger.log(`Order created: ${order.orderNumber} — ₹${order.totalAmount}`);

            // 4. Create affiliate conversion if influencer tracking exists
            if (dto.influencerId) {
                const influencer = await tx.influencerProfile.findUnique({
                    where: { id: dto.influencerId },
                });

                if (influencer) {
                    const commissionRate = Number(influencer.commissionRate);
                    await tx.affiliateConversion.create({
                        data: {
                            influencerId: dto.influencerId,
                            orderId: order.id,
                            orderAmount: order.totalAmount,
                            commissionRate,
                            commissionAmount: Number(order.totalAmount) * (commissionRate / 100),
                        },
                    });

                    // Send notification to influencer
                    await this.notificationsService.createNotification({
                        userId: influencer.userId,
                        type: 'ORDER',
                        title: 'New Order Received',
                        message: `A new order (${order.orderNumber}) was placed through your storefront!`,
                    });
                }
            }

            return order;
        });
    }

    /**
     * Confirm order after successful payment
     */
    async confirmOrder(orderId: string) {
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CONFIRMED },
        });
    }

    /**
     * Get order by ID
     */
    async getById(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                payments: true,
                affiliateConversion: true,
            },
        });

        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    /**
     * Get order by order number (public-safe)
     */
    async getByOrderNumber(orderNumber: string) {
        const order = await this.prisma.order.findUnique({
            where: { orderNumber },
            include: { items: true },
        });

        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    /**
     * Get orders for a user
     */
    async getUserOrders(userId: string, query: PaginationDto) {
        const where: Prisma.OrderWhereInput = { userId };

        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: query.skip,
                take: query.take,
                include: {
                    items: true,
                    payments: { select: { status: true, method: true, paidAt: true } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        return paginate(data, total, query.page || 1, query.limit || 20);
    }

    /**
     * Get all orders (admin) with filters
     */
    async getAllOrders(query: PaginationDto & {
        status?: OrderStatus;
        influencerId?: string;
        brandId?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const where: Prisma.OrderWhereInput = {};

        if (query.status) where.status = query.status;
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
        }
        if (query.influencerId) {
            where.affiliateConversion = { influencerId: query.influencerId };
        }

        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: query.skip,
                take: query.take,
                include: {
                    items: true,
                    payments: { select: { status: true, method: true } },
                    affiliateConversion: {
                        select: { influencerId: true, commissionAmount: true },
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        return paginate(data, total, query.page || 1, query.limit || 20);
    }

    /**
     * Update order status
     */
    async updateStatus(orderId: string, status: OrderStatus, cancelReason?: string) {
        const data: any = { status };
        if (cancelReason) data.cancelReason = cancelReason;

        const order = await this.prisma.order.update({
            where: { id: orderId },
            data,
        });

        this.logger.log(`Order ${orderId} status updated to ${status}`);
        return order;
    }
}
