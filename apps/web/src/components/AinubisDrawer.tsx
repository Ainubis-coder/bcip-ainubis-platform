import React, { useEffect } from 'react';
import { ModuleId } from '../types/navigation';
import { Icon, Button, AinubisBadge } from '@bcip/ui';

interface AinubisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (moduleId: ModuleId) => void;
}

export function AinubisDrawer({ isOpen, onClose, onNavigate }: AinubisDrawerProps) {
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
      aria-labelledby="ainubis-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-sky-950/80 border border-sky-800 text-sky-400">
              <Icon name="cpu" size="sm" />
            </div>
            <div>
              <h2 id="ainubis-drawer-title" className="text-sm font-semibold text-white">
                Ainubis Intelligence Gateway
              </h2>
              <p className="text-[11px] text-slate-400">
                Cognitive telemetry & fiduciary governance oversight
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close Ainubis drawer"
          >
            <Icon name="x" size="xs" />
          </button>
        </div>

        {/* State Summary Cards */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Intelligence State Snapshot
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Observations</span>
                <span className="text-lg font-bold text-slate-200">4 active</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Inferred Insights</span>
                <span className="text-lg font-bold text-sky-400">2 active</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Recommendations</span>
                <span className="text-lg font-bold text-indigo-400">2 active</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Urgent Alerts</span>
                <span className="text-lg font-bold text-amber-400">3 active</span>
              </div>
            </div>
          </div>

          {/* Urgent Human Approval Gate */}
          <div className="p-3 rounded bg-pink-950/20 border border-pink-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <AinubisBadge state="approval_required" />
              <span className="text-[10px] font-mono text-pink-400 font-bold uppercase">1 Action Blocked</span>
            </div>
            <p className="text-xs font-semibold text-slate-100">
              Section 38(1) Notice of Breach to Unit 42
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Autonomous execution prohibited. Requires verified trustee confirmation prior to dispatch.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                onNavigate('ainubis');
                onClose();
              }}
            >
              Review Pending Gate in Ainubis
            </Button>
          </div>

          {/* Telemetry Summary */}
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Recent Signals
            </span>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-amber-400 font-medium">Nighttime Water Spike</span>
                  <span className="text-[10px] font-mono text-slate-500">4m ago</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sandton Grand Terraces: +833% over baseline flow
                </p>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-sky-400 font-medium">Seasonal Arrears Trend</span>
                  <span className="text-[10px] font-mono text-slate-500">2h ago</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cape Point Heights: 78% of 90-day arrears from short-term rentals
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              onNavigate('ainubis');
              onClose();
            }}
          >
            Open Full Ainubis Workspace
          </Button>
          <p className="text-[10px] font-mono text-slate-400 text-center">
            Ainubis is an internal intelligence layer, not a conversational chatbot.
          </p>
        </div>
      </div>
    </div>
  );
}
