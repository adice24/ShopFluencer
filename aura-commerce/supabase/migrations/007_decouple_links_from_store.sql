-- Migration 007: Decouple Links from Stores (Hybrid Model)

-- 1. Add user_id to links table
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing links to have the user_id from their store
UPDATE public.links l
SET user_id = s.user_id
FROM public.influencer_stores s
WHERE l.store_id = s.id AND l.user_id IS NULL;

-- Make user_id NOT NULL and store_id optional
ALTER TABLE public.links 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN store_id DROP NOT NULL;

-- 2. Add user_id to link_clicks for decoupled analytics tracking
ALTER TABLE public.link_clicks
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing clicks
UPDATE public.link_clicks c
SET user_id = l.user_id
FROM public.links l
WHERE c.link_id = l.id AND c.user_id IS NULL;

ALTER TABLE public.link_clicks 
ALTER COLUMN store_id DROP NOT NULL;

-- 3. Update RLS Policies for links
DROP POLICY IF EXISTS "links_select_own" ON public.links;
CREATE POLICY "links_select_own" ON public.links
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "links_insert_own" ON public.links;
CREATE POLICY "links_insert_own" ON public.links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "links_update_own" ON public.links;
CREATE POLICY "links_update_own" ON public.links
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "links_delete_own" ON public.links;
CREATE POLICY "links_delete_own" ON public.links
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "links_select_public" ON public.links;
CREATE POLICY "links_select_public" ON public.links
    FOR SELECT USING (is_visible = true);

-- 4. Update RLS Policies for link_clicks
DROP POLICY IF EXISTS "link_clicks_select_own" ON public.link_clicks;
CREATE POLICY "link_clicks_select_own" ON public.link_clicks
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Updated resolve_short_link RPC to correctly attribute clicks
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
            INSERT INTO public.link_clicks (link_id, store_id, user_id, user_agent, ip_address, referer, country)
            VALUES (v_link.id, v_link.store_id, v_link.user_id, p_user_agent, p_ip_address, p_referer, p_country);
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

-- 6. Update track_link_click RPC to handle missing store_id
CREATE OR REPLACE FUNCTION public.track_link_click(p_link_id UUID, p_user_agent TEXT DEFAULT '', p_ip_address TEXT DEFAULT '')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_link public.links%ROWTYPE;
BEGIN
    SELECT * INTO v_link FROM public.links WHERE id = p_link_id;
    
    IF v_link.id IS NOT NULL THEN
        -- Insert click record
        BEGIN
            INSERT INTO public.link_clicks (link_id, store_id, user_id, user_agent, ip_address)
            VALUES (p_link_id, v_link.store_id, v_link.user_id, p_user_agent, p_ip_address);
        EXCEPTION WHEN OTHERS THEN
        END;
        
        -- Increment counter
        UPDATE public.links SET click_count = COALESCE(click_count, 0) + 1 WHERE id = p_link_id;
    END IF;
END;
$$;
