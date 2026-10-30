import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  MapPin,
  Bot,
  AlertTriangle,
  Users,
  Package,
  Home,
  Building2,
  Bell,
  FileText,
  LifeBuoy,
  Database,
  Settings,
  Shield,
} from 'lucide-react';

export type NavItem =
  | 'command-center'
  | 'risk-intelligence'
  | 'live-map'
  | 'ai-assistant'
  | 'incidents'
  | 'rescue'
  | 'resources'
  | 'shelters'
  | 'hospitals'
  | 'alerts'
  | 'reports'
  | 'recovery'
  | 'data-management'
  | 'settings';

interface SidebarProps {
  currentNav: NavItem;
  onNavigate: (nav: NavItem) => void;
  activeIncidentsCount?: number;
  criticalAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onNavigate,
  activeIncidentsCount = 0,
  criticalAlertsCount = 0,
}) => {
  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'risk-intelligence', label: 'Risk Intelligence', icon: ShieldAlert },
    { id: 'live-map', label: 'Live GIS Map', icon: MapPin },
    { id: 'ai-assistant', label: 'Sentinel AI Assistant', icon: Bot, isSpecial: true },
    { id: 'incidents', label: 'Emergency Incidents', icon: AlertTriangle, count: activeIncidentsCount },
    { id: 'rescue', label: 'Rescue Operations', icon: Users },
    { id: 'resources', label: 'Resource Inventory', icon: Package },
    { id: 'shelters', label: 'Shelters', icon: Home },
    { id: 'hospitals', label: 'Hospitals & Medical', icon: Building2 },
    { id: 'alerts', label: 'Alert Center', icon: Bell, count: criticalAlertsCount, countVariant: 'red' },
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
    { id: 'recovery', label: 'Post-Disaster Recovery', icon: LifeBuoy },
    { id: 'data-management', label: 'Data Management', icon: Database },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-[#1f2d42] flex flex-col h-screen fixed left-0 top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1f2d42] flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-white font-mono uppercase">
            SENTINEL
          </h1>
          <p className="text-[10px] text-cyan-400 font-mono tracking-tight">
            DISASTER INTELLIGENCE
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 py-1 font-semibold">
          Operations Core
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as NavItem)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.isSpecial && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 rounded">
                  GEMMA
                </span>
              )}
              {Boolean(item.count && item.count > 0) && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                    item.countVariant === 'red'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#1f2d42] bg-[#090d16]">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Engine Active</span>
          </div>
          <span className="text-slate-500 text-[10px]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

