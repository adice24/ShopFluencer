import {
    Injectable,
    BadRequestException,
    ConflictException,
    Logger,
    RawBodyRequest
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus, PaymentGateway, OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import type { Request } from 'express';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private stripe: Stripe;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly ordersService: OrdersService,
        private readonly notificationsService: NotificationsService
    ) {
        this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY || 'sk_test_123', {
            apiVersion: '2023-10-16' as any,
        });
    }

    /**
     * Create payment intent for an order
     * Uses idempotency key to prevent duplicate payment processing
     */
    async createPaymentIntent(orderId: string, idempotencyKey?: string) {
        const key = idempotencyKey || uuidv4();

        // Check idempotency — prevent duplicate payment creation
        const existing = await this.prisma.payment.findUnique({
            where: { idempotencyKey: key },
        });

        if (existing) {
            this.logger.warn(`Duplicate payment attempt blocked: ${key}`);
            return existing;
        }

        // Get order
        const order = await this.ordersService.getById(orderId);

        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_PENDING) {
            throw new BadRequestException('Order is not in a payable state');
        }

        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                idempotencyKey: key,
                amount: order.totalAmount,
                currency: order.currency,
                status: PaymentStatus.INITIATED,
                gateway: PaymentGateway.STRIPE,
            },
        });

        // Update order status
        await this.ordersService.updateStatus(orderId, OrderStatus.PAYMENT_PENDING);

        this.logger.log(`Payment intent created: ${payment.id} for order ${orderId}`);

        // In production: call Stripe API to create intent
        const stripeIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(Number(payment.amount) * 100), // convert to cents
            currency: payment.currency.toLowerCase(),
            metadata: {
                orderId,
                paymentId: payment.id,
            },
        }, { idempotencyKey: key });

        // Update payment with gateway order ID
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { gatewayOrderId: stripeIntent.id }
        });

        return {
            paymentId: payment.id,
            orderId,
            amount: payment.amount,
            currency: payment.currency,
            idempotencyKey: key,
            clientSecret: stripeIntent.client_secret,
        };
    }

    /**
     * Verify payment webhook from gateway
     * This is the ONLY method that marks an order as CONFIRMED
     */
    async handleWebhook(req: RawBodyRequest<Request>) {
        const signature = req.headers['stripe-signature'] as string;
        const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') || process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

        let event: Stripe.Event;

        try {
            if (!req.rawBody) throw new Error('No raw body');
            event = this.stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
        } catch (err: any) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new BadRequestException('Invalid webhook signature');
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const gatewayOrderId = paymentIntent.id;

            // Find payment by gateway order ID
            const payment = await this.prisma.payment.findFirst({
                where: { gatewayOrderId },
            });

            if (!payment) {
                this.logger.error(`Payment not found for gateway order: ${gatewayOrderId}`);
                throw new BadRequestException('Payment not found');
            }

            // Prevent duplicate processing
            if (payment.status === PaymentStatus.CAPTURED) {
                this.logger.warn(`Payment already captured: ${payment.id}`);
                return { message: 'Already processed' };
            }

            // Update payment status
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.CAPTURED,
                    gatewayPaymentId: paymentIntent.id,
                    gatewaySignature: signature,
                    paidAt: new Date(),
                },
            });

            // Confirm the order (atomic — only happens on verified payment)
            await this.ordersService.confirmOrder(payment.orderId);

            // Update storefront revenue counters
            const order = await this.ordersService.getById(payment.orderId);
            if (order.affiliateConversion) {
                const influencer = await this.prisma.influencerProfile.findUnique({
                    where: { id: order.affiliateConversion.influencerId },
                    include: { storefront: true },
                });

                if (influencer?.storefront) {
                    await this.prisma.storefront.update({
                        where: { id: influencer.storefront.id },
                        data: {
                            totalOrders: { increment: 1 },
                            totalRevenue: { increment: Number(order.totalAmount) },
                        },
                    });
                }

                // Confirm affiliate conversion
                await this.prisma.affiliateConversion.update({
                    where: { id: order.affiliateConversion.id },
                    data: { status: 'CONFIRMED' },
                });

                // Notify Influencer of successful payment / confirmed sale
                if (influencer) {
                    await this.notificationsService.createNotification({
                        userId: influencer.userId,
                        type: 'PAYMENT_SUCCESS',
                        title: 'Payment Confirmed',
                        message: `Payment confirmed for order ${order.orderNumber}. You earned ₹${order.affiliateConversion.commissionAmount}!`,
                    });
                }
            }

            this.logger.log(`Payment confirmed: ${payment.id} for order ${payment.orderId}`);
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const payment = await this.prisma.payment.findFirst({ where: { gatewayOrderId: paymentIntent.id } });
            if (payment) {
                await this.handlePaymentFailure(payment.id, paymentIntent.last_payment_error?.message || 'Payment failed');
            }
        }

        return { received: true };
    }

    /**
     * Handle payment failure
     */
    async handlePaymentFailure(paymentId: string, reason: string) {
        await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.FAILED,
                failureReason: reason,
                attempts: { increment: 1 },
            },
        });

        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (payment) {
            await this.ordersService.updateStatus(payment.orderId, OrderStatus.FAILED);
        }

        this.logger.warn(`Payment failed: ${paymentId} — ${reason}`);
    }

    /**
     * Get payment history for an order
     */
    async getOrderPayments(orderId: string) {
        return this.prisma.payment.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
