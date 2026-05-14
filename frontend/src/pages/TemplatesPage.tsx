import { useState, useEffect } from 'react';
import { Plus, Search, LayoutTemplate, X, Star } from 'lucide-react';
import { apiFetch } from '../api';
import { Template } from '../types';

const LAYOUTS = ['tasklist','calendar','kanban','dashboard','grid','timeline'];
const PERSONAS = ['power_user','student','developer','executive','designer','manager'];

export default function TemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Template|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template|null>(null);
  const [form, setForm] = useState({ name:'', description:'', layout:'dashboard', target_persona:'developer', primary_color:'#6366f1', density:'compact', widgets_json:'[]' });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    setItems(await apiFetch(`/templates?${p}`));
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    if (editing) await apiFetch(`/templates/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    else await apiFetch('/templates', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/templates/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Template) {
    setEditing(item);
    setForm({ name:item.name, description:item.description||'', layout:item.layout, target_persona:item.target_persona, primary_color:item.primary_color||'#6366f1', density:item.density||'compact', widgets_json:item.widgets_json||'[]' });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} />New Template
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.primary_color }} />
                  <LayoutTemplate size={14} className="text-indigo-400" />
                  <span className="text-xs text-gray-500">{item.layout} • {item.target_persona.replace('_',' ')} • {item.density}</span>
                </div>
                <h3 className="font-semibold text-white">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
              </div>
              <div className="ml-4 text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star size={12} className="text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">{Number(item.rating).toFixed(1)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{item.usage_count} uses</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selected.primary_color }} />
              <span className="text-sm text-gray-300">{selected.primary_color}</span>
            </div>
            <p className="text-gray-200 text-sm">{selected.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Layout</p><p className="text-white capitalize">{selected.layout}</p></div>
              <div><p className="text-xs text-gray-500">Target Persona</p><p className="text-white">{selected.target_persona.replace('_',' ')}</p></div>
              <div><p className="text-xs text-gray-500">Density</p><p className="text-white capitalize">{selected.density}</p></div>
              <div><p className="text-xs text-gray-500">Rating</p><p className="text-yellow-400 font-bold">{Number(selected.rating).toFixed(1)}/5</p></div>
              <div><p className="text-xs text-gray-500">Usage Count</p><p className="text-white">{selected.usage_count}</p></div>
            </div>
            {selected.widgets_json && (
              <div><p className="text-xs text-gray-500 mb-1">Widgets</p>
                <div className="flex flex-wrap gap-2">
                  {(() => { try { const w = JSON.parse(selected.widgets_json); return w.map((wd: string,i: number) => <span key={i} className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">{wd}</span>); } catch { return <p className="text-xs text-gray-400">{selected.widgets_json}</p>; } })()}
                </div>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'New'} Template</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Template name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Description"
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.layout} onChange={e => setForm({...form,layout:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={form.target_persona} onChange={e => setForm({...form,target_persona:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {PERSONAS.map(p => <option key={p} value={p}>{p.replace('_',' ')}</option>)}
                </select>
                <select value={form.density} onChange={e => setForm({...form,density:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['compact','comfortable','spacious'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="color" value={form.primary_color} onChange={e => setForm({...form,primary_color:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-10" />
              </div>
              <textarea value={form.widgets_json} onChange={e => setForm({...form,widgets_json:e.target.value})} placeholder='Widgets JSON, e.g. ["metrics","tasks"]'
                rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs" />
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
