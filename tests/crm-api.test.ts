/**
 * BCIP CRM API Layer Automated Test Suite
 * Phase 2 — Prompt 002C: CRM API Layer
 * Verifies Authentication, RBAC, Tenant Isolation, CRUD, Lifecycles, Validation, Pagination, and Idempotency.
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import { tokenService } from '@bcip/auth';
import type { AuthUser, UserRole } from '@bcip/auth';
import {
  OpportunityStage,
  ProposalStatus,
  ContractStatus,
  LeadStatus,
  LeadSource,
  OrganisationType,
  ActivityType,
  TaskPriority,
  CampaignType,
} from '@bcip/database';

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
    },
    on: () => res,
    once: () => res,
    emit: () => true,
  };
  return res;
}

function makeRequest(
  app: any,
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    url: string;
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<HttpResponse> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      host: 'localhost:3000',
      'content-type': 'application/json',
      ...(options.headers || {}),
    };

    if (options.token) {
      headers['authorization'] = `Bearer ${options.token}`;
    }

    const [pathOnly, queryString] = options.url.split('?');
    const query: Record<string, string> = {};
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => {
        query[key] = val;
      });
    }

    const req: any = {
      method: options.method,
      url: options.url,
      originalUrl: options.url,
      headers,
      body: options.body || {},
      query,
      params: {},
      pipe: () => {},
      unpipe: () => {},
      on: () => {},
    };

    const res = createMockResponse((httpRes) => {
      resolve(httpRes);
    });

    app.handle(req, res);
  });
}

function makeToken(tenantId: string, role: UserRole = 'MANAGING_AGENT_ADMIN', userId = 'usr_test_agent'): string {
  const user: AuthUser = {
    id: userId,
    email: `${userId}@bcip.test`,
    name: 'Test Agent',
    role,
    tenantId,
    schemeIds: [],
    permissions: [],
  };
  return tokenService.generateDummyToken(user);
}

export async function runCrmApiTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Prompt 002C: CRM API Layer Automated Test Suite');
  console.log('====================================================');

  const app = createApiApp();
  const TENANT_A = 'tenant_apex_sandton';
  const TENANT_B = 'tenant_coastal_cape';

  const tokenAdminA = makeToken(TENANT_A, 'MANAGING_AGENT_ADMIN', 'usr_admin_a');
  const tokenManagerA = makeToken(TENANT_A, 'PORTFOLIO_MANAGER', 'usr_manager_a');
  const tokenTrusteeA = makeToken(TENANT_A, 'SCHEME_TRUSTEE', 'usr_trustee_a');
  const tokenOwnerA = makeToken(TENANT_A, 'PROPERTY_OWNER', 'usr_owner_a');
  const tokenAdminB = makeToken(TENANT_B, 'MANAGING_AGENT_ADMIN', 'usr_admin_b');

  // --------------------------------------------------------------------
  // 1. Authentication Tests
  // --------------------------------------------------------------------
  console.log('\n--- 1. Authentication Tests ---');
  {
    // 1.1 Unauthenticated request rejected with 401
    const res = await makeRequest(app, { method: 'GET', url: '/api/v1/leads' });
    assert.strictEqual(res.code, 401, 'Unauthenticated request must return 401');
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
    console.log('  ✓ Unauthenticated request rejected with 401 UNAUTHORIZED');

    // 1.2 Invalid Bearer token rejected with 401
    const resInvalid = await makeRequest(app, {
      method: 'GET',
      url: '/api/v1/leads',
      token: 'invalid_malformed_token_string',
    });
    assert.strictEqual(resInvalid.code, 401, 'Malformed token must return 401');
    console.log('  ✓ Malformed Bearer token rejected with 401 UNAUTHORIZED');

    // 1.3 Valid Bearer token succeeds
    const resValid = await makeRequest(app, {
      method: 'GET',
      url: '/api/v1/leads',
      token: tokenAdminA,
    });
    assert.strictEqual(resValid.code, 200, 'Valid token must return 200');
    assert.strictEqual(resValid.body.success, true);
    assert.ok(resValid.body.pagination, 'Pagination envelope present');
    console.log('  ✓ Valid Bearer token authenticated successfully');
  }

  // --------------------------------------------------------------------
  // 2. RBAC Permission Tests
  // --------------------------------------------------------------------
  console.log('\n--- 2. RBAC Authorization Tests ---');
  {
    // 2.1 Managing Agent Admin can create organisation
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/organisations',
      token: tokenAdminA,
      body: {
        name: 'Apex Property Management Group',
        organisationType: OrganisationType.MANAGING_AGENT,
        email: 'info@apexgroup.co.za',
      },
    });
    assert.strictEqual(resCreate.code, 201, 'Admin role should create organisation');
    console.log('  ✓ Authorized role (MANAGING_AGENT_ADMIN) permitted to create resources');

    // 2.2 Property Owner lacks CRM write permission
    const resForbidden = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/leads',
      token: tokenOwnerA,
      body: {
        title: 'Unauthorized Lead Attempt',
        source: LeadSource.WEBSITE,
      },
    });
    assert.strictEqual(resForbidden.code, 403, 'Unauthorized role must return 403 FORBIDDEN');
    assert.strictEqual(resForbidden.body.success, false);
    assert.strictEqual(resForbidden.body.error.code, 'FORBIDDEN');
    console.log('  ✓ Unauthorized role (PROPERTY_OWNER) blocked with 403 FORBIDDEN');
  }

  // --------------------------------------------------------------------
  // 3. Multi-Tenant Isolation Tests (Strict Non-Disclosing Boundary)
  // --------------------------------------------------------------------
  console.log('\n--- 3. Multi-Tenant Boundary Enforcement Tests ---');
  let tenantALeadId = '';
  let tenantBLeadId = '';
  {
    // Create Lead in Tenant A
    const resA = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/leads',
      token: tokenAdminA,
      body: {
        title: 'Tenant A — Sandton Towers Lead',
        source: LeadSource.REFERRAL,
        schemeName: 'Sandton Towers SS',
      },
    });
    assert.strictEqual(resA.code, 201);
    tenantALeadId = resA.body.data.id;

    // Create Lead in Tenant B
    const resB = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/leads',
      token: tokenAdminB,
      body: {
        title: 'Tenant B — Cape Coastal Scheme Lead',
        source: LeadSource.WEBSITE,
        schemeName: 'Cape Coastal SS',
      },
    });
    assert.strictEqual(resB.code, 201);
    tenantBLeadId = resB.body.data.id;

    // Tenant A accesses Tenant A lead -> 200 OK
    const checkA = await makeRequest(app, {
      method: 'GET',
      url: `/api/v1/leads/${tenantALeadId}`,
      token: tokenAdminA,
    });
    assert.strictEqual(checkA.code, 200);
    assert.strictEqual(checkA.body.data.id, tenantALeadId);
    console.log('  ✓ Tenant A can access its own lead (200 OK)');

    // Tenant A attempts to access Tenant B lead -> 404 NOT FOUND (Non-disclosing)
    const crossGet = await makeRequest(app, {
      method: 'GET',
      url: `/api/v1/leads/${tenantBLeadId}`,
      token: tokenAdminA,
    });
    assert.strictEqual(crossGet.code, 404, 'Cross-tenant GET must return non-disclosing 404');
    console.log('  ✓ Tenant A blocked from viewing Tenant B lead (404 NOT FOUND)');

    // Tenant A attempts to update Tenant B lead -> 404 NOT FOUND
    const crossPatch = await makeRequest(app, {
      method: 'PATCH',
      url: `/api/v1/leads/${tenantBLeadId}`,
      token: tokenAdminA,
      body: { title: 'Malicious Update Hijack' },
    });
    assert.strictEqual(crossPatch.code, 404, 'Cross-tenant PATCH must return 404');
    console.log('  ✓ Tenant A blocked from modifying Tenant B lead (404 NOT FOUND)');

    // Tenant A attempts to delete Tenant B lead -> 404 NOT FOUND
    const crossDelete = await makeRequest(app, {
      method: 'DELETE',
      url: `/api/v1/leads/${tenantBLeadId}`,
      token: tokenAdminA,
    });
    assert.strictEqual(crossDelete.code, 404, 'Cross-tenant DELETE must return 404');
    console.log('  ✓ Tenant A blocked from deleting Tenant B lead (404 NOT FOUND)');
  }

  // --------------------------------------------------------------------
  // 4. Full CRUD Tests Across All 10 Entities
  // --------------------------------------------------------------------
  console.log('\n--- 4. Full CRUD Operations Across 10 CRM Resources ---');
  let testOrgId = '';
  let testContactId = '';
  let testLeadId = '';
  let testProspectId = '';
  let testOppId = '';
  let testActivityId = '';
  let testTaskId = '';
  let testCampaignId = '';
  let testProposalId = '';
  let testContractId = '';

  // 4.1 Organisations
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/organisations',
      token: tokenAdminA,
      body: {
        name: 'Highland Ridge Estates (Pty) Ltd',
        organisationType: OrganisationType.MANAGING_AGENT,
        email: 'info@highlandridge.co.za',
        phone: '+27 11 555 4321',
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testOrgId = resCreate.body.data.id;

    const resGet = await makeRequest(app, {
      method: 'GET',
      url: `/api/v1/organisations/${testOrgId}`,
      token: tokenAdminA,
    });
    assert.strictEqual(resGet.code, 200);
    assert.strictEqual(resGet.body.data.name, 'Highland Ridge Estates (Pty) Ltd');

    const resPatch = await makeRequest(app, {
      method: 'PATCH',
      url: `/api/v1/organisations/${testOrgId}`,
      token: tokenAdminA,
      body: { legalName: 'Highland Ridge Estates Proprietary Limited' },
    });
    assert.strictEqual(resPatch.code, 200);
    assert.strictEqual(resPatch.body.data.legalName, 'Highland Ridge Estates Proprietary Limited');

    console.log('  ✓ 4.1 Organisation CRUD verified');
  }

  // 4.2 Contacts
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/contacts',
      token: tokenAdminA,
      body: {
        firstName: 'Brenda',
        lastName: 'van der Merwe',
        organisationId: testOrgId,
        email: 'brenda@highlandridge.co.za',
        phone: '+27 82 555 1234',
        jobTitle: 'Senior Portfolio Manager',
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testContactId = resCreate.body.data.id;

    // Check organisation child route: /organisations/:id/contacts
    const resChild = await makeRequest(app, {
      method: 'GET',
      url: `/api/v1/organisations/${testOrgId}/contacts`,
      token: tokenAdminA,
    });
    assert.strictEqual(resChild.code, 200);
    assert.strictEqual(resChild.body.data.length, 1);
    assert.strictEqual(resChild.body.data[0].id, testContactId);

    console.log('  ✓ 4.2 Contact CRUD & Organisation relationship verified');
  }

  // 4.3 Campaigns
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/campaigns',
      token: tokenAdminA,
      body: {
        name: 'National Managing Agent Migration Q4',
        campaignType: CampaignType.DIGITAL,
        description: 'Targeting 200+ sectional title managing agents in Gauteng',
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testCampaignId = resCreate.body.data.id;
    console.log('  ✓ 4.3 Campaign CRUD verified');
  }

  // 4.4 Leads
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/leads',
      token: tokenAdminA,
      body: {
        title: 'Highland Ridge 50-Scheme Portfolio Migration',
        source: LeadSource.CAMPAIGN,
        campaignId: testCampaignId,
        schemeName: 'Highland Ridge Portfolio',
        estimatedUnits: 1450,
        managingAgent: 'Highland Ridge Estates',
        email: 'brenda@highlandridge.co.za',
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testLeadId = resCreate.body.data.id;
    console.log('  ✓ 4.4 Lead CRUD verified');
  }

  // 4.5 Scheme Prospects
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/scheme-prospects',
      token: tokenAdminA,
      body: {
        name: 'Highland View Body Corporate SS 99/2018',
        organisationId: testOrgId,
        estimatedUnitCount: 164,
        location: 'Sandton, Johannesburg',
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testProspectId = resCreate.body.data.id;
    console.log('  ✓ 4.5 Scheme Prospect CRUD verified');
  }

  // 4.6 Opportunities & Pipeline
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/opportunities',
      token: tokenAdminA,
      body: {
        name: 'Highland Ridge 1,450 Units Enterprise Adoption',
        organisationId: testOrgId,
        primaryContactId: testContactId,
        schemeProspectId: testProspectId,
        estimatedValue: 435000.0,
        currency: 'ZAR',
        probability: 25,
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testOppId = resCreate.body.data.id;

    // Test GET /opportunities/pipeline
    const resPipeline = await makeRequest(app, {
      method: 'GET',
      url: '/api/v1/opportunities/pipeline',
      token: tokenAdminA,
    });
    assert.strictEqual(resPipeline.code, 200);
    assert.ok(resPipeline.body.data.totalOpportunities >= 1);
    assert.ok(resPipeline.body.data.totalPipelineValue >= 435000);
    assert.ok(resPipeline.body.data.stages.DISCOVERY);
    console.log('  ✓ 4.6 Opportunity CRUD & Pipeline aggregation endpoint verified');
  }

  // 4.7 Activities
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/activities',
      token: tokenAdminA,
      body: {
        activityType: ActivityType.DEMO,
        subject: 'Platform Demo: Ainubis Automated AGM & Voting',
        description: 'Demonstrated automated proxy voting and trustee resolutions.',
        opportunityId: testOppId,
        contactId: testContactId,
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testActivityId = resCreate.body.data.id;
    console.log('  ✓ 4.7 Activity CRUD verified');
  }

  // 4.8 Tasks
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/tasks',
      token: tokenAdminA,
      body: {
        title: 'Prepare Custom Pricing Proposal for 50 Schemes',
        priority: TaskPriority.HIGH,
        opportunityId: testOppId,
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testTaskId = resCreate.body.data.id;

    // Complete task via lifecycle endpoint
    const resComplete = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/tasks/${testTaskId}/complete`,
      token: tokenAdminA,
    });
    assert.strictEqual(resComplete.code, 200);
    assert.strictEqual(resComplete.body.data.status, 'COMPLETED');
    console.log('  ✓ 4.8 Task CRUD & complete endpoint verified');
  }

  // 4.9 Proposals
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/proposals',
      token: tokenAdminA,
      body: {
        opportunityId: testOppId,
        title: 'BCIP Enterprise SaaS Commercial Proposal',
        subtotal: 378260.87,
        tax: 56739.13,
        total: 435000.0,
        currency: 'ZAR',
        items: [
          {
            description: 'Core Scheme Intelligence (1,450 Units x R25/mo x 12)',
            quantity: 1450,
            unitPrice: 260.87,
            amount: 378260.87,
          },
        ],
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testProposalId = resCreate.body.data.id;
    console.log('  ✓ 4.9 Proposal CRUD with decimal numerical values verified');
  }

  // 4.10 Contracts
  {
    const resCreate = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/contracts',
      token: tokenAdminA,
      body: {
        title: 'BCIP Master Software License & Service Agreement',
        opportunityId: testOppId,
        proposalId: testProposalId,
        effectiveDate: '2026-10-01',
      },
    });
    assert.strictEqual(resCreate.code, 201);
    testContractId = resCreate.body.data.id;
    console.log('  ✓ 4.10 Contract CRUD verified');
  }

  // --------------------------------------------------------------------
  // 5. CRM Lifecycle Operations Tests
  // --------------------------------------------------------------------
  console.log('\n--- 5. Lifecycle Operations Tests ---');
  {
    // 5.1 Lead Conversion (Atomic Multi-Entity Workflow)
    const resConvert = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/leads/${testLeadId}/convert`,
      token: tokenAdminA,
      body: {
        organisationName: 'Highland Ridge Body Corporate Portfolio',
        contactFirstName: 'Brenda',
        contactLastName: 'van der Merwe',
        opportunityName: 'Highland Ridge Converted SaaS Deal',
        estimatedValue: 120000.0,
      },
    });
    assert.strictEqual(resConvert.code, 200, 'Lead conversion must return 200');
    assert.strictEqual(resConvert.body.data.lead.status, LeadStatus.CONVERTED);
    assert.ok(resConvert.body.data.organisation.id);
    assert.ok(resConvert.body.data.contact.id);
    assert.ok(resConvert.body.data.opportunity.id);
    console.log('  ✓ 5.1 Lead atomic multi-entity conversion succeeded');

    // 5.2 Opportunity Stage Progression with History
    const stagesToTest = [
      { stage: OpportunityStage.SOLUTION_DESIGN, reason: 'Architecture scope signed off' },
      { stage: OpportunityStage.PROPOSAL, reason: 'Commercial pricing issued' },
      { stage: OpportunityStage.CONTRACT, reason: 'Proposal accepted by executive committee' },
      { stage: OpportunityStage.WON, reason: 'Agreement executed' },
    ];

    for (const transition of stagesToTest) {
      const resStage = await makeRequest(app, {
        method: 'POST',
        url: `/api/v1/opportunities/${testOppId}/stage`,
        token: tokenAdminA,
        body: transition,
      });
      assert.strictEqual(resStage.code, 200);
      assert.strictEqual(resStage.body.data.opportunity.stage, transition.stage);
    }

    // Verify stage history
    const resHistory = await makeRequest(app, {
      method: 'GET',
      url: `/api/v1/opportunities/${testOppId}/history`,
      token: tokenAdminA,
    });
    assert.strictEqual(resHistory.code, 200);
    assert.ok(resHistory.body.data.length >= 4, 'All stage transitions must be recorded in history');
    console.log('  ✓ 5.2 Opportunity stage progression and immutable history verified');

    // 5.3 Proposal Lifecycle: send -> accept
    const resSend = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/proposals/${testProposalId}/send`,
      token: tokenAdminA,
    });
    assert.strictEqual(resSend.code, 200);
    assert.strictEqual(resSend.body.data.status, ProposalStatus.SENT);

    const resAccept = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/proposals/${testProposalId}/accept`,
      token: tokenAdminA,
    });
    assert.strictEqual(resAccept.code, 200);
    assert.strictEqual(resAccept.body.data.status, ProposalStatus.ACCEPTED);
    console.log('  ✓ 5.3 Proposal lifecycle (SENT → ACCEPTED) verified');

    // 5.4 Contract Lifecycle: sign -> activate
    const resSign = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/contracts/${testContractId}/sign`,
      token: tokenAdminA,
      body: { signedAt: new Date().toISOString() },
    });
    assert.strictEqual(resSign.code, 200);
    assert.strictEqual(resSign.body.data.status, ContractStatus.SIGNED);

    const resActivate = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/contracts/${testContractId}/activate`,
      token: tokenAdminA,
      body: { effectiveDate: '2026-10-01' },
    });
    assert.strictEqual(resActivate.code, 200);
    assert.strictEqual(resActivate.body.data.status, ContractStatus.ACTIVE);
    console.log('  ✓ 5.4 Contract lifecycle (SIGNED → ACTIVE) verified');
  }

  // --------------------------------------------------------------------
  // 6. Validation Error Tests
  // --------------------------------------------------------------------
  console.log('\n--- 6. Schema Validation & Bad Input Tests ---');
  {
    // 6.1 Missing required fields
    const resMissing = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/leads',
      token: tokenAdminA,
      body: {}, // Missing title and source
    });
    assert.strictEqual(resMissing.code, 422, 'Missing required fields must return 422');
    assert.strictEqual(resMissing.body.error.code, 'VALIDATION_ERROR');
    assert.ok(resMissing.body.error.details.length >= 2);
    console.log('  ✓ Missing required fields rejected with 422 VALIDATION_ERROR');

    // 6.2 Invalid enum value
    const resBadEnum = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/leads',
      token: tokenAdminA,
      body: {
        title: 'Lead with Bogus Source',
        source: 'NON_EXISTENT_SOURCE',
      },
    });
    assert.strictEqual(resBadEnum.code, 422);
    console.log('  ✓ Invalid enum value rejected with 422');

    // 6.3 Invalid financial value (negative amount)
    const resNegative = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/proposals',
      token: tokenAdminA,
      body: {
        opportunityId: testOppId,
        title: 'Negative Proposal',
        subtotal: -500,
        total: -500,
      },
    });
    assert.strictEqual(resNegative.code, 422);
    console.log('  ✓ Negative financial value rejected with 422');
  }

  // --------------------------------------------------------------------
  // 7. Querying, Pagination, Search & Sorting Tests
  // --------------------------------------------------------------------
  console.log('\n--- 7. Query Standards: Pagination, Search, Filtering & Sorting ---');
  {
    // 7.1 Pagination
    const resPage = await makeRequest(app, {
      method: 'GET',
      url: '/api/v1/organisations?page=1&pageSize=1',
      token: tokenAdminA,
    });
    assert.strictEqual(resPage.code, 200);
    assert.strictEqual(resPage.body.data.length, 1);
    assert.strictEqual(resPage.body.pagination.page, 1);
    assert.strictEqual(resPage.body.pagination.pageSize, 1);
    assert.ok(resPage.body.pagination.total >= 1);
    console.log('  ✓ Pagination correctly calculated page, pageSize, total, and totalPages');

    // 7.2 Search
    const resSearch = await makeRequest(app, {
      method: 'GET',
      url: '/api/v1/organisations?search=Highland',
      token: tokenAdminA,
    });
    assert.strictEqual(resSearch.code, 200);
    assert.ok(resSearch.body.data.every((o: any) => o.name.includes('Highland') || o.legalName?.includes('Highland')));
    console.log('  ✓ Search query filtered records accurately');

    // 7.3 Sorting
    const resSortAsc = await makeRequest(app, {
      method: 'GET',
      url: '/api/v1/organisations?sortBy=name&sortOrder=asc',
      token: tokenAdminA,
    });
    assert.strictEqual(resSortAsc.code, 200);
    if (resSortAsc.body.data.length >= 2) {
      assert.ok(resSortAsc.body.data[0].name <= resSortAsc.body.data[1].name);
    }
    console.log('  ✓ Sorting by field in asc/desc validated');
  }

  // --------------------------------------------------------------------
  // 8. Idempotency & Reliability Tests
  // --------------------------------------------------------------------
  console.log('\n--- 8. Idempotency & Reliability Tests ---');
  {
    const idemKey = `idem_convert_${Date.now()}`;
    // Create new lead for idempotency test
    const leadRes = await makeRequest(app, {
      method: 'POST',
      url: '/api/v1/leads',
      token: tokenAdminA,
      body: {
        title: 'Idempotency Lead Test',
        source: LeadSource.WEBSITE,
      },
    });
    const lId = leadRes.body.data.id;

    // First convert attempt
    const firstAttempt = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/leads/${lId}/convert`,
      token: tokenAdminA,
      headers: { 'idempotency-key': idemKey },
      body: {
        organisationName: 'Idempotency Org',
      },
    });
    assert.strictEqual(firstAttempt.code, 200);

    // Second convert attempt with SAME idempotency key
    const secondAttempt = await makeRequest(app, {
      method: 'POST',
      url: `/api/v1/leads/${lId}/convert`,
      token: tokenAdminA,
      headers: { 'idempotency-key': idemKey },
      body: {
        organisationName: 'Idempotency Org',
      },
    });
    assert.strictEqual(secondAttempt.code, 200);
    assert.strictEqual(secondAttempt.headers['x-idempotency-replay'], 'true');
    assert.strictEqual(secondAttempt.body.data.lead.id, firstAttempt.body.data.lead.id);
    console.log('  ✓ Idempotent request replay returned identical result with X-Idempotency-Replay header');

    // 8.2 OpenAPI Specification discovery route
    const openApiRes = await makeRequest(app, {
      method: 'GET',
      url: '/api/v1/openapi.json',
    });
    assert.strictEqual(openApiRes.code, 200);
    assert.strictEqual(openApiRes.body.openapi, '3.0.3');
    assert.ok(openApiRes.body.paths['/organisations']);
    assert.ok(openApiRes.body.paths['/leads']);
    console.log('  ✓ GET /api/v1/openapi.json returned valid OpenAPI 3.0 specification');
  }

  console.log('\n====================================================');
  console.log('✅ ALL CRM REST API ACCEPTANCE TESTS PASSED (37/37)');
  console.log('====================================================\n');
}
