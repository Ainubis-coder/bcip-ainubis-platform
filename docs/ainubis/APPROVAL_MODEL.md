# Ainubis CRM Approval & Governance Model

The human-in-the-loop governance model mandates that high-stakes recommendations are explicitly reviewed and signed off by authorized personnel.

## Lifecycle Transitions

- **GENERATED**: Initial automated state. Visible to role-permitted users.
- **REVIEWED**: Marked as reviewed by a portfolio manager or admin. Indicates verification of facts.
- **APPROVED**: Formally signed off (Permission: `CRM_AI_APPROVE`). The suggested action is authorized for execution.
- **REJECTED**: Formally rejected with an explicit reason. Archival state.
- **DISMISSED**: Marked as dismissed by a user who wishes to hide it from the active pipeline dashboard (Permission: `CRM_AI_DISMISS`).

## RBAC Security Gating

| Action | API Route | Allowed Role | Permission Key |
|---|---|---|---|
| Trigger Analysis | `POST /ai/observations/analyze` | Managing Agent Admin, Portfolio Manager | `crm:ai:generate` |
| Mark Reviewed | `POST /ai/observations/:id/review` | Managing Agent Admin, Portfolio Manager | `crm:ai:review` |
| Approve | `POST /ai/observations/:id/approve` | Managing Agent Admin | `crm:ai:approve` |
| Reject | `POST /ai/observations/:id/reject` | Managing Agent Admin | `crm:ai:approve` |
| Dismiss | `POST /ai/observations/:id/dismiss` | Managing Agent Admin, Portfolio Manager | `crm:ai:dismiss` |
