/**
 * Prisma `short_links` ↔ UI `Link` type (legacy `links` / linktree shape).
 */

import type { Link } from "./types";

export type ShortLinkRow = Record<string, unknown>;

export function shortLinkRowToLink(row: ShortLinkRow): Link {
    return {
        id: String(row.id ?? ""),
        store_id: null,
        user_id: String(row.user_id ?? ""),
        title: String(row.title ?? ""),
        url: String(row.original_url ?? ""),
        short_slug: row.short_code != null ? String(row.short_code) : null,
        icon: null,
        thumbnail_url: null,
        position: 0,
        is_visible: row.is_active !== false,
        is_featured: false,
        click_count: Number(row.clicks ?? 0),
        created_at: String(row.created_at ?? ""),
        updated_at: String(row.updated_at ?? ""),
    };
}

export function generateShortCode(length = 8): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}
