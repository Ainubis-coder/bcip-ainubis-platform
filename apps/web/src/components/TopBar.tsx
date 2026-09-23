import React from 'react';
import { ModuleId } from '../types/navigation';
import { TenantContext, UserAccount } from '../types/tenant';
import { UserAccountMenu } from './UserAccountMenu';
import { Icon } from '@bcip/ui';

interface TopBarProps {
  currentModule: ModuleId;
  onNavigate: (moduleId: ModuleId) => void;
  onOpenStatusModal: () => void;
  apiHealthy: boolean;
  activeTenant: TenantContext;
  onOpenTenantModal: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onOpenAinubisDrawer: () => void;
  user: UserAccount;
  onToggleMobileNav: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
}

export function TopBar({
  currentModule,
  onNavigate,
  onOpenStatusModal,
  apiHealthy,
  activeTenant,
  onOpenTenantModal,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount,
  onOpenAinubisDrawer,
  user,
  onToggleMobileNav,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}: TopBarProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 lg:px-6 backdrop-blur-sm select-none">
      {/* =========================================================================
          ZONE 1 — IDENTITY & SHELL CONTROLS
          ========================================================================= */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="Open mobile navigation"
        >
          <Icon name="menu" size="xs" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleSidebarCollapse}
          className="hidden lg:flex p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name="menu" size="xs" />
        </button>

        {/* BCIP Brand Identity */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 rounded px-1"
        >
          <div className="w-7 h-7 rounded bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            B
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white">BCIP</span>
            <span className="hidden xl:inline text-xs text-slate-400 font-medium">
              Body Corporate Intelligence Platform
            </span>
            <span className="hidden sm:inline text-[10px] font-mono px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-emerald-400">
              v0.1.0
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ZONE 2 — OPERATIONAL CONTEXT & GLOBAL SEARCH
          ========================================================================= */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center max-w-xl px-2">
        {/* Organisation Context Switcher Trigger */}
        <button
          type="button"
          onClick={onOpenTenantModal}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 max-w-[160px] sm:max-w-[240px] truncate"
          aria-label="Active organisation context"
        >
          <Icon name="building" size="xs" className="text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="block text-xs font-semibold text-slate-100 truncate leading-tight">
              {activeTenant.name}
            </span>
            <span className="hidden sm:block text-[10px] font-mono text-slate-400 truncate leading-tight">
              {activeTenant.schemeCount} Schemes · {activeTenant.unitCount.toLocaleString()} Units
            </span>
          </div>
          <Icon name="chevron-down" size="xs" className="text-slate-500 shrink-0 ml-auto hidden sm:inline" />
        </button>

        {/* Global Search Input Button (Ctrl+K) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex-1 max-w-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 text-xs"
          aria-label="Open global search (Press Ctrl+K or Cmd+K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="search" size="xs" className="shrink-0" />
            <span className="truncate hidden md:inline">Search schemes, units, invoices...</span>
            <span className="truncate md:hidden">Search...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* =========================================================================
          ZONE 3 — INTELLIGENCE, ALERTS & USER ACCOUNT
          ========================================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Ainubis Intelligence Quick Trigger */}
        <button
          type="button"
          onClick={onOpenAinubisDrawer}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded border border-sky-900/60 bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 text-xs"
          aria-label="Open Ainubis Intelligence telemetry drawer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
          </span>
          <span className="font-semibold hidden sm:inline">Ainubis</span>
          <span className="text-[10px] font-mono px-1 rounded bg-sky-900/80 text-sky-200">
            3
          </span>
        </button>

        {/* Notifications Bell Trigger */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 transition-colors"
          aria-label={`Open notifications (${unreadNotificationsCount} unread)`}
        >
          <Icon name="bell" size="xs" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </button>

        {/* API & Worker Diagnostic Indicator */}
        <button
          type="button"
          onClick={onOpenStatusModal}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
          aria-label="Open API & Worker Status Diagnostics"
        >
          <span
            className={`w-2 h-2 rounded-full ${apiHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}
          />
          <span className="text-[11px] hidden lg:inline">
            {apiHealthy ? 'API: OK' : 'API: ERR'}
          </span>
        </button>

        {/* User Account Menu */}
        <div className="pl-1 sm:pl-2 border-l border-slate-800">
          <UserAccountMenu
            user={user}
            onOpenSettings={() => onNavigate('administration')}
            onSignOut={() => onNavigate('dashboard')}
          />
        </div>
      </div>
    </header>
  );
}
