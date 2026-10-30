import { useState, useEffect, useRef } from 'react';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  Eye,
  Trash2,
  RefreshCw,
  Table,
  CheckCircle2,
  X,
  FileCode2,
  Sparkles
} from 'lucide-react';

interface DatasetItem {
  id: number;
  name: string;
  file_name: string;
  file_format: string;
  record_count: number;
  columns: string[];
  description: string;
  uploaded_by: string;
  file_size_kb: number;
  created_at: string;
}

interface PreviewData {
  id: number;
  name: string;
  columns: string[];
  total_rows: number;
  preview_rows: Record<string, any>[];
}

interface Props {
  onNavigateToAI?: (prompt?: string, autoSend?: boolean) => void;
}

export function DataManagement({ onNavigateToAI }: Props) {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Demo status
  const [isDemoLoaded, setIsDemoLoaded] = useState<boolean>(false);
  const [demoToggling, setDemoToggling] = useState<boolean>(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadName, setUploadName] = useState<string>('');
  const [uploadDesc, setUploadDesc] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal state
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, sRes] = await Promise.all([
        fetch('http://localhost:8000/api/data/datasets'),
        fetch('http://localhost:8000/api/dashboard/stats')
      ]);

      if (dRes.ok) {
        const dData = await dRes.json();
        setDatasets(dData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setIsDemoLoaded(sData.is_demo_loaded);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleDemo = async () => {
    setDemoToggling(true);
    try {
      const endpoint = isDemoLoaded
        ? 'http://localhost:8000/api/dashboard/demo/clear'
        : 'http://localhost:8000/api/dashboard/demo/load';

      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message || (isDemoLoaded ? 'Demo dataset cleared' : 'Demo dataset loaded'));
        await fetchData();
      }
    } catch (err) {
      setMessage(`Error toggling demo: ${String(err)}`);
    } finally {
      setDemoToggling(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadName) formData.append('name', uploadName);
    if (uploadDesc) formData.append('description', uploadDesc);

    try {
      const res = await fetch('http://localhost:8000/api/data/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setMessage(`Dataset "${selectedFile.name}" imported successfully`);
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadName('');
        setUploadDesc('');
        await fetchData();
      } else {
        const errData = await res.json();
        setMessage(`Upload failed: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage(`Upload error: ${String(err)}`);
    }
  };

  const handlePreview = async (datasetId: number) => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`http://localhost:8000/api/data/preview/${datasetId}`);
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      } else {
        setMessage('Failed to load preview');
      }
    } catch (err) {
      setMessage(`Preview error: ${String(err)}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async (datasetId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete dataset "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/data/datasets/${datasetId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessage(`Deleted dataset "${name}"`);
        await fetchData();
      }
    } catch (err) {
      console.error('Error deleting dataset:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2d42] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Disaster Intelligence Datasets & Repository
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Offline meteorological, hydrological & demographic dataset ingestion with tabular inspection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToAI && (
            <button
              onClick={() => onNavigateToAI(
                "Please analyze the current disaster datasets: Bihar Monsoon Rainfall 2026 and Kosi River Gauge Monitoring stations. Identify any anomaly spikes in rainfall, dangerous river levels above warning marks, and summarize the hydrology risks.",
                true
              )}
              className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800 text-cyan-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Ask AI to Analyze Datasets
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 bg-[#111827] hover:bg-slate-800 border border-[#1f2d42] text-slate-300 rounded-lg transition"
            title="Refresh Datasets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-cyan-950/50 border border-cyan-800/60 rounded-lg text-cyan-300 text-xs font-mono flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-cyan-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Demo Scenario Control Banner */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-[#111827] to-[#111827] border border-cyan-800/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">
                Bihar Koshi Basin Flood Demonstration Scenario
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  isDemoLoaded
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isDemoLoaded ? 'SCENARIO LOADED' : 'SCENARIO INACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant load of 4 realistic flood incidents, 3 relief shelters, 2 hospitals & 5 NDRF rescue teams
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleDemo}
          disabled={demoToggling}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 shrink-0 ${
            isDemoLoaded
              ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
          }`}
        >
          {demoToggling ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : isDemoLoaded ? (
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          {isDemoLoaded ? 'Clear Demonstration Scenario' : 'Load Bihar Flood Demo Dataset'}
        </button>
      </div>

      {/* Dataset Repository Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          Offline Disaster Datasets ({datasets.length})
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition shadow"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Upload Dataset (CSV / GeoJSON)
        </button>
      </div>

      {/* Datasets Table */}
      <div className="bg-[#111827] border border-[#1f2d42] rounded-xl overflow-hidden">
        {datasets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No datasets found. Click "Upload Dataset" to import local CSV or GeoJSON files.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0c121e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1f2d42]">
                <tr>
                  <th className="p-3">Dataset Name & Description</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">File Size</th>
                  <th className="p-3">Source / Uploader</th>
                  <th className="p-3">Date Ingested</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2d42]">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-sans font-semibold text-slate-200">{d.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{d.description}</div>
                      <div className="text-[10px] text-cyan-400/80 mt-1">
                        File: <span className="font-mono">{d.file_name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          d.file_format === 'CSV'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                        }`}
                      >
                        {d.file_format === 'CSV' ? (
                          <FileSpreadsheet className="w-3 h-3" />
                        ) : (
                          <FileCode2 className="w-3 h-3" />
                        )}
                        {d.file_format}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-100">{d.record_count.toLocaleString()} rows</td>
                    <td className="p-3 text-slate-400">{d.file_size_kb} KB</td>
                    <td className="p-3 text-slate-300">{d.uploaded_by}</td>
                    <td className="p-3 text-slate-400">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handlePreview(d.id)}
                        disabled={loadingPreview}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 rounded text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPLOAD DATASET MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f2d42] pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                Upload Disaster Dataset
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Select File (CSV or GeoJSON)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.geojson,.json"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!uploadName) {
                        setUploadName(e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-slate-300 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dataset Title</label>
                <input
                  type="text"
                  placeholder="e.g. Koshi Dam Discharge Readings"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hourly discharge rates and gate opening metrics."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                >
                  Upload & Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DATA PREVIEW MODAL */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2d42] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-400" />
                  Dataset Preview: {preview.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Showing first 10 rows of {preview.total_rows.toLocaleString()} total records • {preview.columns.length} columns
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-[#0c121e] text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-[#1f2d42]">
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c} className="p-2.5 whitespace-nowrap border-r border-[#1f2d42] last:border-r-0">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2d42]">
                  {preview.preview_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      {preview.columns.map((c) => (
                        <td
                          key={c}
                          className="p-2.5 whitespace-nowrap border-r border-[#1f2d42] last:border-r-0 text-slate-300"
                        >
                          {String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-[#1f2d42] bg-[#0c121e] flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Preview limited to sample rows for responsive memory performance.</span>
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

