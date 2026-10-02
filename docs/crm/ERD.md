# BCIP CRM Entity Relationship Diagram (ERD)

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    TENANTS ||--o{ CRM_ORGANISATIONS : contains
    TENANTS ||--o{ CRM_CONTACTS : contains
    TENANTS ||--o{ CRM_LEADS : contains
    TENANTS ||--o{ CRM_SCHEME_PROSPECTS : contains
    TENANTS ||--o{ CRM_OPPORTUNITIES : contains
    TENANTS ||--o{ CRM_CAMPAIGNS : contains
    TENANTS ||--o{ CRM_ACTIVITIES : contains
    TENANTS ||--o{ CRM_TASKS : contains
    TENANTS ||--o{ CRM_PROPOSALS : contains
    TENANTS ||--o{ CRM_CONTRACTS : contains
    TENANTS ||--o{ CRM_AUDIT_LOG : contains

    CRM_CAMPAIGNS ||--o{ CRM_LEADS : generates

    CRM_ORGANISATIONS ||--o{ CRM_CONTACTS : employs
    CRM_ORGANISATIONS ||--o{ CRM_SCHEME_PROSPECTS : manages
    CRM_ORGANISATIONS ||--o{ CRM_LEADS : generates
    CRM_ORGANISATIONS ||--o{ CRM_OPPORTUNITIES : purchases

    CRM_CONTACTS ||--o{ CRM_LEADS : engages
    CRM_CONTACTS ||--o{ CRM_OPPORTUNITIES : primary_contact

    CRM_LEADS ||--o| CRM_OPPORTUNITIES : converts_to
    CRM_LEADS ||--o{ CRM_SCHEME_PROSPECTS : targets

    CRM_SCHEME_PROSPECTS ||--o{ CRM_OPPORTUNITIES : scopes

    CRM_OPPORTUNITIES ||--o{ CRM_OPPORTUNITY_STAGE_HISTORY : logs
    CRM_OPPORTUNITIES ||--o{ CRM_PROPOSALS : quotes
    CRM_OPPORTUNITIES ||--o{ CRM_CONTRACTS : closes

    CRM_PROPOSALS ||--o| CRM_CONTRACTS : originates

    CRM_LEADS ||--o{ CRM_ACTIVITIES : logs
    CRM_OPPORTUNITIES ||--o{ CRM_ACTIVITIES : logs
    CRM_ORGANISATIONS ||--o{ CRM_ACTIVITIES : logs
    CRM_CONTACTS ||--o{ CRM_ACTIVITIES : logs

    CRM_LEADS ||--o{ CRM_TASKS : tracks
    CRM_OPPORTUNITIES ||--o{ CRM_TASKS : tracks
    CRM_ORGANISATIONS ||--o{ CRM_TASKS : tracks
    CRM_CONTACTS ||--o{ CRM_TASKS : tracks
```

---

## 2. ASCII Conceptual Entity Model

```
+--------------------------------------------------------------------------+
|                                TENANT                                    |
+--------------------------------------------------------------------------+
      |
      +----------> [ CAMPAIGN ]
      |                 |
      |                 v
      +----------> [ LEAD ] ---------------------+
      |                 | (Converts To)          |
      |                 v                        v
      +----------> [ ORGANISATION ] ----> [ CONTACT ]
      |                 |                        |
      |                 v                        |
      +----------> [ SCHEME PROSPECT ]           |
      |                 |                        |
      |                 v                        v
      +----------> [ OPPORTUNITY ] <-------------+
      |                 |
      |                 +---> [ OPPORTUNITY STAGE HISTORY ]
      |                 |
      |                 +---> [ ACTIVITIES ] & [ TASKS ]
      |                 |
      |                 +---> [ PROPOSAL ]
      |                             |
      |                             v
      +-------------------------> [ CONTRACT ]
```

---

## 3. Cardinality Rules

1. **Tenant to All Entities:** `1 : N` (Every entity strictly references one tenant; records are never shared across tenants).
2. **Organisation to Contacts:** `1 : N` (An organisation has zero or more contacts).
3. **Organisation to Scheme Prospects:** `1 : N` (A managing agent or body corporate manages zero or more scheme prospects).
4. **Lead to Opportunity:** `1 : 1` (A converted lead maps to exactly one primary opportunity).
5. **Opportunity to Stage History:** `1 : N` (Append-only audit trail recording every stage change).
6. **Opportunity to Proposals:** `1 : N` (An opportunity can have multiple proposal revisions, but at most one accepted).
7. **Proposal to Contract:** `1 : 1` (An accepted proposal can originate a legal contract).
8. **Activities/Tasks to Entities:** Polymorphic `N : 1` (An activity or task can be linked to a lead, contact, organisation, or opportunity).
