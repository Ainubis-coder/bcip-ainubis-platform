# BCIP Navigation Architecture & Module Taxonomy

## 1. Enterprise Navigation Groups

The BCIP Enterprise Sidebar and Mobile Drawer organize 21 core modules into 9 logical functional groups:

| Group | Key | Module ID | Label | Purpose | Phased Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OVERVIEW** | `overview` | `dashboard` | Dashboard | Multi-scheme operational KPIs and portfolio rollups | Phase 1 (Live) |
| **RELATIONSHIPS** | `relationships` | `crm` | CRM | Client contact records, managing agent directories | Phase 2 |
| | | `leads` | Leads | Body corporate acquisition and proposal pipeline | Phase 2 |
| | | `organisations` | Organisations | Managing agent firms, corporate entity hierarchies | Phase 2 |
| **PROPERTY** | `property` | `schemes` | Schemes | Sectional title registers, CSOS registration, rules | Phase 2 |
| | | `properties` | Properties | Unit registers, sections, exclusive use areas | Phase 2 |
| **FINANCE** | `finance` | `finance` | Finance | Admin fund, 10-year reserve fund, general ledger | Phase 3 |
| | | `invoices` | Invoices | Levy rolls, special levies, debtor collection | Phase 3 |
| | | `payments` | Payments | Debit order runs, payment gateway webhooks | Phase 3 |
| **OPERATIONS** | `operations` | `maintenance` | Maintenance | Common property work orders, maintenance logs | Phase 3 |
| | | `contractors` | Contractors | Approved vendor directory, insurance & SLAs | Phase 3 |
| **GOVERNANCE** | `governance` | `governance` | Governance | AGMs, electronic proxy voting, resolutions | Phase 4 |
| | | `documents` | Documents | Sectional plans, conduct rules, policy vaults | Phase 4 |
| **PLATFORM** | `platform` | `integrations` | Integrations | Accounting ERP sync, smart water/power meters | Phase 4 |
| | | `analytics` | Analytics | Cross-scheme benchmarking, arrears curves | Phase 4 |
| **AINUBIS INTELLIGENCE** | `ainubis` | `ainubis` | Ainubis Intelligence | Cognitive telemetry, agent gateway status | Phase 5 |
| | | `alerts` | Alerts | Real-time variance flags, consumption spikes (3 active) | Phase 5 |
| | | `recommendations`| Recommendations | Advisory optimization proposals (2 active) | Phase 5 |
| | | `tasks` | Tasks | Unified fiduciary approval queue (19 active) | Phase 5 |
| **SYSTEM** | `system` | `notifications` | Notifications | Omnichannel delivery logs & broadcasts | Phase 5 |
| | | `administration` | Administration | Platform security, RBAC roles, audit logs | Phase 1-6 |
| | | `design_system` | Design System | Enterprise design tokens & component showcase | Phase 2A |

---

## 2. Active Route & State Synchronization

- **Route State**: `currentModule` is bound to `window.location.hash` (`#dashboard`, `#schemes`, `#crm`, etc.).
- **Browser History**: Listens to `hashchange` events so browser Back and Forward buttons operate smoothly.
- **Deep Linking**: Direct URL entry immediately activates the corresponding module.
- **Visual Feedback**: Active navigation items receive an emerald accent border (`border-emerald-400`), highlighted background (`bg-emerald-500/10`), and `aria-current="page"`.

---

## 3. Sidebar Collapse Mechanics

- **Expanded (`w-64` / 256px)**: Shows full typography labels, section headers, badge counts, and version footer.
- **Collapsed (`w-16` / 64px)**: Condenses to centered icon buttons.
  - Hovering or focusing an icon reveals an accessible `Tooltip` indicating the module title, badge count, and phase.
  - Sidebar state persists across sessions via `localStorage.getItem('bcip_sidebar_collapsed')`.
  - Accessible button toggles width with keyboard focus.
