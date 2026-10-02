/**
 * BCIP Activity Mobile Card Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import { Activity, ACTIVITY_TYPE_CONFIG } from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditActivity, canDeleteActivity } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface ActivityCardMobileProps {
  activity: Activity;
  userRole?: string;
  onViewDetails: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export function ActivityCardMobile({
  activity,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
}: ActivityCardMobileProps) {
  const typeCfg = ACTIVITY_TYPE_CONFIG[activity.activityType] || ACTIVITY_TYPE_CONFIG.OTHER;
  const allowEdit = canEditActivity(userRole);
  const allowDelete = canDeleteActivity(userRole);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onViewDetails(activity)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors"
          >
            {activity.subject}
          </button>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`p-1 rounded ${typeCfg.colorClasses.bg} ${typeCfg.colorClasses.text}`}>
              <Icon name={(typeCfg.iconName || 'activity') as any} size="xs" />
            </span>
            <span className={`text-[11px] font-medium ${typeCfg.colorClasses.text}`}>
              {typeCfg.label}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-500 shrink-0">
          {formatDate(activity.activityAt || activity.createdAt)}
        </span>
      </div>

      {/* Description preview if present */}
      {activity.description && (
        <p className="text-xs text-slate-400 line-clamp-2 bg-slate-900/40 p-2 rounded border border-slate-800/60">
          {activity.description}
        </p>
      )}

      {/* Footer Metadata & Actions */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px]">
        <span className="text-slate-500 font-mono">
          {activity.leadId ? 'Lead Activity' : activity.opportunityId ? 'Opportunity' : 'General'}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(activity)}
            className="text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 transition-colors"
          >
            Details
          </button>
          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(activity)}
              className="text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 transition-colors"
            >
              Edit
            </button>
          )}
          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(activity)}
              className="text-slate-500 hover:text-rose-400 p-1"
              aria-label="Delete Activity"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
