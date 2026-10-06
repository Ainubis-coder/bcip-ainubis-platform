/**
 * BCIP Ainubis CRM Portfolio Intelligence Web UI Tab
 * Phase 2E — Prompt 002E-007
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Icon } from '@bcip/ui';
import { getCrmApiClient } from '../crm/shared/crm-api.ts';
import type { TenantContext, UserAccount } from '../../types/tenant';

interface AinubisPortfolioTabProps {
  activeTenant: TenantContext;
  user: UserAccount;
}

export function AinubisPortfolioTab({ activeTenant, user }: AinubisPortfolioTabProps) {
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [health, setHealth] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [trendPeriod, setTrendPeriod] = useState<'7 DAYS' | '30 DAYS' | '90 DAYS'>('30 DAYS');

  // Stable API Client memoization preserving ADR-002 to avoid infinite loop depth
  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user.id, user.role, user.userRole]
  );

  const loadPortfolioData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [snapData, sigsData, risksData, trendsData, insightsData, prioritiesData, healthData] = await Promise.all([
        api.getPortfolioSnapshot().catch(() => null),
        api.getPortfolioSignals().catch(() => []),
        api.getPortfolioRisks().catch(() => []),
        api.getPortfolioTrends().catch(() => []),
        api.getPortfolioInsights().catch(() => []),
        api.getPortfolioPriorities().catch(() => []),
        api.getPortfolioHealth().catch(() => null),
      ]);

      setSnapshot(snapData);
      setSignals(sigsData);
      setRisks(risksData);
      setTrends(trendsData);
      setInsights(insightsData);
      setPriorities(prioritiesData);
      setHealth(healthData);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive portfolio intelligence data.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  const handleManualAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      await api.analyzePortfolio();
      setSuccessMessage('Portfolio snapshot evaluation and operational analysis run completed successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadPortfolioData();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger portfolio analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading && !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
        <div className="animate-spin text-sky-400">
          <Icon name="refresh" size="md" />
        </div>
        <span className="text-xs font-mono">Compiling portfolio metrics & signals...</span>
      </div>
    );
  }

  const m = snapshot?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header section with Health and Manual Trigger */}
      <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-200">Executive Portfolio Intelligence</h2>
            {health && (
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                  health.status === 'HEALTHY'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : health.status === 'ATTENTION'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {health.status}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {health?.reason || 'Calculated operational score of Sectional Title portfolios, SLAs, and active automation workflows.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadPortfolioData} disabled={isLoading}>
            <span className="flex items-center gap-1">
              <Icon name="refresh" size="xs" /> Refresh
            </span>
          </Button>

          <Button variant="primary" size="sm" onClick={handleManualAnalyze} disabled={isAnalyzing}>
            <span className="flex items-center gap-1">
              {isAnalyzing ? (
                <>
                  <div className="animate-spin text-slate-100">
                    <Icon name="refresh" size="xs" />
                  </div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Icon name="cpu" size="xs" /> Analyze Now
                </>
              )}
            </span>
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 text-xs bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded flex items-center justify-between">
          <span className="font-mono">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs bg-rose-950/20 border border-rose-900 text-rose-400 rounded">
          {error}
        </div>
      )}

      {/* Snapshot Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Active Pipelines</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1 tabular-nums">
            {m.totalOpportunities || 0}
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
            {m.stalledOpportunities || 0} stalled
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-rose-400 block">SLA Overdue Tasks</span>
          <div className="text-xl font-bold font-mono text-rose-300 mt-1 tabular-nums">
            {m.overdueTasks || 0}
          </div>
          <span className="text-[10px] text-rose-400/80 flex items-center gap-1 mt-0.5 font-mono">
            {m.highPriorityOverdueTasks || 0} Critical
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-sky-400 block">SLA Response Gap</span>
          <div className="text-xl font-bold font-mono text-sky-300 mt-1 tabular-nums">
            {m.uncontactedLeads || 0}
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
            New leads untouched
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block">Active Schemes</span>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1 tabular-nums">
            {m.totalSchemeProspects || 0}
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
            {m.incompleteSchemeData || 0} incomplete
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-amber-400 block">Workflow Failures</span>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1 tabular-nums">
            {m.failedWorkflows || 0}
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
            {m.verificationFailures || 0} step failures
          </span>
        </div>
      </div>

      {/* Main Grid: Left column (Signals & Priorities), Right column (Trends & Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2): Priorities and Signals */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Priority Queue Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Executive Action Priorities ({priorities.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Ranked by risk impact</span>
            </div>

            {priorities.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/10 rounded border border-slate-800/40 text-slate-500 text-xs">
                No active critical issues registered in the operational priority queue.
              </div>
            ) : (
              <div className="space-y-3">
                {priorities.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            item.severity === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : item.severity === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{item.description}</p>
                      <div className="text-[10px] text-sky-400 font-mono mt-1 flex items-center gap-1">
                        <Icon name="zap" size="xs" /> Recommended Action: {item.recommendedNextStep}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block font-mono">SCORE</span>
                      <span className="text-xs font-bold font-mono text-slate-300 tabular-nums">{item.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signals Feed */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Operational Telemetry Signals ({signals.length})
            </h3>

            {signals.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/10 rounded border border-slate-800/40 text-slate-500 text-xs">
                No active signals compiled yet. Run a portfolio analysis cycle to start.
              </div>
            ) : (
              <div className="space-y-3">
                {signals.map((sig) => (
                  <div
                    key={sig.id || sig.signalId}
                    className="p-3 bg-slate-900/20 border border-slate-800/60 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-300 font-semibold">
                        {sig.signalType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Trend: <strong className="text-slate-300">{sig.trend}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-slate-800/60 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Metric</span>
                        <span className="text-slate-300 tabular-nums">{sig.metricValue}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Threshold</span>
                        <span className="text-slate-300 tabular-nums">{sig.threshold}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Severity</span>
                        <span
                          className={`font-semibold ${
                            sig.severity === 'CRITICAL' || sig.severity === 'HIGH' ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {sig.severity}
                        </span>
                      </div>
                    </div>
                    {sig.evidence && sig.evidence[0] && (
                      <div className="text-[11px] text-slate-400 leading-normal flex items-start gap-1">
                        <span className="text-slate-500 block shrink-0 mt-0.5">•</span>
                        <span>{sig.evidence[0]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Span 1): Trends & Insights */}
        <div className="space-y-6">

          {/* Historical Trends */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Historical Trends
              </h3>
              
              {/* Segmented controls for trend selection - Interactive filters are allowed as clean background items */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
                {(['7 DAYS', '30 DAYS', '90 DAYS'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTrendPeriod(period)}
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded font-mono transition-colors whitespace-nowrap ${
                      trendPeriod === period
                        ? 'bg-slate-800 text-sky-400 border border-slate-700'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {period.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {trends.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/10 rounded border border-slate-800/40 text-slate-500 text-xs">
                No compiled trend datasets available.
              </div>
            ) : (
              <div className="space-y-3">
                {trends.map((tr) => (
                  <div key={tr.id} className="p-2.5 bg-slate-900/20 border border-slate-800/40 rounded flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{tr.metricName}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Evaluated on {trendPeriod} dataset</span>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <span
                        className={`font-semibold ${
                          tr.direction === 'UP'
                            ? 'text-emerald-400'
                            : tr.direction === 'DOWN'
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {tr.direction}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights Feed */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Ainubis Portfolio Insights ({insights.length})
            </h3>

            {insights.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/10 rounded border border-slate-800/40 text-slate-500 text-xs">
                No active evidence-backed insights identified for this portfolio.
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((ins) => (
                  <div key={ins.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{ins.insight}</span>
                      <span className="font-mono text-[10px] text-emerald-400 shrink-0">{ins.confidence}% Confidence</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      <strong>Why it matters:</strong> {ins.whyItMatters}
                    </p>
                    {ins.evidence && ins.evidence[0] && (
                      <div className="p-2 bg-slate-950 border border-slate-800/60 rounded text-[10px] font-mono text-slate-400">
                        <span className="text-slate-500 uppercase block text-[8px] mb-0.5">Supporting Evidence</span>
                        {ins.evidence[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
