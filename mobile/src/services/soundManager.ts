/**
 * CashMind Sound Manager — subtle, premium, non-annoying sound effects.
 * Uses expo-av (compatible with RN 0.74). Philosophy: short (50–300ms), low volume, financial tone.
 */
import { Platform, Vibration } from 'react-native';

export type SoundEvent =
  | 'transaction_validate_success'
  | 'transaction_error'
  | 'amount_input'
  | 'category_selected'
  | 'qr_scan_success'
  | 'photo_attached'
  | 'analytics_loaded';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0–1
  muteInSilentMode: boolean;
  amountInputEnabled?: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.4,
  muteInSilentMode: true,
  amountInputEnabled: false,
};

// Static requires for Metro bundler (expo-av loads from require)
const SOUND_SOURCES: Record<SoundEvent, number> = {
  transaction_validate_success: require('../assets/sounds/transaction_success.wav'),
  transaction_error: require('../assets/sounds/transaction_error.wav'),
  amount_input: require('../assets/sounds/amount_tap.wav'),
  category_selected: require('../assets/sounds/category_selected.wav'),
  qr_scan_success: require('../assets/sounds/qr_scan_success.wav'),
  photo_attached: require('../assets/sounds/photo_attached.wav'),
  analytics_loaded: require('../assets/sounds/analytics_loaded.wav'),
};

const HAPTIC_EVENTS: Partial<Record<SoundEvent, 'light' | 'warning'>> = {
  transaction_validate_success: 'light',
  transaction_error: 'warning',
  category_selected: 'light',
  qr_scan_success: 'light',
};

type ExpoSound = { setVolumeAsync: (v: number) => Promise<void>; replayAsync: () => Promise<void> };
let loadedSounds: Partial<Record<SoundEvent, ExpoSound>> = {};
let settings: SoundSettings = { ...DEFAULT_SETTINGS };
let configured = false;
let soundAvailable = false;

function triggerHaptic(event: SoundEvent): void {
  const type = HAPTIC_EVENTS[event];
  if (!type) return;
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(type === 'warning' ? 20 : 10);
    }
  } catch {
    // Ignore
  }
}

function shouldPlay(event: SoundEvent): boolean {
  if (!settings.enabled) return false;
  if (event === 'amount_input' && settings.amountInputEnabled === false) return false;
  return true;
}

export function configureSoundManager(next: SoundSettings): void {
  settings = { ...DEFAULT_SETTINGS, ...next };
}

/**
 * Preload all sounds (call once at app start). Uses expo-av; no-ops if not installed.
 */
export async function preloadSounds(): Promise<void> {
  if (configured) return;
  configured = true;
  let Audio: typeof import('expo-av').Audio;
  try {
    Audio = require('expo-av').Audio;
  } catch {
    return;
  }
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    return;
  }
  soundAvailable = true;
  const events = Object.keys(SOUND_SOURCES) as SoundEvent[];
  for (const event of events) {
    try {
      const source = SOUND_SOURCES[event];
      const { sound } = await Audio.Sound.createAsync(source);
      loadedSounds[event] = sound;
    } catch {
      // ignore per-event load failure
    }
  }
}

/**
 * Play a sound event. Non-blocking; does nothing if disabled or load failed.
 */
export function playSound(event: SoundEvent): void {
  if (!soundAvailable || !shouldPlay(event)) return;
  const s = loadedSounds[event];
  if (!s) return;
  (async () => {
    try {
      await s.setVolumeAsync(settings.volume);
      await s.replayAsync();
      triggerHaptic(event);
    } catch {
      // Ignore
    }
  })();
}

export function getSoundSettings(): SoundSettings {
  return { ...settings };
}
