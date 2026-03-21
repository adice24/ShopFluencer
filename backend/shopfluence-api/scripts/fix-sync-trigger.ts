import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATEMENTS = [
    `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Use ON CONFLICT to prevent 500 errors if user was already synced manually
  INSERT INTO public.users (id, email, first_name, last_name, role, status, password_hash, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    (COALESCE(new.raw_user_meta_data->>'role', 'AFFILIATE'))::"UserRole",
    'ACTIVE',
    'SUPABASE_AUTH',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();
  
  -- Create empty profile if affiliate (with conflict handling)
  IF (new.raw_user_meta_data->>'role' = 'AFFILIATE' OR new.raw_user_meta_data->>'role' IS NULL) THEN
    INSERT INTO public.influencer_profiles (id, user_id, display_name, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      now(),
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow auth to proceed (don't break login/signup)
  -- In a real app, you'd log this to a separate table
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,
    `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
    `CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
];

async function main() {
    try {
        console.log("Fixing Supabase auth sync trigger (making it idempotent)...");
        for (const sql of STATEMENTS) {
            await prisma.$executeRawUnsafe(sql);
        }
        console.log("Trigger successfully updated!");
    } catch (e) {
        console.error("Failed to update trigger:", e);
        process.exit(1);
    }
}

main()
    .finally(() => prisma.$disconnect());
