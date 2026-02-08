import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { parseBusinessPaymentConfirm } from '../utils/businessPaymentPayload';
import type { ThemeTokens } from '../theme/tokens';

const CORNER = 40;

function makeStyles(t: ThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' as const, color: t.textPrimary },
    closeBtn: { padding: 8 },
    permBlock: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 32, gap: 16 },
    permText: { fontSize: 16, color: t.textPrimary, textAlign: 'center' as const },
    permButton: { backgroundColor: t.surface, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    permButtonText: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary },
    cameraWrap: { flex: 1, position: 'relative' as const },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center' as const, alignItems: 'center' as const },
    frame: { position: 'relative' as const },
    corner: { position: 'absolute' as const, width: CORNER, height: CORNER, borderColor: t.textPrimary, borderWidth: 4 },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
    instruction: { fontSize: 16, color: t.textSecondary, textAlign: 'center' as const, paddingHorizontal: 24, paddingVertical: 16 },
    errorBox: { marginHorizontal: 24, marginBottom: 24, padding: 12, backgroundColor: t.dangerLight, borderRadius: 12, borderWidth: 1, borderColor: t.danger },
    errorText: { fontSize: 14, color: t.danger, textAlign: 'center' as const },
    successRoot: { flex: 1 },
    successCenter: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.white, justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 24 },
    successText: { fontSize: 22, fontWeight: '700' as const, color: t.white },
  });
}

export function BusinessScanConfirmScreen() {
  const tokens = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const setOverlay = useAppStore((s) => s.setOverlay);
  const completeBusinessPaymentAsMerchant = useAppStore((s) => s.completeBusinessPaymentAsMerchant);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef(0);
  const THROTTLE_MS = 800;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const onCodeScanned = useCallback(
    async (raw: string) => {
      if (success) return;
      const now = Date.now();
      if (now - lastScanRef.current < THROTTLE_MS) return;
      lastScanRef.current = now;
      setError(null);
      const result = parseBusinessPaymentConfirm(raw);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const out = await completeBusinessPaymentAsMerchant(result.payload);
      if (out.success === false) {
        setError(out.error ?? i18n.t('businessScan.duplicate'));
        return;
      }
      setSuccess(true);
      setTimeout(() => setOverlay(null), 1200);
    },
    [success, completeBusinessPaymentAsMerchant, setOverlay]
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const qr = codes[0];
      if (qr?.value) onCodeScanned(qr.value);
    },
  });

  if (success) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top, backgroundColor: tokens.primary }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.successCenter}>
          <View style={styles.successIcon}>
            <Check size={48} color={tokens.primary} />
          </View>
          <Text style={styles.successText}>{i18n.t('businessScan.success')}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('businessScan.title')}</Text>
        <Pressable style={styles.closeBtn} onPress={() => setOverlay(null)} hitSlop={12}>
          <X size={24} color={tokens.textPrimary} />
        </Pressable>
      </View>

      {!hasPermission ? (
        <View style={styles.permBlock}>
          <Text style={styles.permText}>Camera access is needed to scan confirmation QR.</Text>
          <Pressable style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Grant access</Text>
          </Pressable>
        </View>
      ) : !device ? (
        <View style={styles.permBlock}>
          <Text style={styles.permText}>No camera device found.</Text>
        </View>
      ) : (
        <>
          <View style={styles.cameraWrap}>
            <VisionCamera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              codeScanner={codeScanner}
            />
            <View style={styles.overlay}>
              <View style={[styles.frame, { width: Math.min(width - 48, 240), height: Math.min(width - 48, 240) }]}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
            </View>
          </View>
          <Text style={styles.instruction}>Point at customer's payment confirmation QR</Text>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

