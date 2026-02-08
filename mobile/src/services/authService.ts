/**
 * Biometric & PIN authentication service.
 * - Never stores biometric data (Face ID / Fingerprint stay on device)
 * - Uses Keychain/Keystore for secure storage when available
 * - PIN is stored as SHA-256 hash only
 * - SQLite fallback when Keychain fails (some Android devices/emulators)
 */

import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { sha256 } from 'js-sha256';
import { getDatabase } from '../database';

const AUTH_PREFS_PIN_HASH = 'pin_hash';
const AUTH_PREFS_STORAGE = 'auth_storage';
const AUTH_PREFS_BIO_ENABLED = 'bio_enabled';

/** Android: use software-backed storage to avoid "keystore operation failed" on emulators/some devices */
function getPinStorageOptions() {
  const opts: Parameters<typeof Keychain.setGenericPassword>[2] = {
    service: SERVICE_PIN,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  };
  if (Platform.OS === 'android') {
    const sl = Keychain.SECURITY_LEVEL?.SECURE_SOFTWARE ?? Keychain.SECURITY_LEVEL?.ANY;
    if (sl != null) (opts as Record<string, unknown>).securityLevel = sl;
  }
  return opts;
}

async function getPinHashFromDb(): Promise<string | null> {
  try {
    const db = await getDatabase();
    const [r] = await db.executeSql('SELECT value FROM auth_prefs WHERE key = ?', [AUTH_PREFS_PIN_HASH]);
    if (r.rows.length > 0) return (r.rows.item(0) as { value: string }).value;
  } catch {
    /* ignore */
  }
  return null;
}

async function setPinHashInDb(hash: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'INSERT OR REPLACE INTO auth_prefs (key, value) VALUES (?, ?)',
    [AUTH_PREFS_PIN_HASH, hash]
  );
  await db.executeSql(
    'INSERT OR REPLACE INTO auth_prefs (key, value) VALUES (?, ?)',
    [AUTH_PREFS_STORAGE, 'sqlite']
  );
}

async function clearPinFromDb(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.executeSql('DELETE FROM auth_prefs WHERE key IN (?, ?)', [
      AUTH_PREFS_PIN_HASH,
      AUTH_PREFS_STORAGE,
    ]);
  } catch {
    /* ignore */
  }
}

async function getBioEnabledFromDb(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const [r] = await db.executeSql('SELECT value FROM auth_prefs WHERE key = ?', [
      AUTH_PREFS_BIO_ENABLED,
    ]);
    if (r.rows.length > 0) return (r.rows.item(0) as { value: string }).value === 'true';
  } catch {
    /* ignore */
  }
  return false;
}

async function setBioEnabledInDb(enabled: boolean): Promise<void> {
  const db = await getDatabase();
  if (enabled) {
    await db.executeSql(
      'INSERT OR REPLACE INTO auth_prefs (key, value) VALUES (?, ?)',
      [AUTH_PREFS_BIO_ENABLED, 'true']
    );
  } else {
    await db.executeSql('DELETE FROM auth_prefs WHERE key = ?', [AUTH_PREFS_BIO_ENABLED]);
  }
}

const SERVICE_PIN = 'com.cashmind.auth.pin';
const SERVICE_BIO_FLAG = 'com.cashmind.auth.bio.flag';
const SERVICE_BIO_SECRET = 'com.cashmind.auth.bio.secret';
const PIN_HASH_KEY = 'pin_hash';
const BIOMETRIC_ENABLED_KEY = 'bio_on';
const BIOMETRIC_UNLOCK_KEY = 'bio_unlock';
const PIN_LENGTH = 6;

/** Salt for PIN hashing - app-specific, never change */
const PIN_SALT = 'CashMind_PIN_v1';

function hashPin(pin: string): string {
  return sha256(PIN_SALT + pin);
}

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | null;

export interface AuthState {
  hasPin: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometricType: BiometricType;
}

