const express = require('express');
const crypto = require('node:crypto');
const { z } = require('zod');
const pool = require('../db');
const { requireRole } = require('../middleware/auth');
const { encryptSecret, audit, rateLimit } = require('../lib/security');
const router = express.Router();
const createSchema = z.object({ name: z.string().min(1).max(160), baseUrl: z.url(), secret: z.string().min(12).max(4000) });

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT c.id,c.name,c.kind,c.base_url,c.permission_mode,c.status,c.last_synced_at,c.source_updated_at,c.last_error,c.created_at,
      EXTRACT(EPOCH FROM (NOW()-c.last_synced_at))::int AS freshness_seconds,COUNT(d.id) FILTER(WHERE d.deleted_at IS NULL)::int AS document_count
      FROM connectors c LEFT JOIN indexed_documents d ON d.connector_id=c.id AND d.tenant_id=c.tenant_id
      WHERE c.tenant_id=$1 GROUP BY c.id ORDER BY c.created_at DESC`, [req.user.tenant_id]);
    res.json({ connectors: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireRole('tenant_admin'), async (req, res, next) => {
  try {
    await rateLimit(req.user, 'connector-create', 20, 3600); const body = createSchema.parse(req.body);
    const url = new URL(body.baseUrl); if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') return res.status(400).json({ error: 'HTTPS is required' });
    const id = crypto.randomUUID(); const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await client.query(`INSERT INTO connectors(id,tenant_id,name,kind,base_url,encrypted_secret,created_by)
      VALUES($1,$2,$3,'http_incremental',$4,$5,$6) RETURNING id,name,kind,base_url,permission_mode,status,created_at`,
      [id, req.user.tenant_id, body.name, url.toString(), encryptSecret(body.secret), req.user.id]);
      await audit(client, { tenantId: req.user.tenant_id, actorId: req.user.id, action: 'connector.created', targetType: 'connector', targetId: id, input: { name: body.name, baseUrl: url.toString() } });
      await client.query('COMMIT'); res.status(201).json({ connector: result.rows[0] });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch (error) { next(error); }
});

router.post('/:id/sync', requireRole('reviewer','tenant_admin'), async (req, res, next) => {
  try {
    await rateLimit(req.user, 'connector-sync', 60, 3600); const key = String(req.get('idempotency-key') || '');
    if (!/^[A-Za-z0-9:_-]{8,160}$/.test(key)) return res.status(400).json({ error: 'Valid Idempotency-Key required' });
    const connector = await pool.query(`SELECT id FROM connectors WHERE id=$1 AND tenant_id=$2 AND status<>'disabled'`, [req.params.id, req.user.tenant_id]);
    if (!connector.rowCount) return res.status(404).json({ error: 'Connector not found' });
    const prior = await pool.query(`SELECT * FROM sync_jobs WHERE tenant_id=$1 AND idempotency_key=$2`, [req.user.tenant_id,key]);
    if (prior.rows[0]) {
      if (prior.rows[0].connector_id !== req.params.id) return res.status(409).json({ error: 'Idempotency key payload conflict' });
      return res.json({ job: prior.rows[0], duplicate: true });
    }
    const result = await pool.query(`INSERT INTO sync_jobs(id,tenant_id,connector_id,idempotency_key,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [crypto.randomUUID(), req.user.tenant_id, req.params.id, key, req.user.id]);
    res.status(202).json({ job: result.rows[0], duplicate: false });
  } catch (error) { next(error); }
});

router.patch('/:id/secret', requireRole('tenant_admin'), async (req,res,next)=>{
  try { const secret=z.string().min(12).max(4000).parse(req.body?.secret);const client=await pool.connect();try{await client.query('BEGIN');const result=await client.query(`UPDATE connectors SET encrypted_secret=$1,status='pending',last_error=NULL,updated_at=NOW() WHERE id=$2 AND tenant_id=$3 AND status<>'disabled' RETURNING id`,[encryptSecret(secret),req.params.id,req.user.tenant_id]);if(!result.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'Connector not found'});}await audit(client,{tenantId:req.user.tenant_id,actorId:req.user.id,action:'connector.secret.rotated',targetType:'connector',targetId:req.params.id});await client.query('COMMIT');res.json({ok:true});}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  } catch(error){next(error);}
});

router.delete('/:id', requireRole('tenant_admin'), async (req, res, next) => {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const disabled = await client.query(`UPDATE connectors SET status='disabled',encrypted_secret='disabled',cursor=NULL,updated_at=NOW()
    WHERE id=$1 AND tenant_id=$2 RETURNING id`, [req.params.id, req.user.tenant_id]);
    if (!disabled.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Connector not found' }); }
    const removed = await client.query(`UPDATE indexed_documents SET deleted_at=NOW(),content='',indexed_at=NOW() WHERE connector_id=$1 AND tenant_id=$2 AND deleted_at IS NULL`, [req.params.id, req.user.tenant_id]);
    await audit(client, { tenantId: req.user.tenant_id, actorId: req.user.id, action: 'connector.disabled', targetType: 'connector', targetId: req.params.id, details: { documentsDeleted: removed.rowCount } });
    await client.query('COMMIT'); res.json({ ok: true, documentsDeleted: removed.rowCount });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});
module.exports = router;
