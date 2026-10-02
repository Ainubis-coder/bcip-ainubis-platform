/**
 * BCIP CRM Organisations & Scheme Prospects Automated Test Suite
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 * Tests CRUD contracts, RBAC permissions, sub-resource relationships, search, filtering, and security.
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  Organisation,
  OrganisationType,
  OrganisationStatus,
  CreateOrganisationDto,
  UpdateOrganisationDto,
  SchemeProspect,
  CreateSchemeProspectDto,
  UpdateSchemeProspectDto,
} from '../apps/web/src/components/crm/shared/crm-types.ts';
import {
  canViewOrganisations,
  canCreateOrganisation,
  canEditOrganisation,
  canDeleteOrganisation,
  canViewSchemeProspects,
  canCreateSchemeProspect,
  canEditSchemeProspect,
  canDeleteSchemeProspect,
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

export async function runCrmOrganisationsTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Phase 2D Prompt 002D-004: CRM Organisations & Scheme Prospects Tests');
  console.log('====================================================\n');

  const app = createApiApp();

  const testTenantId = 'tenant_org_test_01';
  const adminUser: UserAccount = {
    id: 'usr_org_admin_01',
    fullName: 'Sipho Ndlovu',
    email: 's.ndlovu@highlandportfolios.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    userRole: 'MANAGING_AGENT_ADMIN',
    initials: 'SN',
    tenantId: testTenantId,
    tenantName: 'Highland Property Portfolios',
    lastLogin: 'Today, 08:30 SAST',
    twoFactorEnabled: true,
  };

  const trusteeUser: UserAccount = {
    id: 'usr_org_trustee_02',
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

  const adminToken = createClientAuthToken(adminUser, testTenantId);
  const trusteeToken = createClientAuthToken(trusteeUser, testTenantId);

  // --------------------------------------------------------------------------
  // TEST 1: RBAC Permission Gate Assertions
  // --------------------------------------------------------------------------
  console.log('1. Testing RBAC Permission Gates for Organisations & Scheme Prospects...');
  assert.strictEqual(canViewOrganisations('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canCreateOrganisation('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canEditOrganisation('MANAGING_AGENT_ADMIN'), true);
  assert.strictEqual(canDeleteOrganisation('MANAGING_AGENT_ADMIN'), true);

  assert.strictEqual(canViewSchemeProspects('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canCreateSchemeProspect('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canEditSchemeProspect('PORTFOLIO_MANAGER'), true);
  assert.strictEqual(canDeleteSchemeProspect('PORTFOLIO_MANAGER'), false); // Deletion restricted to Admin/SuperAdmin
  assert.strictEqual(canDeleteSchemeProspect('MANAGING_AGENT_ADMIN'), true);

  assert.strictEqual(canCreateOrganisation('SCHEME_TRUSTEE'), false);
  assert.strictEqual(canCreateSchemeProspect('SCHEME_TRUSTEE'), false);
  console.log('   ✓ RBAC permission matrix verified.');

  // --------------------------------------------------------------------------
  // TEST 2: Organisation Creation & Detail Query
  // --------------------------------------------------------------------------
  console.log('2. Testing Organisation Creation & GetById...');
  const createOrgPayload: CreateOrganisationDto = {
    name: 'Atlantic Seaboard Managing Agency (Pty) Ltd',
    legalName: 'Atlantic Seaboard Management Holdings NPC',
    organisationType: OrganisationType.MANAGING_AGENT,
    registrationNumber: '2019/889900/07',
    email: 'info@atlanticseaboard.co.za',
    phone: '+27 21 430 9000',
    website: 'https://atlanticseaboard.co.za',
    status: OrganisationStatus.PROSPECT,
    notes: 'Managing agency with 18 sectional title schemes under management.',
  };

  const createOrgRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/organisations',
    adminToken,
    createOrgPayload
  );

  assert.strictEqual(createOrgRes.code, 201, `Failed to create organisation: ${JSON.stringify(createOrgRes.body)}`);
  const createdOrg: Organisation = createOrgRes.body.data;
  assert.ok(createdOrg.id);
  assert.strictEqual(createdOrg.name, 'Atlantic Seaboard Managing Agency (Pty) Ltd');
  console.log(`   ✓ Organisation created via API: "${createdOrg.name}" (ID: ${createdOrg.id})`);

  // Query single organisation
  const getOrgRes = await executeApiRequest(
    app,
    'GET',
    `/api/v1/organisations/${createdOrg.id}`,
    adminToken
  );
  assert.strictEqual(getOrgRes.code, 200);
  assert.strictEqual(getOrgRes.body.data.id, createdOrg.id);
  console.log('   ✓ Single organisation query verified.');

  // --------------------------------------------------------------------------
  // TEST 3: Organisation Update & Search Filtering
  // --------------------------------------------------------------------------
  console.log('3. Testing Organisation Update & Server Search...');
  const updateOrgPayload: UpdateOrganisationDto = {
    status: OrganisationStatus.ACTIVE_CLIENT,
    notes: 'Promoted to Active Client following contract execution.',
  };

  const updateOrgRes = await executeApiRequest(
    app,
    'PATCH',
    `/api/v1/organisations/${createdOrg.id}`,
    adminToken,
    updateOrgPayload
  );

  assert.strictEqual(updateOrgRes.code, 200);
  assert.strictEqual(updateOrgRes.body.data.status, OrganisationStatus.ACTIVE_CLIENT);
  console.log('   ✓ Organisation updated to ACTIVE_CLIENT status.');

  // Search query
  const searchOrgRes = await executeApiRequest(
    app,
    'GET',
    '/api/v1/organisations?search=Atlantic',
    adminToken
  );

  assert.strictEqual(searchOrgRes.code, 200);
  assert.ok(Array.isArray(searchOrgRes.body.data));
  assert.ok(searchOrgRes.body.data.some((o: Organisation) => o.id === createdOrg.id));
  console.log('   ✓ Server-side organisation search query verified.');

  // --------------------------------------------------------------------------
  // TEST 4: Scheme Prospect Creation & Relationship Linking
  // --------------------------------------------------------------------------
  console.log('4. Testing Scheme Prospect Creation & Organisation Link...');
  const createSpPayload: CreateSchemeProspectDto = {
    name: 'Bantry Bay Terraces SS 102/2015',
    organisationId: createdOrg.id,
    sectionalTitleSchemeCode: 'SS 102/2015',
    registrationNumber: '2015/102000/08',
    estimatedUnitCount: 88,
    location: 'Bantry Bay, Cape Town',
    managingAgentName: createdOrg.name,
    currentPropertySystem: 'Legacy Spreadsheets',
    requirementsSummary: 'Full cloud levy administration, maintenance ticket dispatch, and digital AGM voting.',
  };

  const createSpRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/scheme-prospects',
    adminToken,
    createSpPayload
  );

  assert.strictEqual(createSpRes.code, 201, `Failed to create scheme prospect: ${JSON.stringify(createSpRes.body)}`);
  const createdSp: SchemeProspect = createSpRes.body.data;
  assert.ok(createdSp.id);
  assert.strictEqual(createdSp.name, 'Bantry Bay Terraces SS 102/2015');
  assert.strictEqual(createdSp.organisationId, createdOrg.id);
  console.log(`   ✓ Scheme Prospect created via API: "${createdSp.name}" (ID: ${createdSp.id})`);

  // Query related scheme prospects for organisation
  const orgSchemesRes = await executeApiRequest(
    app,
    'GET',
    `/api/v1/organisations/${createdOrg.id}/scheme-prospects`,
    adminToken
  );

  assert.strictEqual(orgSchemesRes.code, 200);
  assert.ok(Array.isArray(orgSchemesRes.body.data));
  assert.ok(orgSchemesRes.body.data.some((sp: SchemeProspect) => sp.id === createdSp.id));
  console.log('   ✓ Sub-resource query GET /api/v1/organisations/:id/scheme-prospects verified.');

  // --------------------------------------------------------------------------
  // TEST 5: Scheme Prospect Update & List Query
  // --------------------------------------------------------------------------
  console.log('5. Testing Scheme Prospect Update & Listing...');
  const updateSpPayload: UpdateSchemeProspectDto = {
    estimatedUnitCount: 96,
    notes: 'Updated unit count following sectional survey verification.',
  };

  const updateSpRes = await executeApiRequest(
    app,
    'PATCH',
    `/api/v1/scheme-prospects/${createdSp.id}`,
    adminToken,
    updateSpPayload
  );

  assert.strictEqual(updateSpRes.code, 200);
  assert.strictEqual(updateSpRes.body.data.estimatedUnitCount, 96);
  console.log('   ✓ Scheme prospect unit count updated to 96.');

  // List scheme prospects
  const listSpRes = await executeApiRequest(
    app,
    'GET',
    '/api/v1/scheme-prospects?pageSize=10',
    adminToken
  );

  assert.strictEqual(listSpRes.code, 200);
  assert.ok(Array.isArray(listSpRes.body.data));
  assert.ok(listSpRes.body.pagination);
  console.log('   ✓ Scheme prospects list query with pagination envelope verified.');

  // --------------------------------------------------------------------------
  // TEST 6: Security Authorization Gates (403 Forbidden)
  // --------------------------------------------------------------------------
  console.log('6. Testing Security Authorization Gates (403 Forbidden)...');
  const forbiddenCreateOrg = await executeApiRequest(
    app,
    'POST',
    '/api/v1/organisations',
    trusteeToken,
    createOrgPayload
  );
  assert.strictEqual(forbiddenCreateOrg.code, 403);

  const forbiddenCreateSp = await executeApiRequest(
    app,
    'POST',
    '/api/v1/scheme-prospects',
    trusteeToken,
    createSpPayload
  );
  assert.strictEqual(forbiddenCreateSp.code, 403);
  console.log('   ✓ Restricted roles (SCHEME_TRUSTEE) blocked with HTTP 403 FORBIDDEN.');

  // --------------------------------------------------------------------------
  // TEST 7: Validation Error Rejection (422)
  // --------------------------------------------------------------------------
  console.log('7. Testing Validation Error Rejections (422)...');
  const invalidOrgRes = await executeApiRequest(
    app,
    'POST',
    '/api/v1/organisations',
    adminToken,
    {
      name: 'A', // Too short (min 2)
      email: 'not-an-email',
    }
  );
  assert.strictEqual(invalidOrgRes.code, 422);
  console.log('   ✓ Invalid payload rejected with HTTP 422 VALIDATION_ERROR.');

  // --------------------------------------------------------------------------
  // TEST 8: Soft Deletion
  // --------------------------------------------------------------------------
  console.log('8. Testing Soft Deletion Architecture...');
  const deleteSpRes = await executeApiRequest(
    app,
    'DELETE',
    `/api/v1/scheme-prospects/${createdSp.id}`,
    adminToken
  );
  assert.strictEqual(deleteSpRes.code, 200);
  assert.strictEqual(deleteSpRes.body.data.deleted, true);

  const deleteOrgRes = await executeApiRequest(
    app,
    'DELETE',
    `/api/v1/organisations/${createdOrg.id}`,
    adminToken
  );
  assert.strictEqual(deleteOrgRes.code, 200);
  assert.strictEqual(deleteOrgRes.body.data.deleted, true);
  console.log('   ✓ Soft deletion confirmed for Scheme Prospect & Organisation records.');

  console.log('\n====================================================');
  console.log('✅ ALL CRM ORGANISATIONS & SCHEME PROSPECTS TESTS PASSED');
  console.log('====================================================\n');
}

if (process.argv[1]?.endsWith('crm-organisations.test.ts')) {
  runCrmOrganisationsTests().catch((err) => {
    console.error('CRM Organisations test suite failed:', err);
    process.exit(1);
  });
}
