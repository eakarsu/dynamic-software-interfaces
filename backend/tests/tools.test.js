const{inputSchema,outputSchema,evaluateOutput}=require('../services/tools');
describe('typed tool contracts',()=>{
  it('rejects untyped or oversized input',()=>{expect(()=>inputSchema.parse({intent:'x',audience:'ops',constraints:[]})).toThrow();expect(()=>inputSchema.parse({intent:'valid request',audience:'ops',unknown:true})).toThrow();});
  it('accepts only registered primitives and cited evidence',()=>{const output=outputSchema.parse({title:'Triage',rationale:'Grounded',components:[{primitive:'data-table',props:{label:'Incidents'},evidence:['doc-1']}],risks:[]});expect(evaluateOutput(output,[{source_id:'doc-1'}])).toEqual({groundedScore:1,safetyPassed:true});expect(()=>outputSchema.parse({...output,components:[{primitive:'iframe',props:{},evidence:['doc-1']}]})).toThrow();});
  it('fails the deterministic safety gate',()=>{const output={title:'Unsafe',rationale:'javascript:alert(1)',components:[{primitive:'card',props:{},evidence:['doc-1']}],risks:[]};expect(evaluateOutput(output,[{source_id:'doc-1'}]).safetyPassed).toBe(false);});
});
