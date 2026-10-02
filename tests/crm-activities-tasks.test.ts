/**
 * BCIP CRM Activities & Tasks Automated Test Suite
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 * Tests CRUD contracts, RBAC permissions, lifecycle transitions (task complete), search, filtering, and security gates.
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  Activity,
  ActivityType,
  CreateActivityDto,
  UpdateActivityDto,
  CRMTask,
  TaskStatus,
  TaskPriority,
  CreateCRMTaskDto,
  UpdateCRMTaskDto,
} from '../apps/web/src/components/crm/shared/crm-types.ts';
import {
  canViewActivities,
  canCreateActivity,
  canEditActivity,
  canDeleteActivity,
  canViewTasks,
  canCreateTask,
  canEditTask,
  canCompleteTask,
  canDeleteTask,
} from '../apps/web/src/components/crm/shared/crm-permissions.ts';
import {
  createClientAuthToken,
} from '../apps/web/src/components/crm/shared/crm-api.ts';
import { UserAccount } from '../apps/web/src/types/tenant.ts';

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

export async function runCrmActivitiesTasksTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Phase 2D Prompt 002D-005: CRM Activities & Tasks Tests');
  console.log('====================================================\n');

  const app = createApiApp();

  const testTenantId = 'tenant_act_tsk_test_01';
  const adminUser: UserAccount = {
    id: 'usr_act_admin_01',
    fullName: 'Anele Moyo',
    email: 'a.moyo@highlandportfolios.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    initials: 'AM',
    tenantId: testTenantId,
    tenantName: 'Highland Property Portfolios',
    lastLogin: 'Today, 09:00 SAST',
    twoFactorEnabled: true,
  };

  const trusteeUser: UserAccount = {
    id: 'usr_act_trustee_02',
    fullName: 'Peter Botha',
    email: 'p.botha@cascades-trustee.co.za',
    role: 'SCHEME_TRUSTEE',
    userRole: 'SCHEME_TRUSTEE',
    initials: 'PB',
    tenantId: testTenantId,
    tenantName: 'The Cascades Body Corporate',
    lastLogin: 'Yesterday, 16:00 SAST',
    twoFactorEnabled: false,
  };

  const adminToken = createClientAuthToken(adminUser, testTenantId);
  const trusteeToken = createClientAuthToken(trusteeUser, testTenantId);

  // --------------------------------------------------------------------------
  // TEST 1: RBAC Permission Gate Assertions
  // --------------------------------------------------------------------------
  console.log('1. Testing RBAC Permission Gates for Activities & Tasks...');
  assert.strictEqual(canViewActivities('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canCreateActivity('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canEditActivity('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canDeleteActivity('MANAGING_AGENT_ADMIN'), true);

  assert.strictEqual(canViewTasks('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canCreateTask('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canEditTask('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canCompleteTask('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canDeleteTask('PORTFOLIO_MANAGER'), false); // Deletion restricted to Admin

  assert.strictEqual(canCreateActivity('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canCreateTask('SCHEME_TRUSTEE'), false);
  console.log('   ✓ RBAC permission matrix verified.');

  // --------------------------------------------------------------------------
  // TEST 2: Activity Creation & Detail Query
  // --------------------------------------------------------------------------
  console.log('2. Testing Activity Creation & GetById...');
  const createActPayload: CreateActivityDto = {
    activityType: ActivityType.CALL,
    subject: 'Discovery Call with Trustees regarding Levy Migration',
    description: 'Discussed cloud ledger migration timeline and automated arrear levy collection workflows.',
    activityAt: new Date().toISOString(),
  };

  const createActRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/activities',
    adminToken,
    createActPayload
  );

  assert.strictEqual(createActRes.code, 201, `Failed to create activity: ${JSON.stringify(createActRes.body)}`);
  const createdAct: Activity = createActRes.body.data;
  assert.ok(createdAct.id);
  assert.strictEqual(createdAct.subject, 'Discovery Call with Trustees regarding Levy Migration');
  console.log(`   ✓ Activity created via API: "${createdAct.subject}" (ID: ${createdAct.id})`);

  // Query single activity
  const getActRes = await executeApiRequest(
    app,
    'GET',
    `/api/v1/activities/${createdAct.id}`,
    adminToken
  );
  assert.strictEqual(getActRes.code, 200);
  assert.strictEqual(getActRes.body.data.id, createdAct.id);
  console.log('   ✓ Single activity query verified.');

  // --------------------------------------------------------------------------
  // TEST 3: Activity Update & Filter Query
  // --------------------------------------------------------------------------
  console.log('3. Testing Activity Update & Filter Listing...');
  const updateActPayload: UpdateActivityDto = {
    description: 'Updated notes: Trustees confirmed AGM date for proposal signoff.',
  };

  const updateActRes = await executeApiRequest(
    app,
    'PATCH',
    `/api/v1/activities/${createdAct.id}`,
    adminToken,
    updateActPayload
  );

  assert.strictEqual(updateActRes.code, 200);
  assert.strictEqual(updateActRes.body.data.description, 'Updated notes: Trustees confirmed AGM date for proposal signoff.');
  console.log('   ✓ Activity description updated.');

  // List activities with search
  const listActRes = await executeApiRequest(
    app,
    'GET',
    '/api/v1/activities?search=Discovery',
    adminToken
  );

  assert.strictEqual(listActRes.code, 200);
  assert.ok(Array.isArray(listActRes.body.data));
  assert.ok(listActRes.body.data.some((a: Activity) => a.id === createdAct.id));
  console.log('   ✓ Activity search and filter query verified.');

  // --------------------------------------------------------------------------
  // TEST 4: Task Creation & Detail Query
  // --------------------------------------------------------------------------
  console.log('4. Testing Task Creation & GetById...');
  const createTskPayload: CreateCRMTaskDto = {
    title: 'Prepare Sectional Title SLA Proposal',
    description: 'Draft master agreement for 142-unit scheme onboarding.',
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
    dueAt: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
  };

  const createTskRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/tasks',
    adminToken,
    createTskPayload
  );

  assert.strictEqual(createTskRes.code, 201, `Failed to create task: ${JSON.stringify(createTskRes.body)}`);
  const createdTsk: CRMTask = createTskRes.body.data;
  assert.ok(createdTsk.id);
  assert.strictEqual(createdTsk.title, 'Prepare Sectional Title SLA Proposal');
  assert.strictEqual(createdTsk.status, TaskStatus.OPEN);
  console.log(`   ✓ Task created via API: "${createdTsk.title}" (ID: ${createdTsk.id})`);

  // --------------------------------------------------------------------------
  // TEST 5: Task Status Transition & Completion Endpoint
  // --------------------------------------------------------------------------
  console.log('5. Testing Task Completion via Endpoint POST /api/v1/tasks/:id/complete...');
  const completeTskRes = await executeApiRequest(
    app,
    'POST',
    `/api/v1/tasks/${createdTsk.id}/complete`,
    adminToken
  );

  assert.strictEqual(completeTskRes.code, 200);
  assert.strictEqual(completeTskRes.body.data.status, TaskStatus.COMPLETED);
  assert.ok(completeTskRes.body.data.completedAt);
  console.log('   ✓ Task successfully marked as COMPLETED.');

  // --------------------------------------------------------------------------
  // TEST 6: Task Update & Listing with Priority Filter
  // --------------------------------------------------------------------------
  console.log('6. Testing Task Update & Filtered Query...');
  const updateTskPayload: UpdateCRMTaskDto = {
    priority: TaskPriority.URGENT,
  };

  const updateTskRes = await executeApiRequest(
    app,
    'PATCH',
    `/api/v1/tasks/${createdTsk.id}`,
    adminToken,
    updateTskPayload
  );

  assert.strictEqual(updateTskRes.code, 200);
  assert.strictEqual(updateTskRes.body.data.priority, TaskPriority.URGENT);

  const listTskRes = await executeApiRequest(
    app,
    'GET',
    '/api/v1/tasks?priority=URGENT',
    adminToken
  );

  assert.strictEqual(listTskRes.code, 200);
  assert.ok(Array.isArray(listTskRes.body.data));
  assert.ok(listTskRes.body.data.some((t: CRMTask) => t.id === createdTsk.id));
  console.log('   ✓ Task update and priority filtering verified.');

  // --------------------------------------------------------------------------
  // TEST 7: Security Authorization Gates (403 Forbidden)
  // --------------------------------------------------------------------------
  console.log('7. Testing Security Authorization Gates (403 Forbidden)...');
  const forbiddenCreateAct = await executeApiRequest(
    app,
    'POST',
    '/api/v1/activities',
    trusteeToken,
    createActPayload
  );
  assert.strictEqual(forbiddenCreateAct.code, 403);

  const forbiddenCreateTsk = await executeApiRequest(
    app,
    'POST',
    '/api/v1/tasks',
    trusteeToken,
    createTskPayload
  );
  assert.strictEqual(forbiddenCreateTsk.code, 403);
  console.log('   ✓ Restricted role (SCHEME_TRUSTEE) blocked with HTTP 403 FORBIDDEN.');

  // --------------------------------------------------------------------------
  // TEST 8: Validation Error Rejection (422)
  // --------------------------------------------------------------------------
  console.log('8. Testing Validation Error Rejections (422)...');
  const invalidActRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/activities',
    adminToken,
    {
      subject: '', // Subject required
    }
  );
  assert.strictEqual(invalidActRes.code, 422);

  const invalidTskRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/tasks',
    adminToken,
    {
      title: '', // Title required
    }
  );
  assert.strictEqual(invalidTskRes.code, 422);
  console.log('   ✓ Invalid activity/task payloads rejected with HTTP 422 VALIDATION_ERROR.');

  // --------------------------------------------------------------------------
  // TEST 9: Soft Deletion
  // --------------------------------------------------------------------------
  console.log('9. Testing Soft Deletion Architecture...');
  const deleteActRes = await executeApiRequest(
    app,
    'DELETE',
    `/api/v1/activities/${createdAct.id}`,
    adminToken
  );
  assert.strictEqual(deleteActRes.code, 200);
  assert.strictEqual(deleteActRes.body.data.deleted, true);

  const deleteTskRes = await executeApiRequest(
    app,
    'DELETE',
    `/api/v1/tasks/${createdTsk.id}`,
    adminToken
  );
  assert.strictEqual(deleteTskRes.code, 200);
  assert.strictEqual(deleteTskRes.body.data.deleted, true);
  console.log('   ✓ Soft deletion confirmed for Activity and Task records.');

  console.log('\n====================================================');
  console.log('✅ ALL CRM ACTIVITIES & TASKS TESTS PASSED');
  console.log('====================================================\n');
}

if (process.argv[1]?.endsWith('crm-activities-tasks.test.ts')) {
  runCrmActivitiesTasksTests().catch((err) => {
    console.error('CRM Activities & Tasks test suite failed:', err);
    process.exit(1);
  });
}
