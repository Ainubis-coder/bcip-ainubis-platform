# BCIP Ainubis Workflows & Templates Operator Guide
Phase 2E — Prompt 002E-006: Operational Control, Telemetry & API Reference

## 1. REST API Reference

### 1.1 Workflow Definitions
- `GET /api/v1/ai/workflows`: List active/paused workflows for requesting tenant. Supports `status` and `search` query parameters.
- `POST /api/v1/ai/workflows`: Create custom workflow definition.
- `GET /api/v1/ai/workflows/:id`: Retrieve single workflow definition.
- `PUT /api/v1/ai/workflows/:id`: Update workflow definition.
- `POST /api/v1/ai/workflows/:id/activate`: Transition workflow status to `ACTIVE`.
- `POST /api/v1/ai/workflows/:id/pause`: Transition workflow status to `PAUSED`.
- `POST /api/v1/ai/workflows/:id/disable`: Disable workflow execution.
- `POST /api/v1/ai/workflows/:id/archive`: Archive workflow definition.
- `GET /api/v1/ai/workflows/:id/runs`: List historical execution runs for a workflow.
- `POST /api/v1/ai/workflows/:id/run`: Manually dispatch an execution run.

### 1.2 Workflow Execution Runs & Audit
- `GET /api/v1/ai/workflow-runs/:id`: Get execution run details.
- `POST /api/v1/ai/workflow-runs/:id/cancel`: Cancel an active or waiting workflow run.
- `POST /api/v1/ai/workflow-runs/:id/retry`: Retry a failed workflow run from the failed step.
- `GET /api/v1/ai/workflow-runs/:id/timeline`: Get full step-by-step execution timeline with duration and status.
- `GET /api/v1/ai/workflow-runs/:id/outcome`: Get terminal execution outcome and verified entity impacts.
- `GET /api/v1/ai/workflow-runs/:id/approvals`: Get approval records and decision logs.
- `GET /api/v1/ai/workflow-runs/:id/evidence`: Get audit evidence references attached to the execution.

### 1.3 Workflow Templates & Governance (Prompt 4A)
- `GET /api/v1/ai/workflow-templates`: List templates visible to tenant (`SYSTEM` platform templates + requesting tenant's `TENANT` templates). Supports `scope` (`SYSTEM` | `TENANT` | `ALL`), `status`, `category`.
- `POST /api/v1/ai/workflow-templates`: Create a new `TENANT`-scoped draft template.
- `GET /api/v1/ai/workflow-templates/:id`: Get template details. Cross-tenant access returns 404.
- `PUT /api/v1/ai/workflow-templates/:id`: Update draft template. Forbidden for `SYSTEM` templates (403).
- `DELETE /api/v1/ai/workflow-templates/:id`: Soft-delete tenant template. Forbidden for `SYSTEM` templates (403).
- `POST /api/v1/ai/workflow-templates/:id/validate`: Deterministically validate template structure and capabilities.
- `POST /api/v1/ai/workflow-templates/:id/publish`: Publish template and create immutable version. Forbidden for `SYSTEM` templates (403).
- `POST /api/v1/ai/workflow-templates/:id/deprecate`: Mark template deprecated. Forbidden for `SYSTEM` templates (403).
- `POST /api/v1/ai/workflow-templates/:id/archive`: Archive template. Forbidden for `SYSTEM` templates (403).
- `POST /api/v1/ai/workflow-templates/:id/clone`: Clone a `SYSTEM` or `TENANT` template into a new tenant-owned template with full upstream provenance.
- `POST /api/v1/ai/workflow-templates/:id/instantiate`: Instantiate a published template into an active tenant workflow.
- `GET /api/v1/ai/workflow-templates/:id/versions`: List immutable historical versions of the template.

### 1.4 Operational Analytics & Health Intelligence
- `GET /api/v1/ai/workflows/operations`: Operational overview KPIs (total, active, paused, runs today, awaiting approval, failed).
- `GET /api/v1/ai/workflows/analytics`: Historical run analytics, success/failure rates, average durations, SLA compliance.
- `GET /api/v1/ai/workflows/step-analytics`: Step-level execution metrics, failure rates, bottleneck identification.
- `GET /api/v1/ai/workflows/health`: Evaluates and returns health state (`HEALTHY`, `ATTENTION`, `DEGRADED`, `FAILED`, `UNKNOWN`) for all workflows.

---

## 2. Health Telemetry & Failure Intelligence

Ainubis derives deterministic health metrics using five standardized states:

| Health Status | Trigger Condition |
| :--- | :--- |
| **`HEALTHY`** | Workflow has executed runs with >80% success rate, no pending verification failures, and low approval backlog (<5). |
| **`ATTENTION`** | Elevated approval backlog (≥5 pending approvals), high retry rate, or recent waiting run timeouts. |
| **`DEGRADED`** | Repeated step failures (failure rate between 30% and 50%), or intermittent verification failures. |
| **`FAILED`** | High failure rate (>50%), 3 or more consecutive run failures, or disabled following fatal execution failures. |
| **`UNKNOWN`** | No execution evidence (0 recorded runs). |

### Failure Intelligence Observations
When a workflow enters `ATTENTION`, `DEGRADED`, or `FAILED` status, the analytics engine generates an traceable `AIObservationRecord`:
- Condition Keys:
  - `workflow.failure.<workflowId>`
  - `workflow.repeated_failure`
  - `workflow.step_failure`
  - `workflow.verification_failure`
  - `workflow.approval_backlog`
- Confidence Score: `95%` (`HIGH`)
- Evidence: Detailed step error logs and run IDs attached as `EvidenceReference`.
- Suggested Action: Recommends review of definition, trigger rules, or human backlog without autonomously altering the workflow.

---

## 3. Worker & Event Bus Integration

1. **Event Dispatching**:
   - `crmEventBus.subscribe()` listens to domain events (`crm.lead.created`, etc.).
   - Matches active workflows configured with `CRM_EVENT` triggers for the event's tenant.
   - Idempotently creates and queues a `WorkflowRun`.
2. **Worker Processing**:
   - Executes step sequential pipeline.
   - Evaluates criteria, proposes action, records approval request.
   - Upon human approval, invokes Action Engine and triggers verification.
   - Persists state at every step for restart safety.
