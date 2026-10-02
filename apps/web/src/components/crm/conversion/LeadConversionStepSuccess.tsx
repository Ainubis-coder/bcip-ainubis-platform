/**
 * BCIP Lead Conversion Wizard - Step 4: Success Result
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Displays created CRM entities and quick navigation paths.
 */

import React from 'react';
import { ConvertLeadResult } from '../shared/crm-types';
import { formatZAR } from '../shared/crm-formatters';
import { Icon } from '@bcip/ui';

interface LeadConversionStepSuccessProps {
  result: ConvertLeadResult;
  onNavigateToPipeline: (opportunityId?: string) => void;
  onClose: () => void;
}

export function LeadConversionStepSuccess({
  result,
  onNavigateToPipeline,
  onClose,
}: LeadConversionStepSuccessProps) {
  const { lead, organisation, contact, schemeProspect, opportunity } = result;

  return (
    <div className="space-y-4">
      {/* 1. Success Hero Banner */}
      <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0 border border-emerald-500/40">
          <Icon name="check" size="sm" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-emerald-200">
            Lead Converted Successfully
          </h3>
          <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
            The lead has been atomically transitioned to <span className="font-mono font-semibold">CONVERTED</span>.
            The commercial accounts and sales opportunity below were successfully instantiated and committed.
          </p>
        </div>
      </div>

      {/* 2. Created Entities Detailed Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Organisation */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-sky-400 uppercase tracking-wider">
            <span>Client Organisation</span>
            <span className="text-slate-500">{organisation.id}</span>
          </div>
          <div className="font-semibold text-slate-100 truncate">
            {organisation.name || lead.title}
          </div>
          <div className="text-slate-400 text-[11px]">
            Status: <span className="font-mono text-emerald-400">{organisation.status || 'PROSPECT'}</span>
          </div>
        </div>

        {/* Contact */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
            <span>Primary Contact</span>
            <span className="text-slate-500">{contact.id}</span>
          </div>
          <div className="font-semibold text-slate-100 truncate">
            {contact.displayName || `${contact.name || 'Contact'}`}
          </div>
          <div className="text-slate-400 font-mono text-[11px] truncate">
            {contact.email || lead.email || '—'}
          </div>
        </div>

        {/* Scheme Prospect */}
        {schemeProspect && (
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 uppercase tracking-wider">
              <span>Scheme Prospect</span>
              <span className="text-slate-500">{schemeProspect.id}</span>
            </div>
            <div className="font-semibold text-slate-100 truncate">
              {schemeProspect.name || lead.schemeName}
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              {schemeProspect.estimatedUnitCount || lead.estimatedUnits || 0} Units
            </div>
          </div>
        )}

        {/* Opportunity */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 uppercase tracking-wider">
            <span>Sales Opportunity</span>
            <span className="text-slate-500">{opportunity.id}</span>
          </div>
          <div className="font-semibold text-slate-100 truncate">
            {opportunity.name}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-emerald-400 font-semibold">
              {formatZAR(opportunity.estimatedValue || 0)}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-400">{opportunity.stage} (25%)</span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
        >
          Return to Leads
        </button>

        <button
          type="button"
          onClick={() => onNavigateToPipeline(opportunity.id)}
          className="w-full sm:w-auto px-4 py-2 rounded text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <span>View Opportunity in Pipeline</span>
          <Icon name="chevron-right" size="xs" />
        </button>
      </div>
    </div>
  );
}
