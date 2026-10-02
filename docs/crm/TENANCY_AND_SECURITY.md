# BCIP CRM Tenancy, Security & Data Quality

## 1. Multi-Tenant Partitioning Architecture

Tenant isolation is enforced across four distinct architectural layers:

1. **Database Layer:** Every table includes `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`. Foreign key relationships and unique constraints are tenant-scoped (e.g., `uq_tenant_proposal_number UNIQUE (tenant_id, proposal_number)`).
2. **Repository Layer:** Every query method requires `tenantId: string`. Data lookups across tables strictly filter by `tenant_id`.
3. **Domain Service Layer:** Validates that linked entities (e.g. contact belonging to an organisation) reside within the same tenant. Cross-tenant linkage is rejected.
4. **API Layer (Prompt 002C):** Authentication JWTs extract `tenantId` from verified bearer tokens; queries cannot receive or override `tenantId` from URL params or request bodies.

---

## 2. Soft Deletion Discipline

Primary entities implement soft deletion using `deleted_at TIMESTAMPTZ NULL`:
- `crm_organisations`
- `crm_contacts`
- `crm_leads`
- `crm_scheme_prospects`
- `crm_opportunities`
- `crm_proposals`
- `crm_contracts`
- `crm_campaigns`

### Query Rules:
- Standard operational queries (`findById`, `findAll`) enforce `WHERE deleted_at IS NULL`.
- Audit and compliance queries can explicitly query deleted records using `{ includeDeleted: true }`.
- Physical `DELETE` operations are prohibited in standard application flows to preserve audit and regulatory compliance.

---

## 3. Data Quality Assessment Framework

CRM records support explicit data quality assessment:
- `COMPLETE`: All critical fields validated and verified.
- `PARTIAL`: Incomplete contact or scheme metrics; pending enrichment.
- `STALE`: Information has not been confirmed within 180 days.
- `CONFLICTED`: Contradictory information detected across multiple sources.
- `UNVERIFIED`: Ingested from external lead capture or partner form without human verification.
- `ERROR`: Invalid email, disconnected phone number, or invalid registration number.

**Ainubis AI Rule:** Ainubis agents must never treat `UNVERIFIED`, `PARTIAL`, or `CONFLICTED` data as ground truth.

---

## 4. Privacy & PII Guardrails

In compliance with POPIA (Protection of Personal Information Act) and GDPR:
- Contact information (`email`, `phone`, `mobile`) is masked in standard audit logs (`[REDACTED]`).
- Commercial proposals and contracts protect banking details and pricing models.
- AI Gateway invocations check outgoing prompts against `@bcip/ai` PII redaction filters before sending data to external LLM providers.
