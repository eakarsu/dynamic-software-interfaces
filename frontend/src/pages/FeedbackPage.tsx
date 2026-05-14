import { useState, useEffect } from 'react';
import { Plus, Search, MessageSquare, X, Star } from 'lucide-react';
import { apiFetch } from '../api';
import { Feedback } from '../types';

const STATUS_COLORS: Record<string,string> = { new:'bg-blue-500/20 text-blue-300', reviewed:'bg-green-500/20 text-green-300', resolved:'bg-gray-500/20 text-gray-300' };

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Feedback|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Feedback|null>(null);
  const [form, setForm] = useState({ ui_user_id:'', template_id:'', rating:4, category:'usability', comments:'', status:'new' });

  async function load() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (status) p.set('status', status);
    setItems(await apiFetch(`/feedback?${p}`));
  }

  useEffect(() => { load(); }, [search, status]);

  async function save() {
    if (editing) await apiFetch(`/feedback/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    else await apiFetch('/feedback', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/feedback/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Feedback) {
    setEditing(item);
    setForm({ ui_user_id:String(item.ui_user_id), template_id:String(item.template_id||''), rating:item.rating||4, category:item.category||'usability', comments:item.comments||'', status:item.status||'new' });
    setShowForm(true);
  }

  function renderStars(n: number) {
    return Array.from({length: 5}, (_, i) => (
      <Star key={i} size={12} className={i < n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
    ));
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} />Add Feedback
        </button>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search feedback..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Statuses</option>
          {['new','reviewed','resolved'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-indigo-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-pink-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]||'bg-gray-700 text-gray-300'}`}>{item.status}</span>
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
                <h3 className="font-semibold text-white">{item.user_name || `User #${item.ui_user_id}`} on {item.template_name || `Template #${item.template_id}`}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.comments}</p>
              </div>
              <div className="ml-4 flex items-center gap-0.5">{renderStars(item.rating)}</div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Feedback Detail</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{selected.category}</span>
            </div>
            <div className="flex items-center gap-1">{renderStars(selected.rating)}<span className="text-sm text-gray-400 ml-1">{selected.rating}/5</span></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">User</p><p className="text-white">{selected.user_name || `#${selected.ui_user_id}`}</p></div>
              <div><p className="text-xs text-gray-500">Template</p><p className="text-white">{selected.template_name || `#${selected.template_id}`}</p></div>
              <div><p className="text-xs text-gray-500">Submitted</p><p className="text-white">{new Date(selected.submitted_at).toLocaleDateString()}</p></div>
            </div>
            <div><p className="text-xs text-gray-500 mb-1">Comments</p><p className="text-gray-200 text-sm">{selected.comments}</p></div>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'Add'} Feedback</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.ui_user_id} onChange={e => setForm({...form,ui_user_id:e.target.value})} placeholder="UI User ID"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input type="number" value={form.template_id} onChange={e => setForm({...form,template_id:e.target.value})} placeholder="Template ID"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="1" max="5" value={form.rating} onChange={e => setForm({...form,rating:parseInt(e.target.value)})} placeholder="Rating (1-5)"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <select value={form.category} onChange={e => setForm({...form,category:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['usability','functionality','design','performance','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={form.comments} onChange={e => setForm({...form,comments:e.target.value})} placeholder="Comments"
                rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {['new','reviewed','resolved'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
