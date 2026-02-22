import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class LinksService {
    constructor(private readonly prisma: PrismaService) { }

    // Create a short link using a simple random string (pseudo nanoid)
    async createShortLink(userId: string, data: { originalUrl: string; title?: string }) {
        try {
            let shortCode = '';
            let isUnique = false;
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

            // Generate unique short code (6-8 chars)
            while (!isUnique) {
                shortCode = '';
                for (let i = 0; i < 7; i++) {
                    shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
                }

                const existing = await this.prisma.shortLink.findUnique({ where: { shortCode } });
                if (!existing) {
                    isUnique = true;
                }
            }

            const shortLink = await this.prisma.shortLink.create({
                data: {
                    userId,
                    originalUrl: data.originalUrl,
                    title: data.title || 'Untitled Link',
                    shortCode,
                },
            });

            return shortLink;
        } catch (error) {
            throw new InternalServerErrorException('Failed to create short link');
        }
    }

    async getUserLinks(userId: string) {
        return this.prisma.shortLink.findMany({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { linkClicks: true }
                }
            }
        });
    }

    async deleteLink(userId: string, id: string) {
        const link = await this.prisma.shortLink.findFirst({
            where: { id, userId }
        });
        if (!link) {
            throw new NotFoundException('Link not found');
        }

        return this.prisma.shortLink.delete({
            where: { id }
        });
    }

    async recordClick(shortCode: string, trackingData: { ipAddress?: string; userAgent?: string; referrer?: string }) {
        const link = await this.prisma.shortLink.findUnique({
            where: { shortCode, isActive: true }
        });

        if (!link) {
            throw new NotFoundException('Short link not found or inactive');
        }

        // Record the click inside a transaction to ensure atomic increment
        await this.prisma.$transaction([
            this.prisma.linkClick.create({
                data: {
                    shortLinkId: link.id,
                    ipAddress: trackingData.ipAddress,
                    userAgent: trackingData.userAgent,
                    referrer: trackingData.referrer,
                }
            }),
            this.prisma.shortLink.update({
                where: { id: link.id },
                data: { clicks: { increment: 1 } }
            })
        ]);

        return link.originalUrl;
    }
}
