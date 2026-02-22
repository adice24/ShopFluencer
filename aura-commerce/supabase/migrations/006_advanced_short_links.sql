-- Migration 006: Advanced Short Links logic
-- Add missing columns to link_clicks for expanded analytics
ALTER TABLE public.link_clicks
ADD COLUMN IF NOT EXISTS referer TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Improve Links table
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS short_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create an index to index fast lookups
CREATE INDEX IF NOT EXISTS idx_links_short_slug ON public.links(short_slug);

-- Create short slug generation function
CREATE OR REPLACE FUNCTION public.generate_unique_short_slug()
RETURNS TEXT AS $$
DECLARE
    new_slug TEXT;
    done BOOLEAN := false;
BEGIN
    WHILE NOT done LOOP
        -- Generate random 8 character string
        new_slug := (
            SELECT string_agg(substr('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', trunc(random() * 62)::integer + 1, 1), '')
            FROM generate_series(1, 8)
        );
        
        -- Check if it exists in links or stores
        IF NOT EXISTS (SELECT 1 FROM public.links WHERE short_slug = new_slug) AND
           NOT EXISTS (SELECT 1 FROM public.influencer_stores WHERE slug = new_slug) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Trigger logic for default short_slug and URL validation
CREATE OR REPLACE FUNCTION public.trigger_set_short_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate URL starts with http
    IF NEW.url !~ '^https?://' THEN
        RAISE EXCEPTION 'Invalid URL format. Must start with http:// or https://';
    END IF;

    -- Automatically set short_slug if null
    IF NEW.short_slug IS NULL OR NEW.short_slug = '' THEN
        NEW.short_slug := public.generate_unique_short_slug();
    ELSE
        -- Ensure vanity slugs or manual slugs don't conflict
        IF EXISTS (SELECT 1 FROM public.links WHERE short_slug = NEW.short_slug AND id != NEW.id) OR
           EXISTS (SELECT 1 FROM public.influencer_stores WHERE slug = NEW.short_slug) THEN
            RAISE EXCEPTION 'Slug already in use';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_short_slug ON public.links;
CREATE TRIGGER ensure_short_slug
BEFORE INSERT OR UPDATE ON public.links
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_short_slug();

-- Update the resolve_short_link RPC to handle advanced analytics, expiry, and password protection flags
CREATE OR REPLACE FUNCTION public.resolve_short_link(
    p_slug TEXT,
    p_user_agent TEXT DEFAULT '',
    p_ip_address TEXT DEFAULT '',
    p_referer TEXT DEFAULT '',
    p_country TEXT DEFAULT ''
)
RETURNS TABLE (
    success BOOLEAN,
    url TEXT,
    title TEXT,
    thumbnail_url TEXT,
    store_id UUID,
    is_password_protected BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_link public.links%ROWTYPE;
BEGIN
    -- Find link
    SELECT * INTO v_link
    FROM public.links 
    WHERE short_slug = p_slug AND is_visible = true;

    IF v_link.id IS NOT NULL THEN
        -- Check expiry
        IF (v_link.start_date IS NOT NULL AND now() < v_link.start_date) OR
           (v_link.end_date IS NOT NULL AND now() > v_link.end_date) THEN
            -- Expired or hasn't started
            RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::UUID, false;
            RETURN;
        END IF;

        -- Record expanded analytics tracking
        BEGIN
            INSERT INTO public.link_clicks (link_id, store_id, user_agent, ip_address, referer, country)
            VALUES (v_link.id, v_link.store_id, p_user_agent, p_ip_address, p_referer, p_country);
        EXCEPTION WHEN OTHERS THEN
            -- Catch constraints but realistically should insert
        END;
        
        -- Increment link counter
        UPDATE public.links 
        SET click_count = COALESCE(click_count, 0) + 1 
        WHERE id = v_link.id;
        
        -- Return link details for redirect
        RETURN QUERY SELECT true, v_link.url, v_link.title, v_link.thumbnail_url, v_link.store_id, (v_link.password_hash IS NOT NULL);
    ELSE
        -- Return false if not found
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::UUID, false;
    END IF;
END;
$$;
