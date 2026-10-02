# BCIP CRM Events, Audit Trail & Ainubis AI Readiness

## 1. CRM Workflow Event Catalog

The CRM domain emits standardized, versioned event envelopes via `CRMEventBus` (`crmEventBus`):

| Event Topic | Trigger Condition | Standard Payload Keys |
| :--- | :--- | :--- |
| `crm.lead.created` | New lead captured | `leadId`, `title`, `source` |
| `crm.lead.updated` | Lead details modified | `leadId`, `changes` |
| `crm.lead.qualified` | Lead marked qualified | `leadId`, `qualificationStatus` |
| `crm.lead.status_changed`| Lead lifecycle transition | `leadId`, `fromStatus`, `toStatus`, `reason` |
| `crm.lead.assigned` | Lead owner reassigned | `leadId`, `newOwnerId` |
| `crm.lead.converted` | Lead converted to opportunity | `leadId`, `opportunityId`, `organisationId`, `contactId` |
| `crm.organisation.created` | Organisation created | `organisationId`, `name`, `type` |
| `crm.contact.created` | Contact created | `contactId`, `name`, `organisationId` |
| `crm.scheme_prospect.created` | Scheme prospect created | `schemeProspectId`, `name`, `unitCount` |
| `crm.opportunity.created` | Opportunity created | `opportunityId`, `name`, `stage`, `value` |
| `crm.opportunity.stage_changed` | Stage progressed/regressed | `opportunityId`, `fromStage`, `toStage`, `reason`, `value` |
| `crm.activity.created` | Interaction recorded | `activityId`, `type`, `subject`, `opportunityId` |
| `crm.task.created` | Action item generated | `taskId`, `title`, `priority`, `assignedTo` |
| `crm.task.completed` | Action item completed | `taskId`, `title`, `completedAt` |
| `crm.proposal.created` | Commercial quote created | `proposalId`, `proposalNumber`, `opportunityId`, `total` |
| `crm.proposal.approved` | Quote approved internally | `proposalId`, `total` |
| `crm.proposal.sent` | Quote delivered to client | `proposalId`, `total`, `issuedAt` |
| `crm.proposal.accepted` | Client accepts quote | `proposalId`, `total`, `acceptedAt` |
| `crm.contract.created` | Contract drafted | `contractId`, `contractNumber`, `opportunityId` |
| `crm.contract.sent` | Contract dispatched for signature | `contractId`, `contractNumber` |
| `crm.contract.signed` | Contract executed | `contractId`, `signedAt` |
| `crm.contract.activated` | Service agreement active | `contractId`, `effectiveDate` |

Events automatically trigger matching automated workflows registered in `@bcip/workflows`.

---

## 2. Centralized Audit Trail

The `crm_audit_log` records every significant state change:
- `tenant_id`: Mandatory tenant boundary.
- `entity_type`: `lead`, `organisation`, `contact`, `scheme_prospect`, `opportunity`, `activity`, `task`, `proposal`, `contract`, `campaign`.
- `entity_id`: UUID of the affected entity.
- `action`: Specific action (e.g. `OPPORTUNITY_STAGE_CHANGED`, `LEAD_CONVERTED`).
- `actor_user_id`: Authenticated user executing the action.
- `before_state`: JSON snapshot of affected fields prior to change.
- `after_state`: JSON snapshot of affected fields post-change.
- `timestamp`: UTC timestamp.

The audit log is append-only and immutable.

---

## 3. Ainubis AI Intelligence Readiness (Phase 003 Preparation)

Rather than embedding an opaque, unaccountable `ai_score` integer into CRM tables, BCIP establishes a structured traceability architecture:

### Table: `crm_ai_observations`
- `target_entity_type`: The CRM entity analyzed (`lead`, `opportunity`, `organisation`).
- `target_entity_id`: Entity UUID.
- `observation`: Human-readable summary of patterns detected (e.g. "Arrears collection rate indicates high urgency for automated levy roll reconciliation").
- `evidence_references`: Array of source records (e.g. `["crm_activity:act_123", "lead:pain_points"]`).
- `recommendation`: Recommended next action (e.g. "Dispatch Sectional Title Act compliance demo").
- `confidence`: Calibrated confidence metric (0.00 to 1.00).
- `model_provider_reference`: LLM identifier (e.g. `gemini-2.5-flash`).
- `prompt_version`: Version of system prompt used.
- `approval_status`: `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `AUTO_APPLIED`.
- `reviewed_by`: Human operator who audited the AI insight.

This guarantees full AI accountability and governance ahead of Phase 003 implementation.
