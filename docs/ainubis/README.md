# Ainubis CRM Intelligence Foundation & Governance

Ainubis is the central intelligence and governance engine of the BCIP platform. It provides deterministic, audit-traceable, and evidence-grounded insights, observations, and recommendations across the CRM and property management lifecycle.

## Modules & Documentation

1. **[Architecture](ARCHITECTURE.md)**: Conceptual architecture, tenant-isolation boundary, and safe execution model.
2. **[Intelligence Model](INTELLIGENCE_MODEL.md)**: Taxonomy, enums, states, and capability registry.
3. **[Evidence Model](EVIDENCE_MODEL.md)**: Grounding lineage, data completeness, and source traceability.
4. **[Approval Model & Governance](APPROVAL_MODEL.md)**: Human-in-the-loop review, approval gates, and actions.
5. **[Capabilities](CAPABILITIES.md)**: The pipeline hygiene analyzer (`CRM_PIPELINE_HYGIENE`) and active capability registry.
6. **[Security & Policy](SECURITY.md)**: PII guardrails, token usage limit, and cross-tenant prevention.
7. **[Events Registry](EVENTS.md)**: Trigger policy, events, and background worker jobs.

## Core Capabilities

- **CRM_PIPELINE_HYGIENE**: Audit pipeline gaps, stalled opportunities (>14 days idle), overdue tasks, and incomplete forecast values.
- **CRM_DATA_QUALITY**: Detect contact omissions and unverified fields.
- **CRM_LEAD_QUALIFICATION**: Assess conversion preparedness and deal risks.
