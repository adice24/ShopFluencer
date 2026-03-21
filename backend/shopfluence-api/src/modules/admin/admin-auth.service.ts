import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { PlatformOperatorCredential } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  // In-memory lockout cache (can be Redis in prod)
  private failedAttempts = new Map<
    string,
    { count: number; lockedUntil: number }
  >();

  constructor(
    private config: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(email: string, pass: string): Promise<string> {
    if (typeof email !== 'string' || typeof pass !== 'string') {
      throw new BadRequestException('Email and password are required');
    }

    const adminSecret =
      this.config.get<string>('ADMIN_JWT_SECRET') || 'fallback_admin_secret';
    const normalized = email.trim().toLowerCase();

    if (!normalized || !pass) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lockout (key by normalized email)
    const attempt = this.failedAttempts.get(normalized);
    if (attempt && attempt.lockedUntil > Date.now()) {
      throw new UnauthorizedException(
        `Account locked. Try again in ${Math.ceil((attempt.lockedUntil - Date.now()) / 1000)}s`,
      );
    }

    let valid = false;

    let row: PlatformOperatorCredential | null = null;
    if (this.prisma.isDatabaseReachable) {
      try {
        row = await this.prisma.platformOperatorCredential.findFirst({
          where: { email: normalized, isActive: true },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Platform operator DB lookup failed; using env admin credentials if set. (${msg})`,
        );
      }
    }

    if (row) {
      try {
        valid = bcrypt.compareSync(pass, row.passwordHash);
      } catch {
        this.logger.error(
          'Malformed password_hash in platform_operator_credentials; treat as invalid login',
        );
        valid = false;
      }
    } else {
      // Fallback: env (or legacy single hash) when no DB row / DB unreachable
      const adminEmail = (
        this.config.get<string>('ADMIN_EMAIL') || 'admin@shopfluence.com'
      ).toLowerCase();
      const adminHash =
        this.config.get<string>('ADMIN_PASSWORD_HASH') ||
        '$2b$10$7GVbe9I9ZI.wltXq8zYb..0F.LXv1vsnaDM9rYoEc4ahxyLYjw9UK';
      if (normalized === adminEmail) {
        try {
          valid = bcrypt.compareSync(pass, adminHash);
        } catch {
          this.logger.error('ADMIN_PASSWORD_HASH is not a valid bcrypt string');
          valid = false;
        }
      }
    }

    if (!valid) {
      const current = attempt ? attempt.count : 0;
      this.failedAttempts.set(normalized, {
        count: current + 1,
        lockedUntil: current + 1 >= 5 ? Date.now() + 15 * 60 * 1000 : 0,
      });
      if (current + 1 >= 5) {
        this.logger.warn(`Admin lockout triggered for email: ${normalized}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    this.failedAttempts.delete(normalized);

    return this.jwtService.sign(
      { sub: 'admin', email: normalized, role: 'admin' },
      { secret: adminSecret, expiresIn: '8h' },
    );
  }
}
