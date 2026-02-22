import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  throttleConfig,
  paymentConfig,
  uploadConfig,
} from './config';

// Database
import { DatabaseModule } from './database/database.module';

// Common
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContentIdeasModule } from './modules/content-ideas/content-ideas.module';
import { LinksModule } from './modules/links/links.module';

@Module({
  imports: [
    // ── Configuration ──────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        throttleConfig,
        paymentConfig,
        uploadConfig,
      ],
    }),

    // ── Rate Limiting ──────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ── Database ───────────────────────────────
    DatabaseModule,

    // ── Feature Modules ────────────────────────
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    StorefrontModule,
    OrdersModule,
    PaymentsModule,
    AffiliatesModule,
    AnalyticsModule,
    AdminModule,
    NotificationsModule,
    ContentIdeasModule,
    LinksModule,
  ],
  providers: [
    // Global rate limiting guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global exception handler
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // Global response transformer
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule { }
