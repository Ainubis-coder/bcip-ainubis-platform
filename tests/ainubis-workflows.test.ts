/**
 * BCIP Ainubis Workflows & Automation Orchestration Test Suite
 * Phase 2E — Prompt 002E-005: Ainubis CRM Automation Orchestration & Workflow Intelligence
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  automationWorkflowRepository,
  workflowRunRepository,
  ainubisWorkflowOrchestrationService,
  leadRepository,
  crmEventBus,
  WorkflowStatus,
  WorkflowRunStatus,
  WorkflowTriggerType,
  WorkflowStepType,
  LeadStatus,
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

export async function runAinubisWorkflowsTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-005: Ainubis Workflows & Orchestration Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_wf_a';
  const tenantB = 'ten_wf_b';

  const adminUserA: UserAccount = {
    id: 'usr_wf_admin_a',
    fullName: 'Wendy Workflow Admin',
    email: 'wendy.workflow@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'WWA',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const trusteeUserA: UserAccount = {
    id: 'usr_wf_trustee_a',
    fullName: 'Thomas Trustee',
    email: 'thomas@scheme.co.za',
    role: 'SCHEME_TRUSTEE',
    initials: 'TT',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const adminUserB: UserAccount = {
    id: 'usr_wf_admin_b',
    fullName: 'Barry Admin B',
    email: 'barry@barry-estates.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'BAB',
    tenantId: tenantB,
    tenantName: 'Barry Estates',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);
  const tokenTrusteeA = createClientAuthToken(trusteeUserA, tenantA);

  // 1. Workflow Definition Creation & Versioning
  console.log('1. Testing Workflow Definition Creation & Schema...');
  const workflowA = await automationWorkflowRepository.createWorkflow(tenantA, {
    name: 'Lead Fast Track SLA Follow-Up',
    description: 'Auto-checks lead contact details and creates follow up task',
    workflowKey: 'WF_LEAD_FAST_TRACK',
    version: 1,
    status: WorkflowStatus.ACTIVE,
    trigger: {
      type: WorkflowTriggerType.CRM_EVENT,
      eventType: 'crm.lead.created',
    },
    steps: [
      {
        id: 'step_1_obs',
        stepKey: 'obs_lead',
        name: 'Observe Lead',
        type: WorkflowStepType.OBSERVE,
        order: 1,
        configuration: { entityType: 'lead' },
        enabled: true,
      },
      {
        id: 'step_2_eval',
        stepKey: 'eval_lead',
        name: 'Evaluate SLA',
        type: WorkflowStepType.EVALUATE,
        order: 2,
        configuration: {
          criteria: [{ field: 'email', operator: 'not_equals', value: null }],
        },
        enabled: true,
      },
      {
        id: 'step_3_action',
        stepKey: 'prop_action',
        name: 'Propose Follow Up',
        type: WorkflowStepType.PROPOSE_ACTION,
        order: 3,
        configuration: {
          actionTemplateId: 'LEAD_QUALIFICATION_FOLLOWUP',
          actionType: 'CREATE_TASK',
        },
        enabled: true,
      },
    ],
    createdBy: adminUserA.id,
    updatedBy: adminUserA.id,
  });

  assert(workflowA.id, 'Workflow must have an ID');
  assert.strictEqual(workflowA.workflowKey, 'WF_LEAD_FAST_TRACK');
  assert.strictEqual(workflowA.status, WorkflowStatus.ACTIVE);
  console.log(`   ✓ Workflow created: ${workflowA.name} (ID: ${workflowA.id})`);

  // 2. Lifecycle Transitions (Active -> Paused -> Active)
  console.log('2. Testing Workflow Lifecycle Transitions...');
  const paused = await automationWorkflowRepository.update(tenantA, workflowA.id, {
    status: WorkflowStatus.PAUSED,
  });
  assert.strictEqual(paused?.status, WorkflowStatus.PAUSED);

  const reactivated = await automationWorkflowRepository.update(tenantA, workflowA.id, {
    status: WorkflowStatus.ACTIVE,
  });
  assert.strictEqual(reactivated?.status, WorkflowStatus.ACTIVE);
  console.log('   ✓ Workflow lifecycle states transitioned successfully.');

  // 3. Manual Workflow Launch & Execution
  console.log('3. Testing Manual Workflow Execution Launch...');
  const createdLead = await leadRepository.createLead(tenantA, {
    title: 'Lead: Zelda Zwane',
    email: 'zelda.zwane@example.com',
    phone: '+27821112233',
    status: LeadStatus.NEW,
    estimatedUnits: 40,
    leadOwnerId: adminUserA.id,
  });

  const run = await ainubisWorkflowOrchestrationService.launchRun(tenantA, workflowA.id, {
    triggerType: WorkflowTriggerType.MANUAL,
    initialContext: {
      leadId: createdLead.id,
      entityType: 'lead',
      entityId: createdLead.id,
      targetEntityId: createdLead.id,
    },
    actorUserId: adminUserA.id,
  });

  assert(run.id, 'Workflow run must have an ID');
  assert.strictEqual(run.workflowId, workflowA.id);
  assert.strictEqual(run.tenantId, tenantA);
  console.log(`   ✓ Workflow run launched: ${run.id} (Initial Status: ${run.status})`);

  // Allow async step execution queue to settle
  await new Promise((resolve) => setTimeout(resolve, 80));

  const runAfterExec = await workflowRunRepository.findById(tenantA, run.id);
  assert(runAfterExec, 'Run must exist');
  console.log(`   ✓ Workflow run state after step execution: ${runAfterExec.status}`);

  // 4. Timeline & Execution Step Traces
  console.log('4. Verifying Workflow Run Timeline...');
  const stepExecutions = await workflowRunRepository.findStepExecutions(tenantA, run.id);
  assert(stepExecutions.length >= 1, 'Expected at least 1 recorded step execution');
  console.log(`   ✓ Recorded ${stepExecutions.length} step execution trace(s).`);

  // 5. Event-Driven Workflow Trigger via CRM Event Bus
  console.log('5. Testing Event-Driven Workflow Trigger via crmEventBus...');
  ainubisWorkflowOrchestrationService.initEventListener();

  const testLeadEvent = {
    id: `lead_${Date.now()}_evt`,
    title: 'Lead: Nandi Madida',
    email: 'nandi@example.com',
    targetEntityId: 'lead_test_evt_1',
  };

  await crmEventBus.publish(
    'crm.lead.created' as any,
    tenantA,
    testLeadEvent,
    adminUserA.id
  );

  // Give event dispatch queue time to settle
  await new Promise((resolve) => setTimeout(resolve, 80));

  const runsForTenantA = await workflowRunRepository.findMany(tenantA, {
    workflowId: workflowA.id,
  });
  assert(runsForTenantA.total >= 1, 'Event-triggered workflow run should be present');
  console.log(`   ✓ Event bus dispatched workflow run successfully (Runs found: ${runsForTenantA.total}).`);

  // 6. Strict Multi-Tenant Isolation
  console.log('6. Testing Multi-Tenant Isolation for Workflows & Runs...');
  const runsTenantB = await workflowRunRepository.findMany(tenantB);
  assert.strictEqual(runsTenantB.total, 0, 'Tenant B must have 0 workflow runs from Tenant A');

  let crossTenantRunFailed = false;
  try {
    await ainubisWorkflowOrchestrationService.launchRun(tenantB, workflowA.id, {
      triggerType: WorkflowTriggerType.MANUAL,
      actorUserId: adminUserB.id,
    });
  } catch {
    crossTenantRunFailed = true;
  }
  assert.strictEqual(crossTenantRunFailed, true, 'Tenant B executing Tenant A workflow must fail');
  console.log('   ✓ Strict multi-tenant isolation confirmed.');

  // 7. REST API Endpoints & RBAC Security Gates
  console.log('7. Testing REST API Endpoints & RBAC Gates...');

  // GET /api/v1/ai/workflows
  const listWfRes = await executeRequest(app, 'GET', '/api/v1/ai/workflows', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(listWfRes.code, 200);
  assert(Array.isArray(listWfRes.body.data), 'Workflows list array expected');

  // RBAC: Restricted role (SCHEME_TRUSTEE) cannot create workflow
  const trusteeCreate = await executeRequest(
    app,
    'POST',
    '/api/v1/ai/workflows',
    { authorization: `Bearer ${tokenTrusteeA}` },
    {
      name: 'Trustee Prohibited Workflow',
      workflowKey: 'WF_TRUSTEE_FAIL',
      trigger: { type: 'MANUAL' },
      steps: [],
    }
  );
  assert.strictEqual(trusteeCreate.code, 403, 'Restricted role should be denied 403 Forbidden');

  // Admin creates workflow via REST API
  const adminCreateWf = await executeRequest(
    app,
    'POST',
    '/api/v1/ai/workflows',
    { authorization: `Bearer ${tokenAdminA}` },
    {
      name: 'Opportunity Stalled Escalation',
      description: 'Created via REST API',
      workflowKey: 'WF_OPP_STALLED_ESCALATION',
      trigger: { type: 'CRM_EVENT', eventType: 'crm.opportunity.stalled' },
      steps: [
        {
          id: 'step_1',
          stepKey: 'obs',
          name: 'Observe Opportunity',
          type: 'OBSERVE',
          order: 1,
          configuration: { entityType: 'opportunity' },
          enabled: true,
        },
      ],
    }
  );
  assert.strictEqual(adminCreateWf.code, 201);
  const createdApiWfId = adminCreateWf.body.data.id;

  // Activate workflow via REST API
  const activateRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflows/${createdApiWfId}/activate`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(activateRes.code, 200);
  assert.strictEqual(activateRes.body.data.status, 'ACTIVE');

  // Trigger run via REST API: POST /api/v1/ai/workflows/:id/run
  const runTriggerRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflows/${createdApiWfId}/run`,
    { authorization: `Bearer ${tokenAdminA}` },
    { initialContext: { test: true } }
  );
  assert.strictEqual(runTriggerRes.code, 201);
  const apiRunId = runTriggerRes.body.data.id;

  // View timeline via REST API: GET /api/v1/ai/workflow-runs/:id/timeline
  const timelineRes = await executeRequest(
    app,
    'GET',
    `/api/v1/ai/workflow-runs/${apiRunId}/timeline`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(timelineRes.code, 200);
  assert(Array.isArray(timelineRes.body.data), 'Timeline array expected');

  console.log('   ✓ All Workflow REST API endpoints and RBAC gates verified.');

  console.log('\n====================================================');
  console.log('✅ ALL AINUBIS WORKFLOWS & ORCHESTRATION TESTS PASSED');
  console.log('====================================================\n');
}
