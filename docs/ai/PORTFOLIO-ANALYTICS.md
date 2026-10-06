# BCIP Ainubis CRM Portfolio Analytics Reference Guide
## Phase 2E — Prompt 002E-007

This document details the deterministic calculation rules, evidence grounding, and priority scoring algorithms.

---

## 1. Metrics & Threshold Definitions

| Metric | Definition | Base Source | Alert Threshold |
| :--- | :--- | :--- | :--- |
| **Stalled Opportunities** | Proposal/Discovery stage, updated > 14 days ago | `OpportunityRepository` | $> 0$ stalled |
| **Overdue Tasks** | Active tasks past their `dueAt` date | `TaskRepository` | $> 5$ overdue |
| **Workflow Failures** | Execution runs terminating in FAILED state | `WorkflowRunRepository` | $> 0$ failures |
| **Incomplete Scheme Data** | Active prospects missing estimated units | `SchemeProspectRepository` | $> 0$ incomplete |

---

## 2. Priority Scoring Algorithm
Priority Queue items are ranked based on a composite score $S$:

$$S = \text{Severity Weight} + \text{Impact Score} + \text{Confidence Score}$$

- **Severity Weight**: `CRITICAL` ($+40$), `HIGH` ($+20$), `MEDIUM` ($+10$), `LOW` ($+0$).
- **Impact Score**: Based on `affectedEntityCount`.
- **Evidence Confidence**: Derived from `confidence` score (e.g. $90/100$).

Items with $S \ge 70$ are flagged as urgent operational review requirements.
All priorities are advisory and contain direct links to supporting evidence.
