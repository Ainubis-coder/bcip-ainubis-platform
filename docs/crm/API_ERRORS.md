# BCIP CRM API Error Handling Guide

## 1. Standard Error Envelope

All API errors return a standard JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "body.title",
        "message": "Lead title is required"
      }
    ],
    "requestId": "bcip_req_1790676405168_aiye17o"
  }
}
```

---

## 2. Standard HTTP Status Codes & Error Codes

| Status Code | Error Code (`code`) | Meaning |
| :--- | :--- | :--- |
| **400 Bad Request** | `BAD_REQUEST` | Malformed request or domain invariant violation |
| **401 Unauthorized** | `UNAUTHORIZED` | Missing, malformed, or expired JWT bearer token |
| **403 Forbidden** | `FORBIDDEN` | Authenticated user lacks required RBAC permission |
| **404 Not Found** | `NOT_FOUND` | Entity does not exist or belongs to another tenant |
| **409 Conflict** | `CONFLICT` | Concurrent request in-flight or state already finalized |
| **422 Unprocessable** | `VALIDATION_ERROR` | Request body, query, or path parameter schema validation failed |
| **500 Internal Error** | `INTERNAL_SERVER_ERROR` | Unhandled server error (sanitized in production) |

---

## 3. Data Sanitization & Information Leakage Prevention

In production environments (`NODE_ENV === 'production'`):
* Internal stack traces are never sent in responses.
* SQL queries, database hostnames, and table details are stripped.
* Cross-tenant accesses return standard `404 Not Found` rather than `403 Forbidden`, preventing resource enumeration across tenants.
