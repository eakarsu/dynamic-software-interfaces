import { useState } from 'react';
import { apiFetch } from '../api';
import { FileText, Download, Loader2 } from 'lucide-react';

interface PdfResp {
  filename: string;
  mime: string;
  size: number;
  base64: string;
  rules_count: number;
}

export default function InterfaceSpecPdf() {
  const [pdf, setPdf] = useState<PdfResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  async function generate() {
    setLoading(true); setErr('');
    try {
      const data = await apiFetch('/custom-views/spec-pdf');
      setPdf(data);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  function download() {
    if (!pdf) return;
    const link = document.createElement('a');
    link.href = `data:${pdf.mime};base64,${pdf.base64}`;
    link.download = pdf.filename;
    link.click();
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={18} className="text-indigo-400" />
        <h3 className="text-white font-semibold">Interface Specification PDF</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Generate a portable spec document listing the active adaptation rules.
      </p>
      <div className="flex gap-2">
        <button
          onClick={generate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          Generate Spec
        </button>
        {pdf && (
          <button
            onClick={download}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={14} /> Download
          </button>
        )}
      </div>
      {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
      {pdf && (
        <div className="mt-4 text-xs text-gray-300 space-y-1">
          <div><span className="text-gray-500">file:</span> {pdf.filename}</div>
          <div><span className="text-gray-500">size:</span> {pdf.size} bytes</div>
          <div><span className="text-gray-500">rules included:</span> {pdf.rules_count}</div>
        </div>
      )}
    </div>
  );
}
