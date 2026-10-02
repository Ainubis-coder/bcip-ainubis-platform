# BCIP CRM API Security & RBAC Guide

## 1. Multi-Tenant Isolation (Non-Negotiable)

Tenant isolation is enforced at four distinct tiers:

1. **Protocol Tier (`authMiddleware`)**:
   The tenant boundary is extracted exclusively from cryptographic JWT claims (`payload.tenantId`). A client can never switch tenant context via headers or request parameters.
2. **Controller Tier**:
   All controllers extract `req.tenantId!` and pass it directly to domain service calls.
3. **Domain Service Tier**:
   Domain services scope all operations (reads, mutations, associations) to the provided `tenantId`.
4. **Repository Tier (`BaseCrmRepository`)**:
   All queries filter by `tenantId`. Cross-tenant lookups evaluate to `null` and return `404 Not Found` (non-disclosing), preventing enumeration attacks.

---

## 2. Role-Based Access Control (RBAC)

BCIP enforces least-privilege RBAC using granular permissions defined in `@bcip/auth`.

### Permission Matrix

| Role | CRM Leads | CRM Orgs & Contacts | Opportunities & Pipeline | Proposals & Contracts | Tasks & Activities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PLATFORM_SUPER_ADMIN** | Full (CRUD, Convert) | Full (CRUD) | Full (CRUD, Stage) | Full (CRUD, Send, Sign, Activate) | Full (CRUD, Complete) |
| **MANAGING_AGENT_ADMIN** | Full (CRUD, Convert) | Full (CRUD) | Full (CRUD, Stage) | Full (CRUD, Send, Sign, Activate) | Full (CRUD, Complete) |
| **PORTFOLIO_MANAGER** | View, Create, Edit, Convert | View, Create, Edit | View, Create, Edit, Stage | View Only | View, Create, Edit, Complete |
| **SCHEME_TRUSTEE** | None | View Only | None | View Only | View Only |
| **FINANCIAL_AUDITOR** | None | View Only | View Only | View Only | None |
| **PROPERTY_OWNER / TENANT**| None | None | None | None | None |

---

## 3. Idempotency Protection

Mutation endpoints that trigger state machine transitions accept an `Idempotency-Key` HTTP header:

* `POST /api/v1/leads/:id/convert`
* `POST /api/v1/opportunities/:id/stage`
* `POST /api/v1/proposals/:id/send`
* `POST /api/v1/proposals/:id/accept`
* `POST /api/v1/contracts/:id/sign`
* `POST /api/v1/contracts/:id/activate`
* `POST /api/v1/tasks/:id/complete`

When an `Idempotency-Key` is supplied:
* If the request is currently in-flight, a `409 Conflict` is returned.
* If the request already completed, the cached response body and status code are replayed with header `X-Idempotency-Replay: true`.

---

## 4. Input Validation & Injection Prevention

Every write operation validates data types, string length, regex constraints, and enumeration values using Zod schemas before touching any domain service or database repository.
* IDs must be non-empty strings conforming to valid format patterns.
* Currency and financial amounts must be non-negative decimals with at most 2 decimal places.
* Status and stage fields only accept controlled enum values.
