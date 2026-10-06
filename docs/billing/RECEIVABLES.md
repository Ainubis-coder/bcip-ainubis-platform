# BCIP Commercial Operations - Accounts Receivable

This document outlines the architecture, rules, and life cycle constraints of the Accounts Receivable layer in the Body Corporate Intelligence Platform (BCIP).

---

## 1. Domain Boundary

Receivables are created as a deterministic consequence of issuing a commercial invoice within the platform.

*   **Trigger**: An invoice transitioning to `ISSUED` status automatically triggers the creation of a corresponding `Receivable` record.
*   **Source of Truth**: The original amount is derived authoritatively from the invoice total.
*   **Purpose**: Tracks outstanding customer balances, payment aging, and payment ledger allocations under strict human supervision.

---

## 2. Receivable Lifecycle & Statuses

Receivables transition through the following statuses:

*   `OPEN`: The receivable has been created, has zero or partial allocations, and is within the payment terms.
*   `PARTIALLY_PAID`: Part of the receivable has been covered by one or more active allocations, but an outstanding balance remains.
*   `PAID`: The outstanding balance has been fully reduced to zero through active payment allocations.
*   `OVERDUE`: The receivable has an outstanding balance greater than zero and is past its due date.
*   `VOIDED`: The matching invoice was voided, marking the receivable closed with zero outstanding balance.
*   `CANCELLED`: Explicitly cancelled under governance.

---

## 3. Balance Calculations (Server Authoritative)

Outstanding balances must always be calculated server-side in minor currency units to prevent floating-point inaccuracies:

$$\text{Outstanding Balance} = \text{Invoice Original Amount} - \sum \text{Active Non-Reversed Allocations}$$

No client-side calculated figures or states are ever trusted for persistence.

---

## 4. Security & Multi-Tenant Isolation

*   All receivable actions require `billing:receivable:view` or `billing:receivable:manage` permission.
*   Strict multi-tenant boundaries prevent users in Tenant A from viewing or modifying receivables belonging to Tenant B.
