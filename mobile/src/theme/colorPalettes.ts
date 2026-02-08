/**
 * Optional theme color palettes.
 * User picks one in Settings → App color. Primary/accent override base tokens.
 */
export type ThemeColorId =
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'teal'
  | 'indigo';

export interface ColorPalette {
  id: ThemeColorId;
  /** For i18n key: settings.colorBlue, etc. */
  labelKey: string;
  /** Chip preview — primary color */
  hex: string;
  light: {
    primary: string;
    primaryDark: string;
    primaryTint: string;
    primary10: string;
    primary20: string;
    accent: string;
    accent10: string;
    accent30: string;
  };
  dark: {
    primary: string;
    primaryDark: string;
    primaryTint: string;
    primary10: string;
    primary20: string;
    accent: string;
    accent10: string;
    accent30: string;
  };
}

export const THEME_COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'blue',
    labelKey: 'settings.colorBlue',
    hex: '#2563EB',
    light: {
      primary: '#2563EB',
      primaryDark: '#1D4ED8',
      primaryTint: '#93C5FD',
      primary10: 'rgba(37,99,235,0.1)',
      primary20: 'rgba(37,99,235,0.2)',
      accent: '#2563EB',
      accent10: 'rgba(37,99,235,0.1)',
      accent30: 'rgba(37,99,235,0.3)',
    },
    dark: {
      primary: '#4B92F7',
      primaryDark: '#3B82F6',
      primaryTint: '#7EB8FA',
      primary10: 'rgba(75,146,247,0.15)',
      primary20: 'rgba(75,146,247,0.25)',
      accent: '#4B92F7',
      accent10: 'rgba(75,146,247,0.15)',
      accent30: 'rgba(75,146,247,0.35)',
    },
  },
  {
    id: 'emerald',
    labelKey: 'settings.colorEmerald',
    hex: '#059669',
    light: {
      primary: '#059669',
      primaryDark: '#047857',
      primaryTint: '#6EE7B7',
      primary10: 'rgba(5,150,105,0.1)',
      primary20: 'rgba(5,150,105,0.2)',
      accent: '#059669',
      accent10: 'rgba(5,150,105,0.1)',
      accent30: 'rgba(5,150,105,0.3)',
    },
    dark: {
      primary: '#1E7F5A',
      primaryDark: '#166B49',
      primaryTint: '#2FA37A',
      primary10: 'rgba(30,127,90,0.15)',
      primary20: 'rgba(30,127,90,0.25)',
      accent: '#2FA37A',
      accent10: 'rgba(47,163,122,0.15)',
      accent30: 'rgba(47,163,122,0.35)',
    },
  },
  {
    id: 'violet',
    labelKey: 'settings.colorViolet',
    hex: '#7C3AED',
    light: {
      primary: '#7C3AED',
      primaryDark: '#6D28D9',
      primaryTint: '#C4B5FD',
      primary10: 'rgba(124,58,237,0.1)',
      primary20: 'rgba(124,58,237,0.2)',
      accent: '#7C3AED',
      accent10: 'rgba(124,58,237,0.1)',
      accent30: 'rgba(124,58,237,0.3)',
    },
    dark: {
      primary: '#9D6DF8',
      primaryDark: '#8B5CF6',
      primaryTint: '#B89BFA',
      primary10: 'rgba(157,109,248,0.15)',
      primary20: 'rgba(157,109,248,0.25)',
      accent: '#9D6DF8',
      accent10: 'rgba(157,109,248,0.15)',
      accent30: 'rgba(157,109,248,0.35)',
    },
  },
  {
    id: 'amber',
    labelKey: 'settings.colorAmber',
    hex: '#D97706',
    light: {
      primary: '#D97706',
      primaryDark: '#B45309',
      primaryTint: '#FCD34D',
      primary10: 'rgba(217,119,6,0.1)',
      primary20: 'rgba(217,119,6,0.2)',
      accent: '#D97706',
      accent10: 'rgba(217,119,6,0.1)',
      accent30: 'rgba(217,119,6,0.3)',
    },
    dark: {
      primary: '#F59E0B',
      primaryDark: '#D97706',
      primaryTint: '#FBBF24',
      primary10: 'rgba(245,158,11,0.15)',
      primary20: 'rgba(245,158,11,0.25)',
      accent: '#F59E0B',
      accent10: 'rgba(245,158,11,0.15)',
      accent30: 'rgba(245,158,11,0.35)',
    },
  },
  {
    id: 'rose',
    labelKey: 'settings.colorRose',
    hex: '#E11D48',
    light: {
      primary: '#E11D48',
      primaryDark: '#BE123C',
      primaryTint: '#FDA4AF',
      primary10: 'rgba(225,29,72,0.1)',
      primary20: 'rgba(225,29,72,0.2)',
      accent: '#E11D48',
      accent10: 'rgba(225,29,72,0.1)',
      accent30: 'rgba(225,29,72,0.3)',
    },
    dark: {
      primary: '#E85A7A',
      primaryDark: '#C94A68',
      primaryTint: '#F58A9E',
      primary10: 'rgba(232,90,122,0.15)',
      primary20: 'rgba(232,90,122,0.25)',
      accent: '#E85A7A',
      accent10: 'rgba(232,90,122,0.15)',
      accent30: 'rgba(232,90,122,0.35)',
    },
  },
  {
    id: 'sky',
    labelKey: 'settings.colorSky',
    hex: '#0EA5E9',
    light: {
      primary: '#0EA5E9',
      primaryDark: '#0284C7',
      primaryTint: '#7DD3FC',
      primary10: 'rgba(14,165,233,0.1)',
      primary20: 'rgba(14,165,233,0.2)',
      accent: '#0EA5E9',
      accent10: 'rgba(14,165,233,0.1)',
      accent30: 'rgba(14,165,233,0.3)',
    },
    dark: {
      primary: '#38BDF8',
      primaryDark: '#0EA5E9',
      primaryTint: '#7DD3FC',
      primary10: 'rgba(56,189,248,0.15)',
      primary20: 'rgba(56,189,248,0.25)',
      accent: '#38BDF8',
      accent10: 'rgba(56,189,248,0.15)',
      accent30: 'rgba(56,189,248,0.35)',
    },
  },
  {
    id: 'teal',
    labelKey: 'settings.colorTeal',
    hex: '#0D9488',
    light: {
      primary: '#0D9488',
      primaryDark: '#0F766E',
      primaryTint: '#5EEAD4',
      primary10: 'rgba(13,148,136,0.1)',
      primary20: 'rgba(13,148,136,0.2)',
      accent: '#0D9488',
      accent10: 'rgba(13,148,136,0.1)',
      accent30: 'rgba(13,148,136,0.3)',
    },
    dark: {
      primary: '#2FA39E',
      primaryDark: '#1E7F7A',
      primaryTint: '#4DD4CF',
      primary10: 'rgba(47,163,158,0.15)',
      primary20: 'rgba(47,163,158,0.25)',
      accent: '#2FA39E',
      accent10: 'rgba(47,163,158,0.15)',
      accent30: 'rgba(47,163,158,0.35)',
    },
  },
  {
    id: 'indigo',
    labelKey: 'settings.colorIndigo',
    hex: '#4F46E5',
    light: {
      primary: '#4F46E5',
      primaryDark: '#4338CA',
      primaryTint: '#A5B4FC',
      primary10: 'rgba(79,70,229,0.1)',
      primary20: 'rgba(79,70,229,0.2)',
      accent: '#4F46E5',
      accent10: 'rgba(79,70,229,0.1)',
      accent30: 'rgba(79,70,229,0.3)',
    },
    dark: {
      primary: '#7B7DF5',
      primaryDark: '#6366F1',
      primaryTint: '#9B9CF9',
      primary10: 'rgba(123,125,245,0.15)',
      primary20: 'rgba(123,125,245,0.25)',
      accent: '#7B7DF5',
      accent10: 'rgba(123,125,245,0.15)',
      accent30: 'rgba(123,125,245,0.35)',
    },
  },
];

export function getPaletteById(id: ThemeColorId): ColorPalette {
  const p = THEME_COLOR_PALETTES.find((x) => x.id === id);
  return p ?? THEME_COLOR_PALETTES[0];
}
