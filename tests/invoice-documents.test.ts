/**
 * BCIP Invoice Document Generation & Delivery Foundation Test Suite
 * Phase 3 — Prompt 003-003
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  billingCustomerRepository,
  invoiceRepository,
  invoiceLineRepository,
  invoiceDocumentRepository,
  billingAuditRepository,
  InvoiceDocumentService,
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

export async function runInvoiceDocumentsTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 3 Prompt 003-003: Invoice Documents Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'tenant_doc_a';
  const tenantB = 'tenant_doc_b';

  const userA: UserAccount = {
    id: 'usr_doc_admin',
    name: 'Doc Admin',
    email: 'admin@bcip.io',
    role: 'PLATFORM_SUPER_ADMIN',
    userRole: 'PLATFORM_SUPER_ADMIN',
  };

  const tokenA = createClientAuthToken(userA, tenantA);
  const authHeadersA = {
    authorization: `Bearer ${tokenA}`,
    'x-test-tenant-id': tenantA,
    'x-test-user-id': userA.id,
    'x-test-user-role': userA.role,
    'x-test-user-email': userA.email,
  };

  const userB: UserAccount = {
    id: 'usr_doc_b',
    name: 'User B',
    email: 'userb@bcip.io',
    role: 'PLATFORM_SUPER_ADMIN',
    userRole: 'PLATFORM_SUPER_ADMIN',
  };
  const tokenB = createClientAuthToken(userB, tenantB);
  const authHeadersB = {
    authorization: `Bearer ${tokenB}`,
    'x-test-tenant-id': tenantB,
    'x-test-user-id': userB.id,
    'x-test-user-role': userB.role,
    'x-test-user-email': userB.email,
  };

  // 1. Seed customer and invoice for Tenant A (in APPROVED state)
  const customer = await billingCustomerRepository.create({
    id: 'cust_doc_1',
    tenantId: tenantA,
    customerNumber: 'CUST-DOC-001',
    legalName: 'Document Test Body Corporate',
    billingEmail: 'billing@doctype.co.za',
    billingAddress: '100 Document Road, Cape Town',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });

  const invoice = await invoiceRepository.create({
    id: 'inv_doc_1',
    tenantId: tenantA,
    billingCustomerId: customer.id,
    invoiceNumber: 'INV-DOC-2026-001',
    status: InvoiceStatus.APPROVED,
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    currency: 'ZAR',
    subtotal: 1000,
    taxTotal: 150,
    discountTotal: 0,
    grandTotal: 1150,
    createdBy: userA.id,
  });

  await invoiceLineRepository.create({
    id: 'line_doc_1',
    tenantId: tenantA,
    invoiceId: invoice.id,
    description: 'Management Services',
    quantity: 1,
    unitPrice: 1000,
    discountAmount: 0,
    taxRate: 15,
    taxAmount: 150,
    lineSubtotal: 1000,
    lineTotal: 1150,
    sortOrder: 1,
  });

  // Test 1: Rejection of document generation for DRAFT invoices (we test by setting invoice to DRAFT)
  const draftInvoice = await invoiceRepository.create({
    id: 'inv_draft_1',
    tenantId: tenantA,
    billingCustomerId: customer.id,
    invoiceNumber: 'INV-DRAFT-001',
    status: InvoiceStatus.DRAFT,
    issueDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    currency: 'ZAR',
    subtotal: 500,
    taxTotal: 75,
    discountTotal: 0,
    grandTotal: 575,
    createdBy: userA.id,
  });

  const failRes = await executeRequest(app, 'POST', `/api/v1/billing/invoices/${draftInvoice.id}/documents`, authHeadersA);
  assert.strictEqual(failRes.code, 422, 'Test 1: DRAFT invoice document generation must be rejected with 422');
  console.log('   ✓ Test 1: DRAFT invoice document generation correctly rejected.');

  // Test 2: Successful Document Generation for APPROVED invoice
  const genRes = await executeRequest(app, 'POST', `/api/v1/billing/invoices/${invoice.id}/documents`, {
    ...authHeadersA,
    'x-idempotency-key': 'idamp_gen_1',
  });
  assert.strictEqual(genRes.code, 201, 'Test 2: Document generation should return 201');
  const doc = genRes.body?.data || genRes.body;
  assert.strictEqual(doc.invoiceId, invoice.id, 'Test 2: Document must link to invoice');
  assert.strictEqual(doc.version, 1, 'Test 2: First document version should be 1');
  assert.strictEqual(doc.status, 'GENERATED', 'Test 2: Document status must be GENERATED');
  assert.ok(doc.contentHash, 'Test 2: Document must have a contentHash checksum');
  console.log('   ✓ Test 2: Document generated successfully with version 1 and checksum.');

  // Test 3: Idempotency Verification
  const idampRes = await executeRequest(app, 'POST', `/api/v1/billing/invoices/${invoice.id}/documents`, {
    ...authHeadersA,
    'x-idempotency-key': 'idamp_gen_1',
  });
  assert.strictEqual(idampRes.code, 201, 'Test 3: Idempotent request should succeed');
  const idampDoc = idampRes.body?.data || idampRes.body;
  assert.strictEqual(idampDoc.id, doc.id, 'Test 3: Idempotent request must return the exact same document record');
  console.log('   ✓ Test 3: Idempotency verified (no duplicate document created).');

  // Test 4: Versioning and Superseding
  const genRes2 = await executeRequest(app, 'POST', `/api/v1/billing/invoices/${invoice.id}/documents`, {
    ...authHeadersA,
    'x-idempotency-key': 'idamp_gen_2',
  });
  assert.strictEqual(genRes2.code, 201, 'Test 4: Second document generation should succeed');
  const doc2 = genRes2.body?.data || genRes2.body;
  assert.strictEqual(doc2.version, 2, 'Test 4: Second document version must be 2');

  const listRes = await executeRequest(app, 'GET', `/api/v1/billing/invoices/${invoice.id}/documents`, authHeadersA);
  assert.strictEqual(listRes.code, 200, 'Test 4: List documents should succeed');
  const docsList = listRes.body?.data || listRes.body;
  assert.strictEqual(docsList.length, 2, 'Test 4: Should have 2 documents in history');
  const supersededDoc = docsList.find((d: any) => d.id === doc.id);
  assert.strictEqual(supersededDoc.status, 'SUPERSEDED', 'Test 4: Older document version must be marked SUPERSEDED');
  console.log('   ✓ Test 4: Document versioning and superseding verified.');

  // Test 5: Tenant Isolation
  const crossTenantRes = await executeRequest(app, 'GET', `/api/v1/billing/invoices/${invoice.id}/documents`, authHeadersB);
  assert.strictEqual(crossTenantRes.code, 404, 'Test 5: Tenant B cannot access Tenant A invoice documents (404/403)');
  console.log('   ✓ Test 5: Multi-tenant document isolation strictly enforced.');

  console.log('====================================================');
  console.log('✅ ALL INVOICE DOCUMENTS TESTS PASSED');
  console.log('====================================================');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runInvoiceDocumentsTests().catch((err) => {
    console.error('Invoice Documents test failed:', err);
    process.exit(1);
  });
}
