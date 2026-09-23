/**
 * BCIP Enterprise Design System — Design Tokens: Colors
 * Semantic color scale supporting Light and Dark modes.
 * Adheres to 60-30-10 distribution and WCAG AA contrast ratios.
 */

export const colorPalette = {
  // Slate Neutrals (Cool Gray / Dark Slate)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  // Emerald Brand & Success
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  // Amber Warning & Pending
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  // Rose Alert & Destructive
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  // Sky / Cyan Information & Ainubis Intel
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  // Violet / Indigo Ainubis Special Accent (Restrained, not neon)
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
} as const;

/**
 * Semantic Tokens for Dark Theme (Current Default)
 */
export const darkSemanticColors = {
  brand: {
    primary: '#10B981',       // Emerald 500
    primaryHover: '#059669',  // Emerald 600
    primaryActive: '#047857', // Emerald 700
    secondary: '#38BDF8',     // Sky 400
    accent: '#6366F1',        // Indigo 500
    foreground: '#FFFFFF',
    background: '#020617',    // Slate 950
  },
  surface: {
    canvas: '#020617',        // Slate 950
    default: '#0F172A',       // Slate 900
    raised: '#1E293B',        // Slate 800
    overlay: '#334155',       // Slate 700
    sunken: '#000000',
    highlight: 'rgba(255, 255, 255, 0.04)',
  },
  text: {
    primary: '#F8FAFC',       // Slate 50
    secondary: '#CBD5E1',     // Slate 300
    muted: '#94A3B8',         // Slate 400
    disabled: '#475569',      // Slate 600
    inverse: '#0F172A',       // Slate 900
  },
  border: {
    default: '#1E293B',       // Slate 800
    subtle: 'rgba(255, 255, 255, 0.08)',
    strong: '#334155',        // Slate 700
    focus: '#38BDF8',         // Sky 400
  },
  status: {
    success: '#10B981',       // Emerald 500
    successBg: 'rgba(16, 185, 129, 0.12)',
    successText: '#34D399',
    warning: '#F59E0B',       // Amber 500
    warningBg: 'rgba(245, 158, 11, 0.12)',
    warningText: '#FBBF24',
    error: '#F43F5E',         // Rose 500
    errorBg: 'rgba(244, 63, 94, 0.12)',
    errorText: '#FB7185',
    info: '#38BDF8',          // Sky 400
    infoBg: 'rgba(56, 189, 248, 0.12)',
    infoText: '#7DD3FC',
  },
  interactive: {
    default: '#1E293B',
    hover: '#334155',
    active: '#475569',
    focus: '#38BDF8',
    disabled: '#0F172A',
  },
  ainubis: {
    observation: '#94A3B8',
    observationBg: 'rgba(148, 163, 184, 0.08)',
    insight: '#38BDF8',
    insightBg: 'rgba(56, 189, 248, 0.10)',
    recommendation: '#6366F1',
    recommendationBg: 'rgba(99, 102, 241, 0.10)',
    alert: '#F59E0B',
    alertBg: 'rgba(245, 158, 11, 0.12)',
    approvalRequired: '#EC4899',
    approvalRequiredBg: 'rgba(236, 72, 153, 0.12)',
  },
} as const;

/**
 * Semantic Tokens for Light Theme
 */
export const lightSemanticColors = {
  brand: {
    primary: '#059669',       // Emerald 600
    primaryHover: '#047857',  // Emerald 700
    primaryActive: '#065F46', // Emerald 800
    secondary: '#0284C7',     // Sky 600
    accent: '#4F46E5',        // Indigo 600
    foreground: '#FFFFFF',
    background: '#F8FAFC',    // Slate 50
  },
  surface: {
    canvas: '#F8FAFC',        // Slate 50
    default: '#FFFFFF',       // Pure white
    raised: '#FFFFFF',
    overlay: '#F1F5F9',       // Slate 100
    sunken: '#E2E8F0',        // Slate 200
    highlight: 'rgba(0, 0, 0, 0.02)',
  },
  text: {
    primary: '#0F172A',       // Slate 900
    secondary: '#334155',     // Slate 700
    muted: '#64748B',         // Slate 500
    disabled: '#94A3B8',      // Slate 400
    inverse: '#F8FAFC',       // Slate 50
  },
  border: {
    default: '#E2E8F0',       // Slate 200
    subtle: 'rgba(0, 0, 0, 0.06)',
    strong: '#CBD5E1',        // Slate 300
    focus: '#0284C7',         // Sky 600
  },
  status: {
    success: '#059669',
    successBg: '#ECFDF5',
    successText: '#065F46',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    warningText: '#92400E',
    error: '#E11D48',
    errorBg: '#FFF1F2',
    errorText: '#9F1239',
    info: '#0284C7',
    infoBg: '#F0F9FF',
    infoText: '#075985',
  },
  interactive: {
    default: '#F1F5F9',
    hover: '#E2E8F0',
    active: '#CBD5E1',
    focus: '#0284C7',
    disabled: '#F8FAFC',
  },
  ainubis: {
    observation: '#64748B',
    observationBg: '#F1F5F9',
    insight: '#0284C7',
    insightBg: '#F0F9FF',
    recommendation: '#4F46E5',
    recommendationBg: '#EEF2FF',
    alert: '#D97706',
    alertBg: '#FFFBEB',
    approvalRequired: '#BE185D',
    approvalRequiredBg: '#FDF2F8',
  },
} as const;

export interface SemanticColors {
  brand: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    accent: string;
    foreground: string;
    background: string;
  };
  surface: {
    canvas: string;
    default: string;
    raised: string;
    overlay: string;
    sunken: string;
    highlight: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    inverse: string;
  };
  border: {
    default: string;
    subtle: string;
    strong: string;
    focus: string;
  };
  status: {
    success: string;
    successBg: string;
    successText: string;
    warning: string;
    warningBg: string;
    warningText: string;
    error: string;
    errorBg: string;
    errorText: string;
    info: string;
    infoBg: string;
    infoText: string;
  };
  interactive: {
    default: string;
    hover: string;
    active: string;
    focus: string;
    disabled: string;
  };
  ainubis: {
    observation: string;
    observationBg: string;
    insight: string;
    insightBg: string;
    recommendation: string;
    recommendationBg: string;
    alert: string;
    alertBg: string;
    approvalRequired: string;
    approvalRequiredBg: string;
  };
}
