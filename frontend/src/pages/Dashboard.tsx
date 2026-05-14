import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, LayoutTemplate, PuzzleIcon, Palette, Beaker, Settings,
  Sparkles, Database, Users, Clock, RefreshCw, Loader2, AlertTriangle, Activity
} from 'lucide-react';
import { apiFetch } from '../api';

interface Kpis {
  component_specs: number;
  widgets: number;
  design_tokens: number;
  ab_variants_live: number;
  recent_customizations: number;
  customizations_total: number;
  interface_users: number;
  active_sessions_7d: number;
}
interface ActivityRow {
  id: number;
  action: string;
  target: string | null;
  created_at: string;
  user_email: string | null;
}
interface StatsResponse {
  kpis: Kpis;
  recent_activity: ActivityRow[];
  generated_at: string;
}

const KPI_DEFS: { key: keyof Kpis; label: string; icon: any; color: string; hint: string }[] = [
  { key: 'component_specs',       label: 'Component specs',       icon: LayoutTemplate, color: 'indigo',  hint: 'Templates in the spec library' },
  { key: 'widgets',               label: 'Widgets',               icon: PuzzleIcon,     color: 'cyan',    hint: 'Reusable UI building blocks' },
  { key: 'design_tokens',         label: 'Design tokens',         icon: Palette,        color: 'violet',  hint: 'Distinct colors + density modes in use' },
  { key: 'ab_variants_live',      label: 'A/B variants live',     icon: Beaker,         color: 'amber',   hint: 'Generated in the last 7 days' },
  { key: 'recent_customizations', label: 'Recent customizations', icon: Settings,       color: 'emerald', hint: 'Saved configs in the last 7 days' },
];

const QUICK_ACTIONS: { to: string; label: string; icon: any; color: string; description: string }[] = [
  { to: '/ai',          label: 'AI Center',   icon: Sparkles,       color: 'violet',  description: 'Suggest layouts, personalize, audit, generate widgets.' },
  { to: '/templates',   label: 'Templates',   icon: LayoutTemplate, color: 'indigo',  description: 'Browse and edit component specs.' },
  { to: '/widgets',     label: 'Widgets',     icon: PuzzleIcon,     color: 'cyan',    description: 'Manage reusable widgets.' },
  { to: '/sample-data', label: 'Sample Data', icon: Database,       color: 'emerald', description: 'Seed realistic demo rows.' },
];

function formatRelative(iso: string) {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return iso;
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/dashboard/stats');
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-300">
            <LayoutDashboard size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">
              Welcome back{user.name ? `, ${user.name}` : ''}. Here's the state of your DynamicUI workspace.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm px-3 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm rounded-lg p-3 border bg-red-900/30 border-red-800 text-red-200">
          <AlertTriangle size={16} />{error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {KPI_DEFS.map(({ key, label, icon: Icon, color, hint }) => {
          const value = data?.kpis?.[key];
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg bg-${color}-600/20 flex items-center justify-center text-${color}-300`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold text-white mt-1">
                {loading && value === undefined ? <Loader2 size={20} className="animate-spin text-gray-500" /> : (value ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{hint}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-300"><Users size={18} /></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Interface users</p>
            <p className="text-lg font-semibold text-white">{data?.kpis?.interface_users ?? 0}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-300"><Clock size={18} /></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Sessions (7d)</p>
            <p className="text-lg font-semibold text-white">{data?.kpis?.active_sessions_7d ?? 0}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center text-amber-300"><Settings size={18} /></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Customizations total</p>
            <p className="text-lg font-semibold text-white">{data?.kpis?.customizations_total ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick actions</h2>
          <div className="space-y-3">
            {QUICK_ACTIONS.map(({ to, label, icon: Icon, color, description }) => (
              <Link
                key={to}
                to={to}
                className="block bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-2xl p-4 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${color}-600/20 flex items-center justify-center text-${color}-300`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent activity</h2>
            <Link to="/utility" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Activity size={12} />Open audit log
            </Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
            {loading && !data && (
              <div className="p-6 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />Loading activity…
              </div>
            )}
            {!loading && (!data?.recent_activity || data.recent_activity.length === 0) && (
              <div className="p-6 text-sm text-gray-500">
                No activity yet. Try generating an A/B variant or seeding sample data.
              </div>
            )}
            {data?.recent_activity?.map(row => (
              <div key={row.id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">
                    <span className="font-mono text-indigo-300">{row.action}</span>
                    {row.target && <span className="text-gray-400"> · {row.target}</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{row.user_email || 'system'}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{formatRelative(row.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
