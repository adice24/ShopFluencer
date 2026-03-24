import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api/v1');
  const frontendUrl = config.get<string>(
    'app.frontendUrl',
    'http://localhost:5173',
  );

  // ── Global Prefix ────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ── Security ─────────────────────────────────
  app.use(helmet());
  app.use(cookieParser());

  // ── CORS ─────────────────────────────────────
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'https://shop-fluence.vercel.app',
    'https://shop-fluencer.vercel.app',
    'https://shopflu.to',
  ];
  if (frontendUrl) {
    frontendUrl.split(',').forEach((url) => allowedOrigins.push(url.trim()));
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        allowedOrigins.some(
          (allowed) => origin === allowed || origin.startsWith(allowed),
        ) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'X-Idempotency-Key',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ── Validation ───────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true, // Auto-transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Swagger / OpenAPI ────────────────────────
  if (config.get<string>('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ShopFluence API')
      .setDescription('Affiliate E-Commerce & Branding Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Health', 'Health check endpoints')
      .addTag('Authentication', 'JWT auth with access + refresh tokens')
      .addTag('Users', 'User management')
      .addTag('Catalog', 'Products, categories, brands')
      .addTag('Storefront', 'Affiliate storefront engine')
      .addTag('Orders', 'Order lifecycle management')
      .addTag('Payments', 'Payment processing')
      .addTag('Affiliates', 'Affiliate tracking & commissions')
      .addTag('Analytics', 'Event tracking & dashboards')
      .addTag('Admin', 'Admin panel operations')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    Logger.log(`📚 Swagger docs: http://localhost:${port}/docs`, 'Bootstrap');
  }

  // ── Start Server ─────────────────────────────
  await app.listen(port);

  Logger.log(
    `🚀 ShopFluence API running on http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
  Logger.log(
    `📦 Environment: ${config.get<string>('app.nodeEnv')}`,
    'Bootstrap',
  );
}

bootstrap();
