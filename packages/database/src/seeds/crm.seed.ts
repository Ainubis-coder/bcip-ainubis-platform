/**
 * BCIP CRM Development Seed Data
 * Phase 002 — Step 002B: CRM Domain Model & Database Schema
 * All records are strictly development/synthetic test fixtures.
 */

import { organisationService } from '../crm/services/organisation.service.ts';
import { contactService } from '../crm/services/contact.service.ts';
import { campaignService } from '../crm/services/campaign.service.ts';
import { schemeProspectService } from '../crm/services/scheme-prospect.service.ts';
import { leadService } from '../crm/services/lead.service.ts';
import { opportunityService } from '../crm/services/opportunity.service.ts';
import { activityService } from '../crm/services/activity.service.ts';
import { taskService } from '../crm/services/task.service.ts';
import { proposalService } from '../crm/services/proposal.service.ts';
import { contractService } from '../crm/services/contract.service.ts';
import {
  OrganisationType,
  OrganisationStatus,
  ContactStatus,
  PreferredContactMethod,
  CampaignType,
  CampaignStatus,
  LeadSource,
  LeadStatus,
  QualificationStatus,
  ExpectedTimeline,
  OpportunityStage,
  ActivityType,
  TaskStatus,
  TaskPriority,
  ProposalStatus,
  ContractStatus,
  DataQualityState,
} from '../crm/enums.ts';

export interface SeedCRMResult {
  tenantId: string;
  campaign: any;
  organisations: any[];
  contacts: any[];
  schemeProspects: any[];
  leads: any[];
  opportunities: any[];
  activities: any[];
  tasks: any[];
  proposals: any[];
  contracts: any[];
}

