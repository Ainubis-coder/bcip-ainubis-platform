# BCIP Invoice Lifecycle State Machine

```
[DRAFT]
   ↓ (submit-review)
[REVIEW_REQUIRED]
   ↓ (approve)
[APPROVED]
   ↓ (issue)
[ISSUED] ── (void with reason) ──→ [VOIDED]
```

## State Definitions
- **DRAFT**: Editable invoice workspace.
- **REVIEW_REQUIRED**: Submitted for peer review.
- **APPROVED**: Authorized reviewer sign-off.
- **ISSUED**: Official commercial document (immutable).
- **VOIDED**: Cancelled post-issuance via controlled audit trail.
- **CANCELLED**: Cancelled pre-issuance.
