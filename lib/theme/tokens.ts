/**
 * Anchor design tokens.
 *
 * Per the design language spec: minimal, premium, calm, human. Generous
 * whitespace, restrained color, soft shadows, excellent dark mode. The
 * brand accent is a grounded, muted green — stability without going
 * literally nautical.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentMuted: string;
  danger: string;
  success: string;
}

export const lightColors: ThemeColors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E7E5E0',
  textPrimary: '#1C1C1A',
  textSecondary: '#6B6B66',
  textTertiary: '#9A9A94',
  accent: '#2F6F5E',
  accentMuted: '#E4EEEA',
  danger: '#C1473C',
  success: '#3D8361',
};

export const darkColors: ThemeColors = {
  background: '#111110',
  surface: '#1B1B19',
  surfaceElevated: '#222220',
  border: '#2E2E2B',
  textPrimary: '#F2F2EF',
  textSecondary: '#B4B4AE',
  textTertiary: '#7C7C76',
  accent: '#5FA98D',
  accentMuted: '#1E2C27',
  danger: '#E17568',
  success: '#6BBF94',
};

export const typography = {
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  headline: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
} as const;
