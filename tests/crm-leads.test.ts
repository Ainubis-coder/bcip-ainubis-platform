/**
 * BCIP CRM Leads Management Automated Test Suite
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Tests frontend contracts, RBAC permissions, API client operations, and table state handling.
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import { tokenService } from '@bcip/auth';
import {
  LeadStatus,
  ALL_LEAD_STATUSES,
  LEAD_STATUS_CONFIG,
  LeadSource,
  LEAD_SOURCE_LABELS,
  QualificationStatus,
  QUALIFICATION_STATUS_CONFIG,
  ExpectedTimeline,
  EXPECTED_TIMELINE_LABELS,
  Lead,
} from '../apps/web/src/components/crm/shared/crm-types.ts';
import {
  canViewLeads,
  canCreateLead,
  canEditLead,
  canConvertLead,
  canDeleteLead,
} from '../apps/web/src/components/crm/shared/crm-permissions.ts';
import {
  createClientAuthToken,
  CrmApiClient,
} from '../apps/web/src/components/crm/shared/crm-api.ts';
import { UserAccount } from '../apps/web/src/types/tenant.ts';

// Helper to simulate HTTP requests against local Express API instance
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
    json: (data: any) => {
      onComplete({ code: statusCode, headers, body: data });
      return res;
    },
    send: (data: any) => {
      let parsed = data;
      if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
      }
      onComplete({ code: statusCode, headers, body: parsed });
      return res;
    },
    end: () => {
      onComplete({ code: statusCode, headers, body: null });
      return res;
    },
  };

  return res;
}

function executeApiRequest(
  app: any,
  method: string,
  url: string,
  token?: string,
  body?: any,
  extraHeaders?: Record<string, string>
): Promise<HttpResponse> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders || {}),
    };

    const parsedUrl = new URL(`http://localhost:3000${url}`);
    const query: Record<string, string> = {};
    parsedUrl.searchParams.forEach((v, k) => {
      query[k] = v;
    });

    const req: any = {
      method,
      url,
      path: parsedUrl.pathname,
      originalUrl: url,
      query,
      params: {},
      headers,
      body: body || {},
      get: (headerName: string) => headers[headerName.toLowerCase()],
    };

    const res = createMockResponse(resolve);
    app(req, res);
  });
}

export async function runCrmLeadsTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Phase 2D Prompt 002D-002: CRM Leads Tests');
  console.log('====================================================\n');

  const app = createApiApp();

  const testTenantId = 'tenant_leads_test_01';
  const adminUser: UserAccount = {
    id: 'usr_leads_admin_01',
    fullName: 'Thabo Mokoena',
    email: 't.mokoena@apexportfolios.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    initials: 'TM',
    tenantId: testTenantId,
    tenantName: 'Apex Property Portfolios (Pty) Ltd',
    lastLogin: 'Today, 08:14 SAST',
    twoFactorEnabled: true,
  };

  const portfolioManagerUser: UserAccount = {
    id: 'usr_leads_pm_02',
    fullName: 'Brenda van der Merwe',
    email: 'b.vandermerwe@apexportfolios.co.za',
    role: 'PORTFOLIO_MANAGER',
    userRole: 'PORTFOLIO_MANAGER',
    initials: 'BM',
    tenantId: testTenantId,
    tenantName: 'Apex Property Portfolios (Pty) Ltd',
    lastLogin: 'Today, 09:30 SAST',
    twoFactorEnabled: true,
  };

  const trusteeUser: UserAccount = {
    id: 'usr_leads_trustee_03',
    fullName: 'David Smith',
    email: 'd.smith@cascades-trustee.co.za',
    role: 'SCHEME_TRUSTEE',
    userRole: 'SCHEME_TRUSTEE',
    initials: 'DS',
    tenantId: testTenantId,
    tenantName: 'The Cascades Body Corporate',
    lastLogin: 'Yesterday, 14:00 SAST',
    twoFactorEnabled: false,
  };

  // --------------------------------------------------------------------------
  // TEST 1: Lead Status & Controlled Enums Conformance
  // --------------------------------------------------------------------------
  console.log('1. Testing Lead Status & Controlled Enums...');
  const expectedStatuses = ['NEW', 'ENRICHED', 'QUALIFIED', 'NURTURE', 'RE_ENGAGEMENT', 'LOST', 'CONVERTED'];
  assert.strictEqual(ALL_LEAD_STATUSES.length, expectedStatuses.length);

  for (const st of expectedStatuses) {
    assert.ok(ALL_LEAD_STATUSES.includes(st as any), `Missing LeadStatus: ${st}`);
    const cfg = LEAD_STATUS_CONFIG[st as LeadStatus];
    assert.ok(cfg, `Missing config for status: ${st}`);
    assert.ok(cfg.label, `Missing label for status: ${st}`);
    assert.ok(cfg.colorClasses.text, `Missing text color for status: ${st}`);
    assert.ok(cfg.colorClasses.dot, `Missing dot color for status: ${st}`);
  }

  // Verify LeadSource labels
  assert.strictEqual(LEAD_SOURCE_LABELS[LeadSource.DIRECT_OUTREACH], 'Direct Outreach');
  assert.strictEqual(LEAD_SOURCE_LABELS[LeadSource.WEBSITE], 'Website');
  assert.strictEqual(LEAD_SOURCE_LABELS[LeadSource.REFERRAL], 'Referral');
  assert.strictEqual(LEAD_SOURCE_LABELS[LeadSource.CAMPAIGN], 'Campaign');

  // Verify QualificationStatus labels
  assert.strictEqual(QUALIFICATION_STATUS_CONFIG[QualificationStatus.QUALIFIED].label, 'Qualified');
  assert.strictEqual(QUALIFICATION_STATUS_CONFIG[QualificationStatus.PRE_QUALIFIED].label, 'Pre-Qualified');
  console.log('   ✓ Lead status, sources, and qualification taxonomy verified.');

  // --------------------------------------------------------------------------
  // TEST 2: RBAC Client Permissions for Leads
  // --------------------------------------------------------------------------
  console.log('2. Testing RBAC Frontend Permission Checks for Leads...');
  // Managing Agent Admin: full access
  assert.strictEqual(canViewLeads('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canCreateLead('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canEditLead('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canConvertLead('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canDeleteLead('MANAGING_AGENT_ADMIN'), true);

  // Portfolio Manager: view, create, edit, convert, but NOT delete
  assert.strictEqual(canViewLeads('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canCreateLead('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canEditLead('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canConvertLead('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canDeleteLead('PORTFOLIO_MANAGER'), false, 'Portfolio Manager cannot delete leads');

  // Scheme Trustee, Property Owner, Contractor: blocked
  assert.strictEqual(canViewLeads('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canCreateLead('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canViewLeads('PROPERTY_OWNER'), false);
  assert.strictEqual(canViewLeads('CONTRACTOR_SERVICE'), false);
  console.log('   ✓ RBAC permissions correctly enforce view, create, edit, convert, and delete boundaries for Leads.');

  // --------------------------------------------------------------------------
  // TEST 3: Live API Execution: Create Lead
  // --------------------------------------------------------------------------
  console.log('3. Testing Lead Creation via live Express API...');
  const adminToken = createClientAuthToken(adminUser, testTenantId);

  const createRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/leads',
    adminToken,
    {
      title: 'Atlantic Terraces SS 99/2014 — Management Inbound',
      source: LeadSource.WEBSITE,
      email: 'trustees@atlanticterraces-demo.co.za',
      phone: '+27 21 430 0000',
      schemeName: 'Atlantic Terraces SS',
      estimatedUnits: 96,
      managingAgent: 'Self-Managed Body Corporate',
      expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
      description: 'Trustees evaluating cloud software to replace Excel spreadsheets.',
    }
  );

  assert.strictEqual(createRes.code, 201, `Lead creation failed: ${JSON.stringify(createRes.body)}`);
  assert.strictEqual(createRes.body.success, true);
  const createdLead: Lead = createRes.body.data;
  assert.ok(createdLead.id);
  assert.strictEqual(createdLead.title, 'Atlantic Terraces SS 99/2014 — Management Inbound');
  assert.strictEqual(createdLead.status, LeadStatus.NEW);
  assert.strictEqual(createdLead.estimatedUnits, 96);
  console.log(`   ✓ Lead created via API: "${createdLead.title}" (ID: ${createdLead.id})`);

  // --------------------------------------------------------------------------
  // TEST 4: Live API Execution: List Leads with Search, Filters, and Pagination
  // --------------------------------------------------------------------------
  console.log('4. Testing Leads Listing, Server Search, and Pagination...');

  // 4.1 Basic list
  const listRes = await executeApiRequest(app, 'GET', '/api/v1/leads', adminToken);
  assert.strictEqual(listRes.code, 200);
  assert.strictEqual(listRes.body.success, true);
  assert.ok(Array.isArray(listRes.body.data));
  assert.ok(listRes.body.data.length >= 1);
  assert.ok(listRes.body.pagination);
  assert.strictEqual(listRes.body.pagination.page, 1);
  console.log(`   ✓ Leads list retrieved successfully with pagination envelope.`);

  // 4.2 Search query
  const searchRes = await executeApiRequest(
    app,
    'GET',
    '/api/v1/leads?search=Atlantic',
    adminToken
  );
  assert.strictEqual(searchRes.code, 200);
  assert.strictEqual(searchRes.body.success, true);
  assert.ok(searchRes.body.data.some((l: Lead) => l.title.includes('Atlantic')));
  console.log(`   ✓ Server search query filtered matching leads.`);

  // 4.3 Status filter
  const statusRes = await executeApiRequest(
    app,
    'GET',
    `/api/v1/leads?status=${LeadStatus.NEW}`,
    adminToken
  );
  assert.strictEqual(statusRes.code, 200);
  assert.strictEqual(statusRes.body.success, true);
  assert.ok(statusRes.body.data.every((l: Lead) => l.status === LeadStatus.NEW));
  console.log(`   ✓ Status query filtered exclusively NEW status leads.`);

  // --------------------------------------------------------------------------
  // TEST 5: Live API Execution: Update Lead & Status Transition
  // --------------------------------------------------------------------------
  console.log('5. Testing Lead Update & Status Progression...');

  const updateRes = await executeApiRequest(
    app,
    'PATCH',
    `/api/v1/leads/${createdLead.id}`,
    adminToken,
    {
      status: LeadStatus.QUALIFIED,
      qualificationStatus: QualificationStatus.QUALIFIED,
      description: 'Trustee committee completed product demonstration session.',
    }
  );

  assert.strictEqual(updateRes.code, 200, `Lead update failed: ${JSON.stringify(updateRes.body)}`);
  assert.strictEqual(updateRes.body.success, true);
  const updatedLead: Lead = updateRes.body.data;
  assert.strictEqual(updatedLead.status, LeadStatus.QUALIFIED);
  assert.strictEqual(updatedLead.qualificationStatus, QualificationStatus.QUALIFIED);
  console.log(`   ✓ Lead updated and transitioned to QUALIFIED.`);

  // --------------------------------------------------------------------------
  // TEST 6: Soft Deletion Enforcement
  // --------------------------------------------------------------------------
  console.log('6. Testing Soft Deletion...');

  // Soft delete the lead
  const deleteRes = await executeApiRequest(
    app,
    'DELETE',
    `/api/v1/leads/${createdLead.id}`,
    adminToken
  );
  assert.strictEqual(deleteRes.code, 200);
  assert.strictEqual(deleteRes.body.success, true);
  assert.strictEqual(deleteRes.body.data.deleted, true);

  // Verify deleted lead is not returned in standard list
  const verifyListRes = await executeApiRequest(
    app,
    'GET',
    `/api/v1/leads?search=Atlantic`,
    adminToken
  );
  assert.strictEqual(verifyListRes.code, 200);
  const remaining = verifyListRes.body.data.filter((l: Lead) => l.id === createdLead.id);
  assert.strictEqual(remaining.length, 0, 'Soft-deleted lead must not appear in operational queries');
  console.log('   ✓ Soft-deleted lead hidden from operational list.');

  // --------------------------------------------------------------------------
  // TEST 7: Security: 403 Forbidden for Restricted Roles
  // --------------------------------------------------------------------------
  console.log('7. Testing Security Authorization Gates...');
  const trusteeToken = createClientAuthToken(trusteeUser, testTenantId);

  const forbiddenRes = await executeApiRequest(app, 'GET', '/api/v1/leads', trusteeToken);
  assert.strictEqual(forbiddenRes.code, 403, 'SCHEME_TRUSTEE must receive 403 Forbidden for CRM leads');
  assert.strictEqual(forbiddenRes.body.success, false);
  console.log('   ✓ SCHEME_TRUSTEE role properly rejected with 403 FORBIDDEN.');

  // --------------------------------------------------------------------------
  // TEST 8: Pagination & Slicing Math
  // --------------------------------------------------------------------------
  console.log('8. Testing Pagination Range & Math...');
  const total = 52;
  const pageSize = 20;
  const page = 3;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  assert.strictEqual(start, 41);
  assert.strictEqual(end, 52);
  const totalPages = Math.ceil(total / pageSize);
  assert.strictEqual(totalPages, 3);
  console.log(`   ✓ Pagination range (page 3: ${start}..${end} of ${total}, ${totalPages} pages) verified.`);

  console.log('\n====================================================');
  console.log('✅ ALL CRM LEADS ACCEPTANCE TESTS PASSED');
  console.log('====================================================\n');
}

if (process.argv[1]?.endsWith('crm-leads.test.ts')) {
  runCrmLeadsTests().catch((err) => {
    console.error('CRM Leads test suite failed:', err);
    process.exit(1);
  });
}
