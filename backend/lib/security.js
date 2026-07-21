const crypto = require('node:crypto');
const pool = require('../db');

function encryptionKey() {
  const raw = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!raw) throw Object.assign(new Error('CONNECTOR_ENCRYPTION_KEY is required'), { status: 503 });
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw Object.assign(new Error('CONNECTOR_ENCRYPTION_KEY must be base64 for exactly 32 bytes'), { status: 503 });
  return key;
}
function encryptSecret(value) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}
function decryptSecret(value) {
  const [iv, tag, data] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
function hash(value) { return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex'); }
async function audit(client, { tenantId, actorId, action, targetType, targetId, input, output, details = {} }) {
  await client.query(`INSERT INTO audit_events(tenant_id,actor_user_id,action,target_type,target_id,input_hash,output_hash,details)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [tenantId, actorId || null, action, targetType, String(targetId), input ? hash(input) : null, output ? hash(output) : null, details]);
}
async function rateLimit(user, bucket, limit, seconds) {
  const result = await pool.query(`INSERT INTO rate_limits(tenant_id,user_id,bucket,window_start,count) VALUES($1,$2,$3,NOW(),1)
    ON CONFLICT(tenant_id,user_id,bucket) DO UPDATE SET
      count=CASE WHEN rate_limits.window_start < NOW()-($4::text || ' seconds')::interval THEN 1 ELSE rate_limits.count+1 END,
      window_start=CASE WHEN rate_limits.window_start < NOW()-($4::text || ' seconds')::interval THEN NOW() ELSE rate_limits.window_start END
    RETURNING count`, [user.tenant_id, user.id, bucket, seconds]);
  if (result.rows[0].count > limit) throw Object.assign(new Error('Rate limit exceeded'), { status: 429 });
}
module.exports = { encryptSecret, decryptSecret, hash, audit, rateLimit };
