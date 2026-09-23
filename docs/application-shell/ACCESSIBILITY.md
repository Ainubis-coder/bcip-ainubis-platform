# BCIP Application Shell Accessibility Architecture

Target: **WCAG 2.1 Level AA Compliance**

## 1. Landmarks & Semantic Hierarchy

- `<header role="banner">` $\rightarrow$ `TopBar`
- `<aside role="navigation" aria-label="Primary Navigation">` $\rightarrow$ Desktop `Sidebar`
- `<div role="dialog" aria-modal="true" aria-label="Mobile Navigation">` $\rightarrow$ `MobileNavigation`
- `<main role="main">` $\rightarrow$ Application workspace
- `<nav aria-label="Breadcrumb">` $\rightarrow$ `Breadcrumbs`

## 2. Keyboard Navigation & Interaction Contracts

| Target | Shortcut / Action | Behavior |
| :--- | :--- | :--- |
| **Global Search** | `Cmd+K` or `Ctrl+K` | Opens Command Palette modal from any workspace location |
| **Search List** | `ArrowDown` / `ArrowUp` | Cycles selected search result item |
| **Search Select** | `Enter` | Activates focused search result and navigates to target module |
| **Modal / Drawer**| `Escape` | Immediately closes active overlay and restores focus |
| **Navigation Items**| `Tab` / `Shift-Tab` | Traverses navigation buttons in DOM order with visible focus ring |
| **Sidebar Collapse**| `Space` or `Enter` | Toggles expanded/collapsed state |

## 3. High-Contrast Focus Visible Rings

All interactive buttons, search inputs, menu triggers, and sidebar items implement `@bcip/ui` `focusVisibleClasses`:
```css
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
```
Focus rings are offset by 2px against the dark canvas to guarantee visibility on dark themes.

## 4. Screen-Reader & ARIA Annotations

- **Active Links**: Tagged with `aria-current="page"`.
- **Badges**: Dot indicators and icons paired with descriptive text or hidden via `aria-hidden="true"`.
- **Icon-Only Buttons**: Standalone icons enforce `aria-label` (e.g. `aria-label="Open mobile navigation"`, `aria-label="Collapse sidebar"`).
- **Overlays**: Modals and drawers implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.

## 5. Reduced Motion Handling

In compliance with WCAG 2.3.3:
- The shell respects `(prefers-reduced-motion: reduce)`.
- Animations (slide-in drawers, modal fades) are replaced with instantaneous renders or shortened transitions ($\le 50\text{ms}$).
