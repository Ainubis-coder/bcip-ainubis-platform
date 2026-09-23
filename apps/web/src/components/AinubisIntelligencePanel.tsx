import React, { useState } from 'react';
import { Card } from '../../../../packages/ui/src/Card';
import { Button } from '../../../../packages/ui/src/Button';
import { StatusIndicator } from '../../../../packages/ui/src/StatusIndicator';

interface AinubisIntelligencePanelProps {
  onReturnToDashboard: () => void;
}

export function AinubisIntelligencePanel({ onReturnToDashboard }: AinubisIntelligencePanelProps) {
  const [selectedSubsystem, setSelectedSubsystem] = useState<'gateway' | 'policies' | 'agents' | 'audit'>('gateway');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Ainubis Intelligence Layer</span>
            <span aria-hidden="true">·</span>
            <span>Architectural Abstraction</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">Package @bcip/ai Initialized</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Ainubis AI Platform Orchestration
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Governance-controlled AI operating layer for sectional-title ecosystems.
            Designed for multi-model abstraction, prompt versioning, strict tenant isolation, and audit observability.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onReturnToDashboard}>
          ← Dashboard
        </Button>
      </div>

      {/* Navigation Subsystem Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setSelectedSubsystem('gateway')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            selectedSubsystem === 'gateway'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Provider Gateway
        </button>
        <button
          onClick={() => setSelectedSubsystem('policies')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            selectedSubsystem === 'policies'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tenant Guardrails & Policies
        </button>
        <button
          onClick={() => setSelectedSubsystem('agents')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            selectedSubsystem === 'agents'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Planned Autonomous Agents
        </button>
        <button
          onClick={() => setSelectedSubsystem('audit')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            selectedSubsystem === 'audit'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit & Observability
        </button>
      </div>

      {/* Content Panes */}
      {selectedSubsystem === 'gateway' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Gateway Abstraction Layer"
            description="Multi-model provider routing engine (@bcip/ai/src/gateway.ts)"
            padding="md"
          >
            <div className="space-y-4 text-xs text-slate-300">
              <p>
                The Ainubis Gateway mediates all LLM and reasoning operations. It routes prompts to the optimal
                model based on task complexity, cost, latency constraints, and data residency policies.
              </p>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Default Model Provider:</span>
                  <span className="font-mono text-emerald-400">Gemini 2.5 Flash</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">High-Reasoning Provider:</span>
                  <span className="font-mono text-slate-200">Gemini 2.5 Pro</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Alternative Providers:</span>
                  <span className="font-mono text-slate-200">Claude 3.7 / OpenAI</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Function Calling Registry:</span>
                  <span className="text-emerald-400">Supported (ToolRegistry)</span>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Prompt Management Engine"
            description="Template repository with version control (@bcip/ai/src/prompt.ts)"
            padding="md"
          >
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Domain-specific prompt engineering templates partitioned by property operational spheres:
              </p>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-400">
                <span className="text-emerald-400">Template ID:</span> levy-anomaly-detection (v1.0.0)<br />
                <span className="text-emerald-400">Domain:</span> finance<br />
                <span className="text-emerald-400">Variables:</span> [schemeName, benchmark]<br />
                <span className="text-emerald-400">Role:</span> Ainubis Property Intelligence
              </div>
              <p className="text-slate-400 text-[11px]">
                Full domain prompt library to be populated in Prompt 020.
              </p>
            </div>
          </Card>
        </div>
      )}

      {selectedSubsystem === 'policies' && (
        <Card
          title="Data Security & Tenant Guardrails"
          description="Strict isolation and PII protection engine (@bcip/ai/src/policies.ts)"
          padding="md"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded bg-slate-950/60 border border-slate-800">
              <h4 className="font-semibold text-slate-200 mb-2">Tenant Isolation</h4>
              <p className="text-slate-400 leading-relaxed">
                Zero cross-tenant leakage. Every AI prompt invocation requires a validated tenantId context
                checked prior to model dispatch.
              </p>
            </div>

            <div className="p-4 rounded bg-slate-950/60 border border-slate-800">
              <h4 className="font-semibold text-slate-200 mb-2">Automated PII Redaction</h4>
              <p className="text-slate-400 leading-relaxed">
                Owner banking information, personal identity numbers, and credit cards are automatically
                sanitized before passing to model providers.
              </p>
            </div>

            <div className="p-4 rounded bg-slate-950/60 border border-slate-800">
              <h4 className="font-semibold text-slate-200 mb-2">Token Quota Governance</h4>
              <p className="text-slate-400 leading-relaxed">
                Per-tenant and per-scheme daily token limits prevent denial-of-wallet anomalies and runaway loops.
              </p>
            </div>
          </div>
        </Card>
      )}

      {selectedSubsystem === 'agents' && (
        <Card
          title="Planned Ainubis Autonomous Agents"
          description="Architectural agents scheduled for Phase 5 orchestration"
          padding="md"
        >
          <div className="space-y-3">
            {[
              {
                name: 'Levy Sentinel Agent',
                task: 'Monitors payment variances, generates arrears risk scores, suggests trustee reminders.',
                status: 'Interface Defined',
              },
              {
                name: 'Maintenance Dispatch Agent',
                task: 'Analyzes emergency ticket descriptions, checks warranty/insurance, matches vetted contractors.',
                status: 'Interface Defined',
              },
              {
                name: 'Governance & AGM Agent',
                task: 'Calculates participation quotas, checks statutory notice periods, formats AGM minutes.',
                status: 'Interface Defined',
              },
              {
                name: 'Compliance Watchdog Agent',
                task: 'Tracks 10-year reserve fund plans, fire hydrant inspections, and CSOS fee returns.',
                status: 'Interface Defined',
              },
            ].map((agent, i) => (
              <div
                key={i}
                className="p-3 rounded border border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-medium text-xs text-slate-100">{agent.name}</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{agent.task}</p>
                </div>
                <StatusIndicator status="neutral" label={agent.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedSubsystem === 'audit' && (
        <Card
          title="AI Audit Trail & Observability"
          description="Every model invocation recorded for compliance and statutory reviews"
          padding="md"
        >
          <div className="space-y-3 text-xs text-slate-300">
            <p>
              In accordance with sectional title fiduciary governance, all AI reasoning that influences
              trustee decisions will have an immutable audit record:
            </p>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] space-y-1 text-slate-400">
              <div>record_id: "audit_918231928"</div>
              <div>tenant_id: "tenant-demo-vanguard"</div>
              <div>correlation_id: "bcip_req_1727082910_a8f91"</div>
              <div>model: "gemini-2.5-flash"</div>
              <div>tokens: 420 (prompt) · 88 (completion)</div>
              <div>policy_compliance: "verified_pass"</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
