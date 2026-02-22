import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exec(sql: string, label: string) {
    try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`✅ ${label}`);
    } catch (e: any) {
        if (e.message?.includes('already exists')) {
            console.log(`⚠️  ${label} (already exists — OK)`);
        } else {
            console.error(`❌ ${label} FAILED:`, e.message);
        }
    }
}

async function main() {
    console.log("Creating tables and indexes...\n");

    await exec(`CREATE TABLE IF NOT EXISTS short_links (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     VARCHAR(255) NOT NULL,
        title       VARCHAR(255) NOT NULL DEFAULT 'Untitled Link',
        original_url TEXT NOT NULL,
        short_code  VARCHAR(50) NOT NULL UNIQUE,
        clicks      INTEGER NOT NULL DEFAULT 0,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`, "short_links table");

    await exec(`CREATE TABLE IF NOT EXISTS link_clicks (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_link_id   UUID NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
        ip_address      VARCHAR(50),
        user_agent      VARCHAR(500),
        referrer        VARCHAR(500),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )`, "link_clicks table");

    await exec(`CREATE INDEX IF NOT EXISTS idx_short_links_user_id ON short_links(user_id)`, "idx_short_links_user_id");
    await exec(`CREATE INDEX IF NOT EXISTS idx_short_links_short_code ON short_links(short_code)`, "idx_short_links_short_code");
    await exec(`CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON short_links(created_at)`, "idx_short_links_created_at");
    await exec(`CREATE INDEX IF NOT EXISTS idx_link_clicks_short_link_id ON link_clicks(short_link_id)`, "idx_link_clicks_short_link_id");
    await exec(`CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON link_clicks(created_at)`, "idx_link_clicks_created_at");

    // Verify
    const rows = await prisma.$queryRaw<{ total: BigInt }[]>`SELECT COUNT(*) as total FROM short_links`;
    console.log(`\n📊 short_links rows: ${rows[0].total}`);

    const codes = await prisma.$queryRaw<{ short_code: string, original_url: string }[]>`
        SELECT short_code, original_url FROM short_links LIMIT 5
    `;
    console.log("🔗 Sample links:", codes);

    console.log("\n✅ Migration complete!");
}

main()
    .catch(err => {
        console.error("Fatal:", err.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
