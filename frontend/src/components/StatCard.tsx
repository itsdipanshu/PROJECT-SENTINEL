import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'red' | 'amber' | 'emerald' | 'blue';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'cyan',
  badge,
}) => {
  const accentColors = {
    cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/10',
    red: 'border-red-500/20 text-red-400 bg-red-500/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
    blue: 'border-blue-500/20 text-blue-400 bg-blue-500/10',
  }[variant];

  return (
    <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 hover:border-slate-600 transition-all shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${accentColors}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-3xl font-bold font-mono text-white tracking-tight">
          {value}
        </div>
        {badge && (
          <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
};
