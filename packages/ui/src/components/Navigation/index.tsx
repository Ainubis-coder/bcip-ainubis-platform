import React from 'react';
import { focusVisibleClasses } from '../../accessibility';
import { Icon } from '../../icons/Icon';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'segmented';
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps) {
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg ${className}`}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${focusVisibleClasses} ${
                isActive
                  ? 'bg-slate-800 text-slate-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-slate-800 flex items-center gap-6 ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`pb-3 pt-1 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${focusVisibleClasses} ${
              isActive
                ? 'border-emerald-500 text-slate-100'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="text-xs font-mono tabular-nums text-slate-400">
                · {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex items-center text-xs text-slate-400 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-slate-600 select-none" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || item.current ? (
                <span className="font-medium text-slate-200" aria-current="page">
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`hover:text-slate-100 transition-colors ${focusVisibleClasses}`}
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <a
                  href={item.href}
                  className={`hover:text-slate-100 transition-colors ${focusVisibleClasses}`}
                >
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
