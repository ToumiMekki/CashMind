import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, QrCode } from 'lucide-react-native';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import { buildPayload } from '../utils/qrTransferPayload';
import type { WalletTransferPayload } from '../database/types';

const SAMPLE_AMOUNT = 500;
const SAMPLE_SENDER = 'Test Sender';

interface QRScanFallbackViewProps {
  currency: string;
  onPayload: (p: WalletTransferPayload) => void;
}

export function QRScanFallbackView({ currency, onPayload }: QRScanFallbackViewProps) {
  const tokens = useTheme();

  const handleSimulate = () => {
    const txId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const payload = buildPayload({
      txId,
      senderName: SAMPLE_SENDER,
      senderId: 'dev_fallback',
      amount: SAMPLE_AMOUNT,
      currency,
      note: 'Simulated scan',
    });
    onPayload(payload);
  };

  return (
    <View style={styles.block}>
      <Camera size={48} color={tokens.textMuted} />
      <Text style={[styles.title, { color: tokens.white }]}>{i18n.t('qrScan.cameraUnavailable')}</Text>
      <PressableScale style={StyleSheet.flatten([styles.btn, { backgroundColor: tokens.accent }]) as import('react-native').ViewStyle} onPress={handleSimulate}>
        <QrCode size={20} color={tokens.primary} />
        <Text style={[styles.btnText, { color: tokens.primary }]}>{i18n.t('qrScan.simulateScan')}</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  title: { fontSize: 16, textAlign: 'center' as const },
  btn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  btnText: { fontSize: 16, fontWeight: '600' as const },
});
