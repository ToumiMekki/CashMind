/**
 * Theme tokens for light and dark mode.
 * Dark mode: Calm, private, focused — "a closed room where money thoughts are safe"
 * No hardcoded colors in components — use these via useTheme().
 */
export const lightTokens = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F6F3',
  card: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#111111',
  textPrimary: '#111111',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryTint: '#93C5FD',
  primary10: 'rgba(37,99,235,0.1)',
  primary20: 'rgba(37,99,235,0.2)',
  secondary: '#64748B',
  accent: '#D4AF37',
  accent10: 'rgba(212,175,55,0.1)',
  accent30: 'rgba(212,175,55,0.3)',
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  dark: '#0F172A',
  white10: 'rgba(255,255,255,0.1)',
  white20: 'rgba(255,255,255,0.2)',
} as const;

/** High-end dark mode: Deep, calm, premium. No pure black, focus on depth. */
export const darkTokens = {
  background: '#0E1114',
  backgroundSecondary: '#151A1E',
  card: '#1C2227',
  surface: '#1C2227',
  surfaceElevated: '#232A30',
  text: '#E6EAF0',
  textPrimary: '#E6EAF0',
  textSecondary: '#B3BAC3',
  textMuted: '#7A838E',
  primary: '#1E7F5A',
  primaryDark: '#166B49',
  primaryTint: '#2FA37A',
  primary10: 'rgba(30,127,90,0.15)',
  primary20: 'rgba(30,127,90,0.25)',
  secondary: '#B3BAC3',
  accent: '#2FA37A',
  accent10: 'rgba(47,163,122,0.15)',
  accent30: 'rgba(47,163,122,0.35)',
  border: '#2E363D',
  borderLight: '#232A30',
  success: '#2FA37A',
  successLight: 'rgba(47,163,122,0.2)',
  danger: '#C75C5C',
  dangerLight: 'rgba(138,58,58,0.3)',
  warning: '#B8904A',
  warningLight: 'rgba(138,106,47,0.25)',
  white: '#E6EAF0',
  black: '#0E1114',
  overlay: 'rgba(0,0,0,0.7)',
  dark: '#0E1114',
  white10: 'rgba(230,234,240,0.1)',
  white20: 'rgba(230,234,240,0.2)',
} as const;

/** Analytics chart states for dark mode — soft gradients, low saturation */
export const darkAnalyticsStates = {
  calm: '#2C4A3E',
  stable: '#2F4B42',
  tight: '#4A3E2C',
  risky: '#4A2C2C',
} as const;

export type ThemeTokens = typeof lightTokens | typeof darkTokens;
