# BCIP Invoice Document Generation & Delivery Foundation (Prompt 003-003)

## 1. Overview
The Invoice Document Generation & Delivery Foundation establishes a secure, governed document generation layer above the existing BCIP Commercial Operations & Invoicing domain. It transforms authoritative persisted invoice data into formal, traceable invoice documents suitable for customer delivery without creating a secondary financial source of truth.

## 2. Document Domain Architecture
- **InvoiceDocument Entity**: Captures document metadata including invoice ID, document number, version, status (`GENERATED`, `SUPERSEDED`, `FAILED`), generation timestamp, generating actor, content hash (SHA-256 checksum), storage reference, MIME type (`application/pdf`), and delivery status (`NOT_SENT`, `QUEUED`, `SENT`, `FAILED`).
- **Storage Abstraction**: Decouples document generation logic from object storage providers while persisting checksums and file references.

## 3. Generation & Governance Rules
- **State Gate**: Official documents can only be generated for invoices in `APPROVED` or `ISSUED` status (`DRAFT` and `REVIEW_REQUIRED` invoices are strictly rejected).
- **Versioning & Superseding**: Regenerating a document for an existing invoice automatically marks previous active documents as `SUPERSEDED` while incrementing the version number. Historical records remain immutable and traceable.
- **Financial Integrity**: Authoritative financial calculations continue to reside exclusively in `InvoiceCalculationService` and persisted invoice/line records. Document generation formats existing data without recalculating monetary values.

## 4. RBAC & Multi-Tenant Isolation
- **Permissions**: `billing:invoice:document:view` and `billing:invoice:document:generate`.
- **Tenant Isolation**: Strict multi-tenant isolation enforced at repository and API levels. Tenant A cannot generate or retrieve Tenant B invoice documents.
- **Idempotency**: `X-Idempotency-Key` header support prevents duplicate document generations during network or browser retries.
