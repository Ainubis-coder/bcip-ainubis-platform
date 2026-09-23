# ADR 001: Project Foundation & Monorepo Architecture

* **Status**: Accepted
* **Date**: 2026-09-23
* **Author**: Lead Software Architect, BCIP & Ainubis Engineering
* **Context**: Phase 1 Foundation Bootstrap (Prompt 001)

---

## 1. Context and Problem Statement
The Body Corporate Intelligence Platform (BCIP) is designed as a mission-critical, enterprise SaaS product for managing agents, trustees, and sectional title property portfolios. The system will encompass complex, interdependent domains: CRM, property register, double-entry financial accounting, levy roll invoicing, maintenance dispatch, AGM governance, and an autonomous AI intelligence layer (Ainubis).

A monolithic codebase without modular boundaries would quickly lead to high coupling, difficult testing, blurred multi-tenant isolation, and severe obstacles when introducing asynchronous worker queues and external AI integrations.

Conversely, premature microservices would introduce excessive operational friction, network overhead, and deployment complexity during initial phase development.

---

## 2. Decision
We have decided to establish a **modular, multi-tenant, API-first monorepo architecture** structured as follows:

```text
bcip-ainubis-platform/
├── apps/
│   ├── web/        (React 19 SPA client application)
│   ├── api/        (Express REST API, versioned v1, request tracing)
│   └── worker/     (Background job and async queue runtime)
└── packages/
    ├── ui/          (Shared accessible design system components)
    ├── database/    (PostgreSQL connection, migration & schema models)
    ├── auth/        (RBAC roles, permission maps, JWT abstractions)
    ├── ai/          (Ainubis AI gateway, prompt templates, guardrails)
    ├── integrations/(Accounting, payment, and messaging connectors)
    └── workflows/   (Trigger-action automation engine)
```

### Key Architectural Tenets:
1. **Clear Separation of Concerns**: Applications (`apps/`) host runtimes; shared domain logic resides in decoupled packages (`packages/`).
2. **API-First Design**: The API is versioned (`/api/v1/`) and serves as the single source of truth for both web and future mobile/external API clients.
3. **Dedicated Worker Runtime**: Long-running jobs (AI analysis, document OCR, batch invoicing) run out-of-process in `/apps/worker` to maintain responsive API latencies.
4. **Tenant Isolation by Construction**: Every database query and AI invocation requires explicit tenant identification.
5. **AI Abstraction (Ainubis)**: The AI layer is isolated behind `@bcip/ai` with provider agnostic interfaces (Gemini, Claude, OpenAI), centralized prompt management, and compliance audit logging.

---

## 3. Consequences

### Positive
* **Scalability**: Subsystems can be scaled independently (e.g. workers scaled out during batch levy runs).
* **Testability**: Packages have independent unit tests without requiring full application spin-up.
* **Security & Governance**: Strict multi-tenant boundaries and PII redaction enforced at the package layer.
* **Developer Velocity**: Common TypeScript interfaces shared between frontend and backend eliminate type drift.

### Negative / Trade-offs
* Requires disciplined workspace dependency management.
* Path resolution and build configurations must maintain clean aliases across packages.

---

## 4. Compliance & Verification
* All applications must compile under TypeScript strict mode.
* API endpoints must implement `/health` and versioned `/api/v1/status`.
* Structured logging and request correlation IDs must be present on every request.
