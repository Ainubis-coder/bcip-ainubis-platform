/**
 * BCIP Ainubis CRM Executive Reporting Repositories
 * Phase 2E — Prompt 002E-008
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import { type ExecutiveReport, type ReportApprovalRecord } from '../report-types.ts';

export interface ReportQueryOptions extends QueryOptions {
  reportType?: string;
  status?: string;
  reportingPeriod?: string;
}

export class ExecutiveReportRepository extends BaseCrmRepository<ExecutiveReport> {
  constructor() {
    super('crm_ai_executive_reports');
  }

  /**
   * Find all versions of a specific report.
   * Reports are uniquely identified by a combination of (tenantId, reportType, reportingPeriod)
   * or we can just fetch all records with the same title or matching reportType and reportingPeriod.
   */
  public async findReportVersions(
    tenantId: string,
    reportType: string,
    reportingPeriod: string
  ): Promise<ExecutiveReport[]> {
    const list = await this.findAll(tenantId);
    return list
      .filter((r) => r.reportType === reportType && r.reportingPeriod === reportingPeriod)
      .sort((a, b) => b.version - a.version);
  }

  /**
   * Get the latest version of a specific report type.
   */
  public async getLatestVersion(
    tenantId: string,
    reportType: string,
    reportingPeriod: string
  ): Promise<ExecutiveReport | null> {
    const versions = await this.findReportVersions(tenantId, reportType, reportingPeriod);
    return versions.length > 0 ? versions[0] : null;
  }
}

export class ReportApprovalRecordRepository extends BaseCrmRepository<ReportApprovalRecord> {
  constructor() {
    super('crm_ai_report_approval_records');
  }

  public async getApprovalHistory(tenantId: string, reportId: string): Promise<ReportApprovalRecord[]> {
    const list = await this.findAll(tenantId);
    return list
      .filter((r) => r.reportId === reportId)
      .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
  }
}

export const executiveReportRepository = new ExecutiveReportRepository();
export const reportApprovalRecordRepository = new ReportApprovalRecordRepository();
