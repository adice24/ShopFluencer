# Database connection (Prisma + Supabase)

## Error: `P1001` — Can't reach database server at `db.<ref>.supabase.co:5432`

The API process cannot open a network connection to Postgres. Common causes:

### 1. Supabase project is paused
Free-tier projects pause after inactivity. Open the [Supabase Dashboard](https://supabase.com/dashboard) → your project → if you see **Restore** or **Resume**, click it and wait until the DB is **Active**.

### 2. Wrong or incomplete `.env`
In **Project Settings → Database** copy:

| Variable        | What to copy in Supabase |
|----------------|--------------------------|
| `DATABASE_URL` | **Connection string** using the **Transaction pooler** (port **6543**, often `*.pooler.supabase.com`). Prisma recommends this for app servers. |
| `DIRECT_URL`   | **Direct connection** (port **5432**, host `db.<project-ref>.supabase.co`) for `prisma migrate`. |

Both strings must include the **database password** you set when creating the project (reset it in the same settings page if needed).

Append `?sslmode=require` if the UI does not add it.

### 3. Network / firewall
Some networks block outbound **5432**. Symptoms: pooler **6543** works but direct **5432** does not.

- Try another network or hotspot.
- Corporate VPNs sometimes block database ports.

### 4. IPv6 / regional issues
If **5432** never connects from your PC but the dashboard works, use the **pooler** URL for `DATABASE_URL` (as above). Keep `DIRECT_URL` as the direct URI for migrations; run migrations from CI or a network that can reach `db.*.supabase.co:5432`.

### Verify

```bash
cd backend/shopfluence-api
npx prisma db execute --stdin <<< "SELECT 1"
```

(Requires valid `DATABASE_URL` / `DIRECT_URL` in `.env`.)

After fixing `.env`, restart: `npm run start:dev`.
