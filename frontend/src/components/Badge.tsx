import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'success' | 'info' | 'demo' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const variantClasses = {
    critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    info: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    demo: 'bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-md font-mono ${sizeClasses} ${variantClasses}`}>
      {children}
    </span>
  );
};

