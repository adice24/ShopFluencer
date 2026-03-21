/**
 * Full linktree appearance is stored as JSON in `storefronts.custom_css`
 * under key `linktreeTheme` (Prisma has no separate themes table).
 */

import type { Theme } from "./types";

export const DEFAULT_LINKTREE_THEME_BODY = {
    background_type: "flat" as const,
    background_value: "#f8fafc",
    button_style: "rounded" as const,
    font_family: "Inter, sans-serif",
    button_color: "#6366f1",
    text_color: "#0f172a",
};

type StorefrontThemeRow = {
    id: string;
    theme_color?: string | null;
    custom_css?: string | null;
};

/** Returns null if no persisted `linktreeTheme` JSON (AppearancePage will seed defaults). */
export function parseThemeFromStorefront(row: StorefrontThemeRow | null): Theme | null {
    if (!row?.custom_css?.trimStart().startsWith("{")) return null;
    try {
        const j = JSON.parse(row.custom_css) as { linktreeTheme?: Partial<Theme> };
        const lt = j.linktreeTheme;
        if (!lt || typeof lt !== "object") return null;
        const b = { ...DEFAULT_LINKTREE_THEME_BODY, ...lt };
        return {
            id: row.id,
            store_id: row.id,
            background_type: b.background_type as Theme["background_type"],
            background_value: String(b.background_value ?? DEFAULT_LINKTREE_THEME_BODY.background_value),
            button_style: b.button_style as Theme["button_style"],
            font_family: String(b.font_family ?? DEFAULT_LINKTREE_THEME_BODY.font_family),
            button_color: String(b.button_color ?? row.theme_color ?? DEFAULT_LINKTREE_THEME_BODY.button_color),
            text_color: String(b.text_color ?? DEFAULT_LINKTREE_THEME_BODY.text_color),
            created_at: "",
            updated_at: "",
        };
    } catch {
        return null;
    }
}

/** Public link page: always has a usable theme (defaults + optional JSON + theme_color). */
export function themeForPublicPage(row: StorefrontThemeRow | null): Theme {
    const parsed = parseThemeFromStorefront(row);
    if (parsed) return parsed;
    const id = row?.id ?? "";
    const b = {
        ...DEFAULT_LINKTREE_THEME_BODY,
        button_color: row?.theme_color || DEFAULT_LINKTREE_THEME_BODY.button_color,
    };
    return {
        id,
        store_id: id,
        background_type: b.background_type,
        background_value: b.background_value,
        button_style: b.button_style,
        font_family: b.font_family,
        button_color: b.button_color,
        text_color: b.text_color,
        created_at: "",
        updated_at: "",
    };
}

export function serializeLinktreeThemeToCustomCss(updates: Partial<Theme>): string {
    const body = {
        ...DEFAULT_LINKTREE_THEME_BODY,
        background_type: updates.background_type ?? DEFAULT_LINKTREE_THEME_BODY.background_type,
        background_value: updates.background_value ?? DEFAULT_LINKTREE_THEME_BODY.background_value,
        button_style: updates.button_style ?? DEFAULT_LINKTREE_THEME_BODY.button_style,
        font_family: updates.font_family ?? DEFAULT_LINKTREE_THEME_BODY.font_family,
        button_color: updates.button_color ?? DEFAULT_LINKTREE_THEME_BODY.button_color,
        text_color: updates.text_color ?? DEFAULT_LINKTREE_THEME_BODY.text_color,
    };
    return JSON.stringify({ linktreeTheme: body });
}
