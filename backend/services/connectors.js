const crypto = require('node:crypto');
const pool = require('../db');
const { decryptSecret, hash, audit } = require('../lib/security');
const { z } = require('zod');

const changeSchema = z.object({ sourceId: z.string().min(1).max(240), version: z.string().min(1).max(160), title: z.string().max(1000).default(''),
  content: z.string().max(200000).default(''), permissions: z.array(z.string().min(1).max(160)).min(1).max(100),
  deleted: z.boolean().default(false), updatedAt: z.iso.datetime() });
const responseSchema = z.object({ nextCursor: z.string().max(4000).nullable(), hasMore: z.boolean(), changes: z.array(changeSchema).max(500) });

async function fetchChanges(connector) {
  const url = new URL('/v1/changes', connector.base_url); if (connector.cursor) url.searchParams.set('cursor', connector.cursor);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('Connector URL must use HTTPS');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { headers: { authorization: `Bearer ${decryptSecret(connector.encrypted_secret)}`, accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`Connector returned ${response.status}`);
    const raw = await response.text(); if (raw.length > 2_000_000) throw new Error('Connector response too large');
    return responseSchema.parse(JSON.parse(raw));
  } finally { clearTimeout(timer); }
}

async function executeSync(job) {
  const connectorResult = await pool.query(`SELECT * FROM connectors WHERE id=$1 AND tenant_id=$2`, [job.connector_id, job.tenant_id]);
  const connector = connectorResult.rows[0]; if (!connector || connector.status === 'disabled') throw new Error('Connector unavailable');
  let upserted = 0; let deleted = 0; let pages = 0; let latestSource = connector.source_updated_at;
  await pool.query(`UPDATE connectors SET status='syncing',last_error=NULL,updated_at=NOW() WHERE id=$1`, [connector.id]);
  let hasMore = true;
  while (hasMore) {
    const page = await fetchChanges(connector); pages += 1;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const change of page.changes) {
        if (change.deleted) {
          const result = await client.query(`UPDATE indexed_documents SET deleted_at=NOW(),content='',indexed_at=NOW() WHERE tenant_id=$1 AND connector_id=$2 AND source_id=$3 AND deleted_at IS NULL`, [job.tenant_id, connector.id, change.sourceId]);
          deleted += result.rowCount;
        } else {
          await client.query(`INSERT INTO indexed_documents(id,tenant_id,connector_id,source_id,source_version,title,content,permissions,content_hash,source_updated_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            ON CONFLICT(connector_id,source_id) DO UPDATE SET source_version=EXCLUDED.source_version,title=EXCLUDED.title,content=EXCLUDED.content,
              permissions=EXCLUDED.permissions,content_hash=EXCLUDED.content_hash,source_updated_at=EXCLUDED.source_updated_at,indexed_at=NOW(),deleted_at=NULL`,
            [crypto.randomUUID(), job.tenant_id, connector.id, change.sourceId, change.version, change.title, change.content, change.permissions, hash(change.content), change.updatedAt]);
          upserted += 1;
        }
        if (!latestSource || new Date(change.updatedAt) > new Date(latestSource)) latestSource = change.updatedAt;
      }
      connector.cursor = page.nextCursor;
      await client.query(`UPDATE connectors SET cursor=$1,source_updated_at=$2,updated_at=NOW() WHERE id=$3 AND tenant_id=$4`, [page.nextCursor, latestSource, connector.id, job.tenant_id]);
      if (job.id) await client.query(`UPDATE sync_jobs SET lease_until=NOW()+INTERVAL '90 seconds' WHERE id=$1 AND status='running'`, [job.id]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    hasMore = page.hasMore;
    if (!hasMore) break;
    if (pages >= Number(process.env.CONNECTOR_MAX_PAGES || 20)) throw new Error('Connector page limit exceeded');
  }
  const stats = { upserted, deleted, pages };
  const client = await pool.connect();
  try { await client.query('BEGIN'); await client.query(`UPDATE connectors SET status='ready',last_synced_at=NOW(),last_error=NULL,updated_at=NOW() WHERE id=$1`, [connector.id]);
    await audit(client, { tenantId: job.tenant_id, actorId: job.created_by, action: 'connector.sync.completed', targetType: 'connector', targetId: connector.id, output: stats, details: stats }); await client.query('COMMIT'); }
  catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  return stats;
}
module.exports = { executeSync, responseSchema };
