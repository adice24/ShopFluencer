import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService {
    private readonly logger = new Logger(AdminAuthService.name);
    // In-memory lockout cache (can be Redis in prod)
    private failedAttempts = new Map<string, { count: number, lockedUntil: number }>();

    constructor(private config: ConfigService, private jwtService: JwtService) { }

    async login(email: string, pass: string): Promise<string> {
        const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'admin@shopfluence.com';
        // default admin123
        const adminHash = this.config.get<string>('ADMIN_PASSWORD_HASH') || '$2b$10$IutA1gRkH1YYqv3BI8TzfuZeOd861/I7O4.4JLtJiBJhczR2Rv/ZO';
        const adminSecret = this.config.get<string>('ADMIN_JWT_SECRET') || 'fallback_admin_secret';

        // Check lockout
        const attempt = this.failedAttempts.get(email);
        if (attempt && attempt.lockedUntil > Date.now()) {
            throw new UnauthorizedException(`Account locked. Try again in ${Math.ceil((attempt.lockedUntil - Date.now()) / 1000)}s`);
        }

        if (email !== adminEmail || !bcrypt.compareSync(pass, adminHash)) {
            // Register failed attempt
            const current = attempt ? attempt.count : 0;
            this.failedAttempts.set(email, {
                count: current + 1,
                lockedUntil: current + 1 >= 5 ? Date.now() + 15 * 60 * 1000 : 0
            });
            if (current + 1 >= 5) {
                this.logger.warn(`Admin lockout triggered for email: ${email}`);
            }
            throw new UnauthorizedException('Invalid credentials');
        }

        // Success - clear failures
        this.failedAttempts.delete(email);

        return this.jwtService.sign(
            { sub: 'admin', email, role: 'admin' },
            { secret: adminSecret, expiresIn: '8h' }
        );
    }
}
