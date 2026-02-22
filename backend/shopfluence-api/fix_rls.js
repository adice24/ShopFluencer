const { Client } = require('pg');

const url = "postgresql://postgres.xteedgrrflnfeubtccai:Reshotgamer%40123@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";

async function run() {
    const client = new Client({
        connectionString: url,
    });

    try {
        await client.connect();
        console.log("Connected to DB via pg driver.");

        const res = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'influencer_stores';
    `);
        console.log("Current Policies:", res.rows);

        await client.query(`ALTER TABLE influencer_stores DISABLE ROW LEVEL SECURITY;`);
        console.log("RLS disabled entirely for influencer_stores.");

        // Attempting to reconstruct basic non-recursive ones
        for (const row of res.rows) {
            await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON influencer_stores;`);
        }

        await client.query(`ALTER TABLE influencer_stores ENABLE ROW LEVEL SECURITY;`);

        await client.query(`
      CREATE POLICY "public_read_stores" 
      ON influencer_stores FOR SELECT 
      USING (true);
    `);

        await client.query(`
      CREATE POLICY "user_insert_store" 
      ON influencer_stores FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    `);

        await client.query(`
      CREATE POLICY "user_update_store" 
      ON influencer_stores FOR UPDATE 
      USING (auth.uid() = user_id);
    `);

        console.log("Successfully rebuilt simple RLS policies.");

    } catch (err) {
        console.error("Failed executing SQL:", err.message);
    } finally {
        await client.end();
    }
}

run();
