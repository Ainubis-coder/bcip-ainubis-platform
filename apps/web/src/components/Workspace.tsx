import React, { ReactNode } from 'react';
import { BreadcrumbItem } from './Breadcrumbs';
import { PageHeader } from './PageHeader';
import { ShellErrorBoundary, ShellWorkspaceSkeleton } from './ShellStates';
import { ModuleId } from '../types/navigation';

interface WorkspaceProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  statusBadge?: ReactNode;
  actions?: ReactNode;
  isLoading?: boolean;
  onNavigate?: (moduleId: ModuleId) => void;
  children: ReactNode;
  className?: string;
}

export function Workspace({
  title,
  description,
  breadcrumbs,
  statusBadge,
  actions,
  isLoading = false,
  onNavigate,
  children,
  className = '',
}: WorkspaceProps) {
  return (
    <ShellErrorBoundary onNavigateHome={() => onNavigate && onNavigate('dashboard')}>
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${className}`}>
        {isLoading ? (
          <ShellWorkspaceSkeleton />
        ) : (
          <>
            <PageHeader
              title={title}
              description={description}
              breadcrumbs={breadcrumbs}
              statusBadge={statusBadge}
              actions={actions}
              onNavigate={onNavigate}
            />
            <div className="space-y-6">{children}</div>
          </>
        )}
      </div>
    </ShellErrorBoundary>
  );
}
