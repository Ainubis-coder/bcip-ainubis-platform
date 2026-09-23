import React, { ReactNode } from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { ModuleId } from '../types/navigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  onNavigate?: (moduleId: ModuleId) => void;
  statusBadge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  onNavigate,
  statusBadge,
  actions,
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              {title}
            </h1>
            {statusBadge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
