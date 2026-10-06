/**
 * BCIP Accounts Receivable Aging, Customer Statements, Collection Priority & Reconciliation Service
 * Phase 3 — Prompt 003-006
 */

import { receivableRepository } from '../repositories/receivable.repository.ts';
import { paymentRepository } from '../repositories/payment.repository.ts';
import { paymentAllocationRepository } from '../repositories/payment-allocation.repository.ts';
import { invoiceRepository } from '../repositories/invoice.repository.ts';
import { billingCustomerRepository } from '../repositories/billing-customer.repository.ts';
import { AgingBucket, CollectionPriorityLevel, CollectionRecommendedAction } from '../enums.ts';
import type {
  Receivable,
  ReceivableAgingDetail,
  CustomerArBalance,
  AgingPortfolioSummary,
  CustomerStatement,
  CustomerStatementLineItem,
  CollectionPriorityItem,
  LedgerReconciliationReport,
  LedgerReconciliationDiscrepancy,
  CurrencyReconciliation,
  AgingBucketName,
} from '../types.ts';

export class ArAgingService {
  /**
   * Safe decimal multiplication to prevent floating-point inaccuracies (minor units / cents)
   */
  public static toMinor(value: number): number {
    return Math.round(Number(value || 0) * 100);
  }

  public static fromMinor(value: number): number {
    return Math.round(value) / 100;
  }

  /**
   * Standardizes date comparison by converting to UTC Date string (YYYY-MM-DD)
   */
  public static normalizeDateString(dateStr?: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    return dateStr;
  }

  /**
   * Server-authoritative deterministic aging calculation for a single receivable
   */
  public static calculateReceivableAging(
    receivable: Receivable,
    asOfDateStr?: string
  ): ReceivableAgingDetail {
    const asOfNormalized = this.normalizeDateString(asOfDateStr);
    const dueNormalized = this.normalizeDateString(receivable.dueDate);

    const asOfTime = new Date(`${asOfNormalized}T00:00:00Z`).getTime();
    const dueTime = new Date(`${dueNormalized}T00:00:00Z`).getTime();
    const diffDays = Math.floor((asOfTime - dueTime) / (1000 * 60 * 60 * 24));

    const outstandingMinor = this.toMinor(receivable.outstandingAmount);
    const hasOutstanding = outstandingMinor > 0 && receivable.status !== 'VOIDED';

    let daysOutstanding = 0;
    let isOverdue = false;
    let agingBucket: AgingBucketName = AgingBucket.CURRENT;

    if (diffDays > 0) {
      daysOutstanding = diffDays;
      isOverdue = hasOutstanding;

      if (diffDays <= 30) {
        agingBucket = AgingBucket.DAYS_1_30;
      } else if (diffDays <= 60) {
        agingBucket = AgingBucket.DAYS_31_60;
      } else if (diffDays <= 90) {
        agingBucket = AgingBucket.DAYS_61_90;
      } else if (diffDays <= 120) {
        agingBucket = AgingBucket.DAYS_91_120;
      } else {
        agingBucket = AgingBucket.DAYS_121_PLUS;
      }
    } else {
      daysOutstanding = 0;
      isOverdue = false;
      agingBucket = AgingBucket.CURRENT;
    }

    return {
      receivableId: receivable.id,
      invoiceId: receivable.invoiceId,
      invoiceNumber: receivable.invoiceNumber,
      customerId: receivable.customerId,
      currency: receivable.currency,
      originalAmount: receivable.originalAmount,
      amountReceived: receivable.amountReceived,
      amountAllocated: receivable.amountAllocated,
      outstandingAmount: receivable.outstandingAmount,
      dueDate: receivable.dueDate,
      asOfDate: asOfNormalized,
      daysOutstanding,
      agingBucket,
      isOverdue,
      status: receivable.status,
    };
  }

