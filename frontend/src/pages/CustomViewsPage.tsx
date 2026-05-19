import { Eye } from 'lucide-react';
import InterfaceUsageChart from '../components/InterfaceUsageChart';
import AdaptationHeatmap from '../components/AdaptationHeatmap';
import InterfaceSpecPdf from '../components/InterfaceSpecPdf';
import AdaptationRulesEditor from '../components/AdaptationRulesEditor';

export default function CustomViewsPage() {
  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Eye size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">DSI Views</h1>
          <p className="text-sm text-gray-400">Custom views for the Dynamic Software Interfaces domain.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InterfaceUsageChart />
        <AdaptationHeatmap />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InterfaceSpecPdf />
        <AdaptationRulesEditor />
      </div>
    </div>
  );
}
