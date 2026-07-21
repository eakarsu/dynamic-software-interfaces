require('dotenv').config({ path: require('path').join(__dirname, '../../.env'), quiet: true });
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const acknowledgement = process.env.BOOTSTRAP_ACKNOWLEDGEMENT;
  const tenantSlug = process.env.BOOTSTRAP_TENANT_SLUG?.trim().toLowerCase();
  const tenantName = process.env.BOOTSTRAP_TENANT_NAME?.trim();
  const email = (process.env.BOOTSTRAP_EMAIL ?? process.env.PROVISION_ADMIN_EMAIL)?.trim().toLowerCase();
  const name = (process.env.BOOTSTRAP_NAME ?? process.env.PROVISION_ADMIN_NAME)?.trim();
  const password = process.env.BOOTSTRAP_PASSWORD ?? process.env.PROVISION_ADMIN_PASSWORD;
  const role = process.env.BOOTSTRAP_ROLE || 'tenant_admin';
  if (acknowledgement !== 'create-initial-admin') throw new Error('BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin is required');
  if (!tenantSlug || !/^[a-z0-9-]{2,64}$/.test(tenantSlug) || !tenantName || !email || !name || !password || password.length < 12 || !['member', 'reviewer', 'tenant_admin'].includes(role)) {
    throw new Error('Valid tenant slug/name, email/name, 12+ character password, and role are required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let tenant = (await client.query('SELECT id FROM tenants WHERE slug=$1', [tenantSlug])).rows[0];
    if (!tenant) {
      tenant = (await client.query('INSERT INTO tenants(id,slug,name) VALUES($1,$2,$3) RETURNING id', [crypto.randomUUID(), tenantSlug, tenantName])).rows[0];
    }
    const existing = (await client.query('SELECT id FROM users WHERE tenant_id=$1 AND email=$2', [tenant.id, email])).rows[0];
    if (existing) throw new Error(`Refusing to replace existing account for ${email}`);
    await client.query(
      'INSERT INTO users(id,tenant_id,email,password_hash,name,role) VALUES($1,$2,$3,$4,$5,$6)',
      [crypto.randomUUID(), tenant.id, email, await bcrypt.hash(password, 12), name, role],
    );
    await client.query('COMMIT');
    console.log(`Created ${role} ${email} in ${tenantSlug}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
