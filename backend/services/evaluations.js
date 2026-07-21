const crypto = require('node:crypto');
const pool = require('../db');
const { executeTool } = require('./tools');
const { audit } = require('../lib/security');

async function executeEvaluation(run) {
  const userResult=await pool.query(`SELECT id,tenant_id,role,permission_groups FROM users WHERE id=$1 AND tenant_id=$2 AND active=TRUE`,[run.created_by,run.tenant_id]);
  if(!userResult.rows[0])throw new Error('Evaluation creator inactive');
  const cases=(await pool.query(`SELECT * FROM evaluation_cases WHERE tenant_id=$1 AND active=TRUE ORDER BY name`,[run.tenant_id])).rows;
  if(!cases.length)throw new Error('No active evaluation cases');
  const gates=run.gates;const results=[];
  for(const testCase of cases){
    try{const result=await executeTool({user:userResult.rows[0],input:testCase.input,timeoutMs:gates.caseTimeoutMs,costBudgetUsd:gates.caseCostBudgetUsd,latencyBudgetMs:gates.maxCaseLatencyMs});
      const used=new Set(result.output.components.map((component)=>component.primitive));const primitivePassed=testCase.expected_primitives.every((primitive)=>used.has(primitive));
      results.push({caseId:testCase.id,passed:primitivePassed&&result.groundedScore>=Number(testCase.min_grounded_score)&&result.safetyPassed,groundedScore:result.groundedScore,safetyPassed:result.safetyPassed,latencyMs:result.latencyMs,costUsd:result.cost,output:result.output});
    }catch(error){results.push({caseId:testCase.id,passed:false,groundedScore:0,safetyPassed:false,latencyMs:0,costUsd:0,error:String(error.message||error)});}
  }
  const passRate=results.filter((row)=>row.passed).length/results.length;const grounded=results.reduce((sum,row)=>sum+row.groundedScore,0)/results.length;
  const safety=results.filter((row)=>row.safetyPassed).length/results.length;const latency=Math.round(results.reduce((sum,row)=>sum+row.latencyMs,0)/results.length);const cost=results.reduce((sum,row)=>sum+row.costUsd,0);
  const passed=passRate>=gates.minPassRate&&grounded>=gates.minGroundedScore&&safety>=gates.minSafetyPassRate&&latency<=gates.maxAverageLatencyMs&&cost<=gates.maxTotalCostUsd;
  const client=await pool.connect();
  try{await client.query('BEGIN');for(const row of results)await client.query(`INSERT INTO evaluation_results(id,tenant_id,run_id,case_id,passed,grounded_score,safety_passed,latency_ms,cost_usd,output,error)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[crypto.randomUUID(),run.tenant_id,run.id,row.caseId,row.passed,row.groundedScore,row.safetyPassed,row.latencyMs,row.costUsd,row.output||null,row.error||null]);
    await client.query(`UPDATE evaluation_runs SET status=$1,pass_rate=$2,grounded_score=$3,safety_pass_rate=$4,avg_latency_ms=$5,total_cost_usd=$6,lease_until=NULL,completed_at=NOW() WHERE id=$7`,[passed?'passed':'failed',passRate,grounded,safety,latency,cost,run.id]);
    await audit(client,{tenantId:run.tenant_id,actorId:run.created_by,action:'evaluation.completed',targetType:'evaluation_run',targetId:run.id,output:{passRate,grounded,safety,latency,cost,passed}});await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
module.exports={executeEvaluation};
