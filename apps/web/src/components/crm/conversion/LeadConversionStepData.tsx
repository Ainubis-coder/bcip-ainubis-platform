/**
 * BCIP Lead Conversion Wizard - Step 2: Conversion Entity Data
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Captures and customizes target Organisation, Contact, Scheme Prospect, and Opportunity fields.
 */

import React from 'react';
import {
  Lead,
  ConvertLeadDto,
  OrganisationType,
  ORGANISATION_TYPE_LABELS,
} from '../shared/crm-types';
import { formatZAR } from '../shared/crm-formatters';

interface LeadConversionStepDataProps {
  lead: Lead;
  conversionData: ConvertLeadDto;
  onChange: (updated: Partial<ConvertLeadDto>) => void;
  errors: Record<string, string>;
}

export function LeadConversionStepData({
  lead,
  conversionData,
  onChange,
  errors,
}: LeadConversionStepDataProps) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* 1. Organisation Entity Configuration */}
      <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              1. Commercial Organisation
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Atomic Creation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Organisation Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={conversionData.organisationName || ''}
              onChange={(e) => onChange({ organisationName: e.target.value })}
              placeholder="e.g. Apex Property Portfolios (Pty) Ltd"
              className={`w-full text-xs px-3 py-2 rounded bg-slate-900 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                errors.organisationName ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.organisationName && (
              <span className="text-[10px] text-rose-400 mt-1 block">{errors.organisationName}</span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Organisation Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={conversionData.organisationType || OrganisationType.BODY_CORPORATE}
              onChange={(e) => onChange({ organisationType: e.target.value as OrganisationType })}
              className="w-full text-xs px-3 py-2 rounded bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.entries(ORGANISATION_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">
            Or Link Existing Organisation ID (Optional)
          </label>
          <input
            type="text"
            value={conversionData.existingOrganisationId || ''}
            onChange={(e) => onChange({ existingOrganisationId: e.target.value || undefined })}
            placeholder="e.g. org_1234567890 (leave blank to create new organisation)"
            className="w-full text-xs px-3 py-1.5 rounded bg-slate-900/60 border border-slate-800 font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </div>

      {/* 2. Contact Entity Configuration */}
      <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              2. Primary Contact Person
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Atomic Creation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              First Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={conversionData.contactFirstName || ''}
              onChange={(e) => onChange({ contactFirstName: e.target.value })}
              placeholder="e.g. Sipho"
              className={`w-full text-xs px-3 py-2 rounded bg-slate-900 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                errors.contactFirstName ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.contactFirstName && (
              <span className="text-[10px] text-rose-400 mt-1 block">{errors.contactFirstName}</span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Last Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={conversionData.contactLastName || ''}
              onChange={(e) => onChange({ contactLastName: e.target.value })}
              placeholder="e.g. Dlamini"
              className={`w-full text-xs px-3 py-2 rounded bg-slate-900 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                errors.contactLastName ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.contactLastName && (
              <span className="text-[10px] text-rose-400 mt-1 block">{errors.contactLastName}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono text-slate-400">
          <div>
            <span className="text-[10px] text-slate-500 block">Direct Email</span>
            <span className="text-slate-200">{lead.email || 'None provided'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Phone Number</span>
            <span className="text-slate-200">{lead.phone || 'None provided'}</span>
          </div>
        </div>
      </div>

      {/* 3. Scheme Prospect Configuration */}
      <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              3. Scheme Prospect Entity
            </h4>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={conversionData.createSchemeProspect !== false}
              onChange={(e) => onChange({ createSchemeProspect: e.target.checked })}
              className="rounded bg-slate-900 border-slate-800 text-sky-500 focus:ring-0"
            />
            <span className="text-slate-300">Create Scheme Prospect</span>
          </label>
        </div>

        {conversionData.createSchemeProspect !== false ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Scheme Name</span>
              <span className="text-slate-200 font-medium">{lead.schemeName || 'Direct Scheme'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Estimated Units</span>
              <span className="text-slate-200 font-mono">{lead.estimatedUnits || 0} Units</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Managing Agent</span>
              <span className="text-slate-200">{lead.managingAgent || 'Direct Scheme'}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Scheme Prospect record will be skipped during this conversion.
          </p>
        )}
      </div>

      {/* 4. Commercial Opportunity Configuration */}
      <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              4. Commercial Sales Opportunity
            </h4>
          </div>
          <span className="text-[10px] font-mono text-amber-400">Stage: DISCOVERY (25%)</span>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Opportunity Deal Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={conversionData.opportunityName || ''}
            onChange={(e) => onChange({ opportunityName: e.target.value })}
            placeholder="e.g. Apex Property Portfolios — Enterprise Platform Adoption"
            className={`w-full text-xs px-3 py-2 rounded bg-slate-900 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
              errors.opportunityName ? 'border-rose-500' : 'border-slate-800'
            }`}
          />
          {errors.opportunityName && (
            <span className="text-[10px] text-rose-400 mt-1 block">{errors.opportunityName}</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Estimated Deal Value (ZAR) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">R</span>
              <input
                type="number"
                min="0"
                step="100"
                value={conversionData.estimatedValue || ''}
                onChange={(e) => onChange({ estimatedValue: parseFloat(e.target.value) || 0 })}
                placeholder="25000"
                className={`w-full text-xs pl-7 pr-3 py-2 rounded bg-slate-900 border font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                  errors.estimatedValue ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
            </div>
            {errors.estimatedValue && (
              <span className="text-[10px] text-rose-400 mt-1 block">{errors.estimatedValue}</span>
            )}
            <span className="text-[10px] text-slate-500 mt-1 block font-mono">
              Formatted: {formatZAR(conversionData.estimatedValue || 0)}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Target Close Date (Optional)
            </label>
            <input
              type="date"
              value={conversionData.expectedCloseDate || ''}
              onChange={(e) => onChange({ expectedCloseDate: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded bg-slate-900 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
