# BCIP Accessibility Guidelines & Standards

The BCIP Enterprise Design System targets **WCAG 2.1 Level AA** compliance across all modules.

## 1. Contrast Ratios

- **Normal Text (< 18pt)**: Minimum 4.5:1 contrast against surface background.
  - `#F8FAFC` on `#020617` (Canvas): **19.8:1** (AAA)
  - `#CBD5E1` on `#0F172A` (Surface): **10.5:1** (AAA)
  - `#94A3B8` on `#0F172A` (Muted): **5.2:1** (AA)
- **Large Text (>= 18pt / bold >= 14pt)**: Minimum 3.0:1 contrast.
- **UI Components & Graphical Objects**: Minimum 3.0:1 contrast against adjacent colors.

## 2. Focus Indicators

- All interactive controls implement `focusVisibleClasses`:
  ```css
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
  ```
- Focus rings never clip and remain visible when navigating via keyboard (Tab / Shift-Tab).

## 3. Keyboard Navigation

- **Modals & Dialogs**:
  - Automatically listen for `Escape` to dismiss.
  - Backdrop clicks do not dismiss destructive dialogs without explicit confirmation.
- **Dropdowns & Popovers**:
  - Click-outside listeners close the active overlay.
  - Elements use valid ARIA roles (`role="menu"`, `role="menuitem"`).
- **Tabs**:
  - `role="tablist"` and `role="tab"` with `aria-selected` attributes.

## 4. Screen Reader Support

- Visual icons have `role="presentation"` and `aria-hidden="true"` when paired with text, or mandatory `aria-label` when standalone (`IconButton`).
- `VisuallyHidden` component hides text visually while retaining it in the DOM accessibility tree.
- Live notifications (`Toast`, `Alert`) use `role="status"` or `role="alert"` with `aria-live="polite"`.

## 5. Reduced Motion

- The system detects `(prefers-reduced-motion: reduce)` through the `useReducedMotion` hook.
- Transition durations are curtailed to instant or <= 50ms when reduced motion is preferred by the operating system.
