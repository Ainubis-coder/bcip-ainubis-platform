/**
 * BCIP Ainubis CRM Health Summary Component
 * Phase 2E — Prompt 002E-002: Ainubis CRM Intelligence Dashboard & Contextual Intelligence
 * Aggregates evidence-backed health across 5 CRM pillars:
 * Pipeline, Leads, Organisations, Scheme Prospects, and Tasks & Activities.
 */

import React from 'react';
import type {
  AinubisDashboardSummary,
  CRMHealthCategorySummary,
  CRMHealthCategoryKey,
} from '../crm/shared/crm-types';
import { HealthStatus } from '../crm/shared/crm-types';
import { Icon } from '@bcip/ui';

interface AinubisHealthSummaryProps {
  summary: AinubisDashboardSummary;
  selectedCategory?: CRMHealthCategoryKey | 'all';
  onSelectCategory?: (category: CRMHealthCategoryKey | 'all') => void;
}

export function AinubisHealthSummary({
  summary,
  selectedCategory = 'all',
  onSelectCategory,
}: AinubisHealthSummaryProps) {
  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return {
          label: 'Healthy',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case HealthStatus.WARNING:
        return {
          label: 'Warning',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case HealthStatus.ATTENTION_REQUIRED:
      default:
        return {
          label: 'Attention Needed',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
    }
  };

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'pipeline':
        return 'layers';
      case 'leads':
        return 'user';
      case 'organisations':
        return 'building';
      case 'schemeProspects':
        return 'layout';
      case 'tasksAndActivities':
      default:
        return 'check-circle';
    }
  };

  const categories = Object.values(summary.healthCategories || {});

  return (
    <div className="space-y-4">
      {/* Header with Overall Portfolio Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <Icon name="cpu" size="xs" className="text-sky-400" />
              <span>CRM Intelligence Health Status</span>
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                getStatusBadge(summary.overallHealthStatus).badge
              }`}
            >
              {getStatusBadge(summary.overallHealthStatus).label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time deterministic hygiene evaluation across portfolio deals, customer leads, and action items.
          </p>
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
          <div className="text-center sm:text-right">
            <div className="text-2xl font-bold font-mono text-slate-100">
              {summary.overallHealthScore}%
            </div>
            <div className="text-[10px] font-mono text-slate-400">Portfolio Health Score</div>
          </div>

          {onSelectCategory && selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="text-xs text-sky-400 hover:text-sky-300 underline font-mono"
            >
              View All
            </button>
          )}
        </div>
      </div>

      {/* Category Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {categories.map((cat: CRMHealthCategorySummary) => {
          const isSelected = selectedCategory === cat.key;
          const statusInfo = getStatusBadge(cat.status);
          const icon = getCategoryIcon(cat.key);

          return (
            <div
              key={cat.key}
              onClick={() => onSelectCategory?.(isSelected ? 'all' : cat.key)}
              className={`cursor-pointer bg-slate-950 border rounded-lg p-3.5 space-y-3 transition-all ${
                isSelected
                  ? 'border-sky-500 ring-1 ring-sky-500/50 bg-slate-900/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-sky-400">
                    <Icon name={icon as any} size="xs" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100 leading-none">
                      {cat.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {cat.totalEntities} entities
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {cat.score}%
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={`px-2 py-0.5 rounded border ${statusInfo.badge}`}>
                  {statusInfo.label}
                </span>

                <span className="text-slate-400">
                  {cat.issueCount} {cat.issueCount === 1 ? 'issue' : 'issues'}
                </span>
              </div>

              {/* Breakdown Metric Strip */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-[11px]">
                {cat.metrics.slice(0, 3).map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between text-slate-400"
                    title={metric.description}
                  >
                    <span className="truncate pr-2 text-[10px]">{metric.label}</span>
                    <span
                      className={`font-mono text-[10px] font-semibold ${
                        metric.count > 0 && metric.status === HealthStatus.ATTENTION_REQUIRED
                          ? 'text-rose-400'
                          : metric.count > 0 && metric.status === HealthStatus.WARNING
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {metric.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
