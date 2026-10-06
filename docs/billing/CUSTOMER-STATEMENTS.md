# BCIP Commercial Operations — Customer Statements (Phase 3)

## 1. Overview

Customer Statements provide a deterministic, chronological financial ledger of all customer activity across a defined period (`fromDate` to `toDate`, or as of an evaluation date).

## 2. Statement Components

A valid Customer Statement contains:
- **Header**: Statement number (e.g. `STM-CUSTNAME-YYYYMMDD`), statement date, customer details (legal name, address, tax identifier, email, currency).
- **Opening Balance**: The cumulative balance prior to `fromDate` / `startDate`.
- **Period Transactions**: Chronological ledger of all debits and credits:
  - `INVOICE`: Debits (+balance) with `sourceType: 'INVOICE'` and `sourceId: invoice.id`.
  - `PAYMENT`: Credits (-balance) with `sourceType: 'PAYMENT'` and `sourceId: payment.id`.
  - `REVERSAL`: Reversal entries restoring balances with `sourceType: 'REVERSAL'` and `sourceId: payment.id`.
- **Running Balance**: Exact server-calculated running balance after each transaction.
- **Closing Balance**: Opening balance plus period debits minus period credits.
- **Aging Breakdown**: Six-bucket aging distribution as of the statement evaluation date.

## 3. Traceability Standard

Every ledger transaction maintains 100% provenance:
```text
Statement Transaction → sourceType → sourceId → Authoritative Billing Record
```
Untraceable or fabricated ledger items are strictly prohibited.
