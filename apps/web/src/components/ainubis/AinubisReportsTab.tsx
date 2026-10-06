/**
 * BCIP Ainubis CRM Executive Reporting Tab
 * Phase 2E — Prompt 002E-008
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Icon } from '@bcip/ui';
import { getCrmApiClient } from '../crm/shared/crm-api.ts';
import type { TenantContext, UserAccount } from '../../types/tenant';

interface AinubisReportsTabProps {
  activeTenant: TenantContext;
  user: UserAccount;
}

export function AinubisReportsTab({ activeTenant, user }: AinubisReportsTabProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New report form state
  const [reportType, setReportType] = useState('EXECUTIVE_PORTFOLIO_BRIEF');
  const [reportingPeriod, setReportingPeriod] = useState('WEEKLY');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [customTitle, setCustomTitle] = useState('');

  // Interactive UI action states
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user.id, user.role, user.userRole]
  );

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await api.listExecutiveReports();
      // Sort reports by generatedAt descending
      list.sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      setReports(list);
      
      // Keep selected report synchronized if open
      if (selectedReport) {
        const fresh = list.find((r: any) => r.id === selectedReport.id);
        if (fresh) {
          setSelectedReport(fresh);
          // Load versions
          const vers = await api.getExecutiveReportVersions(fresh.id);
          setVersions(vers);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load executive reports.');
    } finally {
      setIsLoading(false);
    }
  }, [api, selectedReport?.id]);

  useEffect(() => {
    loadReports();
  }, [activeTenant.id]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const dto = {
        reportType,
        reportingPeriod,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        title: customTitle.trim() || undefined,
      };
      const report = await api.generateExecutiveReport(dto);
      setSuccess(`Executive briefing report generated successfully as v${report.version}.`);
      setCustomTitle('');
      await loadReports();
      setSelectedReport(report);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectReport = async (report: any) => {
    setSelectedReport(report);
    setError(null);
    setSuccess(null);
    try {
      const vers = await api.getExecutiveReportVersions(report.id);
      setVersions(vers);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve report version history.');
    }
  };

  const handleRequestReview = async (reportId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.reviewExecutiveReport(reportId);
      setSuccess('Report submitted for human peer review.');
      await loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to change report status.');
    }
  };

  const handleApproveReport = async () => {
    if (!selectedReport) return;
    setError(null);
    setSuccess(null);
    try {
      await api.approveExecutiveReport(selectedReport.id, approvalReason.trim() || undefined);
      setSuccess('Executive briefing approved and recorded with cryptographic metadata sign-off.');
      setApprovalReason('');
      setShowApprovalModal(false);
      await loadReports();
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    }
  };

  const handleRejectReport = async () => {
    if (!selectedReport) return;
    setError(null);
    setSuccess(null);
    try {
      await api.rejectExecutiveReport(selectedReport.id, rejectionReason.trim() || undefined);
      setSuccess('Report rejected and reverted to draft status for correction.');
      setRejectionReason('');
      setShowRejectionModal(false);
      await loadReports();
    } catch (err: any) {
      setError(err.message || 'Rejection failed.');
    }
  };

  const handlePublishReport = async (reportId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.publishExecutiveReport(reportId);
      setSuccess('Executive briefing successfully published.');
      await loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to publish report.');
    }
  };

  const handleArchiveReport = async (reportId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.archiveExecutiveReport(reportId);
      setSuccess('Briefing report archived safely.');
      await loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to archive report.');
    }
  };

  const handleExportReport = async (report: any) => {
    setError(null);
    try {
      const jsonStr = await api.exportExecutiveReport(report.id);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `governed_briefing_${report.id}_v${report.version}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccess('Governed report payload exported safely.');
    } catch (err: any) {
      setError(err.message || 'Failed to export report payload.');
    }
  };

  // Format Status Badge Styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'APPROVED':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/25';
      case 'REVIEW_REQUIRED':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/25';
      case 'ARCHIVED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Executive Briefings & Governed Reports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Convert real-time telemetry metrics into immutable, peer-reviewed executive summaries, risk reports, and portfolio briefs with active evidence links.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadReports} disabled={isLoading}>
          <span className="flex items-center gap-1">
            <Icon name="refresh" size="xs" /> Sync Reports
          </span>
        </Button>
      </div>

      {success && (
        <div className="p-3 text-xs bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded flex items-center justify-between">
          <span className="font-mono">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs bg-rose-950/20 border border-rose-900 text-rose-400 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Generate & List */}
        <div className="space-y-6">
          
          {/* Generation Form */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Icon name="cpu" size="xs" className="text-sky-400" /> Generate Portfolio Briefing
            </h3>
            
            <form onSubmit={handleGenerateReport} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  <option value="EXECUTIVE_PORTFOLIO_BRIEF">Executive Portfolio Brief</option>
                  <option value="OPERATIONAL_HEALTH_REPORT">Operational Health Report</option>
                  <option value="RISK_AND_PRIORITY_REPORT">Risk and Priority Report</option>
                  <option value="TREND_ANALYSIS_REPORT">Trend Analysis Report</option>
                  <option value="WORKFLOW_PERFORMANCE_REPORT">Workflow Performance Report</option>
                  <option value="CRM_PIPELINE_REPORT">CRM Pipeline Report</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Reporting Period</label>
                <select
                  value={reportingPeriod}
                  onChange={(e) => setReportingPeriod(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  <option value="CURRENT">Current Point-in-time</option>
                  <option value="DAILY">Daily Summary</option>
                  <option value="WEEKLY">Weekly Summary</option>
                  <option value="MONTHLY">Monthly Summary</option>
                  <option value="QUARTERLY">Quarterly Summary</option>
                  <option value="CUSTOM">Custom Interval</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase block">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase block">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Custom Report Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Portfolio SLA Verification Review"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Synthesizing Telemetry...' : 'Synthesize & Generate Briefing'}
              </Button>
            </form>
          </div>

          {/* Reports List */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Governed Reports Archive ({reports.length})
            </h3>
            
            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No reports compiled yet. Select a reporting cycle to begin telemetry evaluation.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {reports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => handleSelectReport(rep)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1.5 ${
                      selectedReport?.id === rep.id
                        ? 'bg-slate-900 border-sky-500 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-semibold truncate text-slate-200 max-w-[150px]">{rep.title}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusBadge(rep.status)}`}>
                        {rep.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full text-[10px] text-slate-500 font-mono">
                      <span>v{rep.version}</span>
                      <span>{new Date(rep.generatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (span 2): Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-6">
              
              {/* Report Header Info */}
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-100">{selectedReport.title}</h3>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${getStatusBadge(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      Version {selectedReport.version}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {selectedReport.id} | Generated: {new Date(selectedReport.generatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button variant="secondary" size="sm" onClick={() => handleExportReport(selectedReport)}>
                    <span className="flex items-center gap-1"><Icon name="download" size="xs" /> Export JSON</span>
                  </Button>

                  {/* Actions according to lifecycle status */}
                  {selectedReport.status === 'DRAFT' && (
                    <Button variant="secondary" size="sm" onClick={() => handleRequestReview(selectedReport.id)}>
                      Submit Review
                    </Button>
                  )}

                  {selectedReport.status === 'REVIEW_REQUIRED' && (
                    <>
                      <button
                        onClick={() => setShowApprovalModal(true)}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-teal-500 text-slate-950 hover:bg-teal-400"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectionModal(true)}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-rose-600 text-slate-100 hover:bg-rose-500"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {selectedReport.status === 'APPROVED' && (
                    <button
                      onClick={() => handlePublishReport(selectedReport.id)}
                      className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    >
                      Publish Briefing
                    </button>
                  )}

                  {selectedReport.status !== 'ARCHIVED' && (
                                        <Button variant="secondary" size="sm" onClick={() => handleArchiveReport(selectedReport.id)}>
                      Archive
                    </Button>
                  )}
                </div>
              </div>

              {/* Version History Quick Selector */}
              {versions.length > 1 && (
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Compare Historical Versions:</span>
                  <div className="flex items-center gap-1.5">
                    {versions.map((ver) => (
                      <button
                        key={ver.id + '_' + ver.version}
                        onClick={() => setSelectedReport(ver)}
                        className={`px-2 py-1 text-[11px] font-mono font-bold rounded border ${
                          ver.version === selectedReport.version
                            ? 'bg-sky-500/10 border-sky-400/50 text-sky-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        v{ver.version}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality & Confidence Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900/20 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Report Confidence</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold font-mono ${
                        selectedReport.confidence === 'HIGH'
                          ? 'text-teal-400'
                          : selectedReport.confidence === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {selectedReport.confidence}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {selectedReport.confidence === 'HIGH'
                      ? 'Telemetry is grounded inside multiple active sources with fully resolved timestamps.'
                      : 'Telemetry exhibits profile gaps or insufficient historical interval datasets.'}
                  </p>
                </div>

                <div className="bg-slate-900/20 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Quality Flag State</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold font-mono ${
                        selectedReport.qualityState === 'COMPLETE'
                          ? 'text-emerald-400'
                          : selectedReport.qualityState === 'PARTIAL'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {selectedReport.qualityState}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {selectedReport.qualityState === 'INSUFFICIENT_DATA'
                      ? 'The model explicitly halts speculative analysis to protect compliance benchmarks.'
                      : 'All required CRM database modules are indexed correctly with zero speculative guesses.'}
                  </p>
                </div>
              </div>

              {/* Report Narrative Sections */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 pb-1.5">
                  Narrative Briefing Sections
                </h4>
                
                <div className="space-y-4">
                  {selectedReport.sections?.map((sec: any) => (
                    <div key={sec.id} className="bg-slate-900/35 border border-slate-800/60 rounded-lg p-4 space-y-2.5">
                      <h5 className="font-semibold text-slate-200 text-xs font-mono">{sec.title}</h5>
                      <p className="text-slate-300 text-xs leading-relaxed font-sans">{sec.content}</p>
                      
                      {/* Section Metrics (if any) */}
                      {sec.metrics && Object.keys(sec.metrics).length > 0 && (
                        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/40 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {Object.entries(sec.metrics).map(([key, val]: any) => (
                            <div key={key} className="text-left">
                              <span className="text-[9px] font-mono text-slate-500 uppercase block truncate">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-xs font-bold font-mono text-slate-300 tabular-nums">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Findings Lists */}
                      {sec.findings && sec.findings.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Telemetry Findings</span>
                          <ul className="text-[11px] text-slate-400 font-mono space-y-1">
                            {sec.findings.map((finding: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-sky-400 mt-0.5 font-bold shrink-0">›</span>
                                <span>{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Log Section */}
              <div className="space-y-3 bg-slate-900/10 border border-slate-800/60 rounded-lg p-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Grounded Evidence Reference Log
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">End-to-End Governance Audit Trail</span>
                </div>

                {(!selectedReport.evidence || selectedReport.evidence.length === 0) ? (
                  <div className="text-[11px] text-slate-500 font-mono">
                    No active evidence attachments. This indicates INSUFFICIENT_DATA or draft snapshot initialization.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {selectedReport.evidence.map((ev: any, i: number) => (
                      <div key={i} className="p-2.5 bg-slate-950 rounded border border-slate-800/40 text-[11px] flex items-start gap-2.5 justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-sky-400 font-bold uppercase text-[9px] px-1 bg-sky-500/10 border border-sky-500/20 rounded">
                              {ev.sourceType}
                            </span>
                            <span className="text-slate-500 text-[10px]">({ev.sourceId})</span>
                          </div>
                          <p className="text-slate-300 text-xs font-sans mt-1">{ev.description}</p>
                        </div>

                        <div className="text-right shrink-0 font-mono text-[9px] text-slate-500">
                          <div>Field: {ev.field || 'N/A'}</div>
                          <div>ID: {ev.correlationId ? ev.correlationId.substring(0, 10) : 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-12 text-center text-slate-500 space-y-3">
              <div className="flex justify-center text-slate-600">
                <Icon name="layers" size="lg" />
              </div>
              <p className="text-xs font-semibold">No Governed Report Selected</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Generate a fresh analytical briefing using the options on the left, or click on an existing historical brief from the list.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Human Approval Sign-Off Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-1.5">
              <Icon name="shield" size="xs" className="text-teal-400" /> Executive Peer Sign-Off
            </h4>
            
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Confirming this report creates an immutable signature signature linked directly to current verified CRM state hashes to secure reporting audit logs.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase block">Sign-off Remarks (Optional)</label>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Remarks about the audit or manual validation criteria met..."
                className="w-full text-xs p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 h-20 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-3 py-1.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReport}
                className="px-3 py-1.5 rounded bg-teal-500 text-slate-950 hover:bg-teal-400 font-semibold"
              >
                Apply Sign-off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-1.5">
              <Icon name="alert-triangle" size="xs" className="text-rose-400" /> Rejection & Reversion
            </h4>
            
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Reverting this report sends it back to Draft status. Please specify the correction details required for audit trail transparency.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase block">Rejection Reasons <span className="text-rose-400">*</span></label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify data discrepancies or required corrections..."
                className="w-full text-xs p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 h-20 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-3 py-1.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectReport}
                disabled={!rejectionReason.trim()}
                className="px-3 py-1.5 rounded bg-rose-600 text-slate-100 hover:bg-rose-500 font-semibold disabled:opacity-50"
              >
                Revert Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
