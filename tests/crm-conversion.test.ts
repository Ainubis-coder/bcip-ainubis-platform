/**
 * BCIP CRM Lead Conversion Wizard Automated Test Suite
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Tests conversion contracts, RBAC permissions, live API atomic execution, error handling, and lifecycle.
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  Lead,
  LeadStatus,
  LeadSource,
  QualificationStatus,
  ExpectedTimeline,
  ConvertLeadDto,
  ConvertLeadResult,
  OrganisationType,
} from '../apps/web/src/components/crm/shared/crm-types.ts';
import {
  canConvertLead,
  canViewLeads,
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

export async function runCrmConversionTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Phase 2D Prompt 002D-003: CRM Lead Conversion Tests');
  console.log('====================================================\n');

  const app = createApiApp();

  const testTenantId = 'tenant_conversion_test_01';
  const adminUser: UserAccount = {
    id: 'usr_conv_admin_01',
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
    id: 'usr_conv_pm_02',
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
    id: 'usr_conv_trustee_03',
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

  const adminToken = createClientAuthToken(adminUser, testTenantId);
  const trusteeToken = createClientAuthToken(trusteeUser, testTenantId);

  // --------------------------------------------------------------------------
  // TEST 1: RBAC Conversion Eligibility Checks
  // --------------------------------------------------------------------------
  console.log('1. Testing RBAC Conversion Permission Gates...');
  assert.strictEqual(canConvertLead('PLATFORM_SUPER_ADMIN'), true);
  assert.strictEqual(canConvertLead('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canConvertLead('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canConvertLead('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canConvertLead('PROPERTY_OWNER'), false);
  assert.strictEqual(canConvertLead('CONTRACTOR_SERVICE'), false);
  assert.strictEqual(canConvertLead('RESIDENT_TENANT'), false);
  console.log('   ✓ RBAC permissions correctly gate conversion to Managing Agent & Portfolio Managers.');

  // --------------------------------------------------------------------------
  // TEST 2: Seed & Create Target Lead for Conversion
  // --------------------------------------------------------------------------
  console.log('2. Creating Target Qualified Lead for Conversion...');
  const createLeadRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/leads',
    adminToken,
    {
      title: 'Bantry Bay Luxury Heights SS 114/2018',
      source: LeadSource.DIRECT_OUTREACH,
      email: 'trustees@bantrybayheights.co.za',
      phone: '+27 21 438 1200',
      schemeName: 'Bantry Bay Luxury Heights SS',
      estimatedUnits: 142,
      managingAgent: 'Atlantic Seaboard Portfolios (Pty) Ltd',
      expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
      description: 'Trustees evaluated live Ainubis demonstration; approved formal proposal creation.',
    }
  );

  assert.strictEqual(createLeadRes.code, 201, `Failed to create lead: ${JSON.stringify(createLeadRes.body)}`);
  const leadToConvert: Lead = createLeadRes.body.data;
  assert.ok(leadToConvert.id);
  assert.strictEqual(leadToConvert.status, LeadStatus.NEW);
  console.log(`   ✓ Target lead created: "${leadToConvert.title}" (ID: ${leadToConvert.id})`);

  // --------------------------------------------------------------------------
  // TEST 3: Execute Atomic Lead Conversion via POST /api/v1/leads/:id/convert
  // --------------------------------------------------------------------------
  console.log('3. Executing Atomic Lead Conversion via live REST API...');
  const conversionPayload: ConvertLeadDto = {
    organisationName: 'Atlantic Seaboard Portfolios (Pty) Ltd',
    organisationType: OrganisationType.MANAGING_AGENT,
    contactFirstName: 'David',
    contactLastName: 'van Zyl',
    opportunityName: 'Atlantic Seaboard Portfolios — 142 Units BCIP Enterprise License',
    estimatedValue: 42600.0,
    expectedCloseDate: '2026-11-30',
    createSchemeProspect: true,
  };

  const convertRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/leads/${leadToConvert.id}/convert`,
    adminToken,
    conversionPayload,
    { 'x-idempotency-key': `conv_test_${Date.now()}` }
  );

  assert.strictEqual(convertRes.code, 200, `Lead conversion failed: ${JSON.stringify(convertRes.body)}`);
  assert.strictEqual(convertRes.body.success, true);
  const result: ConvertLeadResult = convertRes.body.data;

  // Verify all 5 entities in atomic result
  assert.ok(result.lead, 'Converted result must include lead');
  assert.strictEqual(result.lead.status, LeadStatus.CONVERTED, 'Lead status must be CONVERTED');
  assert.ok(result.lead.convertedAt, 'Lead must have convertedAt timestamp');
  assert.ok(result.lead.convertedOpportunityId, 'Lead must link to created opportunity');

  assert.ok(result.organisation, 'Converted result must include organisation');
  assert.strictEqual(result.organisation.name, 'Atlantic Seaboard Portfolios (Pty) Ltd');

  assert.ok(result.contact, 'Converted result must include contact');
  assert.ok(result.contact.displayName?.includes('David') || result.contact.name?.includes('David'));

  assert.ok(result.schemeProspect, 'Converted result must include scheme prospect');
  assert.strictEqual(result.schemeProspect.name, 'Bantry Bay Luxury Heights SS');
  assert.strictEqual(result.schemeProspect.estimatedUnitCount, 142);

  assert.ok(result.opportunity, 'Converted result must include opportunity');
  assert.strictEqual(result.opportunity.name, 'Atlantic Seaboard Portfolios — 142 Units BCIP Enterprise License');
  assert.strictEqual(result.opportunity.stage, 'DISCOVERY');
  assert.strictEqual(result.opportunity.estimatedValue, 42600.0);
  assert.strictEqual(result.opportunity.probability, 25);
  console.log(`   ✓ Atomic conversion completed: Org "${result.organisation.name}", Contact, Prospect, Opportunity "${result.opportunity.name}" (R${result.opportunity.estimatedValue}).`);

  // --------------------------------------------------------------------------
  // TEST 4: Idempotency & Conflict Guard: Re-converting already converted lead
  // --------------------------------------------------------------------------
  console.log('4. Testing Duplicate Conversion Prevention (409 Conflict)...');
  const duplicateConvertRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/leads/${leadToConvert.id}/convert`,
    adminToken,
    conversionPayload
  );

  assert.strictEqual(
    duplicateConvertRes.code,
    409,
    `Expected 409 CONFLICT for already converted lead, got: ${duplicateConvertRes.code}`
  );
  assert.strictEqual(duplicateConvertRes.body.success, false);
  console.log('   ✓ Duplicate conversion attempt rejected cleanly with HTTP 409 CONFLICT.');

  // --------------------------------------------------------------------------
  // TEST 5: Security: Restricted Role 403 Forbidden
  // --------------------------------------------------------------------------
  console.log('5. Testing RBAC Security Enforcement (403 Forbidden)...');
  const forbiddenRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/leads/${leadToConvert.id}/convert`,
    trusteeToken,
    conversionPayload
  );

  assert.strictEqual(
    forbiddenRes.code,
    403,
    `Expected 403 FORBIDDEN for SCHEME_TRUSTEE, got: ${forbiddenRes.code}`
  );
  assert.strictEqual(forbiddenRes.body.success, false);
  console.log('   ✓ SCHEME_TRUSTEE conversion attempt blocked with 403 FORBIDDEN.');

  // --------------------------------------------------------------------------
  // TEST 6: Validation: Bad Payload Rejection (422)
  // --------------------------------------------------------------------------
  console.log('6. Testing Validation Middleware for Conversion Payload...');
  const invalidPayloadRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/leads/${leadToConvert.id}/convert`,
    adminToken,
    {
      estimatedValue: -5000, // Invalid negative financial value
    }
  );

  assert.strictEqual(
    invalidPayloadRes.code,
    422,
    `Expected 422 VALIDATION_ERROR for negative value, got: ${invalidPayloadRes.code}`
  );
  console.log('   ✓ Negative financial value rejected with HTTP 422 Validation Error.');

  // --------------------------------------------------------------------------
  // TEST 7: Target Not Found (404)
  // --------------------------------------------------------------------------
  console.log('7. Testing Inexistent Lead Conversion (404 Not Found)...');
  const notFoundRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/leads/lead_nonexistent_99999/convert',
    adminToken,
    conversionPayload
  );

  assert.strictEqual(
    notFoundRes.code,
    404,
    `Expected 404 NOT_FOUND for invalid lead ID, got: ${notFoundRes.code}`
  );
  console.log('   ✓ Nonexistent lead conversion rejected with HTTP 404 NOT FOUND.');

  // --------------------------------------------------------------------------
  // TEST 8: Verify Converted Lead Status in Operational Queries
  // --------------------------------------------------------------------------
  console.log('8. Verifying Converted Lead State in Leads Query...');
  const getLeadRes = await executeApiRequest(
    app,
    'GET',
    `/api/v1/leads/${leadToConvert.id}`,
    adminToken
  );

  assert.strictEqual(getLeadRes.code, 200);
  assert.strictEqual(getLeadRes.body.data.status, LeadStatus.CONVERTED);
  assert.strictEqual(getLeadRes.body.data.convertedOpportunityId, result.opportunity.id);
  console.log('   ✓ Operational query confirms lead status is permanently CONVERTED.');

  console.log('\n====================================================');
  console.log('✅ ALL CRM LEAD CONVERSION ACCEPTANCE TESTS PASSED');
  console.log('====================================================\n');
}

if (process.argv[1]?.endsWith('crm-conversion.test.ts')) {
  runCrmConversionTests().catch((err) => {
    console.error('CRM Lead Conversion test suite failed:', err);
    process.exit(1);
  });
}
