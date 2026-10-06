/**
 * BCIP Ainubis Intelligence Actions & Human-Approved CRM Automation Tests
 * Phase 2E — Prompt 002E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  ainubisActionTemplateRegistry,
  ainubisActionExecutionService,
  aiActionRepository,
  aiObservationRepository,
  opportunityRepository,
  taskRepository,
  AIActionType,
  AIActionStatus,
  AIActionApprovalRequirement,
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
  OpportunityStage,
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

export async function runAinubisActionsTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-004: Ainubis Intelligence Actions Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_act_a';
  const tenantB = 'ten_act_b';

  const adminUserA: UserAccount = {
    id: 'usr_act_admin_a',
    fullName: 'Alex Actions Admin',
    email: 'alex.actions@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'AAA',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const trusteeUserA: UserAccount = {
    id: 'usr_act_trustee_a',
    fullName: 'Trevor Trustee',
    email: 'trevor@scheme.co.za',
    role: 'SCHEME_TRUSTEE',
    initials: 'TT',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const adminUserB: UserAccount = {
    id: 'usr_act_admin_b',
    fullName: 'Belinda Admin B',
    email: 'belinda@belinda-estates.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'BAB',
    tenantId: tenantB,
    tenantName: 'Belinda Estates',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);
  const tokenTrusteeA = createClientAuthToken(trusteeUserA, tenantA);
  const tokenAdminB = createClientAuthToken(adminUserB, tenantB);

  // 1. Template Registry Verification
  console.log('1. Testing Ainubis Action Template Registry...');
  const templates = ainubisActionTemplateRegistry.listTemplates();
  assert(templates.length >= 4, 'Expected at least 4 registered action templates');
  const staleFollowup = ainubisActionTemplateRegistry.getTemplate('PIPELINE_STALE_FOLLOWUP');
  assert(staleFollowup !== undefined, 'PIPELINE_STALE_FOLLOWUP template must be registered');
  assert.strictEqual(staleFollowup.riskLevel, 'LOW');
  assert.strictEqual(staleFollowup.approvalRequirement, AIActionApprovalRequirement.HUMAN_APPROVAL);
  console.log(`   ✓ Registry verified with ${templates.length} templates.`);

  // 2. Direct AI Action Proposal with Safety Boundaries
  console.log('2. Testing Direct Action Proposal & Safety Boundaries...');
  const oppA = await opportunityRepository.createOpportunity(
    tenantA,
    {
      name: 'Atlantic Terraces Renewal',
      stage: OpportunityStage.PROPOSAL,
      estimatedValue: 250000,
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
    adminUserA.id
  );

  const proposedAction = await ainubisActionExecutionService.proposeAction(tenantA, {
    observationId: 'obs_manual_init',
    capabilityId: AICapability.CRM_PIPELINE_HYGIENE,
    actionType: AIActionType.CREATE_TASK,
    targetEntityType: 'opportunity',
    targetEntityId: oppA.id,
    title: 'Follow up on Stalled Proposal',
    description: 'Automated follow-up task recommendation by Ainubis',
    rationale: 'Proposal sent 14 days ago without trustee response.',
    confidenceLevel: 'HIGH',
    riskLevel: 'LOW',
    approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
    proposedChanges: {
      title: 'Follow up with Trustees on Atlantic Terraces Renewal',
      priority: 'HIGH',
      dueInDays: 3,
    },
    currentValues: {},
    proposedValues: { title: 'Follow up with Trustees on Atlantic Terraces Renewal' },
    createdBy: adminUserA.id,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  assert(proposedAction.id, 'Action must have an ID');
  assert.strictEqual(proposedAction.status, AIActionStatus.PROPOSED);
  assert.strictEqual(proposedAction.tenantId, tenantA);
  console.log(`   ✓ Action proposed: ${proposedAction.title} (ID: ${proposedAction.id})`);

  // 3. Proposing Action from an Existing AI Observation
  console.log('3. Testing Action Proposal directly from AI Observation...');
  const obs = await aiObservationRepository.createObservation(tenantA, {
    capability: AICapability.CRM_PIPELINE_HYGIENE,
    intelligenceType: IntelligenceType.RECOMMENDATION,
    status: IntelligenceStatus.APPROVED,
    title: 'Stalled Opportunity: Atlantic Terraces Renewal',
    summary: 'No contact has been logged for over 14 days.',
    observation: 'Opportunity in PROPOSAL stage has no logged activities for 14 days.',
    confidenceScore: 88,
    confidenceLevel: 'HIGH',
    evidence: [],
    targetEntityType: 'opportunity',
    targetEntityId: oppA.id,
    conditionKey: 'stalled_opportunity_14d',
    approvalRequirement: 'RECOMMENDATION' as any,
  });

  const actionFromObs = await ainubisActionExecutionService.proposeActionFromObservation(
    tenantA,
    obs.id,
    adminUserA.id
  );
  assert(actionFromObs.id, 'Action from observation must be created');
  assert.strictEqual(actionFromObs.observationId, obs.id);
  assert.strictEqual(actionFromObs.targetEntityId, oppA.id);
  console.log(`   ✓ Action generated from observation ${obs.id} -> Action ${actionFromObs.id}`);

  // 4. Traceable Evidence Attachment & Inspection
  console.log('4. Testing Traceable Evidence Attachment & Retrieval...');
  await aiActionRepository.createEvidence(tenantA, {
    actionId: proposedAction.id,
    entityType: 'opportunity',
    entityId: oppA.id,
    description: 'Stage stuck in PROPOSAL for 14 days',
  });

  const evidence = await aiActionRepository.findEvidenceByActionId(tenantA, proposedAction.id);
  assert(evidence.length >= 1, 'Should find at least 1 attached evidence item');
  assert.strictEqual(evidence[0].entityId, oppA.id);
  console.log(`   ✓ Evidence attached and verified: ${evidence[0].description}`);

  // 5. Review, Rejection, and Cancellation Lifecycle
  console.log('5. Testing Review, Rejection, and Cancellation Lifecycle...');
  const actionToReject = await ainubisActionExecutionService.proposeAction(tenantA, {
    observationId: 'obs_reject_test',
    capabilityId: AICapability.CRM_PIPELINE_HYGIENE,
    actionType: AIActionType.CREATE_ACTIVITY,
    targetEntityType: 'opportunity',
    targetEntityId: oppA.id,
    title: 'Schedule In-Person Meeting',
    description: 'Meet trustees in person',
    rationale: 'High value client',
    confidenceLevel: 'MEDIUM',
    riskLevel: 'MEDIUM',
    approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
    proposedChanges: { description: 'Meet with trustees', activityType: 'MEETING' },
    currentValues: {},
    proposedValues: { description: 'Meet with trustees' },
    createdBy: adminUserA.id,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });

  const rejected = await ainubisActionExecutionService.rejectAction(
    tenantA,
    actionToReject.id,
    adminUserA.id,
    'Client requested email communications only'
  );
  assert.strictEqual(rejected.status, AIActionStatus.REJECTED);

  const actionToCancel = await ainubisActionExecutionService.proposeAction(tenantA, {
    observationId: 'obs_cancel_test',
    capabilityId: AICapability.CRM_PIPELINE_HYGIENE,
    actionType: AIActionType.CREATE_TASK,
    targetEntityType: 'opportunity',
    targetEntityId: oppA.id,
    title: 'Task to be Cancelled',
    description: 'Temporary task',
    rationale: 'Testing cancellation',
    confidenceLevel: 'LOW',
    riskLevel: 'LOW',
    approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
    proposedChanges: { title: 'Test cancel' },
    currentValues: {},
    proposedValues: { title: 'Test cancel' },
    createdBy: adminUserA.id,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
  const cancelled = await ainubisActionExecutionService.cancelAction(tenantA, actionToCancel.id, adminUserA.id);
  assert.strictEqual(cancelled.status, AIActionStatus.CANCELLED);
  console.log('   ✓ Rejection and Cancellation flows verified.');

  // 6. Human Approval Gate & Execution
  console.log('6. Testing Human Approval Gate & Execution...');
  let threwUnapproved = false;
  try {
    await ainubisActionExecutionService.executeAction(tenantA, proposedAction.id, adminUserA.id);
  } catch {
    threwUnapproved = true;
  }
  assert.strictEqual(threwUnapproved, true, 'Executing unapproved action must be blocked');

  // Approve action
  const approvedAction = await ainubisActionExecutionService.approveAction(
    tenantA,
    proposedAction.id,
    adminUserA.id,
    'Follow up task is appropriate'
  );
  assert.strictEqual(approvedAction.status, AIActionStatus.APPROVED);
  assert.strictEqual(approvedAction.approvedBy, adminUserA.id);

  // Execute approved action
  const executedResult = await ainubisActionExecutionService.executeAction(
    tenantA,
    proposedAction.id,
    adminUserA.id
  );
  assert(
    executedResult.status === AIActionStatus.EXECUTED || executedResult.status === AIActionStatus.VERIFIED,
    `Action status must be EXECUTED or VERIFIED, got: ${executedResult.status}`
  );
  assert(executedResult.executedAt, 'Execution timestamp must be set');

  // Verify task was created in taskRepository
  const createdTasks = await taskRepository.findByEntity(tenantA, { opportunityId: oppA.id });
  assert(createdTasks.length >= 1, 'Follow-up task must have been created in database');
  console.log(`   ✓ Execution succeeded: Task created (total tasks for opp: ${createdTasks.length})`);

  // 7. Post-Execution Verification Engine
  console.log('7. Testing Post-Execution Verification Engine...');
  const verifications = await aiActionRepository.findVerificationsByActionId(tenantA, proposedAction.id);
  assert(verifications.length >= 1, 'Verification record must be present');
  console.log(`   ✓ Verification status: ${verifications[0].status}`);

  // 8. Strict Multi-Tenant Isolation
  console.log('8. Testing Multi-Tenant Isolation on AI Actions...');
  const tenantBActions = await aiActionRepository.findMany(tenantB);
  assert.strictEqual(tenantBActions.total, 0, 'Tenant B should not see Tenant A actions');

  let tenantCrossLeak = false;
  try {
    await ainubisActionExecutionService.approveAction(tenantB, proposedAction.id, adminUserB.id);
  } catch {
    tenantCrossLeak = true;
  }
  assert.strictEqual(tenantCrossLeak, true, 'Tenant B approving Tenant A action must fail');
  console.log('   ✓ Strict multi-tenant isolation confirmed.');

  // 9. REST API Endpoints & RBAC Security Gates
  console.log('9. Testing REST API Endpoints & RBAC Enforcement...');

  // GET /api/v1/ai/actions
  const listRes = await executeRequest(app, 'GET', '/api/v1/ai/actions', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(listRes.code, 200);
  assert(Array.isArray(listRes.body.data), 'Actions array must be returned');

  // Propose via REST API
  const proposeRes = await executeRequest(
    app,
    'POST',
    '/api/v1/ai/actions',
    { authorization: `Bearer ${tokenAdminA}` },
    {
      actionType: AIActionType.CREATE_TASK,
      targetEntityType: 'opportunity',
      targetEntityId: oppA.id,
      title: 'REST API Follow Up',
      description: 'Created via REST API',
      rationale: 'API test',
      riskLevel: 'LOW',
      proposedChanges: { title: 'REST Follow Up Task', priority: 'MEDIUM' },
      currentValues: {},
      proposedValues: { title: 'REST Follow Up Task' },
      confidenceLevel: 'HIGH',
      capabilityId: 'CRM_PIPELINE_HYGIENE',
      observationId: 'obs_rest_test',
    }
  );
  assert.strictEqual(proposeRes.code, 201);
  const newActionId = proposeRes.body.data.id;

  // RBAC: Restricted role (SCHEME_TRUSTEE) cannot approve
  const forbiddenApprove = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/actions/${newActionId}/approve`,
    { authorization: `Bearer ${tokenTrusteeA}` },
    { notes: 'Unauthorized approve attempt' }
  );
  assert.strictEqual(forbiddenApprove.code, 403, 'Trustee should receive 403 Forbidden for action approve');

  // Admin approves via REST API
  const approveRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/actions/${newActionId}/approve`,
    { authorization: `Bearer ${tokenAdminA}` },
    { notes: 'Authorized approval' }
  );
  assert.strictEqual(approveRes.code, 200);
  assert.strictEqual(approveRes.body.data.status, 'APPROVED');

  // Execute via REST API
  const executeRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/actions/${newActionId}/execute`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(executeRes.code, 200);

  // Query verification logs via REST API
  const verifRes = await executeRequest(
    app,
    'GET',
    `/api/v1/ai/actions/${newActionId}/verification`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(verifRes.code, 200);
  assert(Array.isArray(verifRes.body.data), 'Verification logs array expected');

  console.log('   ✓ All REST API endpoints and RBAC gates verified.');

  console.log('\n====================================================');
  console.log('✅ ALL AINUBIS INTELLIGENCE ACTIONS TESTS PASSED');
  console.log('====================================================\n');
}
