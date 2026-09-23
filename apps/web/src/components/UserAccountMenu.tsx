import React, { useState, useRef, useEffect } from 'react';
import { UserAccount } from '../types/tenant';
import { Icon, Avatar } from '@bcip/ui';

interface UserAccountMenuProps {
  user: UserAccount;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
}

export function UserAccountMenu({ user, onOpenSettings, onSignOut }: UserAccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User account menu"
      >
        <Avatar name={user.fullName} size="sm" status="online" />
        <span className="hidden xl:inline text-xs font-medium text-slate-200 truncate max-w-[120px]">
          {user.fullName}
        </span>
        <Icon name="chevron-down" size="xs" className="hidden sm:inline text-slate-400" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User account actions"
          className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/80"
        >
          {/* User Profile Header */}
          <div className="p-4 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <Avatar name={user.fullName} size="md" status="online" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                <p className="text-[10px] font-mono text-emerald-400 mt-0.5">{user.role}</p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>2FA Security: <span className="text-emerald-400 font-semibold">Active</span></span>
              <span>{user.lastLogin}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-0.5 text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenSettings) onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              role="menuitem"
            >
              <Icon name="shield" size="xs" className="text-slate-400" />
              <span>Security & 2FA Audit</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenSettings) onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              role="menuitem"
            >
              <Icon name="sliders" size="xs" className="text-slate-400" />
              <span>Platform Preferences</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              role="menuitem"
            >
              <Icon name="file-text" size="xs" className="text-slate-400" />
              <span>Help & CSOS Guidelines</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="p-1.5 bg-slate-950/40">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onSignOut) onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-left text-xs"
              role="menuitem"
            >
              <Icon name="x" size="xs" className="text-rose-400" />
              <span>Sign out of BCIP session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
