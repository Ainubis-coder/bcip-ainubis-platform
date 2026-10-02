-- ============================================================================
-- BCIP PostgreSQL Database Migration: 0002_crm_domain_schema.sql
-- Prompt 002B: CRM Domain Model & Database Schema
-- Multi-Tenant Relational Foundation for:
-- Lead -> Contact -> Organisation -> Scheme Prospect -> Opportunity ->
-- Activity -> Task -> Proposal -> Contract
-- ============================================================================

-- 1. CRM Campaigns Table
CREATE TABLE IF NOT EXISTS crm_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('MARKETING', 'REFERRAL', 'EVENT', 'DIGITAL', 'PARTNER', 'SALES', 'OTHER')),
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    budget NUMERIC(14, 2) NULL CHECK (budget >= 0),
    actual_spend NUMERIC(14, 2) NULL CHECK (actual_spend >= 0),
    start_date DATE NULL,
    end_date DATE NULL,
    owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_campaign_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_crm_campaigns_tenant ON crm_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_status ON crm_campaigns(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_owner ON crm_campaigns(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_dates ON crm_campaigns(start_date, end_date);

-- 2. CRM Organisations Table
CREATE TABLE IF NOT EXISTS crm_organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NULL,
    organisation_type VARCHAR(50) NOT NULL CHECK (organisation_type IN (
        'MANAGING_AGENT', 'BODY_CORPORATE', 'TRUSTEE_ORGANISATION',
        'HOMEOWNERS_ASSOCIATION', 'PROPERTY_DEVELOPER', 'FACILITIES_PROVIDER',
        'LEGAL_ADVISORY', 'OTHER'
    )),
    registration_number VARCHAR(100) NULL,
    vat_number VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    website VARCHAR(255) NULL,
    address JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'PROSPECT' CHECK (status IN (
        'PROSPECT', 'ACTIVE_CLIENT', 'PARTNER', 'CHURNED', 'INACTIVE', 'SUSPENDED'
    )),
    owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT NULL,
    data_quality_state VARCHAR(50) NOT NULL DEFAULT 'COMPLETE' CHECK (data_quality_state IN (
        'COMPLETE', 'PARTIAL', 'STALE', 'CONFLICTED', 'UNVERIFIED', 'ERROR'
    )),
    source_system VARCHAR(100) NULL,
    source_record_id VARCHAR(100) NULL,
    import_sync_id VARCHAR(100) NULL,
    last_sync_at TIMESTAMPTZ NULL,
    source_confidence NUMERIC(3, 2) NULL CHECK (source_confidence BETWEEN 0.00 AND 1.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_organisations_tenant ON crm_organisations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_organisations_status ON crm_organisations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_organisations_type ON crm_organisations(tenant_id, organisation_type);
CREATE INDEX IF NOT EXISTS idx_crm_organisations_owner ON crm_organisations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_organisations_reg ON crm_organisations(tenant_id, registration_number) WHERE registration_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_organisations_deleted ON crm_organisations(tenant_id, deleted_at);

-- 3. CRM Contacts Table
CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(150) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    mobile VARCHAR(50) NULL,
    preferred_contact_method VARCHAR(50) NOT NULL DEFAULT 'EMAIL' CHECK (preferred_contact_method IN (
        'EMAIL', 'PHONE', 'MOBILE', 'WHATSAPP', 'ANY'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE', 'INACTIVE', 'UNRESPONSIVE', 'DO_NOT_CONTACT'
    )),
    notes TEXT NULL,
    data_quality_state VARCHAR(50) NOT NULL DEFAULT 'COMPLETE' CHECK (data_quality_state IN (
        'COMPLETE', 'PARTIAL', 'STALE', 'CONFLICTED', 'UNVERIFIED', 'ERROR'
    )),
    source_system VARCHAR(100) NULL,
    source_record_id VARCHAR(100) NULL,
    import_sync_id VARCHAR(100) NULL,
    last_sync_at TIMESTAMPTZ NULL,
    source_confidence NUMERIC(3, 2) NULL CHECK (source_confidence BETWEEN 0.00 AND 1.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant ON crm_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON crm_contacts(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_deleted ON crm_contacts(tenant_id, deleted_at);

-- 4. CRM Leads Table (Pre-qualification & Sales Ingestion)
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE SET NULL,
    contact_id UUID NULL REFERENCES crm_contacts(id) ON DELETE SET NULL,
    campaign_id UUID NULL REFERENCES crm_campaigns(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'DIRECT_OUTREACH' CHECK (source IN (
        'DIRECT_OUTREACH', 'WEBSITE', 'REFERRAL', 'EVENT', 'PARTNER',
        'CAMPAIGN', 'MANAGING_AGENT_NETWORK', 'BODY_CORPORATE_PORTAL', 'OTHER'
    )),
    source_detail VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (status IN (
        'NEW', 'ENRICHED', 'QUALIFIED', 'NURTURE', 'RE_ENGAGEMENT', 'LOST', 'CONVERTED'
    )),
    qualification_status VARCHAR(50) NOT NULL DEFAULT 'UNQUALIFIED' CHECK (qualification_status IN (
        'UNQUALIFIED', 'PRE_QUALIFIED', 'QUALIFIED', 'DISQUALIFIED'
    )),
    lead_owner_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    website VARCHAR(255) NULL,
    scheme_name VARCHAR(255) NULL,
    estimated_units INTEGER NULL CHECK (estimated_units IS NULL OR estimated_units >= 0),
    managing_agent VARCHAR(255) NULL,
    current_system VARCHAR(150) NULL,
    pain_points JSONB DEFAULT '[]'::jsonb,
    required_modules JSONB DEFAULT '[]'::jsonb,
    expected_timeline VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN' CHECK (expected_timeline IN (
        'IMMEDIATE', '1_3_MONTHS', '3_6_MONTHS', '6_12_MONTHS', 'NEXT_BUDGET_CYCLE', 'UNKNOWN'
    )),
    last_contacted_at TIMESTAMPTZ NULL,
    next_action_at TIMESTAMPTZ NULL,
    data_quality_state VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED' CHECK (data_quality_state IN (
        'COMPLETE', 'PARTIAL', 'STALE', 'CONFLICTED', 'UNVERIFIED', 'ERROR'
    )),
    ai_context JSONB DEFAULT '{}'::jsonb,
    source_system VARCHAR(100) NULL,
    source_record_id VARCHAR(100) NULL,
    import_sync_id VARCHAR(100) NULL,
    last_sync_at TIMESTAMPTZ NULL,
    source_confidence NUMERIC(3, 2) NULL CHECK (source_confidence BETWEEN 0.00 AND 1.00),
    converted_at TIMESTAMPTZ NULL,
    converted_opportunity_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant ON crm_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_qualification ON crm_leads(tenant_id, qualification_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON crm_leads(lead_owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org ON crm_leads(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_contact ON crm_leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_campaign ON crm_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_action ON crm_leads(tenant_id, next_action_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created ON crm_leads(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_deleted ON crm_leads(tenant_id, deleted_at);

-- 5. CRM Scheme Prospects Table (Lightweight CRM Property Prospect)
CREATE TABLE IF NOT EXISTS crm_scheme_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE SET NULL,
    lead_id UUID NULL REFERENCES crm_leads(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NULL,
    sectional_title_scheme_code VARCHAR(100) NULL,
    estimated_unit_count INTEGER NOT NULL DEFAULT 0 CHECK (estimated_unit_count >= 0),
    location JSONB DEFAULT '{}'::jsonb,
    managing_agent_name VARCHAR(255) NULL,
    current_property_system VARCHAR(150) NULL,
    current_accounting_system VARCHAR(150) NULL,
    requirements_summary TEXT NULL,
    pain_points JSONB DEFAULT '[]'::jsonb,
    notes TEXT NULL,
    data_quality_state VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED' CHECK (data_quality_state IN (
        'COMPLETE', 'PARTIAL', 'STALE', 'CONFLICTED', 'UNVERIFIED', 'ERROR'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_scheme_prospects_tenant ON crm_scheme_prospects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_scheme_prospects_org ON crm_scheme_prospects(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_scheme_prospects_lead ON crm_scheme_prospects(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_scheme_prospects_deleted ON crm_scheme_prospects(tenant_id, deleted_at);

-- 6. CRM Opportunities Table
CREATE TABLE IF NOT EXISTS crm_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE SET NULL,
    lead_id UUID NULL REFERENCES crm_leads(id) ON DELETE SET NULL,
    primary_contact_id UUID NULL REFERENCES crm_contacts(id) ON DELETE SET NULL,
    scheme_prospect_id UUID NULL REFERENCES crm_scheme_prospects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'DISCOVERY' CHECK (stage IN (
        'DISCOVERY', 'SOLUTION_DESIGN', 'PROPOSAL', 'CONTRACT', 'WON', 'LOST'
    )),
    estimated_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_value >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'ZAR',
    probability SMALLINT NOT NULL DEFAULT 20 CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATE NULL,
    owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(100) NULL,
    next_action VARCHAR(255) NULL,
    next_action_at TIMESTAMPTZ NULL,
    loss_reason TEXT NULL,
    won_at TIMESTAMPTZ NULL,
    lost_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_tenant ON crm_opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_owner ON crm_opportunities(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_org ON crm_opportunities(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_lead ON crm_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_prospect ON crm_opportunities(scheme_prospect_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_contact ON crm_opportunities(primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_close ON crm_opportunities(tenant_id, expected_close_date);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_composite ON crm_opportunities(tenant_id, stage, estimated_value DESC);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_deleted ON crm_opportunities(tenant_id, deleted_at);

-- 7. Opportunity Stage History (Audit Trail for Pipeline Velocity)
CREATE TABLE IF NOT EXISTS crm_opportunity_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
    from_stage VARCHAR(50) NULL CHECK (from_stage IS NULL OR from_stage IN (
        'DISCOVERY', 'SOLUTION_DESIGN', 'PROPOSAL', 'CONTRACT', 'WON', 'LOST'
    )),
    to_stage VARCHAR(50) NOT NULL CHECK (to_stage IN (
        'DISCOVERY', 'SOLUTION_DESIGN', 'PROPOSAL', 'CONTRACT', 'WON', 'LOST'
    )),
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_stage_history_opp ON crm_opportunity_stage_history(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_stage_history_tenant ON crm_opportunity_stage_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_stage_history_changed ON crm_opportunity_stage_history(changed_at DESC);

-- 8. CRM Activities Table (Polymorphic Interaction Tracking)
CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'CALL', 'EMAIL', 'MEETING', 'NOTE', 'DEMO', 'DISCOVERY', 'PROPOSAL', 'CONTRACT', 'OTHER'
    )),
    subject VARCHAR(255) NOT NULL,
    description TEXT NULL,
    activity_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ NULL,
    owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    lead_id UUID NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    contact_id UUID NULL REFERENCES crm_contacts(id) ON DELETE SET NULL,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE CASCADE,
    opportunity_id UUID NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_tenant ON crm_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(tenant_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_activities(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_activities_opp ON crm_activities(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_activities_org ON crm_activities(organisation_id) WHERE organisation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON crm_activities(tenant_id, activity_at DESC);

-- 9. CRM Tasks Table (Actionable Follow-ups)
CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    assigned_to UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    due_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    lead_id UUID NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    contact_id UUID NULL REFERENCES crm_contacts(id) ON DELETE SET NULL,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE CASCADE,
    opportunity_id UUID NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_tenant ON crm_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_priority ON crm_tasks(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assignee ON crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON crm_tasks(tenant_id, due_at);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead ON crm_tasks(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_tasks_opp ON crm_tasks(opportunity_id) WHERE opportunity_id IS NOT NULL;

-- 10. CRM Proposals Table (Commercial Pricing & Quote Packages)
CREATE TABLE IF NOT EXISTS crm_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE SET NULL,
    opportunity_id UUID NOT NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
    proposal_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'INTERNAL_REVIEW', 'APPROVED', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'
    )),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'ZAR',
    valid_until DATE NULL,
    issued_at TIMESTAMPTZ NULL,
    accepted_at TIMESTAMPTZ NULL,
    document_id VARCHAR(255) NULL,
    notes TEXT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_tenant_proposal_number UNIQUE (tenant_id, proposal_number)
);

CREATE INDEX IF NOT EXISTS idx_crm_proposals_tenant ON crm_proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_proposals_opp ON crm_proposals(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_proposals_org ON crm_proposals(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_proposals_status ON crm_proposals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_proposals_deleted ON crm_proposals(tenant_id, deleted_at);

-- 11. CRM Contracts Table (Legal Agreements)
CREATE TABLE IF NOT EXISTS crm_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organisation_id UUID NULL REFERENCES crm_organisations(id) ON DELETE SET NULL,
    opportunity_id UUID NULL REFERENCES crm_opportunities(id) ON DELETE SET NULL,
    proposal_id UUID NULL REFERENCES crm_proposals(id) ON DELETE SET NULL,
    contract_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'INTERNAL_REVIEW', 'APPROVED', 'SENT', 'PARTIALLY_SIGNED',
        'SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED'
    )),
    effective_date DATE NULL,
    expiry_date DATE NULL,
    signed_at TIMESTAMPTZ NULL,
    document_id VARCHAR(255) NULL,
    terms TEXT NULL,
    annual_value NUMERIC(14, 2) NULL CHECK (annual_value IS NULL OR annual_value >= 0),
    monthly_value NUMERIC(14, 2) NULL CHECK (monthly_value IS NULL OR monthly_value >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'ZAR',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_tenant_contract_number UNIQUE (tenant_id, contract_number),
    CONSTRAINT chk_contract_dates CHECK (expiry_date IS NULL OR effective_date IS NULL OR expiry_date >= effective_date)
);

CREATE INDEX IF NOT EXISTS idx_crm_contracts_tenant ON crm_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_status ON crm_contracts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_org ON crm_contracts(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_opp ON crm_contracts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_proposal ON crm_contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_dates ON crm_contracts(effective_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_deleted ON crm_contracts(tenant_id, deleted_at);

-- 12. CRM Audit Log (High-Fidelity Event Trail)
CREATE TABLE IF NOT EXISTS crm_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'lead', 'organisation', 'contact', 'scheme_prospect', 'opportunity',
        'activity', 'task', 'proposal', 'contract', 'campaign'
    )),
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    before_state JSONB NULL,
    after_state JSONB NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_audit_tenant ON crm_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_entity ON crm_audit_log(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_actor ON crm_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_timestamp ON crm_audit_log(tenant_id, timestamp DESC);

-- 13. CRM Ainubis AI Intelligence Observation Schema (Phase 003 Readiness)
CREATE TABLE IF NOT EXISTS crm_ai_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    target_entity_type VARCHAR(50) NOT NULL CHECK (target_entity_type IN (
        'lead', 'organisation', 'contact', 'scheme_prospect', 'opportunity'
    )),
    target_entity_id UUID NOT NULL,
    observation TEXT NOT NULL,
    evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendation TEXT NOT NULL,
    confidence NUMERIC(3, 2) NOT NULL CHECK (confidence BETWEEN 0.00 AND 1.00),
    model_provider_reference VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (approval_status IN (
        'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'AUTO_APPLIED'
    )),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_ai_observations_tenant ON crm_ai_observations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_observations_target ON crm_ai_observations(tenant_id, target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_observations_status ON crm_ai_observations(tenant_id, approval_status);
