import React, { useEffect } from 'react';
import { ModuleId, ENTERPRISE_NAV_GROUPS } from '../types/navigation';
import { TenantContext, UserAccount } from '../types/tenant';
import { Icon, Avatar } from '@bcip/ui';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule: ModuleId;
  onNavigate: (moduleId: ModuleId) => void;
  activeTenant: TenantContext;
  onOpenTenantModal: () => void;
  user: UserAccount;
}

export function MobileNavigation({
  isOpen,
  onClose,
  currentModule,
  onNavigate,
  activeTenant,
  onOpenTenantModal,
  user,
}: MobileNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              B
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">BCIP</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  v0.1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Enterprise OS</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
            aria-label="Close navigation drawer"
          >
            <Icon name="x" size="xs" />
          </button>
        </div>

        {/* Organisation Context Indicator */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => {
              onClose();
              onOpenTenantModal();
            }}
            className="w-full text-left p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Active Managing Agency
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                {activeTenant.name}
              </span>
              <Icon name="chevron-down" size="xs" className="text-slate-400 shrink-0" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {activeTenant.schemeCount} Schemes · {activeTenant.unitCount.toLocaleString()} Units
            </span>
          </button>
        </div>

        {/* Navigation Groups List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {ENTERPRISE_NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors text-left ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500 pl-2'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          name={item.iconName as any}
                          size="xs"
                          className={isActive ? 'text-emerald-400' : 'text-slate-400'}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badgeCount && item.badgeCount > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 tabular-nums">
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Account Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user.fullName} size="sm" status="online" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
