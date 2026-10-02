# BCIP CRM States & Lifecycle Transitions

## 1. Controlled Status Strategy

All business states in the BCIP CRM use controlled PostgreSQL check constraints and TypeScript const enums. Arbitrary free-text values are strictly forbidden to maintain data integrity and deterministic workflow triggers.

---

## 2. Lead Lifecycle

```
[NEW] ──► [ENRICHED] ──► [QUALIFIED] ──► [CONVERTED]
  │           │              │
  ├──► [NURTURE]             ├──► [LOST]
  │           │              │
  └──► [RE_ENGAGEMENT] ◄─────┘
```

- **`NEW`**: Ingested lead; initial contact details captured.
- **`ENRICHED`**: Enhanced with public scheme data, managing agent cross-referencing, or unit counts.
- **`QUALIFIED`**: Verified interest, confirmed budget authority, and defined timeline.
- **`NURTURE`**: Long-cycle prospect awaiting budget cycle or AGM window.
- **`RE_ENGAGEMENT`**: Dormant lead triggered by new campaign or regulatory change.
- **`LOST`**: Ineligible, opted out, or disqualified.
- **`CONVERTED`**: Converted into an active Opportunity, Organisation, Contact, and Scheme Prospect.

### Lead Conversion Operation
The `convertLead` transaction executes atomically:
1. Validates that the lead has not already been converted.
2. Creates or links the associated `Organisation`.
3. Creates or links the primary `Contact`.
4. Creates the `SchemeProspect` (if scheme name or units are present).
5. Creates the sales `Opportunity`.
6. Creates an audit record and logs a conversion `Activity`.
7. Sets the lead status to `CONVERTED`, setting `converted_at` and `converted_opportunity_id`.

---

## 3. Opportunity Sales Pipeline

```
[DISCOVERY] ──► [SOLUTION_DESIGN] ──► [PROPOSAL] ──► [CONTRACT] ──► [WON]
     │                 │                  │              │
     └─────────────────┴──────────────────┴──────────────┴──────► [LOST]
```

| Stage | Default Probability | Milestone Requirements |
| :--- | :--- | :--- |
| `DISCOVERY` | 20% | Initial stakeholder meeting; portfolio size and requirements identified |
| `SOLUTION_DESIGN` | 40% | Platform modules selected; technical architecture / data migration reviewed |
| `PROPOSAL` | 60% | Commercial quote and unit-tier pricing delivered to trustees/executive committee |
| `CONTRACT` | 85% | Commercial terms accepted; Master Services Agreement in legal review |
| `WON` | 100% | Contract signed and activated; onboarding scheduled |
| `LOST` | 0% | Reason recorded in `loss_reason`; competitor or budget stall captured |

Every transition writes an immutable entry into `crm_opportunity_stage_history`.

---

## 4. Proposal Lifecycle

```
[DRAFT] ──► [INTERNAL_REVIEW] ──► [APPROVED] ──► [SENT] ──► [VIEWED] ──► [ACCEPTED]
                                                  │                        │
                                                  ├────────► [DECLINED]    ├──► Originate Contract
                                                  │                        │
                                                  └────────► [EXPIRED]     └──► Advance Opp to CONTRACT
```

- Financial line items compute `subtotal`, `tax` (e.g. 15% VAT), and `total`.
- Setting a proposal to `ACCEPTED` automatically advances the linked Opportunity to the `CONTRACT` stage.

---

## 5. Contract Execution Lifecycle

```
[DRAFT] ──► [INTERNAL_REVIEW] ──► [APPROVED] ──► [SENT] ──► [PARTIALLY_SIGNED] ──► [SIGNED] ──► [ACTIVE]
                                                  │                                                 │
                                                  └────────────────► [CANCELLED]                    ├──► [EXPIRED]
                                                                                                    │
                                                                                                    └──► [TERMINATED]
```

- Setting a contract to `ACTIVE` automatically marks the linked Opportunity as `WON`.
- All contract status transitions generate auditable events.
