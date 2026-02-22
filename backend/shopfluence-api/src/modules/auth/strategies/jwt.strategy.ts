import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super();
    }

    async authenticate(req: Request) {
        const authHeader = req.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return this.fail('No token found', 401);
        }

        const token = authHeader.split(' ')[1];

        try {
            const supabaseUrl = this.config.get<string>('VITE_SUPABASE_URL') || 'https://xteedgrrflnfeubtccai.supabase.co';
            const supabaseKey = this.config.get<string>('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZWVkZ3JyZmxuZmV1YnRjY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzkyMjYsImV4cCI6MjA4NzE1NTIyNn0.3bqsJVWD-cbur43xLiC5U-F2nHcU5T5weF_egI6erSk';

            const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apiKey: supabaseKey,
                },
            });

            if (!res.ok) {
                return this.fail('Invalid Supabase token', 401);
            }

            const authUser = await res.json();

            const user = await this.prisma.user.findUnique({
                where: { id: authUser.id },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    firstName: true,
                    lastName: true,
                },
            });

            if (!user || user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
                return this.fail('User account is not active', 401);
            }

            this.success(user);
        } catch (error) {
            this.fail('Failed to authenticate token', 401);
        }
    }

    // Required by NestJS PassportStrategy mixin
    validate(payload: any) {
        return payload;
    }
}
