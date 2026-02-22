import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private config: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Check httpOnly cookie first, then fallback to Bearer header
        let token = request.cookies?.admin_token;

        if (!token && request.headers.authorization?.startsWith('Bearer ')) {
            token = request.headers.authorization.split(' ')[1];
        }

        if (!token) throw new UnauthorizedException('Admin authentication required');

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.config.get<string>('ADMIN_JWT_SECRET') || 'fallback_admin_secret',
            });
            if (payload.role !== 'admin') throw new UnauthorizedException('Invalid admin role');
            request.user = { id: payload.sub, email: payload.email, role: payload.role }; // Set the admin user in request explicitly
        } catch {
            throw new UnauthorizedException('Invalid admin token');
        }

        return true;
    }
}
