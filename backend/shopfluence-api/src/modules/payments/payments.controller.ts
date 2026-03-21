import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import type { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @ApiOperation({ summary: 'Create payment intent for an order' })
  async createIntent(@Body() body: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(
      body.orderId,
      body.idempotencyKey,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Payment gateway webhook (Stripe)' })
  async handleWebhook(@Req() req: any) {
    return this.paymentsService.handleWebhook(req);
  }

  @Post(':id/failure')
  @ApiOperation({ summary: 'Handle payment failure' })
  async handleFailure(@Param('id') id: string, @Body('reason') reason: string) {
    return this.paymentsService.handlePaymentFailure(id, reason);
  }

  @Get('order/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for an order' })
  async getOrderPayments(@Param('orderId') orderId: string) {
    return this.paymentsService.getOrderPayments(orderId);
  }
}
