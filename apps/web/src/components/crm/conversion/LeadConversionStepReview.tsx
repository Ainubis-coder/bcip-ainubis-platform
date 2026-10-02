/**
 * BCIP Lead Conversion Wizard - Step 1: Review Lead
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Inspects lead scope, scheme prospect details, contact info, and data readiness.
 */

import React from 'react';
import {
  Lead,
  LeadStatus,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
  QUALIFICATION_STATUS_CONFIG,
  EXPECTED_TIMELINE_LABELS,
} from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { Icon } from '@bcip/ui';

interface LeadConversionStepReviewProps {
  lead: Lead;
}

export function LeadConversionStepReview({ lead }: LeadConversionStepReviewProps) {
  const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW;
  const qualCfg = QUALIFICATION_STATUS_CONFIG[lead.qualificationStatus] || QUALIFICATION_STATUS_CONFIG.UNQUALIFIED;
  const isAlreadyConverted = lead.status === LeadStatus.CONVERTED;
  const isQualified = lead.status === LeadStatus.QUALIFIED;

  // Assess readiness based on actual available data
  const hasContactInfo = Boolean(lead.email || lead.phone);
  const hasScope = Boolean(lead.schemeName || lead.managingAgent);
  const isReadinessComplete = hasContactInfo && hasScope;

  return (
    <div className="space-y-4">
      {/* 1. Header Banner: Conversion context / Warning */}
      {isAlreadyConverted ? (
        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
          <div className="p-1 rounded bg-amber-900/60 text-amber-300 mt-0.5 shrink-0">
            <Icon name="alert-circle" size="sm" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-amber-200">
              This Lead Has Already Been Converted
            </h4>
            <p className="text-xs text-amber-300/90 mt-0.5 leading-relaxed">
              This prospect was converted on{' '}
              <span className="font-mono">{lead.convertedAt ? formatDate(lead.convertedAt) : 'a prior date'}</span>.
              The associated Opportunity, Organisation, and Contact records have already been created in the database.
            </p>
          </div>
        </div>
      ) : !isQualified ? (
        <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/50 flex items-start gap-2.5">
          <div className="p-0.5 text-sky-400 mt-0.5 shrink-0">
            <Icon name="info" size="xs" />
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-medium text-slate-200">Conversion Workflow:</span> Proceeding with conversion will atomically transition this lead to <span className="font-mono text-emerald-400">CONVERTED</span>, instantiate the client Organisation & Contact, and launch the commercial sales Opportunity into the <span className="font-mono text-sky-400">DISCOVERY</span> stage.
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Icon name="check" size="xs" />
            <span>Lead is qualified and ready for commercial account conversion.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Readiness: Verified</span>
        </div>
      )}

      {/* 2. Lead Master Identity Card */}
      <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Lead Prospect
            </span>
            <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{lead.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator (Zero-Pill discipline) */}
            <span className="flex items-center gap-1.5 text-xs font-mono font-medium">
              <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
              <span className={statusCfg.colorClasses.text}>{statusCfg.label}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-400">{qualCfg.label}</span>
          </div>
        </div>

        {/* Scope grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">Acquisition Source</span>
            <span className="text-slate-200 font-medium">
              {LEAD_SOURCE_LABELS[lead.source] || lead.source}
            </span>
            {lead.sourceDetail && (
              <span className="text-[11px] text-slate-400 block truncate">{lead.sourceDetail}</span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">Sectional Scheme / Entity</span>
            <span className="text-slate-200 font-medium">
              {lead.schemeName || 'Direct Enquiry'}
            </span>
            {lead.estimatedUnits !== undefined && lead.estimatedUnits > 0 && (
              <span className="text-[11px] font-mono text-slate-400 block">
                {lead.estimatedUnits} Sectional Units
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">Managing Agent</span>
            <span className="text-slate-200 font-medium">
              {lead.managingAgent || 'Direct Scheme / Self-Managed'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Direct Contact Details & Data Quality Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Direct Contact Information
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-200 select-all">{lead.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="text-slate-200 select-all">{lead.phone || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Website:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{lead.website || '—'}</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Data Quality & Operational Scope
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Quality Rating:</span>
              <span className="font-mono text-slate-300">
                {lead.dataQualityState} {isReadinessComplete ? '· Complete' : '· Partial'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Current Software:</span>
              <span className="text-slate-200">{lead.currentSystem || 'Not Specified'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Timeline Horizon:</span>
              <span className="text-slate-200 font-mono">
                {EXPECTED_TIMELINE_LABELS[lead.expectedTimeline] || lead.expectedTimeline}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Description & Notes if present */}
      {lead.description && (
        <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Prospect Notes
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">{lead.description}</p>
        </div>
      )}
    </div>
  );
}
