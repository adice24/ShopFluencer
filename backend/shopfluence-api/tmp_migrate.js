const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connectionString = "postgresql://postgres.xteedgrrflnfeubtccai:Reshotgamer%40123@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?schema=public";
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Supabase');
    
    const migrationDir = 'd:/PROJECTS/ShopFuence/ShopFuence/aura-commerce/supabase/migrations';
    const files = fs.readdirSync(migrationDir).sort();
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      
      console.log(`\n========== Running migration: ${file} ==========`);
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      
      try {
        await client.query(sql);
        console.log(`SUCCESS: ${file}`);
      } catch (err) {
        console.error(`ERROR in ${file}: ${err.message}`);
      }
    }

    // Verify tables exist
    console.log('\n========== Verifying tables ==========');
    const result = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    console.log('Tables in public schema:');
    result.rows.forEach(r => console.log(`  - ${r.tablename}`));

  } catch (err) {
    console.error('Fatal connection error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
