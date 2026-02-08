/**
 * Image service for transaction payment proofs.
 * Local-only storage, no network. Images copied to app documents.
 */
import RNFS from 'react-native-fs';

const IMAGES_DIR = `${RNFS.DocumentDirectoryPath}/tx_images`;

async function ensureImagesDir(): Promise<string> {
  const exists = await RNFS.exists(IMAGES_DIR);
  if (!exists) {
    await RNFS.mkdir(IMAGES_DIR);
  }
  return IMAGES_DIR;
}

const PICK_OPTIONS = { mediaType: 'photo' as const, quality: 0.8, maxWidth: 1024, maxHeight: 1024 };

async function processAndStoreImage(sourceUri: string): Promise<string | null> {
  if (!sourceUri) return null;
  try {
    const dir = await ensureImagesDir();
    const filename = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`;
    const destPath = `${dir}/${filename}`;
    await RNFS.copyFile(sourceUri, destPath);
    return `file://${destPath}`;
  } catch {
    return sourceUri.startsWith('file://') ? sourceUri : null;
  }
}

/**
 * Pick image from gallery and copy to app storage.
 * Returns local file URI or null if cancelled/error.
 */
export async function pickFromGalleryAndStore(): Promise<string | null> {
  try {
    const { launchImageLibrary } = await import('react-native-image-picker');
    const result = await launchImageLibrary(PICK_OPTIONS);
    if (result.didCancel || result.errorCode || !result.assets?.[0]?.uri) return null;
    return processAndStoreImage(result.assets[0].uri);
  } catch {
    return null;
  }
}

/**
 * Open camera to take photo and store in app.
 * Returns local file URI or null if cancelled/error.
 */
export async function takePhotoAndStore(): Promise<string | null> {
  try {
    const { launchCamera } = await import('react-native-image-picker');
    const result = await launchCamera(PICK_OPTIONS);
    if (result.didCancel || result.errorCode || !result.assets?.[0]?.uri) return null;
    return processAndStoreImage(result.assets[0].uri);
  } catch {
    return null;
  }
}

/** @deprecated Use pickFromGalleryAndStore or takePhotoAndStore. Kept for backward compat. */
export async function pickAndStoreTransactionImage(): Promise<string | null> {
  return pickFromGalleryAndStore();
}

/**
 * Delete image file. Safe to call with null/undefined.
 */
export async function deleteTransactionImage(uri: string | null | undefined): Promise<void> {
  if (!uri || !uri.startsWith('file://')) return;
  try {
    const path = uri.replace('file://', '');
    const exists = await RNFS.exists(path);
    if (exists) {
      await RNFS.unlink(path);
    }
  } catch {
    // Ignore
  }
}
