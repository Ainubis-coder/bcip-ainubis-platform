/**
 * BCIP Enterprise Design System — Design Tokens: Borders & Radii
 * Restrained enterprise rounding. Avoids consumer-social pill bubbles.
 */

export const radiusTokens = {
  none: '0px',
  sm: '0.25rem',   // 4px - Badges, tiny tags, inner buttons
  md: '0.375rem',  // 6px - Standard input fields, buttons, segmented controls
  lg: '0.5rem',    // 8px - Enterprise cards, panels, modals
  xl: '0.75rem',   // 12px - Overlays, dialogs
  full: '9999px',  // Circular avatars, status pips (strictly not for text cards)
} as const;

export const borderTokens = {
  width: {
    hairline: '1px',
    thick: '2px',
    accent: '3px',
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
  },
} as const;
