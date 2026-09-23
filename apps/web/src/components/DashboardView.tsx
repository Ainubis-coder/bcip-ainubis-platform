import React, { useState } from 'react';
import {
  DEMO_PORTFOLIO_METRICS,
  DEMO_SCHEMES_LIST,
  DEMO_RECENT_TASKS,
  DEMO_AINUBIS_STATUS,
  DemoSchemeSummary,
} from '../data/mock-dashboard-data';
import { ModuleId } from '../types/navigation';
import { PageHeader } from './PageHeader';
import { Card, StatusIndicator, Table, Column, Button, Badge } from '@bcip/ui';

interface DashboardViewProps {
  onNavigate: (module: ModuleId) => void;
  onOpenStatusModal: () => void;
  apiHealthy: boolean;
}

export function DashboardView({
  onNavigate,
  onOpenStatusModal,
  apiHealthy,
}: DashboardViewProps) {
  const [schemeFilter, setSchemeFilter] = useState<'all' | 'nominal' | 'action'>('all');

  const filteredSchemes = DEMO_SCHEMES_LIST.filter((scheme) => {
    if (schemeFilter === 'nominal') return scheme.status === 'Nominal';
    if (schemeFilter === 'action') return scheme.status !== 'Nominal';
    return true;
  });

  const schemeColumns: Column<DemoSchemeSummary & Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Scheme Name',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-100 block">{row.name}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">{row.organisation}</span>
        </div>
      ),
    },
    {
      key: 'units',
      header: 'Total Units',
      isNumeric: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-slate-200">{row.units}</span>
      ),
    },
    {
      key: 'financialYearEnd',
      header: 'Year End',
      render: (row) => (
        <span className="text-slate-400 font-mono text-[11px]">{row.financialYearEnd}</span>
      ),
    },
    {
      key: 'status',
      header: 'Operational Status',
      render: (row) => {
        const variant =
          row.status === 'Nominal'
            ? 'healthy'
            : row.status === 'Action Required'
            ? 'alert'
            : 'warning';
        return <StatusIndicator status={variant} label={row.status} size="sm" />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <PageHeader
        title="Portfolio Intelligence & Operations"
        description="Unified multi-tenant console for managing agents, trustees, and portfolio executives. Real-time telemetry and Ainubis AI orchestrator status."
        breadcrumbs={[
          { label: 'BCIP' },
          { label: 'Overview' },
          { label: 'Dashboard' },
        ]}
        onNavigate={onNavigate}
        statusBadge={<Badge variant="warning">Demo Dataset Active</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={onOpenStatusModal}>
              System Diagnostics
            </Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('schemes')}>
              Manage Schemes
            </Button>
          </>
        }
      />

      {/* Portfolio Overview Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEMO_PORTFOLIO_METRICS.map((metric) => (
          <Card key={metric.id} padding="sm" className="bg-slate-900/90">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              {metric.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
                {metric.value}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {metric.benchmark}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              {metric.subtext}
            </p>
          </Card>
        ))}
      </div>

      {/* Main Grid: Schemes Portfolio & Ainubis Intelligence Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Schemes & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schemes Register */}
          <Card
            title="Registered Schemes Portfolio"
            description="Active body corporate and sectional title entities under management."
            padding="none"
            headerAction={
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  onClick={() => setSchemeFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    schemeFilter === 'all'
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Schemes
                </button>
                <button
                  onClick={() => setSchemeFilter('action')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    schemeFilter === 'action'
                      ? 'bg-slate-800 text-amber-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Requires Action
                </button>
              </div>
            }
          >
            <Table
              columns={schemeColumns}
              data={filteredSchemes as (DemoSchemeSummary & Record<string, unknown>)[]}
              onRowClick={() => onNavigate('schemes')}
            />
          </Card>

          {/* Open Governance & Maintenance Tasks */}
          <Card
            title="Active Operational Tasks"
            description="Urgent trustee approvals, maintenance tickets, and compliance schedules."
            padding="sm"
            headerAction={
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                View all 19 tasks →
              </button>
            }
          >
            <div className="space-y-3">
              {DEMO_RECENT_TASKS.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300">{task.scheme}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-100 truncate">
                      {task.title}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-medium block ${
                        task.priority === 'Urgent'
                          ? 'text-rose-400'
                          : task.priority === 'High'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums block mt-0.5">
                      Due: {task.due}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Ainubis Intelligence & Health Telemetry */}
        <div className="space-y-6">
          {/* Ainubis Intelligence Status Panel */}
          <Card
            title="Ainubis Intelligence Layer"
            description="Autonomous telemetry, reasoning rules, and recommendation orchestration."
            padding="md"
          >
            <div className="space-y-4">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">Orchestrator State</span>
                  <StatusIndicator
                    status={DEMO_AINUBIS_STATUS.layerStatus === 'Operational' ? 'healthy' : 'warning'}
                    label={DEMO_AINUBIS_STATUS.layerStatus}
                    size="sm"
                  />
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  {DEMO_AINUBIS_STATUS.orchestratorVersion}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-400">
                  <span>Active Agent Roles:</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {DEMO_AINUBIS_STATUS.activeAgents} Registered
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-400">
                  <span>Pending AI Suggestions:</span>
                  <span className="font-mono tabular-nums text-amber-400">
                    {DEMO_AINUBIS_STATUS.pendingRecommendations} Awaiting Review
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-400">
                  <span>Model Gateway:</span>
                  <span className="text-slate-200">Gemini 2.5 Flash / Pro</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-400">
                  <span>Heartbeat:</span>
                  <span className="text-emerald-400">{DEMO_AINUBIS_STATUS.lastTelemetryPing}</span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onNavigate('ainubis')}
              >
                Inspect Ainubis Agent Layer
              </Button>
            </div>
          </Card>

          {/* Infrastructure Health Status */}
          <Card
            title="Service Connectivity"
            description="Foundation runtime services and background workers."
            padding="sm"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/40">
                <span className="text-xs text-slate-300">Backend API</span>
                <StatusIndicator
                  status={apiHealthy ? 'healthy' : 'warning'}
                  label={apiHealthy ? 'Online' : 'Checking'}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950/40">
                <span className="text-xs text-slate-300">PostgreSQL Pool</span>
                <StatusIndicator status="healthy" label="Configured" size="sm" />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950/40">
                <span className="text-xs text-slate-300">Redis Worker Queue</span>
                <StatusIndicator status="healthy" label="Configured" size="sm" />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950/40">
                <span className="text-xs text-slate-300">S3 Storage Abstraction</span>
                <StatusIndicator status="neutral" label="Standby" size="sm" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
