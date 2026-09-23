import React from 'react';
import { Icon } from '../../icons/Icon';
import { Button } from '../Button';

export type AinubisState =
  | 'observation'
  | 'insight'
  | 'recommendation'
  | 'alert'
  | 'approval_required';

export interface AinubisBadgeProps {
  state: AinubisState;
  label?: string;
  className?: string;
}

export function AinubisBadge({ state, label, className = '' }: AinubisBadgeProps) {
  const stateConfig = {
    observation: {
      text: label || 'Observation',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
      dotClass: 'bg-slate-400',
    },
    insight: {
      text: label || 'Intelligence Insight',
      badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
      dotClass: 'bg-sky-400',
    },
    recommendation: {
      text: label || 'Recommendation',
      badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
      dotClass: 'bg-indigo-400',
    },
    alert: {
      text: label || 'Operational Alert',
      badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
      dotClass: 'bg-amber-400',
    },
    approval_required: {
      text: label || 'Human Approval Required',
      badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
      dotClass: 'bg-rose-400 animate-pulse',
    },
  };

  const config = stateConfig[state];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border tracking-wide select-none ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      <span>{config.text}</span>
    </span>
  );
}

export interface AinubisCardProps {
  state: AinubisState;
  title: string;
  summary: string;
  evidence?: string[];
  schemeContext?: string;
  confidenceScore?: number;
  timestamp?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onInspectDetails?: () => void;
  className?: string;
}

export function AinubisCard({
  state,
  title,
  summary,
  evidence,
  schemeContext,
  confidenceScore,
  timestamp = 'Just now',
  onApprove,
  onReject,
  onInspectDetails,
  className = '',
}: AinubisCardProps) {
  const borderMap = {
    observation: 'border-slate-800 hover:border-slate-700',
    insight: 'border-sky-900/60 hover:border-sky-700/80',
    recommendation: 'border-indigo-900/60 hover:border-indigo-700/80',
    alert: 'border-amber-900/60 hover:border-amber-700/80',
    approval_required: 'border-rose-900/80 hover:border-rose-700/90',
  };

  return (
    <div
      className={`bg-slate-900 rounded-lg p-5 border transition-colors ${borderMap[state]} ${className}`}
    >
      {/* Top Header: Badge + Scheme + Timestamp */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <AinubisBadge state={state} />
          {schemeContext && (
            <span className="text-xs text-slate-400 font-medium">
              <span className="text-slate-600 mr-1.5" aria-hidden="true">
                /
              </span>
              {schemeContext}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
          {confidenceScore !== undefined && (
            <span>{Math.round(confidenceScore * 100)}% confidence</span>
          )}
          <span aria-hidden="true">·</span>
          <span>{timestamp}</span>
        </div>
      </div>

      {/* Main Title & Summary */}
      <h4 className="text-sm font-semibold text-slate-100 mb-1.5 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-300 leading-relaxed mb-4">{summary}</p>

      {/* Optional Structured Evidence List */}
      {evidence && evidence.length > 0 && (
        <div className="mb-4 bg-slate-950/60 border border-slate-800/80 rounded-md p-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Identified Invariants & Inferences
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {evidence.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 font-mono text-[11px] mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions: Distinct for Approval Required vs Read-Only Recommendations */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        <div>
          {onInspectDetails && (
            <button
              onClick={onInspectDetails}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 font-medium"
            >
              <span>Examine Telemetry</span>
              <Icon name="arrow-up-right" size="xs" />
            </button>
          )}
        </div>

        {state === 'approval_required' ? (
          <div className="flex items-center gap-2">
            {onReject && (
              <Button variant="ghost" size="sm" onClick={onReject}>
                Decline Action
              </Button>
            )}
            {onApprove && (
              <Button
                variant="primary"
                size="sm"
                onClick={onApprove}
                leftIcon={<Icon name="check" size="xs" />}
              >
                Approve & Execute
              </Button>
            )}
          </div>
        ) : (
          <div>
            {onApprove && (
              <Button variant="secondary" size="sm" onClick={onApprove}>
                Acknowledge
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export interface AinubisBannerProps {
  title?: string;
  message: string;
  state?: AinubisState;
  action?: React.ReactNode;
  className?: string;
}

export function AinubisBanner({
  title = 'Ainubis Governance Layer Active',
  message,
  state = 'observation',
  action,
  className = '',
}: AinubisBannerProps) {
  return (
    <div
      className={`rounded-lg border border-slate-800 bg-slate-900/90 p-4 flex items-center justify-between gap-4 flex-wrap ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 shrink-0">
          <Icon name="cpu" size="sm" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-semibold text-slate-200">{title}</h5>
            <AinubisBadge state={state} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{message}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
