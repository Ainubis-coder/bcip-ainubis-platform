# BCIP Commercial Operations - Payment Allocations

This document covers the rules governing ledger-matching payment allocations against outstanding receivables.

---

## 1. Allocation Logic

An allocation binds a `Payment` balance to a `Receivable` outstanding balance.

```text
Payment [Unapplied Balance] ─── (Allocation Record) ───> Receivable [Outstanding]
```

### Allocation Rules & Validation:
1.  **Positive Totals Only**: Zero or negative allocation amounts are strictly rejected.
2.  **No Over-allocation**: An allocation cannot exceed the available payment balance or the receivable outstanding balance.
3.  **Currency Match**: Payments can only be allocated against receivables of the exact same currency (e.g. ZAR to ZAR).
4.  **No Cross-Tenant Entries**: Cross-tenant allocations are rejected.
5.  **State Protection**: Allocations are disallowed against cancelled or voided receivables.

---

## 2. Reversal Integrity

To preserve a completely traceable audit path, **historical allocation records are never physically deleted**.

*   When an allocation is corrected or reversed, the allocation record is updated with `reversedAt`, `reversedBy`, and a mandatory `reversalReason`.
*   Both the payment available balance and the receivable outstanding balance are dynamically recalculated.
*   Audit trails are immediately populated inside the `BillingAuditLog`.

---

## 3. API Endpoints

*   `GET  /api/v1/billing/payment-allocations` (List allocations)
*   `POST /api/v1/billing/payment-allocations` (Apply new allocation)
*   `POST /api/v1/billing/payment-allocations/:id/reverse` (Reverse an allocation)
