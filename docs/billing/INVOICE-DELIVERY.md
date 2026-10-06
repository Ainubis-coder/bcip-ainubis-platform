# BCIP Invoice Delivery & Customer Communication Foundation (Prompt 003-004)

## 1. Overview
The Invoice Delivery & Customer Communication Foundation provides a robust, audited system to deliver official generated invoice documents to customer destinations via email. It is decoupled from accounting ledgers, financial automation, or direct payment systems, maintaining a clear separation of concerns.

## 2. Domain & Traceability Flow
Delivery tracks a clean chronological line from preparation to dispatch status:
```text
Customer
  ↓
Invoice
  ↓
InvoiceDocument
  ↓
InvoiceDelivery
  ↓
InvoiceDeliveryAttempt(s)
  ↓
MockEmailDeliveryProvider Reference
```

## 3. Key Entities
- **InvoiceDelivery**: Represents a request to dispatch an active approved/issued document. Records the destination email, template reference, state, actor, correlation IDs, and active idempotency keys.
- **InvoiceDeliveryAttempt**: Captures each dispatch iteration, including start/completion timestamps, provider-assigned references, and clean failures context.
- **InvoiceDeliveryTemplate**: Tenant-scoped or system-wide (SYSTEM) templates allowing controlled placeholder variable resolution (`{{customer_name}}`, `{{invoice_number}}`, `{{invoice_total}}`, `{{currency}}`, etc.) under a sandboxed rendering environment.

## 4. Architectural Boundaries & Security
- **Immutability**: Document transmission is fully read-only; it can never modify invoice items, totals, dates, or calculations.
- **Multi-Tenant Isolation**: Deliveries, attempts, and templates are scoped strictly under the active tenant context. Leakage across accounts is prohibited and returns standard HTTP 404 concealment blocks.
- **RBAC Guardrails**: Implements `billing:invoice:delivery:send`, `billing:invoice:delivery:view`, and `billing:invoice:delivery:retry` permissions.
- **Idempotency**: Implements `X-Idempotency-Key` headers matching to prevent accidental double-sending on double-clicks or browser reload retries.
