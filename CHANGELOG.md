# Changelog

All notable changes to the Body Corporate Intelligence Platform (BCIP) and Ainubis AI Layer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-23

### Added
- **Phase 2 Architecture & Design System — Prompt 002A (Enterprise Design System & Design Tokens)**
- Created centralized design tokens under `packages/ui/src/tokens/`:
  - `colors.ts`: Semantic palette (brand, surface, text, border, status, interactive, ainubis) supporting 60-30-10 distribution.
  - `typography.ts`: Enterprise scale pairing Plus Jakarta Sans with JetBrains Mono tabular figures.
  - `spacing.ts`: Centralized space scale (space-0 to space-24) and touch target minimums.
  - `borders.ts`: Restrained border radius scale (radius-none to radius-lg).
  - `shadows.ts`: Single-elevation depth rule with shadow tokens reserved strictly for overlays.
  - `motion.ts`: Latency budgets (150ms micro-interactions, 200ms modals) respecting `prefers-reduced-motion`.
  - `zIndex.ts` and `breakpoints.ts`: Standardized stacking context and viewport breakpoints.
- Implemented Dual-Theme architecture (`darkTheme` and `lightTheme`) with semantic token mapping.
- Added layout primitives in `packages/ui/src/primitives/`: `Box`, `Stack`, `Inline`, `Grid`, `Container`, `Divider`.
- Established enterprise UI component library in `packages/ui/src/components/`:
  - `Button` and `IconButton` with primary, secondary, outline, ghost, danger, and ainubis variants.
  - Form controls: `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Label`.
  - Data display: `Badge`, `Avatar`, `Card`, `Panel`, `StatusIndicator`, `Table`, `Pagination`.
  - Overlays: `Modal`, `Dialog`, `Dropdown`, `Tooltip`, `Popover`.
  - Navigation: `Tabs`, `Breadcrumbs`.
  - Feedback: `Alert`, `Toast`, `Spinner`, `Skeleton`, `EmptyState`, `LoadingState`, `ErrorState`.
- Implemented **Ainubis Visual Foundation**:
  - Clear visual demarcation between `Observation`, `Insight`, `Recommendation`, `Alert`, and `Human Approval Required`.
  - Built `AinubisBadge`, `AinubisCard`, `AinubisBanner` with structured evidence lists and confidence scores.
- Created reusable composite patterns in `packages/ui/src/patterns/`: `DataTablePattern`, `MetricCardPattern`, `FormSectionPattern`.
- Added accessibility foundation (`VisuallyHidden`, `useReducedMotion`, high-contrast `focusVisibleClasses`).
- Built interactive **Design System & Tokens Showcase** view inside the web application (`apps/web/src/components/DesignSystemShowcase.tsx`), accessible from the top bar and sidebar navigation.
- Created complete design system documentation in `docs/design-system/` (`README.md`, `TOKENS.md`, `COMPONENTS.md`, `ACCESSIBILITY.md`, `THEMING.md`).
- Added automated design system test suite (`tests/design-system.test.ts`), integrated into `tests/run-all.ts`.

## [0.1.0] - 2026-09-23

### Added
- **Phase 1 Foundation Bootstrap (Prompt 001)**
- Established modular monorepo directory layout:
  - `apps/web`: React 19 + TypeScript + Tailwind CSS application shell.
  - `apps/api`: Express REST backend with structured logging and request correlation IDs.
  - `apps/worker`: Autonomous background worker queue processing foundation.
- Created domain shared packages:
  - `@bcip/ui`: Accessible design system primitives (Button, Card, Table, Modal, StatusIndicator).
  - `@bcip/database`: PostgreSQL connection pool, migration manager, and tenant partition models.
  - `@bcip/auth`: RBAC roles, permission matrix, and JWT validation service.
  - `@bcip/ai`: Ainubis AI Gateway abstraction, prompt templates, tool registry, and PII guardrails.
  - `@bcip/integrations`: Connector interfaces for accounting, payments, and messaging.
  - `@bcip/workflows`: Trigger-action automation engine.
- Established API endpoints:
  - `GET /health` with service status, uptime, and correlation ID.
  - `GET /api/v1/status` with application name, version, and capabilities.
- Implemented enterprise UI shell with zero-pill metadata, top-bar contract, and module placeholders.
- Built development environment container specification in `infrastructure/docker/docker-compose.yml` (PostgreSQL 16 & Redis 7).
- Authored Architecture Overview (`docs/architecture/README.md`) and Architecture Decision Record (`docs/ADR/ADR-001-project-foundation.md`).
- Added automated test suite covering config validation, API endpoints, worker queue, and web shell.
