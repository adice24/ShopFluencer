import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('live')
    @ApiOperation({ summary: 'Liveness probe — process alive' })
    live() {
        return { status: 'ok', service: 'shopfluence-api', timestamp: new Date().toISOString() };
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness probe — dependencies connected' })
    async ready() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return {
                status: 'ok',
                database: 'connected',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'error',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
            };
        }
    }
}
