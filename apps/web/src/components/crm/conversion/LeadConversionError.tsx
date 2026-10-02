/**
 * BCIP Lead Conversion Wizard Error Display
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Clean error presentation without leaking internal stack traces.
 */

import React from 'react';
import { Icon } from '@bcip/ui';

interface LeadConversionErrorProps {
  error: {
    message: string;
    code?: string;
    status?: number;
    details?: unknown;
  } | null;
  onRetry?: () => void;
  onClear?: () => void;
}

export function LeadConversionError({
  error,
  onRetry,
  onClear,
}: LeadConversionErrorProps) {
  if (!error) return null;

  const isConflict = error.status === 409 || error.message.toLowerCase().includes('already been converted');
  const isValidation = error.status === 422 || error.code === 'VALIDATION_ERROR';
  const isForbidden = error.status === 403;
  const isNotFound = error.status === 404;

  let title = 'Conversion Operation Failed';
  let description = error.message;

  if (isConflict) {
    title = 'Lead Already Converted';
    description = 'This lead has already been converted into CRM records. Multiple conversions of the same lead are prevented to maintain data integrity.';
  } else if (isValidation) {
    title = 'Validation Requirements Not Met';
    description = error.message || 'Please check the required entity parameters before submitting the conversion.';
  } else if (isForbidden) {
    title = 'Access Denied (403)';
    description = 'Your user role does not have permission to convert leads into CRM commercial accounts.';
  } else if (isNotFound) {
    title = 'Lead Not Found (404)';
    description = 'The target lead record could not be found or may have been deleted.';
  }

  return (
    <div
      role="alert"
      className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/60 text-slate-200 flex items-start gap-3"
    >
      <div className="p-1 rounded bg-rose-900/60 text-rose-300 shrink-0 mt-0.5">
        <Icon name="alert-circle" size="sm" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-rose-200">{title}</h4>
        <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">{description}</p>

        {Boolean(isValidation && error.details) && (
          <div className="mt-2 p-2 rounded bg-slate-950/60 border border-rose-900/50 text-[11px] font-mono text-rose-300">
            {typeof error.details === 'string'
              ? error.details
              : JSON.stringify(error.details, null, 2)}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          {onRetry && !isConflict && !isForbidden && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-medium text-rose-200 hover:text-white px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800/80 transition-colors"
            >
              Retry Conversion
            </button>
          )}

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded hover:bg-slate-800/60 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
