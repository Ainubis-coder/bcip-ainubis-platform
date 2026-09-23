# BCIP Design Tokens Reference

## 1. Color System

### Base Palette
- **Slate (Neutrals)**: `50` to `950` (`#F8FAFC` to `#020617`)
- **Emerald (Brand & Success)**: `50` to `900` (`#ECFDF5` to `#064E3B`)
- **Amber (Warning & Due)**: `50` to `900` (`#FFFBEB` to `#78350F`)
- **Rose (Destructive & Error)**: `50` to `900` (`#FFF1F2` to `#881337`)
- **Sky (Informational & Telemetry)**: `50` to `900` (`#F0F9FF` to `#0C4A6E`)
- **Indigo (Ainubis Core)**: `50` to `900` (`#EEF2FF` to `#312E81`)

### Semantic Roles (Dark Mode Default)

| Role | Token Value | Purpose |
| :--- | :--- | :--- |
| `brand.primary` | `#10B981` (Emerald 500) | Primary call-to-actions, confirmed state |
| `brand.secondary` | `#38BDF8` (Sky 400) | Secondary interactions, active indicators |
| `brand.accent` | `#6366F1` (Indigo 500) | Ainubis advisory prompts |
| `surface.canvas` | `#020617` (Slate 950) | Top-level screen background |
| `surface.default` | `#0F172A` (Slate 900) | Standard card and table containers |
| `surface.raised` | `#1E293B` (Slate 800) | Interactive rows, hover backgrounds |
| `surface.overlay` | `#334155` (Slate 700) | Dialogs and dropdown menus |
| `text.primary` | `#F8FAFC` (Slate 50) | High-contrast body copy & headings |
| `text.secondary` | `#CBD5E1` (Slate 300) | Metadata and table cell values |
| `text.muted` | `#94A3B8` (Slate 400) | Field labels, captions |
| `text.disabled` | `#475569` (Slate 600) | Deactivated controls |
| `status.success` | `#10B981` | Healthy telemetry, verified balances |
| `status.warning` | `#F59E0B` | Approaching deadlines, review flags |
| `status.error` | `#F43F5E` | Arrears deficits, compliance failures |
| `status.info` | `#38BDF8` | System notices, automated tasks |

### Ainubis Visual States

| State | Color Token | Background Token | Semantic Definition |
| :--- | :--- | :--- | :--- |
| `observation` | `#94A3B8` | `rgba(148, 163, 184, 0.08)` | Passive sensor or telemetry monitoring |
| `insight` | `#38BDF8` | `rgba(56, 189, 248, 0.10)` | Correlated trend or historical pattern |
| `recommendation` | `#6366F1` | `rgba(99, 102, 241, 0.10)` | Proposed optimization or advisory strategy |
| `alert` | `#F59E0B` | `rgba(245, 158, 11, 0.12)` | Critical variance or compliance breach |
| `approval_required` | `#EC4899` | `rgba(236, 72, 153, 0.12)` | Blocked execution pending human trustee sign-off |

---

## 2. Typography

| Role | Font Family | Size / Line Height | Tracking | Weight |
| :--- | :--- | :--- | :--- | :--- |
| `display` | Plus Jakarta Sans | 32px / 40px (2rem / 2.5rem) | -0.025em | Bold (700) |
| `heading1` | Plus Jakarta Sans | 24px / 32px (1.5rem / 2rem) | -0.02em | Semibold (600) |
| `heading2` | Plus Jakarta Sans | 20px / 28px (1.25rem / 1.75rem) | -0.015em | Semibold (600) |
| `heading3` | Plus Jakarta Sans | 18px / 24px (1.125rem / 1.5rem) | -0.01em | Semibold (600) |
| `heading4` | Plus Jakarta Sans | 14px / 20px (0.875rem / 1.25rem) | -0.005em | Semibold (600) |
| `body` | Plus Jakarta Sans | 14px / 20px (0.875rem / 1.25rem) | 0 | Regular (400) |
| `caption` | Plus Jakarta Sans | 12px / 16px (0.75rem / 1rem) | 0.01em | Regular (400) |
| `code` | JetBrains Mono | 12px / 18px (0.75rem / 1.125rem) | 0 | Regular (400) |
| `metricLarge` | JetBrains Mono | 28px / 32px (1.75rem / 2rem) | -0.02em | Bold (700) |

---

## 3. Spacing & Touch Targets
- Scales: `0` (0px) to `24` (96px). Standard step: 4px base (`0.25rem`).
- Touch Targets: `>= 40px` on desktop, `>= 44px` on mobile.
- Table Row Heights: Compact (36px), Standard (44px), Comfortable (52px).

---

## 4. Radii & Elevation
- Radii: `sm` (4px), `md` (6px), `lg` (8px), `xl` (12px), `full` (9999px for avatar discs only).
- Elevation: Flat by default (1px hairline border), shadows reserved for dropdowns (`elevation.md`), popovers (`elevation.lg`), and dialogs (`elevation.xl`).

---

## 5. Motion Budgets
- Fast (`150ms`): Button clicks, toggle states, focus rings.
- Normal (`200ms`): Modal reveals, tab changes, accordions.
- Slow (`300ms`): Sidebar drawer slides.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
