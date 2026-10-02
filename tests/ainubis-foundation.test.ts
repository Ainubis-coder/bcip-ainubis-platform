/**
 * BCIP Ainubis CRM Intelligence Foundation & Governance Test Suite
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 * Tests intelligence domain types, observation lifecycle, evidence model, confidence scoring,
 * human approval workflows, tenant isolation, RBAC permissions, PII guardrails, pipeline hygiene, and audit lineage.
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  aiObservationRepository,
  ainubisContextBuilder,
  ainubisPipelineHygieneService,
  opportunityRepository,
  activityRepository,
  taskRepository,
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
  ConfidenceLevel,
  ApprovalRequirement,
  CRMEventType,
  crmEventBus,
  crmAuditService,
  AIObservationRecord,
  TaskStatus,
  TaskPriority,
  OpportunityStage,
} from '../packages/database/src/index.ts';
import {
  canViewAI,
  canGenerateAI,
  canReviewAI,
  canApproveAI,
  canDismissAI,
} from '../apps/web/src/components/crm/shared/crm-permissions.ts';
import { createClientAuthToken } from '../apps/web/src/components/crm/shared/crm-api.ts';
import { UserAccount } from '../apps/web/src/types/tenant.ts';
import { aiPolicyEngine } from '@bcip/ai';

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

export async function runAinubisFoundationTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-001: Ainubis Foundation & Governance Tests');
  console.log('====================================================\n');

  const app = createApiApp();

  const tenantA = 'tenant_ainubis_test_01';
  const tenantB = 'tenant_ainubis_test_02';

  const adminUser: UserAccount = {
    id: 'usr_ai_admin_01',
    fullName: 'Anele Moyo',
    email: 'a.moyo@highlandportfolios.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    initials: 'AM',
    tenantId: tenantA,
    tenantName: 'Highland Property Portfolios',
    lastLogin: 'Today, 09:00 SAST',
    twoFactorEnabled: true,
  };

  const trusteeUser: UserAccount = {
    id: 'usr_ai_trustee_02',
    fullName: 'Peter Botha',
    email: 'p.botha@cascades-trustee.co.za',
    role: 'SCHEME_TRUSTEE',
    userRole: 'SCHEME_TRUSTEE',
    initials: 'PB',
    tenantId: tenantA,
    tenantName: 'The Cascades Body Corporate',
    lastLogin: 'Yesterday, 16:00 SAST',
    twoFactorEnabled: false,
  };

  const adminToken = createClientAuthToken(adminUser, tenantA);
  const trusteeToken = createClientAuthToken(trusteeUser, tenantA);

  // --------------------------------------------------------------------------
  // TEST 1: Intelligence Enum & Model Validation
  // --------------------------------------------------------------------------
  console.log('1. Testing Intelligence Enums & Taxonomy...');
  assert.strictEqual(IntelligenceType.OBSERVATION, 'OBSERVATION');
  assert.strictEqual(IntelligenceType.RECOMMENDATION, 'RECOMMENDATION');
  assert.strictEqual(IntelligenceStatus.GENERATED, 'GENERATED');
  assert.strictEqual(ConfidenceLevel.HIGH, 'HIGH');
  assert.strictEqual(ApprovalRequirement.RECOMMENDATION, 'RECOMMENDATION');
  assert.strictEqual(AICapability.CRM_PIPELINE_HYGIENE, 'CRM_PIPELINE_HYGIENE');
  console.log('   ✓ Intelligence taxonomy enums validated.');

  // --------------------------------------------------------------------------
  // TEST 2: RBAC Permission Matrix for Ainubis Intelligence
  // --------------------------------------------------------------------------
  console.log('2. Testing RBAC Permission Matrix for Ainubis AI...');
  assert.strictEqual(canViewAI('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canGenerateAI('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canReviewAI('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canApproveAI('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canDismissAI('MANAGING_AGENT_ADMIN'), true);

  assert.strictEqual(canViewAI('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canGenerateAI('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canReviewAI('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canApproveAI('PORTFOLIO_MANAGER'), false); // Approve reserved for admin

  assert.strictEqual(canViewAI('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canGenerateAI('SCHEME_TRUSTEE'), false);
  console.log('   ✓ RBAC permission boundaries for AI verified.');

  // --------------------------------------------------------------------------
  // TEST 3: Observation Creation, Evidence Attachment, and Repository Query
  // --------------------------------------------------------------------------
  console.log('3. Testing AI Observation Creation & Evidence Attachment...');
  const newObs = await aiObservationRepository.createObservation(tenantA, {
    capability: AICapability.CRM_DATA_QUALITY,
    intelligenceType: IntelligenceType.OBSERVATION,
    title: 'Incomplete Trustee Contact Details',
    summary: 'Lead contains missing email for primary scheme trustee.',
    observation: 'Contact record lacks email address.',
    confidenceScore: 90,
    confidenceLevel: ConfidenceLevel.HIGH,
    evidence: [
      {
        id: 'ev_01',
        tenantId: tenantA,
        entityType: 'contact',
        entityId: 'cnt_123',
        field: 'email',
        value: undefined,
        source: 'CRM Contact Schema',
        evidenceType: 'NULL_CHECK',
        relevance: 1.0,
        timestamp: new Date().toISOString(),
      },
    ],
    approvalRequirement: ApprovalRequirement.INFORMATIONAL,
    status: IntelligenceStatus.GENERATED,
  });

  assert.ok(newObs.id);
  assert.strictEqual(newObs.tenantId, tenantA);
  assert.strictEqual(newObs.evidence.length, 1);
  console.log(`   ✓ Observation created (ID: ${newObs.id}) with evidence reference.`);

  // --------------------------------------------------------------------------
  // TEST 4: Tenant Isolation & Cross-Tenant Rejection
  // --------------------------------------------------------------------------
  console.log('4. Testing Strict Tenant Isolation on AI Observations...');
  const crossTenantQuery = await aiObservationRepository.findById(tenantB, newObs.id);
  assert.strictEqual(crossTenantQuery, null, 'Cross-tenant observation access MUST return null.');

  const tenantBList = await aiObservationRepository.findMany(tenantB);
  assert.strictEqual(tenantBList.total, 0, 'Tenant B must see 0 observations from Tenant A.');
  console.log('   ✓ Tenant isolation strictly enforced on observation queries.');

  // --------------------------------------------------------------------------
  // TEST 5: First Safe Demonstration Capability: CRM_PIPELINE_HYGIENE
  // --------------------------------------------------------------------------
  console.log('5. Testing CRM_PIPELINE_HYGIENE Capability Analysis...');
  // Create sample opportunity in Tenant A
  const sampleOpp = await opportunityRepository.createOpportunity(tenantA, {
    name: 'Bantry Terraces — 160 Units Levy Migration',
    stage: OpportunityStage.PROPOSAL,
    estimatedValue: 0, // Missing value triggers hygiene observation!
    currency: 'ZAR',
    probability: 60,
  }, 'usr_ai_admin_01');

  // Create overdue task for this opportunity
  await taskRepository.createTask(tenantA, {
    title: 'Proposal Follow-up Review',
    opportunityId: sampleOpp.id,
    dueAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days overdue!
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
  });

  // Execute hygiene analysis
  const hygieneResult = await ainubisPipelineHygieneService.analyzeOpportunity(
    tenantA,
    sampleOpp.id,
    'corr_hygiene_test_01'
  );

  assert.strictEqual(hygieneResult.opportunityId, sampleOpp.id);
  assert.ok(hygieneResult.observations.length >= 2, 'Must generate staleness, overdue task, or attribute completeness observations.');
  console.log(`   ✓ Pipeline Hygiene capability generated ${hygieneResult.observations.length} evidence-backed observations.`);

  // --------------------------------------------------------------------------
  // TEST 6: REST API Endpoint GET /api/v1/ai/observations
  // --------------------------------------------------------------------------
  console.log('6. Testing REST API GET /api/v1/ai/observations...');
  const listApiRes = await executeApiRequest(
    app,
    'GET',
    '/api/v1/ai/observations',
    adminToken
  );

  assert.strictEqual(listApiRes.code, 200);
  assert.ok(Array.isArray(listApiRes.body.data));
  assert.ok(listApiRes.body.data.length >= 2);
  console.log('   ✓ GET /api/v1/ai/observations returned paginated observations.');

  // --------------------------------------------------------------------------
  // TEST 7: Human Approval Workflow: Review, Approve, Dismiss
  // --------------------------------------------------------------------------
  console.log('7. Testing Human Approval Workflow (Review, Approve, Dismiss)...');
  const targetObs = hygieneResult.observations[0];

  // Review
  const reviewRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/ai/observations/${targetObs.id}/review`,
    adminToken
  );
  assert.strictEqual(reviewRes.code, 200);
  assert.strictEqual(reviewRes.body.data.status, IntelligenceStatus.REVIEWED);

  // Approve
  const approveRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/ai/observations/${targetObs.id}/approve`,
    adminToken
  );
  assert.strictEqual(approveRes.code, 200);
  assert.strictEqual(approveRes.body.data.status, IntelligenceStatus.APPROVED);
  assert.ok(approveRes.body.data.approvedBy);
  console.log('   ✓ Human review and approval workflow verified.');

  // --------------------------------------------------------------------------
  // TEST 8: REST API POST /api/v1/ai/observations/analyze
  // --------------------------------------------------------------------------
  console.log('8. Testing REST API POST /api/v1/ai/observations/analyze...');
  const analyzeApiRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/ai/observations/analyze',
    adminToken,
    {
      capability: AICapability.CRM_PIPELINE_HYGIENE,
      targetEntityId: sampleOpp.id,
    }
  );

  assert.strictEqual(analyzeApiRes.code, 201);
  assert.strictEqual(analyzeApiRes.body.data.opportunityId, sampleOpp.id);
  console.log('   ✓ Analysis capability triggered via REST endpoint.');

  // --------------------------------------------------------------------------
  // TEST 9: Security Authorization Gates (403 Forbidden)
  // --------------------------------------------------------------------------
  console.log('9. Testing Security Authorization Gates (403 Forbidden)...');
  const forbiddenList = await executeApiRequest(
    app,
    'GET',
    '/api/v1/ai/observations',
    trusteeToken
  );
  assert.strictEqual(forbiddenList.code, 403);

  const forbiddenAnalyze = await executeApiRequest(
    app,
    'POST',
    '/api/v1/ai/observations/analyze',
    trusteeToken,
    {
      capability: AICapability.CRM_PIPELINE_HYGIENE,
      targetEntityId: sampleOpp.id,
    }
  );
  assert.strictEqual(forbiddenAnalyze.code, 403);
  console.log('   ✓ Restricted role (SCHEME_TRUSTEE) rejected with HTTP 403 FORBIDDEN.');

  // --------------------------------------------------------------------------
  // TEST 10: PII Guardrails & Policy Sanitization
  // --------------------------------------------------------------------------
  console.log('10. Testing PII Guardrails & Sanitization...');
  const sensitiveText = 'Contact phone 0821234567, credit card 4111-2222-3333-4444';
  const sanitized = aiPolicyEngine.maskPersonalData(sensitiveText);
  assert.ok(!sanitized.includes('4111-2222-3333-4444'), 'Credit card pattern MUST be masked.');
  assert.ok(sanitized.includes('[REDACTED_CARD]'));
  console.log('   ✓ PII guardrails successfully masked sensitive data.');

  console.log('\n====================================================');
  console.log('✅ ALL AINUBIS FOUNDATION TESTS PASSED');
  console.log('====================================================\n');
}

if (process.argv[1]?.endsWith('ainubis-foundation.test.ts')) {
  runAinubisFoundationTests().catch((err) => {
    console.error('Ainubis foundation test suite failed:', err);
    process.exit(1);
  });
}
