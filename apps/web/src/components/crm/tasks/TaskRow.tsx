/**
 * BCIP Task Table Row Component
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

interface TaskRowProps {
  task: CRMTask;
  userRole?: string;
  onViewDetails: (task: CRMTask) => void;
  onEdit: (task: CRMTask) => void;
  onComplete: (task: CRMTask) => void;
  onDelete?: (task: CRMTask) => void;
}

export function TaskRow({
  task,
  userRole,
  onViewDetails,
  onEdit,
  onComplete,
  onDelete,
}: TaskRowProps) {
  const statusCfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.OPEN;
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.MEDIUM;
  const allowEdit = canEditTask(userRole);
  const allowDelete = canDeleteTask(userRole);
  const allowComplete = canCompleteTask(userRole) && task.status !== TaskStatus.COMPLETED;

  const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;

  return (
    <tr
      tabIndex={0}
      className={`group hover:bg-slate-900/60 transition-colors border-b border-slate-800/60 focus-visible:outline-none focus-visible:bg-slate-900/80 ${
        task.status === TaskStatus.COMPLETED ? 'opacity-65' : ''
      }`}
    >
      {/* 1. Complete Checkbox Action */}
      <td className="py-3 px-3 w-10 text-center">
        {allowComplete ? (
          <button
            type="button"
            onClick={() => onComplete(task)}
            className="w-4 h-4 rounded border border-slate-700 bg-slate-900 hover:border-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
            title="Mark Task Completed"
            aria-label={`Mark task ${task.title} as completed`}
          >
            <Icon name="check" size="xs" className="opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
          </button>
        ) : task.status === TaskStatus.COMPLETED ? (
          <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center inline-block">
            <Icon name="check" size="xs" />
          </span>
        ) : (
          <span className="w-4 h-4 rounded border border-slate-800 bg-slate-950 inline-block opacity-40" />
        )}
      </td>

      {/* 2. Task Title & Description */}
      <td className="py-3 px-4 max-w-[300px]">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onViewDetails(task)}
            className={`text-xs font-semibold text-left line-clamp-1 transition-colors focus-visible:outline-none focus-visible:underline ${
              task.status === TaskStatus.COMPLETED
                ? 'line-through text-slate-400 hover:text-slate-200'
                : 'text-slate-100 hover:text-sky-400'
            }`}
            title={task.title}
          >
            {task.title}
          </button>
          {task.description && (
            <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
              {task.description}
            </p>
          )}
        </div>
      </td>

      {/* 3. Status (Zero-Pill) */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
          <span className={`text-xs font-mono font-medium ${statusCfg.colorClasses.text}`}>
            {statusCfg.label}
          </span>
        </div>
      </td>

      {/* 4. Priority */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${priorityCfg.colorClasses.bg} ${priorityCfg.colorClasses.text} ${priorityCfg.colorClasses.border}`}>
          {priorityCfg.label}
        </span>
      </td>

      {/* 5. Due Date */}
      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono">
        {task.dueAt ? (
          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
            {formatDate(task.dueAt)} {isOverdue && ' (Overdue)'}
          </span>
        ) : (
          <span className="text-slate-600">No due date</span>
        )}
      </td>

      {/* 6. Row Actions */}
      <td className="py-3 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          {allowComplete && (
            <button
              type="button"
              onClick={() => onComplete(task)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 py-1 px-2 rounded bg-emerald-950/40 border border-emerald-800/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
            >
              Complete
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetails(task)}
            className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
            title="View Details"
          >
            View
          </button>

          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              title="Edit Task"
            >
              Edit
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Delete Task"
              aria-label="Delete Task"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
