import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

interface Series { name: string; data: number[]; }
interface UsageData { title: string; labels: string[]; series: Series[]; generated_at: string; }

const COLORS = ['#6366f1', '#ec4899', '#10b981'];

export default function InterfaceUsageChart() {
  const [data, setData] = useState<UsageData | null>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    apiFetch('/custom-views/usage-chart')
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="text-red-400 text-sm">Error: {err}</div>;
  if (!data) return <div className="text-gray-400 text-sm">Loading usage chart...</div>;

  const maxV = Math.max(1, ...data.series.flatMap(s => s.data));

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-white font-semibold mb-1">{data.title}</h3>
      <p className="text-xs text-gray-500 mb-4">Stacked bars per weekday</p>
      <div className="flex items-end gap-2 h-48">
        {data.labels.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 w-full flex flex-col-reverse gap-0.5">
              {data.series.map((s, sIdx) => {
                const h = (s.data[i] / maxV) * 100;
                return (
                  <div
                    key={s.name}
                    title={`${s.name}: ${s.data[i]}`}
                    style={{ height: `${h}%`, background: COLORS[sIdx % COLORS.length] }}
                    className="w-full rounded-sm transition-all"
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {data.series.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-300">
            <span className="w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}
