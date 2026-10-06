# BCIP Ainubis Workflow Governance & Template Lifecycle
Phase 2E — Prompt 002E-006 & 4A: Template Tenancy, Ownership, Immutability & Safety Boundaries

## 1. Tenancy Model: SYSTEM vs. TENANT Scopes

The BCIP platform enforces a multi-tenant template governance model:

### 1.1 SYSTEM Templates (Platform Governed)
- **Ownership**: Owned and governed exclusively by the BCIP platform core.
- **Attributes**: `templateScope = 'SYSTEM'`, `ownerTenantId = null`, `tenantId = 'SYSTEM'`.
- **Reusability**: Globally reusable across all authorized BCIP tenants.
- **Immutability**: Tenant users are strictly forbidden from modifying, publishing, deprecating, archiving, or deleting SYSTEM templates (`403 Forbidden`).
- **Permitted Operations for Tenants**: Authorized tenant users may `VIEW`, `VALIDATE`, `INSTANTIATE`, and `CLONE`.

### 1.2 TENANT Templates (Private Tenant Blueprints)
- **Ownership**: Owned exclusively by the creating tenant.
- **Attributes**: `templateScope = 'TENANT'`, `ownerTenantId = <tenantId>`, `tenantId = <tenantId>`.
- **Isolation**: Tenant B cannot view, query, modify, or instantiate Tenant A's private templates. Cross-tenant access returns `404 Not Found` to prevent information leakage.
- **Lifecycle**: Created via `POST /api/v1/ai/workflow-templates` or by cloning a SYSTEM template.

---

## 2. The Six Canonical Governed Platform Templates

The platform provisions six immutable, canonical SYSTEM templates available out of the box:

1. **`NEW_LEAD_QUALIFICATION`**: Identifies newly created CRM leads and guides the human qualification and engagement SLA.
2. **`STALLED_OPPORTUNITY_FOLLOW_UP`**: Flags sales opportunities stagnating in stages like PROPOSAL or NEGOTIATION and schedules follow-up tasks.
3. **`PROPOSAL_FOLLOW_UP`**: Monitors proposal delivery and schedules review reminders if trustees have not provided feedback within 7 days.
4. **`OVERDUE_TASK_ESCALATION`**: Tracks overdue CRM tasks and alerts portfolio managers / executives for controlled escalation.
5. **`CONTRACT_RENEWAL_REMINDER`**: Scans expiring agreements 60 days before termination and schedules renewal review tasks (CRM tasks only; never auto-renews contracts).
6. **`ORGANISATION_HEALTH_INTERVENTION`**: Detects deteriorating CRM health markers in key sectional title accounts and proposes trustee reviews.

These templates exist as canonical platform blueprints and are never duplicated per tenant.

---

## 3. Cloning & Provenance

When a tenant clones a SYSTEM template (or their own template):
- A new `TENANT`-scoped template is created with `status = 'DRAFT'`.
- `ownerTenantId` is set to the requesting tenant's ID.
- Upstream provenance is preserved:
  - `sourceTemplateId`: ID of the source template
  - `sourceTemplateVersionId`: Specific immutable version ID of the source
  - `sourceTemplateVersion`: Version number of the source template
- Tenant customizations to the clone do not affect the source SYSTEM template or any other tenant.

---

## 4. Versioning & Non-Disruptive Upgrades

- **Version Immutability**: Published template versions are completely immutable. Changes require creating a new incremented version.
- **Independent Execution**: When a tenant instantiates a workflow from a template version (e.g. `v1`), the workflow captures the snapshot configuration and preserves `sourceTemplateVersion = 1`.
- **No Automatic Workflow Mutation**: Publishing a new SYSTEM template version (e.g. `v2`) **never** automatically mutates existing workflows. Existing workflows continue running on `v1`. Upgrades must be explicit and operator-approved.

---

## 5. Workflow Definition Validator (`AinubisWorkflowDefinitionValidator`)

All template publications and workflow activations must pass deterministic structural and capability validation:
1. **Structural Checks**:
   - Must have at least one step.
   - Steps must start at `order = 1` and be numbered sequentially without gaps.
   - Step keys must be non-empty and unique within the workflow.
2. **Safety & Capability Guardrails**:
   - Step action types are strictly limited to permitted Action Engine capabilities:
     `CREATE_TASK`, `CREATE_ACTIVITY`, `UPDATE_LEAD_STATUS`, `UPDATE_OPPORTUNITY_STAGE`, `UPDATE_OPPORTUNITY_ATTRIBUTES`.
   - Rejects any forbidden capability:
     - No financial or invoice transactions (`PROCESS_LEVY_TRANSACTION`, `BANKING_ACTION`)
     - No payment or disbursement automation
     - No statutory record mutations
     - No role or permission mutations
     - No record deletions
     - No arbitrary code execution
     - No autonomous contract renewals or execution

---

## 6. Human-in-the-Loop Approval Governance

- Every action with real-world impact incorporates a `REQUEST_APPROVAL` step.
- Execution halts in `WAITING_APPROVAL` status until an authorized principal with matching RBAC permissions approves or rejects the action.
- Approval records include `requestedAt`, `reviewedBy`, `reviewedAt`, `decision`, and `reason`, forming an indelible compliance audit log.
- Expired, rejected, or cancelled approvals can never be executed.
