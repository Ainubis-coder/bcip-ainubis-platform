# BCIP CRM Domain & Database Schema Architecture

**Phase:** 002 — CRM & Sales Engine  
**Step:** 002B — CRM Domain Model & Database Schema  
**Package:** `@bcip/database` (`packages/database`)  
**Pipeline:** `Lead → Contact → Organisation → Scheme Prospect → Opportunity → Activity → Task → Proposal → Contract`

---

## 1. Architectural Mission

The BCIP CRM Domain Model and PostgreSQL Relational Schema establishes the commercial and relationship management core for the Body Corporate Intelligence Platform (BCIP). Designed specifically for South African and global sectional-title property management ecosystems, it governs interactions with Managing Agents, Bodies Corporate, Trustee Boards, Homeowners Associations, and Developers.

The foundation is strictly:
- **Multi-Tenant**: Scoped with mandatory `tenant_id` partitioning across all 13 CRM database tables.
- **Relational & Normalized**: Foreign keys with referential integrity, preventing detached records or inconsistent state.
- **Auditable**: Immutable stage history (`crm_opportunity_stage_history`) and centralized audit logging (`crm_audit_log`) recording before/after states.
- **Permission-Aware**: Integrated with `@bcip/auth` RBAC and ownership models.
- **Workflow-Ready**: Emits controlled domain events (`crm.*`) directly to the BCIP workflow engine.
- **Ainubis-Ready**: Formats entities with evidence links and structured context, paving the way for Phase 003 AI qualification without opaque scores.

---

## 2. CRM Documentation Index

| Document | Description |
| :--- | :--- |
| [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) | Entity models, property definitions, nullable/non-nullable rationale, and ownership rules |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | PostgreSQL DDL specifications, check constraints, decimal precision, and indexing strategies |
| [ERD.md](./ERD.md) | Entity Relationship Diagrams (Mermaid and ASCII) detailing cardinalities |
| [STATES_AND_LIFECYCLES.md](./STATES_AND_LIFECYCLES.md) | Controlled enums, Lead conversion workflow, Opportunity pipeline, and Contract execution states |
| [TENANCY_AND_SECURITY.md](./TENANCY_AND_SECURITY.md) | Multi-tenant isolation enforcement, soft deletion rules, data quality states, and PII guardrails |
| [EVENTS_AND_AUDIT.md](./EVENTS_AND_AUDIT.md) | Event topic catalog, audit trail requirements, and Ainubis AI traceability |

---

## 3. Core Domain Entities

1. **Lead**: Ingests inbound and outbound prospects with source attribution, qualification state, and property metrics.
2. **Organisation**: Business entities such as Managing Agents, Bodies Corporate, and HOA structures.
3. **Contact**: Individuals associated with organisations (Managing Directors, Trustees, Portfolio Managers).
4. **Scheme Prospect**: Lightweight CRM prospect representation of a sectional title scheme prior to operational onboarding.
5. **Campaign**: Marketing and outbound campaigns for attribution and spend tracking.
6. **Opportunity**: Sales pipeline deals tracking monetary value, probabilities, and close dates.
7. **OpportunityStageHistory**: Immutable audit record tracking pipeline velocity and stage transitions.
8. **Activity**: Polymorphic interaction log (calls, emails, meetings, demos) linked to CRM entities.
9. **Task**: Actionable follow-ups with priority tiers and due dates.
10. **Proposal**: Commercial quotation packages with line-item pricing and decimal financial calculations.
11. **Contract**: Legal Master Service Agreements and software licenses with versioned execution states.
12. **Audit Log**: High-fidelity event log capturing actor user IDs, actions, and before/after states.
13. **Ainubis Observation**: Structural foundation for Phase 003 AI recommendations and evidence tracking.

---

## 4. Migration & Database Execution

Migrations are managed via the versioned migration runner:

- Baseline schema: `packages/database/src/migrations/0001_initial_multi_tenant_schema.sql`
- CRM schema: `packages/database/src/migrations/0002_crm_domain_schema.sql`

To run migrations programmatically:
```typescript
import { migrationManager } from '@bcip/database';

await migrationManager.applyAllPending();
```

To seed development test fixtures:
```typescript
import { seedCrmDevelopmentData } from '@bcip/database';

await seedCrmDevelopmentData('tenant-demo-id', 'usr_admin');
```
