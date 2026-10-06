# BCIP Ainubis CRM Portfolio Intelligence Architecture
## Phase 2E — Prompt 002E-007

This document specifies the technical design, models, and execution flow of the **Ainubis CRM Portfolio Intelligence** layer.

---

## 1. Domain Entities
We define the following tenant-scoped domain objects under `PortfolioSnapshot`:
- **`PortfolioSnapshot`**: Daily calculated snapshot of aggregate metrics across pipelines, workloads, workflows, and health.
- **`PortfolioSignal`**: Deterministic threshold alerts (e.g., `PORTFOLIO_OVERDUE_TASK_PRESSURE`, `PORTFOLIO_STALLED_OPPORTUNITIES`).
- **`PortfolioRisk`**: Operational risks scoring the severity and recommended operational steps.
- **`PortfolioTrend`**: Calculated trend directions (`UP`, `DOWN`, `STABLE`, `INSUFFICIENT_DATA`) over 7, 30, and 90 days.
- **`PortfolioInsight`**: Highly grounded contextual intelligence referencing explicit evidence.
- **`PortfolioAnalysisRun`**: Auditable execution records tracking runtime, triggered-by info, and failures.

---

## 2. API Endpoints
All endpoints are fully authenticated, isolated by `tenantId`, and restricted to authorized roles (e.g., Managing Agent Admins, Portfolio Managers):
- `GET /api/v1/ai/portfolio/snapshot`: Retrieves the latest snapshot.
- `GET /api/v1/ai/portfolio/metrics`: Fetches snapshot metrics.
- `GET /api/v1/ai/portfolio/signals`: Lists all active alerts.
- `GET /api/v1/ai/portfolio/risks`: Identifies active risks.
- `GET /api/v1/ai/portfolio/trends`: Computes directional trends.
- `GET /api/v1/ai/portfolio/insights`: Returns evidence-backed insights.
- `GET /api/v1/ai/portfolio/priorities`: Evaluates priority queue.
- `GET /api/v1/ai/portfolio/health`: Computes overall health indicator.
- `POST /api/v1/ai/portfolio/analyze`: Triggers a manual, idempotent analysis.

---

## 3. Worker Integration
- **`ai.ainubis_portfolio_snapshot`**: Pulls telemetry, updates snapshot tables.
- **`ai.ainubis_portfolio_analysis`**: Runs rules-engine, updates active signals, and logs observations.
- **`ai.ainubis_portfolio_health`**: Re-evaluates corporate SLA and operational compliance indicators.
