# BCIP CRM REST API Reference
**Version:** 1.0.0 (Phase 2 — Prompt 002C)  
**Base URL:** `/api/v1`  
**Content-Type:** `application/json`

---

## Overview

The BCIP CRM REST API provides multi-tenant, versioned, auditable endpoints for managing the end-to-end sales lifecycle:
**Lead → Contact → Organisation → Scheme Prospect → Opportunity → Activity → Task → Proposal → Contract**

All endpoints follow thin controller architecture delegating domain rules, lifecycle transitions, and data integrity to `@bcip/database` CRM domain services.

---

## Authentication & Authorization

All requests to `/api/v1/*` (except health and OpenAPI discovery) require a JWT Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Tokens must include:
* `sub`: Authenticated User ID
* `tenantId`: Tenant partition boundary
* `role`: RBAC Role (`PLATFORM_SUPER_ADMIN`, `MANAGING_AGENT_ADMIN`, `PORTFOLIO_MANAGER`, etc.)

---

## Standard Response Envelopes

### Single Entity Response
```json
{
  "success": true,
  "data": {
    "id": "org_1790676405213_77pl76p",
    "tenantId": "tenant_apex_sandton",
    "name": "Highland Property Management (Pty) Ltd",
    "organisationType": "MANAGING_AGENT",
    "status": "PROSPECT",
    "createdAt": "2026-09-29T10:06:45.213Z",
    "updatedAt": "2026-09-29T10:06:45.213Z"
  },
  "meta": {
    "requestId": "bcip_req_1790676405168_aiye17o",
    "timestamp": "2026-09-29T10:06:45.214Z"
  }
}
```

