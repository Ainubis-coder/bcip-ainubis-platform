# ADR-002: Frontend React Lifecycle, API Client Reference Stability & Dependency Hygiene

## Status
**ACCEPTED** — 2026-10-03 (Phase 2E — Ainubis CRM Intelligence Foundation)

---

## 1. Architectural Rule

> **MANDATORY ARCHITECTURAL RULE:**
> **All API clients used by React components must have stable references, and React effects/callbacks must depend on stable primitive identifiers or memoized values rather than freshly created objects.**

---

## 2. Context & Problem Statement

During Phase 2E frontend integration, a React runtime error was observed:
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect,
but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

### Root Cause Analysis:
1. **Unmemoized Client Factory**: In components like `AinubisContextualPanel` and `ActionReviewModal`, the API client was being instantiated directly during component render (`const client = getCrmApiClient(...)`) without `useMemo`.
2. **Cascading Callback Invalidation**: Any `useCallback` (e.g. `loadContext`) that declared `client` in its dependency array received a brand new function reference on every single render.
3. **Synchronous Effect Loop**: Any `useEffect` listening to `[loadContext]` ran immediately on mount and after every render. Inside `loadContext`, setting state (`setIsLoading(true)`, `setObservations(...)`, `setHealthStatus(...)`) triggered immediate re-renders, producing a new client, a new callback, and an infinite effect trigger loop.
4. **Object Reference Instability**: Modals listening to complex objects (e.g. `[isOpen, opportunity]`) were sensitive to parent re-renders that recreated object references even when entity data remained unchanged.

---

## 3. Decision & Implementation Standard

The issue was diagnosed and resolved strictly at the **frontend lifecycle and dependency stability layer**. The underlying Ainubis workflow orchestration architecture (`ainubisWorkflowOrchestrationService`, repositories, step execution state machines, and REST routes) is sound, robust, and completely intact.

### Standardized Frontend Rules:

#### 1. Stable API Client References
All API clients inside React components must be instantiated using `useMemo` keyed by stable primitive identifiers:
```tsx
// ✅ CORRECT: Stable reference keyed by primitive identity
const api = useMemo(
  () => getCrmApiClient(activeTenant.id, user),
  [activeTenant.id, user.id, user.role, user.userRole]
);

// ❌ FORBIDDEN: Direct instantiation during render
const api = getCrmApiClient(activeTenant.id, user);

// ❌ DISCOURAGED: Object reference dependency
const api = useMemo(
  () => getCrmApiClient(activeTenant.id, user),
  [activeTenant.id, user] // If user object reference fluctuates, api invalidates
);
```

#### 2. Effect & Callback Dependency on Primitives
`useEffect` and `useCallback` hooks fetching entity details must depend on primitive identifiers (`id`), booleans, or stable memoized functions:
```tsx
// ✅ CORRECT: Keyed by primitive entity ID and modal visibility
const oppId = opportunity?.id;
useEffect(() => {
  if (isOpen && oppId) {
    fetchHistory(oppId);
  }
}, [isOpen, oppId]);

// ❌ FORBIDDEN: Keyed on entity object reference
useEffect(() => {
  if (isOpen && opportunity) {
    fetchHistory(opportunity.id);
  }
}, [isOpen, opportunity]);
```

#### 3. No Architecture Redesign on Frontend Defect
Frontend lifecycle and hook dependency issues must be fixed in the React presentation components without disturbing or redesigning backend orchestration services, event buses, or database layers.

---

## 4. Preservation of 002E-005 Acceptance Evidence

The full 19-suite regression test suite continues to pass with 100% compliance, verifying:
- Phase 1 Architecture, Infrastructure, Config, Worker, Web & API
- Phase 2 CRM Domain: Organisations, Contacts, Schemes, Leads, Opportunities, Activities, Tasks
- Phase 2E-001: Ainubis Intelligence Foundation & Governance
- Phase 2E-002: Ainubis CRM Dashboard & Contextual Intelligence
- Phase 2E-003: Ainubis Continuous CRM Monitoring & Automated Execution
- Phase 2E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
- Phase 2E-005: Ainubis CRM Automation Orchestration & Workflow Intelligence

### Test Verification Summary:
```
====================================================
BCIP — Phase 1 & 2 Automated Test Suite
====================================================
✓ Configuration Validation Suite
✓ Core API Layer & Health Routes
✓ Infrastructure & Persistence Manager
✓ Worker Runtime & Redis Job Engine
✓ Web Shell & Design System Integration
✓ CRM Repositories & Stage Transitions
✓ CRM API Routing & Serialization
✓ CRM Frontend View Models & Component Mounts
✓ CRM Leads Qualification & Enrichment
✓ CRM Opportunity Conversion Pipeline
✓ CRM Organisations & Scheme Prospects
✓ CRM Activities & Tasks Multi-Entity Binding
✓ Ainubis Foundation & Governance (Prompt 002E-001)
✓ Ainubis Dashboard & Contextual (Prompt 002E-002)
✓ Ainubis Continuous Monitoring (Prompt 002E-003)
✓ Ainubis Intelligence Actions (Prompt 002E-004)
✓ Ainubis Workflows & Orchestration (Prompt 002E-005)
====================================================
✅ ALL 19 TEST SUITES PASSED SUCCESSFULLY
====================================================
```
