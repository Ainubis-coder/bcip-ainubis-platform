/**
 * BCIP Enterprise Design System — Themes
 */

import { darkSemanticColors, lightSemanticColors, SemanticColors } from '../tokens/colors';
import { typographyScale } from '../tokens/typography';
import { spacingScale, sizingTokens } from '../tokens/spacing';
import { radiusTokens, borderTokens } from '../tokens/borders';
import { elevationTokens } from '../tokens/shadows';
import { motionDurations, motionEasings } from '../tokens/motion';
import { zIndexTokens, breakpoints } from '../tokens/zIndex';

export interface Theme {
  name: 'dark' | 'light';
  colors: SemanticColors;
  typography: typeof typographyScale;
  spacing: typeof spacingScale;
  sizing: typeof sizingTokens;
  radii: typeof radiusTokens;
  borders: typeof borderTokens;
  elevation: typeof elevationTokens;
  motion: {
    duration: typeof motionDurations;
    easing: typeof motionEasings;
  };
  zIndex: typeof zIndexTokens;
  breakpoints: typeof breakpoints;
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: darkSemanticColors,
  typography: typographyScale,
  spacing: spacingScale,
  sizing: sizingTokens,
  radii: radiusTokens,
  borders: borderTokens,
  elevation: elevationTokens,
  motion: {
    duration: motionDurations,
    easing: motionEasings,
  },
  zIndex: zIndexTokens,
  breakpoints,
};

export const lightTheme: Theme = {
  name: 'light',
  colors: lightSemanticColors,
  typography: typographyScale,
  spacing: spacingScale,
  sizing: sizingTokens,
  radii: radiusTokens,
  borders: borderTokens,
  elevation: elevationTokens,
  motion: {
    duration: motionDurations,
    easing: motionEasings,
  },
  zIndex: zIndexTokens,
  breakpoints,
};

export type ThemeName = 'dark' | 'light';
