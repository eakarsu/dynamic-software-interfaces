import { useEffect, useState } from 'react';
import { Boxes, Search, X, Package, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';

interface Primitive {
  id: number; slug: string; display_name: string; library: string; category: string;
  description: string; default_props: any; docs_url: string;
  supports_rsc: boolean; a11y_role: string; bundle_kb: number; usage_count: number;
}
interface Detail { primitive: Primitive & { prop_schema: any; example_jsx: string }; used_by_intents: { id: number; slug: string; label: string; category: string }[]; recent_runs: { id: number; model: string; sdk: string; componentbench_score: number; a11y_score: number; status: string; created_at: string }[] }
interface LibStat { library: string; component_count: number; avg_bundle_kb: string; total_bundle_kb: string; total_usage: number; rsc_supported: number }

const LIB_COLORS: Record<string, string> = {
  shadcn: 'bg-violet-500/20 text-violet-300', radix: 'bg-indigo-500/20 text-indigo-300',
  'ag-grid': 'bg-rose-500/20 text-rose-300', recharts: 'bg-emerald-500/20 text-emerald-300',
  tremor: 'bg-amber-500/20 text-amber-300', tiptap: 'bg-cyan-500/20 text-cyan-300',
  custom: 'bg-gray-500/20 text-gray-300'
};

export default function ComponentRegistryPage() {
  const [items, setItems] = useState<Primitive[]>([]);
  const [stats, setStats] = useState<LibStat[]>([]);
  const [search, setSearch] = useState('');
  const [library, setLibrary] = useState('');
  const [category, setCategory] = useState('');
  const [rsc, setRsc] = useState('');
  const [selected, setSelected] = useState<Detail | null>(null);

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (library) p.set('library', library);
    if (category) p.set('category', category);
    if (rsc) p.set('rsc', rsc);
    setItems(await apiFetch(`/component-registry?${p}`));
  }
  useEffect(() => { load(); }, [search, library, category, rsc]);
  useEffect(() => { apiFetch('/component-registry/_stats/by-library').then(setStats); }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Boxes className="text-indigo-400" />Component Registry</h1>
        <p className="text-xs text-gray-400 mt-1">Real primitives the LLM picks from at runtime: shadcn, Radix, AG Grid, Recharts, Tremor, Tiptap, Monaco.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stats.map(s => (
          <button key={s.library} onClick={() => setLibrary(library === s.library ? '' : s.library)}
            className={`p-3 rounded-xl border text-left transition-colors ${library === s.library ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
            <div className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${LIB_COLORS[s.library] || 'bg-gray-700 text-gray-300'}`}>{s.library}</div>
            <div className="text-2xl font-bold text-white">{s.component_count}</div>
            <div className="text-xs text-gray-500">{Number(s.total_usage || 0).toLocaleString()} uses • avg {Number(s.avg_bundle_kb).toFixed(1)} kB • {s.rsc_supported} RSC</div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by slug, name, description..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All categories</option>
          {['input', 'display', 'navigation', 'overlay', 'chart', 'grid', 'feedback'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={rsc} onChange={e => setRsc(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">RSC: any</option>
          <option value="true">RSC supported</option>
          <option value="false">Client-only</option>
        </select>
      </div>
      <div className="grid gap-3">
        {items.map(p => (
          <div key={p.id} onClick={() => apiFetch(`/component-registry/${p.id}`).then(setSelected)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Package size={14} className="text-pink-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${LIB_COLORS[p.library] || 'bg-gray-700 text-gray-300'}`}>{p.library}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{p.category}</span>
                  {p.supports_rsc && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">RSC</span>}
                  <code className="text-xs text-indigo-300">{p.slug}</code>
                </div>
                <h3 className="font-semibold text-white">{p.display_name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-emerald-400">{Number(p.usage_count).toLocaleString()} uses</div>
                <div className="text-xs text-gray-500">{Number(p.bundle_kb).toFixed(1)} kB gzipped</div>
                <div className="text-xs text-gray-500">role: {p.a11y_role || '—'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{selected.primitive.display_name}</h2>
              <code className="text-xs text-indigo-300">{selected.primitive.slug}</code>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-200 mb-3">{selected.primitive.description}</p>
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Bundle (gzip)</p><p className="text-white font-bold">{Number(selected.primitive.bundle_kb).toFixed(1)} kB</p></div>
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">A11y role</p><p className="text-white">{selected.primitive.a11y_role || '—'}</p></div>
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">RSC</p><p className={selected.primitive.supports_rsc ? 'text-emerald-400' : 'text-amber-400'}>{selected.primitive.supports_rsc ? 'supported' : 'client-only'}</p></div>
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Usage</p><p className="text-white font-bold">{Number(selected.primitive.usage_count).toLocaleString()}</p></div>
          </div>
          {selected.primitive.docs_url && <a href={selected.primitive.docs_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-300 hover:underline inline-flex items-center gap-1 mb-3"><ExternalLink size={12} />Docs</a>}
          {selected.primitive.example_jsx && (<div className="mb-3"><p className="text-xs text-gray-500 mb-1">Example JSX</p><pre className="text-xs text-gray-200 bg-gray-800 rounded-lg p-3 overflow-x-auto">{selected.primitive.example_jsx}</pre></div>)}
          {selected.primitive.prop_schema && (<div className="mb-3"><p className="text-xs text-gray-500 mb-1">Prop schema</p><pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-2 overflow-x-auto">{JSON.stringify(selected.primitive.prop_schema, null, 2)}</pre></div>)}
          {selected.used_by_intents.length > 0 && (<div className="mb-3"><p className="text-xs text-gray-500 mb-1">Used by intents</p><div className="flex flex-wrap gap-1">{selected.used_by_intents.map(i => <span key={i.id} className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">{i.label}</span>)}</div></div>)}
          {selected.recent_runs.length > 0 && (<div className="mb-3"><p className="text-xs text-gray-500 mb-1">Recent generations</p>{selected.recent_runs.slice(0, 5).map(r => (<div key={r.id} className="text-xs text-gray-300 py-1"><span className="text-indigo-300">{r.model}</span> • CB {Number(r.componentbench_score).toFixed(2)} • a11y {Number(r.a11y_score).toFixed(2)} • <span className={r.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}>{r.status}</span></div>))}</div>)}
        </div>
      )}
    </div>
  );
}
