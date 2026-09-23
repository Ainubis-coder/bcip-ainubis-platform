/**
 * BCIP Enterprise Design System — Design Tokens: Elevation & Shadows
 * Single-elevation depth rule: flat structural cards with subtle 1px hairline border,
 * reserving elevated shadows strictly for overlays, dropdowns, and dialogs.
 */

export const elevationTokens = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)',
} as const;
