# GitHub Copilot AI Studios — Agent Guidelines

**Project:** BCIP (Body Corporate Intelligence Platform)  
**Last Updated:** 2026-10-06  
**Version:** 1.0.0

---

## 1. Project Overview

BCIP is a comprehensive, multi-tenant enterprise platform for managing body corporate operations, commercial billing, accounts receivable, and CRM workflows. The platform is built with:

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js 22 with Deno-style ESM module resolution
- **Database:** Custom billing domain with deterministic calculations
- **UI Library:** `@bcip/ui` with custom components and strict type safety

---

## 2. Critical TypeScript Rules

### 2.1 Button Component Props

**❌ INVALID:**
```tsx
<Button icon="file-text" variant="secondary" size="sm">
  Generate Report
</Button>
```

**✅ VALID:**
```tsx
<Button 
  variant="secondary" 
  size="sm"
  leftIcon={<Icon name="file-text" size="sm" />}
>
  Generate Report
</Button>
```

**Key Points:**
- The `Button` component does NOT accept an `icon` prop
- Use `leftIcon` or `rightIcon` props instead
- Pass a JSX element wrapping the `Icon` component, not a string
- Icon names must be imported as React components

### 2.2 Valid Icon Names

Import `IconName` type and valid icon set from `@bcip/ui/icons`:

**Valid Icon Names:**
```
check, check-circle, alert-triangle, alert-circle, info,
chevron-down, chevron-up, chevron-left, chevron-right,
search, filter, refresh, x, menu, external-link,
shield, building, database, zap, cpu, bell, user,
settings, arrow-up-right, arrow-down-right, layers,
layout, clock, file-text, copy, eye, eye-off, activity,
help-circle, sliders, terminal, download, plus, minus
```

**❌ INVALID:**
```tsx
<Icon name="shield-check" />  // NOT a valid icon name
<Icon name="alert-octagon" />  // NOT a valid icon name
```

**✅ VALID:**
```tsx
<Icon name="shield" />           // Replace "shield-check"
<Icon name="alert-triangle" />   // Replace "alert-octagon"
```

### 2.3 Invoice Type Requirements

When creating invoice objects in tests or services, include all required `Invoice` interface fields:

```typescript
interface Invoice extends BaseBillingEntity {
  billingCustomerId: string;
  billingProfileId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;      // ← Required
  grandTotal: number;
  notes?: string;
  internalNotes?: string;
  createdBy: string;
  issuedBy?: string;
  issuedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  crmOpportunityId?: string;
  crmContractId?: string;
}
```

**❌ INCOMPLETE (will fail TypeScript checks):**
```tsx
const invoice = {
  id: 'inv_1',
  tenantId: 'tenant_1',
  billingCustomerId: 'cust_1',
  invoiceNumber: 'INV-001',
  status: 'ISSUED',
  currency: 'ZAR',
  subtotal: 1000,
  taxTotal: 150,
  grandTotal: 1150,
  issueDate: '2026-10-06',
  dueDate: '2026-11-06',
  // Missing: discountTotal, createdBy, etc.
};
```

**✅ COMPLETE:**
```tsx
const invoice = {
  id: 'inv_1',
  tenantId: 'tenant_1',
  billingCustomerId: 'cust_1',
  invoiceNumber: 'INV-001',
  status: 'ISSUED',
  currency: 'ZAR',
  subtotal: 1000,
  taxTotal: 150,
  discountTotal: 0,           // ← Added
  grandTotal: 1150,
  issueDate: '2026-10-06',
  dueDate: '2026-11-06',
  createdBy: 'usr_system',    // ← Added
  // ... other optional fields
};
```

---

## 3. Phase 3 Feature Areas

### 3.1 Accounts Receivable (AR) Aging

**Module:** `apps/web/src/components/billing/ArAgingViews.tsx`

**Key Components:**
- `ArAgingDashboardView`: Portfolio-level aging dashboard with 6-bucket aging
- `CustomerStatementsView`: Individual customer statement with transaction ledger
- `CollectionPriorityView`: AI-ranked collection queue with explainable factors
- `ReconciliationView`: 4-way cross-entity financial reconciliation

**Important:** All monetary calculations are deterministic server-side. Do NOT introduce client-side calculation drift.

### 3.2 Billing Domain Structure

