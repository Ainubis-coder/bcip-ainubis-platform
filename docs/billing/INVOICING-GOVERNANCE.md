# BCIP Invoicing Governance & RBAC

## 1. Governance Rules
- Invoice creation and line item editing can be system-assisted or user-driven while in DRAFT status.
- Transitioning to REVIEW_REQUIRED and APPROVED requires explicit authorized user actions.
- Issuing an invoice (`ISSUED`) generates a unique, collision-safe invoice number and locks the financial record against direct mutation.
- Voiding an issued invoice requires a mandatory written reason and creates an immutable audit log entry.

## 2. RBAC Permissions
- `billing:customer:*` (View, Create, Edit, Admin)
- `billing:profile:*` (View, Create, Edit, Admin)
- `billing:invoice:*` (View, Create, Edit, Submit, Approve, Issue, Void, Admin)
