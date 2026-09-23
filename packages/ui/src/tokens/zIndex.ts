/**
 * BCIP Enterprise Design System — Design Tokens: Z-Index & Breakpoints
 */

export const zIndexTokens = {
  base: 0,
  card: 1,
  sticky: 10,
  header: 20,
  sidebar: 30,
  dropdown: 40,
  backdrop: 50,
  modal: 60,
  popover: 70,
  toast: 80,
  tooltip: 90,
} as const;

export const breakpoints = {
  sm: '640px',   // Mobile landscape / Small tablets
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small laptop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large monitor / High density workstation
} as const;
