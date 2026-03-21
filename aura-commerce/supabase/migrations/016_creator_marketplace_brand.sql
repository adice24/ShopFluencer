-- Seed brand + category for influencer-created listings (Discover / Marketplace).
-- Product inserts use these IDs from the app when creators add products from My Store.

INSERT INTO public.brands (
  id,
  name,
  slug,
  status,
  is_active,
  commission_rate,
  created_at,
  updated_at
)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Creator listings',
  'creator-marketplace',
  'ACTIVE',
  true,
  10,
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.categories (
  id,
  name,
  slug,
  sort_order,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  'General',
  'general',
  0,
  true,
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();
