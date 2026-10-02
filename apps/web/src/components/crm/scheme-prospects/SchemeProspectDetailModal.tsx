/**
 * BCIP Scheme Prospect Detail Modal Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 * Deep inspection modal for sectional title / body corporate prospect records.
 */

import React, { useState, useEffect } from 'react';
import { SchemeProspect, Organisation } from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditSchemeProspect, canDeleteSchemeProspect } from '../shared/crm-permissions';
import { CrmApiClient } from '../shared/crm-api';
import { Modal, Button, Icon } from '@bcip/ui';

interface SchemeProspectDetailModalProps {
  isOpen: boolean;
  schemeProspect: SchemeProspect | null;
  userRole?: string;
  api: CrmApiClient;
  onClose: () => void;
  onEdit: (sp: SchemeProspect) => void;
  onDelete?: (sp: SchemeProspect) => void;
  onNavigateToOrganisation?: (organisationId: string) => void;
}

export function SchemeProspectDetailModal({
  isOpen,
  schemeProspect,
  userRole,
  api,
  onClose,
  onEdit,
  onDelete,
  onNavigateToOrganisation,
}: SchemeProspectDetailModalProps) {
  const [organisation, setOrganisation] = useState<Organisation | null>(null);

  useEffect(() => {
    if (isOpen && schemeProspect?.organisationId) {
      api.getOrganisation(schemeProspect.organisationId)
        .then(setOrganisation)
        .catch(() => setOrganisation(null));
    } else {
      setOrganisation(null);
    }
  }, [isOpen, schemeProspect, api]);

  if (!schemeProspect) return null;

  const allowEdit = canEditSchemeProspect(userRole);
  const allowDelete = canDeleteSchemeProspect(userRole);

  const locationString = typeof schemeProspect.location === 'string'
    ? schemeProspect.location
    : schemeProspect.location
    ? [schemeProspect.location.streetAddress, schemeProspect.location.suburb, schemeProspect.location.city, schemeProspect.location.province]
        .filter(Boolean)
        .join(', ')
    : '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schemeProspect.name}
      description={`Sectional Scheme Prospect Record · ${schemeProspect.estimatedUnitCount || 0} Units`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {schemeProspect.id}
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
                  onEdit(schemeProspect);
                }}
              >
                Edit Prospect
              </Button>
            )}
            {allowDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(schemeProspect);
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
        {/* Core Attributes Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Estimated Units</span>
            <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
              {schemeProspect.estimatedUnitCount || 0}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Scheme Code</span>
            <div className="text-xs font-mono text-slate-200 mt-1 truncate">
              {schemeProspect.sectionalTitleSchemeCode || '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Registration</span>
            <div className="text-xs font-mono text-slate-200 mt-1 truncate">
              {schemeProspect.registrationNumber || '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Data Quality</span>
            <div className="text-xs font-mono text-slate-300 mt-1">
              {schemeProspect.dataQualityState}
            </div>
          </div>
        </div>

        {/* Managing Agent & Linked Organisation */}
        <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Agency & Corporate Association
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Managing Agent Name</span>
              <span className="text-slate-200 font-medium">
                {schemeProspect.managingAgentName || 'Direct / Self-Managed'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Linked Commercial Organisation</span>
              {organisation ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-medium truncate">{organisation.name}</span>
                  {onNavigateToOrganisation && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToOrganisation(organisation.id);
                      }}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-mono underline"
                    >
                      View Org →
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 italic">No linked organisation</span>
              )}
            </div>
          </div>
        </div>

        {/* Software Systems & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1.5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Installed Systems
            </h5>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-slate-500">Property System:</span>{' '}
                <span className="text-slate-200">{schemeProspect.currentPropertySystem || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">Accounting:</span>{' '}
                <span className="text-slate-200">{schemeProspect.currentAccountingSystem || '—'}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1.5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Physical Location
            </h5>
            <p className="text-xs text-slate-200 font-mono">{locationString}</p>
          </div>
        </div>

        {/* Requirements & Pain Points */}
        {schemeProspect.requirementsSummary && (
          <div>
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Requirements Summary
            </h5>
            <p className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed">
              {schemeProspect.requirementsSummary}
            </p>
          </div>
        )}

        {schemeProspect.painPoints && schemeProspect.painPoints.length > 0 && (
          <div>
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Identified Pain Points
            </h5>
            <ul className="space-y-1 text-xs text-slate-300">
              {schemeProspect.painPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-sky-400 mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes */}
        {schemeProspect.notes && (
          <div>
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Internal Notes
            </h5>
            <p className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed">
              {schemeProspect.notes}
            </p>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Created: {formatDate(schemeProspect.createdAt)}</span>
          <span>Updated: {formatDate(schemeProspect.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
