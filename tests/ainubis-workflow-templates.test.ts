/**
 * BCIP Ainubis Workflow Templates Test Suite
 * Phase 2E — Prompt 002E-006 & 4A: Ainubis Workflow Templates Tenancy, Ownership & Reuse
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  workflowTemplateRepository,
  automationWorkflowRepository,
  WorkflowTemplateStatus,
  WorkflowStatus,
  TemplateScope,
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

export async function runAinubisWorkflowTemplatesTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-006 & 4A: Ainubis Workflow Templates Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_tpl_a';
  const tenantB = 'ten_tpl_b';

  const adminUserA: UserAccount = {
    id: 'usr_tpl_admin_a',
    fullName: 'Alex Templates Admin',
    email: 'alex.templates@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'ATA',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const adminUserB: UserAccount = {
    id: 'usr_tpl_admin_b',
    fullName: 'Bianca Templates Admin',
    email: 'bianca.templates@beacon.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'BTA',
    tenantId: tenantB,
    tenantName: 'Beacon Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const trusteeUserA: UserAccount = {
    id: 'usr_tpl_trustee_a',
    fullName: 'Tim Trustee',
    email: 'tim@scheme.co.za',
    role: 'SCHEME_TRUSTEE',
    initials: 'TT',
    tenantId: tenantA,
    tenantName: 'Apex Managing Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);
  const tokenAdminB = createClientAuthToken(adminUserB, tenantB);
  const tokenTrusteeA = createClientAuthToken(trusteeUserA, tenantA);

  // Clear previous state for deterministic tests
  workflowTemplateRepository.clearAll();

  // 1. Initial Governed Templates Auto-Seeding (Prompt 4A.2)
  console.log('1. Testing Canonical SYSTEM Template Auto-Seeding...');
  const seedRes = await executeRequest(app, 'GET', '/api/v1/ai/workflow-templates', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(seedRes.code, 200);
  assert(Array.isArray(seedRes.body.data), 'Should return templates array');
  assert(seedRes.body.data.length >= 6, 'Expected at least 6 canonical SYSTEM templates');

  // Verify all 6 initial templates are SYSTEM scoped and have ownerTenantId = null
  for (const tpl of seedRes.body.data) {
    assert.strictEqual(tpl.templateScope, TemplateScope.SYSTEM, 'Initial governed templates must be SYSTEM scoped');
    assert.strictEqual(tpl.ownerTenantId, null, 'Initial governed SYSTEM templates must have ownerTenantId = null');
    assert.strictEqual(tpl.status, WorkflowTemplateStatus.PUBLISHED, 'Initial governed SYSTEM templates must be PUBLISHED');
  }
  console.log(`   ✓ Verified 6 canonical SYSTEM templates seeded with ownerTenantId = null.`);

  // 2. SYSTEM Template Reuse Across Multiple Tenants (Prompt 4A.1 & 4A.15)
  console.log('2. Testing SYSTEM Template Reuse Across Multiple Tenants...');
  const listTenantBRes = await executeRequest(app, 'GET', '/api/v1/ai/workflow-templates', {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(listTenantBRes.code, 200);
  assert(listTenantBRes.body.data.length >= 6, 'Tenant B must have access to all canonical SYSTEM templates');

  // Both tenants can view the same SYSTEM template
  const systemTemplate = seedRes.body.data.find(
    (t: any) => t.templateKey === 'NEW_LEAD_QUALIFICATION' || t.templateKey === 'PIPELINE_LEAD_QUALIFICATION'
  );
  assert(systemTemplate, 'NEW_LEAD_QUALIFICATION system template must exist');

  const getSystemA = await executeRequest(app, 'GET', `/api/v1/ai/workflow-templates/${systemTemplate.id}`, {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(getSystemA.code, 200);

  const getSystemB = await executeRequest(app, 'GET', `/api/v1/ai/workflow-templates/${systemTemplate.id}`, {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(getSystemB.code, 200);
  assert.strictEqual(getSystemA.body.data.id, getSystemB.body.data.id, 'Both tenants reference the same SYSTEM template');

  // Both tenants can instantiate independently (Prompt 4A.11 & 4A.15)
  const instA = await executeRequest(app, 'POST', `/api/v1/ai/workflow-templates/${systemTemplate.id}/instantiate`, {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(instA.code, 201);
  const wfA = instA.body.data.workflow;
  assert.strictEqual(wfA.tenantId, tenantA, 'Workflow instantiated by Tenant A must belong to Tenant A');
  assert.strictEqual(wfA.sourceTemplateId, systemTemplate.id, 'Workflow must preserve sourceTemplateId');

  const instB = await executeRequest(app, 'POST', `/api/v1/ai/workflow-templates/${systemTemplate.id}/instantiate`, {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(instB.code, 201);
  const wfB = instB.body.data.workflow;
  assert.strictEqual(wfB.tenantId, tenantB, 'Workflow instantiated by Tenant B must belong to Tenant B');
  assert.strictEqual(wfB.sourceTemplateId, systemTemplate.id, 'Workflow must preserve sourceTemplateId');
  assert.notStrictEqual(wfA.id, wfB.id, 'Distinct tenant workflows must be created');
  console.log('   ✓ Verified SYSTEM template reuse and independent tenant instantiations.');

  // 3. SYSTEM Template Immutability (Prompt 4A.5 & 4A.15)
  console.log('3. Testing SYSTEM Template Immutability (Forbidden Mutations)...');
  // Tenant A cannot EDIT SYSTEM template
  const editSystemRes = await executeRequest(
    app,
    'PUT',
    `/api/v1/ai/workflow-templates/${systemTemplate.id}`,
    { authorization: `Bearer ${tokenAdminA}` },
    { name: 'Mutated System Template' }
  );
  assert.strictEqual(editSystemRes.code, 403, 'Tenant cannot edit SYSTEM template (must receive 403)');

  // Tenant A cannot PUBLISH SYSTEM template
  const publishSystemRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${systemTemplate.id}/publish`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(publishSystemRes.code, 403, 'Tenant cannot publish SYSTEM template (must receive 403)');

  // Tenant A cannot DEPRECATE SYSTEM template
  const deprecateSystemRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${systemTemplate.id}/deprecate`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(deprecateSystemRes.code, 403, 'Tenant cannot deprecate SYSTEM template (must receive 403)');

  // Tenant A cannot ARCHIVE SYSTEM template
  const archiveSystemRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${systemTemplate.id}/archive`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(archiveSystemRes.code, 403, 'Tenant cannot archive SYSTEM template (must receive 403)');

  // Tenant A cannot DELETE SYSTEM template
  const deleteSystemRes = await executeRequest(
    app,
    'DELETE',
    `/api/v1/ai/workflow-templates/${systemTemplate.id}`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(deleteSystemRes.code, 403, 'Tenant cannot delete SYSTEM template (must receive 403)');
  console.log('   ✓ SYSTEM template immutability strictly enforced across EDIT/PUBLISH/DEPRECATE/ARCHIVE/DELETE.');

  // 4. Custom TENANT Template Creation (DRAFT) (Prompt 4A.6)
  console.log('4. Testing Custom TENANT Template Creation (DRAFT)...');
  const createRes = await executeRequest(
    app,
    'POST',
    '/api/v1/ai/workflow-templates',
    { authorization: `Bearer ${tokenAdminA}` },
    {
      templateKey: 'CUSTOM_LEAD_QUAL_TENANT_A',
      name: 'Custom Lead Qualification Workflow Tenant A',
      description: 'Custom lead qualification tracking template',
      category: 'LEAD_QUALIFICATION',
      purpose: 'Fast SLA response tracking',
      trigger: {
        type: 'CRM_EVENT',
        eventType: 'crm.lead.created',
      },
      steps: [
        {
          id: 'step_1',
          stepKey: 'obs',
          name: 'Observe Lead',
          type: 'OBSERVE',
          order: 1,
          configuration: { entityType: 'lead' },
          enabled: true,
        },
      ],
    }
  );
  assert.strictEqual(createRes.code, 201);
  const tenantATemplate = createRes.body.data;
  assert.strictEqual(tenantATemplate.templateScope, TemplateScope.TENANT, 'Created template must be TENANT scoped');
  assert.strictEqual(tenantATemplate.ownerTenantId, tenantA, 'Created template must belong to Tenant A');
  assert.strictEqual(tenantATemplate.status, WorkflowTemplateStatus.DRAFT);
  console.log(`   ✓ Tenant template created: ${tenantATemplate.name} (Scope: ${tenantATemplate.templateScope})`);

  // 5. Validation Rules and Prohibited Scopes (Prompt 4A.7)
  console.log('5. Testing Validation Engine & Prohibited Scope Safety Boundaries...');
  const forbiddenActionRes = await executeRequest(
    app,
    'POST',
    '/api/v1/ai/workflow-templates',
    { authorization: `Bearer ${tokenAdminA}` },
    {
      templateKey: 'FORBIDDEN_FINANCE',
      name: 'Forbidden Auto-Payment Workflow',
      description: 'Breaches financial guardrails',
      category: 'GENERAL',
      purpose: 'Testing safety bounds',
      trigger: { type: 'MANUAL' },
      steps: [
        {
          id: 'step_1',
          stepKey: 'obs',
          name: 'Observe',
          type: 'OBSERVE',
          order: 1,
          configuration: {},
          enabled: true,
        },
        {
          id: 'step_2',
          stepKey: 'forbidden',
          name: 'Initiate Auto Levy Invoicing Transaction',
          type: 'PROPOSE_ACTION',
          order: 2,
          configuration: { actionType: 'PROCESS_LEVY_TRANSACTION', actionTemplateId: 'PAYMENT_PROCESS' },
          enabled: true,
        },
      ],
    }
  );
  assert.strictEqual(forbiddenActionRes.code, 422);
  assert(
    JSON.stringify(forbiddenActionRes.body).includes('is prohibited'),
    'Expected financial trigger safety rejection'
  );
  console.log('   ✓ Financial and statutory prohibited scopes rejected with 422.');

  // 6. Tenant Template Isolation (Prompt 4A.10 & 4A.15)
  console.log('6. Testing Strict Tenant Template Isolation...');
  // Tenant B cannot access Tenant A's private template (Must receive 404 to avoid leaking existence)
  const crossTenantGet = await executeRequest(
    app,
    'GET',
    `/api/v1/ai/workflow-templates/${tenantATemplate.id}`,
    { authorization: `Bearer ${tokenAdminB}` }
  );
  assert.strictEqual(crossTenantGet.code, 404, 'Tenant B must receive 404 on Tenant A template');

  // Tenant B cannot modify Tenant A's private template
  const crossTenantPut = await executeRequest(
    app,
    'PUT',
    `/api/v1/ai/workflow-templates/${tenantATemplate.id}`,
    { authorization: `Bearer ${tokenAdminB}` },
    { name: 'Hijacked Template' }
  );
  assert.strictEqual(crossTenantPut.code, 404, 'Tenant B cannot modify Tenant A template');

  // Tenant B cannot instantiate Tenant A's private template
  const crossTenantInstantiate = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${tenantATemplate.id}/instantiate`,
    { authorization: `Bearer ${tokenAdminB}` }
  );
  assert.strictEqual(crossTenantInstantiate.code, 404, 'Tenant B cannot instantiate Tenant A template');

  // Querying TENANT scope for Tenant B returns 0 private templates
  const tenantBScoped = await workflowTemplateRepository.findMany(tenantB, { scope: 'TENANT' });
  assert.strictEqual(tenantBScoped.total, 0, 'Tenant B should have 0 TENANT templates');

  // Querying TENANT scope for Tenant A returns Tenant A's template
  const tenantAScoped = await workflowTemplateRepository.findMany(tenantA, { scope: 'TENANT' });
  assert.strictEqual(tenantAScoped.total, 1, 'Tenant A should have exactly 1 TENANT template');
  assert.strictEqual(tenantAScoped.data[0].id, tenantATemplate.id);
  console.log('   ✓ Strict multi-tenant isolation verified across lookup, mutation, and instantiation.');

  // 7. Clone Behaviour: Cloning SYSTEM Template into TENANT-Owned Template (Prompt 4A.6 & 4A.15)
  console.log('7. Testing Clone Behaviour (SYSTEM -> TENANT)...');
  const cloneRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${systemTemplate.id}/clone`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(cloneRes.code, 201);
  const clonedTemplate = cloneRes.body.data;
  assert.strictEqual(clonedTemplate.templateScope, TemplateScope.TENANT, 'Cloned template must be TENANT scoped');
  assert.strictEqual(clonedTemplate.ownerTenantId, tenantA, 'Cloned template must be owned by Tenant A');
  assert.strictEqual(clonedTemplate.sourceTemplateId, systemTemplate.id, 'Cloned template must retain sourceTemplateId');
  assert.strictEqual(clonedTemplate.sourceTemplateVersion, systemTemplate.version, 'Cloned template must retain version');
  assert.strictEqual(clonedTemplate.status, WorkflowTemplateStatus.DRAFT, 'Cloned template starts in DRAFT');

  // Tenant A can modify the cloned template without affecting the SYSTEM template
  const updateCloneRes = await executeRequest(
    app,
    'PUT',
    `/api/v1/ai/workflow-templates/${clonedTemplate.id}`,
    { authorization: `Bearer ${tokenAdminA}` },
    { name: 'Customized Follow-up v1' }
  );
  assert.strictEqual(updateCloneRes.code, 200);

  // Verify SYSTEM template remained unaffected
  const systemCheck = await workflowTemplateRepository.findById(tenantA, systemTemplate.id);
  assert.strictEqual(systemCheck?.name, systemTemplate.name, 'SYSTEM template must remain completely unchanged');
  console.log('   ✓ Verified clone behaviour: created TENANT template with source traceability.');

  // 8. Version Isolation: Upgrading Template Does Not Mutate Workflows (Prompt 4A.8, 4A.9 & 4A.15)
  console.log('8. Testing Version Isolation & Immutability...');
  // Publish cloned template
  const pubCloneRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${clonedTemplate.id}/publish`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(pubCloneRes.code, 200);
  assert.strictEqual(pubCloneRes.body.data.status, WorkflowTemplateStatus.PUBLISHED);

  // Instantiating workflow from v1
  const instClonedRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${clonedTemplate.id}/instantiate`,
    { authorization: `Bearer ${tokenAdminA}` }
  );
  assert.strictEqual(instClonedRes.code, 201);
  const instantiatedWfId = instClonedRes.body.data.workflow.id;
  const initialWf = await automationWorkflowRepository.findById(tenantA, instantiatedWfId);
  assert.strictEqual(initialWf?.sourceTemplateVersion, 1);

  // When a new version is created (v2) in template versions
  await workflowTemplateRepository.createVersion(tenantA, {
    templateId: clonedTemplate.id,
    templateScope: TemplateScope.TENANT,
    ownerTenantId: tenantA,
    version: 2,
    trigger: clonedTemplate.trigger,
    steps: clonedTemplate.steps,
    status: WorkflowTemplateStatus.PUBLISHED,
    publishedAt: new Date().toISOString(),
    createdBy: adminUserA.id,
  });

  // Existing workflow must NOT be mutated automatically (Prompt 4A.9)
  const checkWfUnchanged = await automationWorkflowRepository.findById(tenantA, instantiatedWfId);
  assert.strictEqual(checkWfUnchanged?.sourceTemplateVersion, 1, 'Existing workflow must remain on v1');
  console.log('   ✓ Verified version isolation: publishing new template version does not mutate existing workflows.');

  // 9. RBAC Security Gates
  console.log('9. Testing RBAC Security Gates...');
  const unauthorizedCreateRes = await executeRequest(
    app,
    'POST',
    '/api/v1/ai/workflow-templates',
    { authorization: `Bearer ${tokenTrusteeA}` },
    { templateKey: 'TRUSTEE_BAD', name: 'Tim Bad', trigger: { type: 'MANUAL' }, steps: [] }
  );
  assert.strictEqual(unauthorizedCreateRes.code, 403, 'Trustee role should receive 403 Forbidden on create');

  const unauthorizedPublishRes = await executeRequest(
    app,
    'POST',
    `/api/v1/ai/workflow-templates/${clonedTemplate.id}/publish`,
    { authorization: `Bearer ${tokenTrusteeA}` }
  );
  assert.strictEqual(unauthorizedPublishRes.code, 403, 'Trustee role should receive 403 Forbidden on publish');
  console.log('   ✓ RBAC security gates verified (403 Forbidden on unauthorized roles).');

  console.log('\n====================================================');
  console.log('✅ ALL AINUBIS WORKFLOW TEMPLATES TESTS PASSED');
  console.log('====================================================\n');
}
