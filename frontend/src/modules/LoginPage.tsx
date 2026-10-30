import { useState } from 'react';
import {
  Shield,
  Lock,
  UserCheck,
  Users,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
  systemName?: string;
}

export function LoginPage({ onLoginSuccess, systemName = 'PROJECT SENTINEL' }: LoginPageProps) {
  const [loginMode, setLoginMode] = useState<'admin' | 'user'>('admin');
  const [identifier, setIdentifier] = useState<string>('Dipanshu@gmail.com');
  const [password, setPassword] = useState<string>('Sentinel@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleModeSwitch = (mode: 'admin' | 'user') => {
    setLoginMode(mode);
    setErrorMessage(null);
    if (mode === 'admin') {
      setIdentifier('Dipanshu@gmail.com');
      setPassword('Sentinel@2026');
    } else {
      setIdentifier('coordinator');
      setPassword('Sentinel@2026');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      let res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier.trim(),
          password: password.trim()
        })
      });

      // If backend instance was started before email lookup reload, fallback to 'admin' for Dipanshu@gmail.com
      if (!res.ok && res.status === 401) {
        const idLower = identifier.trim().toLowerCase();
        if (idLower === 'dipanshu@gmail.com' || (loginMode === 'admin' && !idLower.includes('@'))) {
          const fallbackRes = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'admin',
              password: password.trim()
            })
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        }
      }

      if (res.ok) {
        const data = await res.json();
        const user: AuthUser = data.user;
        const token: string = data.access_token;

        // If in admin mode, verify they have Super Administrator role
        if (loginMode === 'admin' && user.role !== 'Super Administrator') {
          setErrorMessage('Access Denied: This terminal is strictly reserved for Admin Commander (Super Administrator).');
          setLoading(false);
          return;
        }

        // Store session
        localStorage.setItem('sentinel_auth_token', token);
        localStorage.setItem('sentinel_user', JSON.stringify(user));
        onLoginSuccess(user, token);
      } else {
        const err = await res.json();
        setErrorMessage(err.detail || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setErrorMessage(`Cannot connect to backend server: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickUser = (uname: string) => {
    setIdentifier(uname);
    setPassword('Sentinel@2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Tactical Grid & Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>DISASTER INTELLIGENCE NETWORK</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-mono tracking-wider text-white">
            {systemName}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Local Emergency Operations Center Authentication Gateway
          </p>
        </div>

        {/* Login Mode Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0c121e] border border-[#1f2d42] rounded-xl font-mono text-xs">
          <button
            type="button"
            onClick={() => handleModeSwitch('admin')}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition ${
              loginMode === 'admin'
                ? 'bg-gradient-to-r from-rose-900/60 to-red-950/80 text-rose-300 border border-rose-700/60 shadow-lg shadow-rose-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-rose-400" />
            <span>Admin Commander</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch('user')}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition ${
              loginMode === 'user'
                ? 'bg-gradient-to-r from-cyan-900/60 to-blue-950/80 text-cyan-300 border border-cyan-700/60 shadow-lg shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Operator & Field User</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-[#1f2d42] rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          {/* Header of Selected Mode */}
          <div className="border-b border-[#1f2d42] pb-4">
            {loginMode === 'admin' ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                    Super Administrator Terminal
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    MASTER CONTROL
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">Admin Commander Access</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Sole administrator authorized to grant, revoke, and assign user permissions:
                  <span className="text-cyan-300 ml-1 font-bold">Dipanshu@gmail.com</span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Operational Personnel Gateway
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    AUTHORIZED
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">Emergency Officer Sign In</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Coordinator, Responders, GIS Analysts & Observers
                </p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {loginMode === 'admin' ? 'Super Administrator Email / Username' : 'Personnel Username or Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={loginMode === 'admin' ? 'Dipanshu@gmail.com' : 'e.g. coordinator'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-[#1f2d42] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-[#1f2d42] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${
                loginMode === 'admin'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
              }`}
            >
              <span>{loading ? 'Authenticating...' : loginMode === 'admin' ? 'Authorize as Admin Commander' : 'Sign In to Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Pre-Fill Options */}
          <div className="pt-3 border-t border-[#1f2d42] space-y-2">
            <span className="text-[10px] text-slate-400 font-mono block">
              Quick Pre-Fill Credentials:
            </span>
            {loginMode === 'admin' ? (
              <button
                type="button"
                onClick={() => {
                  setIdentifier('Dipanshu@gmail.com');
                  setPassword('Sentinel@2026');
                }}
                className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-rose-900/50 rounded-lg text-rose-300 text-[11px] font-mono text-left flex items-center justify-between"
              >
                <span>Dipanshu@gmail.com (Admin Commander)</span>
                <span className="text-[9px] text-slate-500">Sentinel@2026</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillQuickUser('coordinator')}
                  className="py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-cyan-300 text-[10px] font-mono text-center truncate"
                >
                  Coordinator
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickUser('responder')}
                  className="py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-emerald-300 text-[10px] font-mono text-center truncate"
                >
                  Responder
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickUser('analyst')}
                  className="py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-purple-300 text-[10px] font-mono text-center truncate"
                >
                  Analyst
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info: 100% Offline Notice */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Local SQLite (33 Tables)
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Ollama Gemma on GPU
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">100% Offline</span>
        </div>
      </div>
    </div>
  );
}
