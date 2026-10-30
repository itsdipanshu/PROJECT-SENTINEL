import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Users,
  Home,
  Building2,
  Package,
  Bell,
  RefreshCw,
  Sparkles,
  Database,
  CheckCircle2,
  AlertOctagon,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

interface DashboardStats {
  total_incidents: number;
  active_emergencies: number;
  critical_risk_locations: number;
  high_risk_locations: number;
  available_rescue_teams: number;
  deployed_rescue_teams: number;
  total_shelters: number;
  total_shelter_capacity: number;
  current_shelter_occupancy: number;
  available_shelter_capacity: number;
  total_hospitals: number;
  total_beds: number;
  available_hospital_beds: number;
  available_ambulances: number;
  total_resources_items: number;
  total_available_supplies: number;
  active_alerts_count: number;
  critical_alerts_count: number;
  recovery_projects_count: number;
  is_demo_loaded: boolean;
}

interface IncidentItem {
  id: number;
  incident_id: string;
  title: string;
  category: string;
  location: string;
  severity: string;
  status: string;
  reported_at: string;
  affected_population: number;
  is_demo: boolean;
}

interface AlertItem {
  id: number;
  alert_id: string;
  title: string;
  type: string;
  severity: string;
  message: string;
  location: string;
  created_at: string;
  is_demo: boolean;
}