/**
 * Check if device supports biometric auth and which type.
 */
export async function getBiometricInfo(): Promise<{
  available: boolean;
  type: BiometricType;
}> {
  try {
    const biometryType = await Keychain.getSupportedBiometryType();
    if (biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      return { available: true, type: 'FaceID' };
    }
    if (biometryType === Keychain.BIOMETRY_TYPE.FACE) {
      return { available: true, type: 'Biometrics' };
    }
    if (
      biometryType === Keychain.BIOMETRY_TYPE.TOUCH_ID ||
      biometryType === Keychain.BIOMETRY_TYPE.FINGERPRINT
    ) {
      return { available: true, type: 'TouchID' };
    }
    return { available: false, type: null };
  } catch {
    return { available: false, type: null };
  }
}

/**
 * Check if user has set a PIN and optionally biometric.
 */
export async function getAuthState(): Promise<AuthState> {
  const { available, type } = await getBiometricInfo();
  try {
    let hasPin = false;
    try {
      const pinResult = await Keychain.getGenericPassword({
        service: SERVICE_PIN,
      });
      hasPin = !!(pinResult && pinResult.username === PIN_HASH_KEY);
    } catch {
      /* Keychain failed */
    }
    if (!hasPin) {
      hasPin = !!(await getPinHashFromDb());
    }
    let biometricEnabled = false;
    try {
      const bioEnabled = await Keychain.getGenericPassword({
        service: SERVICE_BIO_FLAG,
      });
      biometricEnabled = !!(bioEnabled && bioEnabled.password === 'true');
    } catch {
      biometricEnabled = await getBioEnabledFromDb();
    }

    return {
      hasPin,
      biometricEnabled,
      biometricAvailable: available,
      biometricType: type,
    };
  } catch {
    return {
      hasPin: false,
      biometricEnabled: false,
      biometricAvailable: available,
      biometricType: type,
    };
  }
}

/**
 * Set PIN (create or change). Requires current PIN if changing.
 */
export async function setPin(
  newPin: string,
  currentPin?: string
): Promise<{ success: boolean; error?: string }> {
  const p = newPin.replace(/\D/g, '');
  if (p.length < 4 || p.length > 8) {
    return { success: false, error: 'PIN must be 4–8 digits' };
  }

  const state = await getAuthState();
  if (state.hasPin && currentPin !== undefined) {
    const ok = await verifyPin(currentPin);
    if (!ok) return { success: false, error: 'Current PIN incorrect' };
  } else if (state.hasPin) {
    return { success: false, error: 'Current PIN required' };
  }

  const hash = hashPin(p);
  try {
    await Keychain.setGenericPassword(PIN_HASH_KEY, hash, getPinStorageOptions());
    await clearPinFromDb();
    return { success: true };
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    if (/keystore|keychain|operation failed/i.test(msg)) {
      try {
        await setPinHashInDb(hash);
        return { success: true };
      } catch {
        return { success: false, error: 'STORAGE_ERROR' };
      }
    }
    return { success: false, error: msg };
  }
}

/**
 * Verify PIN against stored hash.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const inputHash = hashPin(pin.replace(/\D/g, ''));
  try {
    const result = await Keychain.getGenericPassword({ service: SERVICE_PIN });
    if (result && result.username === PIN_HASH_KEY) {
      return inputHash === result.password;
    }
  } catch {
    /* Keychain failed, try SQLite fallback */
  }
  const dbHash = await getPinHashFromDb();
  return dbHash !== null && inputHash === dbHash;
}

function isStorageError(msg: string): boolean {
  return /keystore|keychain|operation failed|storage|Could not encrypt|UserNotAuthenticated/i.test(msg);
}

/**
 * Enable biometric unlock. User must authenticate with PIN first to confirm.
 * Then stores a secret protected by biometric; system will prompt for Face ID/Fingerprint.
 * Tries multiple Keychain options for better device compatibility.
 */
