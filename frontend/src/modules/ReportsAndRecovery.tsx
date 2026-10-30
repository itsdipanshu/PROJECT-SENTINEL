import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  Hammer,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  X,
  Layers,
  Sparkles
} from 'lucide-react';

export type ReportsRecoveryTab = 'reports' | 'recovery';

interface ReportItem {
  id: number;
  report_id: string;
  title: string;
  report_type: string;
  file_format: string;
  file_name: string;
  generated_by: string;
  summary: Record<string, any>;
  created_at: string;
}

interface RecoveryProjectItem {
  id: number;
  project_id: string;
  title: string;
  location_name: string;
  infrastructure_type: string;
  estimated_cost: number;
  actual_expenditure: number;
  progress_percent: number;
  status: string;
  is_demo: boolean;
  created_at: string;
  task_count: number;
  completed_tasks_count: number;
}

interface Props {
  initialTab?: ReportsRecoveryTab;
  onNavigateToAI?: (prompt?: string, autoSend?: boolean) => void;
}

export function ReportsAndRecovery({ initialTab = 'reports', onNavigateToAI }: Props) {
  const [activeTab, setActiveTab] = useState<ReportsRecoveryTab>(initialTab);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [projects, setProjects] = useState<RecoveryProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal states
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<RecoveryProjectItem | null>(null);

  // New Project Form
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    location_name: '',
    infrastructure_type: 'Roads & Bridges',
    estimated_cost: 500000,
    status: 'Planned'
  });

  // Update Project Form
  const [updateForm, setUpdateForm] = useState({
    progress_percent: 0,
    actual_expenditure: 0,
    status: 'In Progress'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, projRes] = await Promise.all([
        fetch('http://localhost:8000/api/reports/list'),
        fetch('http://localhost:8000/api/recovery/projects')
      ]);

      if (repRes.ok) {
        const data = await repRes.json();
        setReports(data);
      }
      if (projRes.ok) {
        const data = await projRes.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load reports and recovery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async (reportType: string, fileFormat: 'PDF' | 'CSV') => {
    const key = `${reportType}-${fileFormat}`;
    setGenerating(key);
    setMessage(null);
    try {
      const res = await fetch('http://localhost:8000/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          file_format: fileFormat,
          generated_by: 'Sentinel EOC Commander'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Generated ${data.file_format} report: ${data.report_id}`);
        await fetchData();
      } else {
        setMessage('Report generation failed');
      }
    } catch (err) {
      setMessage(`Error: ${String(err)}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/recovery/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjectForm.title,
          location_name: newProjectForm.location_name,
          infrastructure_type: newProjectForm.infrastructure_type,
          estimated_cost: Number(newProjectForm.estimated_cost),
          status: newProjectForm.status,
          is_demo: false
        })
      });
      if (res.ok) {
        setShowNewProjectModal(false);
        setNewProjectForm({
          title: '',
          location_name: '',
          infrastructure_type: 'Roads & Bridges',
          estimated_cost: 500000,
          status: 'Planned'
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating recovery project:', err);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUpdateModal) return;
    try {
      const res = await fetch(`http://localhost:8000/api/recovery/projects/${showUpdateModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_percent: Number(updateForm.progress_percent),
          actual_expenditure: Number(updateForm.actual_expenditure),
          status: updateForm.status
        })
      });
      if (res.ok) {
        setShowUpdateModal(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Error updating recovery project:', err);
    }
  };

  // Recovery KPIs
  const totalProjects = projects.length;
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.progress_percent, 0) / totalProjects)
    : 0;
  const totalBudget = projects.reduce((acc, p) => acc + (p.estimated_cost || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.actual_expenditure || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2d42] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Situation Reports & Post-Disaster Recovery
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated PDF/CSV disaster documentation & post-event infrastructure reconstruction tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToAI && (
            <button
              onClick={() => onNavigateToAI(
                "Please generate a comprehensive disaster Situation Report (SITREP) summary for today. Include executive summary, active flood incidents, casualty threat assessments, shelter and hospital readiness, and recommended next steps for the Incident Commander.",
                true
              )}
              className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800 text-cyan-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Ask AI for Report Summary
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 bg-[#111827] hover:bg-slate-800 border border-[#1f2d42] text-slate-300 rounded-lg transition"
            title="Refresh Data"
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

      {/* Tabs Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${activeTab === 'reports'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1f2d42]'
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Reports & SITREPs ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('recovery')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${activeTab === 'recovery'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1f2d42]'
            }`}
        >
          <Hammer className="w-3.5 h-3.5" />
          Recovery & Reconstruction ({projects.length})
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Quick Generator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SITREP Card */}
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 space-y-4 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  NDMA STANDARD
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Emergency Situation Report (SITREP)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Active emergency summary, casualty estimates, shelter counts, and hospital capacities.
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  onClick={() => handleGenerateReport('Situation', 'PDF')}
                  disabled={generating !== null}
                  className="flex-1 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 rounded text-xs font-mono flex items-center justify-center gap-1 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {generating === 'Situation-PDF' ? 'Building...' : 'PDF Report'}
                </button>
                <button
                  onClick={() => handleGenerateReport('Situation', 'CSV')}
                  disabled={generating !== null}
                  className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded text-xs font-mono flex items-center justify-center gap-1 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {generating === 'Situation-CSV' ? 'Exporting...' : 'CSV Export'}
                </button>
              </div>
            </div>

            {/* Resource Inventory Card */}
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 space-y-4 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                  AUDIT
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Resource Stock & Distribution Audit</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Centralized warehouse stocks, boats, ration packets, life jackets, and medical kits.
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  onClick={() => handleGenerateReport('Resource', 'PDF')}
                  disabled={generating !== null}
                  className="flex-1 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 rounded text-xs font-mono flex items-center justify-center gap-1 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {generating === 'Resource-PDF' ? 'Building...' : 'PDF Report'}
                </button>
                <button
                  onClick={() => handleGenerateReport('Resource', 'CSV')}
                  disabled={generating !== null}
                  className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded text-xs font-mono flex items-center justify-center gap-1 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {generating === 'Resource-CSV' ? 'Exporting...' : 'CSV Export'}
                </button>
              </div>
            </div>

            {/* Recovery Reconstruction Card */}
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 space-y-4 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Hammer className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  POST-DISASTER
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Recovery & Infrastructure Report</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Reconstruction status, bridge restorations, financial expenditure, and completion forecasts.
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  onClick={() => handleGenerateReport('Recovery', 'PDF')}
                  disabled={generating !== null}
                  className="flex-1 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 rounded text-xs font-mono flex items-center justify-center gap-1 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {generating === 'Recovery-PDF' ? 'Building...' : 'PDF Report'}
                </button>
                <button
                  onClick={() => handleGenerateReport('Recovery', 'CSV')}
                  disabled={generating !== null}
                  className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded text-xs font-mono flex items-center justify-center gap-1 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {generating === 'Recovery-CSV' ? 'Exporting...' : 'CSV Export'}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Reports Archive */}
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2d42] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Generated Reports Archive</h2>
                <p className="text-xs text-slate-400">All local mission documents stored in SQLite database</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800">
                {reports.length} Reports Logged
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No reports generated yet. Click one of the buttons above to produce a live PDF or CSV.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0c121e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1f2d42]">
                    <tr>
                      <th className="p-3">Report ID</th>
                      <th className="p-3">Title & Classification</th>
                      <th className="p-3">Format</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3">Author</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2d42]">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-cyan-400">{r.report_id}</td>
                        <td className="p-3">
                          <div className="font-sans font-medium text-slate-200">{r.title}</div>
                          <div className="text-[10px] text-slate-400">{r.report_type}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.file_format === 'PDF'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              }`}
                          >
                            {r.file_format}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-300">{r.generated_by}</td>
                        <td className="p-3 text-right">
                          <a
                            href={`http://localhost:8000/api/reports/download/${r.id}`}
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-xs transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECOVERY & RECONSTRUCTION */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          {/* Recovery KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-mono">Projects</span>
                <Building2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">{totalProjects}</div>
              <p className="text-[10px] text-slate-500 mt-1">Infrastructure works</p>
            </div>

            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-mono">Avg Progress</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{avgProgress}%</div>
              <p className="text-[10px] text-slate-500 mt-1">Overall completion</p>
            </div>

            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-mono">Allocated Budget</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                ₹{(totalBudget / 100000).toFixed(1)}L
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total estimated funds</p>
            </div>

            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-mono">Expenditure</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                ₹{(totalSpent / 100000).toFixed(1)}L
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of allocation
              </p>
            </div>
          </div>

          {/* Projects Control Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Hammer className="w-4 h-4 text-cyan-400" />
              Post-Disaster Reconstruction Projects
            </h2>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Register New Project
            </button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const pct = p.progress_percent || 0;
              return (
                <div
                  key={p.id}
                  className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 space-y-4 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{p.project_id}</span>
                        {p.is_demo && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                            DEMO
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${p.status === 'Completed'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : p.status === 'Delayed'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                            }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-1">{p.title}</h3>
                      <p className="text-xs text-slate-400">
                        {p.location_name} • <span className="text-slate-300">{p.infrastructure_type}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowUpdateModal(p);
                        setUpdateForm({
                          progress_percent: p.progress_percent,
                          actual_expenditure: p.actual_expenditure,
                          status: p.status
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 rounded border border-slate-700 transition"
                    >
                      Update
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Restoration Progress</span>
                      <span className="font-bold text-cyan-400">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1f2d42] text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">ESTIMATED BUDGET</span>
                      <span className="text-slate-200 font-semibold">₹{p.estimated_cost?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ACTUAL EXPENDITURE</span>
                      <span className="text-cyan-300 font-semibold">₹{p.actual_expenditure?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f2d42] pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Register Reconstruction Project
              </h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-106 Culvert & Road Embankment Repair"
                  value={newProjectForm.title}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Location / District</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madhepura, Bihar"
                    value={newProjectForm.location_name}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, location_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Infrastructure Type</label>
                  <select
                    value={newProjectForm.infrastructure_type}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, infrastructure_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Roads & Bridges">Roads & Bridges</option>
                    <option value="Electricity & Power Grid">Electricity & Power Grid</option>
                    <option value="Water Supply & Sanitation">Water Supply & Sanitation</option>
                    <option value="Embankments & Dykes">Embankments & Dykes</option>
                    <option value="Hospitals & Clinics">Hospitals & Clinics</option>
                    <option value="Schools & Shelters">Schools & Shelters</option>
                    <option value="Communication Network">Communication Network</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={newProjectForm.estimated_cost}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, estimated_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Status</label>
                  <select
                    value={newProjectForm.status}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PROJECT MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f2d42] pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-white">Update Project Progress</h3>
                <p className="text-xs text-slate-400">{showUpdateModal.title}</p>
              </div>
              <button
                onClick={() => setShowUpdateModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">
                  Progress Percentage ({updateForm.progress_percent}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={updateForm.progress_percent}
                  onChange={(e) => setUpdateForm({ ...updateForm, progress_percent: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Actual Expenditure to Date (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={updateForm.actual_expenditure}
                  onChange={(e) => setUpdateForm({ ...updateForm, actual_expenditure: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Project Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
