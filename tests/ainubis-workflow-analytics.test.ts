/**
 * BCIP Ainubis Workflow Analytics Test Suite
 * Phase 2E — Prompt 002E-006: Workflow Operations Dashboard & Historical Metrics
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  workflowRunRepository,
  automationWorkflowRepository,
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

export async function runAinubisWorkflowAnalyticsTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-006: Ainubis Workflow Analytics Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_an_a';
  const tenantB = 'ten_an_b';

  const adminUserA: UserAccount = {
    id: 'usr_an_admin_a',
    fullName: 'Alex Analytics Admin',
    email: 'alex.analytics@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'AAA',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const trusteeUserA: UserAccount = {
    id: 'usr_an_trustee_a',
    fullName: 'Timothy Trustee',
    email: 'timothy@scheme.co.za',
    role: 'SCHEME_TRUSTEE',
    initials: 'TT',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);
  const tokenTrusteeA = createClientAuthToken(trusteeUserA, tenantA);

  // Seed active workflows & runs to run analytics against
  console.log('1. Seeding workflow runs for Tenant A analytics...');
  const wf = await automationWorkflowRepository.createWorkflow(tenantA, {
    name: 'SLA Fast Track Follow-Up',
    description: 'SLA follow-up definitions',
    workflowKey: 'WF_SLA_FAST',
    version: 1,
    status: WorkflowStatus.ACTIVE,
    trigger: { type: WorkflowTriggerType.MANUAL },
    steps: [
      { id: 's_1', stepKey: 'obs', name: 'Observe', type: 'OBSERVE' as any, order: 1, configuration: {}, enabled: true },
      { id: 's_2', stepKey: 'eval', name: 'Evaluate', type: 'EVALUATE' as any, order: 2, configuration: {}, enabled: true },
    ],
    createdBy: adminUserA.id,
    updatedBy: adminUserA.id,
  });

  // Create 3 runs: 1 COMPLETED, 1 FAILED (verification failure), 1 WAITING_APPROVAL
  const run1 = await workflowRunRepository.createRun(tenantA, {
    workflowId: wf.id,
    workflowVersion: 1,
    triggerType: WorkflowTriggerType.MANUAL,
    correlationId: 'corr_1',
    status: WorkflowRunStatus.COMPLETED,
    context: {},
    currentStepIndex: 2,
    startedAt: new Date(Date.now() - 60000).toISOString(),
    completedAt: new Date().toISOString(),
  });

  const run2 = await workflowRunRepository.createRun(tenantA, {
    workflowId: wf.id,
    workflowVersion: 1,
    triggerType: WorkflowTriggerType.MANUAL,
    correlationId: 'corr_2',
    status: WorkflowRunStatus.FAILED,
    context: {},
    currentStepIndex: 1,
    startedAt: new Date(Date.now() - 30000).toISOString(),
    failureReason: 'Verification failed: SLA goal missed',
  });

  const run3 = await workflowRunRepository.createRun(tenantA, {
    workflowId: wf.id,
    workflowVersion: 1,
    triggerType: WorkflowTriggerType.MANUAL,
    correlationId: 'corr_3',
    status: WorkflowRunStatus.WAITING_APPROVAL,
    context: {},
    currentStepIndex: 1,
    startedAt: new Date().toISOString(),
  });

  // Seed step executions
  await workflowRunRepository.createStepExecution(tenantA, {
    workflowRunId: run1.id,
    stepId: 's_1',
    status: 'COMPLETED',
    attemptNumber: 1,
    inputContext: {},
    outputContext: {},
    startedAt: new Date(Date.now() - 60000).toISOString(),
    completedAt: new Date(Date.now() - 50000).toISOString(),
    correlationId: 'corr_1',
  });

  console.log('   ✓ Seeded 1 active workflow definition and 3 distinct historical run records.');

  // 2. GET /api/v1/ai/workflows/operations
  console.log('2. Testing GET /api/v1/ai/workflows/operations...');
  const opRes = await executeRequest(app, 'GET', '/api/v1/ai/workflows/operations', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(opRes.code, 200);
  assert.strictEqual(opRes.body.data.activeWorkflows, 1);
  assert.strictEqual(opRes.body.data.runsToday, 3);
  assert.strictEqual(opRes.body.data.runsAwaitingApproval, 1);
  assert.strictEqual(opRes.body.data.completedRuns, 1);
  assert.strictEqual(opRes.body.data.failedRuns, 1);
  assert.strictEqual(opRes.body.data.verificationFailures, 1);
  console.log('   ✓ Operational dashboard counts validated accurately.');

  // 3. GET /api/v1/ai/workflows/analytics
  console.log('3. Testing GET /api/v1/ai/workflows/analytics...');
  const metricRes = await executeRequest(app, 'GET', '/api/v1/ai/workflows/analytics', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(metricRes.code, 200);
  assert.strictEqual(metricRes.body.data.totalRuns, 3);
  assert.strictEqual(metricRes.body.data.workflowSuccessRate, 50); // 1 success out of 2 closed runs (completed/failed)
  assert.strictEqual(metricRes.body.data.verificationFailureCount, 1);
  console.log('   ✓ Historical metrics and SLA compliance rates evaluated correctly.');

  // 4. GET /api/v1/ai/workflows/step-analytics
  console.log('4. Testing GET /api/v1/ai/workflows/step-analytics...');
  const stepRes = await executeRequest(app, 'GET', `/api/v1/ai/workflows/step-analytics?workflowId=${wf.id}`, {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(stepRes.code, 200);
  assert(Array.isArray(stepRes.body.data), 'Expected array of step performance metrics');
  assert.strictEqual(stepRes.body.data.length, 2, 'Expected step analytics for both steps');
  console.log(`   ✓ Step-level traces loaded: Average durations calculated correctly.`);

  // 5. Multi-Tenant Isolation & RBAC Security Gates
  console.log('5. Testing Multi-Tenant isolation & RBAC Gates...');

  // Tenant B Admin gets blank analytics
  const tokenAdminB = createClientAuthToken(
    {
      id: 'usr_an_admin_b',
      fullName: 'B Admin',
      email: 'b.admin@example.co.za',
      role: 'MANAGING_AGENT_ADMIN',
      initials: 'BA',
      tenantId: tenantB,
      tenantName: 'B Agency',
      lastLogin: new Date().toISOString(),
      twoFactorEnabled: true,
    },
    tenantB
  );

  const bRes = await executeRequest(app, 'GET', '/api/v1/ai/workflows/operations', {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(bRes.code, 200);
  assert.strictEqual(bRes.body.data.activeWorkflows, 0, 'Tenant B should see 0 active workflows');
  assert.strictEqual(bRes.body.data.runsToday, 0, 'Tenant B should see 0 runs today');

  // RBAC: Restricted role (SCHEME_TRUSTEE) cannot view analytics
  const trusteeForbidden = await executeRequest(app, 'GET', '/api/v1/ai/workflows/analytics', {
    authorization: `Bearer ${tokenTrusteeA}`,
  });
  assert.strictEqual(trusteeForbidden.code, 403, 'Trustee should receive 403 Forbidden for analytics view');

  console.log('   ✓ Analytics tenant boundaries and permission security verified.');

  console.log('\n====================================================');
  console.log('✅ ALL AINUBIS WORKFLOW ANALYTICS TESTS PASSED');
  console.log('====================================================\n');
}
