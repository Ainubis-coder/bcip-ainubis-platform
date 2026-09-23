import React, { useState, useEffect } from 'react';
import { ShellNotification } from '../types/tenant';
import { ModuleId } from '../types/navigation';
import { Icon } from '@bcip/ui';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ShellNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (actionUrl?: string) => void;
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
}: NotificationPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Close on Escape
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

  const filteredNotifications = notifications.filter(
    (n) => selectedCategory === 'all' || n.category === selectedCategory
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'operational', label: 'Operational' },
    { id: 'financial', label: 'Financial' },
    { id: 'governance', label: 'Governance' },
    { id: 'ainubis', label: 'Ainubis' },
  ];

  const getSeverityBadge = (severity: ShellNotification['severity']) => {
    switch (severity) {
      case 'error':
        return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" aria-label="Critical alert" />;
      case 'warning':
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-label="Warning" />;
      case 'success':
        return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-label="Nominal success" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" aria-label="Informational" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-panel-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <h2 id="notification-panel-title" className="text-sm font-semibold text-white">
              Notifications & Alerts
            </h2>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close notification panel"
            >
              <Icon name="x" size="xs" />
            </button>
          </div>
        </div>

        {/* Category Filter tabs */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Notification items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <Icon name="bell" size="lg" className="mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-300">All notifications caught up</p>
              <p className="text-[11px] text-slate-500 mt-1">No unread items in this filter category.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.actionUrl) {
                    onSelectNotification(notif.actionUrl);
                    onClose();
                  }
                }}
                className={`p-3 rounded my-1 transition-colors cursor-pointer ${
                  notif.read ? 'bg-slate-900/50 hover:bg-slate-800/40' : 'bg-slate-850/80 border-l-2 border-emerald-400 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {getSeverityBadge(notif.severity)}
                    <span className="font-semibold text-xs text-slate-100 truncate">{notif.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 pl-4 leading-relaxed line-clamp-2">{notif.message}</p>
                <div className="pl-4 mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="uppercase tracking-wider">{notif.category}</span>
                  {notif.actionUrl && (
                    <span className="text-emerald-400 flex items-center gap-1 hover:underline">
                      View details <Icon name="arrow-up-right" size="xs" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Notification Engine: Polling Active</span>
          <span className="text-slate-400">Phase 5 Full Dispatcher</span>
        </div>
      </div>
    </div>
  );
}
