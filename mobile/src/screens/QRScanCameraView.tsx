import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { X, QrCode } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import { parsePayload } from '../utils/qrTransferPayload';
import type { WalletTransferPayload } from '../database/types';

const CORNER = 40;

interface QRScanCameraViewProps {
  scannedPayload?: WalletTransferPayload | null;
  onPayload?: (p: WalletTransferPayload) => void;
  onScanError?: (msg: string) => void;
  /** When set, forward raw QR string; parent parses. Mutually exclusive with onPayload. */
  onRawCode?: (raw: string) => void;
  /** When using onRawCode, set true to pause scanner after parent has a result. */
  pauseScanning?: boolean;
}

export function QRScanCameraView({
  scannedPayload = null,
  onPayload,
  onScanError,
  onRawCode,
  pauseScanning = false,
}: QRScanCameraViewProps) {
  const tokens = useTheme();
  const st = useMemo(
    () =>
      StyleSheet.create({
        permBlock: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 16 },
        permText: { fontSize: 16, color: tokens.textPrimary, textAlign: 'center' },
        permButton: { backgroundColor: tokens.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.md },
        permButtonText: { fontSize: 16, fontWeight: '600', color: tokens.white },
        corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: tokens.accent, borderWidth: 4 },
        scannedBadge: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -28,
          marginLeft: -28,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: tokens.accent,
          justifyContent: 'center',
          alignItems: 'center',
        },
        instruction: { fontSize: 16, color: tokens.white, textAlign: 'center', paddingHorizontal: 24, paddingVertical: 16 },
      }),
    [tokens]
  );
  const { width } = useWindowDimensions();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const lastScanRef = useRef(0);
  const THROTTLE_MS = 600;

  const onCodeScanned = useCallback(
    (raw: string) => {
      if (onRawCode) {
        if (pauseScanning) return;
        const now = Date.now();
        if (now - lastScanRef.current < THROTTLE_MS) return;
        lastScanRef.current = now;
        onRawCode(raw);
        return;
      }
      if (scannedPayload || pauseScanning) return;
      const now = Date.now();
      if (now - lastScanRef.current < THROTTLE_MS) return;
      lastScanRef.current = now;
      const result = parsePayload(raw);
      if (!result.ok) {
        onScanError?.(result.error);
        return;
      }
      onScanError?.('');
      onPayload?.(result.payload);
    },
    [scannedPayload, onPayload, onScanError, onRawCode, pauseScanning]
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const qr = codes[0];
      if (qr?.value) onCodeScanned(qr.value);
    },
  });

  if (!hasPermission) {
    return (
      <View style={st.permBlock}>
        <Text style={st.permText}>Camera access is needed to scan QR codes.</Text>
        <PressableScale style={st.permButton} onPress={requestPermission}>
          <Text style={st.permButtonText}>Grant access</Text>
        </PressableScale>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={st.permBlock}>
        <Text style={st.permText}>No camera device found.</Text>
      </View>
    );
  }

  const frameSize = Math.min(width - 48, 280);

  return (
    <>
      <View style={styles.cameraWrap}>
        <VisionCamera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!pauseScanning && (!onRawCode ? !scannedPayload : true)}
          codeScanner={pauseScanning ? undefined : codeScanner}
        />
        <View style={styles.overlay}>
          <View style={[styles.frame, { width: frameSize, height: frameSize }]}>
            <View style={[st.corner, styles.cornerTL]} />
            <View style={[st.corner, styles.cornerTR]} />
            <View style={[st.corner, styles.cornerBL]} />
            <View style={[st.corner, styles.cornerBR]} />
            {scannedPayload ? (
              <Animated.View entering={FadeIn.duration(200)} style={st.scannedBadge}>
                <QrCode size={32} color={tokens.white} />
              </Animated.View>
            ) : null}
          </View>
        </View>
      </View>
      <Text style={st.instruction}>
        {scannedPayload ? i18n.t('qrScan.scanned') : i18n.t('qrScan.scanning')}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    position: 'relative',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: radius.md,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: radius.md,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: radius.md,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: radius.md,
  },
});
