const express = require('express');
const crypto = require('node:crypto');
const { z } = require('zod');
const pool = require('../db');
const { requireRole } = require('../middleware/auth');
const { inputSchema } = require('../services/tools');
const { audit, hash, rateLimit } = require('../lib/security');
const router = express.Router();
const createSchema = z.object({ tool: z.literal('grounded_interface_proposal'), input: inputSchema,
  timeoutMs: z.number().int().min(1000).max(60000).default(20000), costBudgetUsd: z.number().positive().max(10).default(0.25), latencyBudgetMs: z.number().int().min(1000).max(60000).default(15000) });

router.get('/', async (req, res, next) => {
  try {
    const scope = req.user.role === 'member' ? 'AND created_by=$2' : ''; const params = req.user.role === 'member' ? [req.user.tenant_id,req.user.id] : [req.user.tenant_id];
    const result = await pool.query(`SELECT id,created_by,tool,input,output,provenance,status,attempts,max_attempts,timeout_ms,cost_budget_usd,latency_budget_ms,
      actual_cost_usd,latency_ms,error_code,error,reviewed_by,review_note,reviewed_at,created_at,completed_at FROM generation_jobs WHERE tenant_id=$1 ${scope} ORDER BY created_at DESC LIMIT 200`, params);
    res.json({ jobs: result.rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    await rateLimit(req.user, 'generation-create', Number(process.env.JOB_RATE_LIMIT || 30), 3600); const body = createSchema.parse(req.body);
    const key = String(req.get('idempotency-key') || ''); if (!/^[A-Za-z0-9:_-]{8,160}$/.test(key)) return res.status(400).json({ error: 'Valid Idempotency-Key required' });
    const existing = await pool.query(`SELECT * FROM generation_jobs WHERE tenant_id=$1 AND created_by=$2 AND idempotency_key=$3`, [req.user.tenant_id,req.user.id,key]);
    if (existing.rows[0]) {
      if (hash(existing.rows[0].input) !== hash(body.input)) return res.status(409).json({ error: 'Idempotency key payload conflict' });
      return res.json({ job: existing.rows[0], duplicate: true });
    }
    const id = crypto.randomUUID(); const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await client.query(`INSERT INTO generation_jobs(id,tenant_id,created_by,tool,input,idempotency_key,timeout_ms,cost_budget_usd,latency_budget_ms)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [id,req.user.tenant_id,req.user.id,body.tool,body.input,key,body.timeoutMs,body.costBudgetUsd,body.latencyBudgetMs]);
      await audit(client,{ tenantId:req.user.tenant_id,actorId:req.user.id,action:'generation.queued',targetType:'generation_job',targetId:id,input:body.input,
        details:{ timeoutMs:body.timeoutMs,costBudgetUsd:body.costBudgetUsd,latencyBudgetMs:body.latencyBudgetMs } }); await client.query('COMMIT');
      res.status(202).json({ job:result.rows[0],duplicate:false });
    } catch(error){await client.query('ROLLBACK');throw error;} finally{client.release();}
  } catch(error){next(error);}
});

router.get('/:id', async (req,res,next)=>{
  try { const params=[req.params.id,req.user.tenant_id]; let scope=''; if(req.user.role==='member'){params.push(req.user.id);scope=' AND created_by=$3';}
    const result=await pool.query(`SELECT * FROM generation_jobs WHERE id=$1 AND tenant_id=$2${scope}`,params); if(!result.rows[0])return res.status(404).json({error:'Job not found'});
    const traces=await pool.query(`SELECT span,status,attributes,started_at,ended_at FROM traces WHERE tenant_id=$1 AND job_id=$2 ORDER BY started_at`,[req.user.tenant_id,req.params.id]);
    res.json({job:result.rows[0],traces:traces.rows});
  }catch(error){next(error);}
});

router.post('/:id/review',requireRole('reviewer','tenant_admin'),async(req,res,next)=>{
  const decision=z.object({decision:z.enum(['approved','rejected']),note:z.string().min(3).max(2000)}).parse(req.body); const client=await pool.connect();
  try{await client.query('BEGIN');const selected=await client.query(`SELECT * FROM generation_jobs WHERE id=$1 AND tenant_id=$2 FOR UPDATE`,[req.params.id,req.user.tenant_id]);const job=selected.rows[0];
    if(!job){await client.query('ROLLBACK');return res.status(404).json({error:'Job not found'});}if(job.status!=='awaiting_approval'){await client.query('ROLLBACK');return res.status(409).json({error:'Job is not awaiting approval'});}
    if(job.created_by===req.user.id){await client.query('ROLLBACK');return res.status(409).json({error:'Independent reviewer required'});}
    const updated=await client.query(`UPDATE generation_jobs SET status=$1,reviewed_by=$2,review_note=$3,reviewed_at=NOW() WHERE id=$4 RETURNING *`,[decision.decision,req.user.id,decision.note,job.id]);
    await audit(client,{tenantId:req.user.tenant_id,actorId:req.user.id,action:`generation.${decision.decision}`,targetType:'generation_job',targetId:job.id,input:decision,output:job.output});await client.query('COMMIT');res.json({job:updated.rows[0]});
  }catch(error){await client.query('ROLLBACK');next(error);}finally{client.release();}
});
module.exports=router;