export async function seedCrmDevelopmentData(
  tenantId: string = 'tenant-demo-apex',
  actorUserId: string = 'usr_seed_system'
): Promise<SeedCRMResult> {
  console.log(`[BCIP CRM Seed] Seeding CRM demo data for tenant: ${tenantId}...`);

  // 1. Campaign: Q1 2026 Managing Agent Modernization
  const campaign = await campaignService.create(
    tenantId,
    {
      name: 'Q1 2026 Managing Agent Digital Modernization Campaign',
      description: 'Outreach campaign targeting premier managing agents and sectional title portfolio directors across Gauteng and Western Cape.',
      campaignType: CampaignType.DIGITAL,
      status: CampaignStatus.ACTIVE,
      budget: 50000,
      actualSpend: 18500,
      startDate: '2026-01-15',
      endDate: '2026-04-30',
      ownerUserId: actorUserId,
    },
    actorUserId
  );

  // 2. Organisations: Premier Managing Agent & Body Corporate
  const orgManagingAgent = await organisationService.create(
    tenantId,
    {
      name: 'Highland Property Management (Pty) Ltd',
      legalName: 'Highland Property Management Proprietary Limited',
      organisationType: OrganisationType.MANAGING_AGENT,
      registrationNumber: '2018/482910/07',
      vatNumber: '4190284711',
      email: 'info@highlandprop-demo.co.za',
      phone: '+27 11 884 1000',
      website: 'https://highlandprop-demo.co.za',
      address: {
        streetAddress: '142 West Street, Sandown',
        suburb: 'Sandton',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2196',
        country: 'South Africa',
      },
      status: OrganisationStatus.ACTIVE_CLIENT,
      ownerUserId: actorUserId,
      dataQualityState: DataQualityState.COMPLETE,
      notes: 'Manages 48 sectional title schemes with over 3,200 residential units.',
    },
    actorUserId
  );

  const orgBodyCorporate = await organisationService.create(
    tenantId,
    {
      name: 'The Cascades Body Corporate SS 412/2012',
      legalName: 'Body Corporate of The Cascades Scheme No 412/2012',
      organisationType: OrganisationType.BODY_CORPORATE,
      registrationNumber: 'SS 412/2012',
      email: 'trustees@thecascades-demo.org.za',
      phone: '+27 21 439 2000',
      address: {
        streetAddress: '88 Beach Road, Sea Point',
        suburb: 'Sea Point',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8005',
        country: 'South Africa',
      },
      status: OrganisationStatus.PROSPECT,
      dataQualityState: DataQualityState.COMPLETE,
      notes: 'Luxury Atlantic Seaboard scheme with 120 units experiencing levy arrears reconciliation challenges.',
    },
    actorUserId
  );

  // 3. Contacts
  const contactManagingDirector = await contactService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      firstName: 'Brenda',
      lastName: 'van der Merwe',
      displayName: 'Brenda van der Merwe',
      jobTitle: 'Managing Director & Portfolio Head',
      email: 'brenda.v@highlandprop-demo.co.za',
      phone: '+27 11 884 1001',
      mobile: '+27 82 555 4910',
      preferredContactMethod: PreferredContactMethod.EMAIL,
      status: ContactStatus.ACTIVE,
      dataQualityState: DataQualityState.COMPLETE,
      notes: 'Key decision maker for enterprise software migrations and trustee portal rollouts.',
    },
    actorUserId
  );

  const contactTrusteeChair = await contactService.create(
    tenantId,
    {
      organisationId: orgBodyCorporate.id,
      firstName: 'David',
      lastName: 'Nkosi',
      displayName: 'David Nkosi',
      jobTitle: 'Chairman of the Board of Trustees',
      email: 'chairperson@thecascades-demo.org.za',
      mobile: '+27 83 444 8192',
      preferredContactMethod: PreferredContactMethod.WHATSAPP,
      status: ContactStatus.ACTIVE,
      dataQualityState: DataQualityState.COMPLETE,
      notes: 'Senior financial executive and resident trustee at The Cascades.',
    },
    actorUserId
  );

  // 4. Scheme Prospects
  const schemeProspect1 = await schemeProspectService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      name: 'Highland Ridge Estate SS 105/2018',
      registrationNumber: 'SS 105/2018',
      sectionalTitleSchemeCode: 'HRE-105',
      estimatedUnitCount: 164,
      location: {
        suburb: 'Morningside',
        city: 'Johannesburg',
        province: 'Gauteng',
      },
      managingAgentName: 'Highland Property Management',
      currentPropertySystem: 'Legacy Desktop Accounting',
      currentAccountingSystem: 'Pastel Partner',
      requirementsSummary: 'Automated levy billing, Ainubis dispute anomaly detection, and mobile trustee voting.',
      painPoints: [
        'Manual reconciliation of monthly reserve fund investments',
        'Trustee communication fragmentation across WhatsApp groups',
        'Slow contractor dispatch approval cycles',
      ],
      dataQualityState: DataQualityState.COMPLETE,
    },
    actorUserId
  );

  const schemeProspect2 = await schemeProspectService.create(
    tenantId,
    {
      organisationId: orgBodyCorporate.id,
      name: 'The Cascades Sea Point',
      registrationNumber: 'SS 412/2012',
      sectionalTitleSchemeCode: 'CSP-412',
      estimatedUnitCount: 120,
      location: {
        suburb: 'Sea Point',
        city: 'Cape Town',
        province: 'Western Cape',
      },
      currentPropertySystem: 'Manual Spreadsheets',
      requirementsSummary: 'Real-time financial transparency for owners and digital AGM ballot system.',
      painPoints: [
        'Levy roll arrears exceeding 90 days',
        'Lack of audit trail for common property maintenance quotes',
      ],
      dataQualityState: DataQualityState.PARTIAL,
    },
    actorUserId
  );

  // 5. Leads
  const lead1 = await leadService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      contactId: contactManagingDirector.id,
      campaignId: campaign.id,
      source: LeadSource.CAMPAIGN,
      sourceDetail: 'LinkedIn Managing Agent Executive Series',
      title: 'Highland Property Management — 48 Scheme Portfolio Migration',
      description: 'Prospect seeking to migrate 48 body corporate schemes from legacy on-premise system to modern cloud platform with Ainubis AI compliance.',
      email: 'brenda.v@highlandprop-demo.co.za',
      phone: '+27 11 884 1001',
      managingAgent: 'Highland Property Management',
      estimatedUnits: 3200,
      currentSystem: 'Legacy Desktop Accounting',
      painPoints: [
        'Staff spending 40% of time fielding owner balance queries',
        'AGM quorum calculations take hours',
      ],
      requiredModules: ['finance', 'governance', 'maintenance', 'ainubis'],
      expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
      status: LeadStatus.QUALIFIED,
      qualificationStatus: QualificationStatus.QUALIFIED,
      leadOwnerId: actorUserId,
      dataQualityState: DataQualityState.COMPLETE,
    },
    actorUserId
  );

  const lead2 = await leadService.create(
    tenantId,
    {
      organisationId: orgBodyCorporate.id,
      contactId: contactTrusteeChair.id,
      source: LeadSource.WEBSITE,
      title: 'The Cascades Body Corporate — Self-Management Intelligence',
      description: 'Trustees exploring direct BCIP platform access to oversee managing agent compliance and track reserve fund expenditure.',
      email: 'chairperson@thecascades-demo.org.za',
      phone: '+27 21 439 2020',
      schemeName: 'The Cascades Sea Point',
      estimatedUnits: 120,
      managingAgent: 'Self-Managed Body Corporate',
      currentSystem: 'Manual Spreadsheets',
      status: LeadStatus.NEW,
      qualificationStatus: QualificationStatus.PRE_QUALIFIED,
      painPoints: ['Lack of visibility into monthly maintenance invoices', 'Slow levy roll reconciliations'],
      requiredModules: ['finance', 'governance'],
      expectedTimeline: ExpectedTimeline.IMMEDIATE,
      dataQualityState: DataQualityState.COMPLETE,
    },
    actorUserId
  );

  const lead3 = await leadService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      source: LeadSource.REFERRAL,
      sourceDetail: 'Referred by Sandton Managing Agents Forum',
      title: 'Vanguard Portfolio Management — 22 Scheme Pilot',
      description: 'Mid-sized managing agency looking to automate trustee reporting packages and levy statements.',
      email: 'info@vanguardportfolios-demo.co.za',
      phone: '+27 11 784 9000',
      website: 'https://vanguardportfolios-demo.co.za',
      managingAgent: 'Vanguard Portfolio Management (Pty) Ltd',
      estimatedUnits: 1650,
      currentSystem: 'Sage Pastel Evolution',
      status: LeadStatus.ENRICHED,
      qualificationStatus: QualificationStatus.QUALIFIED,
      painPoints: ['Late trustee packs', 'Sectional Titles Schemes Management Act audit queries'],
      requiredModules: ['finance', 'governance', 'ainubis'],
      expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
      leadOwnerId: actorUserId,
      dataQualityState: DataQualityState.COMPLETE,
    },
    actorUserId
  );

  const lead4 = await leadService.create(
    tenantId,
    {
      source: LeadSource.DIRECT_OUTREACH,
      title: 'Atlantic View SS 12/2008 — Reserve Fund Advisory',
      description: 'Large sectional scheme requesting automated 10-year maintenance plan tracking.',
      email: 'trustees@atlanticview-demo.co.za',
      phone: '+27 21 418 3300',
      schemeName: 'Atlantic View SS',
      estimatedUnits: 88,
      managingAgent: 'Coastal Real Estate Agency',
      currentSystem: 'Excel Spreadsheets',
      status: LeadStatus.NURTURE,
      qualificationStatus: QualificationStatus.UNQUALIFIED,
      painPoints: ['10-year maintenance plan out of date', 'CSOS levy calculation errors'],
      requiredModules: ['maintenance', 'governance'],
      expectedTimeline: ExpectedTimeline.THREE_TO_SIX_MONTHS,
      dataQualityState: DataQualityState.PARTIAL,
    },
    actorUserId
  );

  const lead5 = await leadService.create(
    tenantId,
    {
      source: LeadSource.OTHER,
      title: 'Kloof Street Terraces — Inquiry',
      description: 'Small 14-unit block inquired about pricing but budget was insufficient for current fiscal period.',
      email: 'kloof.terraces-demo@gmail.com',
      schemeName: 'Kloof Street Terraces',
      estimatedUnits: 14,
      currentSystem: 'None',
      status: LeadStatus.LOST,
      qualificationStatus: QualificationStatus.DISQUALIFIED,
      painPoints: ['Cost of commercial software'],
      requiredModules: ['finance'],
      expectedTimeline: ExpectedTimeline.UNKNOWN,
      dataQualityState: DataQualityState.PARTIAL,
    },
    actorUserId
  );

  const allLeads = [lead1, lead2, lead3, lead4, lead5];

  // 6. Sales Opportunities across all 6 pipeline stages
  const opportunityProposal = await opportunityService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      leadId: lead1.id,
      primaryContactId: contactManagingDirector.id,
      schemeProspectId: schemeProspect1.id,
      name: 'Highland Property Portfolio — Enterprise License (3,200 Units)',
      description: 'Full enterprise rollout of BCIP across all 48 schemes under Highland management.',
      stage: OpportunityStage.PROPOSAL,
      estimatedValue: 144000.00, // ZAR per annum
      currency: 'ZAR',
      probability: 60,
      expectedCloseDate: '2026-03-31',
      ownerUserId: actorUserId,
      source: 'Q1 Digital Modernization Campaign',
      nextAction: 'Deliver commercial proposal and review data migration roadmap with IT committee',
      nextActionAt: '2026-02-15T10:00:00Z',
    },
    actorUserId
  );

  const opportunityDiscovery = await opportunityService.create(
    tenantId,
    {
      organisationId: orgBodyCorporate.id,
      leadId: lead2.id,
      primaryContactId: contactTrusteeChair.id,
      schemeProspectId: schemeProspect2.id,
      name: 'The Cascades Body Corporate — Self-Management Tier (120 Units)',
      description: 'Trustee board evaluating direct BCIP access for financial oversight and reserve fund governance.',
      stage: OpportunityStage.DISCOVERY,
      estimatedValue: 24500.00,
      currency: 'ZAR',
      probability: 25,
      expectedCloseDate: '2026-04-15',
      ownerUserId: actorUserId,
      source: 'Direct Inbound Website',
      nextAction: 'Schedule product demo with full trustee board',
      nextActionAt: '2026-02-20T16:00:00Z',
    },
    actorUserId
  );

  const opportunitySolutionDesign = await opportunityService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      primaryContactId: contactManagingDirector.id,
      name: 'Atlantic Seaboard Cluster — Multi-Scheme Cloud Sync (850 Units)',
      description: 'Custom integration scope with legacy accounting software and automated CSOS levy reconciliation.',
      stage: OpportunityStage.SOLUTION_DESIGN,
      estimatedValue: 68000.00,
      currency: 'ZAR',
      probability: 45,
      expectedCloseDate: '2026-05-01',
      ownerUserId: actorUserId,
      source: 'Referral',
      nextAction: 'Validate API field mappings for Sage Pastel migration',
      nextActionAt: '2026-02-25T11:00:00Z',
    },
    actorUserId
  );

  const opportunityContract = await opportunityService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      primaryContactId: contactManagingDirector.id,
      schemeProspectId: schemeProspect1.id,
      name: 'Sandton Grand Terraces SS 42/2012 — Management Tier (240 Units)',
      description: 'Final Master Services Agreement sent to managing agent executive committee for digital signature.',
      stage: OpportunityStage.CONTRACT,
      estimatedValue: 52000.00,
      currency: 'ZAR',
      probability: 85,
      expectedCloseDate: '2026-03-10',
      ownerUserId: actorUserId,
      source: 'Managing Agent Network',
      nextAction: 'Follow up on executive board signature',
      nextActionAt: '2026-02-18T09:00:00Z',
    },
    actorUserId
  );

  const opportunityWon = await opportunityService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      primaryContactId: contactManagingDirector.id,
      name: 'Rosebank Central Towers — Operational Enterprise Setup (410 Units)',
      description: 'Master Services Agreement executed and onboarding scheduled for April 1st.',
      stage: OpportunityStage.WON,
      estimatedValue: 88400.00,
      currency: 'ZAR',
      probability: 100,
      expectedCloseDate: '2026-02-01',
      ownerUserId: actorUserId,
      source: 'Partner',
      nextAction: 'Kick off data ingestion and trustee welcome webinar',
    },
    actorUserId
  );

  const opportunityLost = await opportunityService.create(
    tenantId,
    {
      organisationId: orgBodyCorporate.id,
      primaryContactId: contactTrusteeChair.id,
      name: 'Durban North Coastal Villas — Trial Package (60 Units)',
      description: 'Small scheme decided to retain manual spreadsheet bookkeeping for the current fiscal year.',
      stage: OpportunityStage.LOST,
      estimatedValue: 12000.00,
      currency: 'ZAR',
      probability: 0,
      expectedCloseDate: '2026-01-20',
      ownerUserId: actorUserId,
      source: 'Website',
      lossReason: 'Deferred to next financial year budget cycle',
    },
    actorUserId
  );

  const opportunity = opportunityProposal;

  // 7. Activities
  const activity1 = await activityService.logActivity(
    tenantId,
    {
      activityType: ActivityType.MEETING,
      subject: 'Executive Discovery & Technical Architecture Session',
      description: 'Walked through multi-tenant data isolation, Ainubis audit guardrails, and automated bank feed integrations with Brenda and senior portfolio managers.',
      activityAt: '2026-01-28T14:00:00Z',
      completedAt: '2026-01-28T15:30:00Z',
      ownerUserId: actorUserId,
      createdBy: actorUserId,
      leadId: lead1.id,
      contactId: contactManagingDirector.id,
      organisationId: orgManagingAgent.id,
      opportunityId: opportunity.id,
    },
    actorUserId
  );

  const activity2 = await activityService.logActivity(
    tenantId,
    {
      activityType: ActivityType.DEMO,
      subject: 'Ainubis AGM & Trustee Governance Live Demonstration',
      description: 'Simulated AGM digital quorum resolution, proxy tracking, and automated sectional title compliance checking.',
      activityAt: '2026-02-04T11:00:00Z',
      completedAt: '2026-02-04T12:15:00Z',
      ownerUserId: actorUserId,
      createdBy: actorUserId,
      contactId: contactManagingDirector.id,
      organisationId: orgManagingAgent.id,
      opportunityId: opportunity.id,
    },
    actorUserId
  );

  // 8. Tasks
  const task1 = await taskService.createTask(
    tenantId,
    {
      title: 'Prepare Custom Enterprise Proposal with SLA schedule',
      description: 'Include 48 schemes, 3,200 units tier pricing, dedicated onboarding manager, and Ainubis AI Gateway inclusion.',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      assignedTo: actorUserId,
      createdBy: actorUserId,
      dueAt: '2026-02-08T17:00:00Z',
      completedAt: '2026-02-07T16:30:00Z',
      leadId: lead1.id,
      opportunityId: opportunity.id,
      organisationId: orgManagingAgent.id,
    },
    actorUserId
  );

  const task2 = await taskService.createTask(
    tenantId,
    {
      title: 'Schedule Security Architecture Review with Highland IT Director',
      description: 'Review POPIA compliance, data residency, and encrypted tenant database partitions.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      assignedTo: actorUserId,
      createdBy: actorUserId,
      dueAt: '2026-02-16T12:00:00Z',
      opportunityId: opportunity.id,
      organisationId: orgManagingAgent.id,
    },
    actorUserId
  );

  // 9. Commercial Proposal
  const proposal = await proposalService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      opportunityId: opportunity.id,
      title: 'BCIP Enterprise Platform Proposal — Highland Portfolio',
      status: ProposalStatus.SENT,
      version: 1,
      items: [
        {
          id: 'item-1',
          description: 'BCIP Core Platform License (3,200 Units @ R3.50/unit/mo)',
          units: 3200,
          unitPrice: 3.50,
          totalPrice: 11200.00,
        },
        {
          id: 'item-2',
          description: 'Ainubis AI Intelligence Tier (Automated AGM Quorums & Invoice Auditing)',
          units: 48,
          unitPrice: 45.00,
          totalPrice: 2160.00,
        },
        {
          id: 'item-3',
          description: 'One-off Portfolio Migration & Trustee Training Package',
          units: 1,
          unitPrice: 15000.00,
          totalPrice: 15000.00,
        },
      ],
      subtotal: 28360.00,
      tax: 4254.00, // 15% South African VAT
      total: 32614.00,
      currency: 'ZAR',
      validUntil: '2026-03-15',
      issuedAt: '2026-02-09T09:00:00Z',
      documentId: 'doc_prop_highland_2026_v1',
      createdBy: actorUserId,
      notes: 'Special introductory portfolio pricing applicable for 24-month agreement.',
    },
    actorUserId
  );

  // 10. Contract Agreement (Ready for signing)
  const contract = await contractService.create(
    tenantId,
    {
      organisationId: orgManagingAgent.id,
      opportunityId: opportunity.id,
      proposalId: proposal.id,
      title: 'BCIP Master Software Service Agreement — Highland Property Management',
      status: ContractStatus.INTERNAL_REVIEW,
      effectiveDate: '2026-04-01',
      expiryDate: '2028-03-31',
      annualValue: 160320.00,
      monthlyValue: 13360.00,
      currency: 'ZAR',
      documentId: 'doc_ctr_highland_mssa_2026',
      terms: '24-Month Master Services Agreement with 99.9% uptime SLA and POPIA data protection addendum.',
      createdBy: actorUserId,
    },
    actorUserId
  );

  const allOpportunities = [
    opportunityProposal,
    opportunityDiscovery,
    opportunitySolutionDesign,
    opportunityContract,
    opportunityWon,
    opportunityLost,
  ];

  console.log(`[BCIP CRM Seed] Completed seeding: 1 campaign, 2 organisations, 2 contacts, 2 scheme prospects, ${allLeads.length} leads, ${allOpportunities.length} opportunities, 2 activities, 2 tasks, 1 proposal, 1 contract.`);

  return {
    tenantId,
    campaign,
    organisations: [orgManagingAgent, orgBodyCorporate],
    contacts: [contactManagingDirector, contactTrusteeChair],
    schemeProspects: [schemeProspect1, schemeProspect2],
    leads: allLeads,
    opportunities: allOpportunities,
    activities: [activity1, activity2],
    tasks: [task1, task2],
    proposals: [proposal],
    contracts: [contract],
  };
}
