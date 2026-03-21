-- 019 adds products SELECT via storefront link, but that policy's EXISTS subquery must
-- read storefront_products + storefronts. If those tables have RLS with no owner policy,
-- the subquery sees zero rows and every product stays denied — My Store stays empty.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'storefronts'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'influencer_profiles'
  ) THEN
    DROP POLICY IF EXISTS "storefronts_select_own_influencer" ON public.storefronts;
    CREATE POLICY "storefronts_select_own_influencer" ON public.storefronts
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.influencer_profiles ip
          WHERE ip.id = storefronts.influencer_id
            AND ip.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'storefront_products'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'storefronts'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'influencer_profiles'
  ) THEN
    DROP POLICY IF EXISTS "storefront_products_select_own_influencer" ON public.storefront_products;
    CREATE POLICY "storefront_products_select_own_influencer" ON public.storefront_products
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.storefronts sf
          INNER JOIN public.influencer_profiles ip ON ip.id = sf.influencer_id
          WHERE sf.id = storefront_products.storefront_id
            AND ip.user_id = auth.uid()
        )
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
