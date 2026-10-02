/**
 * BCIP Ainubis Error State Component
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React from 'react';
import { Icon, Button } from '@bcip/ui';

interface AinubisErrorStateProps {
  error: string;
  statusCode?: number;
  onRetry?: () => void;
}

export function AinubisErrorState({
  error,
  statusCode,
  onRetry,
}: AinubisErrorStateProps) {
  const isForbidden = statusCode === 403;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-rose-950/20 border border-rose-900/40 rounded-lg">
      <div className="p-3 rounded-full bg-rose-900/40 text-rose-400 mb-3 border border-rose-800/40">
        <Icon name="alert-triangle" size="md" />
      </div>

      <h3 className="text-sm font-semibold text-rose-200">
        {isForbidden ? 'Access Denied (403)' : 'Failed to Load Ainubis Intelligence Records'}
      </h3>

      <p className="text-xs text-rose-300/80 mt-1 max-w-sm leading-relaxed">
        {isForbidden
          ? 'Your user role is not permitted to view Ainubis CRM intelligence records.'
          : error || 'An unexpected error occurred while communicating with the Ainubis AI service.'}
      </p>

      {onRetry && !isForbidden && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <Icon name="refresh" size="xs" className="mr-1.5" />
            <span>Retry Query</span>
          </Button>
        </div>
      )}
    </div>
  );
}