**Invoice Lifecycle:**
```
DRAFT
  ↓
REVIEW_REQUIRED
  ↓
APPROVED
  ↓
ISSUED (immutable after this point)
  ↓
VOIDED (requires mandatory void reason audit trail)
```

**Receivable Status Enum:**
```
CURRENT (≤ 0 days overdue)
DAYS_1_30 (1-30 days)
DAYS_31_60 (31-60 days)
DAYS_61_90 (61-90 days)
DAYS_91_120 (91-120 days)
DAYS_121_PLUS (121+ days)
```

---

## 4. Deterministic Calculation Standards

All financial calculations must:
1. Use `InvoiceCalculationService.roundCurrency()` for 2-decimal precision
2. Preserve complete audit trail via `BillingAuditLog`
3. Validate monetary amounts before computation
4. Prevent floating-point drift through explicit rounding at each step

**Example:**
```typescript
import { InvoiceCalculationService } from '@bcip/database';

const result = InvoiceCalculationService.calculateInvoiceTotals(lines, taxRate);
// result contains: { subtotal, taxTotal, discountTotal, grandTotal, lines }
```

---

## 5. Component Patterns

### 5.1 Data Loading Pattern

```tsx
const [data, setData] = useState<any | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await api.getData();
    setData(result);
  } catch (err: any) {
    setError(err.message || 'Failed to fetch data.');
  } finally {
    setIsLoading(false);
  }
}, [api]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 5.2 Error Boundary Pattern

```tsx
{error && (
  <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-400 text-xs rounded-lg">
    {error}
  </div>
)}
```

---

## 6. Testing Guidelines

### 6.1 Invoice Test Fixtures

Always include complete invoice properties:

```typescript
const inv = await invoiceRepository.create(tenantId, {
  id: 'inv_test_1',
  tenantId,
  billingCustomerId: custId,
  invoiceNumber: 'INV-TEST-001',
  status: 'ISSUED',
  currency: 'ZAR',
  subtotal: 5000,
  taxTotal: 750,
  discountTotal: 0,
  grandTotal: 5750,
  issueDate: '2026-10-01',
  dueDate: '2026-10-31',
  createdBy: 'usr_system',
});
```

### 6.2 API Mocking

Use `MockEmailDeliveryProvider` and similar abstractions for external dependencies:

```typescript
const result = await MockEmailDeliveryProvider.sendEmail({
  recipient: 'test@example.com',
  subject: 'Invoice',
  body: 'Your invoice is ready.',
  correlationId: 'corr_123',
});
```

---

## 7. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `Property 'icon' does not exist on type 'ButtonProps'` | Using `icon` prop on Button | Use `leftIcon={<Icon name="..." size="sm" />}` |
| `Type '...' is not assignable to type 'IconName'` | Invalid icon name | Check against valid icon set, replace with valid name |
| `Type '...' is missing the following properties from type 'Invoice'` | Incomplete invoice object | Add all required properties including `discountTotal`, `createdBy` |
| TypeScript compilation fails | Missing type imports | Import types with `import type` for compile-time-only symbols |

---

## 8. Code Review Checklist

When reviewing BCIP code:

- [ ] All `Icon` usage matches valid `IconName` enum
- [ ] `Button` components use `leftIcon`/`rightIcon`, NOT `icon` prop
- [ ] Invoice objects include `discountTotal` and `createdBy` fields
- [ ] Financial calculations use `InvoiceCalculationService.roundCurrency()`
- [ ] Error handling includes try-catch with user-friendly messages
- [ ] Types imported correctly with `import type` for interfaces
- [ ] Receivable aging buckets use correct enum values (`DAYS_1_30`, etc.)
- [ ] Multi-tenant isolation enforced via `tenantId` parameter checks

---

## 9. Useful Commands

```bash
# Type check without emitting
npm run lint

# Run tests
npm run test

# Build project
npm run build

# Watch mode
npm run dev
```

---

## 10. Documentation References

- **Billing Architecture:** `docs/billing/BILLING-ARCHITECTURE.md`
- **Invoice Types:** `packages/database/src/billing/types.ts`
- **UI Components:** `packages/ui/src/components/Button/index.tsx`
- **Icon Set:** `packages/ui/src/icons/Icon.tsx`

---

**Last Reviewed:** 2026-10-06 by Ainubis-coder  
**Next Review:** When new Phase features are added
