import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

interface Heatmap {
  title: string;
  x_labels: string[];
  y_labels: string[];
  matrix: number[][];
  max: number;
}

export default function AdaptationHeatmap() {
  const [data, setData] = useState<Heatmap | null>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    apiFetch('/custom-views/adaptation-heatmap')
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="text-red-400 text-sm">Error: {err}</div>;
  if (!data) return <div className="text-gray-400 text-sm">Loading heatmap...</div>;

  function colorFor(v: number) {
    const t = Math.min(1, v / data!.max);
    // indigo -> magenta gradient
    const r = Math.round(99 + (236 - 99) * t);
    const g = Math.round(102 + (72 - 102) * t);
    const b = Math.round(241 + (153 - 241) * t);
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-white font-semibold mb-1">{data.title}</h3>
      <p className="text-xs text-gray-500 mb-4">Adaptation count per interface per user</p>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th></th>
              {data.x_labels.map(x => (
                <th key={x} className="text-[11px] text-gray-400 font-normal px-1">{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.y_labels.map((y, i) => (
              <tr key={y}>
                <td className="text-[11px] text-gray-400 pr-2 text-right">{y}</td>
                {data.matrix[i].map((v, j) => (
                  <td
                    key={j}
                    title={`${y} x ${data.x_labels[j]}: ${v}`}
                    style={{ background: colorFor(v) }}
                    className="w-8 h-8 rounded text-[10px] text-white text-center align-middle font-semibold"
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
        <span>low</span>
        <div className="h-2 w-32 rounded" style={{ background: 'linear-gradient(to right, rgb(99,102,241), rgb(236,72,153))' }} />
        <span>high</span>
      </div>
    </div>
  );
}
