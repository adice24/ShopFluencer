/**
 * Prisma `storefronts` uses title, logo_url, description, etc.
 * UI / legacy types use display_name, avatar_url, bio — map between them.
 */

import type { InfluencerStore } from "./types";

type StorefrontRow = Record<string, unknown>;

/** REST/PostgREST row → UI shape */
export function storefrontRowToInfluencerStore(row: StorefrontRow | null): InfluencerStore | null {
    if (!row) return null;
    return {
        id: String(row.id ?? ""),
        user_id: String(row.influencer_id ?? ""),
        slug: String(row.slug ?? ""),
        display_name: String(row.title ?? ""),
        bio: String(row.description ?? ""),
        avatar_url: String(row.logo_url ?? ""),
        banner_gradient: "",
        theme: row.theme_color ? { primary: String(row.theme_color) } : {},
        is_approved: true,
        is_active: true,
        social_links: {},
        created_at: String(row.created_at ?? ""),
        updated_at: String(row.updated_at ?? ""),
    };
}

/** UI / partial updates → only columns that exist on public.storefronts */
export function toStorefrontWritePatch(
    input: Partial<InfluencerStore> & { title?: string; display_name?: string }
): Record<string, string | undefined> {
    const patch: Record<string, string | undefined> = {};
    const title = input.title ?? input.display_name;
    if (title !== undefined) patch.title = title;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.avatar_url !== undefined) patch.logo_url = input.avatar_url;
    if (input.bio !== undefined) patch.description = input.bio;
    if (input.theme?.primary !== undefined) patch.theme_color = input.theme.primary;
    return patch;
}
