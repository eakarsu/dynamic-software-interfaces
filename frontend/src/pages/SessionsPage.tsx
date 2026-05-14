import { useState, useEffect } from 'react';
import { Plus, Search, Clock, X, Star } from 'lucide-react';
import { apiFetch } from '../api';
import { UISession } from '../types';

export default function SessionsPage() {
  const [items, setItems] = useState<UISession[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UISession|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ui_user_id:'', layout_used:'dashboard', actions_count:0, satisfaction_rating:4, device_type:'desktop', duration_mins:60 });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    setItems(await apiFetch(`/sessions?${p}`));
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    await apiFetch('/sessions', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); load();
  }

  async function remove(id: number) {
    await apiFetch(`/sessions/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">User Sessions</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} />Log Session
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-indigo-400" />
                  <span className="text-xs text-gray-500">{item.layout_used} • {item.device_type}</span>
                </div>
                <h3 className="font-semibold text-white">{item.user_name || `User #${item.ui_user_id}`}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.duration_mins} mins • {item.actions_count} actions • {new Date(item.started_at).toLocaleDateString()}</p>
              </div>
              {item.satisfaction_rating && (
                <div className="ml-4 flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">{item.satisfaction_rating}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Session Detail</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">User</p><p className="text-white">{selected.user_name || `#${selected.ui_user_id}`}</p></div>
              <div><p className="text-xs text-gray-500">Layout</p><p className="text-white capitalize">{selected.layout_used}</p></div>
              <div><p className="text-xs text-gray-500">Duration</p><p className="text-white">{selected.duration_mins} mins</p></div>
              <div><p className="text-xs text-gray-500">Actions</p><p className="text-white">{selected.actions_count}</p></div>
              <div><p className="text-xs text-gray-500">Device</p><p className="text-white capitalize">{selected.device_type}</p></div>
              <div><p className="text-xs text-gray-500">Rating</p><p className="text-yellow-400 font-bold">{selected.satisfaction_rating}/5</p></div>
              <div><p className="text-xs text-gray-500">Started</p><p className="text-white">{new Date(selected.started_at).toLocaleString()}</p></div>
            </div>
            <button onClick={() => remove(selected.id)} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium">Delete</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Log Session</h2>
            <div className="space-y-3">
              <input type="number" value={form.ui_user_id} onChange={e => setForm({...form,ui_user_id:e.target.value})} placeholder="UI User ID"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.layout_used} onChange={e => setForm({...form,layout_used:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['dashboard','tasklist','kanban','grid','timeline','calendar'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={form.device_type} onChange={e => setForm({...form,device_type:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['desktop','laptop','tablet','mobile'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="number" value={form.duration_mins} onChange={e => setForm({...form,duration_mins:parseInt(e.target.value)})} placeholder="Duration (mins)"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input type="number" value={form.actions_count} onChange={e => setForm({...form,actions_count:parseInt(e.target.value)})} placeholder="Actions count"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input type="number" min="1" max="5" value={form.satisfaction_rating} onChange={e => setForm({...form,satisfaction_rating:parseInt(e.target.value)})} placeholder="Rating (1-5)"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
