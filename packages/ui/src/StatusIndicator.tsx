import React from 'react';

export type StatusVariant = 'healthy' | 'active' | 'warning' | 'alert' | 'neutral' | 'offline';

export interface StatusIndicatorProps {
  status: StatusVariant;
  label: string;
  subtext?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  subtext,
  size = 'md',
  className = '',
}: StatusIndicatorProps) {
  const dotColor = {
    healthy: 'bg-emerald-500 ring-emerald-500/20',
    active: 'bg-emerald-500 ring-emerald-500/20',
    warning: 'bg-amber-500 ring-amber-500/20',
    alert: 'bg-rose-500 ring-rose-500/20',
    neutral: 'bg-slate-400 ring-slate-400/20',
    offline: 'bg-slate-600 ring-slate-600/20',
  };

  const textColor = {
    healthy: 'text-emerald-400',
    active: 'text-emerald-400',
    warning: 'text-amber-400',
    alert: 'text-rose-400',
    neutral: 'text-slate-300',
    offline: 'text-slate-500',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-block rounded-full ring-4 ${dotColor[status]} ${
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
        }`}
        aria-hidden="true"
      />
      <span
        className={`font-medium ${textColor[status]} ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        }`}
      >
        {label}
      </span>
      {subtext && (
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          <span className="mx-1 text-slate-600" aria-hidden="true">·</span>
          {subtext}
        </span>
      )}
    </div>
  );
}
