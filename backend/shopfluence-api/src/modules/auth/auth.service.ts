import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface TokenPayload {
    sub: string;
    email: string;
    role: UserRole;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    /**
     * Register a new user
     */
    async register(dto: RegisterDto): Promise<AuthTokens> {
        // Check if email exists
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        // Hash password with Argon2-equivalent strength (bcrypt rounds=12)
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: dto.role || UserRole.CUSTOMER,
                status: dto.role === UserRole.INFLUENCER ? 'PENDING_APPROVAL' : 'ACTIVE',
            },
        });

        // If influencer, create empty profile
        if (user.role === UserRole.INFLUENCER) {
            await this.prisma.influencerProfile.create({
                data: {
                    userId: user.id,
                    displayName: `${dto.firstName} ${dto.lastName}`,
                },
            });
        }

        this.logger.log(`User registered: ${user.email} (${user.role})`);

        return this.generateTokens(user);
    }

    /**
     * Login with email and password
     */
    async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthTokens> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (!user || user.deletedAt) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.status === 'SUSPENDED') {
            throw new UnauthorizedException('Account suspended. Contact support.');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        this.logger.log(`User logged in: ${user.email}`);

        return this.generateTokens(user, ip, userAgent);
    }

    /**
     * Refresh access token
     */
    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        // Find the refresh token
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Rotate: revoke old, issue new
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });

        return this.generateTokens(stored.user);
    }

    /**
     * Logout — revoke refresh token
     */
    async logout(refreshToken: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: { token: refreshToken, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /**
     * Revoke all refresh tokens for a user (security reset)
     */
    async revokeAllTokens(userId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /**
     * Generate access + refresh token pair
     */
    private async generateTokens(
        user: { id: string; email: string; role: UserRole },
        ip?: string,
        userAgent?: string,
    ): Promise<AuthTokens> {
        const payload: TokenPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);

        // Generate refresh token (opaque UUID stored in DB)
        const refreshTokenValue = uuidv4();
        const refreshExpiry = this.config.get<string>('jwt.refreshExpiry', '7d');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiry));

        await this.prisma.refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId: user.id,
                expiresAt,
                ipAddress: ip,
                userAgent,
            },
        });

        return {
            accessToken,
            refreshToken: refreshTokenValue,
            expiresIn: 900, // 15 minutes in seconds
        };
    }
}
