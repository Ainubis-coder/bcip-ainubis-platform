/**
 * BCIP Scheme Prospect Create/Edit Form Modal
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React, { useState, useEffect } from 'react';
import {
  SchemeProspect,
  CreateSchemeProspectDto,
  UpdateSchemeProspectDto,
  Organisation,
} from '../shared/crm-types';
import { CrmApiClient } from '../shared/crm-api';
import { Modal, Button } from '@bcip/ui';

interface SchemeProspectFormModalProps {
  isOpen: boolean;
  schemeProspectToEdit?: SchemeProspect | null;
  api: CrmApiClient;
  onClose: () => void;
  onSubmitCreate: (dto: CreateSchemeProspectDto) => Promise<void>;
  onSubmitUpdate: (id: string, dto: UpdateSchemeProspectDto) => Promise<void>;
}

export function SchemeProspectFormModal({
  isOpen,
  schemeProspectToEdit,
  api,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: SchemeProspectFormModalProps) {
  const isEditing = Boolean(schemeProspectToEdit);

  const [name, setName] = useState('');
  const [organisationId, setOrganisationId] = useState('');
  const [organisationsList, setOrganisationsList] = useState<Organisation[]>([]);
  const [sectionalTitleSchemeCode, setSectionalTitleSchemeCode] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [estimatedUnitCount, setEstimatedUnitCount] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [managingAgentName, setManagingAgentName] = useState('');
  const [currentPropertySystem, setCurrentPropertySystem] = useState('');
  const [currentAccountingSystem, setCurrentAccountingSystem] = useState('');
  const [requirementsSummary, setRequirementsSummary] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load organisations for dropdown
      api.listOrganisations({ pageSize: 100 })
        .then((res) => setOrganisationsList(res.organisations))
        .catch(() => setOrganisationsList([]));

      if (schemeProspectToEdit) {
        setName(schemeProspectToEdit.name || '');
        setOrganisationId(schemeProspectToEdit.organisationId || '');
        setSectionalTitleSchemeCode(schemeProspectToEdit.sectionalTitleSchemeCode || '');
        setRegistrationNumber(schemeProspectToEdit.registrationNumber || '');
        setEstimatedUnitCount(schemeProspectToEdit.estimatedUnitCount || 0);
        setLocation(
          typeof schemeProspectToEdit.location === 'string'
            ? schemeProspectToEdit.location
            : schemeProspectToEdit.location
            ? [schemeProspectToEdit.location.streetAddress, schemeProspectToEdit.location.city].filter(Boolean).join(', ')
            : ''
        );
        setManagingAgentName(schemeProspectToEdit.managingAgentName || '');
        setCurrentPropertySystem(schemeProspectToEdit.currentPropertySystem || '');
        setCurrentAccountingSystem(schemeProspectToEdit.currentAccountingSystem || '');
        setRequirementsSummary(schemeProspectToEdit.requirementsSummary || '');
        setNotes(schemeProspectToEdit.notes || '');
      } else {
        setName('');
        setOrganisationId('');
        setSectionalTitleSchemeCode('');
        setRegistrationNumber('');
        setEstimatedUnitCount(0);
        setLocation('');
        setManagingAgentName('');
        setCurrentPropertySystem('');
        setCurrentAccountingSystem('');
        setRequirementsSummary('');
        setNotes('');
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [schemeProspectToEdit, isOpen, api]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Scheme prospect name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Scheme prospect name must be at least 2 characters';
    }

    if (estimatedUnitCount < 0) {
      errs.estimatedUnitCount = 'Estimated unit count must be non-negative';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing && schemeProspectToEdit) {
        const updateDto: UpdateSchemeProspectDto = {
          name: name.trim(),
          organisationId: organisationId || undefined,
          sectionalTitleSchemeCode: sectionalTitleSchemeCode.trim() || undefined,
          registrationNumber: registrationNumber.trim() || undefined,
          estimatedUnitCount,
          location: location.trim() || undefined,
          managingAgentName: managingAgentName.trim() || undefined,
          currentPropertySystem: currentPropertySystem.trim() || undefined,
          currentAccountingSystem: currentAccountingSystem.trim() || undefined,
          requirementsSummary: requirementsSummary.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        await onSubmitUpdate(schemeProspectToEdit.id, updateDto);
      } else {
        const createDto: CreateSchemeProspectDto = {
          name: name.trim(),
          organisationId: organisationId || undefined,
          sectionalTitleSchemeCode: sectionalTitleSchemeCode.trim() || undefined,
          registrationNumber: registrationNumber.trim() || undefined,
          estimatedUnitCount,
          location: location.trim() || undefined,
          managingAgentName: managingAgentName.trim() || undefined,
          currentPropertySystem: currentPropertySystem.trim() || undefined,
          currentAccountingSystem: currentAccountingSystem.trim() || undefined,
          requirementsSummary: requirementsSummary.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        await onSubmitCreate(createDto);
      }
      onClose();
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Failed to save scheme prospect record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? 'Edit Scheme Prospect' : 'Create Scheme Prospect'}
      description={
        isEditing
          ? `Update parameters for ${schemeProspectToEdit?.name}`
          : 'Register a sectional title body corporate or HOA prospect record'
      }
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Update Prospect' : 'Create Prospect'}</span>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
        {submitError && (
          <div className="p-3 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            {submitError}
          </div>
        )}

        {/* Scheme Name */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Scheme Prospect Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Cascades Body Corporate SS 88/2016"
            className={`w-full text-xs px-3 py-2 rounded bg-slate-950 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
              errors.name ? 'border-rose-500' : 'border-slate-800'
            }`}
          />
          {errors.name && <span className="text-[10px] text-rose-400 mt-1 block">{errors.name}</span>}
        </div>

        {/* Linked Commercial Organisation */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Linked Commercial Organisation (Optional)
          </label>
          <select
            value={organisationId}
            onChange={(e) => setOrganisationId(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            <option value="">No linked organisation</option>
            {organisationsList.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.organisationType})
              </option>
            ))}
          </select>
        </div>

        {/* Codes & Sizing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Estimated Units
            </label>
            <input
              type="number"
              min="0"
              value={estimatedUnitCount}
              onChange={(e) => setEstimatedUnitCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Sectional Title Code
            </label>
            <input
              type="text"
              value={sectionalTitleSchemeCode}
              onChange={(e) => setSectionalTitleSchemeCode(e.target.value)}
              placeholder="e.g. SS 88/2016"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. 2016/888888/08"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Managing Agent & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Managing Agent Name
            </label>
            <input
              type="text"
              value={managingAgentName}
              onChange={(e) => setManagingAgentName(e.target.value)}
              placeholder="e.g. Highland Property Portfolios"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Physical Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sea Point, Cape Town"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Current Software Systems */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Current Property System
            </label>
            <input
              type="text"
              value={currentPropertySystem}
              onChange={(e) => setCurrentPropertySystem(e.target.value)}
              placeholder="e.g. Legacy Desktop Spreadsheets"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Current Accounting System
            </label>
            <input
              type="text"
              value={currentAccountingSystem}
              onChange={(e) => setCurrentAccountingSystem(e.target.value)}
              placeholder="e.g. Pastel Evolution / Sage"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Requirements Summary */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Requirements Summary
          </label>
          <textarea
            rows={2}
            value={requirementsSummary}
            onChange={(e) => setRequirementsSummary(e.target.value)}
            placeholder="Scheme requirements, governance structure, AGM compliance..."
            className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Internal Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Commercial notes, trustee contact notes, meeting outcomes..."
            className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </form>
    </Modal>
  );
}
