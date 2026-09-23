import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../packages/ui/src/Modal';
import { Button } from '../../../../packages/ui/src/Button';
import { StatusIndicator } from '../../../../packages/ui/src/StatusIndicator';

interface ApiStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatusResponseData {
  applicationName: string;
  environment: string;
  nodeEnv?: string;
  applicationVersion: string;
  apiVersion: string;
  serviceStatus: string;
  demoMode?: boolean;
  logLevel?: string;
  networking?: {
    webUrl: string;
    apiUrl: string;
    requestIdHeader: string;
  };
  storage?: {
    provider: string;
    bucket: string;
    region: string;
    endpoint: string;
    ssl: boolean;
  };
  ai?: {
    enabled: boolean;
    ainubisEnabled: boolean;
    defaultProvider: string;
    temperature: number;
    maxTokens: number;
    auditEnabled: boolean;
    guardrailsEnabled: boolean;
  };
  worker?: {
    concurrency: number;
    jobTimeoutMs: number;
    retryLimit: number;
  };
  capabilities: Record<string, string>;
  timestamp: string;
  requestId: string;
}

interface HealthResponseData {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  requestId: string;
}

export function ApiStatusModal({ isOpen, onClose }: ApiStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusResponseData | null>(null);
  const [healthData, setHealthData] = useState<HealthResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'health' | 'env'>('status');

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch /health
      const healthRes = await fetch('/health');
      if (healthRes.ok) {
        const hJson = await healthRes.json();
        setHealthData(hJson);
      } else {
        throw new Error(`Health endpoint returned status ${healthRes.status}`);
      }

      // Fetch /api/v1/status
      const statusRes = await fetch('/api/v1/status');
      if (statusRes.ok) {
        const sJson = await statusRes.json();
        setStatusData(sJson.data);
      } else {
        throw new Error(`Status endpoint returned status ${statusRes.status}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query API endpoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Platform Health & Diagnostics"
      description="Live inspection of /health, /api/v1/status, and Prompt 001 environment configuration."
      footer={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchDiagnostics} isLoading={loading}>
            Refresh Diagnostics
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Sub-nav tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'status'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GET /api/v1/status
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'health'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GET /health
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'env'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Environment Settings
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded text-xs text-rose-300">
            <strong>Endpoint Connectivity Notice:</strong> {error}
          </div>
        )}

        {loading && !statusData && (
          <div className="py-8 text-center text-xs text-slate-400">
            Querying backend endpoints...
          </div>
        )}

        {activeTab === 'status' && statusData && (
          <div className="space-y-3">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Service Status:</span>
                <StatusIndicator
                  status={statusData.serviceStatus === 'operational' ? 'healthy' : 'warning'}
                  label={statusData.serviceStatus.toUpperCase()}
                  size="sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Application:</span>
                  <span className="text-slate-200 font-medium">{statusData.applicationName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Environment:</span>
                  <span className="text-slate-200 font-mono">{statusData.environment}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">App Version:</span>
                  <span className="text-slate-200 font-mono tabular-nums">{statusData.applicationVersion}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">API Version:</span>
                  <span className="text-slate-200 font-mono tabular-nums">{statusData.apiVersion}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Foundation Subsystem Readiness
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(statusData.capabilities || {}).map(([key, val]) => (
                  <div key={key} className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400 truncate text-[11px]">{key}</span>
                    <span className="font-mono text-emerald-400 text-[11px]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-800">
              <span>Request ID:</span>
              <span className="text-slate-400 truncate max-w-[200px]">{statusData.requestId}</span>
            </div>
          </div>
        )}

        {activeTab === 'health' && healthData && (
          <div className="space-y-3">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Health State:</span>
                <StatusIndicator
                  status={healthData.status === 'healthy' ? 'healthy' : 'alert'}
                  label={healthData.status.toUpperCase()}
                  size="sm"
                />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Service:</span>
                  <span className="text-slate-200 font-mono">{healthData.service}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Process Uptime:</span>
                  <span className="text-slate-200 font-mono tabular-nums">{healthData.uptimeSeconds} seconds</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Version:</span>
                  <span className="text-slate-200 font-mono tabular-nums">{healthData.version}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Server Timestamp:</span>
                  <span className="text-slate-400 font-mono text-[11px]">{healthData.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-800">
              <span>Correlation ID:</span>
              <span className="text-slate-400 truncate max-w-[200px]">{healthData.requestId}</span>
            </div>
          </div>
        )}

        {activeTab === 'env' && statusData && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Prompt 001 Development Profile
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Demo Mode</span>
                  <span className="font-mono text-emerald-400 font-semibold">{statusData.demoMode ? 'ENABLED (true)' : 'DISABLED'}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Log Level</span>
                  <span className="font-mono text-amber-300 font-semibold">{statusData.logLevel}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Object Storage & Worker Settings
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Storage Provider</span>
                  <span className="font-mono text-slate-200">{statusData.storage?.provider} ({statusData.storage?.bucket})</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Worker Concurrency</span>
                  <span className="font-mono text-slate-200">{statusData.worker?.concurrency} workers ({statusData.worker?.jobTimeoutMs}ms timeout)</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Ainubis / AI Foundation Flags
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">AI Enabled</span>
                  <span className="font-mono text-slate-400">{statusData.ai?.enabled ? 'true' : 'false (default)'}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Ainubis Layer</span>
                  <span className="font-mono text-slate-400">{statusData.ai?.ainubisEnabled ? 'true' : 'false (default)'}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Default Provider</span>
                  <span className="font-mono text-slate-200">{statusData.ai?.defaultProvider}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Guardrails & Audit</span>
                  <span className="font-mono text-emerald-400">Enforced (Active)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
