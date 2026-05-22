import { useState } from 'react';
import { apiFetch } from '../api';

const starter = JSON.stringify({ rules: [
  { id: 'compact_sales', component: 'lead-table', property: 'density', value: 'compact', priority: 7, persona: 'sales' },
  { id: 'accessible_ops', component: 'lead-table', property: 'density', value: 'comfortable', priority: 9, persona: 'ops' }
] }, null, 2);

export default function AdaptationConflictPage() {
  const [payload, setPayload] = useState(starter);
  const [result, setResult] = useState<any>(null);
  const run = async () => setResult(await apiFetch('/adaptation-conflict/resolve', { method: 'POST', body: JSON.stringify(JSON.parse(payload)) }));
  return (
    <div className="p-8 text-white space-y-5">
      <div><h1 className="text-2xl font-bold">Adaptation Conflict Resolver</h1><p className="text-gray-400">Detect clashing persona and accessibility adaptation rules before UI specs compile.</p></div>
      <textarea className="w-full h-72 rounded-lg bg-gray-900 border border-gray-800 p-3 font-mono text-sm" value={payload} onChange={(event) => setPayload(event.target.value)} />
      <button className="px-4 py-2 rounded-lg bg-indigo-600" onClick={run}>Resolve Conflicts</button>
      {result && <section className="rounded-lg bg-gray-900 border border-gray-800 p-5"><h2 className="text-xl">{result.status} · {result.conflictCount}</h2>{result.conflicts.map((item: any) => <div className="mt-3" key={item.key}><strong>{item.key}</strong><p className="text-gray-400">{item.action} Winner: {item.winner}</p></div>)}</section>}
    </div>
  );
}