export async function enableBiometric(verifiedPin: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const ok = await verifyPin(verifiedPin);
  if (!ok) return { success: false, error: 'PIN incorrect' };

  const { available } = await getBiometricInfo();
  if (!available) return { success: false, error: 'Biometric not available' };

  const secret = `unlock_${Date.now()}`;
  const attempts: Parameters<typeof Keychain.setGenericPassword>[2][] = [
    {
      service: SERVICE_BIO_SECRET,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: {
        title: 'Secure with biometric',
        subtitle: 'Use Face ID or Fingerprint to unlock the app',
        cancel: 'Cancel',
      },
    },
    {
      service: SERVICE_BIO_SECRET,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    },
    {
      service: SERVICE_BIO_SECRET,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    },
  ];

  if (Platform.OS === 'android') {
    const sl = Keychain.SECURITY_LEVEL?.SECURE_SOFTWARE ?? Keychain.SECURITY_LEVEL?.ANY;
    attempts.forEach((opts) => {
      if (sl != null) (opts as Record<string, unknown>).securityLevel = sl;
    });
    const lastOpts: Record<string, unknown> = {
      service: SERVICE_BIO_SECRET,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    };
    if (Keychain.SECURITY_LEVEL?.ANY != null) lastOpts.securityLevel = Keychain.SECURITY_LEVEL.ANY;
    if (Keychain.STORAGE_TYPE?.AES_GCM != null) lastOpts.storage = Keychain.STORAGE_TYPE.AES_GCM;
    attempts.push(lastOpts as Parameters<typeof Keychain.setGenericPassword>[2]);
  }

  let lastError: string | undefined;
  for (const setOptions of attempts) {
    try {
      await Keychain.setGenericPassword(BIOMETRIC_UNLOCK_KEY, secret, setOptions);
      try {
        await Keychain.setGenericPassword(BIOMETRIC_ENABLED_KEY, 'true', {
          service: SERVICE_BIO_FLAG,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        });
      } catch {
        await setBioEnabledInDb(true);
      }
      return { success: true };
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      if (/user cancel|cancelled|canceled|code -128/i.test(msg)) {
        return { success: false, error: 'USER_CANCELLED' };
      }
      lastError = msg;
      if (!isStorageError(msg)) break;
    }
  }

  return {
    success: false,
    error: isStorageError(lastError ?? '') ? 'STORAGE_ERROR' : (lastError ?? 'Unknown error'),
  };
}

/**
 * Disable biometric unlock.
 */
export async function disableBiometric(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_BIO_SECRET });
  } catch {
    /* ignore */
  }
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_BIO_FLAG });
  } catch {
    /* ignore */
  }
  await setBioEnabledInDb(false);
}

/**
 * Authenticate with biometric. Returns true if success.
 * User cancellation returns false (no error thrown).
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  const state = await getAuthState();
  if (!state.biometricEnabled || !state.biometricAvailable) return false;

  const getOptions: Parameters<typeof Keychain.getGenericPassword>[0] = {
    service: SERVICE_BIO_SECRET,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    authenticationPrompt: {
      title: 'Unlock CashMind',
      subtitle: 'Use Face ID or Fingerprint',
      cancel: 'Use PIN',
    },
  };

  try {
    const result = await Keychain.getGenericPassword(getOptions);
    return !!(result && result.username === BIOMETRIC_UNLOCK_KEY);
  } catch {
    return false;
  }
}

/**
 * Remove PIN and all auth data. For testing or user-initiated reset.
 */
export async function clearAuth(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_PIN });
  } catch {
    /* ignore */
  }
  await clearPinFromDb();
  await setBioEnabledInDb(false);
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_BIO_FLAG });
  } catch {
    /* ignore */
  }
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_BIO_SECRET });
  } catch {
    /* ignore */
  }
}

export const AUTH = {
  PIN_LENGTH,
  MAX_FAILURES: 3,
  LOCKOUT_SECONDS: 30,
} as const;
