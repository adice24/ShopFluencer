import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /** False when $connect failed (e.g. P1001). Skip DB reads in auth fallbacks. */
  isDatabaseReachable = false;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isDatabaseReachable = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.isDatabaseReachable = false;
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          `Database unreachable at startup (${msg}). Server starts anyway; fix DATABASE_URL or resume Supabase. Admin login can use ADMIN_EMAIL / ADMIN_PASSWORD_HASH. See docs/DATABASE.md`,
        );
        return;
      }
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Utility: clean all tables (for testing only)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) =>
        typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );

    return Promise.all(
      models.map((model) => {
        try {
          return (this as any)[model]?.deleteMany?.();
        } catch {
          return Promise.resolve();
        }
      }),
    );
  }
}
