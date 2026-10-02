/**
 * BCIP Activity Table Row Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import { Activity, ACTIVITY_TYPE_CONFIG } from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditActivity, canDeleteActivity } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface ActivityRowProps {
  activity: Activity;
  userRole?: string;
  onViewDetails: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export function ActivityRow({
  activity,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
}: ActivityRowProps) {
  const typeCfg = ACTIVITY_TYPE_CONFIG[activity.activityType] || ACTIVITY_TYPE_CONFIG.OTHER;
  const allowEdit = canEditActivity(userRole);
  const allowDelete = canDeleteActivity(userRole);

  const getEntityBadge = () => {
    if (activity.opportunityId) return { label: 'Opportunity', color: 'text-amber-400 bg-amber-500/10' };
    if (activity.leadId) return { label: 'Lead', color: 'text-sky-400 bg-sky-500/10' };
    if (activity.organisationId) return { label: 'Organisation', color: 'text-emerald-400 bg-emerald-500/10' };
    if (activity.contactId) return { label: 'Contact', color: 'text-purple-400 bg-purple-500/10' };
    return { label: 'General', color: 'text-slate-400 bg-slate-500/10' };
  };

  const entityBadge = getEntityBadge();

  return (
    <tr
      tabIndex={0}
      className="group hover:bg-slate-900/60 transition-colors border-b border-slate-800/60 focus-visible:outline-none focus-visible:bg-slate-900/80"
    >
      {/* 1. Subject & Note Preview */}
      <td className="py-3 px-4 max-w-[320px]">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onViewDetails(activity)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors focus-visible:outline-none focus-visible:underline"
            title={activity.subject}
          >
            {activity.subject}
          </button>
          {activity.description && (
            <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
              {activity.description}
            </p>
          )}
        </div>
      </td>

      {/* 2. Activity Type */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className={`p-1 rounded ${typeCfg.colorClasses.bg} ${typeCfg.colorClasses.text}`}>
            <Icon name={(typeCfg.iconName || 'activity') as any} size="xs" />
          </span>
          <span className={`text-xs font-medium ${typeCfg.colorClasses.text}`}>
            {typeCfg.label}
          </span>
        </div>
      </td>

      {/* 3. Linked Entity */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${entityBadge.color}`}>
          {entityBadge.label}
        </span>
      </td>

      {/* 4. Activity Date & Time */}
      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-300">
        {formatDate(activity.activityAt || activity.createdAt)}
      </td>

      {/* 5. Row Actions */}
      <td className="py-3 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onViewDetails(activity)}
            className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
            title="View Details"
          >
            View
          </button>

          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(activity)}
              className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              title="Edit Activity"
            >
              Edit
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(activity)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Delete Activity"
              aria-label="Delete Activity"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
