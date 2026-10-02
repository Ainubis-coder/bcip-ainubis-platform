# Ainubis Continuous CRM Intelligence & Automated Monitoring

## Overview
Phase 2E (Prompt 002E-003) introduces Ainubis Continuous CRM Intelligence and Automated Monitoring. Ainubis continuously monitors sectional title CRM entities for operational conditions, data quality gaps, and pipeline hygiene risks without requiring manual user initiation.

## Architecture & Operating Model
```
CRM EVENT / SCHEDULE
        ↓
AINUBIS MONITOR
        ↓
TENANT-SCOPED CONTEXT
        ↓
POLICY / PII GUARDRAILS
        ↓
INTELLIGENCE CAPABILITY
        ↓
DETERMINISTIC ANALYSIS
        ↓
EVIDENCE → AI OBSERVATION → DASHBOARD → HUMAN REVIEW
```

### Core Principles
- **Monitor → Detect → Explain → Evidence → Recommend → Human Decision**
- **Strict Isolation**: Monitoring executes strictly tenant-scoped. Tenant A observations and executions are never accessible to Tenant B.
- **Failure Isolation**: A failure during monitoring for one tenant does not disrupt monitoring for other tenants.
- **Idempotent Deduplication**: Deterministic condition keys prevent duplicate observations on repeated scans.
- **Auto-Resolution**: When defective CRM conditions are resolved (e.g., missing phone added, task completed), Ainubis automatically transitions active observations to `RESOLVED`.
- **Zero Autonomous CRM Mutability**: Ainubis never automatically modifies CRM records, updates pipeline stages, or dispatches communications. Humans retain sole decision-making authority.

## Monitoring Capabilities
1. **CRM_PIPELINE_HYGIENE**: Detects stalled opportunities (>14 days idle), missing valuation / close dates, overdue follow-up tasks, and stage inactivity.
2. **CRM_LEAD_HYGIENE**: Flags inbound leads lacking contact phone/email or uncontacted for >14 days in NEW status.
3. **CRM_ORGANISATION_HYGIENE**: Identifies corporate entities missing business registration numbers or lacking linked contacts.
4. **CRM_SCHEME_PROSPECT_HYGIENE**: Detects sectional title scheme prospects with unspecified/zero unit counts.
5. **CRM_TASK_HYGIENE**: Surfaces overdue operational tasks and unreviewed commitments.

## API Endpoints
- `GET /api/v1/ai/monitoring/status` — Retrieve monitoring overview, active observation counts, and recent errors.
- `GET /api/v1/ai/monitoring/capabilities` — Retrieve central capability registry metadata and per-capability tenant stats.
- `GET /api/v1/ai/monitoring/executions` — Retrieve execution history timeline.
- `POST /api/v1/ai/monitoring/run` — Trigger manual monitoring run (gated by `crm:ai:monitor`).
