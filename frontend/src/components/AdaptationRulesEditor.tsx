import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Plus, Trash2, Save, X, Edit2 } from 'lucide-react';

interface Rule {
  id: number;
  name: string;
  trigger: string;
  action: string;
  priority: number;
  enabled: boolean;
}

const empty: Omit<Rule, 'id'> = { name: '', trigger: '', action: '', priority: 100, enabled: true };

export default function AdaptationRulesEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [draft, setDraft] = useState<Omit<Rule, 'id'>>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await apiFetch('/custom-views/rules');
      setRules(r.rules || []);
    } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setBusy(true); setErr('');
    try {
      if (editingId == null) {
        await apiFetch('/custom-views/rules', { method: 'POST', body: JSON.stringify(draft) });
      } else {
        await apiFetch(`/custom-views/rules/${editingId}`, { method: 'PUT', body: JSON.stringify(draft) });
      }
      setDraft(empty); setEditingId(null);
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function del(id: number) {
    if (!confirm('Delete this rule?')) return;
    try {
      await apiFetch(`/custom-views/rules/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  function startEdit(r: Rule) {
    setEditingId(r.id);
    setDraft({ name: r.name, trigger: r.trigger, action: r.action, priority: r.priority, enabled: r.enabled });
  }

  function cancel() { setEditingId(null); setDraft(empty); }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Adaptation Rules Editor</h3>
        <span className="text-xs text-gray-500">{rules.length} rules</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
        <input placeholder="Name" value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          className="md:col-span-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
        <input placeholder="Trigger (expression)" value={draft.trigger}
          onChange={e => setDraft({ ...draft, trigger: e.target.value })}
          className="md:col-span-2 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
        <input placeholder="Action" value={draft.action}
          onChange={e => setDraft({ ...draft, action: e.target.value })}
          className="md:col-span-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
        <div className="flex gap-1">
          <input type="number" placeholder="Prio" value={draft.priority}
            onChange={e => setDraft({ ...draft, priority: Number(e.target.value) })}
            className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
          <button onClick={save} disabled={busy || !draft.name || !draft.trigger || !draft.action}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-3 py-1.5 rounded flex items-center justify-center gap-1">
            {editingId == null ? <Plus size={14} /> : <Save size={14} />}
            {editingId == null ? 'Add' : 'Save'}
          </button>
          {editingId != null && (
            <button onClick={cancel} className="bg-gray-700 text-white px-2 rounded"><X size={14} /></button>
          )}
        </div>
      </div>
      {err && <p className="text-red-400 text-xs mb-2">{err}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase">
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Trigger</th>
              <th className="text-left py-2 px-2">Action</th>
              <th className="text-left py-2 px-2">Prio</th>
              <th className="text-right py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-t border-gray-800">
                <td className="py-2 px-2 text-white">{r.name}</td>
                <td className="py-2 px-2 text-gray-300 font-mono text-xs">{r.trigger}</td>
                <td className="py-2 px-2 text-gray-300">{r.action}</td>
                <td className="py-2 px-2 text-gray-400">{r.priority}</td>
                <td className="py-2 px-2 text-right">
                  <button onClick={() => startEdit(r)} className="text-indigo-400 hover:text-indigo-300 mr-2"><Edit2 size={14} /></button>
                  <button onClick={() => del(r.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-4">No rules yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
