-- Add short_slug column to links table
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS short_slug TEXT UNIQUE;

-- Create an index to index fast lookups
CREATE INDEX IF NOT EXISTS idx_links_short_slug ON public.links(short_slug);

-- Create a function to look up short_slug and handle tracking all at once.
-- This ensures atomicity when processing redirects.
CREATE OR REPLACE FUNCTION public.resolve_short_link(
    p_slug TEXT,
    p_user_agent TEXT DEFAULT '',
    p_ip_address TEXT DEFAULT ''
)
RETURNS TABLE (
    success BOOLEAN,
    url TEXT,
    title TEXT,
    thumbnail_url TEXT,
    store_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_link_id UUID;
    v_store_id UUID;
    v_url TEXT;
    v_title TEXT;
    v_thumb TEXT;
BEGIN
    -- Find link
    SELECT id, links.store_id, links.url, links.title, links.thumbnail_url 
    INTO v_link_id, v_store_id, v_url, v_title, v_thumb
    FROM public.links 
    WHERE short_slug = p_slug AND is_visible = true;

    IF v_link_id IS NOT NULL THEN
        -- Safely record tracking if the analytics table exists
        -- Ignore errors if analytics tables aren't set up yet
        BEGIN
            INSERT INTO public.link_clicks (link_id, store_id, user_agent, ip_address)
            VALUES (v_link_id, v_store_id, p_user_agent, p_ip_address);
        EXCEPTION WHEN OTHERS THEN
            -- do nothing, just skip analytics
        END;
        
        -- Increment link counter
        UPDATE public.links 
        SET click_count = COALESCE(click_count, 0) + 1 
        WHERE id = v_link_id;
        
        -- Return link details for redirect
        RETURN QUERY SELECT true, v_url, v_title, v_thumb, v_store_id;
    ELSE
        -- Return false if not found
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::UUID;
    END IF;
END;
$$;
