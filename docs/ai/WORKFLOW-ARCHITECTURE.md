# BCIP Ainubis Workflow Architecture & Orchestration
Phase 2E — Prompt 002E-006: Ainubis Workflow Intelligence, Templates & Operational Control

## 1. Overview & Operational Pipeline

The Ainubis Workflow Engine operates as a deterministic, human-governed automation and orchestration layer on top of the BCIP CRM domain. It orchestrates controlled CRM automations while strictly preventing autonomous, unsupervised mutations.

The full operational pipeline executes across the following chain:

```text
CRM Events
    ↓
Ainubis Monitoring
    ↓
Intelligence / Observations
    ↓
Workflow Templates (SYSTEM vs TENANT)
    ↓
Workflow Definition
    ↓
Workflow Run
    ↓
Action Proposal (Action Engine)
    ↓
Human Approval Gate
    ↓
Controlled CRM Execution
    ↓
Post-Execution Verification
    ↓
Workflow Outcome
    ↓
Operational Analytics
    ↓
Workflow Health (HEALTHY / ATTENTION / DEGRADED / FAILED / UNKNOWN)
    ↓
Failure Intelligence & Log Traces
    ↓
Audit Trail / Evidence / Correlation Trace
```

---

## 2. Core Architectural Invariants

1. **Orchestration-Only Operation**: The workflow engine never directly mutates CRM entities (leads, opportunities, organisations, contacts, tasks, activities). All changes pass through the Phase 2E-004 Action Engine.
2. **Human Approval Mandatory**: Any action with significant operational or relationship impact requires explicit human review and cryptographic or session-bound approval.
3. **Strict Multi-Tenant Isolation**: Workflow templates, definitions, runs, step executions, approvals, and outcomes are strictly tenant-isolated. Tenant A can never view, execute, or mutate Tenant B records.
4. **Deterministic Idempotency**: All triggers, runs, step executions, action proposals, and verification cycles use deterministic idempotency keys (`idempotencyKey`). Duplicate events cannot produce duplicate workflow runs.
5. **Restart & Worker Safety**: All `WAIT` and `WAITING_APPROVAL` states are persisted with complete step context and correlation IDs in the database/repository. If a worker process restarts, pending runs resume safely from their last checkpoint without data loss.

---

## 3. Entity & State Domain Models

### 3.1 AutomationWorkflow
- **States**: `DRAFT`, `ACTIVE`, `PAUSED`, `DISABLED`, `ARCHIVED`
- **Fields**: `id`, `tenantId`, `name`, `description`, `workflowKey`, `version`, `status`, `trigger`, `steps`, `sourceTemplateId`, `sourceTemplateVersionId`, `sourceTemplateVersion`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`

### 3.2 WorkflowTriggerConfig
- **Trigger Types**:
  - `CRM_EVENT`: Dispatched via `crmEventBus` (e.g. `crm.lead.created`, `crm.opportunity.stage_changed`)
  - `SCHEDULED_CONDITION`: Time-based or SLA condition (e.g. `stalled_opportunity_14d`, `contract_expiring_60d`)
  - `AI_OBSERVATION`: Triggered by high-confidence continuous monitoring observation
  - `MANUAL`: Triggered by authorized operator via REST API

### 3.3 WorkflowStepConfig & Types
- `OBSERVE`: Reads current entity context and related records
- `EVALUATE`: Evaluates deterministic business criteria and threshold rules
- `PROPOSE_ACTION`: Synthesizes a proposed CRM action via the Action Engine
- `REQUEST_APPROVAL`: Enforces a human-in-the-loop approval gate with RBAC permission check
- `EXECUTE_ACTION`: Executes approved action via `ainubisActionExecutionService`
- `WAIT`: Asynchronously waits for a specified time delay or external state change
- `VERIFY`: Executes post-execution state verification via `ainubisActionVerificationService`
- `BRANCH`: Conditional branching based on prior step execution outputs
- `NOTIFY`: Dispatches operational shell notifications to portfolio managers or trustees
- `COMPLETE`: Marks the workflow run terminal state

### 3.4 WorkflowRun & Execution
- **Run States**: `QUEUED`, `RUNNING`, `WAITING_APPROVAL`, `WAITING`, `COMPLETED`, `FAILED`, `CANCELLED`, `EXPIRED`
- **Fields**: `id`, `tenantId`, `workflowId`, `workflowVersion`, `triggerType`, `correlationId`, `idempotencyKey`, `status`, `context`, `currentStepIndex`, `startedAt`, `completedAt`, `failureReason`

### 3.5 WorkflowApproval
- **States**: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`
- **Fields**: `id`, `tenantId`, `workflowRunId`, `stepExecutionId`, `actionId`, `requiredPermission`, `status`, `requestedAt`, `reviewedBy`, `reviewedAt`, `decision`, `reason`

### 3.6 WorkflowOutcome
- **Outcome Types**: `SUCCESS`, `PARTIAL_SUCCESS`, `NO_ACTION_REQUIRED`, `APPROVAL_REJECTED`, `FAILED`, `EXPIRED`, `CANCELLED`
- **Fields**: `id`, `tenantId`, `workflowRunId`, `outcomeType`, `summary`, `affectedEntities`, `actionsExecuted`, `verificationResults`, `evidenceReferences`, `completionStatus`

---

## 4. End-to-End Correlation & Audit Traceability

Every workflow execution generates a unique `correlationId` (e.g. `wfrun_1791120038616_fnwrx8c_corr`) that propagates down through:
- Trigger Event
- Workflow Run
- Step Executions
- AI Observation (if generated)
- Proposed AI Action
- Approval Request & Decision Audit
- CRM Service Execution
- Verification Audit Record
- Terminal Workflow Outcome

Operators and auditors can answer:
- **What happened?** Full step timeline with execution latency and input/output context.
- **Why did it happen?** The exact triggering event or condition and evaluation criteria.
- **Which tenant?** Strict tenant context isolation preserved throughout.
- **Who approved it?** User ID, role, timestamp, and justification recorded immutably.
- **Was it verified?** Post-action entity verification status (`VERIFIED` / `FAILED`).
