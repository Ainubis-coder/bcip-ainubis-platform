/**
 * BCIP Leads Error State Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 */

import React from 'react';
import { Button, Icon } from '@bcip/ui';

interface LeadsErrorStateProps {
  error: Error | string;
  statusCode?: number;
  onRetry: () => void;
}

export function LeadsErrorState({ error, statusCode, onRetry }: LeadsErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const isForbidden = statusCode === 403 || errorMessage.includes('FORBIDDEN');
  const isUnauthorized = statusCode === 401 || errorMessage.includes('UNAUTHORIZED');

  return (
    <div className="bg-rose-950/20 border border-rose-900/60 rounded-xl p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-rose-900/40 border border-rose-700/60 flex items-center justify-center text-rose-400 mb-4">
        <Icon name="x" size="md" />
      </div>

      <h3 className="text-base font-semibold text-slate-100">
        {isForbidden
          ? 'Access Denied'
          : isUnauthorized
          ? 'Session Expired'
          : 'Unable to Load Leads'}
      </h3>

      <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed">
        {isForbidden
          ? 'Your current role does not have permission to view CRM leads.'
          : errorMessage}
      </p>

      {statusCode && (
        <span className="text-[10px] font-mono text-slate-500 mt-2">
          HTTP Status: {statusCode}
        </span>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <Icon name="refresh" size="xs" className="mr-1.5" />
          <span>Retry Query</span>
        </Button>
      </div>
    </div>
  );
}
