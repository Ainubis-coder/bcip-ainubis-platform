# BCIP CRM Database Schema Specification

## 1. Overview & Technical Conventions

- **Database Engine:** PostgreSQL 15+ / 16+
- **Primary Keys:** UUID v4 (`uuid_generate_v4()`)
- **Foreign Keys:** Explicit referential constraints with `ON DELETE CASCADE`, `ON DELETE SET NULL`, or `ON DELETE RESTRICT`.
- **Financial Precision:** Strictly `NUMERIC(14, 2)` (no floating point types).
- **Date & Time:** `TIMESTAMPTZ` (UTC ISO 8601).
- **Multi-Tenancy:** `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
- **Soft Deletion:** `deleted_at TIMESTAMPTZ NULL` on all primary entities.

---

## 2. Table Catalog

| Table | Purpose | Primary Keys / Indexes | Soft Delete |
| :--- | :--- | :--- | :--- |
| `crm_campaigns` | Marketing & sales outbound campaigns | PK, `(tenant_id, status)` | Yes |
| `crm_organisations` | Customer & prospect business entities | PK, `(tenant_id, status)`, `(tenant_id, reg)` | Yes |
| `crm_contacts` | Individual business contacts | PK, `(tenant_id, email)`, `(organisation_id)` | Yes |
| `crm_scheme_prospects`| Lightweight scheme property prospects | PK, `(tenant_id)`, `(organisation_id)` | Yes |
| `crm_leads` | Inbound & qualified leads | PK, `(tenant_id, status)`, `(tenant_id, owner)` | Yes |
| `crm_opportunities` | Commercial pipeline deals | PK, `(tenant_id, stage, value)` | Yes |
| `crm_opportunity_stage_history` | Stage velocity audit trail | PK, `(opportunity_id)`, `(changed_at)` | No (Append-only) |
| `crm_activities` | Polymorphic interaction log | PK, `(tenant_id, type)`, `(lead_id)`, `(opp_id)` | No |
| `crm_tasks` | Action items and follow-ups | PK, `(tenant_id, status, due_at)` | No |
| `crm_proposals` | Commercial pricing packages | PK, `(tenant_id, proposal_number UNIQUE)` | Yes |
| `crm_contracts` | Legal agreements & contracts | PK, `(tenant_id, contract_number UNIQUE)` | Yes |
| `crm_audit_log` | Centralized audit trail | PK, `(tenant_id, entity_type, entity_id)` | No (Immutable) |
| `crm_ai_observations` | Ainubis intelligence context | PK, `(tenant_id, target_entity_id)` | No |

---

## 3. Financial Numeric Strategy

All monetary amounts must use `NUMERIC(14,2)` or `NUMERIC(14,4)`:
- `crm_opportunities.estimated_value`: `NUMERIC(14, 2) NOT NULL DEFAULT 0.00`
- `crm_proposals.subtotal`: `NUMERIC(14, 2) NOT NULL DEFAULT 0.00`
- `crm_proposals.tax`: `NUMERIC(14, 2) NOT NULL DEFAULT 0.00`
- `crm_proposals.total`: `NUMERIC(14, 2) NOT NULL DEFAULT 0.00`
- `crm_contracts.annual_value`: `NUMERIC(14, 2) NULL`
- `crm_contracts.monthly_value`: `NUMERIC(14, 2) NULL`

Floating point datatypes (`REAL`, `FLOAT`, `DOUBLE PRECISION`) are prohibited in CRM financial fields due to IEEE 754 precision drift.

---

## 4. Indexing & Query Optimization Strategy

Indexes are created intentionally based on expected query patterns:

1. **Tenant Filtering:** `idx_<table_name>_tenant` on `(tenant_id)` ensures index scans across all partition queries.
2. **Pipeline Stage & Value:** `idx_crm_opportunities_composite` on `(tenant_id, stage, estimated_value DESC)` supports pipeline board rendering and revenue forecasting.
3. **Due Date Alerting:** `idx_crm_tasks_due` on `(tenant_id, due_at)` supports worker jobs querying overdue tasks.
4. **Soft Delete Filtering:** `idx_<table_name>_deleted` on `(tenant_id, deleted_at)` accelerates queries filtering out soft-deleted records.
5. **Partial Indexes on Polymorphic Foreign Keys:** Partial indexes like `idx_crm_activities_opp ON crm_activities(opportunity_id) WHERE opportunity_id IS NOT NULL` minimize index footprint while accelerating entity-specific activity timeline lookups.