  /**
   * Aggregates Accounts Receivable aging and balance for all customers in a tenant
   */
  public static async getAgingPortfolio(
    tenantId: string,
    options?: { customerId?: string; asOfDate?: string }
  ): Promise<AgingPortfolioSummary> {
    const asOfNormalized = this.normalizeDateString(options?.asOfDate);
    const allCustomers = await billingCustomerRepository.findAll(tenantId);
    let allReceivables = await receivableRepository.findAll(tenantId);

    // Filter out voided receivables and filter by customer if specified
    allReceivables = allReceivables.filter((r) => r.status !== 'VOIDED');
    if (options?.customerId) {
      allReceivables = allReceivables.filter((r) => r.customerId === options.customerId);
    }

    const calculatedDetails = allReceivables.map((r) =>
      this.calculateReceivableAging(r, asOfNormalized)
    );

    // Group by customer
    const customerMap = new Map<string, typeof allCustomers[0]>();
    allCustomers.forEach((c) => customerMap.set(c.id, c));

    const recsByCustomer = new Map<string, ReceivableAgingDetail[]>();
    calculatedDetails.forEach((cd) => {
      const list = recsByCustomer.get(cd.customerId) || [];
      list.push(cd);
      recsByCustomer.set(cd.customerId, list);
    });

    const relevantCustomerIds = options?.customerId
      ? [options.customerId]
      : Array.from(new Set([...Array.from(customerMap.keys()), ...Array.from(recsByCustomer.keys())]));

    const customerBalances: CustomerArBalance[] = [];

    let totalRecMinor = 0;
    let totalPaidMinor = 0;
    let totalOutMinor = 0;
    let currentMinor = 0;
    let days1_30Minor = 0;
    let days31_60Minor = 0;
    let days61_90Minor = 0;
    let days91_120Minor = 0;
    let days121PlusMinor = 0;
    let overdueMinor = 0;
    let overdueCount = 0;

    const defaultCurrency = allReceivables[0]?.currency || 'USD';

    for (const custId of relevantCustomerIds) {
      const cust = customerMap.get(custId);
      const custRecs = recsByCustomer.get(custId) || [];

      let custTotalRec = 0;
      let custTotalPaid = 0;
      let custTotalOut = 0;
      let custCurrent = 0;
      let cust1_30 = 0;
      let cust31_60 = 0;
      let cust61_90 = 0;
      let cust91_120 = 0;
      let cust121Plus = 0;
      let custOverdue = 0;
      let custOverdueCount = 0;
      const currency = custRecs[0]?.currency || cust?.currency || defaultCurrency;

      for (const rec of custRecs) {
        const outMinor = this.toMinor(rec.outstandingAmount);
        custTotalRec += this.toMinor(rec.originalAmount);
        custTotalPaid += this.toMinor(rec.amountReceived);
        custTotalOut += outMinor;

        if (rec.agingBucket === AgingBucket.CURRENT) {
          custCurrent += outMinor;
        } else if (rec.agingBucket === AgingBucket.DAYS_1_30) {
          cust1_30 += outMinor;
        } else if (rec.agingBucket === AgingBucket.DAYS_31_60) {
          cust31_60 += outMinor;
        } else if (rec.agingBucket === AgingBucket.DAYS_61_90) {
          cust61_90 += outMinor;
        } else if (rec.agingBucket === AgingBucket.DAYS_91_120) {
          cust91_120 += outMinor;
        } else if (rec.agingBucket === AgingBucket.DAYS_121_PLUS) {
          cust121Plus += outMinor;
        }

        if (rec.isOverdue) {
          custOverdue += outMinor;
          custOverdueCount++;
        }
      }

      totalRecMinor += custTotalRec;
      totalPaidMinor += custTotalPaid;
      totalOutMinor += custTotalOut;
      currentMinor += custCurrent;
      days1_30Minor += cust1_30;
      days31_60Minor += cust31_60;
      days61_90Minor += cust61_90;
      days91_120Minor += cust91_120;
      days121PlusMinor += cust121Plus;
      overdueMinor += custOverdue;
      overdueCount += custOverdueCount;

      if (custRecs.length > 0 || cust) {
        customerBalances.push({
          customerId: custId,
          customerName: cust?.legalName || `Customer ${custId}`,
          currency,
          totalReceivable: this.fromMinor(custTotalRec),
          totalPaid: this.fromMinor(custTotalPaid),
          totalOutstanding: this.fromMinor(custTotalOut),
          current: this.fromMinor(custCurrent),
          days1To30: this.fromMinor(cust1_30),
          days31To60: this.fromMinor(cust31_60),
          days61To90: this.fromMinor(cust61_90),
          days91To120: this.fromMinor(cust91_120),
          days121Plus: this.fromMinor(cust121Plus),
          overdueAmount: this.fromMinor(custOverdue),
          receivablesCount: custRecs.length,
          overdueCount: custOverdueCount,
        });
      }
    }

    return {
      asOfDate: asOfNormalized,
      currency: defaultCurrency,
      totalReceivable: this.fromMinor(totalRecMinor),
      totalPaid: this.fromMinor(totalPaidMinor),
      totalOutstanding: this.fromMinor(totalOutMinor),
      current: this.fromMinor(currentMinor),
      days1To30: this.fromMinor(days1_30Minor),
      days31To60: this.fromMinor(days31_60Minor),
      days61To90: this.fromMinor(days61_90Minor),
      days91To120: this.fromMinor(days91_120Minor),
      days121Plus: this.fromMinor(days121PlusMinor),
      overdueAmount: this.fromMinor(overdueMinor),
      totalReceivablesCount: allReceivables.length,
      overdueCount,
      customerBalances,
      receivables: calculatedDetails,
    };
  }

