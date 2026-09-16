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
  // Matches iOS's actual nav-bar large-title metrics (34/41, bold) — used
  // for each tab's own page header so it reads as a native large title
  // rather than a smaller, Material-style app-bar heading.
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  headline: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
} as const;

export interface ShadowStyle {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export interface ShadowTokens {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
}

// "Soft elevated": depth comes from layered shadow, not hard borders. Light
// mode shadows read clearly against the warm off-white background; dark
// mode shadows barely register against a dark background, so depth there
// leans more on `surfaceElevated` being visibly lighter than `surface` —
// these dark shadow values are kept subtle rather than dropped entirely,
// mainly for Android's shadow-driven elevation tinting.
export const lightShadow: ShadowTokens = {
  sm: { shadowColor: '#1C1C1A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#1C1C1A', shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  lg: { shadowColor: '#1C1C1A', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
};

export const darkShadow: ShadowTokens = {
  sm: { shadowColor: '#000000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  lg: { shadowColor: '#000000', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
};
