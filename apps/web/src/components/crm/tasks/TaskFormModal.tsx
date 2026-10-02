/**
 * BCIP Task Create/Edit Form Modal
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React, { useState, useEffect } from 'react';
import {
  CRMTask,
  CreateCRMTaskDto,
  UpdateCRMTaskDto,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from '../shared/crm-types';
import { Modal, Button } from '@bcip/ui';

interface TaskFormModalProps {
  isOpen: boolean;
  taskToEdit?: CRMTask | null;
  onClose: () => void;
  onSubmitCreate: (dto: CreateCRMTaskDto) => Promise<void>;
  onSubmitUpdate: (id: string, dto: UpdateCRMTaskDto) => Promise<void>;
}

export function TaskFormModal({
  isOpen,
  taskToEdit,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: TaskFormModalProps) {
  const isEditing = Boolean(taskToEdit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.OPEN);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueAt, setDueAt] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title || '');
        setDescription(taskToEdit.description || '');
        setStatus(taskToEdit.status || TaskStatus.OPEN);
        setPriority(taskToEdit.priority || TaskPriority.MEDIUM);
        setDueAt(
          taskToEdit.dueAt
            ? new Date(taskToEdit.dueAt).toISOString().slice(0, 10)
            : ''
        );
        setAssignedTo(taskToEdit.assignedTo || '');
      } else {
        setTitle('');
        setDescription('');
        setStatus(TaskStatus.OPEN);
        setPriority(TaskPriority.MEDIUM);
        setDueAt('');
        setAssignedTo('');
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [taskToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Task title is required';
    } else if (title.trim().length > 200) {
      errs.title = 'Task title cannot exceed 200 characters';
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
      if (isEditing && taskToEdit) {
        const updateDto: UpdateCRMTaskDto = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          assignedTo: assignedTo.trim() || undefined,
        };
        await onSubmitUpdate(taskToEdit.id, updateDto);
      } else {
        const createDto: CreateCRMTaskDto = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          assignedTo: assignedTo.trim() || undefined,
        };
        await onSubmitCreate(createDto);
      }
      onClose();
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Failed to save task record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? 'Edit Task' : 'Create Follow-up Task'}
      description={
        isEditing
          ? `Update parameters for ${taskToEdit?.title}`
          : 'Schedule action items, proposal reviews, and sales follow-ups'
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
              <span>{isEditing ? 'Update Task' : 'Create Task'}</span>
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

        {/* Task Title */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Task Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Prepare Sectional Levy Proposal Document"
            className={`w-full text-xs px-3 py-2 rounded bg-slate-950 border text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400 ${
              errors.title ? 'border-rose-500' : 'border-slate-800'
            }`}
          />
          {errors.title && <span className="text-[10px] text-rose-400 mt-1 block">{errors.title}</span>}
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Priority <span className="text-rose-400">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.entries(TASK_PRIORITY_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Status <span className="text-rose-400">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {Object.entries(TASK_STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date & Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Target Due Date
            </label>
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Assigned User ID / Name
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. usr_portfolio_mgr_01"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            Task Description & Details
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed instructions, deliverables, meeting preparation notes..."
            className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </form>
    </Modal>
  );
}
