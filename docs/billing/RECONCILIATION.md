# BCIP Commercial Operations — Commercial Ledger Reconciliation (Phase 3)

## 1. Overview & Diagnostic Purpose

The reconciliation service provides read-only mathematical verification across four commercial ledger invariants:

1. **Invoices vs. Receivables**:
   `Sum(Issued Invoices GrandTotal) == Sum(Opened Receivables OriginalAmount)`
2. **Payments vs. Allocations**:
   `Sum(Active Payments Amount) == Sum(Active Allocations Amount) + Sum(Unapplied Payments)`
3. **Receivables Balance Invariant**:
   `Sum(Receivables OutstandingAmount) == Sum(Opened Receivables OriginalAmount) - Sum(Allocations Amount)`
4. **Customer Accounts Invariant**:
   `Sum(Customer Balances TotalOutstanding) == Sum(Receivables OutstandingAmount)`

## 2. Safety & Governance Boundary

- **Diagnostic Only**: Reconciliation detects and surfaces exceptions.
- **No Autonomous Repair**: Reconciliation NEVER automatically alters invoices, creates artificial payments, allocates funds, or writes off debts.
- **Human Governance**: All corrective actions must proceed through standard, audited commercial billing workflows (e.g., payment reversals, allocation corrections).
