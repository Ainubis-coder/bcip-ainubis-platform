import React from 'react';
import { Icon, IconName } from '../../icons/Icon';
import { Button } from '../Button';

export type FeedbackSeverity = 'info' | 'success' | 'warning' | 'error' | 'ainubis';

export interface AlertProps {
  severity?: FeedbackSeverity;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  severity = 'info',
  title,
  children,
  action,
  onDismiss,
  className = '',
}: AlertProps) {
  const severityStyles = {
    info: 'bg-sky-950/40 border-sky-800/60 text-sky-200',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    error: 'bg-rose-950/40 border-rose-800/60 text-rose-200',
    ainubis: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200',
  };

  const iconNameMap: Record<FeedbackSeverity, IconName> = {
    info: 'info',
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'alert-circle',
    ainubis: 'cpu',
  };

  return (
    <div
      role="alert"
      className={`rounded-md border p-4 text-xs flex items-start gap-3 ${severityStyles[severity]} ${className}`}
    >
      <div className="shrink-0 mt-0.5">
        <Icon name={iconNameMap[severity]} size="md" className="opacity-90" />
      </div>
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1 text-sm tracking-tight">{title}</h4>}
        <div className="opacity-90 leading-relaxed">{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-current opacity-60 hover:opacity-100 p-1 rounded -mr-1 -mt-1 transition-opacity"
          aria-label="Dismiss alert"
        >
          <Icon name="x" size="sm" />
        </button>
      )}
    </div>
  );
}

export interface ToastProps {
  id: string;
  severity?: FeedbackSeverity;
  title: string;
  message?: string;
  onClose: (id: string) => void;
}

export function Toast({ id, severity = 'info', title, message, onClose }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-lg p-3.5 shadow-xl flex items-start gap-3"
    >
      <Alert severity={severity} className="p-0 border-0 bg-transparent w-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-100 text-xs">{title}</p>
            {message && <p className="text-slate-400 text-xs mt-0.5">{message}</p>}
          </div>
          <button
            onClick={() => onClose(id)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
            aria-label="Close notification"
          >
            <Icon name="x" size="xs" />
          </button>
        </div>
      </Alert>
    </div>
  );
}

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className = '', label = 'Loading...' }: SpinnerProps) {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status">
      <svg className={`animate-spin ${sizeMap[size]} text-emerald-500`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: 'none' | 'sm' | 'md' | 'full';
}

export function Skeleton({ className = '', height = '1rem', width = '100%', rounded = 'md' }: SkeletonProps) {
  const roundedMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-800/80 ${roundedMap[rounded]} ${className}`}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'inbox' as IconName,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`py-12 px-4 text-center flex flex-col items-center justify-center max-w-sm mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <Icon name={icon === ('inbox' as IconName) ? 'layers' : icon} size="lg" />
      </div>
      <h3 className="text-sm font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-5">{description}</p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export interface LoadingStateProps {
  message?: string;
  subtext?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading operational data...',
  subtext = 'Fetching verified state from platform infrastructure',
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`py-16 text-center flex flex-col items-center justify-center ${className}`}>
      <Spinner size="lg" className="mb-4" />
      <h4 className="text-sm font-medium text-slate-200 mb-1">{message}</h4>
      <p className="text-xs text-slate-500">{subtext}</p>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Service Unavailable',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`py-12 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-4">
        <Icon name="alert-triangle" size="lg" />
      </div>
      <h3 className="text-sm font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-5">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<Icon name="refresh" size="xs" />}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}
