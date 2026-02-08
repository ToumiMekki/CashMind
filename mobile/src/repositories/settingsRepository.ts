import { getDatabase } from '../database';
import type { Language } from '../database/types';
import type { ThemeColorId } from '../theme/colorPalettes';
import { DEFAULT_MIGRATION_WALLET_ID } from '../database/schema';

export type Theme = 'light' | 'dark' | 'system';

const VALID_THEME_COLORS: ThemeColorId[] = [
  'blue', 'emerald', 'violet', 'amber', 'rose', 'sky', 'teal', 'indigo',
];

export type SoundSettings = {
  soundsEnabled: boolean;
  soundVolume: number;
  muteInSilentMode: boolean;
  amountInputSound: boolean;
};

export async function getSettings(): Promise<{
  language: Language;
  hasOnboarded: boolean;
  theme: Theme;
  themeColor: ThemeColorId;
  activeWalletId: string;
  soundSettings: SoundSettings;
}> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT language, hasOnboarded, theme, theme_color AS themeColor, active_wallet_id AS activeWalletId, sounds_enabled AS soundsEnabled, sound_volume AS soundVolume, mute_in_silent_mode AS muteInSilentMode, amount_input_sound AS amountInputSound FROM settings WHERE id = 1'
  );
  if (result.rows.length > 0) {
    const row = result.rows.item(0) as {
      language: string;
      hasOnboarded: number;
      theme: string;
      themeColor: string | null;
      activeWalletId: string | null;
      soundsEnabled?: number | null;
      soundVolume?: number | null;
      muteInSilentMode?: number | null;
      amountInputSound?: number | null;
    };
    const theme: Theme =
      row.theme === 'light' || row.theme === 'dark' || row.theme === 'system'
        ? row.theme
        : 'system';
    const themeColor: ThemeColorId =
      row.themeColor && VALID_THEME_COLORS.includes(row.themeColor as ThemeColorId)
        ? (row.themeColor as ThemeColorId)
        : 'blue';
    const activeWalletId = row.activeWalletId ?? DEFAULT_MIGRATION_WALLET_ID;
    const soundSettings: SoundSettings = {
      soundsEnabled: row.soundsEnabled != null ? row.soundsEnabled === 1 : true,
      soundVolume: typeof row.soundVolume === 'number' ? Math.max(0, Math.min(1, row.soundVolume)) : 0.4,
      muteInSilentMode: row.muteInSilentMode != null ? row.muteInSilentMode === 1 : true,
      amountInputSound: row.amountInputSound === 1,
    };
    return {
      language: row.language as Language,
      hasOnboarded: row.hasOnboarded === 1,
      theme,
      themeColor,
      activeWalletId,
      soundSettings,
    };
  }
  await db.executeSql(
    'INSERT INTO settings (id, language, hasOnboarded, theme) VALUES (1, ?, 0, ?)',
    ['ar', 'system']
  );
  return {
    language: 'ar',
    hasOnboarded: false,
    theme: 'system',
    themeColor: 'blue',
    activeWalletId: DEFAULT_MIGRATION_WALLET_ID,
    soundSettings: {
      soundsEnabled: true,
      soundVolume: 0.4,
      muteInSilentMode: true,
      amountInputSound: false,
    },
  };
}

export async function setSoundSettings(settings: Partial<SoundSettings>): Promise<void> {
  const db = await getDatabase();
  if (settings.soundsEnabled !== undefined) {
    await db.executeSql('UPDATE settings SET sounds_enabled = ? WHERE id = 1', [settings.soundsEnabled ? 1 : 0]);
  }
  if (settings.soundVolume !== undefined) {
    await db.executeSql('UPDATE settings SET sound_volume = ? WHERE id = 1', [Math.max(0, Math.min(1, settings.soundVolume))]);
  }
  if (settings.muteInSilentMode !== undefined) {
    await db.executeSql('UPDATE settings SET mute_in_silent_mode = ? WHERE id = 1', [settings.muteInSilentMode ? 1 : 0]);
  }
  if (settings.amountInputSound !== undefined) {
    await db.executeSql('UPDATE settings SET amount_input_sound = ? WHERE id = 1', [settings.amountInputSound ? 1 : 0]);
  }
}

export async function setActiveWalletId(activeWalletId: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE settings SET active_wallet_id = ? WHERE id = 1', [
    activeWalletId,
  ]);
}

export async function setThemeColor(themeColor: ThemeColorId): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE settings SET theme_color = ? WHERE id = 1', [themeColor]);
}

export async function setLanguage(language: Language): Promise<void> {
  const db = await getDatabase();
  const [r] = await db.executeSql('SELECT 1 FROM settings WHERE id = 1');
  if (r.rows.length === 0) {
    await db.executeSql(
      'INSERT INTO settings (id, language, hasOnboarded, theme) VALUES (1, ?, 0, ?)',
      [language, 'system']
    );
  } else {
    await db.executeSql('UPDATE settings SET language = ? WHERE id = 1', [
      language,
    ]);
  }
}

export async function setTheme(theme: Theme): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE settings SET theme = ? WHERE id = 1', [theme]);
}

export async function setHasOnboarded(hasOnboarded: boolean): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'UPDATE settings SET hasOnboarded = ? WHERE id = 1',
    [hasOnboarded ? 1 : 0]
  );
}
