/**
 * BCIP Lead Conversion Wizard - Step 3: Confirmation
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Presents immutable transaction summary before calling backend atomic conversion.
 */

import React from 'react';
import {
  Lead,
  ConvertLeadDto,
  ORGANISATION_TYPE_LABELS,
  OrganisationType,
} from '../shared/crm-types';
import { formatZAR, formatDate } from '../shared/crm-formatters';
import { Icon } from '@bcip/ui';

interface LeadConversionStepConfirmProps {
  lead: Lead;
  conversionData: ConvertLeadDto;
  tenantName: string;
}

export function LeadConversionStepConfirm({
  lead,
  conversionData,
  tenantName,
}: LeadConversionStepConfirmProps) {
  const orgTypeLabel =
    ORGANISATION_TYPE_LABELS[conversionData.organisationType || OrganisationType.BODY_CORPORATE];

  return (
    <div className="space-y-4">
      {/* 1. Transaction Notice */}
      <div className="p-3.5 rounded-lg bg-sky-950/40 border border-sky-800/60 flex items-start gap-3">
        <div className="p-1 rounded bg-sky-900/60 text-sky-300 mt-0.5 shrink-0">
          <Icon name="check" size="sm" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-sky-200">
            Atomic Multi-Entity CRM Conversion
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Executing this conversion will perform an atomic transaction on tenant{' '}
            <span className="font-semibold text-slate-100">{tenantName}</span>.
            The lead status will transition to <span className="font-mono text-emerald-400 font-semibold">CONVERTED</span>,
            and the linked entities below will be created and associated.
          </p>
        </div>
      </div>

      {/* 2. Structured Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Source Lead */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Target Lead Record</span>
          </div>
          <div className="font-semibold text-slate-100 truncate">{lead.title}</div>
          <div className="text-slate-400 font-mono text-[11px]">
            Current: {lead.status} · {lead.qualificationStatus}
          </div>
        </div>

        {/* Commercial Organisation */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Client Organisation</span>
          </div>
          <div className="font-semibold text-slate-100 truncate">
            {conversionData.organisationName || lead.title}
          </div>
          <div className="text-slate-400 text-[11px]">
            {orgTypeLabel} {conversionData.existingOrganisationId ? '(Existing Linked)' : '(New)'}
          </div>
        </div>

        {/* Primary Contact */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Primary Contact</span>
          </div>
          <div className="font-semibold text-slate-100 truncate">
            {conversionData.contactFirstName} {conversionData.contactLastName}
          </div>
          <div className="text-slate-400 font-mono text-[11px] truncate">
            {lead.email || 'No email provided'}
          </div>
        </div>

        {/* Commercial Opportunity */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Sales Opportunity</span>
          </div>
          <div className="font-semibold text-slate-100 truncate">
            {conversionData.opportunityName}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-emerald-400 font-semibold">
              {formatZAR(conversionData.estimatedValue || 0)}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">DISCOVERY (25%)</span>
          </div>
        </div>
      </div>

      {/* 3. Scheme Prospect & Conversion Activity note */}
      <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Scheme Prospect Record:</span>
          <span className="font-mono text-slate-300">
            {conversionData.createSchemeProspect !== false
              ? `Yes (${lead.schemeName || 'Direct'}, ${lead.estimatedUnits || 0} units)`
              : 'Skipped'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Target Close Date:</span>
          <span className="font-mono text-slate-300">
            {conversionData.expectedCloseDate ? formatDate(conversionData.expectedCloseDate) : 'Not specified'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Conversion Activity:</span>
          <span className="font-mono text-slate-300">Automatic Discovery Logged</span>
        </div>
      </div>
    </div>
  );
}
