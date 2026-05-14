import { useState, useEffect } from 'react';
import { Plus, Search, Settings, X } from 'lucide-react';
import { apiFetch } from '../api';
import { Customization } from '../types';

export default function CustomizationsPage() {
  const [items, setItems] = useState<Customization[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customization|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customization|null>(null);
  const [form, setForm] = useState({ ui_user_id:'', config_name:'', config_json:'{}', is_active:true, description:'' });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    setItems(await apiFetch(`/customizations?${p}`));
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    if (editing) await apiFetch(`/customizations/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    else await apiFetch('/customizations', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/customizations/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Customization) {
    setEditing(item);
    setForm({ ui_user_id:String(item.ui_user_id), config_name:item.config_name, config_json:item.config_json||'{}', is_active:item.is_active!==false, description:item.description||'' });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Customizations</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} />New Config
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customizations..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Settings size={14} className="text-indigo-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{item.is_active ? 'active' : 'inactive'}</span>
                </div>
                <h3 className="font-semibold text-white">{item.config_name}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.user_name || `User #${item.ui_user_id}`} • {item.description}</p>
              </div>
              <div className="text-xs text-gray-500 ml-4">{item.last_used ? new Date(item.last_used).toLocaleDateString() : 'Never'}</div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{selected.config_name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <span className={`inline-block text-xs px-2 py-1 rounded-full ${selected.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{selected.is_active ? 'Active' : 'Inactive'}</span>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">User</p><p className="text-white">{selected.user_name || `#${selected.ui_user_id}`}</p></div>
              <div><p className="text-xs text-gray-500">Last Used</p><p className="text-white">{selected.last_used ? new Date(selected.last_used).toLocaleDateString() : 'Never'}</p></div>
            </div>
            {selected.description && <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-gray-200 text-sm">{selected.description}</p></div>}
            {selected.config_json && (
              <div><p className="text-xs text-gray-500 mb-1">Configuration</p>
                <pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-3 overflow-x-auto">{(() => { try { return JSON.stringify(JSON.parse(selected.config_json), null, 2); } catch { return selected.config_json; } })()}</pre>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'New'} Customization</h2>
            <div className="space-y-3">
              <input type="number" value={form.ui_user_id} onChange={e => setForm({...form,ui_user_id:e.target.value})} placeholder="UI User ID"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.config_name} onChange={e => setForm({...form,config_name:e.target.value})} placeholder="Config name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Description"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.config_json} onChange={e => setForm({...form,config_json:e.target.value})} placeholder='Config JSON e.g. {"widgets":["tasks"]}'
                rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs" />
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form,is_active:e.target.checked})} />
                Active
              </label>
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
