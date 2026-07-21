require('dotenv').config({ path: require('path').join(__dirname, '../../.env'), quiet: true });
const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../db');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [7823419]);
    const legacy = await client.query(`SELECT to_regclass('public.users')::text users, to_regclass('public.schema_migrations')::text journal,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='tenant_id') tenant_scoped`);
    if (legacy.rows[0].users && (!legacy.rows[0].journal || !legacy.rows[0].tenant_scoped)) throw new Error('Unversioned legacy schema detected; automatic mutation is refused. Use the reviewed quarantine/import procedure.');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const directory = path.join(__dirname, 'migrations');
    for (const name of (await fs.readdir(directory)).filter((entry) => entry.endsWith('.sql')).sort()) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
      if (applied.rowCount) continue;
      const sql = await fs.readFile(path.join(directory, name), 'utf8');
      await client.query('BEGIN');
      try { await client.query(sql); await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]); await client.query('COMMIT'); }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally { await client.query('SELECT pg_advisory_unlock($1)', [7823419]).catch(() => undefined); client.release(); await pool.end(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
