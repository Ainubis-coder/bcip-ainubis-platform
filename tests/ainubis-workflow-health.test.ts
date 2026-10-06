/**
 * BCIP Ainubis Workflow Health & Failure Intelligence Test Suite
 * Phase 2E — Prompt 002E-006: Workflow Health Models & AI-driven Failure Observations
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  workflowRunRepository,
  automationWorkflowRepository,
  aiObservationRepository,
  WorkflowTriggerType,
  WorkflowRunStatus,
  WorkflowStatus,
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

export async function runAinubisWorkflowHealthTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-006: Ainubis Workflow Health & Failure Intelligence Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_hl_a';

  const adminUserA: UserAccount = {
    id: 'usr_hl_admin_a',
    fullName: 'Alex Health Admin',
    email: 'alex.health@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'AHA',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);

  // Clear past observations
  (aiObservationRepository as any).items.clear();

  // 1. Unknown Workflow Health State (0 runs)
  console.log('1. Testing UNKNOWN Health State (0 runs)...');
  const wfUnknown = await automationWorkflowRepository.createWorkflow(tenantA, {
    name: 'Contract Expiring Review',
    description: 'Fired 60 days before contract expiry',
    workflowKey: 'WF_CTR_EXP',
    version: 1,
    status: WorkflowStatus.ACTIVE,
    trigger: { type: WorkflowTriggerType.MANUAL },
    steps: [],
    createdBy: adminUserA.id,
    updatedBy: adminUserA.id,
  });

  const healthRes1 = await executeRequest(app, 'GET', '/api/v1/ai/workflows/health', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(healthRes1.code, 200);
  const unknownRecord = healthRes1.body.data.find((h: any) => h.workflowId === wfUnknown.id);
  assert(unknownRecord);
  assert.strictEqual(unknownRecord.status, 'UNKNOWN');
  console.log('   ✓ Verified UNKNOWN health status on brand new workflows.');

  // 2. Attention State (approval backlog)
  console.log('2. Testing ATTENTION Health State (approval backlog)...');
  const wfAttention = await automationWorkflowRepository.createWorkflow(tenantA, {
    name: 'Contract Approval Loop',
    description: 'Contract reviews',
    workflowKey: 'WF_CTR_APPR',
    version: 1,
    status: WorkflowStatus.ACTIVE,
    trigger: { type: WorkflowTriggerType.MANUAL },
    steps: [],
    createdBy: adminUserA.id,
    updatedBy: adminUserA.id,
  });

  // Seed 6 runs in WAITING_APPROVAL state
  for (let i = 0; i < 6; i++) {
    await workflowRunRepository.createRun(tenantA, {
      workflowId: wfAttention.id,
      workflowVersion: 1,
      triggerType: WorkflowTriggerType.MANUAL,
      correlationId: `corr_attn_${i}`,
      status: WorkflowRunStatus.WAITING_APPROVAL,
      context: {},
      currentStepIndex: 1,
      startedAt: new Date().toISOString(),
    });
  }

  const healthRes2 = await executeRequest(app, 'GET', '/api/v1/ai/workflows/health', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  const attentionRecord = healthRes2.body.data.find((h: any) => h.workflowId === wfAttention.id);
  assert(attentionRecord);
  assert.strictEqual(attentionRecord.status, 'ATTENTION');
  assert(attentionRecord.reason.toLowerCase().includes('backlog'), 'Reason should identify approval backlog');
  console.log('   ✓ Verified ATTENTION health status for approval queue congestions.');

  // 3. Degraded & Failed States (step / execution failures)
  console.log('3. Testing DEGRADED & FAILED Health States (failed runs)...');
  const wfFailed = await automationWorkflowRepository.createWorkflow(tenantA, {
    name: 'Lead Fast Qualifier',
    description: 'Lead qualification auto scanner',
    workflowKey: 'WF_LEAD_FAST_FAIL',
    version: 1,
    status: WorkflowStatus.ACTIVE,
    trigger: { type: WorkflowTriggerType.MANUAL },
    steps: [],
    createdBy: adminUserA.id,
    updatedBy: adminUserA.id,
  });

  // Seed 3 runs: 3 FAILED
  for (let i = 0; i < 3; i++) {
    await workflowRunRepository.createRun(tenantA, {
      workflowId: wfFailed.id,
      workflowVersion: 1,
      triggerType: WorkflowTriggerType.MANUAL,
      correlationId: `corr_fail_${i}`,
      status: WorkflowRunStatus.FAILED,
      context: {},
      currentStepIndex: 1,
      startedAt: new Date().toISOString(),
      failureReason: 'Verification failed: SLA deadline exceeded',
    });
  }

  const healthRes3 = await executeRequest(app, 'GET', '/api/v1/ai/workflows/health', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  const failedRecord = healthRes3.body.data.find((h: any) => h.workflowId === wfFailed.id);
  assert(failedRecord);
  assert.strictEqual(failedRecord.status, 'FAILED');
  console.log('   ✓ Verified FAILED health status for persistent execution failures.');

  // 4. Failure Intelligence AI Observations (analyzeFailureIntelligence)
  console.log('4. Testing Ainubis Failure Intelligence Observation Generation...');
  const triggerRes = await executeRequest(app, 'GET', '/api/v1/ai/workflows/failures', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(triggerRes.code, 200);
  assert(Array.isArray(triggerRes.body.data.observations), 'Observations array expected');
  assert(triggerRes.body.data.observations.length >= 2, 'Expected observations generated for failed and attention workflows');

  const createdObs = triggerRes.body.data.observations[0];
  assert.strictEqual(createdObs.status, 'GENERATED');
  assert.strictEqual(createdObs.confidenceScore, 95);
  assert.strictEqual(createdObs.targetEntityType, 'workflow');
  assert(createdObs.conditionKey.startsWith('workflow.failure.'), 'Condition key should follow standard template');
  console.log(`   ✓ Observations generated: "${createdObs.title}" (ID: ${createdObs.id}, Confidence: ${createdObs.confidenceScore}%)`);

  // Verify deduplication on subsequent run
  const triggerResDup = await executeRequest(app, 'GET', '/api/v1/ai/workflows/failures', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(triggerResDup.code, 200);
  assert.strictEqual(triggerResDup.body.data.observations.length, 0, 'Deduplication engine should prevent duplicate alerts');
  console.log('   ✓ Failure intelligence deduplication verified successfully.');

  console.log('\n====================================================');
  console.log('✅ ALL AINUBIS WORKFLOW HEALTH & FAILURE TESTS PASSED');
  console.log('====================================================\n');
}
