import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Activity,
  Sliders,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  KeyRound,
  Database,
  Cpu,
  Lock,
  X
} from 'lucide-react';

export type AdminTab = 'users' | 'audit' | 'settings';

interface UserItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuditLogItem {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, any>;
  username: string;
  ip_address: string;
  timestamp: string;
}

interface SettingItem {
  id: number;
  key: string;
  value: string;
  category: string;
  description: string;
}

interface Props {
  initialTab?: AdminTab;
  onNavigateToAI?: () => void;
  currentUser?: {
    username?: string;
    email?: string;
    full_name?: string;
    role?: string;
  };
}

export function Administration({ initialTab = 'users', currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Super Administrator is Dipanshu@gmail.com
  const isSuperAdmin = currentUser?.role === 'Super Administrator' || currentUser?.email?.toLowerCase() === 'dipanshu@gmail.com';

  // Active current user state (for session simulation)
  const [currentRole, setCurrentRole] = useState<string>(currentUser?.role || 'Super Administrator');

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showRoleModal, setShowRoleModal] = useState<UserItem | null>(null);
  const [newRoleValue, setNewRoleValue] = useState<string>('Viewer');

  // New User Form
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'Viewer'
  });

  // Settings State Form
  const [settingForm, setSettingForm] = useState({
    system_posture: 'Elevated Response Active',
    ollama_model: 'gemma4:e4b',
    ollama_timeout: '120'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, lRes, sRes] = await Promise.all([
        fetch('http://localhost:8000/api/auth/users'),
        fetch('http://localhost:8000/api/auth/audit-logs?limit=50'),
        fetch('http://localhost:8000/api/auth/settings')
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData);
      }
      if (lRes.ok) {
        const lData = await lRes.json();
        setLogs(lData);
      }
      if (sRes.ok) {
        const sData: SettingItem[] = await sRes.json();
        setSettings(sData);

        const posture = sData.find((s) => s.key === 'system_posture')?.value;
        const model = sData.find((s) => s.key === 'ollama_model')?.value;
        const timeout = sData.find((s) => s.key === 'ollama_timeout')?.value;

        setSettingForm({
          system_posture: posture || 'Elevated Response Active',
          ollama_model: model || 'gemma4:e4b',
          ollama_timeout: timeout || '120'
        });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      if (res.ok) {
        setMessage(`User @${newUserForm.username} created successfully`);
        setShowAddUserModal(false);
        setNewUserForm({
          username: '',
          email: '',
          password: '',
          full_name: '',
          role: 'Viewer'
        });
        await fetchData();
      } else {
        const errData = await res.json();
        setMessage(`Error: ${errData.detail || 'Failed to register'}`);
      }
    } catch (err) {
      setMessage(`Network error: ${String(err)}`);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    try {
      const res = await fetch(`http://localhost:8000/api/auth/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active })
      });
      if (res.ok) {
        setMessage(`Status for @${user.username} updated to ${!user.is_active ? 'Active' : 'Disabled'}`);
        await fetchData();
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRoleModal) return;
    try {
      const res = await fetch(`http://localhost:8000/api/auth/users/${showRoleModal.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRoleValue })
      });
      if (res.ok) {
        setMessage(`Role for @${showRoleModal.username} changed to ${newRoleValue}`);
        setShowRoleModal(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        fetch('http://localhost:8000/api/auth/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setting_key: 'system_posture', setting_value: settingForm.system_posture })
        }),
        fetch('http://localhost:8000/api/auth/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setting_key: 'ollama_model', setting_value: settingForm.ollama_model })
        }),
        fetch('http://localhost:8000/api/auth/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setting_key: 'ollama_timeout', setting_value: settingForm.ollama_timeout })
        })
      ]);
      setMessage('System configuration saved successfully');
      await fetchData();
    } catch (err) {
      setMessage(`Failed to save settings: ${String(err)}`);
    }
  };

  const roleColors: Record<string, string> = {
    'Super Administrator': 'bg-rose-950/80 text-rose-300 border-rose-800',
    'Disaster Administrator': 'bg-amber-950/80 text-amber-300 border-amber-800',
    'Emergency Coordinator': 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
    'Rescue Team Member': 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    'Data Analyst': 'bg-purple-950/80 text-purple-300 border-purple-800',
    'Viewer': 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2d42] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Security, Access Control & Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Local role-based permissions, comprehensive audit trail & offline system parameter configuration
          </p>
        </div>

        {/* Current Active Session Simulator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-[#1f2d42] rounded-lg text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Current Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Super Administrator">Super Administrator</option>
              <option value="Emergency Coordinator">Emergency Coordinator</option>
              <option value="Rescue Team Member">Rescue Team Member</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 bg-[#111827] hover:bg-slate-800 border border-[#1f2d42] text-slate-300 rounded-lg transition"
            title="Refresh"
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

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1f2d42]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User Accounts & RBAC ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1f2d42]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          System Audit Logs ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1f2d42]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Platform Settings ({settings.length})
        </button>
      </div>

      {/* TAB 1: USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <span className="text-xs text-slate-400 font-mono">Total Operators</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{users.length}</div>
            </div>
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <span className="text-xs text-slate-400 font-mono">Super Admins</span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                {users.filter((u) => u.role === 'Super Administrator').length}
              </div>
            </div>
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <span className="text-xs text-slate-400 font-mono">Coordinators & Responders</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {users.filter((u) => ['Emergency Coordinator', 'Rescue Team Member'].includes(u.role)).length}
              </div>
            </div>
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-4">
              <span className="text-xs text-slate-400 font-mono">Active Accounts</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {users.filter((u) => u.is_active).length}
              </div>
            </div>
          </div>

          {/* User Table Header & Add Button */}
          {!isSuperAdmin && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Access Restricted:</strong> Only <strong>Admin Commander (Super Administrator — Dipanshu@gmail.com)</strong> has authority to create users, assign roles, and modify account status.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Registered Incident Response Personnel
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Access governance managed exclusively by Admin Commander (Dipanshu@gmail.com)
              </p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              disabled={!isSuperAdmin}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition shadow ${
                isSuperAdmin
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
              title={isSuperAdmin ? 'Add new user account' : 'Only Admin Commander (Dipanshu@gmail.com) can add users'}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add User Account
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0c121e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1f2d42]">
                  <tr>
                    <th className="p-3">User & Contact</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2d42]">
                  {users.map((u) => {
                    const isRootSuperAdmin = u.email?.toLowerCase() === 'dipanshu@gmail.com';
                    return (
                      <tr key={u.id} className={`hover:bg-slate-800/40 transition ${isRootSuperAdmin ? 'bg-cyan-950/20' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold text-slate-100">{u.full_name}</span>
                            {isRootSuperAdmin && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-900/80 text-cyan-200 border border-cyan-500/50 rounded">
                                ROOT COMMANDER
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-cyan-400">@{u.username} • {u.email}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              roleColors[u.role] || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              u.is_active
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : 'bg-rose-950/80 text-rose-300 border-rose-800'
                            }`}
                          >
                            {u.is_active ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-400" />
                                Disabled
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {isRootSuperAdmin ? (
                            <span className="text-[10px] text-cyan-400/80 italic font-mono">Master Administrator</span>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setShowRoleModal(u);
                                  setNewRoleValue(u.role);
                                }}
                                disabled={!isSuperAdmin}
                                className={`px-2.5 py-1 rounded border transition ${
                                  isSuperAdmin
                                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 cursor-pointer'
                                    : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                                }`}
                                title={isSuperAdmin ? 'Change user role' : 'Only Admin Commander (Dipanshu@gmail.com) can change roles'}
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={!isSuperAdmin}
                                className={`px-2.5 py-1 rounded border transition ${
                                  !isSuperAdmin
                                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                                    : u.is_active
                                      ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800 cursor-pointer'
                                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800 cursor-pointer'
                                }`}
                                title={isSuperAdmin ? 'Toggle account status' : 'Only Admin Commander (Dipanshu@gmail.com) can toggle status'}
                              >
                                {u.is_active ? 'Disable' : 'Enable'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2d42] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">System Security & Operations Audit Trail</h2>
                <p className="text-xs text-slate-400">Immutable chronological record of administrative actions</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800">
                Live Audit DB Log
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0c121e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1f2d42]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target Entity</th>
                    <th className="p-3">Initiated By</th>
                    <th className="p-3">IP / Host</th>
                    <th className="p-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2d42]">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        {l.action}
                      </td>
                      <td className="p-3 text-cyan-400">
                        {l.entity_type} {l.entity_id ? `#${l.entity_id}` : ''}
                      </td>
                      <td className="p-3 text-slate-300">
                        @{l.username}
                      </td>
                      <td className="p-3 text-slate-500">{l.ip_address}</td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">
                        {JSON.stringify(l.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-[#1f2d42] rounded-xl p-6 space-y-6">
            <div className="border-b border-[#1f2d42] pb-4">
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Operational & AI Parameters
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure local application runtime options without modifying source code
              </p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Operational Posture Status
                </label>
                <select
                  value={settingForm.system_posture}
                  onChange={(e) => setSettingForm({ ...settingForm, system_posture: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Normal Monitoring">Normal Monitoring (Routine)</option>
                  <option value="Elevated Response Active">Elevated Response Active (Advisory)</option>
                  <option value="Code Red Disaster Response">Code Red Disaster Response (Critical)</option>
                  <option value="Post-Disaster Reconstruction Phase">Post-Disaster Reconstruction Phase</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Local Ollama Model Tag
                </label>
                <input
                  type="text"
                  required
                  value={settingForm.ollama_model}
                  onChange={(e) => setSettingForm({ ...settingForm, ollama_model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Model verified on local RTX 3050 GPU (must exist in `ollama list`)
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Ollama CLI Execution Timeout ({settingForm.ollama_timeout} seconds)
                </label>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={settingForm.ollama_timeout}
                  onChange={(e) => setSettingForm({ ...settingForm, ollama_timeout: e.target.value })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Read-only Hardware Summary */}
              <div className="pt-4 border-t border-[#1f2d42] grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/60 border border-[#1f2d42] rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    GPU Acceleration
                  </span>
                  <div className="font-semibold text-slate-200">NVIDIA RTX 3050 Laptop</div>
                  <div className="text-[10px] text-emerald-400">100% VRAM Offload Active</div>
                </div>

                <div className="p-3 bg-slate-900/60 border border-[#1f2d42] rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    Local Database
                  </span>
                  <div className="font-semibold text-slate-200">SQLite 3 (33 Tables)</div>
                  <div className="text-[10px] text-cyan-400">data/database/sentinel.db</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-medium transition shadow"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f2d42] pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                Register Incident Operator
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sdrf_leader"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Major R. K. Singh"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sdrf@sentinel.local"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Disaster Administrator">Disaster Administrator</option>
                  <option value="Emergency Coordinator">Emergency Coordinator</option>
                  <option value="Rescue Team Member">Rescue Team Member</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f2d42] pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Modify User Role
                </h3>
                <p className="text-xs text-slate-400">@{showRoleModal.username}</p>
              </div>
              <button onClick={() => setShowRoleModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">New Role</label>
                <select
                  value={newRoleValue}
                  onChange={(e) => setNewRoleValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-[#1f2d42] rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Disaster Administrator">Disaster Administrator</option>
                  <option value="Emergency Coordinator">Emergency Coordinator</option>
                  <option value="Rescue Team Member">Rescue Team Member</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2d42]">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                >
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

