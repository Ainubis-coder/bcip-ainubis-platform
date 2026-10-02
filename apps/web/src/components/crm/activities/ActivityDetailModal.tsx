/**
 * BCIP Activity Detail Modal Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import { Activity, ACTIVITY_TYPE_CONFIG } from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditActivity, canDeleteActivity } from '../shared/crm-permissions';
import { Modal, Button, Icon } from '@bcip/ui';

interface ActivityDetailModalProps {
  isOpen: boolean;
  activity: Activity | null;
  userRole?: string;
  onClose: () => void;
  onEdit: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
  onNavigateToLead?: (leadId: string) => void;
  onNavigateToPipeline?: (opportunityId: string) => void;
  onNavigateToOrganisation?: (organisationId: string) => void;
}

export function ActivityDetailModal({
  isOpen,
  activity,
  userRole,
  onClose,
  onEdit,
  onDelete,
  onNavigateToLead,
  onNavigateToPipeline,
  onNavigateToOrganisation,
}: ActivityDetailModalProps) {
  if (!activity) return null;

  const typeCfg = ACTIVITY_TYPE_CONFIG[activity.activityType] || ACTIVITY_TYPE_CONFIG.OTHER;
  const allowEdit = canEditActivity(userRole);
  const allowDelete = canDeleteActivity(userRole);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity.subject}
      description={`Customer Interaction · ${typeCfg.label}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {activity.id}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {allowEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(activity);
                }}
              >
                Edit Activity
              </Button>
            )}
            {allowDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(activity);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Activity Type</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`p-1 rounded ${typeCfg.colorClasses.bg} ${typeCfg.colorClasses.text}`}>
                <Icon name={(typeCfg.iconName || 'activity') as any} size="xs" />
              </span>
              <span className={`text-xs font-semibold ${typeCfg.colorClasses.text}`}>
                {typeCfg.label}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Interaction Date</span>
            <div className="text-xs font-mono text-slate-200 mt-1">
              {formatDate(activity.activityAt || activity.createdAt)}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Logged By</span>
            <div className="text-xs font-mono text-slate-300 mt-1 truncate">
              {activity.createdBy || 'System User'}
            </div>
          </div>
        </div>

        {/* Notes & Description */}
        <div className="space-y-1.5">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Interaction Notes & Description
          </h5>
          <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans min-h-[80px]">
            {activity.description || 'No additional notes provided for this interaction.'}
          </p>
        </div>

        {/* Linked CRM Relationships */}
        <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Linked CRM Relationships
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {activity.leadId && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Linked Lead:</span>
                {onNavigateToLead ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToLead(activity.leadId!);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-mono underline"
                  >
                    View Lead →
                  </button>
                ) : (
                  <span className="font-mono text-slate-200">{activity.leadId}</span>
                )}
              </div>
            )}

            {activity.opportunityId && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Linked Opportunity:</span>
                {onNavigateToPipeline ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToPipeline(activity.opportunityId!);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-mono underline"
                  >
                    View in Pipeline →
                  </button>
                ) : (
                  <span className="font-mono text-slate-200">{activity.opportunityId}</span>
                )}
              </div>
            )}

            {activity.organisationId && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Linked Organisation:</span>
                {onNavigateToOrganisation ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToOrganisation(activity.organisationId!);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-mono underline"
                  >
                    View Organisation →
                  </button>
                ) : (
                  <span className="font-mono text-slate-200">{activity.organisationId}</span>
                )}
              </div>
            )}

            {!activity.leadId && !activity.opportunityId && !activity.organisationId && (
              <span className="text-slate-500 italic text-xs col-span-2">
                General unlinked interaction record.
              </span>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Created: {formatDate(activity.createdAt)}</span>
          <span>Updated: {formatDate(activity.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
