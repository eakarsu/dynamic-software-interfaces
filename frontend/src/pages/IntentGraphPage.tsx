import { useEffect, useState } from 'react';
import { GitBranch, Search, X, TrendingUp, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { apiFetch } from '../api';

interface IntentNode {
  id: number; slug: string; label: string; description?: string; category?: string;
  parent_id?: number | null; signal_keywords?: string; expected_components?: string;
  trigger_count: number; success_rate: number | string; median_completion_ms: number;
  out_degree?: number; in_degree?: number; child_count?: number; variant_count?: number;
}
interface IntentEdge { id: number; from_intent_id: number; to_intent_id: number; edge_type: string; transition_count: number; avg_dwell_ms: number; to_label?: string; to_slug?: string; from_label?: string; from_slug?: string; }
interface NodeDetail { node: IntentNode; outgoing: IntentEdge[]; incoming: IntentEdge[]; variants: { id: number; variant_key: string; hypothesis: string; is_control: boolean; traffic_pct: number; is_active: boolean }[]; runs: { id: number; model: string; sdk: string; componentbench_score: number; swebench_style_score: number; a11y_score: number; status: string; created_at: string }[] }

const CAT_COLORS: Record<string, string> = {
  decide: 'bg-rose-500/20 text-rose-300',
  communicate: 'bg-sky-500/20 text-sky-300',
  create: 'bg-emerald-500/20 text-emerald-300',
  monitor: 'bg-amber-500/20 text-amber-300',
  configure: 'bg-violet-500/20 text-violet-300'
};

export default function IntentGraphPage() {
  const [nodes, setNodes] = useState<IntentNode[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<NodeDetail | null>(null);
  const [categories, setCategories] = useState<{ category: string; node_count: number; total_triggers: number; avg_success_rate: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slug: '', label: '', description: '', category: 'decide', signal_keywords: '', expected_components: '' });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (category) p.set('category', category);
    setNodes(await apiFetch(`/intent-graph/nodes?${p}`));
  }
  async function loadCats() { setCategories(await apiFetch('/intent-graph/categories')); }
  useEffect(() => { load(); }, [search, category]);
  useEffect(() => { loadCats(); }, []);

  async function open(id: number) { setSelected(await apiFetch(`/intent-graph/nodes/${id}`)); }
  async function save() {
    await apiFetch('/intent-graph/nodes', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); setForm({ slug: '', label: '', description: '', category: 'decide', signal_keywords: '', expected_components: '' });
    load();
  }
  async function trigger(id: number, success: boolean) {
    await apiFetch(`/intent-graph/nodes/${id}/trigger`, { method: 'POST', body: JSON.stringify({ success, completion_ms: 5000 }) });
    open(id);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><GitBranch className="text-indigo-400" />Intent Graph</h1>
          <p className="text-xs text-gray-400 mt-1">What users are trying to accomplish — nodes (intents) and edges (transitions), not screens.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} />New Intent</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {categories.map(c => (
          <button key={c.category} onClick={() => setCategory(category === c.category ? '' : c.category)}
            className={`p-3 rounded-xl border text-left transition-colors ${category === c.category ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
            <div className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${CAT_COLORS[c.category] || 'bg-gray-700 text-gray-300'}`}>{c.category}</div>
            <div className="text-2xl font-bold text-white">{c.node_count}</div>
            <div className="text-xs text-gray-500">{Number(c.total_triggers || 0).toLocaleString()} triggers • {(Number(c.avg_success_rate) * 100).toFixed(0)}% succ</div>
          </button>
        ))}
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search intents (slug, label, keywords)..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {nodes.map(n => (
          <div key={n.id} onClick={() => open(n.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[n.category || ''] || 'bg-gray-700 text-gray-300'}`}>{n.category}</span>
                  <code className="text-xs text-indigo-300">{n.slug}</code>
                  {(n.variant_count || 0) > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{n.variant_count} variants</span>}
                  <span className="text-xs text-gray-500">in {n.in_degree} • out {n.out_degree}</span>
                </div>
                <h3 className="font-semibold text-white">{n.label}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{n.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end text-emerald-400 text-sm font-bold"><TrendingUp size={12} />{(Number(n.success_rate) * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500 mt-1">{Number(n.trigger_count).toLocaleString()} triggers</div>
                <div className="text-xs text-gray-500">{Math.round(n.median_completion_ms / 1000)}s median</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[560px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-lg font-bold text-white">{selected.node.label}</h2><code className="text-xs text-indigo-300">{selected.node.slug}</code></div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-200 mb-4">{selected.node.description}</p>
          <div className="grid grid-cols-3 gap-2 text-sm mb-4">
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Triggers</p><p className="text-white font-bold">{Number(selected.node.trigger_count).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Success rate</p><p className="text-emerald-400 font-bold">{(Number(selected.node.success_rate) * 100).toFixed(1)}%</p></div>
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Median ms</p><p className="text-white font-bold">{Number(selected.node.median_completion_ms).toLocaleString()}</p></div>
          </div>
          {selected.node.signal_keywords && (<div className="mb-3"><p className="text-xs text-gray-500 mb-1">Signal keywords (few-shot)</p><div className="flex flex-wrap gap-1">{selected.node.signal_keywords.split(',').map((k, i) => <span key={i} className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{k.trim()}</span>)}</div></div>)}
          {selected.node.expected_components && (<div className="mb-3"><p className="text-xs text-gray-500 mb-1">Expected primitives</p><pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-2 overflow-x-auto">{selected.node.expected_components}</pre></div>)}
          <div className="mb-4"><p className="text-xs text-gray-500 mb-1">Outgoing edges ({selected.outgoing.length})</p>{selected.outgoing.map(e => (<div key={e.id} className="text-xs text-gray-300 py-1 flex items-center gap-2"><ArrowRight size={12} className="text-indigo-400" /><span className="px-1.5 py-0.5 rounded bg-gray-800">{e.edge_type}</span> {e.to_label} <span className="text-gray-500">({Number(e.transition_count).toLocaleString()})</span></div>))}</div>
          <div className="mb-4"><p className="text-xs text-gray-500 mb-1">Incoming edges ({selected.incoming.length})</p>{selected.incoming.map(e => (<div key={e.id} className="text-xs text-gray-300 py-1 flex items-center gap-2"><ArrowLeft size={12} className="text-indigo-400" />{e.from_label} <span className="px-1.5 py-0.5 rounded bg-gray-800">{e.edge_type}</span> <span className="text-gray-500">({Number(e.transition_count).toLocaleString()})</span></div>))}</div>
          {selected.variants.length > 0 && (<div className="mb-4"><p className="text-xs text-gray-500 mb-1">Layout variants</p>{selected.variants.map(v => (<div key={v.id} className="text-xs flex items-center gap-2 py-1"><span className={`px-1.5 py-0.5 rounded ${v.is_control ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-300'}`}>{v.is_control ? 'control' : 'variant'}</span><span className="text-white">{v.variant_key}</span><span className="text-gray-500">{v.traffic_pct}% traffic</span></div>))}</div>)}
          {selected.runs.length > 0 && (<div className="mb-4"><p className="text-xs text-gray-500 mb-1">Recent UI generations</p>{selected.runs.slice(0, 5).map(r => (<div key={r.id} className="text-xs text-gray-300 py-1"><span className="text-indigo-300">{r.model}</span> • CB {Number(r.componentbench_score).toFixed(2)} • a11y {Number(r.a11y_score).toFixed(2)} • <span className={r.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}>{r.status}</span></div>))}</div>)}
          <div className="flex gap-2 pt-2 border-t border-gray-800">
            <button onClick={() => trigger(selected.node.id, true)} className="flex-1 bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300 py-2 rounded-lg text-sm">Record success</button>
            <button onClick={() => trigger(selected.node.id, false)} className="flex-1 bg-rose-700/40 hover:bg-rose-700/60 text-rose-300 py-2 rounded-lg text-sm">Record failure</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-white mb-4">New Intent</h2>
            <div className="space-y-3">
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="slug (e.g. triage-inbox)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Label" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">{['decide', 'communicate', 'create', 'monitor', 'configure'].map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input value={form.signal_keywords} onChange={e => setForm({ ...form, signal_keywords: e.target.value })} placeholder="signal keywords, comma separated" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.expected_components} onChange={e => setForm({ ...form, expected_components: e.target.value })} placeholder='expected primitives JSON e.g. ["shadcn-data-table"]' className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono text-xs" />
            </div>
            <div className="flex gap-3 mt-4"><button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm">Save</button><button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
