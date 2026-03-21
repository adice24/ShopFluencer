/**
 * Quick local check: API must be running. Reads PORT from .env if present.
 * Usage: npm run verify:health
 */
const fs = require('fs');
const path = require('path');

let port = 3000;
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  const m = raw.match(/^PORT\s*=\s*(\d+)/m);
  if (m) port = parseInt(m[1], 10);
}

const base = `http://127.0.0.1:${port}/api/v1`;

async function main() {
  for (const p of ['/health/live', '/health/ready']) {
    try {
      const res = await fetch(base + p);
      const body = await res.json().catch(() => ({}));
      console.log(`${p} → ${res.status}`, JSON.stringify(body));
      if (!res.ok) process.exitCode = 1;
      const payload = body && body.data !== undefined ? body.data : body;
      if (p === '/health/ready' && payload?.status === 'error') {
        console.error(
          '\nReadiness: database disconnected. Fix DATABASE_URL / resume Supabase — see backend/shopfluence-api/docs/DATABASE.md',
        );
        process.exitCode = 1;
      }
    } catch (e) {
      console.error(`${p} → FAILED: ${e.message}`);
      console.error(`Is the API running on port ${port}? (check backend/shopfluence-api/.env PORT)`);
      process.exit(1);
    }
  }
}

main();
