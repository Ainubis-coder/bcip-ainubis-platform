# BCIP CRM API Authentication Guide

## 1. Authentication Architecture

BCIP uses RFC 6750 / RFC 7519 JSON Web Tokens (JWT) for secure stateless API authentication.

Every incoming request passes through the **Authentication & Tenant Resolution Middleware** (`authMiddleware`):

```text
HTTP Request (Header: Authorization: Bearer <token>)
       │
       ▼
Token Signature & Expiry Verification (TokenService)
       │
       ├── Invalid / Expired ──────► 401 Unauthorized
       ├── Missing Tenant ID  ──────► 403 Forbidden
       │
       ▼
Extract Identity Context:
  - User ID (sub)
  - User Email
  - Role (UserRole)
  - Tenant ID (tenantId)
  - Scheme Permissions
       │
       ▼
Populate Express Request Context:
  req.user = AuthUser
  req.tenantId = string
```

---

## 2. Token Format & Claims

A valid BCIP token contains the following decoded claims payload:

```json
{
  "sub": "usr_99812_admin",
  "email": "sarah.connor@apexportfolios.co.za",
  "role": "MANAGING_AGENT_ADMIN",
  "tenantId": "tenant_apex_sandton",
  "schemeIds": ["sch_881", "sch_882"],
  "iss": "bcip.ainubis.platform",
  "aud": "bcip-api",
  "iat": 1790676405,
  "exp": 1790680005
}
```

---

## 3. Obtaining a Token

In client applications and integration connectors:

```typescript
import { tokenService } from '@bcip/auth';

const token = tokenService.generateDummyToken({
  id: 'usr_sarah',
  email: 'sarah@apex.co.za',
  name: 'Sarah Connor',
  role: 'MANAGING_AGENT_ADMIN',
  tenantId: 'tenant_apex_sandton',
  permissions: []
});
```

---

## 4. Making Authenticated Requests

### cURL Example
```bash
curl -X GET https://api.bcip.platform/api/v1/leads \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

### TypeScript / Fetch Example
```typescript
const response = await fetch('/api/v1/leads', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```

---

## 5. Test Context Headers (Non-Production Only)

For automated CI/CD integration testing, when `NODE_ENV !== 'production'` and the `Authorization` header is not provided, the middleware accepts test identity headers:

* `x-test-tenant-id`: Target test tenant ID
* `x-test-user-role`: Target role (`PLATFORM_SUPER_ADMIN`, `MANAGING_AGENT_ADMIN`, etc.)
* `x-test-user-id`: Target user ID
* `x-test-user-email`: Target user email

In `production` mode, these headers are ignored and strict cryptographic JWT verification is enforced.
