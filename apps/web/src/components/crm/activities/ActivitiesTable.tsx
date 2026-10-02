/**
 * BCIP Activities Table Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import { Activity } from '../shared/crm-types';
import { ActivityRow } from './ActivityRow';
import { ActivityCardMobile } from './ActivityCardMobile';
import { Icon } from '@bcip/ui';

interface ActivitiesTableProps {
  activities: Activity[];
  userRole?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onViewDetails: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export function ActivitiesTable({
  activities,
  userRole,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
  onEdit,
  onDelete,
}: ActivitiesTableProps) {
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
        {activities.map((act) => (
          <ActivityCardMobile
            key={act.id}
            activity={act}
            userRole={userRole}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop / Tablet view (>= 768px): Structured Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 shadow-xs">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('subject')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Subject & Description</span>
                  {renderSortIndicator('subject')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Type
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Entity Context
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('activityAt')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Date & Time</span>
                  {renderSortIndicator('activityAt')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {activities.map((act) => (
              <ActivityRow
                key={act.id}
                activity={act}
                userRole={userRole}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
