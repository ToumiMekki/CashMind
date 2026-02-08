import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '../stores/useAppStore';
import {
  lightTokens,
  darkTokens,
  type ThemeTokens,
} from '../theme/tokens';
import { getPaletteById } from '../theme/colorPalettes';

/**
 * Returns current theme tokens based on store theme + system preference + app color.
 * Use everywhere instead of static colors.
 */
export function useTheme(): ThemeTokens {
  const theme = useAppStore((s) => s.theme);
  const themeColor = useAppStore((s) => s.themeColor);
  const system = useColorScheme();
  return useMemo(() => {
    const effective: 'light' | 'dark' =
      theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : theme;
    const base = effective === 'dark' ? darkTokens : lightTokens;
    const palette = getPaletteById(themeColor);
    const variant = effective === 'dark' ? palette.dark : palette.light;
    return { ...base, ...variant } as ThemeTokens;
  }, [theme, themeColor, system]);
}

export function useIsDark(): boolean {
  const theme = useAppStore((s) => s.theme);
  const system = useColorScheme();
  const effective: 'light' | 'dark' =
    theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : theme;
  return effective === 'dark';
}
