import React from 'react';
import { ModuleId } from '../types/navigation';

export interface BreadcrumbItem {
  label: string;
  moduleId?: ModuleId;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (moduleId: ModuleId) => void;
  className?: string;
}

export function Breadcrumbs({ items, onNavigate, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-400 ${className}`}>
      <ol className="flex items-center space-x-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !isLast && (item.moduleId || item.onClick || item.href);

          return (
            <li key={item.label + index} className="flex items-center">
              {index > 0 && (
                <span className="mx-1.5 text-slate-600 select-none" aria-hidden="true">
                  /
                </span>
              )}

              {isClickable ? (
                <button
                  type="button"
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.moduleId && onNavigate) {
                      onNavigate(item.moduleId);
                    }
                  }}
                  className="hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 rounded px-0.5"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={`${isLast ? 'text-slate-200 font-medium' : 'text-slate-400'} truncate max-w-[200px] sm:max-w-none`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
