-- ═══════════════════════════════════════════════════════════════
-- Linktree Style Links Schema
-- Includes links, themes, and click tracking
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 1. THEMES                                                   │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.influencer_stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
    background_type TEXT DEFAULT 'gradient',
    background_value TEXT DEFAULT 'linear-gradient(135deg, hsl(68, 80%, 52%), hsl(236, 60%, 50%))',
    button_style TEXT DEFAULT 'rounded',
    font_family TEXT DEFAULT 'Inter',
    button_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#000000',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes FORCE ROW LEVEL SECURITY;

CREATE POLICY "themes_select_own" ON public.themes
    FOR SELECT USING (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "themes_insert_own" ON public.themes
    FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "themes_update_own" ON public.themes
    FOR UPDATE USING (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "themes_select_public" ON public.themes
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.influencer_stores WHERE is_approved = true AND is_active = true)
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.themes;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 2. LINKS                                                    │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.influencer_stores(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    thumbnail_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links FORCE ROW LEVEL SECURITY;

CREATE POLICY "links_select_own" ON public.links
    FOR SELECT USING (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "links_insert_own" ON public.links
    FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "links_update_own" ON public.links
    FOR UPDATE USING (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "links_delete_own" ON public.links
    FOR DELETE USING (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "links_select_public" ON public.links
    FOR SELECT USING (
        is_visible = true 
        AND store_id IN (SELECT id FROM public.influencer_stores WHERE is_approved = true AND is_active = true)
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.links;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 3. LINK CLICKS (ANALYTICS)                                  │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.link_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    link_id UUID REFERENCES public.links(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.influencer_stores(id) ON DELETE CASCADE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks FORCE ROW LEVEL SECURITY;

CREATE POLICY "link_clicks_select_own" ON public.link_clicks
    FOR SELECT USING (store_id IN (SELECT id FROM public.influencer_stores WHERE user_id = auth.uid()));

CREATE POLICY "link_clicks_insert_anyone" ON public.link_clicks
    FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.link_clicks;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 4. RPC TRACK CLICK                                          │
-- └─────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.track_link_click(p_link_id UUID, p_user_agent TEXT DEFAULT '', p_ip_address TEXT DEFAULT '')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
BEGIN
    -- Get store_id for the link
    SELECT store_id INTO v_store_id FROM public.links WHERE id = p_link_id;
    
    IF v_store_id IS NOT NULL THEN
        -- Insert click record
        INSERT INTO public.link_clicks (link_id, store_id, user_agent, ip_address)
        VALUES (p_link_id, v_store_id, p_user_agent, p_ip_address);
        
        -- Increment counter
        UPDATE public.links SET click_count = click_count + 1 WHERE id = p_link_id;
    END IF;
END;
$$;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 5. INDEXES                                                  │
-- └─────────────────────────────────────────────────────────────┘

CREATE INDEX IF NOT EXISTS idx_links_store_id ON public.links(store_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON public.links(store_id, position);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON public.link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_store_id ON public.link_clicks(store_id);
CREATE INDEX IF NOT EXISTS idx_themes_store_id ON public.themes(store_id);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 6. TRIGGERS                                                 │
-- └─────────────────────────────────────────────────────────────┘

CREATE TRIGGER links_updated_at BEFORE UPDATE ON public.links
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER themes_updated_at BEFORE UPDATE ON public.themes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.themes TO authenticated;
GRANT SELECT ON public.themes TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.links TO authenticated;
GRANT SELECT ON public.links TO anon;

GRANT SELECT, INSERT ON public.link_clicks TO authenticated;
GRANT INSERT ON public.link_clicks TO anon;
