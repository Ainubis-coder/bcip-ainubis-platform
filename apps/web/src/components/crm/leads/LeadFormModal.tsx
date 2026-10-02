/**
 * BCIP Lead Create/Edit Form Modal Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Enterprise modal form for capturing and updating CRM leads.
 */

import React, { useState, useEffect } from 'react';
import {
  Lead,
  LeadSource,
  LEAD_SOURCE_LABELS,
  LeadStatus,
  LEAD_STATUS_CONFIG,
  ALL_LEAD_STATUSES,
  QualificationStatus,
  QUALIFICATION_STATUS_CONFIG,
  ExpectedTimeline,
  EXPECTED_TIMELINE_LABELS,
  CreateLeadDto,
  UpdateLeadDto,
} from '../shared/crm-types';
import { Modal, Button, Alert } from '@bcip/ui';

interface LeadFormModalProps {
  isOpen: boolean;
  leadToEdit: Lead | null;
  onClose: () => void;
  onSubmitCreate: (dto: CreateLeadDto) => Promise<void>;
  onSubmitUpdate: (id: string, dto: UpdateLeadDto) => Promise<void>;
}

export function LeadFormModal({
  isOpen,
  leadToEdit,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: LeadFormModalProps) {
  const isEditing = Boolean(leadToEdit);

  // Form states
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<LeadSource>(LeadSource.DIRECT_OUTREACH);
  const [sourceDetail, setSourceDetail] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [estimatedUnits, setEstimatedUnits] = useState<number | ''>('');
  const [managingAgent, setManagingAgent] = useState('');
  const [currentSystem, setCurrentSystem] = useState('');
  const [expectedTimeline, setExpectedTimeline] = useState<ExpectedTimeline>(
    ExpectedTimeline.ONE_TO_THREE_MONTHS
  );
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.NEW);
  const [qualificationStatus, setQualificationStatus] = useState<QualificationStatus>(
    QualificationStatus.PRE_QUALIFIED
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form on open/change
  useEffect(() => {
    if (leadToEdit) {
      setTitle(leadToEdit.title || '');
      setSource(leadToEdit.source || LeadSource.DIRECT_OUTREACH);
      setSourceDetail(leadToEdit.sourceDetail || '');
      setEmail(leadToEdit.email || '');
      setPhone(leadToEdit.phone || '');
      setWebsite(leadToEdit.website || '');
      setSchemeName(leadToEdit.schemeName || '');
      setEstimatedUnits(
        leadToEdit.estimatedUnits !== undefined ? leadToEdit.estimatedUnits : ''
      );
      setManagingAgent(leadToEdit.managingAgent || '');
      setCurrentSystem(leadToEdit.currentSystem || '');
      setExpectedTimeline(leadToEdit.expectedTimeline || ExpectedTimeline.ONE_TO_THREE_MONTHS);
      setDescription(leadToEdit.description || '');
      setStatus(leadToEdit.status || LeadStatus.NEW);
      setQualificationStatus(
        leadToEdit.qualificationStatus || QualificationStatus.PRE_QUALIFIED
      );
    } else {
      setTitle('');
      setSource(LeadSource.DIRECT_OUTREACH);
      setSourceDetail('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setSchemeName('');
      setEstimatedUnits('');
      setManagingAgent('');
      setCurrentSystem('');
      setExpectedTimeline(ExpectedTimeline.ONE_TO_THREE_MONTHS);
      setDescription('');
      setStatus(LeadStatus.NEW);
      setQualificationStatus(QualificationStatus.PRE_QUALIFIED);
    }
    setErrorMessage(null);
  }, [leadToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage('Lead title must be at least 2 characters long.');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (estimatedUnits !== '' && Number(estimatedUnits) < 0) {
      setErrorMessage('Estimated units cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditing && leadToEdit) {
        const updatePayload: UpdateLeadDto = {
          title: title.trim(),
          source,
          sourceDetail: sourceDetail.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          schemeName: schemeName.trim() || undefined,
          estimatedUnits: estimatedUnits !== '' ? Number(estimatedUnits) : undefined,
          managingAgent: managingAgent.trim() || undefined,
          currentSystem: currentSystem.trim() || undefined,
          expectedTimeline,
          description: description.trim() || undefined,
          status,
          qualificationStatus,
        };
        await onSubmitUpdate(leadToEdit.id, updatePayload);
      } else {
        const createPayload: CreateLeadDto = {
          title: title.trim(),
          source,
          sourceDetail: sourceDetail.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          schemeName: schemeName.trim() || undefined,
          estimatedUnits: estimatedUnits !== '' ? Number(estimatedUnits) : undefined,
          managingAgent: managingAgent.trim() || undefined,
          currentSystem: currentSystem.trim() || undefined,
          expectedTimeline,
          description: description.trim() || undefined,
        };
        await onSubmitCreate(createPayload);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Lead' : 'Create New Lead'}
      description={
        isEditing
          ? `Modify lead record "${leadToEdit?.title}"`
          : 'Capture a new sectional scheme or managing agent prospect.'
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
        {errorMessage && (
          <Alert severity="error" title="Validation Error">
            {errorMessage}
          </Alert>
        )}

        {/* Lead Title */}
        <div>
          <label htmlFor="lead-title" className="block text-xs font-semibold text-slate-300 mb-1">
            Lead Title <span className="text-rose-400">*</span>
          </label>
          <input
            id="lead-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Atlantic Seaboard Portfolios — 14 Scheme Migration"
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>

        {/* Acquisition Source & Detail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="lead-source" className="block text-xs font-semibold text-slate-300 mb-1">
              Acquisition Source <span className="text-rose-400">*</span>
            </label>
            <select
              id="lead-source"
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.keys(LEAD_SOURCE_LABELS).map((s) => (
                <option key={s} value={s}>
                  {LEAD_SOURCE_LABELS[s as LeadSource]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lead-source-detail" className="block text-xs font-semibold text-slate-300 mb-1">
              Source Detail / Campaign Note
            </label>
            <input
              id="lead-source-detail"
              type="text"
              value={sourceDetail}
              onChange={(e) => setSourceDetail(e.target.value)}
              placeholder="e.g. Q1 LinkedIn Executive Series"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Scheme & Sizing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="lead-scheme" className="block text-xs font-semibold text-slate-300 mb-1">
              Scheme Name / Prospect
            </label>
            <input
              id="lead-scheme"
              type="text"
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              placeholder="e.g. Sandton Terraces SS"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="lead-units" className="block text-xs font-semibold text-slate-300 mb-1">
              Estimated Unit Sizing
            </label>
            <input
              id="lead-units"
              type="number"
              min="0"
              value={estimatedUnits}
              onChange={(e) => setEstimatedUnits(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 140"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Managing Agent & Current System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="lead-agent" className="block text-xs font-semibold text-slate-300 mb-1">
              Managing Agency
            </label>
            <input
              id="lead-agent"
              type="text"
              value={managingAgent}
              onChange={(e) => setManagingAgent(e.target.value)}
              placeholder="e.g. Highland Property Management"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="lead-current-system" className="block text-xs font-semibold text-slate-300 mb-1">
              Current System
            </label>
            <input
              id="lead-current-system"
              type="text"
              value={currentSystem}
              onChange={(e) => setCurrentSystem(e.target.value)}
              placeholder="e.g. Sage Pastel / Spreadsheets"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="lead-email" className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lead@example.co.za"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="lead-phone" className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              id="lead-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 11 000 0000"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="lead-timeline" className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Timeline
            </label>
            <select
              id="lead-timeline"
              value={expectedTimeline}
              onChange={(e) => setExpectedTimeline(e.target.value as ExpectedTimeline)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.keys(EXPECTED_TIMELINE_LABELS).map((t) => (
                <option key={t} value={t}>
                  {EXPECTED_TIMELINE_LABELS[t as ExpectedTimeline]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* When editing: Status and Qualification Status */}
        {isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800/80 pt-3">
            <div>
              <label htmlFor="lead-status" className="block text-xs font-semibold text-slate-300 mb-1">
                Lifecycle Status
              </label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
              >
                {ALL_LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {LEAD_STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lead-qual" className="block text-xs font-semibold text-slate-300 mb-1">
                Qualification Assessment
              </label>
              <select
                id="lead-qual"
                value={qualificationStatus}
                onChange={(e) => setQualificationStatus(e.target.value as QualificationStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
              >
                {Object.keys(QUALIFICATION_STATUS_CONFIG).map((q) => (
                  <option key={q} value={q}>
                    {QUALIFICATION_STATUS_CONFIG[q as QualificationStatus].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Description / Scope */}
        <div>
          <label htmlFor="lead-desc" className="block text-xs font-semibold text-slate-300 mb-1">
            Description & Outreach Notes
          </label>
          <textarea
            id="lead-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key requirements, scheme pain points, current management pain..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </form>
    </Modal>
  );
}
