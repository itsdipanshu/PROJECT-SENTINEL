import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Users,
  Package,
  Home,
  Building2,
  Bell,
  Plus,
  RefreshCw,
  Search,
  X,
  LifeBuoy,
} from 'lucide-react';
import { Badge } from '../components/Badge';

export type OperationsTab = 'incidents' | 'rescue' | 'resources' | 'shelters' | 'hospitals' | 'alerts';

interface OperationsHubProps {
  initialTab?: OperationsTab;
  onNavigateToAI: (prompt?: string, autoSend?: boolean) => void;
}

export const OperationsHub: React.FC<OperationsHubProps> = ({
  initialTab = 'incidents',
  onNavigateToAI,
}) => {
  const [activeTab, setActiveTab] = useState<OperationsTab>(initialTab);

  // Data states
  const [incidents, setIncidents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [rescueOps, setRescueOps] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Filter & Search states
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  // Modals
  const [showNewIncidentModal, setShowNewIncidentModal] = useState<boolean>(false);
  const [showAdjustResourceModal, setShowAdjustResourceModal] = useState<any | null>(null);
  const [showShelterModal, setShowShelterModal] = useState<any | null>(null);
  const [showHospitalModal, setShowHospitalModal] = useState<any | null>(null);
  const [showBroadcastAlertModal, setShowBroadcastAlertModal] = useState<boolean>(false);
  const [showDeployTeamModal, setShowDeployTeamModal] = useState<any | null>(null);

  // Form states
  const [newIncidentForm, setNewIncidentForm] = useState({
    title: '',
    disaster_category: 'Flood',
    description: '',
    location_name: '',
    latitude: 26.52,
    longitude: 87.01,
    severity: 'High',
    affected_population: 500,
  });

  const [resourceAdjustForm, setResourceAdjustForm] = useState({
    transaction_type: 'Allocation',
    delta_quantity: 50,
    notes: 'Dispatched to relief camp',
  });

  const [shelterUpdateForm, setShelterUpdateForm] = useState({
    current_occupancy: 0,
    remarks: 'Field intake update',
  });

  const [hospitalUpdateForm, setHospitalUpdateForm] = useState({
    available_beds: 0,
    available_ambulances: 0,
  });

  const [alertForm, setAlertForm] = useState({
    title: '',
    alert_type: 'Flood warning',
    severity: 'Critical',
    message: '',
    location_name: '',
  });

  const [deployTeamForm, setDeployTeamForm] = useState({
    incident_id: 1,
    team_id: 1,
    priority: 'Critical',
    objectives: 'Conduct search & rescue across low-lying wards.',
  });

  const fetchAllData = async () => {
    try {
      const [incRes, teamsRes, opsRes, resRes, shelRes, hospRes, alertsRes] = await Promise.all([
        fetch('http://localhost:8000/api/operations/incidents'),
        fetch('http://localhost:8000/api/operations/teams'),
        fetch('http://localhost:8000/api/operations/rescue-ops'),
        fetch('http://localhost:8000/api/operations/resources'),
        fetch('http://localhost:8000/api/operations/shelters'),
        fetch('http://localhost:8000/api/operations/hospitals'),
        fetch('http://localhost:8000/api/operations/alerts'),
      ]);

      if (incRes.ok) setIncidents(await incRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (opsRes.ok) setRescueOps(await opsRes.json());
      if (resRes.ok) setResources(await resRes.json());
      if (shelRes.ok) setShelters(await shelRes.json());
      if (hospRes.ok) setHospitals(await hospRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (err) {
      console.error('Failed to load operations data:', err);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUpdateIncidentStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/operations/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_status: newStatus,
          update_text: `Status changed to ${newStatus} via Command Center Operations Hub.`,
          updated_by: 'EOC Commander',
        }),
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error('Error updating incident status:', err);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/operations/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncidentForm),
      });
      if (res.ok) {
        setShowNewIncidentModal(false);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error creating incident:', err);
    }
  };

  const handleAdjustResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustResourceModal) return;
    try {
      const res = await fetch(`http://localhost:8000/api/operations/resources/${showAdjustResourceModal.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceAdjustForm),
      });
      if (res.ok) {
        setShowAdjustResourceModal(null);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error adjusting resource:', err);
    }
  };

  const handleUpdateShelterOccupancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showShelterModal) return;
    try {
      const res = await fetch(`http://localhost:8000/api/operations/shelters/${showShelterModal.id}/occupancy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shelterUpdateForm),
      });
      if (res.ok) {
        setShowShelterModal(null);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error updating shelter:', err);
    }
  };

  const handleUpdateHospitalAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showHospitalModal) return;
    try {
      const res = await fetch(`http://localhost:8000/api/operations/hospitals/${showHospitalModal.id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hospitalUpdateForm),
      });
      if (res.ok) {
        setShowHospitalModal(null);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error updating hospital:', err);
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/operations/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertForm),
      });
      if (res.ok) {
        setShowBroadcastAlertModal(false);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error broadcasting alert:', err);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/operations/alerts/${id}/status?status=Resolved`, {
        method: 'PATCH',
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const handleDeployTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/operations/rescue-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployTeamForm),
      });
      if (res.ok) {
        setShowDeployTeamModal(null);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error deploying team:', err);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus = incidentStatusFilter === 'All' || inc.status === incidentStatusFilter;
    const matchesSearch =
      !searchQuery ||
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, count: incidents.length },
    { id: 'rescue', label: 'Rescue & Teams', icon: Users, count: teams.length },
    { id: 'resources', label: 'Resource Stock', icon: Package, count: resources.length },
    { id: 'shelters', label: 'Shelters', icon: Home, count: shelters.length },
    { id: 'hospitals', label: 'Hospitals', icon: Building2, count: hospitals.length },
    { id: 'alerts', label: 'Alert Center', icon: Bell, count: alerts.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-mono text-white tracking-wide uppercase">
              EMERGENCY OPERATIONS COMMAND HUB
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Live multi-agency coordination module. Manage incident lifecycle, deploy NDRF/SDRF rescue teams,
            ration emergency resources, monitor relief shelter capacity, and coordinate hospital trauma beds.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition"
          title="Refresh Operations Hub"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Operations Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OperationsTab)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition ${isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-slate-800 border border-[#1f2d42]'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INCIDENTS MANAGEMENT */}
      {activeTab === 'incidents' && (
        <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1f2d42]">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search incidents by title or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0d131f] border border-[#1f2d42] rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white outline-none focus:border-cyan-500 w-64"
                />
              </div>

              <select
                value={incidentStatusFilter}
                onChange={(e) => setIncidentStatusFilter(e.target.value)}
                className="bg-[#0d131f] border border-[#1f2d42] rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Response Active">Response Active</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <button
              onClick={() => setShowNewIncidentModal(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-cyan-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Incident</span>
            </button>
          </div>

          {/* Incidents Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1f2d42] text-slate-400">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Title & Category</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Affected Pop.</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-bold text-cyan-300">{inc.incident_id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{inc.title}</div>
                      <div className="text-[10px] text-slate-400">{inc.disaster_category}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-200">{inc.location_name}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={inc.severity === 'Critical' ? 'critical' : inc.severity === 'High' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {inc.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-300">~{inc.affected_population?.toLocaleString()}</td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inc.status}
                        onChange={(e) => handleUpdateIncidentStatus(inc.id, e.target.value)}
                        className="bg-[#0d131f] border border-[#1f2d42] rounded px-2 py-1 text-[11px] font-mono text-cyan-300 outline-none"
                      >
                        <option value="Reported">Reported</option>
                        <option value="Under Verification">Under Verification</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Response Active">Response Active</option>
                        <option value="Monitoring">Monitoring</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onNavigateToAI(
                          `Perform emergency AI triage for field incident: '${inc.title}' in ${inc.location_name} (Category: ${inc.disaster_category}, Severity: ${inc.severity}, Status: ${inc.status}, Affected: ~${inc.affected_population?.toLocaleString()}). Provide immediate casualty threat assessment, NDMA protocol, and dispatch priorities.`,
                          true
                        )}
                        className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 rounded text-[10px] font-mono transition"
                      >
                        AI Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RESCUE OPERATIONS */}
      {activeTab === 'rescue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                      {t.team_id}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{t.name}</h3>
                  </div>
                  <Badge variant={t.status === 'Available' ? 'success' : 'warning'} size="sm">
                    {t.status}
                  </Badge>
                </div>

                <div className="text-xs font-mono text-slate-300 space-y-1">
                  <div>👤 Commander: <span className="text-white">{t.leader_name}</span></div>
                  <div>📞 Contact: <span className="text-slate-400">{t.contact_number}</span></div>
                  <div>👥 Rescuers: <span className="text-white">{t.member_count} members</span></div>
                  <div>📍 Base: <span className="text-slate-400">{t.base_location}</span></div>
                </div>

                <div className="pt-2 border-t border-[#1f2d42] flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono">{t.team_type} Unit</span>
                  <button
                    onClick={() => {
                      setDeployTeamForm({ ...deployTeamForm, team_id: t.id });
                      setShowDeployTeamModal(t);
                    }}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono transition"
                  >
                    Deploy Team
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active Missions Log */}
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400 mb-4">
              Active Rescue Operations Log ({rescueOps.length})
            </h3>
            <div className="space-y-3">
              {rescueOps.map((op) => (
                <div
                  key={op.id}
                  className="p-3.5 bg-[#0d131f] border border-[#1f2d42] rounded-xl flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white">{op.operation_id} – {op.incident_title}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Assigned: {op.team_name} • Priority: {op.priority}
                    </div>
                  </div>
                  <Badge variant={op.status === 'In Progress' ? 'critical' : 'success'} size="sm">
                    {op.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESOURCE INVENTORY */}
      {activeTab === 'resources' && (
        <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#1f2d42]">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
              Centralized Emergency Stockpile
            </h3>
            <span className="text-xs font-mono text-slate-400">Auto-prevent negative inventory</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1f2d42] text-slate-400">
                  <th className="py-2.5 px-3">Resource ID</th>
                  <th className="py-2.5 px-3">Supply Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Available / Total</th>
                  <th className="py-2.5 px-3">Storage Depot</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => {
                  const pct = Math.round((res.available_quantity / max(1, res.quantity)) * 100);
                  return (
                    <tr key={res.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-cyan-300">{res.resource_id}</td>
                      <td className="py-3 px-3 font-bold text-white">{res.name}</td>
                      <td className="py-3 px-3 text-slate-300">{res.category}</td>
                      <td className="py-3 px-3">
                        <div className="text-white font-bold">
                          {res.available_quantity} / {res.quantity} {res.unit}
                        </div>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{res.storage_location}</td>
                      <td className="py-3 px-3">
                        <Badge variant="success" size="sm">{res.condition}</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setShowAdjustResourceModal(res)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-[11px] font-mono transition"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHELTERS */}
      {activeTab === 'shelters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelters.map((s) => {
            const occRate = Math.round((s.current_occupancy / max(1, s.total_capacity)) * 100);
            return (
              <div
                key={s.id}
                className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{s.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">📍 {s.location_name}</p>
                  </div>
                  <Badge variant={s.status === 'Operational' ? 'success' : 'critical'} size="sm">
                    {s.status}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Occupants: {s.current_occupancy}</span>
                    <span className="text-cyan-400 font-bold">{s.available_capacity} free beds</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${occRate > 80 ? 'bg-red-500' : 'bg-cyan-400'}`}
                      style={{ width: `${occRate}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1f2d42] flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">👤 {s.contact_person}</span>
                  <button
                    onClick={() => {
                      setShelterUpdateForm({ current_occupancy: s.current_occupancy, remarks: '' });
                      setShowShelterModal(s);
                    }}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs transition"
                  >
                    Adjust Intake
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 5: HOSPITALS */}
      {activeTab === 'hospitals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((h) => (
            <div
              key={h.id}
              className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{h.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">📍 {h.address}</p>
                </div>
                <Badge variant="success" size="sm">{h.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#0d131f] p-3 rounded-lg border border-[#1f2d42]">
                <div>
                  <div className="text-slate-400">Available Beds:</div>
                  <div className="text-emerald-400 font-bold text-base">{h.available_beds} / {h.total_beds}</div>
                </div>
                <div>
                  <div className="text-slate-400">Ambulances Ready:</div>
                  <div className="text-cyan-400 font-bold text-base">{h.available_ambulances} units</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1f2d42] flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">📞 {h.contact_number}</span>
                <button
                  onClick={() => {
                    setHospitalUpdateForm({ available_beds: h.available_beds, available_ambulances: h.available_ambulances });
                    setShowHospitalModal(h);
                  }}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs transition"
                >
                  Update Beds
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#1f2d42]">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
              Active Broadcast Warning Feeds
            </h3>
            <button
              onClick={() => setShowBroadcastAlertModal(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-semibold transition"
            >
              Broadcast New Emergency Alert
            </button>
          </div>

          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="p-4 bg-[#0d131f] border border-[#1f2d42] rounded-xl flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-mono text-white text-xs">{a.title}</span>
                    <Badge variant={a.severity === 'Critical' ? 'critical' : 'warning'} size="sm">
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">{a.message}</p>
                  <div className="text-[10px] font-mono text-slate-500">📍 {a.location_name} • Broadcast: {new Date(a.created_at).toLocaleTimeString()}</div>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  {a.status === 'Active' ? (
                    <button
                      onClick={() => handleResolveAlert(a.id)}
                      className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded text-xs font-mono transition"
                    >
                      Resolve Alert
                    </button>
                  ) : (
                    <Badge variant="neutral" size="sm">Resolved</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Register New Incident */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateIncident}
            className="bg-[#111827] border border-[#1f2d42] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#1f2d42]">
              <h3 className="text-sm font-bold font-mono text-white">REGISTER EMERGENCY INCIDENT</h3>
              <button onClick={() => setShowNewIncidentModal(false)} type="button" className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Incident Title</label>
              <input
                type="text"
                required
                value={newIncidentForm.title}
                onChange={(e) => setNewIncidentForm({ ...newIncidentForm, title: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Disaster Category</label>
                <select
                  value={newIncidentForm.disaster_category}
                  onChange={(e) => setNewIncidentForm({ ...newIncidentForm, disaster_category: e.target.value })}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
                >
                  <option value="Flood">Flood</option>
                  <option value="Heavy Rainfall">Heavy Rainfall</option>
                  <option value="Landslide">Landslide</option>
                  <option value="Storm">Storm</option>
                  <option value="Heatwave">Heatwave</option>
                  <option value="Drought">Drought</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Severity</label>
                <select
                  value={newIncidentForm.severity}
                  onChange={(e) => setNewIncidentForm({ ...newIncidentForm, severity: e.target.value })}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Location Name</label>
              <input
                type="text"
                required
                value={newIncidentForm.location_name}
                onChange={(e) => setNewIncidentForm({ ...newIncidentForm, location_name: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={newIncidentForm.description}
                onChange={(e) => setNewIncidentForm({ ...newIncidentForm, description: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1f2d42]">
              <button
                type="button"
                onClick={() => setShowNewIncidentModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs font-mono"
              >
                Submit Incident
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Resource Stock Adjust */}
      {showAdjustResourceModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAdjustResource}
            className="bg-[#111827] border border-[#1f2d42] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#1f2d42]">
              <h3 className="text-sm font-bold font-mono text-white">ADJUST STOCK: {showAdjustResourceModal.name}</h3>
              <button onClick={() => setShowAdjustResourceModal(null)} type="button" className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Adjustment Type</label>
              <select
                value={resourceAdjustForm.transaction_type}
                onChange={(e) => setResourceAdjustForm({ ...resourceAdjustForm, transaction_type: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
              >
                <option value="Allocation">Allocation (Reserve for mission)</option>
                <option value="Consumption">Consumption (Deplete from stock)</option>
                <option value="Restock">Restock (Add arriving supplies)</option>
                <option value="Return">Return (Return unused gear)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Quantity ({showAdjustResourceModal.unit})</label>
              <input
                type="number"
                min="1"
                required
                value={resourceAdjustForm.delta_quantity}
                onChange={(e) => setResourceAdjustForm({ ...resourceAdjustForm, delta_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1f2d42]">
              <button
                type="button"
                onClick={() => setShowAdjustResourceModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs font-mono"
              >
                Confirm Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Shelter Occupancy */}
      {showShelterModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleUpdateShelterOccupancy}
            className="bg-[#111827] border border-[#1f2d42] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#1f2d42]">
              <h3 className="text-sm font-bold font-mono text-white">UPDATE INTAKE: {showShelterModal.name}</h3>
              <button onClick={() => setShowShelterModal(null)} type="button" className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Current Headcount (Max Capacity: {showShelterModal.total_capacity})
              </label>
              <input
                type="number"
                min="0"
                required
                value={shelterUpdateForm.current_occupancy}
                onChange={(e) => setShelterUpdateForm({ ...shelterUpdateForm, current_occupancy: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1f2d42]">
              <button
                type="button"
                onClick={() => setShowShelterModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs font-mono"
              >
                Save Occupancy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Hospital Beds */}
      {showHospitalModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleUpdateHospitalAvailability}
            className="bg-[#111827] border border-[#1f2d42] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#1f2d42]">
              <h3 className="text-sm font-bold font-mono text-white">UPDATE HOSPITAL: {showHospitalModal.name}</h3>
              <button onClick={() => setShowHospitalModal(null)} type="button" className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Available Beds</label>
                <input
                  type="number"
                  min="0"
                  max={showHospitalModal.total_beds}
                  required
                  value={hospitalUpdateForm.available_beds}
                  onChange={(e) => setHospitalUpdateForm({ ...hospitalUpdateForm, available_beds: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Available Ambulances</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={hospitalUpdateForm.available_ambulances}
                  onChange={(e) => setHospitalUpdateForm({ ...hospitalUpdateForm, available_ambulances: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1f2d42]">
              <button
                type="button"
                onClick={() => setShowHospitalModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs font-mono"
              >
                Save Availability
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Broadcast Emergency Alert */}
      {showBroadcastAlertModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleBroadcastAlert}
            className="bg-[#111827] border border-red-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#1f2d42]">
              <h3 className="text-sm font-bold font-mono text-red-400">BROADCAST EMERGENCY ALERT</h3>
              <button onClick={() => setShowBroadcastAlertModal(false)} type="button" className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Alert Headline</label>
              <input
                type="text"
                required
                value={alertForm.title}
                onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Alert Category</label>
                <select
                  value={alertForm.alert_type}
                  onChange={(e) => setAlertForm({ ...alertForm, alert_type: e.target.value })}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
                >
                  <option value="Flood warning">Flood warning</option>
                  <option value="Heavy rainfall alert">Heavy rainfall alert</option>
                  <option value="Landslide warning">Landslide warning</option>
                  <option value="Storm alert">Storm alert</option>
                  <option value="Shelter capacity warning">Shelter capacity warning</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Severity Level</label>
                <select
                  value={alertForm.severity}
                  onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Information">Information</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Location Affected</label>
              <input
                type="text"
                required
                value={alertForm.location_name}
                onChange={(e) => setAlertForm({ ...alertForm, location_name: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Broadcast Directive Message</label>
              <textarea
                required
                rows={3}
                value={alertForm.message}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1f2d42]">
              <button
                type="button"
                onClick={() => setShowBroadcastAlertModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-xs font-mono"
              >
                Broadcast Alert Now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Deploy Team */}
      {showDeployTeamModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleDeployTeam}
            className="bg-[#111827] border border-[#1f2d42] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#1f2d42]">
              <h3 className="text-sm font-bold font-mono text-white">DEPLOY: {showDeployTeamModal.name}</h3>
              <button onClick={() => setShowDeployTeamModal(null)} type="button" className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Emergency Incident</label>
              <select
                value={deployTeamForm.incident_id}
                onChange={(e) => setDeployTeamForm({ ...deployTeamForm, incident_id: parseInt(e.target.value) })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.incident_id}: {inc.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Mission Priority</label>
              <select
                value={deployTeamForm.priority}
                onChange={(e) => setDeployTeamForm({ ...deployTeamForm, priority: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Mission Objectives</label>
              <textarea
                required
                rows={3}
                value={deployTeamForm.objectives}
                onChange={(e) => setDeployTeamForm({ ...deployTeamForm, objectives: e.target.value })}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1f2d42]">
              <button
                type="button"
                onClick={() => setShowDeployTeamModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs font-mono"
              >
                Confirm Deployment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Incident Details */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#1f2d42]">
              <div>
                <span className="text-cyan-400 font-bold font-mono text-xs">{selectedIncident.incident_id}</span>
                <h3 className="text-sm font-bold font-mono text-white">{selectedIncident.title}</h3>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-2">
              <div>📍 Location: {selectedIncident.location_name}</div>
              <div>⚠️ Severity: {selectedIncident.severity}</div>
              <div>👥 Affected Population: ~{selectedIncident.affected_population?.toLocaleString()}</div>
              <div>📝 Description: {selectedIncident.description}</div>
              {selectedIncident.estimated_damage && <div>🏚️ Damage: {selectedIncident.estimated_damage}</div>}
            </div>
            <div className="flex justify-between pt-3 border-t border-[#1f2d42]">
              <button
                onClick={() => {
                  const inc = selectedIncident;
                  setSelectedIncident(null);
                  onNavigateToAI(
                    `Perform detailed emergency incident analysis for '${inc.title}' in ${inc.location_name}:\n- Category: ${inc.disaster_category}\n- Severity: ${inc.severity}\n- Status: ${inc.status}\n- Affected: ~${inc.affected_population?.toLocaleString()} citizens\n- Description: ${inc.description}\n\nWhat are the critical life-safety hazards, NDRF deployment requirements, and immediate relief actions?`,
                    true
                  );
                }}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-medium transition"
              >
                Analyze with Sentinel AI
              </button>
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function max(a: number, b: number): number {
  return a > b ? a : b;
}
