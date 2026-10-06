# BCIP Commercial Operations Billing Workspace

## 1. Overview
The Commercial Operations Billing Workspace provides an enterprise UI layer on top of the validated billing foundation, enabling authorized managing agents to manage customers, configure billing profiles, create and calculate invoices deterministically, and govern the full invoice lifecycle.

## 2. Routes & Navigation
- Route: `/billing`
- Navigation: Finance -> Commercial Billing
- Sub-Views:
  - Dashboard
  - Customers
  - Billing Profiles
  - Invoices (with Guided Creation Wizard & Detail Inspection)
  - Tax Configuration

## 3. Workflow & Governance
- **Customer Management**: Register commercial billing entities with CRM Organisation linkages.
- **Invoice Creation**: Guided wizard supporting customer selection, dates, notes, and itemized line entry.
- **Server Calculation**: All quantities, prices, discounts, and VAT computations execute authoritatively on the backend.
- **Lifecycle Governance**: DRAFT → REVIEW_REQUIRED → APPROVED → ISSUED → VOIDED. Issued invoices are strictly immutable.
