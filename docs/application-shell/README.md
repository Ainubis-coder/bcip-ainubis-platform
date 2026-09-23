# BCIP Enterprise Application Shell Architecture

## 1. Overview & Architectural Hierarchy

The BCIP Enterprise Application Shell is the permanent, responsive structural framework that encloses all domain workflows within the Body Corporate Intelligence Platform.

```text
Application Root (AppShell)
│
├── TopBar (Three-Zone Enterprise Header)
│   ├── Zone 1: Identity, Mobile Drawer Trigger, Desktop Sidebar Collapse Toggle
│   ├── Zone 2: Operational Context (Tenant Switcher UI & Global Search Trigger)
│   └── Zone 3: Ainubis Telemetry, Notification Bell, Diagnostic Status, User Account Menu
│
├── Structural Workspace Layout
│   ├── Sidebar (9 Enterprise Navigation Groups, Collapsible to Icon-Only with Tooltips)
│   ├── MobileNavigation (Accessible Slide-Out Drawer for Small Displays)
│   └── Workspace Container (Wrapped in ShellErrorBoundary)
│       ├── Breadcrumbs (Hierarchical Landmark Path)
│       ├── PageHeader (Standard Enterprise Header with Badges & Action Buttons)
│       └── Workspace Content (Module Views / Dashboard)
│
└── Global Overlays & Modals
    ├── GlobalSearchModal (Cmd+K / Ctrl+K Command Palette)
    ├── NotificationPanel (Category Filtered Slide-Out Notification Drawer)
    ├── TenantContextModal (Active Managing Agency Switcher & RLS Isolation Preview)
    ├── AinubisDrawer (Quick Intelligence Telemetry & Fiduciary Gate Status)
    └── ApiStatusModal (System Runtime & Connectivity Diagnostic Modal)
```

## 2. Core Shell Responsibilities

1. **Strict Operational Identity**: Communicates financial rigor, statutory governance compliance, and property intelligence rather than generic marketing or crypto/gaming styling.
2. **Three-Zone Top Bar**: Preserves a strict contract separating branding, operational context, and account/intelligence tools.
3. **9 Enterprise Navigation Groups**: Organizes 21 core modules into logical functional tiers with badge counts.
4. **Desktop Collapse State**: Toggles between 256px expanded layout and 64px icon-only layout with accessible tooltips and persisted preferences.
5. **Multi-Tenant Context**: Visibly communicates the active managing agency and enforces visual boundary cues.
6. **Ainubis Intelligence Integration**: Restrained top-bar and sidebar touchpoints providing live telemetry without conversational chatbot distractions.
7. **URL-Synchronized Route State**: Supports back/forward navigation, deep hash links (`#dashboard`, `#schemes`, `#crm`), and active section tracking.
8. **Fault Isolation**: Isolates module failures via `ShellErrorBoundary` and provides fallback states (`ShellWorkspaceSkeleton`, `ShellErrorState`).
