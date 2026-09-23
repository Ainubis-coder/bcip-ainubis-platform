import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Icon, Button } from '@bcip/ui';

/**
 * Shell Loading Skeleton for workspace page transitions
 */
export function ShellWorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading workspace content" role="status">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-800 rounded w-48" />
        <div className="h-8 bg-slate-800 rounded w-72" />
        <div className="h-4 bg-slate-850 rounded w-96" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="h-3 bg-slate-800 rounded w-24" />
            <div className="h-6 bg-slate-800 rounded w-32" />
            <div className="h-3 bg-slate-850 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-36" />
          <div className="h-8 bg-slate-800 rounded w-24" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-950/60 border border-slate-850 rounded flex items-center px-4 justify-between">
              <div className="h-3 bg-slate-800 rounded w-40" />
              <div className="h-3 bg-slate-800 rounded w-24" />
              <div className="h-3 bg-slate-800 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shell Error State fallback
 */
interface ShellErrorStateProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  onNavigateHome?: () => void;
}

export function ShellErrorState({
  error,
  resetErrorBoundary,
  onNavigateHome,
}: ShellErrorStateProps) {
  return (
    <div className="min-h-[500px] flex items-center justify-center p-6" role="alert">
      <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-lg p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
          <Icon name="alert-triangle" size="md" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">Workspace Exception Occurred</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested module encountered an unhandled execution error. State isolation has preserved other modules.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
            {error.message || String(error)}
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          {resetErrorBoundary && (
            <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
              Retry Workspace
            </Button>
          )}
          {onNavigateHome && (
            <Button variant="primary" size="sm" onClick={onNavigateHome}>
              Return to Dashboard
            </Button>
          )}
        </div>

        <p className="text-[10px] font-mono text-slate-400">
          Error logged to BCIP correlation stream.
        </p>
      </div>
    </div>
  );
}

/**
 * React Error Boundary wrapping workspace content
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onNavigateHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ShellErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ShellErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ShellErrorState
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
          onNavigateHome={this.props.onNavigateHome}
        />
      );
    }
    return this.props.children;
  }
}
