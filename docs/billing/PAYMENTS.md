# BCIP Commercial Operations - Customer Payments

This document outlines the architecture, rules, and governance for recording external customer payments.

---

## 1. Governance Boundary

This payment module records and allocates commercial payments that have already been received or manually confirmed by an authorized operator.

It does **NOT** perform any of the following:
*   Real-time bank account manipulations.
*   Payment initiation or bank gateway transfers.
*   Statutory levy calculations or direct debt collections.

All entries represent manually audited, human-authorized entries.

---

## 2. Payment Lifecycle & Statuses

Recorded payments have the following statuses:

*   `RECORDED` / `UNAPPLIED`: The payment has been registered but has zero allocations applied.
*   `PARTIALLY_ALLOCATED`: Part of the payment amount has been applied to receivables, leaving an available unallocated balance.
*   `FULLY_ALLOCATED` / `ALLOCATED`: The entire payment amount has been allocated against outstanding receivables.
*   `REVERSED`: The payment record was cancelled (e.g. bounced check or wrong account), rolling back all applied allocations.

---

## 3. Supported Payment Methods

Authorized operators can select from:
*   `BANK_TRANSFER` (EFT)
*   `CARD`
*   `CASH`
*   `OTHER`

---

## 4. Security & Isolation

*   Creating payments requires `billing:payment:create` permission.
*   Viewing payments requires `billing:payment:view` permission.
*   Reversing payments requires `billing:payment:reverse` permission.
*   Tenant contexts are authenticated from secure JWT payloads. Cross-tenant payment access is strictly prevented.