  /**
   * Returns overdue receivables sorted by days overdue descending
   */
  public static async getOverdueReceivables(
    tenantId: string,
    options?: { customerId?: string; asOfDate?: string }
  ): Promise<ReceivableAgingDetail[]> {
    const portfolio = await this.getAgingPortfolio(tenantId, options);
    return portfolio.receivables
      .filter((r) => r.isOverdue && r.outstandingAmount > 0)
      .sort((a, b) => b.daysOutstanding - a.daysOutstanding);
  }

  /**
   * Generates a deterministic Customer Statement covering a specific period
   */
  public static async getCustomerStatement(
    tenantId: string,
    customerId: string,
    options?: { startDate?: string; endDate?: string; asOfDate?: string }
  ): Promise<CustomerStatement> {
    const customer = await billingCustomerRepository.findById(tenantId, customerId);
    if (!customer) {
      throw new Error(`Billing customer ${customerId} not found.`);
    }

    const asOfNormalized = this.normalizeDateString(options?.asOfDate);
    const startDateNormalized = options?.startDate ? this.normalizeDateString(options.startDate) : undefined;
    const endDateNormalized = options?.endDate ? this.normalizeDateString(options.endDate) : asOfNormalized;

    // Fetch invoices, receivables, payments and allocations for this customer
    const allInvoices = await invoiceRepository.findByCustomerId(tenantId, customerId);
    const issuedInvoices = allInvoices.filter(
      (inv) => inv.status === 'ISSUED' || inv.status === 'APPROVED'
    );


    const allPayments = await paymentRepository.findByCustomerId(tenantId, customerId);
    const allReceivables = await receivableRepository.findByCustomerId(tenantId, customerId);
    const nonVoidReceivables = allReceivables.filter((r) => r.status !== 'VOIDED');

    const rawEvents: Array<{
      id: string;
      date: string;
      type: 'INVOICE' | 'PAYMENT' | 'ALLOCATION' | 'REVERSAL';
      sourceType: 'INVOICE' | 'PAYMENT' | 'ALLOCATION' | 'REVERSAL';
      sourceId: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
    }> = [];

    // Invoices add debit (customer owes money)
    for (const inv of issuedInvoices) {
      const invDate = this.normalizeDateString(inv.issueDate || inv.createdAt);
      rawEvents.push({
        id: `stmt_inv_${inv.id}`,
        date: invDate,
        type: 'INVOICE',
        sourceType: 'INVOICE',
        sourceId: inv.id,
        reference: inv.invoiceNumber,
        description: `Invoice ${inv.invoiceNumber} - Due ${this.normalizeDateString(inv.dueDate)}`,
        debit: inv.grandTotal,
        credit: 0,
      });
    }

    // Payments add credit (customer paid money)
    for (const pmt of allPayments) {
      const pmtDate = this.normalizeDateString(pmt.paymentDate || pmt.recordedAt);
      if (pmt.status === 'REVERSED') {
        // Record payment then reversal
        rawEvents.push({
          id: `stmt_pmt_${pmt.id}`,
          date: pmtDate,
          type: 'PAYMENT',
          sourceType: 'PAYMENT',
          sourceId: pmt.id,
          reference: pmt.externalReference || pmt.id,
          description: `Payment received (${pmt.paymentMethod}) - ${pmt.notes || 'No notes'}`,
          debit: 0,
          credit: pmt.amount,
        });

        const revDate = this.normalizeDateString(pmt.reversedAt || pmtDate);
        rawEvents.push({
          id: `stmt_rev_${pmt.id}`,
          date: revDate,
          type: 'REVERSAL',
          sourceType: 'REVERSAL',
          sourceId: pmt.id,
          reference: `REV-${pmt.id}`,
          description: `Payment reversal: ${pmt.reversalReason || 'Reversed'}`,
          debit: pmt.amount,
          credit: 0,
        });
      } else {
        rawEvents.push({
          id: `stmt_pmt_${pmt.id}`,
          date: pmtDate,
          type: 'PAYMENT',
          sourceType: 'PAYMENT',
          sourceId: pmt.id,
          reference: pmt.externalReference || pmt.id,
          description: `Payment received (${pmt.paymentMethod})`,
          debit: 0,
          credit: pmt.amount,
        });
      }
    }


    // Sort chronologically
    rawEvents.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.id.localeCompare(b.id);
    });

    let runningBalanceMinor = 0;
    let openingBalanceMinor = 0;
    let periodInvoicedMinor = 0;
    let periodPaymentsMinor = 0;

    const lineItems: CustomerStatementLineItem[] = [];

    for (const event of rawEvents) {
      const isBeforeStart = startDateNormalized && event.date < startDateNormalized;
      const isAfterEnd = endDateNormalized && event.date > endDateNormalized;

      const deltaMinor = this.toMinor(event.debit) - this.toMinor(event.credit);
      runningBalanceMinor += deltaMinor;

      if (isBeforeStart) {
        openingBalanceMinor = runningBalanceMinor;
      } else if (!isAfterEnd) {
        if (event.type === 'INVOICE') {
          periodInvoicedMinor += this.toMinor(event.debit);
        } else if (event.type === 'PAYMENT') {
          periodPaymentsMinor += this.toMinor(event.credit);
        }

        lineItems.push({
          id: event.id,
          date: event.date,
          type: event.type,
          sourceType: event.sourceType,
          sourceId: event.sourceId,
          reference: event.reference,
          description: event.description,
          debit: event.debit,
          credit: event.credit,
          runningBalance: this.fromMinor(runningBalanceMinor),
        });
      }
    }

    // Aging breakdown as of evaluation date
    const agingDetails = nonVoidReceivables.map((r) => this.calculateReceivableAging(r, asOfNormalized));
    let curMinor = 0;
    let d1_30Minor = 0;
    let d31_60Minor = 0;
    let d61_90Minor = 0;
    let d91_120Minor = 0;
    let d121PlusMinor = 0;
    let overdueMinor = 0;
    let totalOutMinor = 0;

    for (const ad of agingDetails) {
      const outMinor = this.toMinor(ad.outstandingAmount);
      totalOutMinor += outMinor;
      if (ad.agingBucket === AgingBucket.CURRENT) curMinor += outMinor;
      else if (ad.agingBucket === AgingBucket.DAYS_1_30) d1_30Minor += outMinor;
      else if (ad.agingBucket === AgingBucket.DAYS_31_60) d31_60Minor += outMinor;
      else if (ad.agingBucket === AgingBucket.DAYS_61_90) d61_90Minor += outMinor;
      else if (ad.agingBucket === AgingBucket.DAYS_91_120) d91_120Minor += outMinor;
      else if (ad.agingBucket === AgingBucket.DAYS_121_PLUS) d121PlusMinor += outMinor;

      if (ad.isOverdue) overdueMinor += outMinor;
    }

    // Total allocations applied for this customer
    let totalAllocMinor = 0;
    for (const pmt of allPayments) {
      const allocs = await paymentAllocationRepository.findByPaymentId(tenantId, pmt.id);
      const activeAllocs = allocs.filter((a) => !a.reversedAt);
      for (const a of activeAllocs) {
        totalAllocMinor += this.toMinor(a.allocatedAmount);
      }
    }

    const cleanName = (customer.legalName || 'CUST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    const cleanDate = asOfNormalized.replace(/-/g, '');
    const statementNumber = `STM-${cleanName}-${cleanDate}`;

    return {
      statementNumber,
      customerId: customer.id,
      customer: {
        id: customer.id,
        legalName: customer.legalName,
        billingEmail: customer.billingEmail,
        billingAddress: customer.billingAddress,
        currency: customer.currency,
        taxNumber: customer.taxIdentifier,
      },

      statementDate: asOfNormalized,
      asOfDate: asOfNormalized,
      startDate: startDateNormalized,
      endDate: endDateNormalized,
      fromDate: startDateNormalized,
      toDate: endDateNormalized,
      currency: customer.currency,
      openingBalance: this.fromMinor(openingBalanceMinor),
      totalInvoiced: this.fromMinor(periodInvoicedMinor),
      totalPayments: this.fromMinor(periodPaymentsMinor),
      periodDebits: this.fromMinor(periodInvoicedMinor),
      periodCredits: this.fromMinor(periodPaymentsMinor),
      totalAllocated: this.fromMinor(totalAllocMinor),
      closingBalance: this.fromMinor(runningBalanceMinor),
      overdueAmount: this.fromMinor(overdueMinor),
      agingBreakdown: {
        current: this.fromMinor(curMinor),
        days1To30: this.fromMinor(d1_30Minor),
        days31To60: this.fromMinor(d31_60Minor),
        days61To90: this.fromMinor(d61_90Minor),
        days91To120: this.fromMinor(d91_120Minor),
        days121Plus: this.fromMinor(d121PlusMinor),
      },
      lineItems,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves single customer AR balance with 404 concealment for cross-tenant access
   */
  public static async getCustomerBalance(
    tenantId: string,
    customerId: string,
    asOfDate?: string
  ): Promise<CustomerArBalance> {
    const customer = await billingCustomerRepository.findById(tenantId, customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found.`);
    }

    const portfolio = await this.getAgingPortfolio(tenantId, { customerId, asOfDate });
    const balance = portfolio.customerBalances.find((cb) => cb.customerId === customerId);
    if (!balance) {
      return {
        customerId,
        customerName: customer.legalName,
        currency: customer.currency,
        totalReceivable: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        current: 0,
        days1To30: 0,
        days31To60: 0,
        days61To90: 0,
        days91To120: 0,
        days121Plus: 0,
        overdueAmount: 0,
        receivablesCount: 0,
        overdueCount: 0,
      };
    }
    return balance;
  }

  /**
   * Retrieves portfolio receivables and aging summary
   */
  public static async getReceivablesSummary(
    tenantId: string,
    asOfDate?: string
  ) {
    const portfolio = await this.getAgingPortfolio(tenantId, { asOfDate });
    return {
      asOfDate: portfolio.asOfDate,
      currency: portfolio.currency,
      totalReceivable: portfolio.totalReceivable,
      totalPaid: portfolio.totalPaid,
      totalOutstanding: portfolio.totalOutstanding,
      current: portfolio.current,
      days1To30: portfolio.days1To30,
      days31To60: portfolio.days31To60,
      days61To90: portfolio.days61To90,
      days91To120: portfolio.days91To120,
      days121Plus: portfolio.days121Plus,
      overdueAmount: portfolio.overdueAmount,
      totalReceivablesCount: portfolio.totalReceivablesCount,
      overdueCount: portfolio.overdueCount,
      customersCount: portfolio.customerBalances.length,
    };
  }


  /**
   * Deterministic Collection Priority & Aging Intelligence
   * Computes human-actionable priority scores and explainable recommendations
   */
  public static async getCollectionPriorities(
    tenantId: string,
    options?: { asOfDate?: string }
  ): Promise<CollectionPriorityItem[]> {
    const portfolio = await this.getAgingPortfolio(tenantId, options);
    const asOfNormalized = this.normalizeDateString(options?.asOfDate);
    const overdueReceivables = portfolio.receivables.filter((r) => r.isOverdue && r.outstandingAmount > 0);

    // Group overdue receivables by customer
    const byCustomer = new Map<string, ReceivableAgingDetail[]>();
    for (const rec of overdueReceivables) {
      const list = byCustomer.get(rec.customerId) || [];
      list.push(rec);
      byCustomer.set(rec.customerId, list);
    }

    const priorityItems: CollectionPriorityItem[] = [];

    for (const [custId, recs] of byCustomer.entries()) {
      const custBalance = portfolio.customerBalances.find((cb) => cb.customerId === custId);
      const customerName = custBalance?.customerName || `Customer ${custId}`;
      const currency = custBalance?.currency || recs[0]?.currency || 'USD';

      let overdueAmountMinor = 0;
      let maxDaysOverdue = 0;
      let oldestDueDate = recs[0].dueDate;

      recs.forEach((r) => {
        overdueAmountMinor += this.toMinor(r.outstandingAmount);
        if (r.daysOutstanding > maxDaysOverdue) {
          maxDaysOverdue = r.daysOutstanding;
        }
        if (r.dueDate < oldestDueDate) {
          oldestDueDate = r.dueDate;
        }
      });

      // Dominant bucket
      let dominantBucket: AgingBucketName = AgingBucket.DAYS_1_30;
      if (maxDaysOverdue > 120) dominantBucket = AgingBucket.DAYS_121_PLUS;
      else if (maxDaysOverdue > 90) dominantBucket = AgingBucket.DAYS_91_120;
      else if (maxDaysOverdue > 60) dominantBucket = AgingBucket.DAYS_61_90;
      else if (maxDaysOverdue > 30) dominantBucket = AgingBucket.DAYS_31_60;

      // Deterministic explainable scoring
      const reasons: string[] = [];
      let score = 0;

      // 1. Aging bucket weight (up to 50 pts)
      if (maxDaysOverdue > 120) {
        score += 50;
        reasons.push(`Severely delinquent: oldest receivable is ${maxDaysOverdue} days past due (>120 days).`);
      } else if (maxDaysOverdue > 90) {
        score += 40;
        reasons.push(`High delinquency: oldest receivable is ${maxDaysOverdue} days past due (>90 days).`);
      } else if (maxDaysOverdue > 60) {
        score += 30;
        reasons.push(`Medium-high delinquency: oldest receivable is ${maxDaysOverdue} days past due (>60 days).`);
      } else if (maxDaysOverdue > 30) {
        score += 20;
        reasons.push(`Moderate delinquency: oldest receivable is ${maxDaysOverdue} days past due (>30 days).`);
      } else {
        score += 10;
        reasons.push(`Early-stage delinquency: receivable is ${maxDaysOverdue} days past due (<=30 days).`);
      }

      // 2. Overdue magnitude weight (up to 30 pts)
      const overdueAmount = this.fromMinor(overdueAmountMinor);
      if (overdueAmount >= 50000) {
        score += 30;
        reasons.push(`Critical financial exposure: overdue balance is ${overdueAmount} ${currency} (>= 50,000).`);
      } else if (overdueAmount >= 10000) {
        score += 25;
        reasons.push(`High financial exposure: overdue balance is ${overdueAmount} ${currency} (>= 10,000).`);
      } else if (overdueAmount >= 2500) {
        score += 15;
        reasons.push(`Substantial balance: overdue balance is ${overdueAmount} ${currency} (>= 2,500).`);
      } else if (overdueAmount > 500) {
        score += 10;
        reasons.push(`Moderate balance: overdue balance is ${overdueAmount} ${currency}.`);
      } else {
        score += 5;
        reasons.push(`Low balance: overdue balance is ${overdueAmount} ${currency}.`);
      }

      // 3. Multi-invoice delinquency weight (up to 10 pts)
      if (recs.length >= 3) {
        score += 10;
        reasons.push(`Multiple unpaid invoices: ${recs.length} overdue invoices outstanding.`);
      } else if (recs.length >= 2) {
        score += 5;
        reasons.push(`Multiple unpaid invoices: ${recs.length} overdue invoices outstanding.`);
      }

      // 4. Payment activity check
      const customerPayments = await paymentRepository.findByCustomerId(tenantId, custId);
      const validPayments = customerPayments.filter((p) => p.status !== 'REVERSED');
      let lastPaymentDate: string | undefined = undefined;

      if (validPayments.length > 0) {
        validPayments.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
        lastPaymentDate = validPayments[0].paymentDate;

        const pmtTime = new Date(`${this.normalizeDateString(lastPaymentDate)}T00:00:00Z`).getTime();
        const asOfTime = new Date(`${asOfNormalized}T00:00:00Z`).getTime();
        const daysSinceLastPayment = Math.floor((asOfTime - pmtTime) / (1000 * 60 * 60 * 24));

        if (daysSinceLastPayment > 60) {
          score += 10;
          reasons.push(`No payment activity recorded in past ${daysSinceLastPayment} days.`);
        }
      } else {
        score += 10;
        reasons.push('No historical payments recorded for customer.');
      }

      // Clamp score to 100
      const priorityScore = Math.min(100, Math.max(0, score));

      // Determine priority level
      let priorityLevel: CollectionPriorityLevel = CollectionPriorityLevel.LOW;
      if (priorityScore >= 80) priorityLevel = CollectionPriorityLevel.CRITICAL;
      else if (priorityScore >= 60) priorityLevel = CollectionPriorityLevel.HIGH;
      else if (priorityScore >= 40) priorityLevel = CollectionPriorityLevel.MEDIUM;
      else if (priorityScore > 0) priorityLevel = CollectionPriorityLevel.LOW;
      else priorityLevel = CollectionPriorityLevel.NORMAL;

      // Recommended action
      let recommendedAction: string = CollectionRecommendedAction.SEND_COURTESY_REMINDER;
      if (maxDaysOverdue > 120 || priorityScore >= 85) {
        recommendedAction = CollectionRecommendedAction.ESCALATE_TO_COLLECTIONS;
      } else if (maxDaysOverdue > 90 || priorityScore >= 70) {
        recommendedAction = CollectionRecommendedAction.URGENT_DIRECT_CONTACT;
      } else if (maxDaysOverdue > 60) {
        recommendedAction = overdueAmount > 10000
          ? CollectionRecommendedAction.OFFER_PAYMENT_PLAN
          : CollectionRecommendedAction.FORMAL_DEMAND_NOTICE;
      } else if (maxDaysOverdue > 30) {
        recommendedAction = CollectionRecommendedAction.FIRST_OVERDUE_NOTICE;
      } else {
        recommendedAction = CollectionRecommendedAction.SEND_COURTESY_REMINDER;
      }

      priorityItems.push({
        customerId: custId,
        customerName,
        currency,
        totalOutstanding: custBalance?.totalOutstanding || overdueAmount,
        overdueAmount,
        oldestDueDate,
        maxDaysOverdue,
        dominantBucket,
        overdueInvoicesCount: recs.length,
        priorityScore,
        priorityLevel: priorityLevel as any,
        recommendedAction,
        reasons,
        lastPaymentDate,
        receivables: recs,
      });
    }

    // Sort by priorityScore descending
    return priorityItems.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Deterministic Commercial Ledger Reconciliation
   * Validates cross-entity integrity between Invoices, Receivables, Payments, and Allocations
   */
  public static async getReconciliationReport(
    tenantId: string,
    options?: { asOfDate?: string }
  ): Promise<LedgerReconciliationReport> {
    const asOfNormalized = this.normalizeDateString(options?.asOfDate);

    const invoices = await invoiceRepository.findAll(tenantId);
    const receivables = await receivableRepository.findAll(tenantId);
    const payments = await paymentRepository.findAll(tenantId);
    const allocations = await paymentAllocationRepository.findAll(tenantId);
    const portfolio = await this.getAgingPortfolio(tenantId, { asOfDate: asOfNormalized });

    const discrepancies: LedgerReconciliationDiscrepancy[] = [];

    // 1. Invoices vs Receivables
    // Only ISSUED invoices generate receivables
    const issuedInvoices = invoices.filter(
      (inv) => inv.status === 'ISSUED'
    );

    const nonVoidReceivables = receivables.filter((r) => r.status !== 'VOIDED');

    let totalInvoicedMinor = 0;
    issuedInvoices.forEach((inv) => {
      totalInvoicedMinor += this.toMinor(inv.grandTotal);
    });

    let totalRecOpenedMinor = 0;
    nonVoidReceivables.forEach((r) => {
      totalRecOpenedMinor += this.toMinor(r.originalAmount);
    });

    const invRecDiffMinor = totalInvoicedMinor - totalRecOpenedMinor;
    if (invRecDiffMinor !== 0) {
      discrepancies.push({
        type: 'INVOICE_RECEIVABLES_MISMATCH',
        description: `Discrepancy between issued invoices grand total and receivables opened amounts.`,
        expected: this.fromMinor(totalInvoicedMinor),
        actual: this.fromMinor(totalRecOpenedMinor),
      });
    }

    // 2. Payments vs Allocations
    const activePayments = payments.filter((p) => p.status !== 'REVERSED');
    const activeAllocations = allocations.filter((a) => !a.reversedAt);

    let totalPmtMinor = 0;
    activePayments.forEach((p) => {
      totalPmtMinor += this.toMinor(p.amount);
    });

    let totalAllocMinor = 0;
    activeAllocations.forEach((a) => {
      totalAllocMinor += this.toMinor(a.allocatedAmount);
    });

    const unappliedPmtMinor = totalPmtMinor - totalAllocMinor;
    if (unappliedPmtMinor < 0) {
      discrepancies.push({
        type: 'ALLOCATION_EXCEEDS_PAYMENTS',
        description: `Total allocated payments exceed total non-reversed payments recorded.`,
        expected: this.fromMinor(totalPmtMinor),
        actual: this.fromMinor(totalAllocMinor),
      });
    }

    // 3. Receivables Outstanding vs Expected Outstanding
    let totalRecOutMinor = 0;
    nonVoidReceivables.forEach((r) => {
      totalRecOutMinor += this.toMinor(r.outstandingAmount);
    });

    const expectedRecOutMinor = totalRecOpenedMinor - totalAllocMinor;
    const recDiffMinor = totalRecOutMinor - expectedRecOutMinor;

    if (recDiffMinor !== 0) {
      discrepancies.push({
        type: 'RECEIVABLE_BALANCE_MISMATCH',
        description: `Sum of receivable outstanding amounts (${this.fromMinor(totalRecOutMinor)}) does not equal opened minus allocated (${this.fromMinor(expectedRecOutMinor)}).`,
        expected: this.fromMinor(expectedRecOutMinor),
        actual: this.fromMinor(totalRecOutMinor),
      });
    }

    // 4. Customer Balances vs Receivables Outstanding
    let custBalancesTotalMinor = 0;
    portfolio.customerBalances.forEach((cb) => {
      custBalancesTotalMinor += this.toMinor(cb.totalOutstanding);
    });

    const custRecDiffMinor = custBalancesTotalMinor - totalRecOutMinor;
    if (custRecDiffMinor !== 0) {
      discrepancies.push({
        type: 'CUSTOMER_BALANCE_MISMATCH',
        description: `Customer balance aggregations sum (${this.fromMinor(custBalancesTotalMinor)}) does not match receivables outstanding (${this.fromMinor(totalRecOutMinor)}).`,
        expected: this.fromMinor(totalRecOutMinor),
        actual: this.fromMinor(custBalancesTotalMinor),
      });
    }

    // Multi-currency breakdown
    const byCurrency: Record<string, CurrencyReconciliation> = {};
    const currencies = Array.from(
      new Set([
        ...issuedInvoices.map((i) => i.currency),
        ...nonVoidReceivables.map((r) => r.currency),
        ...activePayments.map((p) => p.currency),
      ])
    );

    for (const cur of currencies) {
      const curInv = issuedInvoices.filter((i) => i.currency === cur);
      const curRec = nonVoidReceivables.filter((r) => r.currency === cur);
      const curPmt = activePayments.filter((p) => p.currency === cur);
      const curAlloc = activeAllocations.filter((a) => {
        const p = activePayments.find((pmt) => pmt.id === a.paymentId);
        return p?.currency === cur;
      });

      const invSum = curInv.reduce((sum, i) => sum + this.toMinor(i.grandTotal), 0);
      const recSum = curRec.reduce((sum, r) => sum + this.toMinor(r.originalAmount), 0);
      const pmtSum = curPmt.reduce((sum, p) => sum + this.toMinor(p.amount), 0);
      const allocSum = curAlloc.reduce((sum, a) => sum + this.toMinor(a.allocatedAmount), 0);
      const outSum = curRec.reduce((sum, r) => sum + this.toMinor(r.outstandingAmount), 0);

      const isCurReconciled = invSum === recSum && outSum === (recSum - allocSum);

      byCurrency[cur] = {
        currency: cur,
        totalInvoiced: this.fromMinor(invSum),
        totalReceivables: this.fromMinor(recSum),
        totalPayments: this.fromMinor(pmtSum),
        totalAllocated: this.fromMinor(allocSum),
        totalOutstanding: this.fromMinor(outSum),
        isReconciled: isCurReconciled,
      };
    }

    const isReconciled = discrepancies.length === 0;

    return {
      asOfDate: asOfNormalized,
      isReconciled,
      totalInvoicedAmount: this.fromMinor(totalInvoicedMinor),
      totalReceivablesOpened: this.fromMinor(totalRecOpenedMinor),
      invoicingReceivablesDifference: this.fromMinor(invRecDiffMinor),
      totalPaymentsRecorded: this.fromMinor(totalPmtMinor),
      totalAllocationsApplied: this.fromMinor(totalAllocMinor),
      totalUnappliedPayments: this.fromMinor(unappliedPmtMinor),
      totalReceivablesOutstanding: this.fromMinor(totalRecOutMinor),
      expectedOutstanding: this.fromMinor(expectedRecOutMinor),
      receivablesReconciliationDifference: this.fromMinor(recDiffMinor),
      customerBalancesSum: this.fromMinor(custBalancesTotalMinor),
      customerReceivablesDifference: this.fromMinor(custRecDiffMinor),
      discrepancies,
      byCurrency,
      generatedAt: new Date().toISOString(),
    };
  }
}
