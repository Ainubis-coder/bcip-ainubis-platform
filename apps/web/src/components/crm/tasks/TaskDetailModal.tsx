/**
 * BCIP Task Detail Modal Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import {
  CRMTask,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TaskStatus,
} from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditTask, canDeleteTask, canCompleteTask } from '../shared/crm-permissions';
import { Modal, Button } from '@bcip/ui';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: CRMTask | null;
  userRole?: string;
  onClose: () => void;
  onEdit: (task: CRMTask) => void;
  onComplete: (task: CRMTask) => void;
  onDelete?: (task: CRMTask) => void;
  onNavigateToLead?: (leadId: string) => void;
  onNavigateToPipeline?: (opportunityId: string) => void;
  onNavigateToOrganisation?: (organisationId: string) => void;
}

export function TaskDetailModal({
  isOpen,
  task,
  userRole,
  onClose,
  onEdit,
  onComplete,
  onDelete,
  onNavigateToLead,
  onNavigateToPipeline,
  onNavigateToOrganisation,
}: TaskDetailModalProps) {
  if (!task) return null;

  const statusCfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.OPEN;
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.MEDIUM;
  const allowEdit = canEditTask(userRole);
  const allowDelete = canDeleteTask(userRole);
  const allowComplete = canCompleteTask(userRole) && task.status !== TaskStatus.COMPLETED;

  const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description="CRM Action Item & Follow-up Commitment"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {task.id}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>

            {allowComplete && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onComplete(task);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Mark as Complete
              </Button>
            )}

            {allowEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
              >
                Edit Task
              </Button>
            )}

            {allowDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(task);
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
            <span className="text-[10px] uppercase font-mono text-slate-500">Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
              <span className={`text-xs font-bold ${statusCfg.colorClasses.text}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Priority</span>
            <div className="mt-1">
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${priorityCfg.colorClasses.bg} ${priorityCfg.colorClasses.text} ${priorityCfg.colorClasses.border}`}>
                {priorityCfg.label}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Due Date</span>
            <div className="text-xs font-mono mt-1">
              {task.dueAt ? (
                <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {formatDate(task.dueAt)}
                </span>
              ) : (
                <span className="text-slate-500">No deadline</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Assigned To</span>
            <div className="text-xs font-mono text-slate-300 mt-1 truncate">
              {task.assignedTo || 'Unassigned'}
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div className="space-y-1.5">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Task Description & Instructions
          </h5>
          <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans min-h-[80px]">
            {task.description || 'No detailed instructions recorded for this task.'}
          </p>
        </div>

        {/* Linked CRM Relationships */}
        <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Linked CRM Relationships
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {task.leadId && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Linked Lead:</span>
                {onNavigateToLead ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToLead(task.leadId!);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-mono underline"
                  >
                    View Lead →
                  </button>
                ) : (
                  <span className="font-mono text-slate-200">{task.leadId}</span>
                )}
              </div>
            )}

            {task.opportunityId && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Linked Opportunity:</span>
                {onNavigateToPipeline ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToPipeline(task.opportunityId!);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-mono underline"
                  >
                    View in Pipeline →
                  </button>
                ) : (
                  <span className="font-mono text-slate-200">{task.opportunityId}</span>
                )}
              </div>
            )}

            {task.organisationId && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Linked Organisation:</span>
                {onNavigateToOrganisation ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToOrganisation(task.organisationId!);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-mono underline"
                  >
                    View Organisation →
                  </button>
                ) : (
                  <span className="font-mono text-slate-200">{task.organisationId}</span>
                )}
              </div>
            )}

            {!task.leadId && !task.opportunityId && !task.organisationId && (
              <span className="text-slate-500 italic text-xs col-span-2">
                Standalone task with no linked entity.
              </span>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Created: {formatDate(task.createdAt)}</span>
          {task.completedAt ? (
            <span className="text-emerald-400">Completed: {formatDate(task.completedAt)}</span>
          ) : (
            <span>Updated: {formatDate(task.updatedAt)}</span>
          )}
        </div>
      </div>
    </Modal>
  );
}
