# BCIP Application Shell Responsive Specifications

## 1. Supported Viewports & Breakpoint Strategy

BCIP utilizes a mobile-first responsive architecture supporting all enterprise devices:

| Viewport Tier | Width Range | Layout Configuration | Navigation Treatment |
| :--- | :--- | :--- | :--- |
| **Small Mobile** | $320\text{px} - 390\text{px}$ | Single column workspace, full-width cards | Hamburger menu $\rightarrow$ Slide-out mobile navigation drawer |
| **Standard Mobile** | $390\text{px} - 640\text{px}$ | Single column workspace, horizontal scrolling tables | Full mobile drawer, compact top bar |
| **Small Tablet** | $640\text{px} - 768\text{px}$ | 2-column metric cards, responsive search input | Mobile drawer or condensed top-bar controls |
| **Standard Tablet** | $768\text{px} - 1024\text{px}$| 2-column workspace grids, visible search trigger | Mobile drawer, condensed table columns |
| **Laptop / Desktop** | $1024\text{px} - 1440\text{px}$| 3-column workspace, full tabular figures | Persistent collapsible sidebar (`w-64` or `w-16`) |
| **Large Enterprise** | $1440\text{px} +$ | High-density operational dashboards | Persistent expanded sidebar, full operational telemetry |

---

## 2. Component-Level Responsive Behaviors

### TopBar
- **Branding**: Mobile displays compact logo icon ("B"); desktop renders full "BCIP — Body Corporate Intelligence Platform".
- **Tenant Context**: Truncates agency name gracefully with `max-w-[160px]` on mobile, expanding to full statistics on desktop.
- **Search Trigger**: Condenses to an icon button on small screens; expands to input field with `⌘K` shortcut badge on desktop.
- **Zone Balance**: Prevents horizontal overflow by shrinking center zone padding while preserving touch targets ($\ge 40\text{px}$).

### Workspace & Tables
- **Breadcrumbs**: Intermediate segments wrap cleanly without line-height jitter.
- **Data Tables**: Encapsulated within overflow containers allowing horizontal scrolling without page-level canvas clipping.
- **Modals & Drawers**: Render as full-height or centered bounded dialogs with max widths (`max-w-2xl`, `max-w-md`) preventing viewport edge collision.

---

## 3. Zero Horizontal Overflow Rule

The top-level shell enforces:
```css
html, body, #root {
  overflow-x: hidden;
  width: 100%;
}
```
All child workspace panes scroll independently in their y-axis without creating window-level scrollbars.
