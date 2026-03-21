/**
 * Create/update catalog products for influencers (Prisma schema) and attach to storefront.
 * Uses seeded brand slug `creator-marketplace` (see migration 016).
 */

import { supabase } from "./supabase";

/** @deprecated Use DB-seeded rows only; do not use as insert FK without verifying the row exists. */
export const CREATOR_MARKETPLACE_BRAND_ID = "11111111-1111-4111-8111-111111111111";
export const DEFAULT_CREATOR_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

type PgErr = { message?: string; code?: string; details?: string; hint?: string };

/** Supabase/PostgREST errors are plain objects — convert for toasts and `instanceof Error`. */
export function formatSupabaseError(err: PgErr | null | undefined): string {
    if (!err) return "Unknown database error";
    const parts = [err.message, err.details, err.hint].filter(Boolean);
    const text = parts.join(" — ") || "Database error";
    const code = String(err.code ?? "");
    if (code === "23503" || /foreign key|violates foreign key/i.test(text)) {
        return `${text} (Check that migration 016 ran in Supabase so “creator-marketplace” brand and “general” category exist, or that your project has at least one brand and one category.)`;
    }
    if (code === "23505" || /duplicate key|unique constraint/i.test(text)) {
        return `${text} (Unique slug/SKU — try again or change the product name.)`;
    }
    return text;
}

function throwIfPgError(err: PgErr | null | undefined, context: string): void {
    if (!err) return;
    throw new Error(`${context}: ${formatSupabaseError(err)}`);
}

/** Prisma `products.slug` is @unique — use high-entropy suffix (timestamp-only collided under double-submit / same ms). */
function uniqueProductSlug(name: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 48);
    const entropy = `${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    return `${base || "product"}-${entropy}`.slice(0, 280);
}

function uniqueVariantSku(formSku: string): string {
    if (formSku.trim()) return formSku.trim().slice(0, 100);
    // `product_variants.sku` is globally @unique — random, not derived from product slug
    return `CR-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}

async function resolveBrandId(): Promise<string> {
    const { data: seeded } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", "creator-marketplace")
        .maybeSingle();
    if (seeded?.id) return seeded.id;

    const { data: anyBrand } = await supabase
        .from("brands")
        .select("id")
        .limit(1)
        .maybeSingle();
    if (anyBrand?.id) return anyBrand.id;

    throw new Error(
        "No brand found. Apply Supabase migration 016 (creator-marketplace), or create a brand in the Brand dashboard."
    );
}

async function resolveCategoryId(categoryHint: string): Promise<string> {
    const hint = categoryHint.trim();
    if (hint) {
        const { data } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", hint)
            .limit(1)
            .maybeSingle();
        if (data?.id) return data.id;
        const { data: slugRow } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", hint.toLowerCase().replace(/\s+/g, "-"))
            .maybeSingle();
        if (slugRow?.id) return slugRow.id;
    }
    const { data: first } = await supabase
        .from("categories")
        .select("id")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (first?.id) return first.id;

    const { data: anyCat } = await supabase
        .from("categories")
        .select("id")
        .limit(1)
        .maybeSingle();
    if (anyCat?.id) return anyCat.id;

    throw new Error(
        "No category found. Apply Supabase migration 016 (general category), or seed categories in admin."
    );
}

export type InfluencerProductForm = {
    name: string;
    description: string;
    price: string;
    compare_at_price: string;
    image_url: string;
    stock_count: string;
    status: string;
    sku: string;
    category: string;
    tags: string;
    is_digital: boolean;
};

