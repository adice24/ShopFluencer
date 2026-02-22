import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface LinkRow {
    id: string;
    url: string;
    click_count: number;
    is_visible: boolean;
}

@Injectable()
export class LinksService {
    constructor(private readonly prisma: PrismaService) { }

    // Create a short link — inserts into the `links` table (Supabase-managed)
    async createShortLink(userId: string, data: { originalUrl: string; title?: string }) {
        try {
            let shortSlug = '';
            let isUnique = false;
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

            while (!isUnique) {
                shortSlug = '';
                for (let i = 0; i < 8; i++) {
                    shortSlug += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                const existing = await this.prisma.$queryRaw<LinkRow[]>`
                    SELECT id FROM links WHERE short_slug = ${shortSlug} LIMIT 1
                `;
                if (!existing.length) isUnique = true;
            }

            const result = await this.prisma.$queryRaw<LinkRow[]>`
                INSERT INTO links (user_id, store_id, title, url, short_slug, position, is_visible, is_featured, click_count)
                VALUES (
                    ${userId}::uuid,
                    (SELECT id FROM influencer_stores WHERE user_id = ${userId}::uuid LIMIT 1),
                    ${data.title || 'Untitled Link'},
                    ${data.originalUrl},
                    ${shortSlug},
                    (SELECT COALESCE(MAX(position), -1) + 1 FROM links WHERE user_id = ${userId}::uuid),
                    true,
                    false,
                    0
                )
                RETURNING id, url, short_slug, title, click_count, is_visible, created_at
            `;

            // Map to the shape the frontend expects
            const row = result[0] as any;
            return {
                id: row.id,
                title: row.title,
                original_url: row.url,
                short_code: row.short_slug,
                clicks: row.click_count,
                created_at: row.created_at,
            };
        } catch (error: any) {
            throw new InternalServerErrorException(`Failed to create short link: ${error?.message}`);
        }
    }

    async getUserLinks(userId: string) {
        const rows = await this.prisma.$queryRaw<any[]>`
            SELECT id, title, url as original_url, short_slug as short_code, click_count as clicks, created_at, is_visible
            FROM links
            WHERE user_id = ${userId}::uuid AND is_visible = true
            ORDER BY created_at DESC
        `;
        return rows;
    }

    async deleteLink(userId: string, id: string) {
        const existing = await this.prisma.$queryRaw<any[]>`
            SELECT id FROM links WHERE id = ${id}::uuid AND user_id = ${userId}::uuid LIMIT 1
        `;
        if (!existing.length) throw new NotFoundException('Link not found');

        await this.prisma.$executeRaw`
            DELETE FROM links WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
        `;
    }

    // Public: resolve a short slug → original URL, and record the click
    async recordClick(shortSlug: string, trackingData: { ipAddress?: string; userAgent?: string; referrer?: string }) {
        const rows = await this.prisma.$queryRaw<any[]>`
            SELECT id, url, click_count, is_visible, store_id, user_id
            FROM links
            WHERE short_slug = ${shortSlug} AND is_visible = true
            LIMIT 1
        `;

        if (!rows.length) {
            throw new NotFoundException('Short link not found or inactive');
        }

        const link = rows[0];

        // Increment click count
        await this.prisma.$executeRaw`
            UPDATE links SET click_count = click_count + 1, updated_at = now() WHERE id = ${link.id}::uuid
        `;

        // Record click in link_clicks table (matches existing schema)
        try {
            await this.prisma.$executeRaw`
                INSERT INTO link_clicks (link_id, store_id, user_agent, ip_address, referer, country, user_id)
                VALUES (
                    ${link.id}::uuid,
                    ${link.store_id}::uuid,
                    ${trackingData.userAgent || ''},
                    ${trackingData.ipAddress || ''},
                    ${trackingData.referrer || ''},
                    '',
                    ${link.user_id}::uuid
                )
            `;
        } catch (_e) {
            // Don't fail the redirect if analytics fails
        }

        return link.url;
    }
}
