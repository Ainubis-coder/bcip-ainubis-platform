/**
 * BCIP Ainubis CRM Executive Intelligence, Reporting & Governance Test Suite
 * Phase 2E — Prompt 002E-008
 */

import assert from 'assert';
import { createApiApp } from '../apps/api/src/server.ts';
import {
  leadRepository,
  opportunityRepository,
  taskRepository,
  workflowRunRepository,
  portfolioSnapshotRepository,
  portfolioSignalRepository,
  portfolioRiskRepository,
  portfolioTrendRepository,
  portfolioInsightRepository,
  portfolioAnalysisRunRepository,
  executiveReportRepository,
  reportApprovalRecordRepository,
  ainubisPortfolioIntelligenceService,
  ainubisExecutiveReportingService,
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

export async function runAinubisExecutiveReportingTests() {
  console.log('====================================================');
  console.log('BCIP — Phase 2E Prompt 002E-008: Executive Reporting Tests');
  console.log('====================================================');

  const app = createApiApp();
  const tenantA = 'ten_rep_a';
  const tenantB = 'ten_rep_b';

  const adminUserA: UserAccount = {
    id: 'usr_rep_admin_a',
    fullName: 'Alex Report Admin A',
    email: 'alex.report@apex.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'ARA',
    tenantId: tenantA,
    tenantName: 'Apex Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const adminUserB: UserAccount = {
    id: 'usr_rep_admin_b',
    fullName: 'Bianca Report Admin B',
    email: 'bianca.report@beacon.co.za',
    role: 'MANAGING_AGENT_ADMIN',
    initials: 'BRA',
    tenantId: tenantB,
    tenantName: 'Beacon Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
  };

  const trusteeUserA: UserAccount = {
    id: 'usr_rep_trustee_a',
    fullName: 'Tim Trustee',
    email: 'tim@scheme.co.za',
    role: 'SCHEME_TRUSTEE', // Lacks executive report rights
    initials: 'TT',
    tenantId: tenantA,
    tenantName: 'Apex Agency',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
  };

  const tokenAdminA = createClientAuthToken(adminUserA, tenantA);
  const tokenAdminB = createClientAuthToken(adminUserB, tenantB);
  const tokenTrusteeA = createClientAuthToken(trusteeUserA, tenantA);

  // Clear previous states
  portfolioSnapshotRepository.clear();
  portfolioSignalRepository.clear();
  portfolioRiskRepository.clear();
  portfolioTrendRepository.clear();
  portfolioInsightRepository.clear();
  portfolioAnalysisRunRepository.clear();
  executiveReportRepository.clear();
  reportApprovalRecordRepository.clear();

  // ==========================================================================
  // Test 1: Reporting Period Validation Rules
  // ==========================================================================
  console.log('Test 1: Verifying Reporting Period Validation...');

  const badPeriod1 = {
    reportType: 'EXECUTIVE_PORTFOLIO_BRIEF' as const,
    reportingPeriod: 'WEEKLY' as const,
    periodStart: '2026-10-05',
    periodEnd: '2026-10-01', // prior to start
  };

  const badPeriod2 = {
    reportType: 'EXECUTIVE_PORTFOLIO_BRIEF' as const,
    reportingPeriod: 'WEEKLY' as const,
    periodStart: '2026-10-01',
    periodEnd: '2030-10-01', // future
  };

  await assert.rejects(
    async () => {
      await ainubisExecutiveReportingService.generateReport(tenantA, badPeriod1);
    },
    /cannot be prior to start date/
  );

  await assert.rejects(
    async () => {
      await ainubisExecutiveReportingService.generateReport(tenantA, badPeriod2);
    },
    /Future reporting periods without explicit system support are rejected/
  );

  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 2: Report Auto-seeding Snapshots
  // ==========================================================================
  console.log('Test 2: Verifying Snapshot Auto-Seeding during Generation...');

  // Seeding blank dependencies for tenantA, expect a default snapshot generated automatically
  const validPeriod = {
    reportType: 'EXECUTIVE_PORTFOLIO_BRIEF' as const,
    reportingPeriod: 'WEEKLY' as const,
    periodStart: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
  };

  const initialReport = await ainubisExecutiveReportingService.generateReport(tenantA, validPeriod, 'system-test');
  assert.strictEqual(initialReport.version, 1);
  assert.strictEqual(initialReport.status, 'REVIEW_REQUIRED');
  
  // Verify that snapshot got auto-generated and stored in DB
  const latestSnap = await portfolioSnapshotRepository.getLatest(tenantA);
  assert.notStrictEqual(latestSnap, null);
  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 3: Confidence & Quality Ratings
  // ==========================================================================
  console.log('Test 3: Verifying Confidence and Quality Scoring Rules...');

  // When trends are empty or opportunities is 0, confidence must drop to LOW and qualityState to INSUFFICIENT_DATA
  assert.strictEqual(initialReport.confidence, 'LOW');
  assert.strictEqual(initialReport.qualityState, 'INSUFFICIENT_DATA');

  // Let's seed trends and snapshot metrics to verify HIGH confidence triggering
  await portfolioTrendRepository.create({
    id: 'tr_test_1',
    tenantId: tenantA,
    metricName: 'pipeline_velocity',
    direction: 'UP',
    period: '7 DAYS',
    history: [{ date: new Date().toISOString(), value: 10 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed opportunities and replace latest snapshot
  await opportunityRepository.create({
    id: 'opp_test_1',
    tenantId: tenantA,
    name: 'Signal Tower BC',
    stage: 'PROPOSAL' as any,
    estimatedValue: 100000,
    currency: 'ZAR',
    probability: 60,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Trigger snapshot update
  await ainubisPortfolioIntelligenceService.analyzePortfolio(tenantA, 'updater');

  const nextReport = await ainubisExecutiveReportingService.generateReport(tenantA, validPeriod, 'system-test');
  assert.strictEqual(nextReport.confidence, 'HIGH');
  assert.strictEqual(nextReport.qualityState, 'COMPLETE');
  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 4: Evidence Grounding and Hallucination Protection
  // ==========================================================================
  console.log('Test 4: Verifying Grounded Evidence Collection...');
  
  // Sections must refer to live elements
  assert.ok(nextReport.evidence.length > 0, 'Evidence list must contain mapped facts.');
  const mappedTaskEvidence = nextReport.evidence.some(ev => ev.sourceType === 'opportunity');
  assert.ok(mappedTaskEvidence, 'Trace evidence must map back to CRM database opportunity records.');
  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 5: Report Version Progression (Consequent runs)
  // ==========================================================================
  console.log('Test 5: Verifying Consequent Version Incrementation...');

  const versionedReport = await ainubisExecutiveReportingService.generateReport(tenantA, validPeriod, 'updater');
  assert.strictEqual(versionedReport.version, nextReport.version + 1, 'Version number must increment cleanly.');
  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 6: Human Peer Review & Immutable Signature State Machine
  // ==========================================================================
  console.log('Test 6: Verifying State Machine Transitions & Approval Signatures...');

  // Rejection moves from REVIEW_REQUIRED to DRAFT
  const rejectedReport = await ainubisExecutiveReportingService.rejectReport(
    tenantA,
    versionedReport.id,
    'usr_rep_admin_a',
    'alex.report@apex.co.za',
    'Friction values too high.'
  );
  assert.strictEqual(rejectedReport.status, 'DRAFT');

  // Verify signature log created
  const rejectSign = await reportApprovalRecordRepository.findAll(tenantA);
  const foundRej = rejectSign.find(s => s.decision === 'REJECTED');
  assert.notStrictEqual(foundRej, undefined);
  assert.strictEqual(foundRej?.reason, 'Friction values too high.');

  // Submit back for review / review manually via endpoint
  const resubmittedReport = await executiveReportRepository.update(tenantA, versionedReport.id, {
    status: 'REVIEW_REQUIRED',
    updatedAt: new Date().toISOString(),
  });

  // Approve report
  const approvedReport = await ainubisExecutiveReportingService.approveReport(
    tenantA,
    versionedReport.id,
    'usr_rep_admin_a',
    'alex.report@apex.co.za',
    'Reviewed and sign-off confirmed.'
  );
  assert.strictEqual(approvedReport.status, 'APPROVED');

  // Verify approval signature log
  const approvalSign = await reportApprovalRecordRepository.findAll(tenantA);
  const foundAppr = approvalSign.find(s => s.decision === 'APPROVED');
  assert.notStrictEqual(foundAppr, undefined);
  assert.strictEqual(foundAppr?.reason, 'Reviewed and sign-off confirmed.');

  // Publish report
  const publishedReport = await ainubisExecutiveReportingService.publishReport(
    tenantA,
    versionedReport.id,
    'usr_rep_admin_a',
    'alex.report@apex.co.za'
  );
  assert.strictEqual(publishedReport.status, 'PUBLISHED');

  // Archive report
  const archivedReport = await ainubisExecutiveReportingService.archiveReport(
    tenantA,
    versionedReport.id,
    'usr_rep_admin_a'
  );
  assert.strictEqual(archivedReport.status, 'ARCHIVED');
  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 7: REST API Endpoints & RBAC Gates
  // ==========================================================================
  console.log('Test 7: Verifying REST API Routing & RBAC Security Gates...');

  // Seeding fresh report for API checks
  const apiReport = await ainubisExecutiveReportingService.generateReport(tenantA, {
    reportType: 'RISK_AND_PRIORITY_REPORT',
    reportingPeriod: 'DAILY',
    periodStart: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
  });

  // A. List reports (Admin A)
  const listRes = await executeRequest(app, 'GET', '/api/v1/ai/reports', {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(listRes.code, 200);
  assert.ok(Array.isArray(listRes.body.data));
  assert.ok(listRes.body.data.length > 0);

  // B. Get report by ID (Admin A)
  const getRes = await executeRequest(app, 'GET', `/api/v1/ai/reports/${apiReport.id}`, {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(getRes.code, 200);
  assert.strictEqual(getRes.body.data.id, apiReport.id);

  // C. Generate report via API (Admin A)
  const genRes = await executeRequest(app, 'POST', '/api/v1/ai/reports/generate', {
    authorization: `Bearer ${tokenAdminA}`,
  }, {
    reportType: 'OPERATIONAL_HEALTH_REPORT',
    reportingPeriod: 'MONTHLY',
    periodStart: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
    title: 'Monthly Ops Dashboard',
  });
  assert.strictEqual(genRes.code, 201);
  assert.strictEqual(genRes.body.data.status, 'REVIEW_REQUIRED');

  const generatedId = genRes.body.data.id;

  // D. Approve report via API (Admin A)
  const approveRes = await executeRequest(app, 'POST', `/api/v1/ai/reports/${generatedId}/approve`, {
    authorization: `Bearer ${tokenAdminA}`,
  }, {
    reason: 'Approved via API Gateway triggers',
  });
  assert.strictEqual(approveRes.code, 200);
  assert.strictEqual(approveRes.body.data.status, 'APPROVED');

  // E. Publish report via API (Admin A)
  const publishRes = await executeRequest(app, 'POST', `/api/v1/ai/reports/${generatedId}/publish`, {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(publishRes.code, 200);
  assert.strictEqual(publishRes.body.data.status, 'PUBLISHED');

  // F. Export payload preserves all metadata (Admin A)
  const exportRes = await executeRequest(app, 'POST', `/api/v1/ai/reports/${generatedId}/export`, {
    authorization: `Bearer ${tokenAdminA}`,
  });
  assert.strictEqual(exportRes.code, 200);
  const exportedReport = JSON.parse(exportRes.body);
  assert.strictEqual(exportedReport.id, generatedId);
  assert.strictEqual(exportedReport.status, 'PUBLISHED');

  // G. Trustee (Unauthorized Role) is blocked from generation
  const forbiddenRes = await executeRequest(app, 'POST', '/api/v1/ai/reports/generate', {
    authorization: `Bearer ${tokenTrusteeA}`,
  }, {
    reportType: 'EXECUTIVE_PORTFOLIO_BRIEF',
    reportingPeriod: 'WEEKLY',
    periodStart: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
  });
  assert.strictEqual(forbiddenRes.code, 403, 'Scheme Trustee must receive 403 Forbidden on reports generation');

  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 8: Metadata and Export
  // ==========================================================================
  console.log('Test 8: Verifying Metadata and Export Compliance...');
  // Metadata is fully preserved in exported content
  assert.strictEqual(exportedReport.version, 1);
  assert.ok(Array.isArray(exportedReport.evidence));
  console.log('   ✓ Passed.');

  // ==========================================================================
  // Test 9: Strict Multi-Tenant Isolation
  // ==========================================================================
  console.log('Test 9: Verifying Strict Multi-Tenant Isolation on Reports...');

  // Admin B should not see Admin A's reports
  const listB = await executeRequest(app, 'GET', '/api/v1/ai/reports', {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(listB.code, 200);
  assert.strictEqual(listB.body.data.length, 0, 'Tenant B must not see Tenant A reports');

  // Admin B should not be allowed to fetch Admin A's report by ID
  const forbiddenIdRes = await executeRequest(app, 'GET', `/api/v1/ai/reports/${generatedId}`, {
    authorization: `Bearer ${tokenAdminB}`,
  });
  assert.strictEqual(forbiddenIdRes.code, 404, 'Tenant B querying Tenant A report by ID must return 404 Not Found (isolated)');

  console.log('   ✓ Passed.');

  console.log('\n====================================================');
  console.log('✅ ALL AINUBIS EXECUTIVE REPORTING TESTS PASSED');
  console.log('====================================================\n');
}
