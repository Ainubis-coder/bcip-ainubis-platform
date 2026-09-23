/**
 * BCIP Enterprise Design System — Design Tokens: Motion
 * Restrained latency budgets (<= 200ms) for micro-interactions.
 * Strictly respects prefers-reduced-motion.
 */

export const motionDurations = {
  instant: '50ms',
  fast: '150ms',     // Hover, focus ring, tap settling
  normal: '200ms',   // Modal reveal, tab transitions, accordions
  slow: '300ms',     // Drawer slide, large layout shifts
} as const;

export const motionEasings = {
  standard: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth settling
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  entrance: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;
