import { useEffect, useState } from 'react';
import { Palette, Search, Copy, Download, X, Plus } from 'lucide-react';
import { apiFetch } from '../api';

interface Token { id: number; token_key: string; token_value: string; category: string; tier: string; ref_token_key: string | null; source: string; description: string; dark_mode_value: string | null }
interface StatRow { category: string; tier: string; n: number; dark_override_count: number }

const TIER_COLORS: Record<string, string> = { primitive: 'bg-gray-700 text-gray-300', semantic: 'bg-indigo-500/20 text-indigo-300', component: 'bg-violet-500/20 text-violet-300' };
const SOURCE_COLORS: Record<string, string> = { tailwind: 'bg-sky-500/20 text-sky-300', radix: 'bg-violet-500/20 text-violet-300', shadcn: 'bg-amber-500/20 text-amber-300', brand: 'bg-pink-500/20 text-pink-300', custom: 'bg-gray-500/20 text-gray-300' };

export default function DesignTokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tier, setTier] = useState('');
  const [source, setSource] = useState('');
  const [exportText, setExportText] = useState<{ kind: string; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ token_key: '', token_value: '', category: 'color', tier: 'primitive', ref_token_key: '', source: 'custom', description: '', dark_mode_value: '' });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (category) p.set('category', category);
    if (tier) p.set('tier', tier);
    if (source) p.set('source', source);
    setTokens(await apiFetch(`/design-tokens?${p}`));
  }
  useEffect(() => { load(); }, [search, category, tier, source]);
  useEffect(() => { apiFetch('/design-tokens/_stats/summary').then(setStats); }, []);

  async function exportAs(kind: 'css' | 'tailwind' | 'json') {
    const url = `/api/design-tokens/export/${kind}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    const text = await res.text();
    setExportText({ kind, text });
  }
  function copyToClipboard(t: string) { navigator.clipboard.writeText(t); }
  async function save() {
    await apiFetch('/design-tokens', { method: 'POST', body: JSON.stringify({ ...form, ref_token_key: form.ref_token_key || null, dark_mode_value: form.dark_mode_value || null }) });
    setShowForm(false); setForm({ token_key: '', token_value: '', category: 'color', tier: 'primitive', ref_token_key: '', source: 'custom', description: '', dark_mode_value: '' });
    load();
  }

  function swatch(t: Token) {
    if (t.category !== 'color') return null;
    const v = t.token_value.startsWith('#') ? t.token_value : '#888';
    return <div className="w-8 h-8 rounded border border-gray-700" style={{ backgroundColor: v }} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Palette className="text-indigo-400" />Design Tokens</h1>
          <p className="text-xs text-gray-400 mt-1">Three-tier tokens (primitive → semantic → component) following Tailwind/Radix/shadcn naming, with dark-mode overrides.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportAs('css')} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Download size={14} />CSS</button>
          <button onClick={() => exportAs('tailwind')} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Download size={14} />Tailwind</button>
          <button onClick={() => exportAs('json')} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Download size={14} />JSON</button>
          <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={14} />Token</button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {Array.from(new Set(stats.map(s => s.category))).map(cat => {
          const total = stats.filter(s => s.category === cat).reduce((a, b) => a + b.n, 0);
          return (
            <button key={cat} onClick={() => setCategory(category === cat ? '' : cat)} className={`p-2 rounded-lg border text-left ${category === cat ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
              <div className="text-xs text-gray-500 capitalize">{cat}</div>
              <div className="text-lg font-bold text-white">{total}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tokens..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" /></div>
        <select value={tier} onChange={e => setTier(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"><option value="">All tiers</option>{['primitive', 'semantic', 'component'].map(t => <option key={t} value={t}>{t}</option>)}</select>
        <select value={source} onChange={e => setSource(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"><option value="">All sources</option>{['tailwind', 'radix', 'shadcn', 'brand', 'custom'].map(s => <option key={s} value={s}>{s}</option>)}</select>
      </div>

      <div className="grid gap-2">
        {tokens.map(t => (
          <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
            {swatch(t)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <code className="text-sm text-white">{t.token_key}</code>
                <span className={`text-xs px-2 py-0.5 rounded-full ${TIER_COLORS[t.tier] || 'bg-gray-700 text-gray-300'}`}>{t.tier}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_COLORS[t.source] || 'bg-gray-700 text-gray-300'}`}>{t.source}</span>
                {t.dark_mode_value && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">dark: {t.dark_mode_value}</span>}
              </div>
              <code className="text-xs text-gray-300">{t.token_value}</code>
              {t.ref_token_key && <span className="text-xs text-indigo-300 ml-2">→ {t.ref_token_key}</span>}
              {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => copyToClipboard(t.token_value)} className="text-gray-400 hover:text-white" title="Copy value"><Copy size={14} /></button>
          </div>
        ))}
      </div>

      {exportText && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white">Export ({exportText.kind})</h2><div className="flex gap-2"><button onClick={() => copyToClipboard(exportText.text)} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Copy size={12} />Copy</button><button onClick={() => setExportText(null)} className="text-gray-400 hover:text-white"><X size={20} /></button></div></div>
            <pre className="text-xs text-gray-200 bg-gray-800 rounded-lg p-3 overflow-auto whitespace-pre-wrap">{exportText.text}</pre>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white">New token</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={18} /></button></div>
            <div className="space-y-3">
              <input value={form.token_key} onChange={e => setForm({ ...form, token_key: e.target.value })} placeholder="token key (e.g. color.brand.500)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono" />
              <input value={form.token_value} onChange={e => setForm({ ...form, token_value: e.target.value })} placeholder="value (e.g. #6366f1)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono" />
              <div className="grid grid-cols-3 gap-2">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm">{['color', 'radius', 'shadow', 'spacing', 'font', 'motion', 'z'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm">{['primitive', 'semantic', 'component'].map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm">{['tailwind', 'radix', 'shadcn', 'brand', 'custom'].map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <input value={form.ref_token_key} onChange={e => setForm({ ...form, ref_token_key: e.target.value })} placeholder="ref token (for semantic/component tiers)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono" />
              <input value={form.dark_mode_value} onChange={e => setForm({ ...form, dark_mode_value: e.target.value })} placeholder="dark mode override (optional)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="description" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            </div>
            <div className="flex gap-3 mt-4"><button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm">Save</button><button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
