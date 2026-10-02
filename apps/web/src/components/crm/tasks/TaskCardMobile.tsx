/**
 * BCIP Task Mobile Card Component
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
import { Icon } from '@bcip/ui';

interface TaskCardMobileProps {
  task: CRMTask;
  userRole?: string;
  onViewDetails: (task: CRMTask) => void;
  onEdit: (task: CRMTask) => void;
  onComplete: (task: CRMTask) => void;
  onDelete?: (task: CRMTask) => void;
}

export function TaskCardMobile({
  task,
  userRole,
  onViewDetails,
  onEdit,
  onComplete,
  onDelete,
}: TaskCardMobileProps) {
  const statusCfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.OPEN;
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.MEDIUM;
  const allowEdit = canEditTask(userRole);
  const allowDelete = canDeleteTask(userRole);
  const allowComplete = canCompleteTask(userRole) && task.status !== TaskStatus.COMPLETED;

  const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2.5 ${task.status === TaskStatus.COMPLETED ? 'opacity-65' : ''}`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onViewDetails(task)}
            className={`text-xs font-semibold text-left line-clamp-1 transition-colors ${
              task.status === TaskStatus.COMPLETED ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {task.title}
          </button>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[11px] font-mono font-medium ${statusCfg.colorClasses.text}`}>
              {statusCfg.label}
            </span>
            <span className="text-slate-600">·</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${priorityCfg.colorClasses.bg} ${priorityCfg.colorClasses.text}`}>
              {priorityCfg.label}
            </span>
          </div>
        </div>

        {task.dueAt && (
          <span className={`text-[10px] font-mono shrink-0 ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
            Due: {formatDate(task.dueAt)}
          </span>
        )}
      </div>

      {/* Description if present */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 bg-slate-900/40 p-2 rounded border border-slate-800/60">
          {task.description}
        </p>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px]">
        {allowComplete ? (
          <button
            type="button"
            onClick={() => onComplete(task)}
            className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold"
          >
            ✓ Mark Complete
          </button>
        ) : (
          <span className="text-slate-500 font-mono">
            {task.status === TaskStatus.COMPLETED ? 'Completed' : 'Task'}
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(task)}
            className="text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 transition-colors"
          >
            Details
          </button>
          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 transition-colors"
            >
              Edit
            </button>
          )}
          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="text-slate-500 hover:text-rose-400 p-1"
              aria-label="Delete Task"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
