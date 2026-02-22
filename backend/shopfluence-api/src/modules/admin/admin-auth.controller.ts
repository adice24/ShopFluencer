import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
    constructor(private readonly authService: AdminAuthService) { }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute max
    @ApiOperation({ summary: 'Login for platform admin' })
    async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
        const token = await this.authService.login(body.email, body.password);

        // CSRF protection through secure cookie semantics
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Use lax or strict based on frontend origins
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            path: '/', // Ensure it scopes properly
        });

        return { success: true, message: 'Admin authenticated', token }; // return token to test if auth is failing initially or just cookies
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout admin' })
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('admin_token', { path: '/' });
        return { success: true };
    }
}
