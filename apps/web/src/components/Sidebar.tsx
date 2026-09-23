import React from 'react';
import { ModuleId, ENTERPRISE_NAV_GROUPS, NavItem } from '../types/navigation';
import { Icon, Tooltip } from '@bcip/ui';

interface SidebarProps {
  currentModule: ModuleId;
  onNavigate: (moduleId: ModuleId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAinubisDrawer: () => void;
}

export function Sidebar({
  currentModule,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onOpenAinubisDrawer,
}: SidebarProps) {
  const renderNavItem = (item: NavItem) => {
    const isActive = currentModule === item.id;
    const isAinubisCore = item.id === 'ainubis';

    const buttonContent = (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavigate(item.id);
        }}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full group flex items-center transition-all duration-150 rounded text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          isCollapsed ? 'justify-center p-2.5 my-1' : 'justify-between px-3 py-2 my-0.5'
        } ${
          isActive
            ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-400 pl-2.5'
            : isAinubisCore
            ? 'text-sky-300 hover:text-white hover:bg-slate-800/60'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
          <Icon
            name={item.iconName as any}
            size="xs"
            className={`shrink-0 transition-transform duration-150 ${
              isActive
                ? 'text-emerald-400'
                : isAinubisCore
                ? 'text-sky-400 group-hover:scale-110'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          {!isCollapsed && (
            <span className="truncate text-left leading-none">{item.label}</span>
          )}
        </div>

        {!isCollapsed && item.badgeCount && item.badgeCount > 0 && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border tabular-nums shrink-0 ${
              item.id === 'alerts'
                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                : item.id === 'recommendations'
                ? 'bg-indigo-950/80 text-indigo-400 border-indigo-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {item.badgeCount}
          </span>
        )}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip
          key={item.id}
          content={
            <div className="flex items-center gap-2">
              <span>{item.label}</span>
              {item.badgeCount ? (
                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-emerald-400">
                  {item.badgeCount}
                </span>
              ) : null}
            </div>
          }
          position="right"
        >
          {buttonContent}
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <aside
      aria-label="Primary Navigation"
      className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 select-none transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {ENTERPRISE_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-0.5">
            {!isCollapsed ? (
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
                <span>{group.label}</span>
              </div>
            ) : (
              <div className="my-1.5 mx-auto w-6 border-t border-slate-800/80" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse / Expand Toggle Button Footer */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        {!isCollapsed && (
          <div className="px-2 text-[10px] font-mono text-slate-400 truncate">
            <span>BCIP Shell v0.1.0</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 transition-colors ${
            isCollapsed ? 'w-full flex justify-center' : ''
          }`}
        >
          <Icon
            name={isCollapsed ? 'chevron-right' : 'chevron-left'}
            size="xs"
            className="text-slate-400"
          />
        </button>
      </div>
    </aside>
  );
}
