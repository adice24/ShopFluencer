import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appName: process.env.APP_NAME || 'ShopFluence',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl:
    process.env.FRONTEND_URL ||
    'http://localhost:5173,http://localhost:8080,http://localhost:8081',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));

export const paymentConfig = registerAs('payment', () => ({
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
}));

export const uploadConfig = registerAs('upload', () => ({
  maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
  dest: process.env.UPLOAD_DEST || './uploads',
  allowedTypes: (
    process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp'
  ).split(','),
}));
