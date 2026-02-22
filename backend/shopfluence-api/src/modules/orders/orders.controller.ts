import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService, CreateOrderContextDto } from './orders.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole, OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import type { Request } from 'express';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new order (guest or authenticated)' })
    async createOrder(@Body() body: CreateOrderDto, @Req() req: Request) {
        // Optional auth if token is present (handle properly in AuthGuard if strict, else manual)
        const user = (req as any).user;
        const requestData: CreateOrderContextDto = {
            ...body,
            userId: user?.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        };
        return this.ordersService.createOrder(requestData);
    }

    @Get('my')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my orders' })
    async getMyOrders(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
        return this.ordersService.getUserOrders(userId, query);
    }

    @Get('track/:orderNumber')
    @ApiOperation({ summary: 'Track order by order number (public)' })
    async trackOrder(@Param('orderNumber') orderNumber: string) {
        return this.ordersService.getByOrderNumber(orderNumber);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all orders (Admin)' })
    async getAllOrders(@Query() query: PaginationDto & { status?: OrderStatus; influencerId?: string }) {
        return this.ordersService.getAllOrders(query);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get order by ID (Admin)' })
    async getById(@Param('id') id: string) {
        return this.ordersService.getById(id);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update order status (Admin)' })
    async updateStatus(
        @Param('id') id: string,
        @Body() body: UpdateOrderStatusDto,
    ) {
        return this.ordersService.updateStatus(id, body.status, body.cancelReason);
    }
}
