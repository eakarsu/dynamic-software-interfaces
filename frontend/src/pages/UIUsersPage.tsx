import { useState, useEffect } from 'react';
import { Plus, Search, Users, X, Star } from 'lucide-react';
import { apiFetch } from '../api';
import { UIUser } from '../types';

const PERSONAS = ['power_user','student','developer','executive','designer','manager'];
const LAYOUTS = ['tasklist','calendar','kanban','dashboard','grid','timeline'];
const PERSONA_COLORS: Record<string,string> = { power_user:'bg-orange-500/20 text-orange-300', student:'bg-green-500/20 text-green-300', developer:'bg-blue-500/20 text-blue-300', executive:'bg-purple-500/20 text-purple-300', designer:'bg-pink-500/20 text-pink-300', manager:'bg-yellow-500/20 text-yellow-300' };

export default function UIUsersPage() {
  const [items, setItems] = useState<UIUser[]>([]);
  const [search, setSearch] = useState('');
  const [persona, setPersona] = useState('');
  const [selected, setSelected] = useState<UIUser|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UIUser|null>(null);
  const [form, setForm] = useState({ name:'', email:'', role:'', persona:'developer', interface_layout:'dashboard', theme:'dark', density:'compact', active_since:'', satisfaction_score:4.0 });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (persona) p.set('persona', persona);
    setItems(await apiFetch(`/ui-users?${p}`));
  }

  useEffect(() => { load(); }, [search, persona]);

  async function save() {
    if (editing) await apiFetch(`/ui-users/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    else await apiFetch('/ui-users', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/ui-users/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: UIUser) {
    setEditing(item);
    setForm({ name:item.name, email:item.email||'', role:item.role||'', persona:item.persona, interface_layout:item.interface_layout, theme:item.theme||'dark', density:item.density||'compact', active_since:item.active_since||'', satisfaction_score:Number(item.satisfaction_score)||4.0 });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Interface Users</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} />Add User
        </button>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
        </div>
        <select value={persona} onChange={e => setPersona(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Personas</option>
          {PERSONAS.map(p => <option key={p} value={p}>{p.replace('_',' ')}</option>)}
        </select>
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-indigo-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PERSONA_COLORS[item.persona]||'bg-gray-700 text-gray-300'}`}>{item.persona.replace('_',' ')}</span>
                  <span className="text-xs text-gray-500">{item.interface_layout} • {item.theme} • {item.density}</span>
                </div>
                <h3 className="font-semibold text-white">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.email} • {item.role} • {item.session_count} sessions</p>
              </div>
              <div className="ml-4 flex items-center gap-1">
                <Star size={14} className="text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{Number(item.satisfaction_score).toFixed(1)}</span>
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
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full ${PERSONA_COLORS[selected.persona]}`}>{selected.persona.replace('_',' ')}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{selected.interface_layout}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Email</p><p className="text-white text-xs">{selected.email}</p></div>
              <div><p className="text-xs text-gray-500">Role</p><p className="text-white">{selected.role}</p></div>
              <div><p className="text-xs text-gray-500">Theme</p><p className="text-white capitalize">{selected.theme}</p></div>
              <div><p className="text-xs text-gray-500">Density</p><p className="text-white capitalize">{selected.density}</p></div>
              <div><p className="text-xs text-gray-500">Sessions</p><p className="text-white">{selected.session_count}</p></div>
              <div><p className="text-xs text-gray-500">Satisfaction</p><p className="text-yellow-400 font-bold">{Number(selected.satisfaction_score).toFixed(1)}/5</p></div>
              <div><p className="text-xs text-gray-500">Active Since</p><p className="text-white">{selected.active_since}</p></div>
            </div>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'Add'} User</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="Email"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.role} onChange={e => setForm({...form,role:e.target.value})} placeholder="Role"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.persona} onChange={e => setForm({...form,persona:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {PERSONAS.map(p => <option key={p} value={p}>{p.replace('_',' ')}</option>)}
                </select>
                <select value={form.interface_layout} onChange={e => setForm({...form,interface_layout:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={form.theme} onChange={e => setForm({...form,theme:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['dark','light'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.density} onChange={e => setForm({...form,density:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['compact','comfortable','spacious'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <input type="number" step="0.1" min="1" max="5" value={form.satisfaction_score} onChange={e => setForm({...form,satisfaction_score:parseFloat(e.target.value)})} placeholder="Satisfaction (1-5)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
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
