/**
 * BCIP Tasks Table Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import { CRMTask } from '../shared/crm-types';
import { TaskRow } from './TaskRow';
import { TaskCardMobile } from './TaskCardMobile';
import { Icon } from '@bcip/ui';

interface TasksTableProps {
  tasks: CRMTask[];
  userRole?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onViewDetails: (task: CRMTask) => void;
  onEdit: (task: CRMTask) => void;
  onComplete: (task: CRMTask) => void;
  onDelete?: (task: CRMTask) => void;
}

export function TasksTable({
  tasks,
  userRole,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
  onEdit,
  onComplete,
  onDelete,
}: TasksTableProps) {
  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return (
      <Icon
        name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
        size="xs"
        className="text-sky-400 shrink-0"
      />
    );
  };

  return (
    <div className="w-full">
      {/* Mobile view (< 768px): Card list representation */}
      <div className="md:hidden space-y-2.5">
        {tasks.map((tsk) => (
          <TaskCardMobile
            key={tsk.id}
            task={tsk}
            userRole={userRole}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop / Tablet view (>= 768px): Structured Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 shadow-xs">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th scope="col" className="py-2.5 px-3 w-10 text-center font-semibold">
                ✓
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('title')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Task Title & Description</span>
                  {renderSortIndicator('title')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('status')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Status</span>
                  {renderSortIndicator('status')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('priority')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Priority</span>
                  {renderSortIndicator('priority')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('dueAt')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Due Date</span>
                  {renderSortIndicator('dueAt')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tasks.map((tsk) => (
              <TaskRow
                key={tsk.id}
                task={tsk}
                userRole={userRole}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onComplete={onComplete}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
