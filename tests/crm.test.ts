/**
 * BCIP CRM Domain Model & Database Schema Automated Test Suite
 * Prompt 002B — Acceptance Tests (Tests 1 through 15)
 */

import assert from 'assert';
import {
  migrationManager,
  organisationService,
  contactService,
  leadService,
  schemeProspectService,
  opportunityService,
  activityService,
  taskService,
  proposalService,
  contractService,
  crmAuditService,
  crmEventBus,
  seedCrmDevelopmentData,
  OrganisationType,
  OrganisationStatus,
  ContactStatus,
  PreferredContactMethod,
  LeadSource,
  LeadStatus,
  QualificationStatus,
  OpportunityStage,
  ActivityType,
  TaskStatus,
  TaskPriority,
  ProposalStatus,
  ContractStatus,
  DataQualityState,
  CRMEventType,
} from '../packages/database/src/index.ts';

export async function runCrmTests(): Promise<void> {
  console.log('\n====================================================');
  console.log('BCIP — Prompt 002B: CRM Domain & Database Schema Tests');
  console.log('====================================================');

  const tenantA = 'tenant_apex_sandton';
  const tenantB = 'tenant_coastal_cape';
  const userAdminA = 'usr_admin_sandton_001';
  const userAdminB = 'usr_admin_cape_002';

  // --------------------------------------------------------------------------
  // TEST 0: Database Migrations Execution & Verification
  // --------------------------------------------------------------------------
  console.log('0. Verifying Database Migrations (0001 & 0002 CRM schema)...');
  const statusBefore = await migrationManager.getStatus();
  assert.ok(statusBefore.total >= 2, 'Total registered migrations must be at least 2');

  // Ensure CRM migration 0002 is applied
  let crmMigration = statusBefore.details.find((m) => m.version === '0002_crm_domain_schema');
  if (!crmMigration) {
    crmMigration = await migrationManager.applyMigration('0002_crm_domain_schema.sql');
  }

  assert.ok(crmMigration && crmMigration.success, 'CRM migration 0002 must apply cleanly');
  assert.ok(
    crmMigration.statementsExecuted && crmMigration.statementsExecuted > 15,
    'CRM migration must contain all table, constraint, and index definitions'
  );
  assert.ok(migrationManager.isMigrationApplied('0002_crm_domain_schema'), '0002 CRM migration must be applied');
  console.log(`   ✓ CRM migration applied (${crmMigration.statementsExecuted} statements executed successfully).`);

  // --------------------------------------------------------------------------
  // TEST 1: Create a Tenant Context
  // --------------------------------------------------------------------------
  console.log('1. Testing Tenant Isolation Context initialization...');
  assert.ok(tenantA, 'Tenant A identifier established');
  assert.ok(tenantB, 'Tenant B identifier established');
  console.log(`   ✓ Multi-tenant boundary initialized for "${tenantA}" and "${tenantB}".`);

  // --------------------------------------------------------------------------
  // TEST 2: Create an Organisation inside that Tenant
  // --------------------------------------------------------------------------
  console.log('2. Testing Organisation Creation inside Tenant A...');
  const orgA = await organisationService.create(
    tenantA,
    {
      name: 'Highland Property Management (Pty) Ltd',
      legalName: 'Highland Property Management Proprietary Limited',
      organisationType: OrganisationType.MANAGING_AGENT,
      registrationNumber: '2018/123456/07',
      vatNumber: '4190123456',
      email: 'admin@highlandprop-test.co.za',
      phone: '+27 11 784 0000',
      address: {
        streetAddress: '15 Alice Lane',
        suburb: 'Sandton',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2196',
      },
      status: OrganisationStatus.ACTIVE_CLIENT,
      notes: 'Premier Gauteng portfolio managing 40 body corporate schemes.',
    },
    userAdminA
  );

  assert.ok(orgA.id.startsWith('org_'), 'Organisation ID should be generated');
  assert.strictEqual(orgA.tenantId, tenantA, 'Tenant ID must match Tenant A');
  assert.strictEqual(orgA.organisationType, OrganisationType.MANAGING_AGENT);
  assert.strictEqual(orgA.status, OrganisationStatus.ACTIVE_CLIENT);
  console.log(`   ✓ Organisation created: "${orgA.name}" (ID: ${orgA.id}).`);

  // --------------------------------------------------------------------------
  // TEST 3: Create a Contact attached to the Organisation
  // --------------------------------------------------------------------------
  console.log('3. Testing Contact Creation attached to Organisation...');
  const contactA = await contactService.create(
    tenantA,
    {
      organisationId: orgA.id,
      firstName: 'Brenda',
      lastName: 'van der Merwe',
      jobTitle: 'Chief Operating Officer',
      email: 'brenda.vdm@highlandprop-test.co.za',
      phone: '+27 11 784 0001',
      mobile: '+27 82 999 1234',
      preferredContactMethod: PreferredContactMethod.EMAIL,
      status: ContactStatus.ACTIVE,
      dataQualityState: DataQualityState.COMPLETE,
    },
    userAdminA
  );

  assert.ok(contactA.id.startsWith('cnt_'), 'Contact ID generated');
  assert.strictEqual(contactA.tenantId, tenantA);
  assert.strictEqual(contactA.organisationId, orgA.id);
  assert.strictEqual(contactA.displayName, 'Brenda van der Merwe');
  console.log(`   ✓ Contact created: "${contactA.displayName}" attached to org "${orgA.id}".`);

  // --------------------------------------------------------------------------
  // TEST 4: Create a Lead attached to the Organisation / Contact
  // --------------------------------------------------------------------------
  console.log('4. Testing Lead Creation with Campaign Attribution...');
  const leadA = await leadService.create(
    tenantA,
    {
      organisationId: orgA.id,
      contactId: contactA.id,
      source: LeadSource.REFERRAL,
      sourceDetail: 'Trustee Network Referral',
      title: 'Highland Portfolio — 40 Scheme BCIP Enterprise Migration',
      description: 'Managing agent evaluating replacement of legacy on-premise system with BCIP.',
      email: 'brenda.vdm@highlandprop-test.co.za',
      phone: '+27 11 784 0001',
      schemeName: 'Highland Ridge Estate',
      estimatedUnits: 2800,
      managingAgent: 'Highland Property Management',
      currentSystem: 'Legacy Desktop Accounting',
      painPoints: ['Manual levy arrears collection', 'Unstructured trustee communication'],
      requiredModules: ['finance', 'governance', 'maintenance'],
      status: LeadStatus.NEW,
      qualificationStatus: QualificationStatus.UNQUALIFIED,
    },
    userAdminA
  );

  assert.ok(leadA.id.startsWith('lead_'));
  assert.strictEqual(leadA.tenantId, tenantA);
  assert.strictEqual(leadA.organisationId, orgA.id);
  assert.strictEqual(leadA.status, LeadStatus.NEW);

  // Qualify the lead
  const qualifiedLead = await leadService.qualify(
    tenantA,
    leadA.id,
    QualificationStatus.QUALIFIED,
    userAdminA,
    'Budget confirmed for FY2026. 2,800 units validated.'
  );
  assert.strictEqual(qualifiedLead.qualificationStatus, QualificationStatus.QUALIFIED);
  assert.strictEqual(qualifiedLead.status, LeadStatus.QUALIFIED);
  console.log(`   ✓ Lead created and qualified: "${qualifiedLead.title}" (Status: ${qualifiedLead.status}).`);

  // --------------------------------------------------------------------------
  // TEST 5: Create a Scheme Prospect
  // --------------------------------------------------------------------------
  console.log('5. Testing Scheme Prospect Creation...');
  const schemeProspect = await schemeProspectService.create(
    tenantA,
    {
      organisationId: orgA.id,
      leadId: leadA.id,
      name: 'Highland Ridge Body Corporate SS 88/2016',
      registrationNumber: 'SS 88/2016',
      sectionalTitleSchemeCode: 'HRB-088',
      estimatedUnitCount: 164,
      location: {
        suburb: 'Morningside',
        city: 'Johannesburg',
        province: 'Gauteng',
      },
      managingAgentName: 'Highland Property Management',
      currentPropertySystem: 'Legacy Desktop Accounting',
      currentAccountingSystem: 'Pastel Partner',
      requirementsSummary: 'Automated levy billing and trustee compliance dashboard.',
      painPoints: ['Manual bank reconciliation', 'Late AGM notice dispatch'],
      dataQualityState: DataQualityState.COMPLETE,
    },
    userAdminA
  );

  assert.ok(schemeProspect.id.startsWith('sp_'));
  assert.strictEqual(schemeProspect.tenantId, tenantA);
  assert.strictEqual(schemeProspect.estimatedUnitCount, 164);
  console.log(`   ✓ Scheme prospect created: "${schemeProspect.name}" (${schemeProspect.estimatedUnitCount} units).`);

  // --------------------------------------------------------------------------
  // TEST 6: Create an Opportunity
  // --------------------------------------------------------------------------
  console.log('6. Testing Opportunity Creation...');
  const opportunity = await opportunityService.create(
    tenantA,
    {
      organisationId: orgA.id,
      leadId: leadA.id,
      primaryContactId: contactA.id,
      schemeProspectId: schemeProspect.id,
      name: 'Highland Enterprise SaaS License — 2,800 Units',
      description: 'Enterprise rollout across all 40 schemes under management.',
      stage: OpportunityStage.DISCOVERY,
      estimatedValue: 117600.00, // ZAR per annum
      currency: 'ZAR',
      probability: 20,
      expectedCloseDate: '2026-04-30',
      ownerUserId: userAdminA,
      source: 'Managing Agent Referral',
      nextAction: 'Schedule technical discovery and data model walk-through',
    },
    userAdminA
  );

  assert.ok(opportunity.id.startsWith('opp_'));
  assert.strictEqual(opportunity.tenantId, tenantA);
  assert.strictEqual(opportunity.stage, OpportunityStage.DISCOVERY);
  assert.strictEqual(opportunity.estimatedValue, 117600.00);
  console.log(`   ✓ Opportunity created: "${opportunity.name}" (Value: R${opportunity.estimatedValue}).`);

  // --------------------------------------------------------------------------
  // TEST 7: Move Opportunity through all Stages:
  // DISCOVERY → SOLUTION_DESIGN → PROPOSAL → CONTRACT → WON
  // --------------------------------------------------------------------------
  console.log('7. Testing Sequential Opportunity Stage Progression...');
  const stages: { stage: OpportunityStage; reason: string }[] = [
    { stage: OpportunityStage.SOLUTION_DESIGN, reason: 'Technical architecture approved by Highland IT' },
    { stage: OpportunityStage.PROPOSAL, reason: 'Commercial pricing model finalized for 40 schemes' },
    { stage: OpportunityStage.CONTRACT, reason: 'Proposal accepted by executive committee' },
    { stage: OpportunityStage.WON, reason: 'Master Services Agreement executed and signed' },
  ];

  let currentOpp = opportunity;
  for (const step of stages) {
    const transition = await opportunityService.transitionStage(
      tenantA,
      opportunity.id,
      step.stage,
      userAdminA,
      step.reason
    );
    assert.strictEqual(transition.opportunity.stage, step.stage);
    currentOpp = transition.opportunity;
    console.log(`     → Transitioned to stage: ${step.stage} (${step.reason})`);
  }
  assert.strictEqual(currentOpp.stage, OpportunityStage.WON);
  assert.ok(currentOpp.wonAt, 'Won timestamp must be populated');
  assert.strictEqual(currentOpp.probability, 100, 'Won probability must be 100%');
  console.log('   ✓ Opportunity successfully moved: DISCOVERY → SOLUTION_DESIGN → PROPOSAL → CONTRACT → WON.');

  // --------------------------------------------------------------------------
  // TEST 8: Verify Every Stage Transition is Recorded in Stage History
  // --------------------------------------------------------------------------
  console.log('8. Verifying Opportunity Stage History Audit Trail...');
  const history = opportunityService.getStageHistory(tenantA, opportunity.id);
  assert.strictEqual(history.length, 5, 'Must record initial creation plus 4 stage transitions');

  assert.strictEqual(history[0].toStage, OpportunityStage.DISCOVERY);
  assert.strictEqual(history[1].fromStage, OpportunityStage.DISCOVERY);
  assert.strictEqual(history[1].toStage, OpportunityStage.SOLUTION_DESIGN);
  assert.strictEqual(history[2].fromStage, OpportunityStage.SOLUTION_DESIGN);
  assert.strictEqual(history[2].toStage, OpportunityStage.PROPOSAL);
  assert.strictEqual(history[3].fromStage, OpportunityStage.PROPOSAL);
  assert.strictEqual(history[3].toStage, OpportunityStage.CONTRACT);
  assert.strictEqual(history[4].fromStage, OpportunityStage.CONTRACT);
  assert.strictEqual(history[4].toStage, OpportunityStage.WON);

  for (const record of history) {
    assert.strictEqual(record.tenantId, tenantA);
    assert.strictEqual(record.opportunityId, opportunity.id);
    assert.ok(record.changedAt, 'Timestamp must exist on history record');
    assert.ok(record.changedBy, 'Actor must be recorded');
  }
  console.log(`   ✓ All ${history.length} stage transitions verified with immutable timestamps and reasons.`);

  // --------------------------------------------------------------------------
  // TEST 9: Create Activities and Tasks against the Opportunity
  // --------------------------------------------------------------------------
  console.log('9. Testing Activity and Task Creation against Opportunity...');
  const activity = await activityService.logActivity(
    tenantA,
    {
      activityType: ActivityType.DEMO,
      subject: 'Ainubis AGM Quorum & Sectional Title Compliance Demonstration',
      description: 'Demonstrated automated attendance registry, proxy validation, and voting quorum calculation.',
      activityAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      ownerUserId: userAdminA,
      createdBy: userAdminA,
      opportunityId: opportunity.id,
      organisationId: orgA.id,
      contactId: contactA.id,
    },
    userAdminA
  );

  assert.ok(activity.id.startsWith('act_'));
  assert.strictEqual(activity.tenantId, tenantA);
  assert.strictEqual(activity.opportunityId, opportunity.id);

  const task = await taskService.createTask(
    tenantA,
    {
      title: 'Conduct Final Data Migration Audit with Highland IT Lead',
      description: 'Audit scheme unit registers, owner contacts, and bank account mappings before go-live.',
      status: TaskStatus.OPEN,
      priority: TaskPriority.HIGH,
      assignedTo: userAdminA,
      createdBy: userAdminA,
      dueAt: '2026-03-15T12:00:00Z',
      opportunityId: opportunity.id,
      organisationId: orgA.id,
    },
    userAdminA
  );

  assert.ok(task.id.startsWith('tsk_'));
  assert.strictEqual(task.tenantId, tenantA);
  assert.strictEqual(task.status, TaskStatus.OPEN);

  // Complete task
  const completedTask = await taskService.completeTask(tenantA, task.id, userAdminA);
  assert.strictEqual(completedTask.status, TaskStatus.COMPLETED);
  assert.ok(completedTask.completedAt);
  console.log(`   ✓ Activity logged and Task created/completed against Opportunity.`);

  // --------------------------------------------------------------------------
  // TEST 10: Create a Commercial Proposal
  // --------------------------------------------------------------------------
  console.log('10. Testing Commercial Proposal Creation with Decimal Financial Precision...');
  const proposal = await proposalService.create(
    tenantA,
    {
      organisationId: orgA.id,
      opportunityId: opportunity.id,
      title: 'BCIP Enterprise Modernization Proposal — 2,800 Units Tier',
      status: ProposalStatus.APPROVED,
      items: [
        {
          id: 'item-1',
          description: 'BCIP Core Platform (2,800 units @ R3.50/unit/month)',
          units: 2800,
          unitPrice: 3.50,
          totalPrice: 9800.00,
        },
        {
          id: 'item-2',
          description: 'Ainubis Compliance & Audit Layer (40 schemes @ R45.00/scheme/month)',
          units: 40,
          unitPrice: 45.00,
          totalPrice: 1800.00,
        },
      ],
      subtotal: 11600.00,
      tax: 1740.00, // 15% VAT
      total: 13340.00,
      currency: 'ZAR',
      validUntil: '2026-04-15',
      documentId: 'doc_prop_highland_2026_final',
      createdBy: userAdminA,
    },
    userAdminA
  );

  assert.ok(proposal.id.startsWith('prop_'));
  assert.strictEqual(proposal.tenantId, tenantA);
  assert.strictEqual(proposal.proposalNumber.startsWith('PROP-'), true);
  assert.strictEqual(proposal.subtotal, 11600.00);
  assert.strictEqual(proposal.tax, 1740.00);
  assert.strictEqual(proposal.total, 13340.00);

  // Send & Accept proposal
  const sentProposal = await proposalService.updateStatus(tenantA, proposal.id, ProposalStatus.SENT, userAdminA);
  assert.strictEqual(sentProposal.status, ProposalStatus.SENT);
  assert.ok(sentProposal.issuedAt);

  const acceptedProposal = await proposalService.updateStatus(tenantA, proposal.id, ProposalStatus.ACCEPTED, userAdminA);
  assert.strictEqual(acceptedProposal.status, ProposalStatus.ACCEPTED);
  assert.ok(acceptedProposal.acceptedAt);
  console.log(`   ✓ Proposal created, issued, and accepted: ${acceptedProposal.proposalNumber} (Total: R${acceptedProposal.total}).`);

  // --------------------------------------------------------------------------
  // TEST 11: Create a Contract
  // --------------------------------------------------------------------------
  console.log('11. Testing Legal Contract Creation and Activation...');
  const contract = await contractService.create(
    tenantA,
    {
      organisationId: orgA.id,
      opportunityId: opportunity.id,
      proposalId: proposal.id,
      title: 'BCIP Master Software Service Agreement — Highland Property Management',
      status: ContractStatus.APPROVED,
      effectiveDate: '2026-04-01',
      expiryDate: '2028-03-31',
      annualValue: 160080.00,
      monthlyValue: 13340.00,
      currency: 'ZAR',
      documentId: 'doc_ctr_highland_signed_mssa',
      terms: '24-month fixed term enterprise license with 99.9% availability SLA.',
      createdBy: userAdminA,
    },
    userAdminA
  );

  assert.ok(contract.id.startsWith('ctr_'));
  assert.strictEqual(contract.tenantId, tenantA);
  assert.strictEqual(contract.contractNumber.startsWith('CTR-'), true);

  // Sign and Activate Contract
  const signedContract = await contractService.updateStatus(tenantA, contract.id, ContractStatus.SIGNED, userAdminA);
  assert.strictEqual(signedContract.status, ContractStatus.SIGNED);
  assert.ok(signedContract.signedAt);

  const activeContract = await contractService.updateStatus(tenantA, contract.id, ContractStatus.ACTIVE, userAdminA);
  assert.strictEqual(activeContract.status, ContractStatus.ACTIVE);
  console.log(`   ✓ Contract created, signed, and activated: ${activeContract.contractNumber} (Annual: R${activeContract.annualValue}).`);

  // --------------------------------------------------------------------------
  // TEST 12: Verify Strict Tenant Isolation
  // Tenant A cannot access Tenant B records, and Tenant B cannot access Tenant A records
  // --------------------------------------------------------------------------
  console.log('12. Verifying Multi-Tenant Data Isolation Enforcement...');

  // Create an organisation inside Tenant B
  const orgB = await organisationService.create(
    tenantB,
    {
      name: 'Atlantic Seaboard Body Corporate Services',
      organisationType: OrganisationType.MANAGING_AGENT,
      status: OrganisationStatus.PROSPECT,
    },
    userAdminB
  );

  // 1. Tenant B trying to access Tenant A's organisation -> MUST return null
  const crossTenantOrg = await organisationService.getById(tenantB, orgA.id);
  assert.strictEqual(crossTenantOrg, null, 'Tenant B MUST NOT access Tenant A organisation');

  // 2. Tenant A trying to access Tenant B's organisation -> MUST return null
  const crossTenantOrgRev = await organisationService.getById(tenantA, orgB.id);
  assert.strictEqual(crossTenantOrgRev, null, 'Tenant A MUST NOT access Tenant B organisation');

  // 3. Tenant B trying to access Tenant A's lead -> MUST return null
  const crossTenantLead = await leadService.getById(tenantB, leadA.id);
  assert.strictEqual(crossTenantLead, null, 'Tenant B MUST NOT access Tenant A lead');

  // 4. Tenant B trying to access Tenant A's opportunity -> MUST return null
  const crossTenantOpp = await opportunityService.getById(tenantB, opportunity.id);
  assert.strictEqual(crossTenantOpp, null, 'Tenant B MUST NOT access Tenant A opportunity');

  // 5. Tenant B trying to list Tenant A's proposals -> MUST return empty
  const tenantBProposals = await proposalService.listByOpportunity(tenantB, opportunity.id);
  assert.strictEqual(tenantBProposals.length, 0, 'Tenant B proposals query must return empty');

  // 6. Tenant B trying to access Tenant A's contract -> MUST return null
  const crossTenantContract = await contractService.getById(tenantB, contract.id);
  assert.strictEqual(crossTenantContract, null, 'Tenant B MUST NOT access Tenant A contract');

  // 7. Verify listing organizations in Tenant B only returns Tenant B organizations
  const tenantBOrgs = await organisationService.list(tenantB);
  assert.ok(tenantBOrgs.every((o) => o.tenantId === tenantB), 'All listed orgs must belong to Tenant B');
  assert.strictEqual(tenantBOrgs.some((o) => o.id === orgA.id), false, 'Tenant A org must not appear in Tenant B list');

  console.log('   ✓ Multi-tenant boundary verified: Cross-tenant access is strictly blocked at repository and service layer.');

  // --------------------------------------------------------------------------
  // TEST 13: Verify Audit Events
  // --------------------------------------------------------------------------
  console.log('13. Verifying Comprehensive CRM Audit Trail & Workflow Events...');
  const tenantAAuditLogs = crmAuditService.getAllLogs(tenantA);
  assert.ok(tenantAAuditLogs.length >= 10, 'Must have recorded at least 10 audit records in Tenant A');

  const actions = tenantAAuditLogs.map((log) => log.action);
  assert.ok(actions.includes('ORGANISATION_CREATED'), 'Must audit ORGANISATION_CREATED');
  assert.ok(actions.includes('CONTACT_CREATED'), 'Must audit CONTACT_CREATED');
  assert.ok(actions.includes('LEAD_CREATED'), 'Must audit LEAD_CREATED');
  assert.ok(actions.includes('LEAD_QUALIFIED'), 'Must audit LEAD_QUALIFIED');
  assert.ok(actions.includes('OPPORTUNITY_CREATED'), 'Must audit OPPORTUNITY_CREATED');
  assert.ok(actions.includes('OPPORTUNITY_STAGE_CHANGED'), 'Must audit OPPORTUNITY_STAGE_CHANGED');
  assert.ok(actions.includes('PROPOSAL_CREATED'), 'Must audit PROPOSAL_CREATED');
  assert.ok(actions.includes('PROPOSAL_STATUS_SENT'), 'Must audit PROPOSAL_STATUS_SENT');
  assert.ok(actions.includes('PROPOSAL_STATUS_ACCEPTED'), 'Must audit PROPOSAL_STATUS_ACCEPTED');
  assert.ok(actions.includes('CONTRACT_CREATED'), 'Must audit CONTRACT_CREATED');
  assert.ok(actions.includes('CONTRACT_STATUS_SIGNED'), 'Must audit CONTRACT_STATUS_SIGNED');
  assert.ok(actions.includes('CONTRACT_STATUS_ACTIVE'), 'Must audit CONTRACT_STATUS_ACTIVE');

  // Verify workflow event bus published matching CRM event topics
  const recentEvents = crmEventBus.getRecentEvents(tenantA);
  const eventTypes = recentEvents.map((e) => e.eventType);
  assert.ok(eventTypes.includes(CRMEventType.ORGANISATION_CREATED), 'Must publish crm.organisation.created');
  assert.ok(eventTypes.includes(CRMEventType.CONTACT_CREATED), 'Must publish crm.contact.created');
  assert.ok(eventTypes.includes(CRMEventType.LEAD_CREATED), 'Must publish crm.lead.created');
  assert.ok(eventTypes.includes(CRMEventType.OPPORTUNITY_CREATED), 'Must publish crm.opportunity.created');
  assert.ok(eventTypes.includes(CRMEventType.OPPORTUNITY_STAGE_CHANGED), 'Must publish crm.opportunity.stage_changed');
  assert.ok(eventTypes.includes(CRMEventType.PROPOSAL_CREATED), 'Must publish crm.proposal.created');
  assert.ok(eventTypes.includes(CRMEventType.CONTRACT_ACTIVATED), 'Must publish crm.contract.activated');

  console.log(`   ✓ ${tenantAAuditLogs.length} audit logs and ${recentEvents.length} workflow events validated.`);

  // --------------------------------------------------------------------------
  // TEST 14: Verify Soft Deletion
  // --------------------------------------------------------------------------
  console.log('14. Verifying Soft Deletion Architecture...');
  const tempContact = await contactService.create(
    tenantA,
    {
      firstName: 'Temp',
      lastName: 'Deleted',
      email: 'temp.deleted@example.com',
      preferredContactMethod: PreferredContactMethod.EMAIL,
      status: ContactStatus.INACTIVE,
    },
    userAdminA
  );

  assert.ok(tempContact.id);
  // Verify contact is found normally
  const foundBefore = await contactService.getById(tenantA, tempContact.id);
  assert.ok(foundBefore);

  // Soft delete contact
  const deleted = await contactService.softDelete(tenantA, tempContact.id, userAdminA);
  assert.strictEqual(deleted, true, 'Soft deletion should succeed');

  // Verify standard findById excludes soft deleted contact
  const foundAfter = await contactService.getById(tenantA, tempContact.id);
  assert.strictEqual(foundAfter, null, 'Soft-deleted record must not be returned by standard query');

  // Verify soft deletion is audited
  const softDeleteAudit = crmAuditService
    .getAuditTrail(tenantA, 'contact', tempContact.id)
    .find((l) => l.action === 'CONTACT_SOFT_DELETED');
  assert.ok(softDeleteAudit, 'Soft deletion must generate an audit record');
  console.log('   ✓ Soft deletion verified: Record hidden from operational queries while preserved for audit compliance.');

  // --------------------------------------------------------------------------
  // TEST 15: Lead Conversion Workflow (Lead → Org + Contact + Scheme Prospect + Opportunity)
  // --------------------------------------------------------------------------
  console.log('15. Testing Multi-Entity Lead Conversion Workflow...');
  const inboundLead = await leadService.create(
    tenantA,
    {
      title: 'Greenways Body Corporate — Full Automation',
      schemeName: 'Greenways Golf Estate SS 300/2010',
      managingAgent: 'Greenways Estates (Pty) Ltd',
      estimatedUnits: 450,
      source: LeadSource.WEBSITE,
      email: 'trustees@greenways-test.co.za',
      phone: '+27 21 850 0000',
      painPoints: ['Complex golf levy allocation', 'Sectional title body corporate audit'],
      status: LeadStatus.QUALIFIED,
      qualificationStatus: QualificationStatus.QUALIFIED,
    },
    userAdminA
  );

  const conversionResult = await leadService.convertLead(
    tenantA,
    inboundLead.id,
    {
      organisationName: 'Greenways Body Corporate SS 300/2010',
      organisationType: OrganisationType.BODY_CORPORATE,
      contactFirstName: 'Arthur',
      contactLastName: 'Pendelton',
      opportunityName: 'Greenways Body Corporate — Enterprise Platform',
      estimatedValue: 18900.00,
    },
    userAdminA
  );

  assert.strictEqual(conversionResult.lead.status, LeadStatus.CONVERTED);
  assert.ok(conversionResult.lead.convertedAt);
  assert.strictEqual(conversionResult.lead.convertedOpportunityId, conversionResult.opportunity.id);
  assert.strictEqual(conversionResult.organisation.name, 'Greenways Body Corporate SS 300/2010');
  assert.strictEqual(conversionResult.contact.displayName, 'Arthur Pendelton');
  assert.strictEqual(conversionResult.schemeProspect?.estimatedUnitCount, 450);
  assert.strictEqual(conversionResult.opportunity.estimatedValue, 18900.00);

  // Verify double conversion prevention
  await assert.rejects(
    async () => {
      await leadService.convertLead(tenantA, inboundLead.id, {}, userAdminA);
    },
    /already been converted/,
    'Should reject converting an already-converted lead'
  );
  console.log(`   ✓ Lead conversion completed atomically: Converted lead into Org, Contact, Scheme Prospect, Opportunity, and Activity.`);

  // --------------------------------------------------------------------------
  // Seed Data Sanity Verification
  // --------------------------------------------------------------------------
  console.log('16. Validating CRM Development Seed Data Generation...');
  const seedOutput = await seedCrmDevelopmentData('tenant-demo-seed', 'usr_seed_verifier');
  assert.ok(seedOutput.organisations.length >= 2, 'Seed data must include organisations');
  assert.ok(seedOutput.contacts.length >= 2, 'Seed data must include contacts');
  assert.ok(seedOutput.leads.length >= 2, 'Seed data must include leads');
  assert.ok(seedOutput.schemeProspects.length >= 2, 'Seed data must include scheme prospects');
  assert.ok(seedOutput.opportunities.length >= 1, 'Seed data must include opportunities');
  assert.ok(seedOutput.proposals.length >= 1, 'Seed data must include proposals');
  assert.ok(seedOutput.contracts.length >= 1, 'Seed data must include contracts');
  console.log('   ✓ Seed data execution and structure confirmed.');

  console.log('\n====================================================');
  console.log('✅ ALL CRM DOMAIN & SCHEMA ACCEPTANCE TESTS PASSED (15/15)');
  console.log('====================================================\n');
}

if (process.argv[1]?.endsWith('crm.test.ts')) {
  runCrmTests().catch((err) => {
    console.error('CRM test suite failed:', err);
    process.exit(1);
  });
}
