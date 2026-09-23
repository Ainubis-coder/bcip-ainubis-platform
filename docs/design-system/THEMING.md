# BCIP Theming Architecture

The BCIP Enterprise Design System supports a flexible multi-theme architecture powered by semantic tokens.

## Architecture

Tokens are decoupled from hardcoded CSS classes. Components consume semantic roles rather than primitive palette values.

```text
Primitive Color Palette (e.g. slate[950], emerald[500])
       │
       ▼
Semantic Tokens (brand.primary, surface.default, status.warning)
       │
       ▼
Theme Definition (darkTheme, lightTheme)
       │
       ▼
Enterprise UI Components (<Button />, <Card />, <Table />)
```

## Theme Switching

Both `darkTheme` and `lightTheme` implement the strict `Theme` interface:

```typescript
import { darkTheme, lightTheme, Theme } from '@bcip/ui';

export function getTheme(themeName: 'dark' | 'light'): Theme {
  return themeName === 'dark' ? darkTheme : lightTheme;
}
```

## Palette Equivalence Matrix

| Semantic Token | Dark Mode Value | Light Mode Value |
| :--- | :--- | :--- |
| `brand.primary` | `#10B981` (Emerald 500) | `#059669` (Emerald 600) |
| `surface.canvas` | `#020617` (Slate 950) | `#F8FAFC` (Slate 50) |
| `surface.default`| `#0F172A` (Slate 900) | `#FFFFFF` (Pure White) |
| `surface.raised` | `#1E293B` (Slate 800) | `#FFFFFF` (White with shadow) |
| `text.primary`   | `#F8FAFC` (Slate 50) | `#0F172A` (Slate 900) |
| `text.secondary` | `#CBD5E1` (Slate 300) | `#334155` (Slate 700) |
| `border.default` | `#1E293B` (Slate 800) | `#E2E8F0` (Slate 200) |
