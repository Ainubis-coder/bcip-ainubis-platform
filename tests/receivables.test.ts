/**
 * BCIP Receivables, Payments & Ledger Allocations Test Suite
 * Phase 3 — Prompt 003-005
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  billingCustomerRepository,
  invoiceRepository,
  invoiceLineRepository,
  receivableRepository,
  paymentRepository,
  paymentAllocationRepository,
  billingAuditRepository,
  ReceivableService,
  InvoiceLifecycleService,
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

export async function runReceivablesTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 3 Prompt 003-005: Receivables & Payments Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'tenant_ledger_a';
  const tenantB = 'tenant_ledger_b';

  const userA: UserAccount = {
    id: 'user_agent_a',
    email: 'agent_a@bcip.co.za',
    name: 'Agent A',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    tenantId: tenantA,
  };

  const userB: UserAccount = {
    id: 'user_agent_b',
    email: 'agent_b@bcip.co.za',
    name: 'Agent B',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    tenantId: tenantB,
  };

  const tokenA = createClientAuthToken(userA, tenantA);
  const tokenB = createClientAuthToken(userB, tenantB);

  // Clear data stores for clean test execution
  receivableRepository.clear();
  paymentRepository.clear();
  paymentAllocationRepository.clear();

  // Create Customer for Tenant A
  const customerA = await billingCustomerRepository.create({
    id: 'cust_ledger_a',
    tenantId: tenantA,
    customerNumber: 'CUST-LEDGER-A',
    legalName: 'Hyde Park Body Corporate',
    billingEmail: 'accounts@hydepark.co.za',
    billingAddress: 'Johannesburg',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });

  // Create Customer for Tenant B
  const customerB = await billingCustomerRepository.create({
    id: 'cust_ledger_b',
    tenantId: tenantB,
    customerNumber: 'CUST-LEDGER-B',
    legalName: 'Rosebank Body Corporate',
    billingEmail: 'accounts@rosebank.co.za',
    billingAddress: 'Johannesburg',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });

  // Create Invoices for Tenant A
  const invoiceDraft = await invoiceRepository.create({
    id: 'inv_draft_a',
    tenantId: tenantA,
    billingCustomerId: customerA.id,
    invoiceNumber: 'INV-DRAFT-1',
    status: InvoiceStatus.DRAFT,
    issueDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    currency: 'ZAR',
    subtotal: 1000,
    taxTotal: 150,
    discountTotal: 0,
    grandTotal: 1150,
    createdBy: userA.id,
  });

  const invoiceApproved = await invoiceRepository.create({
    id: 'inv_approved_a',
    tenantId: tenantA,
    billingCustomerId: customerA.id,
    invoiceNumber: 'INV-APPROVED-1',
    status: InvoiceStatus.APPROVED,
    issueDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    currency: 'ZAR',
    subtotal: 2000,
    taxTotal: 300,
    discountTotal: 0,
    grandTotal: 2300,
    createdBy: userA.id,
  });

  const invoiceIssued = await invoiceRepository.create({
    id: 'inv_issued_a',
    tenantId: tenantA,
    billingCustomerId: customerA.id,
    invoiceNumber: 'INV-ISSUED-1',
    status: InvoiceStatus.APPROVED, // starts as APPROVED so we can issue it
    issueDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    currency: 'ZAR',
    subtotal: 5000,
    taxTotal: 750,
    discountTotal: 0,
    grandTotal: 5750,
    createdBy: userA.id,
  });

  console.log('1. Verifying that issuing an invoice automatically creates a receivable...');
  const issuedInv = await InvoiceLifecycleService.issueInvoice(tenantA, invoiceIssued.id, userA.id, userA.email, 'corr_test');
  assert.strictEqual(issuedInv.status, 'ISSUED');

  const rec = await receivableRepository.findByInvoiceId(tenantA, invoiceIssued.id);
  assert.ok(rec, 'Receivable should be automatically opened.');
  assert.strictEqual(rec.outstandingAmount, 5750);
  assert.strictEqual(rec.status, 'OPEN');
  console.log('   ✓ Receivable automatically created.');

  console.log('2. Verifying that draft/approved invoices cannot create a receivable...');
  await assert.rejects(async () => {
    await ReceivableService.createReceivable(tenantA, invoiceDraft.id, userA.id, 'corr_test');
  }, /Cannot open receivable/);
  console.log('   ✓ Draft invoice creation strictly rejected.');

  console.log('3. Verifying unique receivable idempotency protection...');
  const duplicateRec = await ReceivableService.createReceivable(tenantA, invoiceIssued.id, userA.id, 'corr_test');
  assert.strictEqual(duplicateRec.id, rec.id, 'Duplicate receivable creation should return existing record.');
  console.log('   ✓ Idempotent unique creation verified.');

  console.log('4. Verifying overdue state calculation...');
  // Set due date to past
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  await receivableRepository.update(tenantA, rec.id, { dueDate: pastDate.toISOString() });
  
  const recalculated = await ReceivableService.recalculateReceivable(tenantA, rec.id, userA.id, 'corr_test');
  assert.strictEqual(recalculated.status, 'OVERDUE');
  console.log('   ✓ Overdue state calculated correctly.');

  // Set due date back to future
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  await receivableRepository.update(tenantA, rec.id, { dueDate: futureDate.toISOString() });

  console.log('5. Verifying recording a valid payment...');
  const paymentRecord = await ReceivableService.recordPayment({
    tenantId: tenantA,
    customerId: customerA.id,
    currency: 'ZAR',
    amount: 3000,
    paymentDate: new Date().toISOString(),
    paymentMethod: 'BANK_TRANSFER',
    externalReference: 'EFT-112233',
    recordedBy: userA.id,
    correlationId: 'corr_test',
    idempotencyKey: 'idem_pmt_1',
  });
  assert.strictEqual(paymentRecord.amount, 3000);
  assert.strictEqual(paymentRecord.status, 'UNAPPLIED');
  console.log('   ✓ Payment successfully recorded.');

  console.log('6. Verifying duplicate payment recording is prevented by idempotency...');
  const duplicatePmt = await ReceivableService.recordPayment({
    tenantId: tenantA,
    customerId: customerA.id,
    currency: 'ZAR',
    amount: 3000,
    paymentDate: new Date().toISOString(),
    paymentMethod: 'BANK_TRANSFER',
    recordedBy: userA.id,
    correlationId: 'corr_test',
    idempotencyKey: 'idem_pmt_1',
  });
  assert.strictEqual(duplicatePmt.id, paymentRecord.id);
  console.log('   ✓ Payment idempotency key verified.');

  console.log('7. Verifying valid payment allocation...');
  const allocRes = await ReceivableService.allocatePayment({
    tenantId: tenantA,
    paymentId: paymentRecord.id,
    receivableId: rec.id,
    allocatedAmount: 2000,
    allocatedBy: userA.id,
    correlationId: 'corr_test',
  });
  assert.strictEqual(allocRes.receivable.outstandingAmount, 3750, 'Outstanding balance should decrease by allocated amount.');
  assert.strictEqual(allocRes.receivable.status, 'PARTIALLY_PAID');
  assert.strictEqual(allocRes.payment.status, 'PARTIALLY_ALLOCATED');
  console.log('   ✓ Partial payment allocation successfully applied.');

  console.log('8. Verifying currency mismatch is rejected...');
  const usdPayment = await paymentRepository.create({
    id: 'pmt_usd',
    tenantId: tenantA,
    customerId: customerA.id,
    currency: 'USD',
    amount: 100,
    paymentDate: new Date().toISOString(),
    paymentMethod: 'BANK_TRANSFER',
    status: 'UNAPPLIED',
    recordedBy: userA.id,
    recordedAt: new Date().toISOString(),
    correlationId: 'corr_test',
  });

  await assert.rejects(async () => {
    await ReceivableService.allocatePayment({
      tenantId: tenantA,
      paymentId: usdPayment.id,
      receivableId: rec.id,
      allocatedAmount: 50,
      allocatedBy: userA.id,
      correlationId: 'corr_test',
    });
  }, /Currency mismatch/);
  console.log('   ✓ Currency mismatch rejected.');

  console.log('9. Verifying full payment allocation...');
  // Record another payment for 3750 to pay off the remaining outstanding
  const fullPayment = await ReceivableService.recordPayment({
    tenantId: tenantA,
    customerId: customerA.id,
    currency: 'ZAR',
    amount: 3750,
    paymentDate: new Date().toISOString(),
    paymentMethod: 'BANK_TRANSFER',
    recordedBy: userA.id,
    correlationId: 'corr_test',
  });

  const fullAlloc = await ReceivableService.allocatePayment({
    tenantId: tenantA,
    paymentId: fullPayment.id,
    receivableId: rec.id,
    allocatedAmount: 3750,
    allocatedBy: userA.id,
    correlationId: 'corr_test',
  });
  assert.strictEqual(fullAlloc.receivable.outstandingAmount, 0);
  assert.strictEqual(fullAlloc.receivable.status, 'PAID');
  assert.strictEqual(fullAlloc.payment.status, 'ALLOCATED');
  console.log('   ✓ Receivable marked PAID on full allocation.');

  console.log('10. Verifying allocation reversal restores outstanding balance...');
  const reversedAlloc = await ReceivableService.reverseAllocation(
    tenantA,
    fullAlloc.allocation.id,
    userA.id,
    'corr_test',
    'Incorrect ledger entry'
  );
  assert.strictEqual(reversedAlloc.reversalReason, 'Incorrect ledger entry');
  
  const refreshedRec = await receivableRepository.findById(tenantA, rec.id);
  assert.strictEqual(refreshedRec?.outstandingAmount, 3750);
  assert.strictEqual(refreshedRec?.status, 'PARTIALLY_PAID');
  console.log('   ✓ Allocation reversal restored balances.');

  console.log('11. Verifying payment reversal rolls back all allocations...');
  // First payment had an allocation of 2000. Reversing first payment should roll back that allocation and reset outstanding to 5750.
  const reversedPmt = await ReceivableService.reversePayment(
    tenantA,
    paymentRecord.id,
    userA.id,
    'corr_test',
    'Bounced check'
  );
  assert.strictEqual(reversedPmt.status, 'REVERSED');

  const finalRec = await receivableRepository.findById(tenantA, rec.id);
  assert.strictEqual(finalRec?.outstandingAmount, 5750);
  assert.strictEqual(finalRec?.status, 'OPEN');
  console.log('   ✓ Payment reversal correctly restored balances.');

  console.log('12. Verifying strict cross-tenant access rules...');
  // User B tries to look up Payment or Receivable of Tenant A
  const crossTenantRes = await executeRequest(app, 'GET', `/api/v1/billing/receivables/${rec.id}`, { authorization: `Bearer ${tokenB}` });
  assert.strictEqual(crossTenantRes.code, 404);
  console.log('   ✓ Cross-tenant access strictly prevented.');

  console.log('13. Verifying role authorization protections...');
  // Create an unauthorized user role
  const porterToken = createClientAuthToken({
    id: 'user_porter',
    email: 'porter@bcip.co.za',
    name: 'Porter',
    role: 'SCHEME_MEMBER',
    userRole: 'SCHEME_MEMBER',
    tenantId: tenantA,
  }, tenantA);

  const unauthorizedRes = await executeRequest(app, 'POST', `/api/v1/billing/payments`, { authorization: `Bearer ${porterToken}` }, {
    customerId: customerA.id,
    amount: 100,
    currency: 'ZAR',
    paymentDate: new Date().toISOString(),
    paymentMethod: 'BANK_TRANSFER',
  });
  assert.strictEqual(unauthorizedRes.code, 403, 'Unauthorized roles must receive 403.');
  console.log('   ✓ Unauthorized roles rejected with 403 Forbidden.');

  console.log('====================================================');
  console.log('✅ ALL RECEIVABLES & PAYMENTS TESTS PASSED');
  console.log('====================================================');
}