interface CommandCenterProps {
  onNavigateToAI: (prompt?: string, autoSend?: boolean) => void;
  onNavigateToIncidents: () => void;
  onNavigateToMap: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigateToAI,
  onNavigateToIncidents,
  onNavigateToMap,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<IncidentItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoActionLoading, setDemoActionLoading] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes, incidentsRes, alertsRes] = await Promise.all([
        fetch('http://localhost:8000/api/dashboard/stats'),
        fetch('http://localhost:8000/api/dashboard/charts'),
        fetch('http://localhost:8000/api/dashboard/recent-incidents'),
        fetch('http://localhost:8000/api/dashboard/alerts'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (chartsRes.ok) setCharts(await chartsRes.json());
      if (incidentsRes.ok) setRecentIncidents(await incidentsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDemoData = async (load: boolean) => {
    try {
      setDemoActionLoading(true);
      const endpoint = load
        ? 'http://localhost:8000/api/dashboard/demo/load'
        : 'http://localhost:8000/api/dashboard/demo/clear';
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Error toggling demo data:', err);
    } finally {
      setDemoActionLoading(false);
    }
  };

  const SEVERITY_COLORS: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f59e0b',
    Moderate: '#3b82f6',
    Low: '#10b981',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Scenario Indicator & Demo Control */}
      <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold font-mono uppercase text-white tracking-wider">
                Emergency Command Operations State
              </span>
              {stats?.is_demo_loaded ? (
                <Badge variant="demo" size="sm">DEMO: BIHAR FLOOD SCENARIO</Badge>
              ) : (
                <Badge variant="success" size="sm">LIVE DATABASE MODE</Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time synchronization with local SQLite database (<span className="text-cyan-400 font-mono">33 tables</span>) • Local Ollama Gemma AI Active
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-end md:self-auto">
          {stats?.is_demo_loaded ? (
            <button
              onClick={() => handleToggleDemoData(false)}
              disabled={demoActionLoading}
              className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-lg text-xs font-mono font-medium transition flex items-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{demoActionLoading ? 'Clearing...' : 'Clear Demo Dataset'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleDemoData(true)}
              disabled={demoActionLoading}
              className="px-3.5 py-2 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-mono font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{demoActionLoading ? 'Loading...' : 'Load Bihar Flood Demo'}</span>
            </button>
          )}

          <button
            onClick={fetchDashboardData}
            title="Refresh database metrics"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 8 Primary Operational KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Emergencies"
          value={stats?.active_emergencies ?? 0}
          subtitle={`${stats?.total_incidents ?? 0} total registered incidents`}
          icon={AlertTriangle}
          variant="red"
          badge={stats?.active_emergencies ? 'Response Active' : 'All Clear'}
        />
        <StatCard
          title="Critical Risk Locations"
          value={stats?.critical_risk_locations ?? 0}
          subtitle={`${stats?.high_risk_locations ?? 0} locations on high alert`}
          icon={AlertOctagon}
          variant="amber"
          badge="GIS Monitored"
        />
        <StatCard
          title="Rescue Teams Available"
          value={stats?.available_rescue_teams ?? 0}
          subtitle={`${stats?.deployed_rescue_teams ?? 0} units deployed in field`}
          icon={Users}
          variant="emerald"
          badge="NDRF / SDRF"
        />
        <StatCard
          title="Shelter Capacity Ready"
          value={stats?.available_shelter_capacity ?? 0}
          subtitle={`${stats?.current_shelter_occupancy ?? 0} citizens sheltered`}
          icon={Home}
          variant="blue"
          badge={`${stats?.total_shelters ?? 0} Camps Active`}
        />
        <StatCard
          title="Hospital Beds Available"
          value={stats?.available_hospital_beds ?? 0}
          subtitle={`${stats?.available_ambulances ?? 0} ambulances on standby`}
          icon={Building2}
          variant="emerald"
          badge="24/7 Trauma Care"
        />
        <StatCard
          title="Emergency Stockpile"
          value={stats?.total_available_supplies ? `${Math.round(stats.total_available_supplies).toLocaleString()} units` : '0 units'}
          subtitle={`${stats?.total_resources_items ?? 0} resource categories`}
          icon={Package}
          variant="cyan"
          badge="Rationed"
        />
        <StatCard
          title="Emergency Alerts"
          value={stats?.active_alerts_count ?? 0}
          subtitle={`${stats?.critical_alerts_count ?? 0} red critical alerts`}
          icon={Bell}
          variant="red"
          badge="Broadcast Active"
        />
        <StatCard
          title="Recovery Projects"
          value={stats?.recovery_projects_count ?? 0}
          subtitle="Infrastructure restoration tracking"
          icon={LifeBuoy}
          variant="cyan"
          badge="Phase 3 Verified"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incidents by Disaster Category */}
        <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2d42]">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
              Incidents Distribution by Disaster Type
            </h3>
            <Badge variant="info" size="sm">SQLite Data</Badge>
          </div>
          <div className="h-64 mt-4">
            {charts?.incidents_by_category && charts.incidents_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.incidents_by_category}>
                  <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f2d42', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Incidents Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 font-mono">
                No incidents recorded yet. Load demo dataset to view analytics.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Shelter Occupancy vs Remaining Capacity */}
        <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2d42]">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
              Relief Camp Occupancy vs Available Capacity
            </h3>
            <Badge variant="success" size="sm">Shelter Intake</Badge>
          </div>
          <div className="h-64 mt-4">
            {charts?.shelters && charts.shelters.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.shelters}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f2d42', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="occupancy" stackId="a" fill="#f59e0b" name="Current Occupants" />
                  <Bar dataKey="available" stackId="a" fill="#10b981" name="Available Spaces" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 font-mono">
                No shelter data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Split Operational Feeds: Active Alerts & Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Active Emergency Alerts Panel */}
        <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2d42]">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                  Active Emergency Alerts
                </h3>
              </div>
              <Badge variant="critical" size="sm">{alerts.length} Active</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  No critical alerts currently triggered.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 bg-[#0d131f] border border-[#1f2d42] rounded-xl hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: SEVERITY_COLORS[alert.severity] || '#3b82f6' }}
                        />
                        <span className="text-xs font-bold font-mono text-white">
                          {alert.title}
                        </span>
                      </div>
                      <Badge
                        variant={alert.severity === 'Critical' ? 'critical' : alert.severity === 'High' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                      <span>📍 {alert.location}</span>
                      <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#1f2d42] flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500">EOC Broadcast Priority</span>
            <button
              onClick={() => onNavigateToAI(
                "Please review all currently active emergency alerts in the Command Center. What are the key priority actions for evacuation and NDRF rescue team prepositioning across the affected sectors?",
                true
              )}
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>Consult Sentinel AI on Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Recent Field Incidents Log */}
        <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2d42]">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                  Field Incidents Feed
                </h3>
              </div>
              <button
                onClick={onNavigateToIncidents}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>View All ({stats?.total_incidents ?? 0})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentIncidents.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No active incidents recorded. Load demonstration scenario to populate.
                </div>
              ) : (
                recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 bg-[#0d131f] border border-[#1f2d42] rounded-xl hover:border-cyan-500/30 transition group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                          {inc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          📍 {inc.location} • {inc.category}
                        </div>
                      </div>
                      <Badge
                        variant={inc.status === 'Response Active' ? 'critical' : inc.status === 'Confirmed' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {inc.status}
                      </Badge>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                      <span>Affected: ~{inc.affected_population.toLocaleString()} people</span>
                      <button
                        onClick={() => onNavigateToAI(
                          `Perform emergency AI triage for incident: '${inc.title}' in ${inc.location} (Category: ${inc.category}, Severity: ${inc.severity}, Status: ${inc.status}, Affected: ~${inc.affected_population.toLocaleString()} people). Provide immediate casualty threat level, NDMA response protocol, and resource dispatch priority.`,
                          true
                        )}
                        className="text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Triage</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#1f2d42] flex justify-between items-center text-xs font-mono">
            <button
              onClick={onNavigateToMap}
              className="text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <span>View GIS Spatial Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToIncidents}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-semibold transition"
            >
              Manage Incidents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
