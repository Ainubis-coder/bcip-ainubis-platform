/**
 * BCIP Invoice Delivery & Communications Foundation Test Suite
 * Phase 3 — Prompt 003-004
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  billingCustomerRepository,
  invoiceRepository,
  invoiceLineRepository,
  invoiceDocumentRepository,
  invoiceDeliveryRepository,
  invoiceDeliveryAttemptRepository,
  invoiceDeliveryTemplateRepository,
  CustomerStatus,
  InvoiceStatus,
  InvoiceDeliveryService,
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

export async function runInvoiceDeliveriesTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 3 Prompt 003-004: Invoice Deliveries Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'tenant_deliv_a';
  const tenantB = 'tenant_deliv_b';

  const userA: UserAccount = {
    id: 'usr_deliv_admin',
    fullName: 'Delivery Admin',
    email: 'deliv@bcip.io',
    role: 'PLATFORM_SUPER_ADMIN',
    userRole: 'PLATFORM_SUPER_ADMIN',
    initials: 'DA',
    tenantId: tenantA,
    tenantName: 'Tenant A',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const tokenA = createClientAuthToken(userA, tenantA);
  const authHeadersA = {
    authorization: `Bearer ${tokenA}`,
    'x-test-tenant-id': tenantA,
    'x-test-user-id': userA.id,
    'x-test-user-role': userA.role || '',
    'x-test-user-email': userA.email,
  };

  const userB: UserAccount = {
    id: 'usr_deliv_b',
    fullName: 'User B',
    email: 'userb@bcip.io',
    role: 'PLATFORM_SUPER_ADMIN',
    userRole: 'PLATFORM_SUPER_ADMIN',
    initials: 'UB',
    tenantId: tenantB,
    tenantName: 'Tenant B',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };
  const tokenB = createClientAuthToken(userB, tenantB);
  const authHeadersB = {
    authorization: `Bearer ${tokenB}`,
    'x-test-tenant-id': tenantB,
    'x-test-user-id': userB.id,
    'x-test-user-role': userB.role,
    'x-test-user-email': userB.email,
  };

  // 1. Seed Customer, APPROVED Invoice, and Document for Tenant A
  const customer = await billingCustomerRepository.create({
    id: 'cust_del_1',
    tenantId: tenantA,
    customerNumber: 'CUST-DEL-001',
    legalName: 'Delivery Test Scheme',
    billingEmail: 'accounts@delivtest.co.za',
    billingAddress: '400 Deliveries Street, Pretoria',
    currency: 'ZAR',
    status: CustomerStatus.ACTIVE,
  });

  const invoice = await invoiceRepository.create({
    id: 'inv_del_1',
    tenantId: tenantA,
    billingCustomerId: customer.id,
    invoiceNumber: 'INV-DEL-001',
    status: InvoiceStatus.APPROVED,
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    currency: 'ZAR',
    subtotal: 2000,
    taxTotal: 300,
    discountTotal: 0,
    grandTotal: 2300,
    createdBy: userA.id,
  });

  const doc = await invoiceDocumentRepository.create({
    id: 'doc_del_1',
    tenantId: tenantA,
    invoiceId: invoice.id,
    documentType: 'INVOICE',
    documentNumber: 'INV-DEL-001-DOC-1',
    version: 1,
    status: 'GENERATED',
    generatedAt: new Date().toISOString(),
    generatedBy: userA.id,
    contentHash: 'hash_del_123',
    storageReference: 'store://tenant_deliv_a/invoices/inv_del_1/file.pdf',
    fileName: 'Invoice_INV-DEL-001_v1.pdf',
    mimeType: 'application/pdf',
    deliveryStatus: 'NOT_SENT',
  });

  // Seed custom template for Tenant A
  const template = await invoiceDeliveryTemplateRepository.create({
    id: 'tmpl_del_1',
    tenantId: tenantA,
    name: 'Custom Template A',
    subject: 'Attached Invoice {{invoice_number}}',
    body: 'Dear {{customer_name}},\n\nYour total is R {{invoice_total}} {{currency}}.',
    isActive: true,
    version: 1,
    createdBy: userA.id,
  });

  // Test 1: Template variables resolution and sandboxing
  const variables = {
    customer_name: 'Alpha Corp',
    invoice_number: 'INV-789',
    invoice_date: '2026-10-06',
    due_date: '2026-10-21',
    invoice_total: '5000',
    currency: 'ZAR',
  };
  const resolvedBody = InvoiceDeliveryService.resolveTemplate(
    'Welcome {{customer_name}}! Number: {{invoice_number}} of {{invoice_total}}.',
    variables
  );
  assert.strictEqual(resolvedBody, 'Welcome Alpha Corp! Number: INV-789 of 5000.', 'Test 1: Variables must be correctly resolved');
  console.log('   ✓ Test 1: Sandbox template variables resolved correctly.');

  // Test 2: Delivery preparation validation (DRAFT invoice must be rejected)
  const draftInvoice = await invoiceRepository.create({
    id: 'inv_del_draft',
    tenantId: tenantA,
    billingCustomerId: customer.id,
    invoiceNumber: 'INV-DEL-DRAFT',
    status: InvoiceStatus.DRAFT,
    issueDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    currency: 'ZAR',
    subtotal: 100,
    taxTotal: 15,
    discountTotal: 0,
    grandTotal: 115,
    createdBy: userA.id,
  });

  const draftDoc = await invoiceDocumentRepository.create({
    id: 'doc_del_draft',
    tenantId: tenantA,
    invoiceId: draftInvoice.id,
    documentType: 'INVOICE',
    documentNumber: 'INV-DEL-DRAFT-DOC-1',
    version: 1,
    status: 'GENERATED',
    generatedAt: new Date().toISOString(),
    generatedBy: userA.id,
    contentHash: 'hash_draft',
    storageReference: 'store://draft.pdf',
    fileName: 'Draft.pdf',
    mimeType: 'application/pdf',
    deliveryStatus: 'NOT_SENT',
  });

  const failRes = await executeRequest(app, 'POST', `/api/v1/billing/invoices/${draftInvoice.id}/deliveries`, authHeadersA, {
    documentId: draftDoc.id,
    recipientEmail: 'test@deliv.co.za',
    templateId: template.id,
  });
  assert.strictEqual(failRes.code, 422, 'Test 2: DRAFT invoice delivery must be rejected with 422');
  console.log('   ✓ Test 2: State gate checks validated (DRAFT delivery rejected).');

  // Test 3: Successful email delivery trigger (SENT)
  const sendRes = await executeRequest(app, 'POST', `/api/v1/billing/invoices/${invoice.id}/deliveries`, authHeadersA, {
    documentId: doc.id,
    recipientEmail: 'success@delivtest.co.za',
    templateId: template.id,
  });
  assert.strictEqual(sendRes.code, 201, 'Test 3: Delivery should return 201 Created');
  const sendData = sendRes.body?.data || sendRes.body;
  assert.strictEqual(sendData.delivery.status, 'SENT', 'Test 3: Successful delivery status must be SENT');
  assert.strictEqual(sendData.attempt.status, 'SENT', 'Test 3: Attempt status must be SENT');
  assert.ok(sendData.attempt.providerReference, 'Test 3: Attempt must record providerReference');
  console.log('   ✓ Test 3: Successful email dispatch verified with SENT state.');

  // Test 4: Simulate delivery temporary failure (FAILED)
  const failSendRes = await executeRequest(app, 'POST', `/api/v1/billing/invoices/${invoice.id}/deliveries`, authHeadersA, {
    documentId: doc.id,
    recipientEmail: 'tempfail@delivtest.co.za',
    templateId: template.id,
  });
  assert.strictEqual(failSendRes.code, 201, 'Test 4: Delivery trigger accepts but records failure');
  const failData = failSendRes.body?.data || failSendRes.body;
  assert.strictEqual(failData.delivery.status, 'FAILED', 'Test 4: Delivery status must be FAILED');
  assert.strictEqual(failData.attempt.status, 'FAILED', 'Test 4: Attempt status must be FAILED');
  assert.strictEqual(failData.attempt.failureCode, 'TEMPORARY_SMTP_TIMEOUT', 'Test 4: Safe failure code recorded');
  console.log('   ✓ Test 4: Simulated temporary delivery failure verified.');

  // Test 5: Retry failed delivery (marks SENT on success retry)
  // We modify the failed delivery's destination so that retrying resolves successfully
  await invoiceDeliveryRepository.update(tenantA, failData.delivery.id, { destination: 'success@delivtest.co.za' });

  const retryRes = await executeRequest(app, 'POST', `/api/v1/billing/invoice-deliveries/${failData.delivery.id}/retry`, authHeadersA);
  assert.strictEqual(retryRes.code, 200, 'Test 5: Retry must succeed');
  const retryData = retryRes.body?.data || retryRes.body;
  assert.strictEqual(retryData.delivery.status, 'SENT', 'Test 5: Retried delivery status must become SENT');
  assert.strictEqual(retryData.attempt.attemptNumber, 2, 'Test 5: Attempt number must increment to 2');
  console.log('   ✓ Test 5: Manual retry flow and attempt tracking verified.');

  // Test 6: Strict Tenant Isolation
  const crossRes = await executeRequest(app, 'GET', `/api/v1/billing/invoices/${invoice.id}/deliveries`, authHeadersB);
  assert.strictEqual(crossRes.code, 404, 'Test 6: Tenant B cannot list Tenant A deliveries (returns 404 concealment)');
  console.log('   ✓ Test 6: Multi-tenant delivery isolation strictly enforced.');

  console.log('====================================================');
  console.log('✅ ALL INVOICE DELIVERIES TESTS PASSED');
  console.log('====================================================');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runInvoiceDeliveriesTests().catch((err) => {
    console.error('Invoice Deliveries test failed:', err);
    process.exit(1);
  });
}
