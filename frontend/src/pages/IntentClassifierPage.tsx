import { useEffect, useState } from 'react';
import { Brain, Play, X, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { apiFetch } from '../api';

interface Example { id: number; intent_id: number; utterance: string; context_json: any; expected_output: any; split: string; confidence_observed: number | null; is_correct: boolean | null; intent_slug?: string; intent_label?: string }
interface Stat { id: number; slug: string; label: string; train_count: number; dev_count: number; test_count: number; total: number }
interface IntentLite { id: number; slug: string; label: string }
interface Classification { utterance: string; top: { intent_id: number | null; intent_slug: string; intent_label?: string; confidence: number; expected_components?: string; hits?: number }[]; method: string; candidates_total: number }
interface EvalResult { split: string; n: number; correct: number; accuracy: number; results: { example_id: number; gold: string; predicted: string; ok: boolean }[] }

export default function IntentClassifierPage() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [intents, setIntents] = useState<IntentLite[]>([]);
  const [intentFilter, setIntentFilter] = useState('');
  const [splitFilter, setSplitFilter] = useState('');
  const [classify, setClassify] = useState('');
  const [classifyResult, setClassifyResult] = useState<Classification | null>(null);
  const [evalSplit, setEvalSplit] = useState<'dev' | 'test'>('dev');
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ intent_id: '', utterance: '', context_json: '{}', expected_output: '{}', split: 'train' });

  async function load() {
    const p = new URLSearchParams();
    if (intentFilter) p.set('intent_id', intentFilter);
    if (splitFilter) p.set('split', splitFilter);
    setExamples(await apiFetch(`/intent-classifier/examples?${p}`));
  }
  useEffect(() => { load(); }, [intentFilter, splitFilter]);
  useEffect(() => {
    apiFetch('/intent-classifier/_stats').then(setStats);
    apiFetch('/intent-graph/nodes').then(rows => setIntents(rows.map((r: any) => ({ id: r.id, slug: r.slug, label: r.label }))));
  }, []);

  async function runClassify() {
    if (!classify.trim()) return;
    const r = await apiFetch('/intent-classifier/classify', { method: 'POST', body: JSON.stringify({ utterance: classify, top_k: 3 }) });
    setClassifyResult(r);
  }
  async function runEval() {
    const r = await apiFetch('/intent-classifier/evaluate', { method: 'POST', body: JSON.stringify({ split: evalSplit }) });
    setEvalResult(r);
  }
  async function saveExample() {
    let ctx: any = null, out: any = null;
    try { ctx = form.context_json ? JSON.parse(form.context_json) : null; } catch { /* keep null */ }
    try { out = form.expected_output ? JSON.parse(form.expected_output) : null; } catch { /* keep null */ }
    await apiFetch('/intent-classifier/examples', { method: 'POST', body: JSON.stringify({ intent_id: parseInt(form.intent_id, 10), utterance: form.utterance, context_json: ctx, expected_output: out, split: form.split }) });
    setShowForm(false); setForm({ intent_id: '', utterance: '', context_json: '{}', expected_output: '{}', split: 'train' });
    load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Brain className="text-indigo-400" />Intent Classifier</h1>
          <p className="text-xs text-gray-400 mt-1">Few-shot, structured-output classifier: utterance + context → {`{intent, params, confidence}`}.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} />New example</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Play size={14} className="text-emerald-400" />Try classifier</h3>
          <textarea value={classify} onChange={e => setClassify(e.target.value)} placeholder='e.g. "show me what needs my attention"' rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none mb-2" />
          <button onClick={runClassify} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm">Classify</button>
          {classifyResult && (<div className="mt-3 space-y-2">{classifyResult.top.map((t, i) => (<div key={i} className="bg-gray-800 rounded-lg p-2"><div className="flex items-center justify-between"><span className="text-sm text-white">{t.intent_label || t.intent_slug}</span><span className={`text-xs ${t.confidence > 0.7 ? 'text-emerald-400' : t.confidence > 0.3 ? 'text-amber-400' : 'text-rose-400'}`}>conf {Number(t.confidence).toFixed(2)} • hits {t.hits || 0}</span></div>{t.expected_components && <pre className="text-[10px] text-indigo-200 mt-1 overflow-x-auto">{t.expected_components}</pre>}</div>))}<p className="text-xs text-gray-500">method: {classifyResult.method} • {classifyResult.candidates_total} candidates</p></div>)}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Evaluate on labeled split</h3>
          <div className="flex gap-2 mb-3">
            <select value={evalSplit} onChange={e => setEvalSplit(e.target.value as 'dev' | 'test')} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"><option value="dev">dev</option><option value="test">test</option></select>
            <button onClick={runEval} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm">Run eval</button>
          </div>
          {evalResult && (<div><div className="text-sm text-white mb-2">Accuracy: <span className="text-emerald-400 font-bold">{(evalResult.accuracy * 100).toFixed(1)}%</span> <span className="text-gray-500">({evalResult.correct}/{evalResult.n})</span></div><div className="max-h-48 overflow-y-auto text-xs space-y-1">{evalResult.results.map(r => (<div key={r.example_id} className="flex items-center justify-between bg-gray-800 rounded p-1">{r.ok ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> : <XCircle size={12} className="text-rose-400 shrink-0" />}<code className="text-gray-300">{r.gold}</code><span className="text-gray-500">→</span><code className={r.ok ? 'text-emerald-300' : 'text-rose-300'}>{r.predicted}</code></div>))}</div></div>)}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white mb-2">Examples per intent</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs"><thead className="bg-gray-900 text-gray-400"><tr><th className="text-left p-2">intent</th><th className="text-right p-2">train</th><th className="text-right p-2">dev</th><th className="text-right p-2">test</th><th className="text-right p-2">total</th></tr></thead><tbody>{stats.map(s => (<tr key={s.id} className="border-t border-gray-800 cursor-pointer hover:bg-gray-900" onClick={() => setIntentFilter(String(s.id))}><td className="p-2"><span className="text-white">{s.label}</span> <code className="text-indigo-300 ml-1">{s.slug}</code></td><td className="p-2 text-right text-white">{s.train_count}</td><td className="p-2 text-right text-amber-300">{s.dev_count}</td><td className="p-2 text-right text-violet-300">{s.test_count}</td><td className="p-2 text-right text-white font-bold">{s.total}</td></tr>))}</tbody></table>
        </div>
      </div>

      <div className="flex gap-3 mb-3">
        <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"><option value="">All intents</option>{intents.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}</select>
        <select value={splitFilter} onChange={e => setSplitFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"><option value="">All splits</option><option value="train">train</option><option value="dev">dev</option><option value="test">test</option></select>
      </div>
      <div className="grid gap-2">{examples.map(e => (<div key={e.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3"><div className="flex items-center gap-2 mb-1 flex-wrap"><span className={`text-xs px-2 py-0.5 rounded-full ${e.split === 'train' ? 'bg-gray-700 text-gray-300' : e.split === 'dev' ? 'bg-amber-500/20 text-amber-300' : 'bg-violet-500/20 text-violet-300'}`}>{e.split}</span><code className="text-xs text-indigo-300">{e.intent_slug}</code>{e.is_correct === true && <CheckCircle2 size={12} className="text-emerald-400" />}{e.is_correct === false && <XCircle size={12} className="text-rose-400" />}{e.confidence_observed !== null && <span className="text-xs text-gray-500">conf {Number(e.confidence_observed).toFixed(2)}</span>}</div><p className="text-sm text-white">"{e.utterance}"</p>{e.expected_output && <pre className="text-[10px] text-gray-400 mt-1 overflow-x-auto">{JSON.stringify(e.expected_output)}</pre>}</div>))}</div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white">New example</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={18} /></button></div>
            <div className="space-y-3">
              <select value={form.intent_id} onChange={e => setForm({ ...form, intent_id: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"><option value="">Pick intent...</option>{intents.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}</select>
              <textarea value={form.utterance} onChange={e => setForm({ ...form, utterance: e.target.value })} placeholder="Utterance" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <textarea value={form.context_json} onChange={e => setForm({ ...form, context_json: e.target.value })} placeholder='context JSON {"role":"manager"}' rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs" />
              <textarea value={form.expected_output} onChange={e => setForm({ ...form, expected_output: e.target.value })} placeholder='expected_output JSON {"intent":"...","confidence":0.9}' rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs" />
              <select value={form.split} onChange={e => setForm({ ...form, split: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">{['train', 'dev', 'test'].map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="flex gap-3 mt-4"><button onClick={saveExample} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm">Save</button><button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
