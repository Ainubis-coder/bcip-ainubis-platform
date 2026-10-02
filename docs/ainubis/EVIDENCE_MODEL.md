# Ainubis CRM Evidence Model

Ainubis is strictly prohibited from assuming unverified data is factual or presenting recommendations without clear, auditable sources. The Evidence Model defines how every AI observation must be grounded in facts.

## The `EvidenceReference` Schema

Every `AIObservationRecord` includes an array of `EvidenceReference` objects:

```typescript
export interface EvidenceReference {
  id: string;
  tenantId: string;
  entityType:
    | 'lead'
    | 'organisation'
    | 'contact'
    | 'scheme_prospect'
    | 'opportunity'
    | 'activity'
    | 'task'
    | 'proposal'
    | 'contract'
    | 'campaign';
  entityId: string;
  field?: string;
  value?: unknown;
  source: string;        // e.g. "CRM Opportunity Record"
  evidenceType: string;  // e.g. "STATE_CHECK", "DUE_DATE_CHECK"
  relevance: number;     // 0.0 to 1.0 (coefficient of weight)
  timestamp: string;     // ISO timestamp of fact observation
}
```

## Traceability Rules

1. **Explicit Identification**: No generic "an activity" — the exact `id` of the activity or task must be referenced.
2. **Relevance Grading**: Facts contributing directly to the decision receive higher relevance scores.
3. **Immutability**: Once recorded, the evidence trace of an observation is immutable to preserve historical audit integrity.