export async function createInfluencerListing(
    storefrontId: string,
    form: InfluencerProductForm,
    sortOrder: number
): Promise<{ productId: string }> {
    const name = form.name.trim();
    if (!name) throw new Error("Product name is required");
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price < 0) throw new Error("Valid price is required");

    const brandId = await resolveBrandId();
    const categoryId = await resolveCategoryId(form.category);
    const slug = uniqueProductSlug(name);
    const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    const stockRaw = parseInt(form.stock_count, 10);
    const stock = Number.isNaN(stockRaw) ? 0 : stockRaw;
    const variantStock = stock < 0 ? 999999 : stock;
    const status = form.status === "active" ? "ACTIVE" : "DRAFT";
    const compare = form.compare_at_price.trim()
        ? parseFloat(form.compare_at_price)
        : null;

    const productId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertProduct = async (rowSlug: string) =>
        supabase.from("products").insert({
            id: productId,
            name,
            slug: rowSlug,
            description: form.description.trim() || null,
            short_description: (form.description.trim() || name).slice(0, 500),
            category_id: categoryId,
            brand_id: brandId,
            base_price: price,
            compare_at_price: compare != null && !Number.isNaN(compare) ? compare : null,
            status,
            type: form.is_digital ? "DIGITAL" : "PHYSICAL",
            affiliate_margin: 10,
            margin_type: "PERCENT",
            max_discount: 0,
            currency: "INR",
            tags: tags.length ? tags : [],
            total_sold: 0,
            updated_at: now,
        });

    let rowSlug = slug;
    let { error: pErr } = await insertProduct(rowSlug);
    if (String(pErr?.code) === "23505") {
        rowSlug = uniqueProductSlug(`${name}-retry`);
        ({ error: pErr } = await insertProduct(rowSlug));
    }
    throwIfPgError(pErr, "Could not save product");

    const imageUrl =
        form.image_url.trim() ||
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
    const { error: imgErr } = await supabase.from("product_images").insert({
        id: crypto.randomUUID(),
        product_id: productId,
        url: imageUrl,
        is_primary: true,
        sort_order: 0,
    });
    throwIfPgError(imgErr, "Could not attach product image");

    const sku = uniqueVariantSku(form.sku);

    let { error: vErr } = await supabase.from("product_variants").insert({
        id: crypto.randomUUID(),
        product_id: productId,
        sku,
        name: "Default",
        price,
        compare_at_price: compare != null && !Number.isNaN(compare) ? compare : null,
        stock: variantStock,
        is_active: true,
        updated_at: now,
    });
    if (String(vErr?.code) === "23505") {
        if (form.sku.trim()) {
            throw new Error(
                "This SKU is already used. Clear the SKU field to auto-generate one, or use a unique SKU."
            );
        }
        const sku2 = uniqueVariantSku("");
        ({ error: vErr } = await supabase.from("product_variants").insert({
            id: crypto.randomUUID(),
            product_id: productId,
            sku: sku2,
            name: "Default",
            price,
            compare_at_price: compare != null && !Number.isNaN(compare) ? compare : null,
            stock: variantStock,
            is_active: true,
            updated_at: now,
        }));
    }
    throwIfPgError(vErr, "Could not create product variant");

    const { error: spErr } = await supabase.from("storefront_products").insert({
        id: crypto.randomUUID(),
        storefront_id: storefrontId,
        product_id: productId,
        sort_order: sortOrder,
        is_highlighted: false,
    });
    throwIfPgError(spErr, "Could not link product to your storefront");

    return { productId };
}

export async function updateInfluencerListing(
    productId: string,
    form: InfluencerProductForm
): Promise<void> {
    const name = form.name.trim();
    if (!name) throw new Error("Product name is required");
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price < 0) throw new Error("Valid price is required");

    const categoryId = await resolveCategoryId(form.category);
    const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    const status = form.status === "active" ? "ACTIVE" : "DRAFT";
    const compare = form.compare_at_price.trim()
        ? parseFloat(form.compare_at_price)
        : null;
    const now = new Date().toISOString();

    const { error: pErr } = await supabase
        .from("products")
        .update({
            name,
            description: form.description.trim() || null,
            short_description: (form.description.trim() || name).slice(0, 500),
            category_id: categoryId,
            base_price: price,
            compare_at_price: compare != null && !Number.isNaN(compare) ? compare : null,
            status,
            type: form.is_digital ? "DIGITAL" : "PHYSICAL",
            tags: tags.length ? tags : [],
            updated_at: now,
        })
        .eq("id", productId);
    throwIfPgError(pErr, "Could not update product");

    const imageUrl = form.image_url.trim();
    if (imageUrl) {
        const { data: existing } = await supabase
            .from("product_images")
            .select("id")
            .eq("product_id", productId)
            .order("sort_order", { ascending: true })
            .limit(1);

        if (existing?.[0]?.id) {
            await supabase
                .from("product_images")
                .update({ url: imageUrl })
                .eq("id", existing[0].id);
        } else {
            await supabase.from("product_images").insert({
                id: crypto.randomUUID(),
                product_id: productId,
                url: imageUrl,
                is_primary: true,
                sort_order: 0,
            });
        }
    }

    const { data: variants } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId)
        .limit(1);
    const vid = variants?.[0]?.id;
    if (vid) {
        await supabase
            .from("product_variants")
            .update({
                price,
                compare_at_price:
                    compare != null && !Number.isNaN(compare) ? compare : null,
                updated_at: now,
            })
            .eq("id", vid);
    }

}
