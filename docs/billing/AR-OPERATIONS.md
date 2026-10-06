# BCIP Commercial Operations — Accounts Receivable Operations (Phase 3)

## 1. Overview & System of Record

The BCIP Accounts Receivable (AR) layer manages commercial credit, open customer balances, aging intelligence, customer account statements, and financial reconciliation.

```text
Financial System of Record
        ↓
Billing Services (ArAgingService, ReceivableService)
        ↓
Analytical / Observational Intelligence
        ↓
Ainubis (Non-autonomous observations only)
```

## 2. Architectural Principles

1. **Server-Authoritative**: Client applications never submit or calculate authoritative financial balances, aging buckets, or ledger totals.
2. **Deterministic & Conservative**: All financial arithmetic is performed in integer minor units (cents) to eliminate floating-point drift.
3. **Strict Multi-Tenant Isolation**: Every database query and API operation filters by `tenantId`. Cross-tenant requests fail safely with 404 concealment.
4. **Governed RBAC Gates**: Protected endpoints require `billing:receivable:view`, `billing:statement:view`, `billing:aging:view`, or `billing:reconciliation:view`.
5. **No Autonomous Financial Mutation**: Neither Ainubis AI nor reconciliation processes may autonomously mutate, write off, or alter financial balances.

## 3. Core REST API Endpoints

- `GET /api/v1/billing/receivables/aging`: Comprehensive portfolio aging breakdown and customer balances.
- `GET /api/v1/billing/receivables/overdue`: Filtered list of overdue receivables sorted by days overdue descending.
- `GET /api/v1/billing/receivables/summary`: Aggregated receivable totals, overdue counts, and bucket metrics.
- `GET /api/v1/billing/customers/:customerId/balance`: Customer-specific AR balance aggregation.
- `GET /api/v1/billing/customers/:customerId/statement`: Governed chronological ledger statement with debit/credit running balances.
- `GET /api/v1/billing/receivables/collection-priority`: Prioritized delinquent account queue with explainable scoring and recommendations.
- `GET /api/v1/billing/reconciliation`: Diagnostic four-way cross-entity financial ledger audit.
