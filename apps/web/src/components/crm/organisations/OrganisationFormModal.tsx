/**
 * BCIP Organisation Create/Edit Form Modal
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React, { useState, useEffect } from 'react';
import {
  Organisation,
  CreateOrganisationDto,
  UpdateOrganisationDto,
  OrganisationType,
  OrganisationStatus,
  ORGANISATION_TYPE_LABELS,
  ORGANISATION_STATUS_CONFIG,
} from '../shared/crm-types';
import { Modal, Button } from '@bcip/ui';

interface OrganisationFormModalProps {
  isOpen: boolean;
  organisationToEdit?: Organisation | null;
  onClose: () => void;
  onSubmitCreate: (dto: CreateOrganisationDto) => Promise<void>;
  onSubmitUpdate: (id: string, dto: UpdateOrganisationDto) => Promise<void>;
}

export function OrganisationFormModal({
  isOpen,
  organisationToEdit,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: OrganisationFormModalProps) {
  const isEditing = Boolean(organisationToEdit);

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [organisationType, setOrganisationType] = useState<OrganisationType>(OrganisationType.MANAGING_AGENT);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<OrganisationStatus>(OrganisationStatus.PROSPECT);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (organisationToEdit) {
      setName(organisationToEdit.name || '');
      setLegalName(organisationToEdit.legalName || '');
      setOrganisationType(organisationToEdit.organisationType || OrganisationType.MANAGING_AGENT);
      setRegistrationNumber(organisationToEdit.registrationNumber || '');
      setEmail(organisationToEdit.email || '');
      setPhone(organisationToEdit.phone || '');
      setWebsite(organisationToEdit.website || '');
      setAddress(
        typeof organisationToEdit.address === 'string'
          ? organisationToEdit.address
          : organisationToEdit.address
          ? [organisationToEdit.address.streetAddress, organisationToEdit.address.city].filter(Boolean).join(', ')
          : ''
      );
      setStatus(organisationToEdit.status || OrganisationStatus.PROSPECT);
      setNotes(organisationToEdit.notes || '');
    } else {
      setName('');
      setLegalName('');
      setOrganisationType(OrganisationType.MANAGING_AGENT);
      setRegistrationNumber('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setAddress('');
      setStatus(OrganisationStatus.PROSPECT);
      setNotes('');
    }
    setErrors({});
    setSubmitError(null);
  }, [organisationToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Organisation name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Organisation name must be at least 2 characters';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Invalid email address format';
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
      if (isEditing && organisationToEdit) {
        const updateDto: UpdateOrganisationDto = {
          name: name.trim(),
          legalName: legalName.trim() || undefined,
          organisationType,
          registrationNumber: registrationNumber.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          address: address.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        };
        await onSubmitUpdate(organisationToEdit.id, updateDto);
      } else {
        const createDto: CreateOrganisationDto = {
          name: name.trim(),
          legalName: legalName.trim() || undefined,
          organisationType,
          registrationNumber: registrationNumber.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          address: address.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        };
        await onSubmitCreate(createDto);
      }
      onClose();
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Failed to save organisation record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? 'Edit Organisation' : 'Create Organisation'}
      description={
        isEditing
          ? `Update commercial parameters for ${organisationToEdit?.name}`
          : 'Register a new managing agency, sectional scheme body corporate, or corporate portfolio'
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
              <span>{isEditing ? 'Update Organisation' : 'Create Organisation'}</span>
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

        {/* Organisation Name */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Organisation Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apex Property Portfolios (Pty) Ltd"
            className={`w-full text-xs px-3 py-2 rounded bg-slate-950 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
              errors.name ? 'border-rose-500' : 'border-slate-800'
            }`}
          />
          {errors.name && <span className="text-[10px] text-rose-400 mt-1 block">{errors.name}</span>}
        </div>

        {/* Legal Name & Registration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Legal Registered Name
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Apex Portfolio Holdings (RF) NPC"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Company Registration / Scheme Number
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. 2018/123456/07 or SS 12/2016"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Organisation Type & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Organisation Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={organisationType}
              onChange={(e) => setOrganisationType(e.target.value as OrganisationType)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.entries(ORGANISATION_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Relationship Status <span className="text-rose-400">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrganisationStatus)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.entries(ORGANISATION_STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Information (Email, Phone, Website) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@org.co.za"
              className={`w-full text-xs px-3 py-2 rounded bg-slate-950 border font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                errors.email ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.email && <span className="text-[10px] text-rose-400 mt-1 block">{errors.email}</span>}
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 11 000 0000"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.co.za"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Registered Physical Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 100 Sandton Drive, Sandton, Johannesburg, 2196"
            className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Internal Operational Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Strategic notes, portfolio profile, key decision makers..."
            className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </form>
    </Modal>
  );
}
