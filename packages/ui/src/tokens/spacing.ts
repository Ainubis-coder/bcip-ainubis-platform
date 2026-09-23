/**
 * BCIP Enterprise Design System — Design Tokens: Spacing & Sizing
 * Centralized standard scale (space-0 to space-24).
 * Enforces spatial math: container padding >= inner child gap.
 */

export const spacingScale = {
  0: '0rem',         // 0px
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
} as const;

export const sizingTokens = {
  // Touch & Click Target minimums (>= 40px desktop, >= 44px mobile touch)
  targetMinDesktop: '2.5rem', // 40px
  targetMinMobile: '2.75rem', // 44px

  // Row Heights for Data Grids
  tableRowCompact: '2.25rem', // 36px
  tableRowStandard: '2.75rem', // 44px
  tableRowComfortable: '3.25rem', // 52px

  // Sidebar widths
  sidebarCollapsed: '4.5rem', // 72px
  sidebarExpanded: '16.5rem', // 264px

  // Top header height
  topBarHeight: '3.5rem', // 56px
} as const;
