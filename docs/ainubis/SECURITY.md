# Ainubis CRM Security & Privacy Policies

Ainubis implements extensive security mechanisms to comply with South Africa's POPIA (Protection of Personal Information Act) and general enterprise data boundary standards.

## 1. PII Redaction Guardrails
Before context data is sent to AI models or rule engines, sensitive patterns are parsed and redacted:
- Credit Card Patterns: `\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b` -> `[REDACTED_CARD]`
- National ID Patterns & Passports are flagged and sanitized.

## 2. Token Limit Restrictions
The `AIPolicyEngine` monitors token consumption at the tenant level:
- Default Limit: `1,000,000` daily tokens.
- Cross-tenant requests immediately trigger policy rejection.

## 3. Strict Tenant Scope Enforcement
No SQL or in-memory queries can fetch cross-tenant data. The `AIObservationRepository` and `BaseCrmRepository` strictly match the `tenantId` session header on every single database method.
