import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-strategy';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
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
      const supabaseUrl =
        this.config.get<string>('SUPABASE_URL') ||
        this.config.get<string>('VITE_SUPABASE_URL');
      const supabaseKey =
        this.config.get<string>('SUPABASE_ANON_KEY') ||
        this.config.get<string>('VITE_SUPABASE_ANON_KEY');

      if (!supabaseUrl || !supabaseKey) {
        return this.fail(
          'Server missing SUPABASE_URL / SUPABASE_ANON_KEY',
          500,
        );
      }

      const res = await fetch(
        `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apiKey: supabaseKey,
          },
        },
      );

      if (!res.ok) {
        return this.fail('Invalid Supabase token', 401);
      }

      const authUser = await res.json();

      const user =
        await this.authService.ensurePrismaUserFromSupabase(authUser);

      if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
        return this.fail('User account is not active', 401);
      }

      this.success(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return this.fail(error.message, 401);
      }
      this.logger.warn(
        `JWT auth failed (non-auth error): ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // Required by NestJS PassportStrategy mixin
  validate(payload: any) {
    return payload;
  }
}
