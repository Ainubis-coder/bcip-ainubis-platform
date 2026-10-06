# BCIP Commercial Operations — Accounts Receivable Aging & Collection Intelligence (Phase 3)

## 1. Aging Buckets

Deterministic server-side AR aging uses six standardized buckets:

1. `CURRENT`: Evaluated `asOfDate <= dueDate` (0 days past due).
2. `DAYS_1_30`: 1 to 30 calendar days past due.
3. `DAYS_31_60`: 31 to 60 calendar days past due.
4. `DAYS_61_90`: 61 to 90 calendar days past due.
5. `DAYS_91_120`: 91 to 120 calendar days past due.
6. `DAYS_121_PLUS`: More than 120 calendar days past due.

## 2. Calculation Rules

- `daysOutstanding`: Calculated as `Math.floor((asOfDateUtc - dueDateUtc) / 86400000)`. When `<= 0`, `daysOutstanding = 0`.
- `isOverdue`: `true` if `daysOutstanding > 0` AND `outstandingAmount > 0` AND `status !== 'VOIDED'`.
- Paid receivables (`outstandingAmount = 0`) are excluded from overdue calculations.
- Voided receivables are excluded from portfolio metrics.

## 3. Collection Priority Intelligence

Accounts with overdue receivables are ranked deterministically (0–100 score):
- **Aging Severity (up to 50 pts)**: Weighted by maximum days past due.
- **Balance Magnitude (up to 30 pts)**: Weighted by overdue monetary balance.
- **Inactivity & Payment Recency (up to 20 pts)**: Evaluates days since last recorded payment.

### Priority Levels & Actions
- `CRITICAL` (80–100): `ESCALATE_TO_COLLECTIONS`
- `HIGH` (60–79): `URGENT_DIRECT_CONTACT`
- `MEDIUM` (40–59): `FORMAL_DEMAND_NOTICE` or `OFFER_PAYMENT_PLAN`
- `LOW` (1–39): `FIRST_OVERDUE_NOTICE` or `SEND_COURTESY_REMINDER`
- `NORMAL` (0): `NO_ACTION_REQUIRED`

All priorities include human-readable factual reasons justifying the score and recommendation.
Ainubis observation boundary is strictly enforced: NO autonomous write-offs, credits, or balance modifications.
