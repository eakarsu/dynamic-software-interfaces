const crypto = require('node:crypto');
const pool = require('../db');
const { executeTool } = require('./tools');
const { audit } = require('../lib/security');

async function trace(tenantId, jobId, span, status, attributes, started) {
  await pool.query(`INSERT INTO traces(id,tenant_id,job_type,job_id,span,status,attributes,started_at,ended_at) VALUES($1,$2,'generation',$3,$4,$5,$6,$7,NOW())`,
    [crypto.randomUUID(), tenantId, jobId, span, status, attributes, started]);
}
async function executeGeneration(job) {
  const userResult = await pool.query(`SELECT id,tenant_id,role,permission_groups FROM users WHERE id=$1 AND tenant_id=$2 AND active=TRUE`, [job.created_by, job.tenant_id]);
  if (!userResult.rows[0]) throw Object.assign(new Error('Job creator is inactive'), { code: 'CREATOR_INACTIVE' });
  const started = new Date();
  const controller=new AbortController();let checking=false,active=true;
  const watch=setInterval(async()=>{if(checking||!active)return;checking=true;try{
    const current=await pool.query('SELECT status,attempts FROM generation_jobs WHERE id=$1 AND tenant_id=$2',[job.id,job.tenant_id]);
    if(active&&(!current.rows[0]||current.rows[0].status!=='running'||current.rows[0].attempts!==job.attempts))controller.abort(new DOMException('Job cancelled or worker claim superseded','AbortError'));
  }catch{if(active)controller.abort(new DOMException('Could not verify worker claim','AbortError'));}finally{checking=false;}},300);
  try {
    const result = await executeTool({ user: userResult.rows[0], input: job.input, timeoutMs: job.timeout_ms,
      costBudgetUsd: Number(job.cost_budget_usd), latencyBudgetMs: job.latency_budget_ms, signal:controller.signal });
    if(controller.signal.aborted)throw Object.assign(new Error('Generation job cancelled'),{code:'JOB_CANCELLED'});
    const client = await pool.connect();
    try { await client.query('BEGIN');const retained=await client.query(`UPDATE generation_jobs SET status='awaiting_approval',output=$1,provenance=$2,actual_cost_usd=$3,latency_ms=$4,
      lease_until=NULL,completed_at=NOW(),error=NULL,error_code=NULL WHERE id=$5 AND tenant_id=$6 AND status='running' AND attempts=$7`, [result.output,result.provenance,result.cost,result.latencyMs,job.id,job.tenant_id,job.attempts]);
      if(!retained.rowCount||controller.signal.aborted)throw Object.assign(new Error('Generation job cancelled'),{code:'JOB_CANCELLED'});
      await audit(client, { tenantId: job.tenant_id, actorId: job.created_by, action: 'generation.completed', targetType: 'generation_job', targetId: job.id,
        input: job.input, output: result.output, details: { costUsd: result.cost, latencyMs: result.latencyMs, groundedScore: result.groundedScore } }); if(controller.signal.aborted)throw Object.assign(new Error('Generation job cancelled'),{code:'JOB_CANCELLED'});await client.query('COMMIT'); }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    await trace(job.tenant_id, job.id, 'execute_tool', 'succeeded', { latencyMs: result.latencyMs, costUsd: result.cost }, started);
  } catch (error) { await trace(job.tenant_id, job.id, 'execute_tool', error.code==='JOB_CANCELLED'?'cancelled':'failed', { code: error.code || 'UNEXPECTED' }, started).catch(() => undefined); throw error; }
  finally{active=false;clearInterval(watch);}
}
module.exports = { executeGeneration };
