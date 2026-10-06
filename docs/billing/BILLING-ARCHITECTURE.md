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
