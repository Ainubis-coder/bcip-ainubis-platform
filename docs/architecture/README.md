# BCIP Architecture Overview

## Body Corporate Intelligence Platform & Ainubis Orchestration Layer

The Body Corporate Intelligence Platform (BCIP) is a production-grade, multi-tenant SaaS platform architected specifically for the sectional-title, body-corporate, and property-management ecosystem.

---

## 1. High-Level Architecture

```text
                               +---------------------------------------------+
                               |              Clients / Browsers             |
                               |  Managing Agents · Trustees · Owners · Stf  |
                               +---------------------------------------------+
                                                     |
                                                     | HTTPS / WSS
                                                     v
                               +---------------------------------------------+
                               |               Edge / Web App                |
                               |    React 19 · Vite · Tailwind · Accessible  |
                               +---------------------------------------------+
                                                     |
                                                     | JSON / REST / v1
                                                     v
       +-----------------------------------------------------------------------------------+
       |                                   BCIP API Layer                                  |
       |  Request Tracing (Correlation ID) · Structured Logging · Zod Config Validation    |
       |  Routes: /health · /api/v1/status · /api/v1/*                                    |
       +-----------------------------------------------------------------------------------+
             |                            |                            |
             v                            v                            v
   +--------------------+      +--------------------+      +--------------------+
   |   @bcip/database   |      |     @bcip/auth     |      |      @bcip/ai      |
   | PostgreSQL Engine  |      |   RBAC & Tokens    |      |   Ainubis Gateway  |
   +--------------------+      +--------------------+      +--------------------+
             |                            |                            |
             v                            v                            v
   +--------------------+      +--------------------+      +--------------------+
   |  PostgreSQL 16 DB  |      |    Redis Queue     |      |  AI Model Gateway  |
   | Multi-tenant Pool  |      |  Job Orchestration |      | Gemini · Claude ·  |
   +--------------------+      +--------------------+      +--------------------+
                                          ^
                                          | Enqueue / Dequeue
                                          v
                               +--------------------+
                               |    BCIP Worker     |
                               | Background Jobs ·  |
                               | AI · Notifications |
                               +--------------------+
```

---

## 2. Core Subsystems

### 2.1 Web Application (`/apps/web`)
* **Technology**: React 19, TypeScript, Tailwind CSS, Vite.
* **Architecture**: Strict domain layout following enterprise UI principles:
  * Top Bar Contract (1-line brand text, 4-6 text nav links, primary action).
  * Collapsible sidebar with module grouping.
  * Tabular numeric formatting (`tabular-nums font-mono`).
  * Zero-pill metadata with subtle typographic separators (`·` or `/`).
  * Live status inspector modal for API diagnostics.
  * **Client Stability Rule (ADR-002)**: All API clients used by React components must have stable references (memoized with `useMemo`), and React effects/callbacks must depend on stable primitive identifiers or memoized values rather than freshly created objects.

### 2.2 API Application (`/apps/api`)
* **Technology**: Node.js, Express, TypeScript, Zod.
* **Architecture**:
  * Centralized environment configuration with Zod validation.
  * Request correlation ID (`X-Request-Id`) attached to every request and log entry.
  * Uniform structured JSON logging with automated redaction of sensitive credentials.
  * Consistent error envelope (`{ success: false, error: { code, message, requestId } }`).
  * Strict API versioning under `/api/v1/`.

### 2.3 Worker Runtime (`/apps/worker`)
* **Technology**: Node.js, TypeScript, Redis Queue foundation.
* **Architecture**:
  * Asynchronous job processor for long-running AI analysis, notifications, integrations, scheduled levy roll generation, and document processing.
  * Autonomous run loop with graceful shutdown signal handling (`SIGTERM`/`SIGINT`).

### 2.4 Shared Domain Packages (`/packages/*`)
* **`@bcip/ui`**: Accessible components (Button, Card, Table, Modal, StatusIndicator).
* **`@bcip/database`**: PostgreSQL connection pool, migration manager, and multi-tenant schema models.
* **`@bcip/auth`**: Role-based access control (RBAC), permission hierarchy, and JWT abstraction.
* **`@bcip/ai`**: Ainubis AI provider abstraction, prompt management, tool calling, and guardrails.
* **`@bcip/integrations`**: Connectors for accounting ERPs, payment gateways, and messaging providers.
* **`@bcip/workflows`**: Automated trigger-action workflow engine.

---

## 3. Multi-Tenancy Strategy
BCIP enforces logical and structural multi-tenant isolation:
1. Every relational table links directly or via foreign keys to `tenant_id` (Managing Agent organisation).
2. Scheme records (`schemes`) are isolated by tenant.
3. Unit registers (`units`) are strictly bounded by scheme and tenant.
4. Ainubis AI invocations enforce strict tenant context validation to eliminate cross-tenant data leakage.

---

## 4. Ainubis Intelligence & Orchestration Layer
Ainubis acts as the cognitive layer atop BCIP:
* **Gateway**: Standardized request routing to foundation models (e.g. Gemini 2.5 Flash for high throughput, Gemini 2.5 Pro for deep reasoning).
* **Guardrails**: Automated PII masking (bank accounts, tax IDs) before prompt serialization.
* **Audit**: Complete observability logging prompt token counts, latency, and compliance status.
* **Human-in-the-loop**: High-impact recommendations require trustee confirmation before execution.
