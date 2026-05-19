import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Users, LayoutTemplate, PuzzleIcon, Clock, Settings, MessageSquare, Sparkles, LogOut, Wrench, Database, LayoutDashboard, GitBranch, Boxes, Beaker, Brain, Palette, Eye } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/intent-graph', label: 'Intent Graph', icon: GitBranch },
  { path: '/component-registry', label: 'Components', icon: Boxes },
  { path: '/design-tokens', label: 'Design Tokens', icon: Palette },
  { path: '/layout-variants', label: 'Layout Variants', icon: Beaker },
  { path: '/ui-generation-runs', label: 'UI Generations', icon: Sparkles },
  { path: '/intent-classifier', label: 'Intent Classifier', icon: Brain },
  { path: '/ui-users', label: 'Interface Users', icon: Users },
  { path: '/templates', label: 'Templates', icon: LayoutTemplate },
  { path: '/widgets', label: 'Widgets', icon: PuzzleIcon },
  { path: '/sessions', label: 'Sessions', icon: Clock },
  { path: '/customizations', label: 'Customizations', icon: Settings },
  { path: '/feedback', label: 'Feedback', icon: MessageSquare },
  { path: '/utility', label: 'Utilities', icon: Wrench },
  { path: '/sample-data', label: 'Sample Data', icon: Database },
  { path: '/custom-views', label: 'DSI Views', icon: Eye },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function logout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">DynamicUI</h1>
              <p className="text-xs text-indigo-400 mt-0.5">Studio</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Features</p>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === path ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <Icon size={18} />{label}
            </Link>
          ))}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Center</p>
            <Link to="/ai"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/ai' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <Sparkles size={18} />AI Center
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-white">{user.name}</p><p className="text-xs text-gray-400">{user.role}</p></div>
            <button onClick={logout} className="text-gray-400 hover:text-white"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
