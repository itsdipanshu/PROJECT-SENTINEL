import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Bell,
  Database,
  RefreshCw,
  UserCheck,
  Shield,
  LogOut,
  Settings,
  ChevronDown,
  X,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';
import { Badge } from './Badge';
import type { NavItem } from './Sidebar';

export interface CurrentUser {
  username: string;
  full_name: string;
  role: string;
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
  is_demo?: boolean;
}

interface HeaderProps {
  pageTitle: string;
  isBackendConnected: boolean;
  ollamaModel: string;
  isOllamaRunning: boolean;
  onRefresh?: () => void;
  activeAlertCount?: number;
  onNavigate?: (nav: NavItem) => void;
  currentUser?: CurrentUser;
  onSwitchUser?: (user: CurrentUser) => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  isBackendConnected,
  ollamaModel,
  isOllamaRunning,
  onRefresh,
  activeAlertCount = 0,
  onNavigate,
  currentUser = {
    username: 'admin',
    full_name: 'Admin Commander',
    role: 'Super Administrator'
  },
  onSwitchUser,
  onSignOut
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Available operational user profiles for simulation
  const availableUsers: CurrentUser[] = [
    { username: 'admin', full_name: 'Admin Commander', role: 'Super Administrator' },
    { username: 'coordinator', full_name: 'Senior Coordinator', role: 'Emergency Coordinator' },
    { username: 'responder', full_name: 'NDRF 9th Bn Leader', role: 'Rescue Team Member' },
    { username: 'analyst', full_name: 'GIS Risk Analyst', role: 'Data Analyst' },
    { username: 'viewer', full_name: 'Disaster Observer', role: 'Viewer' }
  ];

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'medium',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time alerts when notification dropdown opens
  useEffect(() => {
    if (showNotifications) {
      setLoadingAlerts(true);
      fetch('http://localhost:8000/api/dashboard/alerts?limit=6')
        .then((res) => res.json())
        .then((data) => setAlerts(data))
        .catch(() => setAlerts([]))
        .finally(() => setLoadingAlerts(false));
    }
  }, [showNotifications]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalUnreadCount = Math.max(activeAlertCount, alerts.length);

  return (
    <>
      <header className="h-16 bg-[#0d131f]/90 backdrop-blur border-b border-[#1f2d42] px-6 flex items-center justify-between fixed top-0 right-0 left-64 z-20">
        {/* Title & Path */}
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            {pageTitle}
          </h2>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">/ EOC MONITORING</span>
        </div>

        {/* Real-time Status Badges & Action Buttons */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Real-time Clock */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>{currentTime || 'Syncing...'}</span>
          </div>

          {/* Local Database Status */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <Badge variant={isBackendConnected ? 'success' : 'critical'} size="sm">
              {isBackendConnected ? 'SQLite Live' : 'DB Disconnected'}
            </Badge>
          </div>

          {/* Local AI Status */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <Badge variant={isOllamaRunning ? 'info' : 'warning'} size="sm">
              {isOllamaRunning ? `Ollama (${ollamaModel})` : 'AI Idle'}
            </Badge>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh system state"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              title="Emergency Notifications Center"
              className={`p-1.5 rounded-lg border transition relative ${
                showNotifications
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center font-mono animate-pulse">
                  {totalUnreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#111827] border border-[#1f2d42] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 border-b border-[#1f2d42] flex items-center justify-between bg-[#0c121e]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold font-mono text-white">Emergency Broadcasts</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-800">
                      LIVE
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#1f2d42]/60">
                  {loadingAlerts ? (
                    <div className="p-6 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      Loading active broadcasts...
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-slate-400">
                      No active emergency alerts at this time.
                    </div>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="p-3 hover:bg-slate-800/40 transition text-left space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              a.severity === 'Critical'
                                ? 'bg-red-950/80 text-red-300 border border-red-800'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {a.severity} • {a.type}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-100">{a.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{a.message}</p>
                        <div className="text-[10px] text-cyan-400/90 font-mono">📍 {a.location}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 border-t border-[#1f2d42] bg-[#0c121e] flex justify-between items-center text-xs font-mono">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate?.('alerts');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>View Alert Center</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account / Profile Dropdown Button */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              title="User Account & Security"
              className={`flex items-center space-x-2 pl-2 border-l border-slate-800 transition py-1 rounded-lg ${
                showUserMenu ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                  <span>{currentUser.full_name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] font-mono text-cyan-400 leading-tight">
                  {currentUser.role}
                </div>
              </div>
            </button>

            {/* User Account Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#111827] border border-[#1f2d42] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Profile Header */}
                <div className="p-4 bg-gradient-to-br from-[#0c121e] to-slate-900 border-b border-[#1f2d42]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
                      {currentUser.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{currentUser.full_name}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">@{currentUser.username}</div>
                      <span className="inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Local Session Active (100% Offline)</span>
                  </div>
                </div>

                {/* Switch Active Role Profile */}
                <div className="p-3 border-b border-[#1f2d42] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Quick Switch Operator Role:
                  </span>
                  {availableUsers.map((u) => (
                    <button
                      key={u.username}
                      onClick={() => {
                        onSwitchUser?.(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between transition ${
                        currentUser.username === u.username
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white">{u.full_name}</div>
                        <div className="text-[10px] text-slate-400">{u.role}</div>
                      </div>
                      {currentUser.username === u.username && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick Shortcuts */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate?.('settings');
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center gap-2 transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>User Management & Security (Admin)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate?.('settings');
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center gap-2 transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>System Settings & Audit Log</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsLocked(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-mono text-amber-300 hover:bg-amber-950/40 rounded flex items-center gap-2 transition"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lock EOC Console Session</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut?.();
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-mono text-rose-300 hover:bg-rose-950/40 rounded flex items-center gap-2 transition border-t border-[#1f2d42]/60 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out to Login Screen</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* LOCK CONSOLE MODAL (When locked) */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-cyan-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white">EOC Console Locked</h3>
              <p className="text-xs text-slate-400 mt-1">
                Active session for <span className="text-cyan-300 font-semibold">{currentUser.full_name}</span> ({currentUser.role})
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-[#1f2d42] rounded-lg text-xs font-mono text-slate-400">
              Session is safely preserved in local SQLite database.
            </div>
            <button
              onClick={() => setIsLocked(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-600/30"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Console</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
