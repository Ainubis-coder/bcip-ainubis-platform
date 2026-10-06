/**
 * BCIP Accounts Receivable Aging, Customer Statements, Collection Priority & Reconciliation UI Views
 * Phase 3 — Prompt 003-006
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Icon } from '@bcip/ui';

interface ArAgingViewsProps {
  api: any;
  customers: any[];
  receivables: any[];
  payments: any[];
  onOpenRecordPayment?: (customerId?: string) => void;
  onNavigateToCustomer?: (customerId: string) => void;
}

export function ArAgingDashboardView({
  api,
  customers,
  onOpenStatement,
}: {
  api: any;
  customers: any[];
  onOpenStatement: (customerId: string) => void;
}) {
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReceivablesAging({
        asOfDate,
        customerId: selectedCustomerId || undefined,
      });
      setPortfolio(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AR aging data.');
    } finally {
      setIsLoading(false);
    }
  }, [api, asOfDate, selectedCustomerId]);

  useEffect(() => {
    fetchAgingData();
  }, [fetchAgingData]);

  const bucketColor = (bucket: string) => {
    switch (bucket) {
      case 'CURRENT':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      case 'DAYS_1_30':
        return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'DAYS_31_60':
        return 'text-orange-400 bg-orange-950/40 border-orange-800';
      case 'DAYS_61_90':
        return 'text-rose-400 bg-rose-950/40 border-rose-800';
      case 'DAYS_91_120':
        return 'text-purple-400 bg-purple-950/40 border-purple-800';
      case 'DAYS_121_PLUS':
        return 'text-red-400 bg-red-950/40 border-red-800';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              As Of Evaluation Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Filter By Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="">All Customers (Portfolio)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName} ({c.customerNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAgingData}
          disabled={isLoading}
        >
          {isLoading ? 'Recalculating...' : 'Refresh Aging'}
        </Button>

      </div>

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Aging Metric Cards */}
      {portfolio && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Outstanding</span>
              <div className="text-base font-bold font-mono text-slate-100 mt-1">
                {portfolio.currency} {Number(portfolio.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500">{portfolio.totalReceivablesCount} receivables</span>
            </div>

            <div className="bg-slate-950 border border-rose-900/60 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-rose-400 block">Total Overdue</span>
              <div className="text-base font-bold font-mono text-rose-300 mt-1">
                {portfolio.currency} {Number(portfolio.overdueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-rose-400">{portfolio.overdueCount} overdue</span>
            </div>

            <div className="bg-slate-950 border border-emerald-900/60 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">Current (&le; 0d)</span>
              <div className="text-base font-bold font-mono text-emerald-300 mt-1">
                {portfolio.currency} {Number(portfolio.current || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-500">Not yet due</span>
            </div>

            <div className="bg-slate-950 border border-amber-900/60 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-amber-400 block">1 - 30 Days</span>
              <div className="text-base font-bold font-mono text-amber-300 mt-1">
                {portfolio.currency} {Number(portfolio.days1To30 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-amber-500">Early reminder</span>
            </div>

            <div className="bg-slate-950 border border-orange-900/60 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-orange-400 block">31 - 60 Days</span>
              <div className="text-base font-bold font-mono text-orange-300 mt-1">
                {portfolio.currency} {Number(portfolio.days31To60 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-orange-500">First notice</span>
            </div>

            <div className="bg-slate-950 border border-rose-900/60 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-rose-400 block">61 - 90 Days</span>
              <div className="text-base font-bold font-mono text-rose-300 mt-1">
                {portfolio.currency} {Number(portfolio.days61To90 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-rose-500">Formal demand</span>
            </div>

            <div className="bg-slate-950 border border-purple-900/60 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-purple-400 block">91 - 120 Days</span>
              <div className="text-base font-bold font-mono text-purple-300 mt-1">
                {portfolio.currency} {Number(portfolio.days91To120 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-purple-500">Direct contact</span>
            </div>

            <div className="bg-slate-950 border border-red-900/60 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-red-400 block">121+ Days</span>
              <div className="text-base font-bold font-mono text-red-300 mt-1">
                {portfolio.currency} {Number(portfolio.days121Plus || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-red-500">Collections</span>
            </div>
          </div>

          {/* Customer Aging Breakdown Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Customer AR Balances & Aging Summary</h3>
                <p className="text-xs text-slate-400">Server-authoritative deterministic aging calculated as of {portfolio.asOfDate}</p>
              </div>
              <span className="text-xs font-mono text-slate-400">{portfolio.customerBalances?.length || 0} Customers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-right">Total Invoiced</th>
                    <th className="py-2.5 px-3 text-right">Total Paid</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-200">Outstanding</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Current</th>
                    <th className="py-2.5 px-3 text-right text-amber-400">1 - 30d</th>
                    <th className="py-2.5 px-3 text-right text-orange-400">31 - 60d</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">61 - 90d</th>
                    <th className="py-2.5 px-3 text-right text-purple-400">91 - 120d</th>
                    <th className="py-2.5 px-3 text-right text-red-400">121+d</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {portfolio.customerBalances?.map((cb: any) => (
                    <tr key={cb.customerId} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-sans font-medium text-slate-200">
                        {cb.customerName}
                        {cb.overdueCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-400 border border-rose-800">
                            {cb.overdueCount} overdue
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {cb.totalReceivable?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {cb.totalPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-100">
                        {cb.totalOutstanding?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400">
                        {cb.current > 0 ? cb.current.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-400">
                        {cb.days1To30 > 0 ? cb.days1To30.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-orange-400">
                        {cb.days31To60 > 0 ? cb.days31To60.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-rose-400">
                        {cb.days61To90 > 0 ? cb.days61To90.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-purple-400">
                        {cb.days91To120 > 0 ? cb.days91To120.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-red-400 font-bold">
                        {cb.days121Plus > 0 ? cb.days121Plus.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => onOpenStatement(cb.customerId)}
                          className="px-2 py-1 text-[11px] font-sans font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 rounded transition-colors"
                        >
                          Statement
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!portfolio.customerBalances || portfolio.customerBalances.length === 0) && (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-slate-500 font-sans">
                        No customer receivables balance data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Receivables Aging Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">Receivable Items & Aging Status</h3>
              <p className="text-xs text-slate-400">Individual invoice receivables with computed days outstanding and aging bucket</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Original</th>
                    <th className="py-2.5 px-3 text-right">Allocated</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-200">Outstanding</th>
                    <th className="py-2.5 px-3 text-center">Days Overdue</th>
                    <th className="py-2.5 px-3 text-center">Aging Bucket</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {portfolio.receivables?.map((r: any) => (
                    <tr key={r.receivableId} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-bold text-sky-400">{r.invoiceNumber}</td>
                      <td className="py-2 px-3 text-slate-400">{new Date(r.dueDate).toLocaleDateString()}</td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {r.currency} {r.originalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {r.amountAllocated?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-100">
                        {r.currency} {r.outstandingAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {r.daysOutstanding > 0 ? (
                          <span className="text-rose-400 font-bold">{r.daysOutstanding}d</span>
                        ) : (
                          <span className="text-emerald-400">Current</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${bucketColor(r.agingBucket)}`}>
                          {r.agingBucket}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'PAID'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : r.status === 'OVERDUE'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-sky-950 text-sky-400 border border-sky-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!portfolio.receivables || portfolio.receivables.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                        No receivable items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CustomerStatementsView({
  api,
  customers,
  initialCustomerId,
}: {
  api: any;
  customers: any[];
  initialCustomerId?: string;
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || customers[0]?.id || '');
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [statement, setStatement] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const loadStatement = useCallback(async () => {
    if (!selectedCustomerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCustomerStatement(selectedCustomerId, {
        asOfDate,
        startDate: startDate || undefined,
      });
      setStatement(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate customer statement.');
    } finally {
      setIsLoading(false);
    }
  }, [api, selectedCustomerId, asOfDate, startDate]);

  useEffect(() => {
    if (selectedCustomerId) {
      loadStatement();
    }
  }, [selectedCustomerId, asOfDate, startDate, loadStatement]);

  return (
    <div className="space-y-6">
      {/* Selector and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Select Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName} ({c.customerNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Statement As Of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadStatement}
          disabled={isLoading || !selectedCustomerId}
          icon="file-text"
        >
          {isLoading ? 'Generating...' : 'Refresh Statement'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Statement Document Card */}
      {statement && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6 font-mono text-xs">
          {/* Statement Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-wrap justify-between items-start gap-4">
            <div>
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
                Official Commercial Statement of Account
              </span>
              <h2 className="text-lg font-bold text-slate-100 mt-1 font-sans">{statement.customer?.legalName}</h2>
              <p className="text-slate-400 mt-0.5">{statement.customer?.billingAddress}</p>
              <p className="text-slate-400">{statement.customer?.billingEmail}</p>
              {statement.customer?.taxNumber && (
                <p className="text-slate-400">Tax ID: {statement.customer?.taxNumber}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold">
                {statement.statementNumber}
              </span>
              <div className="mt-2 text-slate-400 space-y-0.5">
                <div>Statement Date: <span className="text-slate-200">{statement.statementDate}</span></div>
                {statement.startDate && (
                  <div>Period Start: <span className="text-slate-200">{statement.startDate}</span></div>
                )}
                <div>Currency: <span className="text-slate-200">{statement.currency}</span></div>
              </div>
            </div>
          </div>

          {/* Balance Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-lg p-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Opening Balance</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {statement.currency} {statement.openingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-blue-400 uppercase block">Invoiced In Period</span>
              <div className="text-sm font-bold text-blue-300 mt-0.5">
                {statement.currency} {statement.totalInvoiced?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase block">Payments In Period</span>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">
                {statement.currency} {statement.totalPayments?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-sky-400 uppercase block font-bold">Current Closing Balance</span>
              <div className="text-sm font-bold text-sky-200 mt-0.5">
                {statement.currency} {statement.closingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 uppercase block font-bold">Overdue Amount</span>
              <div className="text-sm font-bold text-rose-300 mt-0.5">
                {statement.currency} {statement.overdueAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Aging Breakdown Bar */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] uppercase text-slate-400 font-bold block mb-2">
              Outstanding Aging Analysis (As Of {statement.statementDate})
            </span>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-emerald-400 block">Current</span>
                <span className="font-bold text-slate-200">{statement.agingBreakdown?.current?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-amber-400 block">1 - 30 Days</span>
                <span className="font-bold text-slate-200">{statement.agingBreakdown?.days1To30?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-orange-400 block">31 - 60 Days</span>
                <span className="font-bold text-slate-200">{statement.agingBreakdown?.days31To60?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-rose-400 block">61 - 90 Days</span>
                <span className="font-bold text-slate-200">{statement.agingBreakdown?.days61To90?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-purple-400 block">91 - 120 Days</span>
                <span className="font-bold text-slate-200">{statement.agingBreakdown?.days91To120?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-red-400 block font-bold">121+ Days</span>
                <span className="font-bold text-red-300">{statement.agingBreakdown?.days121Plus?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Chronological Ledger Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Transaction History & Chronological Ledger
            </h3>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3 font-sans">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (+)</th>
                    <th className="py-2.5 px-3 text-right">Credit (-)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-200">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {statement.lineItems?.map((li: any) => (
                    <tr key={li.id} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-slate-400">{li.date}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            li.type === 'INVOICE'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : li.type === 'PAYMENT'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {li.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sky-400 font-medium">{li.reference}</td>
                      <td className="py-2 px-3 text-slate-300 font-sans">{li.description}</td>
                      <td className="py-2 px-3 text-right text-slate-200">
                        {li.debit > 0 ? li.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400">
                        {li.credit > 0 ? li.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-100">
                        {li.runningBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {(!statement.lineItems || statement.lineItems.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                        No transactions found for this statement period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CollectionPriorityView({
  api,
  onOpenStatement,
  onOpenRecordPayment,
}: {
  api: any;
  onOpenStatement: (customerId: string) => void;
  onOpenRecordPayment: (customerId: string) => void;
}) {
  const [priorities, setPriorities] = useState<any[]>([]);
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCollectionPriority({ asOfDate });
      setPriorities(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load collection priorities.');
    } finally {
      setIsLoading(false);
    }
  }, [api, asOfDate]);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  const levelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-700';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-700';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'LOW':
        return 'bg-blue-950 text-blue-300 border-blue-700';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const actionBadge = (action: string) => {
    switch (action) {
      case 'ESCALATE_TO_COLLECTIONS':
        return 'bg-red-900/40 text-red-300 border-red-800';
      case 'URGENT_DIRECT_CONTACT':
        return 'bg-orange-900/40 text-orange-300 border-orange-800';
      case 'FORMAL_DEMAND_NOTICE':
        return 'bg-rose-900/40 text-rose-300 border-rose-800';
      case 'OFFER_PAYMENT_PLAN':
        return 'bg-purple-900/40 text-purple-300 border-purple-800';
      case 'FIRST_OVERDUE_NOTICE':
        return 'bg-amber-900/40 text-amber-300 border-amber-800';
      default:
        return 'bg-blue-900/40 text-blue-300 border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro & Rules Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Icon name="alert-triangle" size="sm" className="text-amber-400" />
            Collection Priority & Aging Intelligence
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic server-authoritative prioritization ranking overdue accounts by aging severity, balance magnitude, and payment activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchPriorities}
            disabled={isLoading}
            icon="refresh-cw"
          >
            {isLoading ? 'Ranking...' : 'Refresh Queue'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Priority Cards Queue */}
      <div className="space-y-4">
        {priorities.map((item, index) => (
          <div
            key={item.customerId}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 transition-colors"
          >
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100 font-sans">{item.customerName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${levelColor(item.priorityLevel)}`}>
                      {item.priorityLevel} (Score: {item.priorityScore}/100)
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {item.overdueInvoicesCount} overdue invoice{item.overdueInvoicesCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] uppercase text-slate-500 block">Overdue Amount</span>
                <div className="text-lg font-bold text-rose-400">
                  {item.currency} {item.overdueAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-500">Max {item.maxDaysOverdue} days past due</span>
              </div>
            </div>

            {/* Recommended Action & Explanation */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Recommended Action:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${actionBadge(item.recommendedAction)}`}>
                  {item.recommendedAction.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Explainable Factors:</span>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-300">
                  {item.reasons?.map((reason: string, rIdx: number) => (
                    <li key={rIdx}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-800/60">
              <Button
                variant="secondary"
                size="sm"
                icon="file-text"
                onClick={() => onOpenStatement(item.customerId)}
              >
                View Statement
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="dollar-sign"
                onClick={() => onOpenRecordPayment(item.customerId)}
              >
                Record Payment
              </Button>
            </div>
          </div>
        ))}

        {priorities.length === 0 && !isLoading && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center">
            <Icon name="check-circle" size="lg" className="text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">Zero Delinquent Accounts</h4>
            <p className="text-xs text-slate-400 mt-1">
              All receivables are currently up to date or within the normal payment grace period as of {asOfDate}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReconciliationView({ api }: { api: any }) {
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReconciliation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReconciliationReport({ asOfDate });
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reconciliation report.');
    } finally {
      setIsLoading(false);
    }
  }, [api, asOfDate]);

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Icon name="shield-check" size="sm" className="text-sky-400" />
            Commercial Ledger Financial Reconciliation
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Server-side mathematical cross-entity reconciliation between Invoices, Receivables, Payments, and Customer Accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchReconciliation}
            disabled={isLoading}
            icon="refresh-cw"
          >
            {isLoading ? 'Auditing...' : 'Run Audit'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Integrity Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              report.isReconciled
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                name={report.isReconciled ? 'check-circle' : 'alert-octagon'}
                size="md"
                className={report.isReconciled ? 'text-emerald-400' : 'text-rose-400'}
              />
              <div>
                <h4 className="text-sm font-bold">
                  {report.isReconciled ? 'Ledger Fully Reconciled' : 'Discrepancies Detected'}
                </h4>
                <p className="text-xs opacity-80">
                  {report.isReconciled
                    ? 'All cross-entity invariants hold true. No financial drift detected.'
                    : `${report.discrepancies?.length || 0} discrepancy items require audit review.`}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-slate-950 border border-slate-800">
              Audited: {new Date(report.generatedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* 4 Invariant Verification Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Check 1: Invoices vs Receivables */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">1. Issued Invoices &harr; Receivables</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    report.invoicingReceivablesDifference === 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {report.invoicingReceivablesDifference === 0 ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Issued Invoices Total:</span>
                  <span className="text-slate-200">{report.totalInvoicedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened Receivables Total:</span>
                  <span className="text-slate-200">{report.totalReceivablesOpened?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-200 font-bold">
                  <span>Variance:</span>
                  <span className={report.invoicingReceivablesDifference === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {report.invoicingReceivablesDifference?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Check 2: Payments vs Allocations */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">2. Recorded Payments &harr; Allocations</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  BALANCED
                </span>
              </div>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Recorded Payments Total:</span>
                  <span className="text-slate-200">{report.totalPaymentsRecorded?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allocated to Receivables:</span>
                  <span className="text-slate-200">{report.totalAllocationsApplied?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-200 font-bold">
                  <span>Unapplied Balance:</span>
                  <span className="text-sky-400">{report.totalUnappliedPayments?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Check 3: Outstanding vs Expected */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">3. Receivables &harr; Expected Balance</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    report.receivablesReconciliationDifference === 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {report.receivablesReconciliationDifference === 0 ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Actual Receivables Outstanding:</span>
                  <span className="text-slate-200">{report.totalReceivablesOutstanding?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected (Opened - Allocated):</span>
                  <span className="text-slate-200">{report.expectedOutstanding?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-200 font-bold">
                  <span>Variance:</span>
                  <span className={report.receivablesReconciliationDifference === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {report.receivablesReconciliationDifference?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Check 4: Customer Balances vs Receivables */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">4. Customer Accounts &harr; Ledger</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    report.customerReceivablesDifference === 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {report.customerReceivablesDifference === 0 ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Sum of Customer Balances:</span>
                  <span className="text-slate-200">{report.customerBalancesSum?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Receivables Outstanding:</span>
                  <span className="text-slate-200">{report.totalReceivablesOutstanding?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-200 font-bold">
                  <span>Variance:</span>
                  <span className={report.customerReceivablesDifference === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {report.customerReceivablesDifference?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Currency Breakdown */}
          {report.byCurrency && Object.keys(report.byCurrency).length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-300 mb-3">
                Currency Balances Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                {Object.values(report.byCurrency).map((cur: any) => (
                  <div key={cur.currency} className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sky-400">{cur.currency}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          cur.isReconciled ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {cur.isReconciled ? 'RECONCILED' : 'DISCREPANCY'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Invoiced:</span>
                      <span className="text-slate-200">{cur.totalInvoiced?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Payments:</span>
                      <span className="text-slate-200">{cur.totalPayments?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Outstanding:</span>
                      <span className="text-slate-200 font-bold">{cur.totalOutstanding?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
