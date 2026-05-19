import { useEffect, useState } from 'react';
import { Beaker, X, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { apiFetch } from '../api';

interface Variant {
  id: number; intent_id: number; variant_key: string; hypothesis: string;
  primitives_json: any; layout_json: any; copy_tone: string; density: string;
  is_control: boolean; is_active: boolean; traffic_pct: number;
  intent_label: string; intent_slug: string;
  impressions: number; task_completions: number; conversions: number; bounce_count: number;
  avg_completion_ms: number; avg_ttfa_ms: number;
  conversion_rate?: number; conversion_lift_pct?: number | null;
}
interface DayPoint { recorded_for: string; impressions: number; task_completions: number; conversions: number; bounce_count: number; avg_completion_ms: number; avg_ttfa_ms: number }
interface Detail { variant: Variant; series: DayPoint[] }

export default function LayoutVariantsPage() {
  const [items, setItems] = useState<Variant[]>([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [pickResult, setPickResult] = useState<string>('');

  async function load() {
    const p = new URLSearchParams();
    if (activeOnly) p.set('active', 'true');
    setItems(await apiFetch(`/layout-variants?${p}`));
  }
  useEffect(() => { load(); }, [activeOnly]);

  async function pick(intent_id: number) {
    const r = await apiFetch('/layout-variants/pick', { method: 'POST', body: JSON.stringify({ intent_id }) });
    setPickResult(`${r.picked.variant_key} (intent #${intent_id}, ${r.considered} active)`);
    setTimeout(() => setPickResult(''), 4000);
  }
  async function logTelemetry(id: number, kind: 'impression' | 'conversion') {
    const body = kind === 'impression'
      ? { impressions: 100, avg_time_to_first_action_ms: 1500, avg_task_completion_ms: 6500 }
      : { conversions: 12, task_completions: 14 };
    await apiFetch(`/layout-variants/${id}/telemetry`, { method: 'POST', body: JSON.stringify(body) });
    load();
  }

  // group by intent
  const grouped: Record<string, Variant[]> = {};
  items.forEach(v => {
    const k = `${v.intent_id}|${v.intent_label}`;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(v);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Beaker className="text-indigo-400" />Layout Variants & A/B</h1>
          <p className="text-xs text-gray-400 mt-1">Per-intent generative-UI variants (Vercel AI SDK pattern) with conversion-lift telemetry and time-to-first-action.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />Active only</label>
      </div>
      {pickResult && <div className="mb-3 text-sm bg-emerald-500/20 text-emerald-300 rounded-lg p-2">Picked variant: {pickResult}</div>}

      <div className="space-y-6">
        {Object.entries(grouped).map(([k, vs]) => {
          const [intent_id, intent_label] = k.split('|');
          return (
            <div key={k}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white">{intent_label}</h2>
                <button onClick={() => pick(parseInt(intent_id, 10))} className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 px-2 py-1 rounded">Simulate runtime pick</button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {vs.map(v => (
                  <div key={v.id} onClick={() => apiFetch(`/layout-variants/${v.id}`).then(setSelected)}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${v.is_control ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{v.is_control ? 'control' : 'variant'}</span>
                        <code className="text-xs text-white">{v.variant_key}</code>
                        <span className="text-xs text-gray-500">{v.density} • {v.copy_tone}</span>
                      </div>
                      <span className="text-xs text-gray-400">{v.traffic_pct}%</span>
                    </div>
                    <p className="text-xs text-gray-300 mb-3 line-clamp-2">{v.hypothesis}</p>
                    <div className="grid grid-cols-4 gap-1 text-center mb-2">
                      <div><p className="text-[10px] text-gray-500">imps</p><p className="text-xs text-white">{Number(v.impressions || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-gray-500">conv</p><p className="text-xs text-white">{Number(v.conversions || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-gray-500">CVR</p><p className="text-xs text-emerald-400">{v.conversion_rate ? (v.conversion_rate * 100).toFixed(1) + '%' : '—'}</p></div>
                      <div><p className="text-[10px] text-gray-500">TTFA</p><p className="text-xs text-white">{Math.round((v.avg_ttfa_ms || 0))}ms</p></div>
                    </div>
                    {v.conversion_lift_pct !== null && v.conversion_lift_pct !== undefined && !v.is_control && (
                      <div className={`text-xs flex items-center gap-1 ${(v.conversion_lift_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(v.conversion_lift_pct || 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {(v.conversion_lift_pct || 0) >= 0 ? '+' : ''}{Number(v.conversion_lift_pct).toFixed(2)}% lift vs control
                      </div>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button onClick={e => { e.stopPropagation(); logTelemetry(v.id, 'impression'); }} className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 rounded">+ imps</button>
                      <button onClick={e => { e.stopPropagation(); logTelemetry(v.id, 'conversion'); }} className="flex-1 text-xs bg-emerald-800/40 hover:bg-emerald-800/60 text-emerald-300 py-1 rounded">+ conv</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[560px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{selected.variant.variant_key}</h2>
              <p className="text-xs text-gray-400">intent: {selected.variant.intent_label}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-200 mb-3">{selected.variant.hypothesis}</p>
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Density</p><p className="text-white">{selected.variant.density}</p></div>
            <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Copy tone</p><p className="text-white">{selected.variant.copy_tone}</p></div>
          </div>
          <div className="mb-3"><p className="text-xs text-gray-500 mb-1">Primitives</p><pre className="text-xs text-indigo-200 bg-gray-800 rounded-lg p-2 overflow-x-auto">{JSON.stringify(selected.variant.primitives_json, null, 2)}</pre></div>
          <div className="mb-3"><p className="text-xs text-gray-500 mb-1">Layout</p><pre className="text-xs text-gray-200 bg-gray-800 rounded-lg p-2 overflow-x-auto">{JSON.stringify(selected.variant.layout_json, null, 2)}</pre></div>
          <div className="mb-3"><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Activity size={12} />Daily telemetry</p>
            <table className="w-full text-xs"><thead><tr className="text-gray-500"><th className="text-left p-1">date</th><th className="text-right p-1">imps</th><th className="text-right p-1">conv</th><th className="text-right p-1">TTFA</th></tr></thead><tbody>{selected.series.map((d, i) => (<tr key={i} className="border-t border-gray-800"><td className="p-1 text-gray-300">{String(d.recorded_for).slice(0, 10)}</td><td className="p-1 text-right text-white">{Number(d.impressions).toLocaleString()}</td><td className="p-1 text-right text-emerald-400">{Number(d.conversions).toLocaleString()}</td><td className="p-1 text-right text-gray-300">{d.avg_ttfa_ms}ms</td></tr>))}</tbody></table></div>
        </div>
      )}
    </div>
  );
}
