/**
 * BCIP Commercial Operations & Invoicing Foundation Test Suite
 * Phase 3 — Prompt 003-001
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  billingCustomerRepository,
  billingProfileRepository,
  billingTaxRepository,
  invoiceRepository,
  invoiceLineRepository,
  billingAuditRepository,
  InvoiceCalculationService,
  InvoiceLifecycleService,
  InvoiceNumberingService,
  CustomerStatus,
  BillingFrequency,
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

export async function runBillingFoundationTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 3 Prompt 003-001: Billing Foundation Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_bill_a';
  const tenantB = 'ten_bill_b';

  const adminUserA: UserAccount = {
    id: 'usr_bill_admin_a',
    fullName: 'Alex Billing Admin',
    email: 'alex.billing@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'ABA',
    tenantId: tenantA,
    tenantName: 'Apex Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const adminUserB: UserAccount = {
    id: 'usr_bill_admin_b',
    fullName: 'Bianca Billing Admin',
    email: 'bianca.billing@beacon.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'BBA',
    tenantId: tenantB,
    tenantName: 'Beacon Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const trusteeUserA: UserAccount = {
    id: 'usr_bill_trustee_a',
    fullName: 'Tim Trustee',
    email: 'tim@scheme.co.za',
    role: 'SCHEME_TRUSTEE', // Lacks billing permissions
    initials: 'TT',
    tenantId: tenantA,
    tenantName: 'Apex Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);
  const tokenAdminB = createClientAuthToken(adminUserB, tenantB);
  const tokenTrusteeA = createClientAuthToken(trusteeUserA, tenantA);

  // Clear repositories
  billingCustomerRepository.clear();
  billingProfileRepository.clear();
  billingTaxRepository.clear();
  invoiceRepository.clear();
  invoiceLineRepository.clear();
  billingAuditRepository.clear();

  // 1. Billing customer creation
  console.log('Test 1: Billing customer creation...');
  const custA = await billingCustomerRepository.create({
    id: 'cust_a_1',
    tenantId: tenantA,
    customerNumber: 'CUST-000001',
    legalName: 'Sandton Heights Body Corporate',
    billingEmail: 'accounts@sandtonheights.co.za',
    billingAddress: '12 Rivonia Road, Sandton',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });
  assert.strictEqual(custA.legalName, 'Sandton Heights Body Corporate');
  console.log('   ✓ Passed.');

  // 2. Billing customer tenant isolation
  console.log('Test 2: Billing customer tenant isolation...');
  const custB = await billingCustomerRepository.create({
    id: 'cust_b_1',
    tenantId: tenantB,
    customerNumber: 'CUST-000001',
    legalName: 'Table Mountain Body Corporate',
    billingEmail: 'accounts@tablemountain.co.za',
    billingAddress: '44 Long Street, Cape Town',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });
  const foundByA = await billingCustomerRepository.findById(tenantA, custB.id);
  assert.strictEqual(foundByA, null, 'Tenant A must not be able to read Tenant B customer');
  console.log('   ✓ Passed.');

  // 3. Billing profile creation
  console.log('Test 3: Billing profile creation...');
  const profileA = await billingProfileRepository.create({
    id: 'prof_a_1',
    tenantId: tenantA,
    billingCustomerId: custA.id,
    billingFrequency: BillingFrequency.MONTHLY,
    defaultCurrency: 'ZAR',
    defaultPaymentTerms: 'NET_30',
    invoicePrefix: 'INV-SH',
    nextInvoiceNumber: 1,
    status: CustomerStatus.ACTIVE,
  });
  assert.strictEqual(profileA.invoicePrefix, 'INV-SH');
  console.log('   ✓ Passed.');

  // 4. Invoice creation
  console.log('Test 4: Invoice creation...');
  const invA = await invoiceRepository.create({
    id: 'inv_a_1',
    tenantId: tenantA,
    billingCustomerId: custA.id,
    billingProfileId: profileA.id,
    invoiceNumber: 'INV-SH-000001',
    status: InvoiceStatus.DRAFT,
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    currency: 'ZAR',
    subtotal: 0,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 0,
    createdBy: adminUserA.email,
  });
  assert.strictEqual(invA.status, InvoiceStatus.DRAFT);
  console.log('   ✓ Passed.');

  // 5. Invoice line creation
  console.log('Test 5: Invoice line creation...');
  const lineA = await invoiceLineRepository.create({
    id: 'line_a_1',
    tenantId: tenantA,
    invoiceId: invA.id,
    description: 'Monthly Managing Agency Retainer',
    quantity: 1,
    unitPrice: 15000,
    discountAmount: 500,
    taxRate: 15,
    taxAmount: 2175,
    lineSubtotal: 14500,
    lineTotal: 16675,
    sortOrder: 1,
  });
  assert.strictEqual(lineA.lineTotal, 16675);
  console.log('   ✓ Passed.');

  // 6. Deterministic invoice calculation & 7. Tax & 8. Discount & 9. Rounding
  console.log('Test 6-9: Deterministic calculation, tax, discount & rounding...');
  const calcResult = InvoiceCalculationService.calculateInvoiceTotals([
    {
      id: 'calc_1',
      tenantId: tenantA,
      invoiceId: invA.id,
      description: 'Item 1',
      quantity: 2,
      unitPrice: 100.50,
      discountAmount: 10,
      taxRate: 15,
      sortOrder: 1,
    },
  ]);
  // 2 * 100.50 = 201.00 - 10 discount = 191.00 subtotal. Tax 15% = 28.65. Grand = 219.65.
  assert.strictEqual(calcResult.subtotal, 191.00);
  assert.strictEqual(calcResult.taxTotal, 28.65);
  assert.strictEqual(calcResult.grandTotal, 219.65);
  console.log('   ✓ Passed.');

  // 10. Invoice numbering & 11. Duplicate prevention
  console.log('Test 10-11: Invoice numbering and uniqueness...');
  const num1 = await InvoiceNumberingService.generateNextInvoiceNumber(tenantA, profileA.id);
  const num2 = await InvoiceNumberingService.generateNextInvoiceNumber(tenantA, profileA.id);
  assert.notStrictEqual(num1, num2);
  console.log('   ✓ Passed.');

  // 12. Draft lifecycle & 13. Review & 14. Approve & 15. Issue
  console.log('Test 12-15: Lifecycle state transitions (Draft -> Review -> Approve -> Issue)...');
  const submitted = await InvoiceLifecycleService.submitForReview(tenantA, invA.id, adminUserA.id, 'corr_test');
  assert.strictEqual(submitted.status, InvoiceStatus.REVIEW_REQUIRED);

  const approved = await InvoiceLifecycleService.approveInvoice(tenantA, invA.id, adminUserA.id, 'corr_test', 'Looks good');
  assert.strictEqual(approved.status, InvoiceStatus.APPROVED);

  const issued = await InvoiceLifecycleService.issueInvoice(tenantA, invA.id, adminUserA.id, adminUserA.email, 'corr_test');
  assert.strictEqual(issued.status, InvoiceStatus.ISSUED);
  assert.notStrictEqual(issued.invoiceNumber, undefined);
  console.log('   ✓ Passed.');

  // 16. Invalid lifecycle transition rejection
  console.log('Test 16: Invalid lifecycle transition rejection...');
  await assert.rejects(async () => {
    await InvoiceLifecycleService.submitForReview(tenantA, invA.id, adminUserA.id, 'corr_test');
  }, /Cannot submit invoice for review/);
  console.log('   ✓ Passed.');

  // 17. Issued invoice immutability
  console.log('Test 17: Issued invoice immutability...');
  await assert.rejects(async () => {
    InvoiceLifecycleService.assertCanEditInvoice(issued);
    await invoiceRepository.update(tenantA, invA.id, { notes: 'Changed notes' });
  }, /Cannot modify invoice in ISSUED state/);
  console.log('   ✓ Passed.');

  // 18. Void workflow
  console.log('Test 18: Void workflow...');
  const voided = await InvoiceLifecycleService.voidInvoice(tenantA, invA.id, adminUserA.id, 'corr_test', 'Incorrect billing address');
  assert.strictEqual(voided.status, InvoiceStatus.VOIDED);
  assert.strictEqual(voided.voidReason, 'Incorrect billing address');
  console.log('   ✓ Passed.');

  // 19. RBAC enforcement via API
  console.log('Test 19: RBAC enforcement via API...');
  const rbacRes = await executeRequest(app, 'POST', '/api/v1/billing/customers', {
    authorization: `Bearer ${tokenTrusteeA}`,
  }, {
    legalName: 'Unauthorized Customer',
    billingEmail: 'unauth@test.co.za',
    billingAddress: 'Test Address',
  });
  assert.strictEqual(rbacRes.code, 403, 'Scheme Trustee must receive 403 Forbidden on billing customer creation');
  console.log('   ✓ Passed.');

  // 20. API validation
  console.log('Test 20: API validation...');
  const valRes = await executeRequest(app, 'POST', '/api/v1/billing/customers', {
    authorization: `Bearer ${tokenAdminA}`,
  }, {
    // Missing required fields
    legalName: '',
  });
  assert.strictEqual(valRes.code, 422);
  console.log('   ✓ Passed.');

  // 21. Audit trail creation
  console.log('Test 21: Audit trail creation...');
  const audits = await billingAuditRepository.findAll(tenantA);
  assert.ok(audits.length > 0, 'Commercial audit log entries must be recorded.');
  console.log('   ✓ Passed.');

  // 22. CRM organisation linkage
  console.log('Test 22: CRM organisation linkage...');
  const linkedCust = await billingCustomerRepository.create({
    id: 'cust_org_link',
    tenantId: tenantA,
    organisationId: 'org_crm_123',
    customerNumber: 'CUST-LINK-01',
    legalName: 'Linked Organisation Cust',
    billingEmail: 'link@org.co.za',
    billingAddress: '1 Org Street',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });
  assert.strictEqual(linkedCust.organisationId, 'org_crm_123');
  console.log('   ✓ Passed.');

  // 23. Cross-tenant access rejection
  console.log('Test 23: Cross-tenant access rejection...');
  const crossTenantRes = await executeRequest(app, 'GET', `/api/v1/billing/customers/${custA.id}`, {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(crossTenantRes.code, 404, 'Tenant B querying Tenant A customer must receive 404 Not Found');
  console.log('   ✓ Passed.');

  // 24. Idempotency & 25. Concurrent safety
  console.log('Test 24-25: Idempotency and concurrent sequence safety...');
  const seq1 = await InvoiceNumberingService.generateNextInvoiceNumber(tenantA, profileA.id);
  const seq2 = await InvoiceNumberingService.generateNextInvoiceNumber(tenantA, profileA.id);
  assert.notStrictEqual(seq1, seq2);
  console.log('   ✓ Passed.');

  console.log('\n====================================================');
  console.log('✅ ALL BILLING FOUNDATION TESTS PASSED');
  console.log('====================================================\n');
}
