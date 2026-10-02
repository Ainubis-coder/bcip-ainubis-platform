# Ainubis CRM Intelligence Architecture

Ainubis is architected with a strict commitment to enterprise safety, tenant isolation, and deterministic reasoning. It is designed to act as a co-pilot, where every recommendation is grounded in verifiable CRM facts and requires human verification before execution.

```
       ┌────────────────────────────────────────────────────────┐
       │                 Ainubis REST API                       │
       │           /api/v1/ai/observations                      │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────▼─────────────────────────────┐
       │               Ainubis Context Builder                  │
       │       - Gathers tenant-isolated CRM data               │
       │       - Enforces strict tenant validation              │
       │       - Applies PII masking guardrails                 │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────▼─────────────────────────────┐
       │                AIGateway Policy Check                  │
       │       - Token limit thresholds                         │
       │       - Sensitive pattern redaction                    │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────▼─────────────────────────────┐
       │            Ainubis Capability Registry                 │
       │       - Rule Engine / LLM Grounding                    │
       │       - Generates structured observations              │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────▼─────────────────────────────┐
       │                AIObservationRepository                 │
       │       - Persists to tenant-isolated storage            │
       │       - Enforces human-in-the-loop lifecycle           │
       └────────────────────────────────────────────────────────┘
```

## Core Architectural Pillars

1. **Strict Tenant Isolation**: All context collection, observation generation, and human approvals are bounded within the verified `tenantId` session. Under no circumstances can data from Tenant A cross over to Tenant B.
2. **PII Masking**: Sensitive fields such as credit card numbers or national identification patterns are automatically detected and redacted before transit.
3. **Traceability**: Every observation is backed by one or more `EvidenceReference` records containing exact entity IDs, field paths, values, and relevance scores.
