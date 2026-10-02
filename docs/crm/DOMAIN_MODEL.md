# BCIP CRM Domain Model Specification

## 1. Domain Pipeline Hierarchy

The BCIP CRM pipeline models the complete customer acquisition and expansion journey:

```
[Campaign]
    │
    ▼
  [Lead] ───────────► (Conversion) ───────────┐
    │                                         ▼
    ├────────────────────────────────► [Organisation]
    │                                         │
    ├────────────────────────────────► [Contact]
    │                                         │
    ├────────────────────────────────► [Scheme Prospect]
    │                                         │
    ▼                                         ▼
[Opportunity] ◄───────────────────────────────┘
    │
    ├── [Activities] & [Tasks]
    │
    ├── [Proposal] (Commercial Terms)
    │
    └── [Contract] (Legal Execution) ──► Active Client
```

---

## 2. Entity Specifications & Field Rationale

### 2.1 Lead (`crm_leads`)

| Field | Type | Nullable | Rationale |
| :--- | :--- | :--- | :--- |
| `id` | UUID | No | Primary Key |
| `tenant_id` | UUID | No | Mandatory tenant partition |
| `organisation_id` | UUID | Yes | Nullable initially; leads frequently arrive before an organisation entity exists |
| `contact_id` | UUID | Yes | Nullable initially; contact entity created during enrichment or conversion |
| `campaign_id` | UUID | Yes | Optional campaign attribution |
| `source` | Enum | No | Controlled channel (Direct, Referral, Website, Campaign, etc.) |
| `source_detail` | String | Yes | Specific campaign name, referrer name, or UTM detail |
| `status` | Enum | No | Controlled lifecycle status (`NEW`, `ENRICHED`, `QUALIFIED`, `NURTURE`, `RE_ENGAGEMENT`, `LOST`, `CONVERTED`) |
| `qualification_status`| Enum | No | Controlled assessment (`UNQUALIFIED`, `PRE_QUALIFIED`, `QUALIFIED`, `DISQUALIFIED`) |
| `lead_owner_id` | UUID | Yes | Assigned account executive or sales representative |
| `title` | String | No | Descriptive summary of lead opportunity |
| `scheme_name` | String | Yes | Scheme name when prospect is an individual sectional title body corporate |
| `estimated_units` | Integer | Yes | Used for initial pricing tiers and pipeline weighting |
| `managing_agent` | String | Yes | Current managing agent name if prospect is a body corporate |
| `current_system` | String | Yes | Legacy property management software (e.g., WeConnect, MDA, MRI, Pastel) |
| `pain_points` | JSONB | No | Array of verified challenges (levy arrears, trustee comms, AGM votes) |
| `required_modules` | JSONB | No | BCIP functional modules of interest (`finance`, `governance`, etc.) |
| `expected_timeline` | Enum | No | Controlled timeline (`IMMEDIATE`, `1_3_MONTHS`, `3_6_MONTHS`, etc.) |
| `data_quality_state`| Enum | No | Assessment state (`COMPLETE`, `PARTIAL`, `STALE`, `UNVERIFIED`) |
| `converted_at` | Timestamp| Yes | Set when converted to Opportunity |
| `converted_opportunity_id` | UUID | Yes | Link to spawned opportunity |
| `deleted_at` | Timestamp| Yes | Soft deletion timestamp |

### 2.2 Organisation (`crm_organisations`)

Represents a formal business entity in the sectional title industry:
- `MANAGING_AGENT`: Professional firm administering multiple body corporate schemes.
- `BODY_CORPORATE`: Individual sectional title scheme legal entity.
- `TRUSTEE_ORGANISATION`: Board of elected trustees.
- `HOMEOWNERS_ASSOCIATION`: HOA community scheme.
- `PROPERTY_DEVELOPER`: Property development firm handovers.

### 2.3 Contact (`crm_contacts`)

Represents an individual person. Multiple contacts can belong to an organisation (e.g. Managing Director, Financial Portfolio Manager, Senior Portfolio Specialist, Trustee Chairman).

Fields:
- `display_name`: Computed or explicitly provided full name.
- `preferred_contact_method`: `EMAIL`, `PHONE`, `MOBILE`, `WHATSAPP`, `ANY`.
- `status`: `ACTIVE`, `INACTIVE`, `UNRESPONSIVE`, `DO_NOT_CONTACT`.

### 2.4 Scheme Prospect (`crm_scheme_prospects`)

A lightweight CRM-level property prospect representation:
- Encapsulates scheme unit count, location, managing agent, and pain points.
- Specifically decoupled from Phase 006 operational property models so sales teams can enter preliminary scheme data without requiring complete CAD sectional plans, participation quota (PQ) schedules, or unit registers.

### 2.5 Opportunity (`crm_opportunities`)

Pipeline deals tracked across defined stages:
1. `DISCOVERY` (20% default probability)
2. `SOLUTION_DESIGN` (40% default probability)
3. `PROPOSAL` (60% default probability)
4. `CONTRACT` (85% default probability)
5. `WON` (100% probability, sets `won_at`)
6. `LOST` (0% probability, sets `lost_at` and requires `loss_reason`)

### 2.6 Opportunity Stage History (`crm_opportunity_stage_history`)

Maintains an immutable append-only log of every stage transition:
- `from_stage`: Previous stage (nullable on creation)
- `to_stage`: Destination stage
- `changed_by`: User ID of actor
- `reason`: Rationale for stage progression or stall
- `changed_at`: Timestamp of transition

### 2.7 Commercial Proposal (`crm_proposals`)

Represents commercial pricing proposals:
- Decimal financial fields: `subtotal`, `tax`, `total` (stored as `NUMERIC(14,2)`).
- Line items with units, unit prices, and line totals.
- Controlled statuses: `DRAFT`, `INTERNAL_REVIEW`, `APPROVED`, `SENT`, `VIEWED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELLED`.
- Versioned progression (`version >= 1`).
- Document reference (`document_id`) to document storage.

### 2.8 Legal Contract (`crm_contracts`)

Governs contractual agreements:
- Fields: `contract_number`, `effective_date`, `expiry_date`, `signed_at`, `annual_value`, `monthly_value`.
- Controlled statuses: `DRAFT`, `INTERNAL_REVIEW`, `APPROVED`, `SENT`, `PARTIALLY_SIGNED`, `SIGNED`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `CANCELLED`.
- Document reference (`document_id`).
