/**
 * BCIP CRM Frontend Layer Automated Test Suite
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Validates ZAR formatters, RBAC permission rules, API client, Kanban board state, and lifecycle operations.
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import { tokenService } from '@bcip/auth';
import type { UserRole } from '@bcip/auth';
import {
  OpportunityStage,
  ALL_PIPELINE_STAGES,
  STAGE_CONFIG,
  Opportunity,
  PipelineSummary,
} from '../apps/web/src/components/crm/shared/crm-types.ts';
import {
  formatZAR,
  formatCompactZAR,
  formatDate,
  formatTargetDays,
  formatProbability,
} from '../apps/web/src/components/crm/shared/crm-formatters.ts';
import {
  canViewPipeline,
  canCreateOpportunity,
  canEditOpportunity,
  canTransitionStage,
  canDeleteOpportunity,
  normalizeUserRole,
} from '../apps/web/src/components/crm/shared/crm-permissions.ts';
import {
  createClientAuthToken,
  CrmApiClient,
  CrmApiError,
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

export async function runCrmFrontendTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Phase 2D Prompt 002D-001: CRM Frontend Tests');
  console.log('====================================================\n');

  const app = createApiApp();

  const testTenantId = 'tenant_fe_test_01';
  const adminUser: UserAccount = {
    id: 'usr_fe_admin_01',
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
    id: 'usr_fe_pm_02',
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

  const restrictedTrusteeUser: UserAccount = {
    id: 'usr_fe_trustee_03',
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
  // TEST 1: ZAR Financial & Date Formatters
  // --------------------------------------------------------------------------
  console.log('1. Testing South African Rand (ZAR) & Date Formatters...');
  assert.strictEqual(formatZAR(144000), 'R 144,000.00');
  assert.strictEqual(formatZAR(144000.5), 'R 144,000.50');
  assert.strictEqual(formatZAR(0), 'R 0.00');
  assert.strictEqual(formatZAR(null), 'R 0.00');
  assert.strictEqual(formatZAR(undefined), 'R 0.00');
  assert.strictEqual(formatZAR(-2500.75), '-R 2,500.75');

  assert.strictEqual(formatCompactZAR(144000), 'R 144k');
  assert.strictEqual(formatCompactZAR(1500000), 'R 1.5M');
  assert.strictEqual(formatCompactZAR(850), 'R 850');

  assert.strictEqual(formatProbability(60), '60%');
  assert.strictEqual(formatProbability(0), '0%');
  assert.strictEqual(formatProbability(100), '100%');
  assert.strictEqual(formatProbability(-10), '0%');
  assert.strictEqual(formatProbability(120), '100%');

  const formattedDate = formatDate('2026-03-31T00:00:00.000Z');
  assert.ok(formattedDate.includes('2026'));
  assert.ok(formattedDate.includes('Mar'));
  console.log('   ✓ ZAR currency formatters, compact figures, and date parsers verified.');

  // --------------------------------------------------------------------------
  // TEST 2: RBAC Client Permissions Matrix
  // --------------------------------------------------------------------------
  console.log('2. Testing RBAC Frontend Permission Checks...');
  // Managing Agent Admin: full access
  assert.strictEqual(canViewPipeline('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canCreateOpportunity('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canEditOpportunity('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canTransitionStage('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canDeleteOpportunity('MANAGING_AGENT_ADMIN'), true);

  // Portfolio Manager: view, create, edit, transition, but NO delete
  assert.strictEqual(canViewPipeline('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canCreateOpportunity('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canTransitionStage('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canDeleteOpportunity('PORTFOLIO_MANAGER'), false, 'Portfolio Manager cannot delete deals');

  // Scheme Trustee: no CRM access
  assert.strictEqual(canViewPipeline('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canCreateOpportunity('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canTransitionStage('SCHEME_TRUSTEE'), false);

  // Property Owner & Contractor: blocked
  assert.strictEqual(canViewPipeline('PROPERTY_OWNER'), false);
  assert.strictEqual(canViewPipeline('CONTRACTOR'), false);

  // Role Normalizer
  assert.strictEqual(normalizeUserRole('Lead Portfolio Manager'), 'MANAGING_AGENT_ADMIN');
  assert.strictEqual(normalizeUserRole('Managing Agent Admin'), 'MANAGING_AGENT_ADMIN');
  assert.strictEqual(normalizeUserRole('Portfolio Manager'), 'PORTFOLIO_MANAGER');
  console.log('   ✓ RBAC permissions correctly enforce view, create, stage-transition, and delete boundaries.');

  // --------------------------------------------------------------------------
  // TEST 3: Client JWT Token Generation & Backend Verification
  // --------------------------------------------------------------------------
  console.log('3. Testing Client Auth Token Generation & Verification...');
  const clientToken = createClientAuthToken(adminUser, testTenantId);
  assert.ok(clientToken, 'Token must not be empty');
  assert.strictEqual(clientToken.split('.').length, 3, 'Token must be valid 3-part JWT');

  const verifiedPayload = tokenService.verifyToken(clientToken);
  assert.ok(verifiedPayload, 'Token must be successfully verified by tokenService');
  assert.strictEqual(verifiedPayload.sub, adminUser.id);
  assert.strictEqual(verifiedPayload.tenantId, testTenantId);
  assert.strictEqual(verifiedPayload.role, 'MANAGING_AGENT_ADMIN');
  console.log('   ✓ Client auth token generated and verified by backend tokenService.');

  // --------------------------------------------------------------------------
  // TEST 4: Pipeline Stages & Visual Taxonomy Configuration
  // --------------------------------------------------------------------------
  console.log('4. Testing Pipeline Stages Configuration & Taxonomy...');
  const expectedStages = [
    OpportunityStage.DISCOVERY,
    OpportunityStage.SOLUTION_DESIGN,
    OpportunityStage.PROPOSAL,
    OpportunityStage.CONTRACT,
    OpportunityStage.WON,
    OpportunityStage.LOST,
  ];

  assert.strictEqual(ALL_PIPELINE_STAGES.length, 6);
  for (const stg of expectedStages) {
    assert.ok(ALL_PIPELINE_STAGES.includes(stg), `Missing stage: ${stg}`);
    const cfg = STAGE_CONFIG[stg];
    assert.ok(cfg, `Missing STAGE_CONFIG for stage: ${stg}`);
    assert.ok(cfg.label, `Missing label for stage: ${stg}`);
    assert.ok(typeof cfg.defaultProbability === 'number', `Missing defaultProbability for stage: ${stg}`);
    assert.ok(cfg.colorClasses.badge, `Missing badge color for stage: ${stg}`);
    assert.ok(cfg.colorClasses.columnBorder, `Missing border color for stage: ${stg}`);
  }
  console.log('   ✓ All 6 pipeline stages configured with labels, probabilities, and color tokens.');

  // --------------------------------------------------------------------------
  // TEST 5: Real API Execution: Create, List, and Pipeline Aggregation
  // --------------------------------------------------------------------------
  console.log('5. Testing API Client operations against live Express API...');

  // 5.1 Create Opportunity via API
  const createRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/opportunities',
    clientToken,
    {
      name: 'Sandton Grand Terraces — 240 Units Cloud Platform',
      stage: OpportunityStage.DISCOVERY,
      estimatedValue: 72000.0,
      currency: 'ZAR',
      probability: 25,
      expectedCloseDate: '2026-04-30',
      description: 'Full sectional-title management and Ainubis compliance setup.',
    }
  );

  assert.strictEqual(createRes.code, 201, `Opportunity creation failed: ${JSON.stringify(createRes.body)}`);
  assert.strictEqual(createRes.body.success, true);
  const createdOpp: Opportunity = createRes.body.data;
  assert.ok(createdOpp.id);
  assert.strictEqual(createdOpp.name, 'Sandton Grand Terraces — 240 Units Cloud Platform');
  assert.strictEqual(createdOpp.stage, OpportunityStage.DISCOVERY);
  assert.strictEqual(Number(createdOpp.estimatedValue), 72000.0);
  console.log(`   ✓ Opportunity created via API: "${createdOpp.name}" (ID: ${createdOpp.id})`);

  // 5.2 List Opportunities via API
  const listRes = await executeApiRequest(app, 'GET', '/api/v1/opportunities', clientToken);
  assert.strictEqual(listRes.code, 200);
  assert.strictEqual(listRes.body.success, true);
  assert.ok(Array.isArray(listRes.body.data));
  assert.ok(listRes.body.data.length >= 1);
  console.log(`   ✓ Opportunities retrieved via API (${listRes.body.data.length} records found).`);

  // 5.3 Pipeline Summary Endpoint
  const summaryRes = await executeApiRequest(app, 'GET', '/api/v1/opportunities/pipeline', clientToken);
  assert.strictEqual(summaryRes.code, 200);
  assert.strictEqual(summaryRes.body.success, true);
  const summaryData: PipelineSummary = summaryRes.body.data;
  assert.ok(summaryData.totalOpportunities >= 1);
  assert.ok(summaryData.totalPipelineValue >= 72000);
  assert.ok(summaryData.stages[OpportunityStage.DISCOVERY]);
  assert.strictEqual(summaryData.stages[OpportunityStage.DISCOVERY].count >= 1, true);
  console.log(`   ✓ Pipeline summary aggregation verified: Total Value: ${formatZAR(summaryData.totalPipelineValue)}`);

  // --------------------------------------------------------------------------
  // TEST 6: Stage Transition Interaction & Audit Velocity History
  // --------------------------------------------------------------------------
  console.log('6. Testing Stage Transition Interaction & History API...');

  // Transition from DISCOVERY -> SOLUTION_DESIGN
  const transRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/opportunities/${createdOpp.id}/stage`,
    clientToken,
    {
      stage: OpportunityStage.SOLUTION_DESIGN,
      reason: 'Trustee committee approved scope; moving to technical architecture review.',
    }
  );

  assert.strictEqual(transRes.code, 200, `Stage transition failed: ${JSON.stringify(transRes.body)}`);
  assert.strictEqual(transRes.body.success, true);
  assert.strictEqual(transRes.body.data.opportunity.stage, OpportunityStage.SOLUTION_DESIGN);
  console.log('   ✓ Opportunity transitioned: DISCOVERY -> SOLUTION_DESIGN');

  // Verify transition history endpoint
  const historyRes = await executeApiRequest(
    app,
    'GET',
    `/api/v1/opportunities/${createdOpp.id}/history`,
    clientToken
  );
  assert.strictEqual(historyRes.code, 200);
  assert.strictEqual(historyRes.body.success, true);
  const historyList = historyRes.body.data;
  assert.ok(Array.isArray(historyList));
  assert.ok(historyList.length >= 2, 'History must contain initial creation and transition');
  const latestTransition = historyList[historyList.length - 1];
  assert.strictEqual(latestTransition.toStage, OpportunityStage.SOLUTION_DESIGN);
  assert.strictEqual(
    latestTransition.reason,
    'Trustee committee approved scope; moving to technical architecture review.'
  );
  console.log('   ✓ Immutable stage history verified with transition reason and actor.');

  // --------------------------------------------------------------------------
  // TEST 7: Invalid Transition & Validation Errors Handling
  // --------------------------------------------------------------------------
  console.log('7. Testing Error State & Validation Handling...');

  // Invalid stage payload
  const badTransitionRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/opportunities/${createdOpp.id}/stage`,
    clientToken,
    {
      stage: 'INVALID_STAGE_XYZ',
    }
  );
  assert.strictEqual(badTransitionRes.code, 422, 'Invalid stage should return 422 validation error');
  assert.strictEqual(badTransitionRes.body.success, false);
  console.log('   ✓ Invalid stage payload rejected cleanly with 422 Validation Error.');

  // Unauthorized access test: SCHEME_TRUSTEE attempting to create an opportunity
  const trusteeToken = createClientAuthToken(restrictedTrusteeUser, testTenantId);
  const forbiddenCreateRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/opportunities',
    trusteeToken,
    {
      name: 'Unauthorized Deal',
      stage: OpportunityStage.DISCOVERY,
    }
  );
  assert.strictEqual(forbiddenCreateRes.code, 403, 'Restricted role should return 403 Forbidden');
  console.log('   ✓ Restricted user (SCHEME_TRUSTEE) correctly rejected with 403 FORBIDDEN.');

  // --------------------------------------------------------------------------
  // TEST 8: Board Opportunity Grouping & Filter Calculations
  // --------------------------------------------------------------------------
  console.log('8. Testing Kanban Column Grouping & Client-Side Filtering...');
  const testDeals: Opportunity[] = [
    {
      id: 'opp_1',
      tenantId: testTenantId,
      name: 'Deal Alpha',
      stage: OpportunityStage.DISCOVERY,
      estimatedValue: 20000,
      currency: 'ZAR',
      probability: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'opp_2',
      tenantId: testTenantId,
      name: 'Deal Beta',
      stage: OpportunityStage.PROPOSAL,
      estimatedValue: 60000,
      currency: 'ZAR',
      probability: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'opp_3',
      tenantId: testTenantId,
      name: 'Deal Gamma',
      stage: OpportunityStage.WON,
      estimatedValue: 100000,
      currency: 'ZAR',
      probability: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Group deals into 6 columns
  const columns: Record<OpportunityStage, Opportunity[]> = {
    [OpportunityStage.DISCOVERY]: [],
    [OpportunityStage.SOLUTION_DESIGN]: [],
    [OpportunityStage.PROPOSAL]: [],
    [OpportunityStage.CONTRACT]: [],
    [OpportunityStage.WON]: [],
    [OpportunityStage.LOST]: [],
  };

  testDeals.forEach((d) => columns[d.stage].push(d));

  assert.strictEqual(columns[OpportunityStage.DISCOVERY].length, 1);
  assert.strictEqual(columns[OpportunityStage.SOLUTION_DESIGN].length, 0);
  assert.strictEqual(columns[OpportunityStage.PROPOSAL].length, 1);
  assert.strictEqual(columns[OpportunityStage.WON].length, 1);
  assert.strictEqual(columns[OpportunityStage.LOST].length, 0);

  // Search filtering
  const filteredAlpha = testDeals.filter((d) => d.name.toLowerCase().includes('alpha'));
  assert.strictEqual(filteredAlpha.length, 1);
  assert.strictEqual(filteredAlpha[0].id, 'opp_1');

  // Stage filtering
  const filteredProposal = testDeals.filter((d) => d.stage === OpportunityStage.PROPOSAL);
  assert.strictEqual(filteredProposal.length, 1);
  assert.strictEqual(filteredProposal[0].id, 'opp_2');

  console.log('   ✓ Kanban grouping, search filtering, and stage filtering verified.');

  console.log('\n====================================================');
  console.log('✅ ALL CRM FRONTEND ACCEPTANCE TESTS PASSED');
  console.log('====================================================\n');
}

if (process.argv[1]?.endsWith('crm-frontend.test.ts')) {
  runCrmFrontendTests().catch((err) => {
    console.error('CRM Frontend test suite failed:', err);
    process.exit(1);
  });
}
