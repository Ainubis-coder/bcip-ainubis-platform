/**
 * BCIP Ainubis CRM Portfolio Intelligence Repositories
 * Phase 2E — Prompt 002E-007
 */

import { BaseCrmRepository } from './base.repository.ts';
import {
  type PortfolioSnapshot,
  type PortfolioSignal,
  type PortfolioRisk,
  type PortfolioTrend,
  type PortfolioInsight,
  type PortfolioAnalysisRun,
} from '../portfolio-types.ts';

export class PortfolioSnapshotRepository extends BaseCrmRepository<PortfolioSnapshot> {
  constructor() {
    super('crm_ai_portfolio_snapshots');
  }

  public async getLatest(tenantId: string): Promise<PortfolioSnapshot | null> {
    const list = await this.findAll(tenantId);
    if (list.length === 0) return null;
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0];
  }
}

export class PortfolioSignalRepository extends BaseCrmRepository<PortfolioSignal> {
  constructor() {
    super('crm_ai_portfolio_signals');
  }

  public generateSignalId(prefix: string = 'sig'): string {
    return this.generateId(prefix);
  }
}

export class PortfolioRiskRepository extends BaseCrmRepository<PortfolioRisk> {
  constructor() {
    super('crm_ai_portfolio_risks');
  }
}

export class PortfolioTrendRepository extends BaseCrmRepository<PortfolioTrend> {
  constructor() {
    super('crm_ai_portfolio_trends');
  }
}

export class PortfolioInsightRepository extends BaseCrmRepository<PortfolioInsight> {
  constructor() {
    super('crm_ai_portfolio_insights');
  }
}

export class PortfolioAnalysisRunRepository extends BaseCrmRepository<PortfolioAnalysisRun> {
  constructor() {
    super('crm_ai_portfolio_analysis_runs');
  }

  public async getLatestRun(tenantId: string): Promise<PortfolioAnalysisRun | null> {
    const list = await this.findAll(tenantId);
    if (list.length === 0) return null;
    list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return list[0];
  }
}

export const portfolioSnapshotRepository = new PortfolioSnapshotRepository();
export const portfolioSignalRepository = new PortfolioSignalRepository();
export const portfolioRiskRepository = new PortfolioRiskRepository();
export const portfolioTrendRepository = new PortfolioTrendRepository();
export const portfolioInsightRepository = new PortfolioInsightRepository();
export const portfolioAnalysisRunRepository = new PortfolioAnalysisRunRepository();
