import React, { useEffect } from 'react';
import { AVAILABLE_TENANTS } from '../data/mock-notifications-data';
import { TenantContext } from '../types/tenant';
import { Icon, Button } from '@bcip/ui';

interface TenantContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: TenantContext;
  onSwitchTenant: (tenant: TenantContext) => void;
}

export function TenantContextModal({
  isOpen,
  onClose,
  activeTenant,
  onSwitchTenant,
}: TenantContextModalProps) {
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
      aria-labelledby="tenant-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <Icon name="building" size="sm" />
            </div>
            <div>
              <h2 id="tenant-modal-title" className="text-base font-semibold text-white">
                Organisation & Portfolio Context
              </h2>
              <p className="text-xs text-slate-400">
                Active managing agent portfolio workspace & cryptographic isolation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close tenant context modal"
          >
            <Icon name="x" size="xs" />
          </button>
        </div>

        {/* Current Active Tenant Details */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Active Managing Agency
          </div>
          <div className="p-4 rounded bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-white">{activeTenant.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase font-bold">
                {activeTenant.tier}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3 pt-3 border-t border-slate-800 font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Schemes</span>
                <span className="font-bold text-slate-100">{activeTenant.schemeCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Units</span>
                <span className="font-bold text-slate-100">{activeTenant.unitCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Reg No.</span>
                <span className="text-slate-300 truncate block">{activeTenant.registrationNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">CSOS Status</span>
                <span className="text-emerald-400 font-semibold">Registered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Available Tenants in Environment */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Switch Managing Agency Portfolio (Demo Workspace)
          </div>
          <div className="space-y-2">
            {AVAILABLE_TENANTS.map((t) => {
              const isSelected = t.id === activeTenant.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSwitchTenant(t);
                    onClose();
                  }}
                  className={`p-3 rounded border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/80 text-white'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-slate-100">{t.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-emerald-400 px-1 rounded bg-slate-900 border border-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {t.schemeCount} Schemes · {t.unitCount.toLocaleString()} Units · {t.region}
                    </span>
                  </div>

                  <Button
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchTenant(t);
                      onClose();
                    }}
                  >
                    {isSelected ? 'Selected' : 'Switch'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Icon name="shield" size="xs" className="text-emerald-400" />
            <span className="text-[11px] font-mono">Row-Level Security (RLS) Enforced</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
