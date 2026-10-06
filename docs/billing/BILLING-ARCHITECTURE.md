# BCIP Commercial Operations — Billing Architecture

## 1. Overview
The Commercial Operations & Invoicing domain provides tenant-scoped commercial billing between BCIP managing agencies/clients and their customers/organisations. It is designed as a standalone, deterministic transactional engine separate from statutory accounting.

## 2. Core Entities
- **BillingCustomer**: Represents the billed commercial entity, linked optionally to a CRM Organisation.
- **BillingProfile**: Describes tenant-scoped billing configuration, frequencies, and invoice numbering sequences.
- **BillingTaxConfiguration**: Controlled tax rules (e.g. VAT rates).
- **Invoice**: Financial document with DRAFT, REVIEW_REQUIRED, APPROVED, ISSUED, VOIDED, and CANCELLED lifecycle states.
- **InvoiceLine**: Itemized line details with deterministic calculations.
- **BillingAuditLog**: Immutable commercial audit trail.

## 3. Architectural Principles
- **Tenant Isolation**: Strict scoping by `tenantId`.
- **Deterministic Calculation**: Zero floating-point drift in monetary totals.
- **Issued Immutability**: Issued invoices are strictly immutable.
- **Human Control**: Issuing invoices requires explicit authorization.

## 4. Runtime Compatibility & Type Safety Standards (Prompt 003-005-H)
- **Node.js 22 Native Execution**: Compatible with Node.js 22 type-stripping runtime.
- **Const Enums**: Domain enums (`CustomerStatus`, `BillingFrequency`, `InvoiceStatus`) are defined as `as const` object dictionaries with matching TypeScript union types, guaranteeing clean execution without requiring syntax transform steps.
- **Strict Type-Only Imports**: All type definitions and interfaces from `types.ts` are consumed exclusively via `import type` to prevent erased interface symbols from causing runtime module resolution errors.
- **Controlled Package Exports**: `@bcip/database` maintains clean boundaries between runtime values (repositories, services, const enums) and compile-time types.

## 5. Accounts Receivable, Customer Statements & Aging Intelligence (Prompt 003-006)
- **Receivables & Payments Tracking**: Automatically opens receivables upon invoice issuance, records confirmed external customer payments, and manages many-to-many payment allocations and audited reversals.
- **Deterministic 6-Bucket Aging**: Evaluates open balances server-side across `CURRENT`, `DAYS_1_30`, `DAYS_31_60`, `DAYS_61_90`, `DAYS_91_120`, and `DAYS_121_PLUS` without client-side calculation drift.
- **Customer Ledger Statements**: Produces chronological statements with opening balance, transaction ledger (invoices, payments, reversals) preserving complete source traceability (`sourceType`, `sourceId`), and closing balances.
- **Collection Priority Intelligence**: Evaluates delinquency exposure deterministically and recommends conservative human-in-the-loop actions (`ESCALATE_TO_COLLECTIONS`, `URGENT_DIRECT_CONTACT`, `FORMAL_DEMAND_NOTICE`, `SEND_COURTESY_REMINDER`, `OFFER_PAYMENT_PLAN`) accompanied by clear explainable rationales.
- **Four-Way Diagnostic Reconciliation**: Diagnostic cross-checks between Invoices, Receivables, Payments, and Customer balances with zero autonomous financial mutation.


