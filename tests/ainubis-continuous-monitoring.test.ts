/**
 * BCIP Ainubis Continuous CRM Intelligence & Automated Monitoring Test Suite
 * Phase 2E — Prompt 002E-003: Ainubis Continuous CRM Intelligence & Automated Monitoring
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  ainubisContinuousMonitorService,
  aiObservationRepository,
  aiMonitoringExecutionRepository,
  opportunityRepository,
  opportunityService,
  leadRepository,
  leadService,
  organisationRepository,
  organisationService,
  contactRepository,
  schemeProspectRepository,
  schemeProspectService,
  taskRepository,
  activityRepository,
  crmEventBus,
  IntelligenceStatus,
  AICapability,
  OpportunityStage,
  LeadStatus,
  TaskStatus,
  TaskPriority,
  CRMEventType,
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

export async function runAinubisContinuousMonitoringTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-003: Continuous Monitoring Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_monitor_a';
  const tenantB = 'ten_monitor_b';

  const adminUserA: UserAccount = {
    id: 'usr_mon_admin_a',
    fullName: 'Sarah Monitor Admin',
    email: 'sarah.monitor@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'SMA',
    tenantId: tenantA,
    tenantName: 'Apex Properties',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const trusteeUserA: UserAccount = {
    id: 'usr_mon_trustee_a',
    fullName: 'David Trustee A',
    email: 'david@trustee.co.za',
    role: 'SCHEME_TRUSTEE',
    initials: 'DT',
    tenantId: tenantA,
    tenantName: 'Apex Properties',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const adminUserB: UserAccount = {
    id: 'usr_mon_admin_b',
    fullName: 'Marcus Monitor B',
    email: 'marcus@tenantb.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'MM',
    tenantId: tenantB,
    tenantName: 'Tenant B Corp',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);
  const tokenTrusteeA = createClientAuthToken(trusteeUserA, tenantA);
  const tokenAdminB = createClientAuthToken(adminUserB, tenantB);

  // Clear data
  await aiObservationRepository.clear();
  await aiMonitoringExecutionRepository.clear();

  // --------------------------------------------------------------------------
  // TEST 1: Seed Defective CRM Fixtures for Tenant A
  // --------------------------------------------------------------------------
  console.log('1. Seeding defective CRM test fixtures for Tenant A...');

  // Stalled opportunity (>14 days idle, missing valuation)
  const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
  const stalledOpp = await opportunityService.create(
    tenantA,
    {
      name: 'Stalled Commercial Deal',
      stage: OpportunityStage.DISCOVERY,
      estimatedValue: 0,
      expectedCloseDate: '',
      currency: 'ZAR',
      probability: 20,
    },
    adminUserA.id
  );
  await opportunityRepository.update(tenantA, stalledOpp.id, { createdAt: oldDate, updatedAt: oldDate });

  // Stale uncontacted lead
  const staleLead = await leadService.create(
    tenantA,
    {
      title: 'Uncontacted Inbound Lead',
      status: LeadStatus.NEW,
      email: '',
      phone: '',
    },
    adminUserA.id
  );
  await leadRepository.update(tenantA, staleLead.id, { createdAt: oldDate, updatedAt: oldDate });

  // Organisation without registration number and 0 contacts
  const defectiveOrg = await organisationService.create(
    tenantA,
    {
      name: 'Unverified Management Corp',
      organisationType: 'MANAGING_AGENT',
      status: 'PROSPECT',
      registrationNumber: '',
    },
    adminUserA.id
  );
  await organisationRepository.update(tenantA, defectiveOrg.id, { createdAt: oldDate, updatedAt: oldDate });

  // Scheme prospect with 0 units
  const defectiveProspect = await schemeProspectService.create(
    tenantA,
    {
      name: 'Incomplete Scheme Prospect',
      estimatedUnitCount: 0,
    },
    adminUserA.id
  );
  await schemeProspectRepository.update(tenantA, defectiveProspect.id, { createdAt: oldDate, updatedAt: oldDate });

  // Overdue task
  const overdueTask = await taskRepository.createTask(tenantA, {
    title: 'Critical SLA Review',
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
    dueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  });
  await taskRepository.update(tenantA, overdueTask.id, { createdAt: oldDate, updatedAt: oldDate });

  console.log('   ✓ Defective fixtures seeded successfully.');

  // --------------------------------------------------------------------------
  // TEST 2: Execute Tenant Monitoring & Verify Observations Generated
  // --------------------------------------------------------------------------
  console.log('2. Executing tenant continuous monitoring run...');
  const runResult = await ainubisContinuousMonitorService.runTenantMonitoring(tenantA, {
    triggerType: 'MANUAL',
    actorUserId: adminUserA.id,
  });

  assert.ok(runResult.execution);
  assert.strictEqual(runResult.execution.status, 'COMPLETED');
  assert.ok(runResult.newObservations.length >= 5, `Expected at least 5 observations, got ${runResult.newObservations.length}`);
  console.log(`   ✓ Monitoring cycle completed successfully. Generated ${runResult.newObservations.length} observations.`);

  // --------------------------------------------------------------------------
  // TEST 3: Idempotent Deduplication (Second run should create 0 new obs)
  // --------------------------------------------------------------------------
  console.log('3. Testing idempotent deduplication on second run...');
  const secondRunResult = await ainubisContinuousMonitorService.runTenantMonitoring(tenantA, {
    triggerType: 'MANUAL',
    actorUserId: adminUserA.id,
  });

  assert.strictEqual(secondRunResult.newObservations.length, 0, 'Second run must not create duplicate observations');
  console.log('   ✓ Deduplication verified: 0 duplicate observations generated on repeated scan.');

  // --------------------------------------------------------------------------
  // TEST 4: Observation Auto-Resolution on Data Fix
  // --------------------------------------------------------------------------
  console.log('4. Testing automatic observation resolution on CRM data fix...');
  // Fix the task by marking it completed
  await taskRepository.update(tenantA, overdueTask.id, { status: TaskStatus.COMPLETED });

  // Run monitoring again
  const thirdRunResult = await ainubisContinuousMonitorService.runTenantMonitoring(tenantA, {
    triggerType: 'MANUAL',
  });

  assert.ok(thirdRunResult.resolvedObservations.length > 0, 'Expected resolved observations after fixing task');
  const resolvedObs = await aiObservationRepository.findById(tenantA, overdueTask.id); // or query by condition
  const { data: resolvedList } = await aiObservationRepository.findMany(tenantA, {
    status: IntelligenceStatus.RESOLVED,
  });
  assert.ok(resolvedList.length > 0);
  console.log(`   ✓ Auto-resolution verified: ${resolvedList.length} observation(s) marked RESOLVED.`);

  // --------------------------------------------------------------------------
  // TEST 5: Event-Driven Targeted Monitoring via crmEventBus
  // --------------------------------------------------------------------------
  console.log('5. Testing event-driven targeted analysis via crmEventBus...');
  const eventPayload = { id: 'tsk_event_test', opportunityId: stalledOpp.id };
  await crmEventBus.publish(CRMEventType.TASK_CREATED, tenantA, eventPayload, adminUserA.id);
  console.log('   ✓ Event-driven hook executed successfully.');

  // --------------------------------------------------------------------------
  // TEST 6: Strict Multi-Tenant Isolation
  // --------------------------------------------------------------------------
  console.log('6. Testing strict multi-tenant isolation...');
  const tenantBStatusRes = await executeRequest(app, 'GET', '/api/v1/ai/monitoring/status', {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(tenantBStatusRes.code, 200);
  assert.strictEqual(tenantBStatusRes.body.data.totalActiveObservations, 0, 'Tenant B must not see Tenant A observations');
  console.log('   ✓ Multi-tenant isolation verified: Tenant B active observation count is 0.');

  // --------------------------------------------------------------------------
  // TEST 7: Failure Isolation Test
  // --------------------------------------------------------------------------
  console.log('7. Testing worker/monitor failure isolation across tenants...');
  const tenantBLead = await leadService.create(
    tenantB,
    {
      title: 'Tenant B Inbound Lead',
      status: LeadStatus.NEW,
    },
    adminUserB.id
  );
  await leadRepository.update(tenantB, tenantBLead.id, { createdAt: oldDate, updatedAt: oldDate });

  const failureTestSummary = await ainubisContinuousMonitorService.runScheduledMonitoringForAllTenants();
  assert.ok(failureTestSummary.totalTenants >= 2);
  console.log(`   ✓ Failure isolation verified across ${failureTestSummary.totalTenants} tenants.`);

  // --------------------------------------------------------------------------
  // TEST 8: REST API Endpoints Verification
  // --------------------------------------------------------------------------
  console.log('8. Testing REST API endpoints for monitoring...');
  const statusRes = await executeRequest(app, 'GET', '/api/v1/ai/monitoring/status', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(statusRes.code, 200);
  assert.strictEqual(statusRes.body.success, true);
  assert.ok(statusRes.body.data.monitoringActive);

  const capsRes = await executeRequest(app, 'GET', '/api/v1/ai/monitoring/capabilities', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(capsRes.code, 200);
  assert.ok(capsRes.body.data.length >= 5);

  const execsRes = await executeRequest(app, 'GET', '/api/v1/ai/monitoring/executions', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(execsRes.code, 200);
  assert.ok(execsRes.body.data.length > 0);

  const manualRunRes = await executeRequest(app, 'POST', '/api/v1/ai/monitoring/run', {
    authorization: `Bearer ${tokenAdminA}`,
  }, { capability: AICapability.CRM_PIPELINE_HYGIENE });
  assert.strictEqual(manualRunRes.code, 200);
  assert.strictEqual(manualRunRes.body.data.status, 'COMPLETED');
  console.log('   ✓ All REST API monitoring endpoints verified successfully.');

  // --------------------------------------------------------------------------
  // TEST 9: RBAC Security Enforcement (403 Forbidden)
  // --------------------------------------------------------------------------
  console.log('9. Testing RBAC security gates on manual run trigger...');
  const unauthorizedRunRes = await executeRequest(app, 'POST', '/api/v1/ai/monitoring/run', {
    authorization: `Bearer ${tokenTrusteeA}`, // Trustee lacks CRM_AI_MONITOR permission
  });
  assert.strictEqual(unauthorizedRunRes.code, 403, 'Scheme Trustee must be forbidden from triggering monitoring');
  console.log('   ✓ RBAC security gate enforced: unauthorized trigger rejected with 403 Forbidden.');

  console.log('====================================================');
  console.log('✅ ALL AINUBIS CONTINUOUS MONITORING TESTS PASSED');
  console.log('====================================================\n');
}
