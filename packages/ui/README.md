# @bcip/ui — BCIP Enterprise Design System

The official UI component and design-token library for the **Body Corporate Intelligence Platform (BCIP)**.

## Architecture

```text
packages/ui/
├── src/
│   ├── tokens/            # Centralized design tokens (colors, typography, spacing, borders, shadows, motion, zIndex)
│   ├── themes/            # Theme definitions (dark and light semantic palettes)
│   ├── accessibility/     # A11y utilities (VisuallyHidden, useReducedMotion, focus rings)
│   ├── icons/             # Accessible enterprise SVG icon library
│   ├── primitives/        # Layout building blocks (Box, Stack, Inline, Grid, Container, Divider)
│   ├── components/        # Foundational enterprise UI components
│   │   ├── Button/        # Button, IconButton (primary, secondary, outline, ghost, danger, ainubis)
│   │   ├── Input/         # Input, Textarea, Select, Checkbox, Radio, Switch, Label
│   │   ├── DataDisplay/   # Badge, Avatar, Card, Panel, Table, Pagination, StatusIndicator
│   │   ├── Feedback/      # Alert, Toast, Spinner, Skeleton, EmptyState, LoadingState, ErrorState
│   │   ├── Overlay/       # Modal, Dialog, Dropdown, Popover, Tooltip
│   │   ├── Navigation/    # Tabs, Breadcrumbs
│   │   └── Ainubis/       # AinubisBadge, AinubisCard, AinubisBanner
│   ├── patterns/          # Enterprise composite patterns (DataTablePattern, MetricCardPattern, FormSectionPattern)
│   └── index.ts           # Central package barrel export
```

## Key Architectural Principles

1. **Enterprise Restraint**: No toy gradients, ungrounded scorecards, or consumer pill blobs.
2. **Zero-Pill Discipline**: Metadata uses clean typographic separators (`·`, `/`) instead of boxed badges.
3. **Tabular Numerals**: Strict enforcement of `font-mono tabular-nums` across all numeric tables, financial ledgers, and telemetry.
4. **Ainubis Intelligence Separation**: Clear visual distinctions across:
   - `Observation`: Passive monitoring and telemetry
   - `Insight`: Pattern and invariant recognition
   - `Recommendation`: Strategic optimization guidance
   - `Alert`: Operational variance and risk warning
   - `Human Approval Required`: Explicit executive sign-off gate before execution
5. **Accessibility**: WCAG 2.1 AA compliant color contrasts, visible high-contrast focus rings, keyboard navigability, and `prefers-reduced-motion` compliance.
