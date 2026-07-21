require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const pool = require('./db');
const { executeSync } = require('./services/connectors');
const { executeGeneration } = require('./services/jobs');
const { executeEvaluation } = require('./services/evaluations');

async function claim(table) {
  if (!['sync_jobs','generation_jobs','evaluation_runs'].includes(table)) throw new Error('Invalid queue');
  const client = await pool.connect();
  try { await client.query('BEGIN'); await client.query(`UPDATE ${table} SET status=CASE WHEN attempts>=max_attempts THEN 'failed' ELSE 'pending' END,
    error=CASE WHEN attempts>=max_attempts THEN 'Worker lease expired after maximum attempts' ELSE error END,lease_until=NULL WHERE status='running' AND lease_until<NOW()`);
    const result = await client.query(`SELECT * FROM ${table} WHERE status='pending' AND next_attempt_at<=NOW()
    ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`); if (!result.rows[0]) { await client.query('COMMIT'); return null; }
    await client.query(`UPDATE ${table} SET status='running',attempts=attempts+1,lease_until=NOW()+INTERVAL '90 seconds' WHERE id=$1`, [result.rows[0].id]);
    await client.query('COMMIT'); return { ...result.rows[0], attempts: result.rows[0].attempts + 1 };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function fail(table, job, error) {
  const retry = job.attempts < job.max_attempts; const delay = Math.min(60, 2 ** job.attempts);
  const values = [retry ? 'pending' : 'failed', delay, String(error.message || error).slice(0,4000), job.id];
  if (table === 'generation_jobs') values.push(error.code || 'UNEXPECTED');
  await pool.query(`UPDATE ${table} SET status=$1::varchar,lease_until=NULL,next_attempt_at=NOW()+($2::text||' seconds')::interval,error=$3${table === 'generation_jobs' ? ',error_code=$5' : ''},completed_at=CASE WHEN $1::text='failed' THEN NOW() ELSE NULL END WHERE id=$4`, values);
  if (table === 'sync_jobs') await pool.query(`UPDATE connectors SET status='error',last_error=$1,updated_at=NOW() WHERE id=$2`, [String(error.message || error).slice(0,4000), job.connector_id]);
}
async function runOnce() {
  const sync = await claim('sync_jobs');
  if (sync) { try { const stats = await executeSync(sync); await pool.query(`UPDATE sync_jobs SET status='succeeded',stats=$1,lease_until=NULL,completed_at=NOW() WHERE id=$2`, [stats,sync.id]); } catch (error) { await fail('sync_jobs',sync,error); } return true; }
  const generation = await claim('generation_jobs');
  if (generation) { try { await executeGeneration(generation); } catch (error) { await fail('generation_jobs',generation,error); } return true; }
  const evaluation = await claim('evaluation_runs');
  if (evaluation) { try { await executeEvaluation(evaluation); } catch (error) { await fail('evaluation_runs',evaluation,error); } return true; }
  return false;
}
async function main() {
  let running = true;
  while (running) { const worked = await runOnce(); if (process.env.WORKER_ONCE === 'true') running = false; else if (!worked) await new Promise((resolve) => setTimeout(resolve,1000)); }
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode=1; }).finally(() => process.env.WORKER_ONCE === 'true' && pool.end());
module.exports = { runOnce, claim, fail };