### Paginated Collection Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  },
  "meta": {
    "requestId": "bcip_req_1790676405168_aiye17o",
    "timestamp": "2026-09-29T10:06:45.214Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "title",
        "message": "Lead title is required"
      }
    ],
    "requestId": "bcip_req_1790676405168_aiye17o"
  }
}
```

---

## Core Endpoint Directory

| Resource | Method | Path | Required Permission | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Organisations** | `GET` | `/organisations` | `crm:organisation:view` | List organisations with pagination/search/filtering |
| | `POST` | `/organisations` | `crm:organisation:create` | Create a new managing agent or body corporate org |
| | `GET` | `/organisations/:id` | `crm:organisation:view` | Retrieve organisation by ID |
| | `PATCH` | `/organisations/:id` | `crm:organisation:edit` | Update organisation attributes |
| | `DELETE` | `/organisations/:id` | `crm:organisation:delete` | Soft delete organisation |
| | `GET` | `/organisations/:id/contacts` | `crm:contact:view` | List contacts belonging to organisation |
| | `GET` | `/organisations/:id/opportunities` | `crm:opportunity:view` | List opportunities for organisation |
| | `GET` | `/organisations/:id/scheme-prospects`| `crm:scheme_prospect:view`| List scheme prospects for organisation |
| **Contacts** | `GET` | `/contacts` | `crm:contact:view` | List contacts |
| | `POST` | `/contacts` | `crm:contact:create` | Create a new contact |
| | `GET` | `/contacts/:id` | `crm:contact:view` | Retrieve contact by ID |
| | `PATCH` | `/contacts/:id` | `crm:contact:edit` | Update contact |
| | `DELETE` | `/contacts/:id` | `crm:contact:delete` | Soft delete contact |
| **Leads** | `GET` | `/leads` | `crm:lead:view` | List leads (filter by status, qualification) |
| | `POST` | `/leads` | `crm:lead:create` | Capture a new sales lead |
| | `GET` | `/leads/:id` | `crm:lead:view` | Retrieve lead details |
| | `PATCH` | `/leads/:id` | `crm:lead:edit` | Update lead fields |
| | `DELETE` | `/leads/:id` | `crm:lead:delete` | Soft delete lead |
| | `POST` | `/leads/:id/convert` | `crm:lead:convert` | Atomically convert lead to Org/Contact/Prospect/Opp |
| **Scheme Prospects** | `GET` | `/scheme-prospects` | `crm:scheme_prospect:view` | List lightweight scheme prospects |
| | `POST` | `/scheme-prospects` | `crm:scheme_prospect:create`| Create scheme prospect |
| | `GET` | `/scheme-prospects/:id` | `crm:scheme_prospect:view` | Retrieve scheme prospect |
| | `PATCH` | `/scheme-prospects/:id` | `crm:scheme_prospect:edit` | Update scheme prospect |
| | `DELETE` | `/scheme-prospects/:id` | `crm:scheme_prospect:delete`| Soft delete scheme prospect |
| **Opportunities** | `GET` | `/opportunities` | `crm:opportunity:view` | List pipeline opportunities |
| | `GET` | `/opportunities/pipeline` | `crm:opportunity:view` | Grouped pipeline stage summary |
| | `POST` | `/opportunities` | `crm:opportunity:create` | Create opportunity deal |
| | `GET` | `/opportunities/:id` | `crm:opportunity:view` | Retrieve opportunity |
| | `PATCH` | `/opportunities/:id` | `crm:opportunity:edit` | Update opportunity |
| | `DELETE` | `/opportunities/:id` | `crm:opportunity:delete` | Soft delete opportunity |
| | `POST` | `/opportunities/:id/stage` | `crm:opportunity:stage` | Advance stage with audit history |
| | `GET` | `/opportunities/:id/history` | `crm:opportunity:view` | Retrieve stage velocity history |
| **Activities** | `GET` | `/activities` | `crm:activity:view` | List polymorphic CRM activities |
| | `POST` | `/activities` | `crm:activity:create` | Log activity (Call, Meeting, Note, Demo) |
| | `GET` | `/activities/:id` | `crm:activity:view` | Retrieve activity |
| | `PATCH` | `/activities/:id` | `crm:activity:edit` | Update activity |
| | `DELETE` | `/activities/:id` | `crm:activity:delete` | Soft delete activity |
| **Tasks** | `GET` | `/tasks` | `crm:task:view` | List CRM tasks |
| | `POST` | `/tasks` | `crm:task:create` | Create task assignment |
| | `GET` | `/tasks/:id` | `crm:task:view` | Retrieve task |
| | `PATCH` | `/tasks/:id` | `crm:task:edit` | Update task |
| | `DELETE` | `/tasks/:id` | `crm:task:delete` | Soft delete task |
| | `POST` | `/tasks/:id/complete` | `crm:task:complete` | Mark task as completed |
| **Campaigns** | `GET` | `/campaigns` | `crm:campaign:view` | List marketing/sales campaigns |
| | `POST` | `/campaigns` | `crm:campaign:create` | Create new campaign |
| | `GET` | `/campaigns/:id` | `crm:campaign:view` | Retrieve campaign |
| | `PATCH` | `/campaigns/:id` | `crm:campaign:edit` | Update campaign |
| | `DELETE` | `/campaigns/:id` | `crm:campaign:delete` | Soft delete campaign |
| **Proposals** | `GET` | `/proposals` | `crm:proposal:view` | List commercial proposals |
| | `POST` | `/proposals` | `crm:proposal:create` | Create quotation (decimal precision) |
| | `GET` | `/proposals/:id` | `crm:proposal:view` | Retrieve proposal |
| | `PATCH` | `/proposals/:id` | `crm:proposal:edit` | Update proposal |
| | `DELETE` | `/proposals/:id` | `crm:proposal:delete` | Soft delete proposal |
| | `POST` | `/proposals/:id/send` | `crm:proposal:send` | Issue proposal to prospect |
| | `POST` | `/proposals/:id/accept` | `crm:proposal:accept` | Accept proposal (advances Opp to CONTRACT) |
| | `POST` | `/proposals/:id/reject` | `crm:proposal:edit` | Reject/decline proposal |
| **Contracts** | `GET` | `/contracts` | `crm:contract:view` | List customer contracts |
| | `POST` | `/contracts` | `crm:contract:create` | Create contract agreement |
| | `GET` | `/contracts/:id` | `crm:contract:view` | Retrieve contract |
| | `PATCH` | `/contracts/:id` | `crm:contract:edit` | Update contract |
| | `DELETE` | `/contracts/:id` | `crm:contract:delete` | Soft delete contract |
| | `POST` | `/contracts/:id/sign` | `crm:contract:sign` | Execute contract signature |
| | `POST` | `/contracts/:id/activate` | `crm:contract:activate` | Activate contract (advances Opp to WON) |
| | `POST` | `/contracts/:id/terminate` | `crm:contract:edit` | Terminate contract |

---

## Query Parameters Guide

All collection `GET` endpoints support the following parameters:

```http
GET /api/v1/leads?page=2&pageSize=10&sortBy=createdAt&sortOrder=desc&search=Sandton&status=QUALIFIED
```

* `page`: Integer >= 1 (default: 1)
* `pageSize`: Integer 1–100 (default: 20)
* `sortBy`: Field name to sort by (e.g. `createdAt`, `title`, `name`, `estimatedValue`)
* `sortOrder`: `asc` or `desc` (default: `desc`)
* `search`: Substring query evaluated against primary string attributes (case-insensitive)

---

## Examples

### 1. Capturing a Lead
```http
POST /api/v1/leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Sandton Ridge Body Corporate — 120 Units",
  "source": "DIRECT_REFERRAL",
  "email": "trustees@sandtonridge.co.za",
  "phone": "+27 11 555 0199",
  "schemeName": "Sandton Ridge SS 44/2012",
  "estimatedUnits": 120,
  "managingAgent": "Apex Property Portfolios",
  "currentSystem": "MDA Property Manager",
  "painPoints": ["Manual levy invoicing", "Delayed AGM voting"],
  "expectedTimeline": "ONE_TO_THREE_MONTHS"
}
```

### 2. Converting a Lead
```http
POST /api/v1/leads/lead_12345/convert
Content-Type: application/json
Authorization: Bearer <token>
Idempotency-Key: convert_lead_12345_attempt1

{
  "organisationName": "Sandton Ridge Body Corporate",
  "organisationType": "BODY_CORPORATE",
  "contactFirstName": "Tshepo",
  "contactLastName": "Molefe",
  "opportunityName": "Sandton Ridge SaaS License — 120 Units",
  "estimatedValue": 36000.00,
  "createSchemeProspect": true
}
```

### 3. Transitioning Opportunity Stage
```http
POST /api/v1/opportunities/opp_98765/stage
Content-Type: application/json
Authorization: Bearer <token>

{
  "stage": "PROPOSAL",
  "reason": "Commercial pricing agreed by executive trustees"
}
```

### 4. Creating a Proposal
```http
POST /api/v1/proposals
Content-Type: application/json
Authorization: Bearer <token>

{
  "opportunityId": "opp_98765",
  "title": "BCIP Core Enterprise License — Sandton Ridge",
  "subtotal": 31304.35,
  "tax": 4695.65,
  "total": 36000.00,
  "currency": "ZAR",
  "items": [
    {
      "description": "BCIP Scheme Core Platform (120 units x 12 months)",
      "quantity": 120,
      "unitPrice": 260.87,
      "amount": 31304.35
    }
  ]
}
```
