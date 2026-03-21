-- Prisma catalog uses brand_id + storefront_products; legacy 002 policies used products.store_id.
-- Without a storefront-scoped SELECT, PostgREST embeds return null for `product` and My Store stays empty
-- even when storefront_products rows exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'storefront_products'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'storefronts'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'influencer_profiles'
  ) THEN
    DROP POLICY IF EXISTS "products_select_linked_to_my_storefront" ON public.products;
    CREATE POLICY "products_select_linked_to_my_storefront" ON public.products
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.storefront_products sp
          INNER JOIN public.storefronts sf ON sf.id = sp.storefront_id
          INNER JOIN public.influencer_profiles ip ON ip.id = sf.influencer_id
          WHERE sp.product_id = products.id
            AND ip.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- If product_images has RLS enabled, nested embeds need the same storefront link.
DO $$
DECLARE
  rls_on_images BOOLEAN;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_images'
  ) THEN
    RETURN;
  END IF;

  SELECT c.relrowsecurity INTO rls_on_images
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'product_images';

  IF rls_on_images THEN
    DROP POLICY IF EXISTS "product_images_select_linked_to_my_storefront" ON public.product_images;
    CREATE POLICY "product_images_select_linked_to_my_storefront" ON public.product_images
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.storefront_products sp
          INNER JOIN public.storefronts sf ON sf.id = sp.storefront_id
          INNER JOIN public.influencer_profiles ip ON ip.id = sf.influencer_id
          WHERE sp.product_id = product_images.product_id
            AND ip.user_id = auth.uid()
        )
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
