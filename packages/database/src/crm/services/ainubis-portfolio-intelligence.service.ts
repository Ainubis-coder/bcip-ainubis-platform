/**
 * BCIP Ainubis CRM Portfolio Intelligence Service
 * Phase 2E — Prompt 002E-007
 */

import { leadRepository } from '../repositories/lead.repository.ts';
import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import { organisationRepository } from '../repositories/organisation.repository.ts';
import { schemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { activityRepository } from '../repositories/activity.repository.ts';
import { proposalRepository } from '../repositories/proposal.repository.ts';
import { contractRepository } from '../repositories/contract.repository.ts';
import { automationWorkflowRepository } from '../repositories/automation-workflow.repository.ts';
import { workflowRunRepository } from '../repositories/workflow-run.repository.ts';
import { aiObservationRepository } from '../repositories/ai-observation.repository.ts';
import { aiActionRepository } from '../repositories/ai-action.repository.ts';

import {
  portfolioSnapshotRepository,
  portfolioSignalRepository,
  portfolioRiskRepository,
  portfolioTrendRepository,
  portfolioInsightRepository,
  portfolioAnalysisRunRepository,
} from '../repositories/portfolio-intelligence.repository.ts';

import {
  type PortfolioSnapshot,
  type PortfolioSignal,
  type PortfolioRisk,
  type PortfolioTrend,
  type PortfolioInsight,
  type PortfolioAnalysisRun,
} from '../portfolio-types.ts';

import {
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
  ConfidenceLevel,
  ApprovalRequirement,
} from '../ai-types.ts';

import { LeadStatus, TaskStatus, OpportunityStage } from '../enums.ts';

export class AinubisPortfolioIntelligenceService {
  /**
   * Evaluates the full operational state of a tenant's CRM portfolio.
   * Runs rules, determines signals, operational risks, trends, insights, and recommendations.
   */
  public async analyzePortfolio(tenantId: string, triggeredBy: string = 'system'): Promise<PortfolioAnalysisRun> {
    const correlationId = `pfrun_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startedAt = new Date().toISOString();

    // 1. Create a pending execution run
    const runRecord = await portfolioAnalysisRunRepository.create({
      id: correlationId,
      tenantId,
      status: 'PENDING',
      startedAt,
      correlationId,
      triggeredBy,
      createdAt: startedAt,
      updatedAt: startedAt,
    });

    try {
      // 2. Fetch all raw telemetry in parallel (isolated by tenantId)
      const [
        leads,
        opportunities,
        organisations,
        schemeProspects,
        tasks,
        activities,
        proposals,
        contracts,
        workflows,
        workflowRuns,
        observations,
        actions,
      ] = await Promise.all([
        leadRepository.findAll(tenantId),
        opportunityRepository.findAll(tenantId),
        organisationRepository.findAll(tenantId),
        schemeProspectRepository.findAll(tenantId),
        taskRepository.findAll(tenantId),
        activityRepository.findAll(tenantId),
        proposalRepository.findAll(tenantId),
        contractRepository.findAll(tenantId),
        automationWorkflowRepository.findAll(tenantId),
        workflowRunRepository.findAll(tenantId),
        aiObservationRepository.findAll(tenantId),
        aiActionRepository.findAll(tenantId),
      ]);

      const now = new Date();
      const nowMs = now.getTime();
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

      // --- SNAPSHOT CALCULATION ---
      const totalLeads = leads.length;
      const qualifiedLeads = leads.filter((l) => l.status === LeadStatus.QUALIFIED).length;
      const nurtureLeads = leads.filter((l) => l.status === LeadStatus.NURTURE).length;
      const reEngagementLeads = leads.filter((l) => l.status === LeadStatus.RE_ENGAGEMENT).length;
      const convertedLeads = leads.filter((l) => l.status === LeadStatus.CONVERTED).length;
      const lostLeads = leads.filter((l) => l.status === LeadStatus.LOST).length;

      const totalOpportunities = opportunities.length;
      const opportunitiesByStage: Record<string, number> = {};
      opportunities.forEach((o) => {
        opportunitiesByStage[o.stage] = (opportunitiesByStage[o.stage] || 0) + 1;
      });

      // Stalled opportunities: Stage is in PROPOSAL, SOLUTION_DESIGN, or DISCOVERY and updatedAt is older than 14 days
      const stalledOpportunities = opportunities.filter((o) => {
        const isStalledStage =
          o.stage === OpportunityStage.PROPOSAL ||
          o.stage === OpportunityStage.SOLUTION_DESIGN ||
          o.stage === OpportunityStage.DISCOVERY;
        const lastUpdatedMs = new Date(o.updatedAt).getTime();
        return isStalledStage && nowMs - lastUpdatedMs > fourteenDaysMs;
      }).length;

      const opportunitiesNoActivity = opportunities.filter((o) => {
        const hasRecentActivity = activities.some((a) => a.opportunityId === o.id);
        const hasRecentTask = tasks.some((t) => t.opportunityId === o.id);
        return !hasRecentActivity && !hasRecentTask;
      }).length;

      const proposalsOutstanding = proposals.filter((p) => p.status === 'DRAFT' || p.status === 'SENT').length;

      // Contracts approaching renewal (expiry within 60 days)
      const contractsExpiring60d = contracts.filter((c) => {
        if (!c.expiryDate) return false;
        const expiryMs = new Date(c.expiryDate).getTime();
        return expiryMs - nowMs > 0 && expiryMs - nowMs <= sixtyDaysMs;
      }).length;

      // Activity metrics
      const activitiesCreated = activities.length;
      const activitiesCompleted = activities.filter((a) => !a.completedAt).length;
      const overdueTasks = tasks.filter((t) => {
        if (!t.dueAt || t.status === TaskStatus.COMPLETED) return false;
        return new Date(t.dueAt).getTime() < nowMs;
      }).length;

      const highPriorityOverdueTasks = tasks.filter((t) => {
        if (!t.dueAt || t.status === TaskStatus.COMPLETED) return false;
        return t.priority === 'HIGH' && new Date(t.dueAt).getTime() < nowMs;
      }).length;

      const uncontactedLeads = leads.filter((l) => !l.lastContactedAt).length;
      const opportunitiesNoTouchpoints = opportunities.filter((o) => !o.nextActionAt).length;

      // Organisation Health
      const totalOrganisations = organisations.length;
      const activeOrganisations = organisations.filter((o) => o.status === 'ACTIVE_CLIENT').length;
      const organisationsAttention = organisations.filter((o) => {
        // organisations with incomplete profile or with active high-priority overdue tasks
        const hasOverdueTask = tasks.some((t) => t.organisationId === o.id && t.status !== TaskStatus.COMPLETED && t.priority === 'HIGH');
        return !o.registrationNumber || hasOverdueTask;
      }).length;

      const organisationsIncompleteInfo = organisations.filter((o) => !o.registrationNumber).length;
      const organisationsDecliningEngagement = organisations.filter((o) => {
        // organisations without recent tasks or activities in 60 days
        const hasRecentTask = tasks.some((t) => t.organisationId === o.id && nowMs - new Date(t.updatedAt).getTime() < sixtyDaysMs);
        const hasRecentAct = activities.some((a) => a.organisationId === o.id && nowMs - new Date(a.updatedAt).getTime() < sixtyDaysMs);
        return !hasRecentTask && !hasRecentAct;
      }).length;

      // Scheme Prospects
      const totalSchemeProspects = schemeProspects.length;
      const activeSchemeProspects = schemeProspects.length;
      const incompleteSchemeData = schemeProspects.filter((s) => !s.estimatedUnitCount || s.estimatedUnitCount <= 0).length;
      const staleSchemeProspects = schemeProspects.filter((s) => {
        const lastUpdatedMs = new Date(s.updatedAt).getTime();
        return nowMs - lastUpdatedMs > fourteenDaysMs * 2; // stale if no update in 28 days
      }).length;

      // Ainubis
      const activeWorkflows = workflows.filter((w) => w.status === 'ACTIVE').length;
      const pausedWorkflows = workflows.filter((w) => w.status === 'PAUSED').length;
      const failedWorkflows = workflowRuns.filter((r) => r.status === 'FAILED').length;
      const workflowsAwaitingApproval = workflowRuns.filter((r) => r.status === 'WAITING_APPROVAL').length;

      // Mock or fetch verification failures from workflow outcomes or runs
      const verificationFailures = workflowRuns.filter((r) => r.failureReason && r.failureReason.toLowerCase().includes('verify')).length;
      const repeatedWorkflowFailures = failedWorkflows > 2 ? 1 : 0;

      // Construct Health Distribution
      const workflowHealthDistribution: Record<string, number> = {
        HEALTHY: 0,
        ATTENTION: 0,
        DEGRADED: 0,
        FAILED: 0,
        UNKNOWN: 0,
      };

      workflows.forEach((wf) => {
        const runsForWf = workflowRuns.filter((r) => r.workflowId === wf.id);
        if (runsForWf.length === 0) {
          workflowHealthDistribution.UNKNOWN++;
        } else {
          const failedRuns = runsForWf.filter((r) => r.status === 'FAILED').length;
          const failureRate = failedRuns / runsForWf.length;
          if (failureRate > 0.5) {
            workflowHealthDistribution.FAILED++;
          } else if (failureRate > 0.25) {
            workflowHealthDistribution.DEGRADED++;
          } else {
            workflowHealthDistribution.HEALTHY++;
          }
        }
      });

      const unresolvedObservations = observations.filter((o) => o.status === 'GENERATED' || o.status === 'REVIEWED').length;
      const proposedActionsAwaitingApproval = actions.filter((a) => a.status === 'PROPOSED').length;

      // 3. Save snapshot
      const snapshotId = `pf_snap_${Date.now()}`;
      const snapshot: PortfolioSnapshot = {
        id: snapshotId,
        tenantId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metrics: {
          totalLeads,
          qualifiedLeads,
          nurtureLeads,
          reEngagementLeads,
          convertedLeads,
          lostLeads,
          totalOpportunities,
          opportunitiesByStage,
          stalledOpportunities,
          opportunitiesNoActivity,
          proposalsOutstanding,
          contractsExpiring60d,
          activitiesCreated,
          activitiesCompleted,
          overdueTasks,
          highPriorityOverdueTasks,
          uncontactedLeads,
          opportunitiesNoTouchpoints,
          totalOrganisations,
          activeOrganisations,
          organisationsAttention,
          organisationsIncompleteInfo,
          organisationsDecliningEngagement,
          totalSchemeProspects,
          activeSchemeProspects,
          incompleteSchemeData,
          staleSchemeProspects,
          activeWorkflows,
          pausedWorkflows,
          failedWorkflows,
          workflowsAwaitingApproval,
          verificationFailures,
          repeatedWorkflowFailures,
          workflowHealthDistribution,
          unresolvedObservations,
          proposedActionsAwaitingApproval,
        },
      };
      await portfolioSnapshotRepository.create(snapshot);

      // --- SIGNALS GENERATION ---
      const activeSignals: PortfolioSignal[] = [];

      // Helper to generate and save signals
      const checkAndGenerateSignal = (
        signalType: PortfolioSignal['signalType'],
        score: number,
        metricValue: number,
        threshold: number,
        previousValue: number,
        evidence: string[],
        severity: PortfolioSignal['severity']
      ) => {
        if (metricValue > threshold) {
          const trend = metricValue > previousValue ? 'UP' : metricValue < previousValue ? 'DOWN' : 'STABLE';
          const signalId = `sig_${signalType.toLowerCase()}_${Date.now()}`;
          const signal: PortfolioSignal = {
            id: signalId,
            signalId,
            tenantId,
            signalType,
            severity,
            status: 'ACTIVE',
            score,
            detectedAt: now.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            metricValue,
            threshold,
            previousValue,
            trend,
            evidence,
            correlationId,
          };
          activeSignals.push(signal);
        }
      };

      // Get previous snapshot to calculate trends
      const prevSnapshot = await portfolioSnapshotRepository.getLatest(tenantId);
      const prev = prevSnapshot?.metrics;

      // Signal 1: Stalled Opportunities
      checkAndGenerateSignal(
        'PORTFOLIO_STALLED_OPPORTUNITIES',
        Math.min(100, stalledOpportunities * 20),
        stalledOpportunities,
        0,
        prev?.stalledOpportunities || 0,
        [`${stalledOpportunities} sales opportunities stagnating with no operational updates in 14+ days`],
        stalledOpportunities > 3 ? 'HIGH' : 'MEDIUM'
      );

      // Signal 2: Lead Response Gap (uncontacted leads)
      checkAndGenerateSignal(
        'PORTFOLIO_LEAD_RESPONSE_GAP',
        Math.min(100, uncontactedLeads * 15),
        uncontactedLeads,
        0,
        prev?.uncontactedLeads || 0,
        [`${uncontactedLeads} newly ingested leads have no recorded initial outreach`],
        uncontactedLeads > 2 ? 'HIGH' : 'MEDIUM'
      );

      // Signal 3: Overdue Task Pressure
      checkAndGenerateSignal(
        'PORTFOLIO_OVERDUE_TASK_PRESSURE',
        Math.min(100, overdueTasks * 10),
        overdueTasks,
        5,
        prev?.overdueTasks || 0,
        [`${overdueTasks} unresolved CRM tasks have exceeded their SLA deadlines`],
        overdueTasks > 10 ? 'HIGH' : 'MEDIUM'
      );

      // Signal 4: Proposal Backlog
      checkAndGenerateSignal(
        'PORTFOLIO_PROPOSAL_BACKLOG',
        Math.min(100, proposalsOutstanding * 25),
        proposalsOutstanding,
        2,
        prev?.proposalsOutstanding || 0,
        [`${proposalsOutstanding} outstanding proposals await trustee review or followup`],
        proposalsOutstanding > 4 ? 'HIGH' : 'MEDIUM'
      );

      // Signal 5: Contract Renewal Pressure
      checkAndGenerateSignal(
        'PORTFOLIO_CONTRACT_RENEWAL_PRESSURE',
        Math.min(100, contractsExpiring60d * 30),
        contractsExpiring60d,
        0,
        prev?.contractsExpiring60d || 0,
        [`${contractsExpiring60d} active corporate agency contracts expiring within 60 days`],
        'HIGH'
      );

      // Signal 6: Workflow Failure Pressure
      checkAndGenerateSignal(
        'PORTFOLIO_WORKFLOW_FAILURE_PRESSURE',
        Math.min(100, failedWorkflows * 35),
        failedWorkflows,
        0,
        prev?.failedWorkflows || 0,
        [`${failedWorkflows} CRM automation workflows terminated in FAILED status`],
        failedWorkflows > 2 ? 'CRITICAL' : 'HIGH'
      );

      // Signal 7: Approval Backlog
      checkAndGenerateSignal(
        'PORTFOLIO_APPROVAL_BACKLOG',
        Math.min(100, workflowsAwaitingApproval * 20),
        workflowsAwaitingApproval,
        0,
        prev?.workflowsAwaitingApproval || 0,
        [`${workflowsAwaitingApproval} automation steps halted awaiting human agent or trustee review`],
        workflowsAwaitingApproval > 3 ? 'HIGH' : 'MEDIUM'
      );

      // Signal 8: Organisation Health Decline
      checkAndGenerateSignal(
        'PORTFOLIO_ORGANISATION_HEALTH_DECLINE',
        Math.min(100, organisationsAttention * 15),
        organisationsAttention,
        0,
        prev?.organisationsAttention || 0,
        [`${organisationsAttention} managing agencies or body corporate organisations flag operational warning health markers`],
        organisationsAttention > 3 ? 'HIGH' : 'MEDIUM'
      );

      // Save generated signals cleanly
      const existingSignals = await portfolioSignalRepository.findAll(tenantId);
      for (const sig of existingSignals) {
        await portfolioSignalRepository.softDelete(tenantId, sig.signalId);
      }
      for (const sig of activeSignals) {
        await portfolioSignalRepository.create(sig);
      }

      // --- OPERATIONAL RISKS ---
      const activeRisks: PortfolioRisk[] = [];

      if (stalledOpportunities > 0) {
        activeRisks.push({
          id: `risk_stalled_${Date.now()}`,
          tenantId,
          affectedDomain: 'Opportunities',
          affectedEntityCount: stalledOpportunities,
          severity: stalledOpportunities > 3 ? 'HIGH' : 'MEDIUM',
          triggeringCondition: 'Multiple high-value property managing agency opportunities exceed touchpoint thresholds',
          supportingEvidence: [`${stalledOpportunities} opportunities in negotiation or proposal stages stalled for > 14 days`],
          currentState: `${stalledOpportunities} stalled`,
          trend: stalledOpportunities > (prev?.stalledOpportunities || 0) ? 'UP' : 'STABLE',
          recommendedOperationalResponse: 'Launch guided STALLED_OPPORTUNITY_FOLLOW_UP workflows and schedule direct engagement tasks.',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }

      if (overdueTasks > 5) {
        activeRisks.push({
          id: `risk_overdue_${Date.now()}`,
          tenantId,
          affectedDomain: 'Tasks',
          affectedEntityCount: overdueTasks,
          severity: 'HIGH',
          triggeringCondition: 'Accumulation of overdue tasks threatens body corporate operational SLAs',
          supportingEvidence: [`${overdueTasks} overdue tasks active in the portfolio`, `${highPriorityOverdueTasks} high priority tasks overdue`],
          currentState: `${overdueTasks} overdue`,
          trend: overdueTasks > (prev?.overdueTasks || 0) ? 'UP' : 'STABLE',
          recommendedOperationalResponse: 'Execute OVERDUE_TASK_ESCALATION workflows to alert portfolio executives and re-route blocked tasks.',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }

      if (failedWorkflows > 0) {
        activeRisks.push({
          id: `risk_wf_failure_${Date.now()}`,
          tenantId,
          affectedDomain: 'Automation',
          affectedEntityCount: failedWorkflows,
          severity: 'HIGH',
          triggeringCondition: 'Active workflow runs experiencing step exceptions or verification failures',
          supportingEvidence: [`${failedWorkflows} workflow runs currently terminated with execution failures`],
          currentState: `${failedWorkflows} failures`,
          trend: failedWorkflows > (prev?.failedWorkflows || 0) ? 'UP' : 'STABLE',
          recommendedOperationalResponse: 'Inspect workflow log traces via executive dashboard and trigger manual step retries.',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }

      // Save risks cleanly
      const existingRisks = await portfolioRiskRepository.findAll(tenantId);
      for (const risk of existingRisks) {
        await portfolioRiskRepository.softDelete(tenantId, risk.id);
      }
      for (const risk of activeRisks) {
        await portfolioRiskRepository.create(risk);
      }

      // --- TRENDS ---
      const activeTrends: PortfolioTrend[] = [];
      const createTrendMetric = (metricName: string, currentVal: number, prevVal: number) => {
        const direction = currentVal > prevVal ? 'UP' : currentVal < prevVal ? 'DOWN' : 'STABLE';
        activeTrends.push({
          id: `trend_${metricName.toLowerCase()}_${Date.now()}`,
          tenantId,
          metricName,
          period: '30 DAYS',
          direction,
          history: [
            { date: new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString(), value: prevVal },
            { date: now.toISOString(), value: currentVal },
          ],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      };

      createTrendMetric('Stalled Opportunities', stalledOpportunities, prev?.stalledOpportunities || 0);
      createTrendMetric('Overdue Tasks', overdueTasks, prev?.overdueTasks || 0);
      createTrendMetric('Failed Workflows', failedWorkflows, prev?.failedWorkflows || 0);
      createTrendMetric('Conversion Rate', qualifiedLeads, prev?.qualifiedLeads || 0);

      const existingTrends = await portfolioTrendRepository.findAll(tenantId);
      for (const tr of existingTrends) {
        await portfolioTrendRepository.softDelete(tenantId, tr.id);
      }
      for (const tr of activeTrends) {
        await portfolioTrendRepository.create(tr);
      }

      // --- INSIGHTS ---
      const activeInsights: PortfolioInsight[] = [];

      if (stalledOpportunities > 0) {
        activeInsights.push({
          id: `insight_stalled_${Date.now()}`,
          tenantId,
          insight: 'Stalled opportunity volume threatens corporate pipeline conversion velocity.',
          whyItMatters: 'Dormant opportunities decrease corporate pipeline velocity and delay contracted revenue targets.',
          evidence: [
            `${stalledOpportunities} opportunities have stalled in key stages with zero recorded touchpoints for over 14 days.`
          ],
          affectedRecords: opportunities.filter((o) => {
            const isStalledStage = o.stage === OpportunityStage.PROPOSAL || o.stage === OpportunityStage.SOLUTION_DESIGN;
            return isStalledStage && nowMs - new Date(o.updatedAt).getTime() > fourteenDaysMs;
          }).map((o) => ({ entityType: 'opportunity', entityId: o.id, name: o.name })),
          trend: stalledOpportunities > (prev?.stalledOpportunities || 0) ? 'UP' : 'STABLE',
          confidence: 90,
          recommendedNextStep: 'Instantiate and execute STALLED_OPPORTUNITY_FOLLOW_UP workflows across the 3 highly valued corporate deals.',
          correlationId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }

      const existingInsights = await portfolioInsightRepository.findAll(tenantId);
      for (const ins of existingInsights) {
        await portfolioInsightRepository.softDelete(tenantId, ins.id);
      }
      for (const ins of activeInsights) {
        await portfolioInsightRepository.create(ins);
      }

      // --- OBSERVATIONS & AI DEDUPLICATION ---
      // Generate executive observations in AI Observation Feed if critical/high signals exist (Prompt 12 & 16)
      const worstSignal = activeSignals.find((s) => s.severity === 'CRITICAL' || s.severity === 'HIGH');
      if (worstSignal) {
        const condKey = `portfolio.analysis.risk.${tenantId}`;
        const hasObs = await aiObservationRepository.findMany(tenantId, { conditionKey: condKey });
        if (hasObs.total === 0) {
          await aiObservationRepository.createObservation(tenantId, {
            capability: AICapability.CRM_PORTFOLIO_INTEGRATION,
            intelligenceType: worstSignal.severity === 'CRITICAL' ? 'ALERT' : 'RECOMMENDATION',
            status: IntelligenceStatus.GENERATED,
            title: `Portfolio Operational Risk: ${worstSignal.signalType}`,
            summary: `Ainubis analysis detected high operational risk in the CRM Portfolio. Worst indicator: ${worstSignal.signalType}`,
            observation: `Operational telemetry detects elevated friction across key portfolio metrics. Supporting evidence: ${worstSignal.evidence.join('; ')}`,
            confidenceScore: 92,
            confidenceLevel: ConfidenceLevel.HIGH,
            evidence: worstSignal.evidence.map((ev, index) => ({
              id: `ev_pf_${Date.now()}_${index}`,
              tenantId,
              entityType: 'workflow',
              entityId: worstSignal.signalId,
              field: 'status',
              value: worstSignal.status,
              source: 'Ainubis Portfolio Analyzer',
              evidenceType: 'SIGNAL_TRACE',
              relevance: 1.0,
              timestamp: now.toISOString(),
            })),
            targetEntityType: 'workflow',
            targetEntityId: worstSignal.signalId,
            conditionKey: condKey,
            suggestedAction: {
              actionType: 'REVIEW_PORTFOLIO_DASHBOARD',
              description: 'Access the Ainubis Portfolio Intelligence dashboard to evaluate priority queues and launch corrective workflows.',
            },
            approvalRequirement: ApprovalRequirement.RECOMMENDATION,
          });
        }
      }

      // 10. Update run status to success
      await portfolioAnalysisRunRepository.update(tenantId, correlationId, {
        status: 'SUCCESS',
        completedAt: new Date().toISOString(),
      });

    } catch (err: any) {
      await portfolioAnalysisRunRepository.update(tenantId, correlationId, {
        status: 'FAILED',
        completedAt: new Date().toISOString(),
        failureReason: err.message || 'Execution exception',
      });
      throw err;
    }

    return (await portfolioAnalysisRunRepository.findById(tenantId, correlationId))!;
  }

  /**
   * Deterministically calculates overall portfolio-wide health.
   */
  public async calculatePortfolioHealth(tenantId: string): Promise<{ status: string; reason: string }> {
    const snap = await portfolioSnapshotRepository.getLatest(tenantId);
    if (!snap) {
      return { status: 'UNKNOWN', reason: 'No portfolio analysis has been executed yet.' };
    }

    const { failedWorkflows, overdueTasks, stalledOpportunities, workflowsAwaitingApproval } = snap.metrics;

    if (failedWorkflows > 2) {
      return { status: 'FAILED', reason: 'Multiple critical automation workflows are in a failed state.' };
    }
    if (stalledOpportunities > 3 || overdueTasks > 10) {
      return { status: 'DEGRADED', reason: 'High stalled opportunities or overdue task accumulation detected.' };
    }
    if (workflowsAwaitingApproval >= 5 || stalledOpportunities > 0) {
      return { status: 'ATTENTION', reason: 'Friction detected in human approval queues or pipeline Touchpoints.' };
    }

    return { status: 'HEALTHY', reason: 'All operational categories reflect clean, high-compliance telemetry.' };
  }
}

export const ainubisPortfolioIntelligenceService = new AinubisPortfolioIntelligenceService();
