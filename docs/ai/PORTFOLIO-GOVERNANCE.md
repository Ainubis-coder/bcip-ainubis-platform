# BCIP Ainubis CRM Portfolio Governance & Safety Boundaries
## Phase 2E — Prompt 002E-007

This document outlines the strict safety boundaries and human-in-the-loop governance models implemented within the Ainubis Portfolio Intelligence framework.

---

## 1. Direct Mutation Restrictions
Ainubis is strictly an **operational intelligence layer**. It does **NOT**:
- Automatically edit CRM records or statuses.
- Write or publish templates on behalf of users.
- Dispatch autonomous outward actions without explicit human confirmation.

All mutations must flow through:
1. **Ainubis Action Engine**: Proposals are attached as draft actions.
2. **Human Approval Gates**: Requires explicit review and approval by an authorized role.
3. **Action Execution & Verification**: Triggers are run via workers and verified post-execution.

---

## 2. Prohibited Scope & Guardrails
The system strictly prevents and validates against the following operations:
- **Finance, Invoicing, Banking, and Payments**: Rejects any action mapping to transaction ledgers or statutory levy collections with HTTP 422.
- **Statutory Records**: Cannot alter corporate legal registrations or Body Corporate mandates directly.
- **Unrestricted Agent Actions**: No self-directing loops are permitted. Every plan is finite and traceable.
