import { useEffect, useState } from 'react';
import { Sparkles, X, Trophy, Zap, Shield } from 'lucide-react';
import { apiFetch } from '../api';

interface Run {
  id: number; intent_id: number; model: string; sdk: string; prompt: string;
  tokens_in: number; tokens_out: number; latency_ms: number; cost_usd: number;
  humaneval_pass: boolean; componentbench_score: number; swebench_style_score: number; a11y_score: number;
  status: string; created_at: string;
  intent_label: string; intent_slug: string; ui_user_name: string;
}
interface ModelStat { model: string; sdk: string; runs: number; avg_componentbench: string; avg_swebench_style: string; avg_a11y: string; avg_latency_ms: string; avg_cost_usd: string; humaneval_pass_pct: string }
interface RunDetail extends Run { generated_jsx: string; primitives_used: any }

export default function UIGenerationRunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [model, setModel] = useState('');
  const [sdk, setSdk] = useState('');
  const [status, setStatus] = useState('');
  const [minScore, setMinScore] = useState('');
  const [selected, setSelected] = useState<RunDetail | null>(null);

  async function load() {
    const p = new URLSearchParams();
    if (model) p.set('model', model);
    if (sdk) p.set('sdk', sdk);
    if (status) p.set('status', status);
    if (minScore) p.set('min_score', minScore);
    setRuns(await apiFetch(`/ui-generation-runs?${p}`));
  }
  useEffect(() => { load(); }, [model, sdk, status, minScore]);
  useEffect(() => { apiFetch('/ui-generation-runs/_leaderboard/models').then(setModelStats); }, []);

  const models = Array.from(new Set(modelStats.map(s => s.model)));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="text-violet-400" />UI Generation Runs</h1>
        <p className="text-xs text-gray-400 mt-1">History of generative-UI runs scored on HumanEval (compiles), ComponentBench (primitive correctness), SWE-bench-style (integrated task), and axe-core a11y.</p>
      </div>

      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Trophy size={14} className="text-amber-400" />Model leaderboard</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-900 text-gray-400">
              <tr><th className="text-left p-2">model</th><th className="text-left p-2">sdk</th><th className="text-right p-2">runs</th><th className="text-right p-2">CB</th><th className="text-right p-2">SWE</th><th className="text-right p-2">a11y</th><th className="text-right p-2">HE pass</th><th className="text-right p-2">latency</th><th className="text-right p-2">$/run</th></tr>
            </thead>
            <tbody>
              {modelStats.map((m, i) => (
                <tr key={i} className="border-t border-gray-800 bg-gray-950/50">
                  <td className="p-2"><code className="text-indigo-300">{m.model}</code></td>
                  <td className="p-2 text-gray-300">{m.sdk}</td>
                  <td className="p-2 text-right text-white">{m.runs}</td>
                  <td className="p-2 text-right text-emerald-400 font-bold">{Number(m.avg_componentbench || 0).toFixed(3)}</td>
                  <td className="p-2 text-right text-gray-300">{Number(m.avg_swebench_style || 0).toFixed(3)}</td>
                  <td className="p-2 text-right text-violet-300">{Number(m.avg_a11y || 0).toFixed(3)}</td>
                  <td className="p-2 text-right text-white">{m.humaneval_pass_pct}%</td>
                  <td className="p-2 text-right text-gray-300">{m.avg_latency_ms}ms</td>
                  <td className="p-2 text-right text-amber-300">${Number(m.avg_cost_usd || 0).toFixed(5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={model} onChange={e => setModel(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"><option value="">All models</option>{models.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={sdk} onChange={e => setSdk(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">{['', 'vercel-ai-sdk', 'anthropic-sdk', 'openrouter'].map(s => <option key={s} value={s}>{s || 'All SDKs'}</option>)}</select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">{['', 'success', 'error', 'flagged'].map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}</select>
        <input value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="Min CB score (0..1)" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-40" />
      </div>

      <div className="grid gap-3">
        {runs.map(r => (
          <div key={r.id} onClick={() => apiFetch(`/ui-generation-runs/${r.id}`).then(setSelected)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : r.status === 'flagged' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>{r.status}</span>
                  <code className="text-xs text-indigo-300">{r.model}</code>
                  <span className="text-xs text-gray-500">{r.sdk}</span>
                  <span className="text-xs text-gray-500">• intent: {r.intent_label}</span>
                </div>
                <p className="text-sm text-gray-200 mt-1 line-clamp-1">{r.prompt}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()} • {r.tokens_in}+{r.tokens_out} toks</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end text-emerald-400 font-bold text-sm"><Zap size={12} />CB {Number(r.componentbench_score).toFixed(2)}</div>
                <div className="text-xs text-violet-300 mt-0.5 flex items-center gap-1 justify-end"><Shield size={10} />a11y {Number(r.a11y_score).toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.latency_ms}ms • ${Number(r.cost_usd).toFixed(4)}</div>
                <div className={`text-xs mt-0.5 ${r.humaneval_pass ? 'text-emerald-400' : 'text-rose-400'}`}>HE: {r.humaneval_pass ? 'pass' : 'fail'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Run #{selected.id}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${selected.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{selected.status}</span>
              <code className="text-xs text-indigo-300">{selected.model}</code>
              <span className="text-xs text-gray-500">{selected.sdk}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-500">HumanEval</p><p className={selected.humaneval_pass ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{selected.humaneval_pass ? 'pass' : 'fail'}</p></div>
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-500">ComponentBench</p><p className="text-emerald-400 font-bold">{Number(selected.componentbench_score).toFixed(3)}</p></div>
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-500">SWE-style</p><p className="text-white font-bold">{Number(selected.swebench_style_score).toFixed(3)}</p></div>
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-500">axe a11y</p><p className="text-violet-300 font-bold">{Number(selected.a11y_score).toFixed(3)}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Tokens in/out</p><p className="text-white">{selected.tokens_in} / {selected.tokens_out}</p></div>
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Latency</p><p className="text-white">{selected.latency_ms} ms</p></div>
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-xs text-gray-500">Cost</p><p className="text-amber-300">${Number(selected.cost_usd).toFixed(5)}</p></div>
            </div>
            <div><p className="text-xs text-gray-500 mb-1">Prompt</p><pre className="text-xs text-gray-200 bg-gray-800 rounded-lg p-3 whitespace-pre-wrap">{selected.prompt}</pre></div>
            <div><p className="text-xs text-gray-500 mb-1">Generated JSX</p><pre className="text-xs text-emerald-200 bg-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{selected.generated_jsx}</pre></div>
            {selected.primitives_used && (<div><p className="text-xs text-gray-500 mb-1">Primitives used</p><pre className="text-xs text-indigo-200 bg-gray-800 rounded-lg p-3 overflow-x-auto">{JSON.stringify(selected.primitives_used, null, 2)}</pre></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
