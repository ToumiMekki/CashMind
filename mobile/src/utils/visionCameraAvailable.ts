import { NativeModules } from 'react-native';

/**
 * Vision Camera native module is available only after linking and rebuild.
 * Use this before importing or using react-native-vision-camera.
 */
export function isVisionCameraAvailable(): boolean {
  return !!NativeModules?.CameraView;
}
