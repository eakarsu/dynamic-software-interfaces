import { useState, useEffect } from 'react';
import { Plus, Search, PuzzleIcon, X, TrendingUp } from 'lucide-react';
import { apiFetch } from '../api';
import { Widget } from '../types';

const TYPES = ['chart','table','calendar','kanban','timeline','metric','form','feed'];
const TYPE_COLORS: Record<string,string> = { chart:'bg-blue-500/20 text-blue-300', table:'bg-gray-500/20 text-gray-300', calendar:'bg-green-500/20 text-green-300', kanban:'bg-purple-500/20 text-purple-300', timeline:'bg-orange-500/20 text-orange-300', metric:'bg-red-500/20 text-red-300', form:'bg-yellow-500/20 text-yellow-300', feed:'bg-cyan-500/20 text-cyan-300' };

export default function WidgetsPage() {
  const [items, setItems] = useState<Widget[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState<Widget|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Widget|null>(null);
  const [form, setForm] = useState({ name:'', type:'chart', description:'', data_source:'', config_schema:'{}', category:'' });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (type) p.set('type', type);
    setItems(await apiFetch(`/widgets?${p}`));
  }

  useEffect(() => { load(); }, [search, type]);

  async function save() {
    if (editing) await apiFetch(`/widgets/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    else await apiFetch('/widgets', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/widgets/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Widget) {
    setEditing(item);
    setForm({ name:item.name, type:item.type, description:item.description||'', data_source:item.data_source||'', config_schema:item.config_schema||'{}', category:item.category||'' });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Widgets</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} />Add Widget
        </button>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search widgets..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
        </div>
        <select value={type} onChange={e => setType(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <PuzzleIcon size={14} className="text-pink-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type]||'bg-gray-700 text-gray-300'}`}>{item.type}</span>
                  <span className="text-xs text-gray-500">{item.category} • {item.data_source}</span>
                </div>
                <h3 className="font-semibold text-white">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
              </div>
              <div className="ml-4 flex items-center gap-1">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-sm font-bold text-green-400">{item.popularity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${TYPE_COLORS[selected.type]}`}>{selected.type}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{selected.category}</span>
            </div>
            <p className="text-gray-200 text-sm">{selected.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Data Source</p><p className="text-white">{selected.data_source}</p></div>
              <div><p className="text-xs text-gray-500">Popularity</p><p className="text-green-400 font-bold">{selected.popularity}</p></div>
            </div>
            {selected.config_schema && (
              <div><p className="text-xs text-gray-500 mb-1">Config Schema</p>
                <pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-3 overflow-x-auto">{(() => { try { return JSON.stringify(JSON.parse(selected.config_schema), null, 2); } catch { return selected.config_schema; } })()}</pre>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => openEdit(selected)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium">Edit</button>
              <button onClick={() => remove(selected.id)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'Add'} Widget</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Widget name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({...form,type:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="Category"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Description"
                rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <input value={form.data_source} onChange={e => setForm({...form,data_source:e.target.value})} placeholder="Data source"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.config_schema} onChange={e => setForm({...form,config_schema:e.target.value})} placeholder="Config schema JSON"
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
