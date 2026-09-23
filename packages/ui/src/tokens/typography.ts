/**
 * BCIP Enterprise Design System — Design Tokens: Typography
 * Scaled for enterprise operational data density and clear readability.
 * Strictly enforces tabular numbers for numerical metrics.
 */

export const fontFamilies = {
  sans: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'IBM Plex Mono', Menlo, Consolas, Monaco, monospace",
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export interface TypographyToken {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: number;
  fontFamily: string;
  cssClass: string;
}

export const typographyScale: Record<string, TypographyToken> = {
  display: {
    fontSize: '2rem', // 32px
    lineHeight: '2.5rem', // 40px
    letterSpacing: '-0.025em',
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-3xl font-bold tracking-tight',
  },
  heading1: {
    fontSize: '1.5rem', // 24px
    lineHeight: '2rem', // 32px
    letterSpacing: '-0.02em',
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-2xl font-semibold tracking-tight',
  },
  heading2: {
    fontSize: '1.25rem', // 20px
    lineHeight: '1.75rem', // 28px
    letterSpacing: '-0.015em',
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-xl font-semibold tracking-tight',
  },
  heading3: {
    fontSize: '1.125rem', // 18px
    lineHeight: '1.5rem', // 24px
    letterSpacing: '-0.01em',
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-lg font-semibold tracking-tight',
  },
  heading4: {
    fontSize: '0.875rem', // 14px
    lineHeight: '1.25rem', // 20px
    letterSpacing: '-0.005em',
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-sm font-semibold tracking-tight',
  },
  bodyLarge: {
    fontSize: '1rem', // 16px
    lineHeight: '1.5rem', // 24px
    letterSpacing: '0',
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-base font-normal',
  },
  body: {
    fontSize: '0.875rem', // 14px
    lineHeight: '1.25rem', // 20px
    letterSpacing: '0',
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-sm font-normal',
  },
  bodySmall: {
    fontSize: '0.8125rem', // 13px
    lineHeight: '1.125rem', // 18px
    letterSpacing: '0',
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-[13px] font-normal leading-snug',
  },
  caption: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1rem', // 16px
    letterSpacing: '0.01em',
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-xs font-normal',
  },
  label: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1rem', // 16px
    letterSpacing: '0.02em',
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-xs font-medium',
  },
  button: {
    fontSize: '0.8125rem', // 13px
    lineHeight: '1.25rem', // 20px
    letterSpacing: '0',
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.sans,
    cssClass: 'text-xs sm:text-sm font-medium whitespace-nowrap',
  },
  code: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1.125rem', // 18px
    letterSpacing: '0',
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.mono,
    cssClass: 'font-mono tabular-nums text-xs',
  },
  metricLarge: {
    fontSize: '1.75rem', // 28px
    lineHeight: '2rem',
    letterSpacing: '-0.02em',
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.mono,
    cssClass: 'font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight',
  },
};
