import { useState, useEffect } from 'react';
import { Download, Search, ScrollText, Filter, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';

const TABLES = ['ui_users','templates','widgets','ui_sessions','customizations','feedback'];

interface AuditEntry {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  target: string | null;
  payload: string | null;
  created_at: string;
}

interface SearchResult { table: string; row: any; }

export default function UtilityPage() {
  const [tab, setTab] = useState<'export'|'search'|'audit'>('export');

  // Export state
  const [exportTable, setExportTable] = useState('ui_users');
  const [exportMsg, setExportMsg] = useState('');

  // Search state
  const [q, setQ] = useState('');
  const [searchTable, setSearchTable] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  // Audit state
  const [auditAction, setAuditAction] = useState('');
  const [auditTarget, setAuditTarget] = useState('');
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditErr, setAuditErr] = useState('');

  async function downloadCsv() {
    setExportMsg('Preparing...');
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/utility/export/${exportTable}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${exportTable}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setExportMsg('Downloaded.');
    } catch (e: any) {
      setExportMsg(`Failed: ${e.message}`);
    }
  }

  async function runSearch() {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true); setSearchErr('');
    try {
      const p = new URLSearchParams({ q });
      if (searchTable) p.set('table', searchTable);
      const data = await apiFetch(`/utility/search?${p}`);
      setSearchResults(data.results || []);
    } catch (e: any) {
      setSearchErr(e.message || 'Failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadAudit() {
    setAuditLoading(true); setAuditErr('');
    try {
      const p = new URLSearchParams();
      if (auditAction) p.set('action', auditAction);
      if (auditTarget) p.set('target', auditTarget);
      const data = await apiFetch(`/utility/audit-log?${p}`);
      setAuditEntries(data);
    } catch (e: any) {
      const msg = e.message || 'Failed';
      setAuditErr(msg.includes('503') || msg.includes('missing') ? 'Audit log table missing — re-run schema.sql.' : msg);
    } finally {
      setAuditLoading(false);
    }
  }

  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Utilities</h1>
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {[
          { k: 'export', label: 'CSV Export', icon: Download },
          { k: 'search', label: 'Search & Filter', icon: Search },
          { k: 'audit', label: 'Audit Log', icon: ScrollText }
        ].map(({ k, label, icon: Icon }) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === k ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4"><Download size={20} className="text-indigo-400" /><h2 className="text-lg font-semibold text-white">CSV Export</h2></div>
          <p className="text-sm text-gray-400 mb-4">Download any table as CSV. Auth required.</p>
          <div className="flex gap-3 items-center">
            <select value={exportTable} onChange={e => setExportTable(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={downloadCsv}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Download size={16} />Download CSV
            </button>
            {exportMsg && <span className="text-sm text-gray-400">{exportMsg}</span>}
          </div>
        </div>
      )}

      {tab === 'search' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4"><Search size={20} className="text-green-400" /><h2 className="text-lg font-semibold text-white">Global Search</h2></div>
          <div className="flex gap-3 mb-4">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search across all entities..."
              onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <select value={searchTable} onChange={e => setSearchTable(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">All Tables</option>
              {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={runSearch} disabled={searchLoading || !q.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Filter size={16} />{searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchErr && <div className="mb-3 text-sm text-red-300 bg-red-900/30 border border-red-800 rounded-lg p-3">{searchErr}</div>}
          <div className="space-y-2">
            {searchResults.length === 0 && !searchLoading && q && <p className="text-sm text-gray-500">No results.</p>}
            {searchResults.map((r, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300">{r.table}</span>
                  <span className="text-xs text-gray-500">id: {r.row.id}</span>
                </div>
                <div className="text-white">{r.row.name || r.row.config_name || r.row.layout_used || r.row.category || `Record ${r.row.id}`}</div>
                <div className="text-xs text-gray-400 mt-1 line-clamp-2">{r.row.description || r.row.comments || r.row.email || ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4"><ScrollText size={20} className="text-yellow-400" /><h2 className="text-lg font-semibold text-white">Audit Log</h2></div>
          <div className="flex gap-3 mb-4">
            <input value={auditAction} onChange={e => setAuditAction(e.target.value)} placeholder="Filter by action (e.g. ai., export.)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={auditTarget} onChange={e => setAuditTarget(e.target.value)} placeholder="Filter by target"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={loadAudit}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <RefreshCw size={16} />Refresh
            </button>
          </div>
          {auditErr && <div className="mb-3 text-sm text-red-300 bg-red-900/30 border border-red-800 rounded-lg p-3">{auditErr}</div>}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {auditEntries.length === 0 && !auditLoading && !auditErr && <p className="text-sm text-gray-500">No entries.</p>}
            {auditEntries.map(e => (
              <div key={e.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300">{e.action}</span>
                    {e.target && <span className="text-xs text-gray-400">{e.target}</span>}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{e.user_email || `user #${e.user_id || '-'}`}</div>
                {e.payload && <pre className="text-xs text-gray-300 bg-gray-900 rounded mt-1 p-2 overflow-x-auto">{e.payload}</pre>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
