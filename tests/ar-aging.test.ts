/**
 * BCIP Accounts Receivable Aging, Customer Statements & Collection Intelligence Test Suite
 * Phase 3 — Prompt 003-006
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  billingCustomerRepository,
  invoiceRepository,
  receivableRepository,
  paymentRepository,
  paymentAllocationRepository,
  ArAgingService,
  AgingBucket,
  CustomerStatus,
  InvoiceStatus,
} from '../packages/database/src/index.ts';
import { createClientAuthToken } from '../apps/web/src/components/crm/shared/crm-api.ts';
import type { UserAccount } from '../apps/web/src/types/tenant.ts';

interface HttpResponse {
  code: number;
  headers: Record<string, string>;
  body: any;
}

function createMockResponse(onComplete: (res: HttpResponse) => void) {
  const headers: Record<string, string> = {};
  let statusCode = 200;

  const res: any = {
    statusCode: 200,
    getHeader: (name: string) => headers[name.toLowerCase()],
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = String(value);
      return res;
    },
    hasHeader: (name: string) => Object.prototype.hasOwnProperty.call(headers, name.toLowerCase()),
    removeHeader: (name: string) => {
      delete headers[name.toLowerCase()];
    },
    status: (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    },
    json: (body: any) => {
      onComplete({ code: statusCode, headers, body });
      return res;
    },
    send: (body: any) => {
      onComplete({ code: statusCode, headers, body });
      return res;
    },
    end: () => {
      onComplete({ code: statusCode, headers, body: null });
    },
  };
  return res;
}

async function executeRequest(
  app: any,
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<HttpResponse> {
  return new Promise((resolve) => {
    const req: any = {
      method: method.toUpperCase(),
      url,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: body || {},
      query: {},
    };

    const parsedUrl = new URL(url, 'http://localhost');
    parsedUrl.searchParams.forEach((val, key) => {
      req.query[key] = val;
    });

    const res = createMockResponse(resolve);
    app.handle(req, res);
  });
}

export async function runArAgingTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 3 Prompt 003-006: AR Aging & Statements Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'tenant_aging_a';
  const tenantB = 'tenant_aging_b';

  const userA: UserAccount = {
    id: 'user_aging_agent_a',
    email: 'aging_a@bcip.co.za',
    fullName: 'Aging Agent A',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    initials: 'AA',
    tenantId: tenantA,
    tenantName: 'Aging Tenant A',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const userB: UserAccount = {
    id: 'user_aging_agent_b',
    email: 'aging_b@bcip.co.za',
    fullName: 'Aging Agent B',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    initials: 'AB',
    tenantId: tenantB,
    tenantName: 'Aging Tenant B',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const unauthorizedUser: UserAccount = {
    id: 'user_contractor',
    email: 'contractor@bcip.co.za',
    fullName: 'Contractor User',
    role: 'CONTRACTOR',
    userRole: 'CONTRACTOR',
    initials: 'CU',
    tenantId: tenantA,
    tenantName: 'Aging Tenant A',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const tokenA = createClientAuthToken(userA, tenantA);
  const tokenB = createClientAuthToken(userB, tenantB);
  const tokenUnauthorized = createClientAuthToken(unauthorizedUser, tenantA);

  const evaluationDate = '2026-06-30';

  let scenarioCount = 0;
  const passScenario = (title: string) => {
    scenarioCount++;
    console.log(`   [Scenario ${scenarioCount}] ${title} ... ✓`);
  };

  // Base receivable prototype for unit tests
  const baseRec = {
    id: 'rec_proto',
    tenantId: tenantA,
    customerId: 'cust_proto',
    invoiceId: 'inv_proto',
    invoiceNumber: 'INV-TEST-001',
    currency: 'ZAR',
    originalAmount: 1000,
    amountReceived: 0,
    amountAllocated: 0,
    outstandingAmount: 1000,
    status: 'OPEN' as const,
    dueDate: '2026-06-30',
    openedAt: '2026-06-01T00:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  };

  console.log('\n--- SECTION 1: AGING BUCKET BOUNDARY VERIFICATIONS ---');

  // Scenario 1: Exact day 0 boundary (due on evaluation date)
  const agingDay0 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-06-30' }, evaluationDate);
  assert.strictEqual(agingDay0.agingBucket, AgingBucket.CURRENT);
  assert.strictEqual(agingDay0.isOverdue, false);
  assert.strictEqual(agingDay0.daysOutstanding, 0);
  passScenario('Exact boundary: Day 0 evaluates to CURRENT and not overdue');

  // Scenario 2: Future due date
  const agingFuture = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-07-15' }, evaluationDate);
  assert.strictEqual(agingFuture.agingBucket, AgingBucket.CURRENT);
  assert.strictEqual(agingFuture.isOverdue, false);
  assert.strictEqual(agingFuture.daysOutstanding, 0);
  passScenario('Future due date evaluates to CURRENT bucket');

  // Scenario 3: Exact Day 1 past due
  const agingDay1 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-06-29' }, evaluationDate);
  assert.strictEqual(agingDay1.agingBucket, AgingBucket.DAYS_1_30);
  assert.strictEqual(agingDay1.isOverdue, true);
  assert.strictEqual(agingDay1.daysOutstanding, 1);
  passScenario('Exact boundary: Day 1 past due enters DAYS_1_30');

  // Scenario 4: Exact Day 30 past due
  const agingDay30 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-05-31' }, evaluationDate);
  assert.strictEqual(agingDay30.agingBucket, AgingBucket.DAYS_1_30);
  assert.strictEqual(agingDay30.daysOutstanding, 30);
  passScenario('Exact boundary: Day 30 past due remains in DAYS_1_30');

  // Scenario 5: Exact Day 31 past due
  const agingDay31 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-05-30' }, evaluationDate);
  assert.strictEqual(agingDay31.agingBucket, AgingBucket.DAYS_31_60);
  assert.strictEqual(agingDay31.daysOutstanding, 31);
  passScenario('Exact boundary: Day 31 past due enters DAYS_31_60');

  // Scenario 6: Exact Day 60 past due
  const agingDay60 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-05-01' }, evaluationDate);
  assert.strictEqual(agingDay60.agingBucket, AgingBucket.DAYS_31_60);
  assert.strictEqual(agingDay60.daysOutstanding, 60);
  passScenario('Exact boundary: Day 60 past due remains in DAYS_31_60');

  // Scenario 7: Exact Day 61 past due
  const agingDay61 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-04-30' }, evaluationDate);
  assert.strictEqual(agingDay61.agingBucket, AgingBucket.DAYS_61_90);
  assert.strictEqual(agingDay61.daysOutstanding, 61);
  passScenario('Exact boundary: Day 61 past due enters DAYS_61_90');

  // Scenario 8: Exact Day 90 past due
  const agingDay90 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-04-01' }, evaluationDate);
  assert.strictEqual(agingDay90.agingBucket, AgingBucket.DAYS_61_90);
  assert.strictEqual(agingDay90.daysOutstanding, 90);
  passScenario('Exact boundary: Day 90 past due remains in DAYS_61_90');

  // Scenario 9: Exact Day 91 past due
  const agingDay91 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-03-31' }, evaluationDate);
  assert.strictEqual(agingDay91.agingBucket, AgingBucket.DAYS_91_120);
  assert.strictEqual(agingDay91.daysOutstanding, 91);
  passScenario('Exact boundary: Day 91 past due enters DAYS_91_120');

  // Scenario 10: Exact Day 120 past due
  const agingDay120 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-03-02' }, evaluationDate);
  assert.strictEqual(agingDay120.agingBucket, AgingBucket.DAYS_91_120);
  assert.strictEqual(agingDay120.daysOutstanding, 120);
  passScenario('Exact boundary: Day 120 past due remains in DAYS_91_120');

  // Scenario 11: Exact Day 121 past due
  const agingDay121 = ArAgingService.calculateReceivableAging({ ...baseRec, dueDate: '2026-03-01' }, evaluationDate);
  assert.strictEqual(agingDay121.agingBucket, AgingBucket.DAYS_121_PLUS);
  assert.strictEqual(agingDay121.daysOutstanding, 121);
  passScenario('Exact boundary: Day 121 past due enters DAYS_121_PLUS');

  // Scenario 12: Fully paid receivable past due is not marked overdue
  const paidRec = { ...baseRec, dueDate: '2026-04-01', outstandingAmount: 0, status: 'PAID' as const };
  const agingPaid = ArAgingService.calculateReceivableAging(paidRec, evaluationDate);
  assert.strictEqual(agingPaid.isOverdue, false);
  assert.strictEqual(agingPaid.outstandingAmount, 0);
  passScenario('Fully paid receivable with past due date is not marked overdue');

  // Scenario 13: Partially paid receivable maintains correct overdue outstanding amount
  const partialRec = {
    ...baseRec,
    dueDate: '2026-05-15',
    originalAmount: 1000,
    amountAllocated: 400,
    outstandingAmount: 600,
    status: 'PARTIALLY_PAID' as const,
  };
  const agingPartial = ArAgingService.calculateReceivableAging(partialRec, evaluationDate);
  assert.strictEqual(agingPartial.isOverdue, true);
  assert.strictEqual(agingPartial.outstandingAmount, 600);
  assert.strictEqual(agingPartial.agingBucket, AgingBucket.DAYS_31_60);
  passScenario('Partially paid receivable calculates aging on remaining balance');

  console.log('\n--- SECTION 2: SEEDING REPOSITORY FIXTURES & ISOLATION ---');

  // Seed Customers
  const custA1 = await billingCustomerRepository.create({
    id: 'cust_scen_a1',
    tenantId: tenantA,
    customerNumber: 'CUST-SCEN-A1',
    legalName: 'Sandton Grand Villas Body Corporate',
    billingEmail: 'accounts@sandtongrand.co.za',
    billingAddress: 'Sandton, Johannesburg',
    taxIdentifier: 'VAT445566',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });

  const custA2 = await billingCustomerRepository.create({
    id: 'cust_scen_a2',
    tenantId: tenantA,
    customerNumber: 'CUST-SCEN-A2',
    legalName: 'Waterfall Ridge Estate HOA',
    billingEmail: 'admin@waterfallridge.co.za',
    billingAddress: 'Midrand, Johannesburg',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });

  const custB = await billingCustomerRepository.create({
    id: 'cust_scen_b1',
    tenantId: tenantB,
    customerNumber: 'CUST-SCEN-B1',
    legalName: 'Cape Point Heights Body Corporate',
    billingEmail: 'accounts@capepoint.co.za',
    billingAddress: 'Cape Town',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });
  passScenario('Created isolated tenant customer accounts');

  // Scenario 15: Create multiple invoices & receivables across buckets for Tenant A
  const invA1_curr = await invoiceRepository.create({
    id: 'inv_scen_a1_curr',
    tenantId: tenantA,
    billingCustomerId: custA1.id,
    invoiceNumber: 'INV-SCEN-101',
    status: InvoiceStatus.ISSUED,
    currency: 'ZAR',
    subtotal: 5000,
    taxTotal: 0,
    grandTotal: 5000,
    issueDate: '2026-06-20',
    dueDate: '2026-07-20',
  });
  await receivableRepository.create({
    id: 'rec_scen_a1_curr',
    tenantId: tenantA,
    customerId: custA1.id,
    invoiceId: invA1_curr.id,
    invoiceNumber: invA1_curr.invoiceNumber,
    currency: 'ZAR',
    originalAmount: 5000,
    amountReceived: 0,
    amountAllocated: 0,
    outstandingAmount: 5000,
    status: 'OPEN',
    dueDate: invA1_curr.dueDate,
    openedAt: '2026-06-20T00:00:00Z',
  });

  const invA1_45 = await invoiceRepository.create({
    id: 'inv_scen_a1_45',
    tenantId: tenantA,
    billingCustomerId: custA1.id,
    invoiceNumber: 'INV-SCEN-102',
    status: InvoiceStatus.ISSUED,
    currency: 'ZAR',
    subtotal: 12000,
    taxTotal: 0,
    grandTotal: 12000,
    issueDate: '2026-04-16',
    dueDate: '2026-05-16',
  });
  await receivableRepository.create({
    id: 'rec_scen_a1_45',
    tenantId: tenantA,
    customerId: custA1.id,
    invoiceId: invA1_45.id,
    invoiceNumber: invA1_45.invoiceNumber,
    currency: 'ZAR',
    originalAmount: 12000,
    amountReceived: 0,
    amountAllocated: 0,
    outstandingAmount: 12000,
    status: 'OVERDUE',
    dueDate: invA1_45.dueDate,
    openedAt: '2026-04-16T00:00:00Z',
  });

  const invA1_130 = await invoiceRepository.create({
    id: 'inv_scen_a1_130',
    tenantId: tenantA,
    billingCustomerId: custA1.id,
    invoiceNumber: 'INV-SCEN-103',
    status: InvoiceStatus.ISSUED,
    currency: 'ZAR',
    subtotal: 25000,
    taxTotal: 0,
    grandTotal: 25000,
    issueDate: '2026-01-20',
    dueDate: '2026-02-20',
  });
  await receivableRepository.create({
    id: 'rec_scen_a1_130',
    tenantId: tenantA,
    customerId: custA1.id,
    invoiceId: invA1_130.id,
    invoiceNumber: invA1_130.invoiceNumber,
    currency: 'ZAR',
    originalAmount: 25000,
    amountReceived: 0,
    amountAllocated: 0,
    outstandingAmount: 25000,
    status: 'OVERDUE',
    dueDate: invA1_130.dueDate,
    openedAt: '2026-01-20T00:00:00Z',
  });

  const invA2 = await invoiceRepository.create({
    id: 'inv_scen_a2_70',
    tenantId: tenantA,
    billingCustomerId: custA2.id,
    invoiceNumber: 'INV-SCEN-201',
    status: InvoiceStatus.ISSUED,
    currency: 'ZAR',
    subtotal: 8000,
    taxTotal: 0,
    grandTotal: 8000,
    issueDate: '2026-03-21',
    dueDate: '2026-04-21',
  });
  await receivableRepository.create({
    id: 'rec_scen_a2_70',
    tenantId: tenantA,
    customerId: custA2.id,
    invoiceId: invA2.id,
    invoiceNumber: invA2.invoiceNumber,
    currency: 'ZAR',
    originalAmount: 8000,
    amountReceived: 0,
    amountAllocated: 0,
    outstandingAmount: 8000,
    status: 'OVERDUE',
    dueDate: invA2.dueDate,
    openedAt: '2026-03-21T00:00:00Z',
  });

  // Voided receivable should be excluded from aging
  const invVoid = await invoiceRepository.create({
    id: 'inv_scen_void',
    tenantId: tenantA,
    billingCustomerId: custA1.id,
    invoiceNumber: 'INV-SCEN-VOID',
    status: InvoiceStatus.VOIDED,
    currency: 'ZAR',
    subtotal: 9000,
    taxTotal: 0,
    grandTotal: 9000,
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
  });
  await receivableRepository.create({
    id: 'rec_scen_void',
    tenantId: tenantA,
    customerId: custA1.id,
    invoiceId: invVoid.id,
    invoiceNumber: invVoid.invoiceNumber,
    currency: 'ZAR',
    originalAmount: 9000,
    amountReceived: 0,
    amountAllocated: 0,
    outstandingAmount: 0,
    status: 'VOIDED',
    dueDate: invVoid.dueDate,
    openedAt: '2026-01-01T00:00:00Z',
  });

  // Tenant B fixture
  const invB = await invoiceRepository.create({
    id: 'inv_scen_b1',
    tenantId: tenantB,
    billingCustomerId: custB.id,
    invoiceNumber: 'INV-SCEN-B01',
    status: InvoiceStatus.ISSUED,
    currency: 'ZAR',
    subtotal: 15000,
    taxTotal: 0,
    grandTotal: 15000,
    issueDate: '2026-05-01',
    dueDate: '2026-05-31',
  });
  await receivableRepository.create({
    id: 'rec_scen_b1',
    tenantId: tenantB,
    customerId: custB.id,
    invoiceId: invB.id,
    invoiceNumber: invB.invoiceNumber,
    currency: 'ZAR',
    originalAmount: 15000,
    amountReceived: 0,
    amountAllocated: 0,
    outstandingAmount: 15000,
    status: 'OVERDUE',
    dueDate: invB.dueDate,
    openedAt: '2026-05-01T00:00:00Z',
  });
  passScenario('Persisted multi-invoice and receivable records across aging buckets');

  console.log('\n--- SECTION 3: AR AGING API & CUSTOMER BALANCES ---');

  // Scenario 16: Portfolio aging endpoint
  const agingRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/receivables/aging?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(agingRes.code, 200);
  const agingData = agingRes.body.data;
  assert.strictEqual(agingData.totalOutstanding, 50000);
  assert.strictEqual(agingData.current, 5000);
  assert.strictEqual(agingData.days31To60, 12000);
  assert.strictEqual(agingData.days61To90, 8000);
  assert.strictEqual(agingData.days121Plus, 25000);
  assert.strictEqual(agingData.overdueAmount, 45000);
  assert.strictEqual(agingData.overdueCount, 3);
  passScenario('GET /api/v1/billing/receivables/aging returns authoritative portfolio aging');

  // Scenario 17: Voided receivable exclusion confirmed in portfolio count
  assert.strictEqual(agingData.totalReceivablesCount, 4); // Excludes the VOIDED record
  passScenario('Voided receivables strictly excluded from portfolio aging');

  // Scenario 18: Receivables summary endpoint
  const summaryRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/receivables/summary?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(summaryRes.code, 200);
  assert.strictEqual(summaryRes.body.data.totalOutstanding, 50000);
  assert.strictEqual(summaryRes.body.data.overdueAmount, 45000);
  assert.strictEqual(summaryRes.body.data.customersCount, 2);
  passScenario('GET /api/v1/billing/receivables/summary returns aggregated AR metrics');

  // Scenario 19: Customer AR balance endpoint
  const custBalanceRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/customers/${custA1.id}/balance?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(custBalanceRes.code, 200);
  const cb = custBalanceRes.body.data;
  assert.strictEqual(cb.customerId, custA1.id);
  assert.strictEqual(cb.totalOutstanding, 42000);
  assert.strictEqual(cb.current, 5000);
  assert.strictEqual(cb.days31To60, 12000);
  assert.strictEqual(cb.days121Plus, 25000);
  assert.strictEqual(cb.overdueAmount, 37000);
  assert.strictEqual(cb.overdueCount, 2);
  passScenario('GET /api/v1/billing/customers/:id/balance returns customer-level AR aggregation');

  // Scenario 20: Overdue receivables endpoint
  const overdueRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/receivables/overdue?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(overdueRes.code, 200);
  const overdueList = overdueRes.body.data;
  assert.strictEqual(overdueList.length, 3);
  assert.ok(overdueList[0].daysOutstanding >= overdueList[1].daysOutstanding);
  assert.strictEqual(overdueList[0].invoiceNumber, 'INV-SCEN-103'); // 130 days overdue
  passScenario('GET /api/v1/billing/receivables/overdue sorts by days overdue descending');

  console.log('\n--- SECTION 4: CUSTOMER STATEMENTS & LEDGER TRACEABILITY ---');

  // Record a payment for Cust A1
  const pmtA1 = await paymentRepository.create({
    id: 'pmt_scen_a1',
    tenantId: tenantA,
    customerId: custA1.id,
    currency: 'ZAR',
    amount: 5000,
    paymentDate: '2026-06-25',
    paymentMethod: 'BANK_TRANSFER',
    externalReference: 'EFT-SCEN-001',
    status: 'RECORDED',
    recordedBy: 'user_aging_agent_a',
    recordedAt: '2026-06-25T10:00:00Z',
    correlationId: 'corr_scen_pmt',
  });
  passScenario('Recorded authoritative customer payment record');

  // Scenario 22: Generate Customer Statement
  const statementRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/customers/${custA1.id}/statement?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(statementRes.code, 200);
  const stmt = statementRes.body.data;
  assert.strictEqual(stmt.customerId, custA1.id);
  assert.strictEqual(stmt.currency, 'ZAR');
  assert.strictEqual(stmt.totalInvoiced, 42000);
  assert.strictEqual(stmt.totalPayments, 5000);
  assert.strictEqual(stmt.closingBalance, 37000);
  passScenario('Generated customer statement with server-calculated debit/credit totals');

  // Scenario 23: Statement Source Traceability
  assert.ok(stmt.lineItems.length >= 4);
  const invLineItem = stmt.lineItems.find((li: any) => li.type === 'INVOICE');
  assert.ok(invLineItem);
  assert.strictEqual(invLineItem.sourceType, 'INVOICE');
  assert.ok(invLineItem.sourceId.startsWith('inv_'));

  const pmtLineItem = stmt.lineItems.find((li: any) => li.type === 'PAYMENT');
  assert.ok(pmtLineItem);
  assert.strictEqual(pmtLineItem.sourceType, 'PAYMENT');
  assert.strictEqual(pmtLineItem.sourceId, pmtA1.id);
  passScenario('Statement line items contain authoritative sourceType and sourceId');

  // Scenario 24: Deterministic chronological line item ordering
  for (let i = 0; i < stmt.lineItems.length - 1; i++) {
    assert.ok(stmt.lineItems[i].date <= stmt.lineItems[i + 1].date);
  }
  passScenario('Statement transactions ordered deterministically by date');

  // Scenario 25: Statement period fromDate / toDate filtering
  const periodStmtRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/customers/${custA1.id}/statement?startDate=2026-04-01&endDate=2026-06-30`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(periodStmtRes.code, 200);
  const periodStmt = periodStmtRes.body.data;
  // Opening balance should equal invoice from Jan 20 (R25,000)
  assert.strictEqual(periodStmt.openingBalance, 25000);
  // Period debits should equal invoices from April and June (12000 + 5000 = 17000)
  assert.strictEqual(periodStmt.totalInvoiced, 17000);
  assert.strictEqual(periodStmt.totalPayments, 5000);
  assert.strictEqual(periodStmt.closingBalance, 37000); // 25000 + 17000 - 5000
  passScenario('Statement period calculates authoritative opening and closing balance');

  // Scenario 26: Statement route alias /statements/:customerId
  const aliasStmtRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/statements/${custA1.id}?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(aliasStmtRes.code, 200);
  assert.strictEqual(aliasStmtRes.body.data.statementNumber, stmt.statementNumber);
  passScenario('GET /api/v1/billing/statements/:customerId returns identical statement');


  console.log('\n--- SECTION 5: COLLECTION PRIORITY INTELLIGENCE ---');

  // Scenario 27: Collection priority ranking
  const priorityRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/receivables/collection-priority?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(priorityRes.code, 200);
  const priorities = priorityRes.body.data;
  assert.ok(priorities.length >= 2);
  passScenario('GET /api/v1/billing/receivables/collection-priority returns ranked accounts');

  // Scenario 28: Top priority evaluation
  const topP = priorities[0];
  assert.strictEqual(topP.customerId, custA1.id);
  assert.ok(topP.priorityScore >= 70);
  assert.ok(['HIGH', 'CRITICAL'].includes(topP.priorityLevel));
  passScenario('Account with 130-day delinquency ranked at HIGH/CRITICAL priority');

  // Scenario 29: Explainable evidence/reasons provided
  assert.ok(Array.isArray(topP.reasons));
  assert.ok(topP.reasons.length >= 2);
  const hasAgingReason = topP.reasons.some((r: string) => r.includes('delinquency') || r.includes('days past due'));
  assert.ok(hasAgingReason);
  passScenario('Collection priority provides explainable factual reasons');

  // Scenario 30: Recommended collection actions
  assert.ok(
    ['ESCALATE_TO_COLLECTIONS', 'URGENT_DIRECT_CONTACT', 'FORMAL_DEMAND_NOTICE'].includes(
      topP.recommendedAction
    )
  );
  passScenario('Actionable conservative recommendation generated (e.g. ESCALATE_TO_COLLECTIONS)');

  // Scenario 31: Ainubis Governance boundary — Non-autonomous financial safety
  // Prioritization must be read-only and never write off debt or mutate receivable amounts
  const recAfterPriority = await receivableRepository.findById(tenantA, 'rec_scen_a1_130');
  assert.strictEqual(recAfterPriority?.outstandingAmount, 25000);
  assert.strictEqual(recAfterPriority?.status, 'OVERDUE');
  passScenario('Ainubis intelligence boundary: Zero autonomous financial mutations');

  console.log('\n--- SECTION 6: COMMERCIAL LEDGER RECONCILIATION ---');

  // Scenario 32: Ledger reconciliation report
  const reconRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/reconciliation?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenA}` }
  );
  assert.strictEqual(reconRes.code, 200);
  const recon = reconRes.body.data;
  assert.strictEqual(recon.totalInvoicedAmount, 50000);
  assert.strictEqual(recon.totalReceivablesOpened, 50000);
  assert.strictEqual(recon.invoicingReceivablesDifference, 0);
  assert.strictEqual(recon.totalReceivablesOutstanding, 50000);
  assert.strictEqual(recon.customerBalancesSum, 50000);
  assert.strictEqual(recon.customerReceivablesDifference, 0);
  passScenario('Reconciliation cross-checks Invoices vs Receivables vs Customer Balances');

  // Scenario 33: Unapplied payment detection
  assert.strictEqual(recon.totalPaymentsRecorded, 5000);
  assert.strictEqual(recon.totalAllocationsApplied, 0);
  assert.strictEqual(recon.totalUnappliedPayments, 5000);
  passScenario('Reconciliation accurately detects and reports unapplied payments');

  // Scenario 34: Zero discrepancy verification
  assert.strictEqual(recon.isReconciled, true);
  assert.strictEqual(recon.discrepancies.length, 0);
  passScenario('Reconciliation reports isReconciled: true when ledger matches');

  // Scenario 35: Multi-currency breakdown
  assert.ok(recon.byCurrency['ZAR']);
  assert.strictEqual(recon.byCurrency['ZAR'].isReconciled, true);
  passScenario('Reconciliation provides per-currency financial breakdown');

  console.log('\n--- SECTION 7: SECURITY, RBAC & MULTI-TENANT ISOLATION ---');

  // Scenario 36: Cross-tenant aging isolation
  const tenantBAgingRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/receivables/aging?asOfDate=${evaluationDate}`,
    { authorization: `Bearer ${tokenB}` }
  );
  assert.strictEqual(tenantBAgingRes.code, 200);
  assert.strictEqual(tenantBAgingRes.body.data.totalOutstanding, 15000);
  assert.strictEqual(tenantBAgingRes.body.data.totalReceivablesCount, 1);
  passScenario('Multi-tenant isolation: Tenant B only sees own receivables');

  // Scenario 37: Cross-tenant 404 concealment on customer balance
  const crossCustBalanceRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/customers/${custA1.id}/balance`,
    { authorization: `Bearer ${tokenB}` }
  );
  assert.strictEqual(crossCustBalanceRes.code, 404);
  passScenario('Cross-tenant 404 concealment on customer balance');

  // Scenario 38: Cross-tenant 404 concealment on customer statement
  const crossStmtRes = await executeRequest(
    app,
    'GET',
    `/api/v1/billing/customers/${custA1.id}/statement`,
    { authorization: `Bearer ${tokenB}` }
  );
  assert.strictEqual(crossStmtRes.code, 404);
  passScenario('Cross-tenant 404 concealment on customer statement');

  // Scenario 39: RBAC enforcement on receivables aging
  const unauthorizedAging = await executeRequest(
    app,
    'GET',
    '/api/v1/billing/receivables/aging',
    { authorization: `Bearer ${tokenUnauthorized}` }
  );
  assert.strictEqual(unauthorizedAging.code, 403);
  passScenario('RBAC security gate: Unauthorized role rejected with 403 Forbidden on aging');

  // Scenario 40: RBAC enforcement on reconciliation
  const unauthorizedRecon = await executeRequest(
    app,
    'GET',
    '/api/v1/billing/reconciliation',
    { authorization: `Bearer ${tokenUnauthorized}` }
  );
  assert.strictEqual(unauthorizedRecon.code, 403);
  passScenario('RBAC security gate: Unauthorized role rejected with 403 Forbidden on reconciliation');

  console.log('\n====================================================');
  console.log(`✅ ALL ${scenarioCount} AR AGING & STATEMENTS SCENARIOS PASSED`);
  console.log('====================================================\n');
}
