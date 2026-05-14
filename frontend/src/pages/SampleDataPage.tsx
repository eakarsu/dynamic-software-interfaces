import { useState } from 'react';
import { Database, Loader2, Check, AlertTriangle, Users, LayoutTemplate, PuzzleIcon, Clock, Settings, MessageSquare } from 'lucide-react';

const ENTITIES: { key: string; label: string; description: string; icon: any; color: string }[] = [
  { key: 'ui_users', label: 'Interface Users', description: 'Personas, themes, density, satisfaction.', icon: Users, color: 'indigo' },
  { key: 'templates', label: 'Component Specs (Templates)', description: 'Layout templates with widgets and tokens.', icon: LayoutTemplate, color: 'violet' },
  { key: 'widgets', label: 'Widgets', description: 'Reusable UI building blocks with config schemas.', icon: PuzzleIcon, color: 'cyan' },
  { key: 'ui_sessions', label: 'UI Sessions', description: 'Session telemetry — needs Interface Users first.', icon: Clock, color: 'emerald' },
  { key: 'customizations', label: 'Customizations', description: 'Saved user UI configs — needs Interface Users.', icon: Settings, color: 'amber' },
  { key: 'feedback', label: 'Feedback / Copy Snippets', description: 'Ratings, categories, copy snippets — needs Users + Templates.', icon: MessageSquare, color: 'pink' },
];

interface Toast { kind: 'ok' | 'err'; text: string }

export default function SampleDataPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [counters, setCounters] = useState<Record<string, number>>({});

  async function seed(entity: string) {
    setBusy(entity);
    setToast(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/admin/sample-data/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCounters(c => ({ ...c, [entity]: (c[entity] || 0) + (data.inserted || 0) }));
      setToast({ kind: 'ok', text: `Inserted ${data.inserted} ${entity} rows.` });
    } catch (e: any) {
      setToast({ kind: 'err', text: e.message || 'Failed' });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Database size={28} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Sample Data</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Insert 5-10 domain-realistic rows per entity to populate DynamicUI Studio with example
        component specs, design tokens, layouts, A/B variants, and copy snippets.
      </p>

      {toast && (
        <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg p-3 border ${
          toast.kind === 'ok'
            ? 'bg-emerald-900/30 border-emerald-800 text-emerald-200'
            : 'bg-red-900/30 border-red-800 text-red-200'
        }`}>
          {toast.kind === 'ok' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ENTITIES.map(({ key, label, description, icon: Icon, color }) => {
          const count = counters[key] || 0;
          const isBusy = busy === key;
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${color}-600/20 flex items-center justify-center text-${color}-300`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{key}</p>
                  </div>
                </div>
                {count > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-800">
                    +{count} inserted
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4 flex-1">{description}</p>
              <button
                disabled={isBusy}
                onClick={() => seed(key)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {isBusy ? <><Loader2 size={16} className="animate-spin" />Inserting...</> : <><Database size={16} />Insert sample {label}</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
