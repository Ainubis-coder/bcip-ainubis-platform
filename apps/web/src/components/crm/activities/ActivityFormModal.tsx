/**
 * BCIP Activity Create/Edit Form Modal
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CreateActivityDto,
  UpdateActivityDto,
  ActivityType,
  ACTIVITY_TYPE_CONFIG,
} from '../shared/crm-types';
import { Modal, Button } from '@bcip/ui';

interface ActivityFormModalProps {
  isOpen: boolean;
  activityToEdit?: Activity | null;
  onClose: () => void;
  onSubmitCreate: (dto: CreateActivityDto) => Promise<void>;
  onSubmitUpdate: (id: string, dto: UpdateActivityDto) => Promise<void>;
}

export function ActivityFormModal({
  isOpen,
  activityToEdit,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: ActivityFormModalProps) {
  const isEditing = Boolean(activityToEdit);

  const [subject, setSubject] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.CALL);
  const [description, setDescription] = useState('');
  const [activityAt, setActivityAt] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (activityToEdit) {
        setSubject(activityToEdit.subject || '');
        setActivityType(activityToEdit.activityType || ActivityType.CALL);
        setDescription(activityToEdit.description || '');
        setActivityAt(
          activityToEdit.activityAt
            ? new Date(activityToEdit.activityAt).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
        );
      } else {
        setSubject('');
        setActivityType(ActivityType.CALL);
        setDescription('');
        setActivityAt(new Date().toISOString().slice(0, 16));
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [activityToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!subject.trim()) {
      errs.subject = 'Activity subject is required';
    } else if (subject.trim().length > 200) {
      errs.subject = 'Subject cannot exceed 200 characters';
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
      if (isEditing && activityToEdit) {
        const updateDto: UpdateActivityDto = {
          subject: subject.trim(),
          activityType,
          description: description.trim() || undefined,
          activityAt: activityAt ? new Date(activityAt).toISOString() : undefined,
        };
        await onSubmitUpdate(activityToEdit.id, updateDto);
      } else {
        const createDto: CreateActivityDto = {
          subject: subject.trim(),
          activityType,
          description: description.trim() || undefined,
          activityAt: activityAt ? new Date(activityAt).toISOString() : new Date().toISOString(),
        };
        await onSubmitCreate(createDto);
      }
      onClose();
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Failed to save activity record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? 'Edit Activity' : 'Log Customer Activity'}
      description={
        isEditing
          ? `Update interaction parameters for ${activityToEdit?.subject}`
          : 'Record phone calls, emails, discovery meetings, and internal CRM notes'
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
              <span>{isEditing ? 'Update Activity' : 'Log Activity'}</span>
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

        {/* Activity Subject */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Activity Subject / Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Discovery Call with Highland Property Portfolios"
            className={`w-full text-xs px-3 py-2 rounded bg-slate-950 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
              errors.subject ? 'border-rose-500' : 'border-slate-800'
            }`}
          />
          {errors.subject && <span className="text-[10px] text-rose-400 mt-1 block">{errors.subject}</span>}
        </div>

        {/* Activity Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Activity Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.entries(ACTIVITY_TYPE_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Interaction Date & Time
            </label>
            <input
              type="datetime-local"
              value={activityAt}
              onChange={(e) => setActivityAt(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Detailed Notes / Description */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Interaction Notes & Summary
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key discussion outcomes, decision maker feedback, next steps agreed upon..."
            className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </form>
    </Modal>
  );
}
