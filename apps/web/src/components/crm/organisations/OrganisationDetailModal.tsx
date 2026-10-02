/**
 * BCIP Organisation Detail Modal Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 * Deep inspection modal for organisation attributes, relationships, contacts, and schemes.
 */

import React, { useState, useEffect } from 'react';
import {
  Organisation,
  ORGANISATION_STATUS_CONFIG,
  ORGANISATION_TYPE_LABELS,
  Contact,
  SchemeProspect,
  Opportunity,
} from '../shared/crm-types';
import { formatDate, formatZAR } from '../shared/crm-formatters';
import { canEditOrganisation, canDeleteOrganisation } from '../shared/crm-permissions';
import { CrmApiClient } from '../shared/crm-api';
import { Modal, Button, Icon } from '@bcip/ui';

interface OrganisationDetailModalProps {
  isOpen: boolean;
  organisation: Organisation | null;
  userRole?: string;
  api: CrmApiClient;
  onClose: () => void;
  onEdit: (org: Organisation) => void;
  onDelete?: (org: Organisation) => void;
  onNavigateToSchemeProspect?: (schemeProspectId?: string) => void;
  onNavigateToPipeline?: (opportunityId?: string) => void;
}

export function OrganisationDetailModal({
  isOpen,
  organisation,
  userRole,
  api,
  onClose,
  onEdit,
  onDelete,
  onNavigateToSchemeProspect,
  onNavigateToPipeline,
}: OrganisationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'schemes' | 'opportunities'>('overview');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [schemes, setSchemes] = useState<SchemeProspect[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);

  useEffect(() => {
    if (isOpen && organisation) {
      setActiveTab('overview');
      setLoadingRelations(true);

      Promise.all([
        api.getOrganisationContacts(organisation.id).catch(() => []),
        api.getOrganisationSchemeProspects(organisation.id).catch(() => []),
        api.getOrganisationOpportunities(organisation.id).catch(() => []),
      ]).then(([c, s, o]) => {
        setContacts(Array.isArray(c) ? c : []);
        setSchemes(Array.isArray(s) ? s : []);
        setOpportunities(Array.isArray(o) ? o : []);
        setLoadingRelations(false);
      });
    }
  }, [isOpen, organisation, api]);

  if (!organisation) return null;

  const statusCfg = ORGANISATION_STATUS_CONFIG[organisation.status] || ORGANISATION_STATUS_CONFIG.PROSPECT;
  const typeLabel = ORGANISATION_TYPE_LABELS[organisation.organisationType] || organisation.organisationType;
  const allowEdit = canEditOrganisation(userRole);
  const allowDelete = canDeleteOrganisation(userRole);

  const addressString = typeof organisation.address === 'string'
    ? organisation.address
    : organisation.address
    ? [organisation.address.streetAddress, organisation.address.suburb, organisation.address.city, organisation.address.province]
        .filter(Boolean)
        .join(', ')
    : '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={organisation.name}
      description={`Organisation Entity: ${typeLabel}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {organisation.id}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {allowEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(organisation);
                }}
              >
                Edit Organisation
              </Button>
            )}
            {allowDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(organisation);
                }}
                className="text-rose-400 border-rose-900/60 hover:bg-rose-950/40"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'contacts'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Contacts</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {contacts.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schemes')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'schemes'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Scheme Prospects</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {schemes.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('opportunities')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'opportunities'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Opportunities</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {opportunities.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Status & Attributes Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
                  <span className={`text-xs font-bold ${statusCfg.colorClasses.text}`}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Type</span>
                <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
                  {typeLabel}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Registration</span>
                <div className="text-xs font-mono text-slate-200 mt-0.5 truncate">
                  {organisation.registrationNumber || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500">Data Quality</span>
                <div className="text-xs font-mono text-slate-300 mt-0.5">
                  {organisation.dataQualityState}
                </div>
              </div>
            </div>

            {/* Direct Contact Information */}
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Direct Contact Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Email</span>
                  <span className="text-slate-200 truncate block">{organisation.email || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Phone</span>
                  <span className="text-slate-200 block">{organisation.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Website</span>
                  <span className="text-slate-200 truncate block">{organisation.website || '—'}</span>
                </div>
              </div>
            </div>

            {/* Physical Address */}
            <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Registered Address
              </h5>
              <p className="text-xs text-slate-200 font-mono">{addressString}</p>
            </div>

            {/* Notes if available */}
            {organisation.notes && (
              <div>
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Notes & Operational Context
                </h5>
                <p className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                  {organisation.notes}
                </p>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Created: {formatDate(organisation.createdAt)}</span>
              <span>Updated: {formatDate(organisation.updatedAt)}</span>
            </div>
          </div>
        )}

        {/* Tab 2: Contacts */}
        {activeTab === 'contacts' && (
          <div className="space-y-2">
            {loadingRelations ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No individual contacts linked to this organisation.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/60 rounded border border-slate-800 bg-slate-950/60">
                {contacts.map((c) => (
                  <div key={c.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{c.displayName}</div>
                      {c.jobTitle && <div className="text-[11px] text-slate-400">{c.jobTitle}</div>}
                    </div>
                    <div className="text-right font-mono text-slate-300">
                      <div>{c.email || '—'}</div>
                      <div className="text-[11px] text-slate-500">{c.phone || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Scheme Prospects */}
        {activeTab === 'schemes' && (
          <div className="space-y-2">
            {loadingRelations ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Loading scheme prospects...</p>
            ) : schemes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No sectional-title schemes or HOA prospects linked to this organisation.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/60 rounded border border-slate-800 bg-slate-950/60">
                {schemes.map((s) => (
                  <div key={s.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {s.estimatedUnitCount || 0} Units · {s.currentPropertySystem || 'Standard System'}
                      </div>
                    </div>
                    {onNavigateToSchemeProspect && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToSchemeProspect(s.id);
                        }}
                        className="text-xs text-sky-400 hover:text-sky-300 font-mono underline"
                      >
                        View Scheme →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Opportunities */}
        {activeTab === 'opportunities' && (
          <div className="space-y-2">
            {loadingRelations ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Loading opportunities...</p>
            ) : opportunities.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No sales opportunities currently registered for this organisation.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/60 rounded border border-slate-800 bg-slate-950/60">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{opp.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Stage: <span className="text-amber-400">{opp.stage}</span> · {opp.probability}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-semibold">
                        {formatZAR(opp.estimatedValue || 0)}
                      </span>
                      {onNavigateToPipeline && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToPipeline(opp.id);
                          }}
                          className="text-xs text-sky-400 hover:text-sky-300 font-mono underline"
                        >
                          View in Pipeline →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
