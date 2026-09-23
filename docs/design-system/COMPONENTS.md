# BCIP Component Library Reference

All components reside in `packages/ui` and are imported via `@bcip/ui`.

## 1. Action Components

### `Button`
- **Variants**: `primary`, `secondary`, `outline`, `ghost`, `danger`, `ainubis`.
- **Sizes**: `sm` (32px min-height), `md` (40px min-height), `lg` (44px min-height).
- **Props**: `isLoading`, `leftIcon`, `rightIcon`, `disabled`.
- **Focus**: Accessible ring offset with sky-400 focus-visible outline.

### `IconButton`
- Square touch target (32px sm, 40px md, 44px lg).
- Mandatory `aria-label` attribute.

---

## 2. Form Components

- `Input`: Integrated text/email/password input with `label`, `helperText`, `error`, `leftIcon`, and `rightIcon`.
- `Textarea`: Multi-line input with auto-wrap and character capacity helper text.
- `Select`: Custom styled arrow indicator with native keyboard select accessibility.
- `Checkbox`: Square check control with label and descriptive secondary text.
- `Radio`: Accessible radio group option.
- `Switch`: Toggle switch control with accessible `role="switch"` and `aria-checked`.
- `Label`: Uppercase tracked form field label with red asterisk `required` flag.

---

## 3. Data Display Components

- `Badge`: Subtle status badge (`neutral`, `success`, `warning`, `error`, `info`, `ainubis`) with optional dot pip.
- `Avatar`: Circular user initials or photo disc with status indicator ring.
- `Card`: Single-elevation container with subtle 1px border (`title`, `subtitle`, `headerAction`, `padding`).
- `Panel`: Bordered sub-container for sidebars or filters.
- `StatusIndicator`: Dot pip with label and monospace tabular subtext.
- `Table`: Data-dense table component with sortable columns, alignment flags, and tabular-nums enforcement.
- `Pagination`: Previous/Next controls with record counts ("Showing X to Y of Z entries").

---

## 4. Overlay Components

- `Modal`: Backdrop blurred modal with title, description, body, footer, and Escape key listener.
- `Dialog`: Structured confirmation/cancellation alert dialog with primary, danger, or ainubis actions.
- `Dropdown`: Popover menu with click-outside detection and keyboard navigation.
- `Tooltip`: Hover/focus micro-context tooltip.
- `Popover`: Rich contextual popover container.

---

## 5. Navigation Components

- `Tabs`: Underline or segmented tab list with count indicators.
- `Breadcrumbs`: Path hierarchy separated by `/` with current page marking.

---

## 6. Feedback & State Components

- `Alert`: Banner alert (`info`, `success`, `warning`, `error`, `ainubis`).
- `Toast`: Auto-dismissible or dismissible notification card.
- `Spinner`: SVG spinner with screen-reader text.
- `Skeleton`: Pulsing placeholder matching row/card geometries.
- `EmptyState`: Clean empty container with icon, title, description, and action button.
- `LoadingState`: Centered loading spinner with explanatory subtext.
- `ErrorState`: Connection or retrieval error prompt with retry button.

---

## 7. Ainubis Visual Components

- `AinubisBadge`: Renders state badge for `observation`, `insight`, `recommendation`, `alert`, or `approval_required`.
- `AinubisCard`: Complete intelligence card displaying confidence score, evidence list, scheme context, and explicit action buttons.
- `AinubisBanner`: Prominent banner introducing the Ainubis governance layer.

---

## 8. Enterprise Patterns

- `DataTablePattern`: Composite pattern combining search filter, sorting, table, and pagination.
- `MetricCardPattern`: Metric card with monospace tabular numerals, percentage change, and trend direction.
- `FormSectionPattern`: Grouped form fields with header and action bar.
