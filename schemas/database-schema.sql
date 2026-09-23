-- ==============================================================================
-- BCIP — BODY CORPORATE INTELLIGENCE PLATFORM
-- PREVIEW SCHEMA FOUNDATION (Prompt 001 Bootstrap)
-- Full schema migrations will be formalized in Prompt 003 — Database Foundation
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Managing Agent Tenant Entities
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Body Corporate Schemes
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    scheme_code VARCHAR(50) NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 0,
    financial_year_end_month SMALLINT NOT NULL DEFAULT 2,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tenant isolation
CREATE INDEX IF NOT EXISTS idx_schemes_tenant_id ON schemes(tenant_id);

-- 4. Sections and Units
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    section_number VARCHAR(50) NOT NULL,
    participation_quota NUMERIC(8, 5) NOT NULL DEFAULT 0.00000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_units_scheme_id ON units(scheme_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON units(tenant_id);
