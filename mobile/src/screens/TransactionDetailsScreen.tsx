import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import {
  X,
  Send,
  Download,
  Copy,
  Check,
  FileText,
  Users,
  List,
  AlertCircle,
  Lock,
  Unlock,
  CreditCard,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import {
  formatDateLong,
  formatTimeWithSeconds,
} from '../utils/format';
import type { Transaction } from '../database/types';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { PressableScale } from '../components/ui/PressableScale';
import { TransactionImageViewerModal } from '../components/TransactionImageViewerModal';
import { getCategoryById } from '../repositories/categoriesRepository';
import type { ThemeTokens } from '../theme/tokens';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT_RATIO = 0.7;
const MIN_SHEET_HEIGHT = 400;

interface TransactionDetailsScreenProps {
  transaction: Transaction | null;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
  mono,
  styles,
}: {
  label: string;
  value: string;
  mono?: boolean;
  styles: Record<string, import('react-native').ViewStyle | import('react-native').TextStyle | import('react-native').ImageStyle>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailValueMono]} selectable={mono}>
        {value || '—'}
      </Text>
    </View>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  styles,
  tokens,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  styles: Record<string, import('react-native').ViewStyle | import('react-native').TextStyle | import('react-native').ImageStyle>;
  tokens: ThemeTokens;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon size={18} color={tokens.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function createTxDetailsStyles(t: ThemeTokens) {
  return {
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: t.overlay,
      justifyContent: 'flex-end' as const,
      alignItems: 'center' as const,
      zIndex: 100,
    },
    sheet: {
      width: '100%' as const,
      maxWidth: 430,
      zIndex: 101,
      backgroundColor: t.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      overflow: 'hidden' as const,
    },
    sheetError: { justifyContent: 'flex-start' as const },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.surface,
    },
    headerTitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary },
    closeButton: { padding: 8 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 32 },
    summaryCard: {
      borderRadius: radius.lg,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center' as const,
    },
    summaryCardSend: { backgroundColor: t.danger },
    summaryCardReceive: { backgroundColor: t.success },
    summaryIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.white20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    summaryAmount: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: t.white,
      fontVariant: ['tabular-nums'],
      marginBottom: 4,
    },
    summaryType: { fontSize: 14, color: t.white20, marginBottom: 10 },
    statusBadge: { backgroundColor: t.white20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusBadgeText: { fontSize: 12, fontWeight: '600' as const, color: t.white },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: t.textPrimary },
    detailRow: { backgroundColor: t.borderLight, borderRadius: radius.md, padding: 14, marginBottom: 10 },
    detailLabel: { fontSize: 12, color: t.textSecondary, marginBottom: 4 },
    detailValue: { fontSize: 15, fontWeight: '500' as const, color: t.textPrimary },
    detailValueMono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
    idRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 6 },
    idValue: {
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: t.textSecondary,
      backgroundColor: t.borderLight,
      borderRadius: radius.md,
      padding: 12,
    },
    copyButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: t.surface, borderRadius: 8 },
    copyButtonInner: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
    copyButtonText: { fontSize: 12, fontWeight: '500' as const, color: t.primary },
    balanceCard: {
      backgroundColor: t.primary10,
      borderWidth: 1,
      borderColor: t.primary20,
      borderRadius: radius.md,
      padding: 16,
      marginBottom: 24,
    },
    balanceRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    balanceLabel: { fontSize: 14, color: t.textSecondary },
    balanceValue: { fontSize: 16, fontWeight: '700' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] },
    balanceDivider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
    balanceValueAfter: { fontSize: 18, fontWeight: '700' as const, fontVariant: ['tabular-nums'] },
    balanceValueSend: { color: t.danger },
    balanceValueReceive: { color: t.success },
    closeFullButton: { backgroundColor: t.primary, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' as const },
    closeFullButtonText: { fontSize: 18, fontWeight: '700' as const, color: t.white },
    errorContent: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: 'center' as const },
    errorIcon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: t.dangerLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 20,
    },
    errorTitle: { fontSize: 18, fontWeight: '700' as const, color: t.textPrimary, marginBottom: 8, textAlign: 'center' as const },
    errorDesc: { fontSize: 14, color: t.textSecondary, textAlign: 'center' as const, marginBottom: 32 },
    paymentProofImage: {
      borderRadius: radius.md,
      overflow: 'hidden' as const,
      aspectRatio: 1.5,
      maxHeight: 220,
    },
    paymentProofImageInner: {
      width: '100%',
      height: '100%',
      borderRadius: radius.md,
    },
    removeImageBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      marginTop: 12,
    },
    removeImageText: { fontSize: 14, fontWeight: '600' as const },
  };
}

export function TransactionDetailsScreen({
  transaction,
  onClose,
}: TransactionDetailsScreenProps) {
  const tokens = useTheme();
  const styles = useMemo(
    () => StyleSheet.create(createTxDetailsStyles(tokens) as Record<string, object>),
    [tokens]
  );
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const [copied, setCopied] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const removeTransactionImage = useAppStore((s) => s.removeTransactionImage);

  useEffect(() => {
    if (!transaction?.categoryId) {
      setCategoryName(null);
      return;
    }
    let cancelled = false;
    getCategoryById(transaction.categoryId).then((cat) => {
      if (!cancelled && cat) setCategoryName(cat.name);
      else if (!cancelled) setCategoryName(null);
    });
    return () => { cancelled = true; };
  }, [transaction?.categoryId]);
  const wallets = useAppStore((s) => s.wallets);
  const { mask } = useBalancePrivacy();

  const walletForTx = useMemo(
    () => (transaction ? wallets.find((w) => w.id === transaction.walletId) : null),
    [wallets, transaction]
  );
  const currency = walletForTx?.currency ?? i18n.t('wallet.currency');
  const sheetHeight = Math.max(
    MIN_SHEET_HEIGHT,
    Math.min(WINDOW_HEIGHT * 0.9, WINDOW_HEIGHT * SHEET_HEIGHT_RATIO)
  );

  const handleCopyId = useCallback(() => {
    if (!transaction) return;
    Clipboard.setString(transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [transaction]);

  if (!transaction) {
    return (
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(30)}
          style={[
            styles.sheet,
            styles.sheetError,
            {
              height: sheetHeight,
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{i18n.t('transactionDetails.title')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
              <X size={24} color={tokens.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.errorContent}>
            <View style={styles.errorIcon}>
              <AlertCircle size={48} color={tokens.danger} />
            </View>
            <Text style={styles.errorTitle}>{i18n.t('transactionDetails.dataMissing')}</Text>
            <Text style={styles.errorDesc}>{i18n.t('transactionDetails.dataMissingDesc')}</Text>
            <PressableScale style={styles.closeFullButton} onPress={onClose}>
              <Text style={styles.closeFullButtonText}>{i18n.t('transactionDetails.close')}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    );
  }

  const isSend = transaction.type === 'send' || transaction.type === 'business_payment_send';
  const isFreeze = transaction.type === 'freeze';
  const isUnfreeze = transaction.type === 'unfreeze';
  const isFreezeSpend = transaction.type === 'freeze_spend';
  const isBusiness = transaction.type === 'business_payment_send' || transaction.type === 'business_payment_receive';
  const note = (transaction.category ?? '').trim();

  let summaryTypeLabel: string;
  let SummaryIcon: typeof Send;
  let summaryCardStyle: 'send' | 'receive';
  let amountSign: string;

  if (isFreeze) {
    summaryTypeLabel = i18n.t('ledger.freeze');
    SummaryIcon = Lock;
    summaryCardStyle = 'send';
    amountSign = '-';
  } else if (isUnfreeze) {
    summaryTypeLabel = i18n.t('ledger.unfreeze');
    SummaryIcon = Unlock;
    summaryCardStyle = 'receive';
    amountSign = '+';
  } else if (isFreezeSpend) {
    summaryTypeLabel = i18n.t('ledger.freezeSpend');
    SummaryIcon = CreditCard;
    summaryCardStyle = 'send';
    amountSign = '-';
  } else if (isBusiness) {
    summaryTypeLabel = i18n.t('businessMode.title');
    SummaryIcon = transaction.type === 'business_payment_send' ? Send : Download;
    summaryCardStyle = transaction.type === 'business_payment_send' ? 'send' : 'receive';
    amountSign = transaction.type === 'business_payment_send' ? '-' : '+';
  } else if (isSend) {
    summaryTypeLabel = i18n.t('ledger.expense');
    SummaryIcon = Send;
    summaryCardStyle = 'send';
    amountSign = '-';
  } else {
    summaryTypeLabel = i18n.t('ledger.income');
    SummaryIcon = Download;
    summaryCardStyle = 'receive';
    amountSign = '+';
  }

  const showParticipants = !isFreeze && !isUnfreeze && !isFreezeSpend;
  const showBalanceCard = !isFreezeSpend;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <Animated.View
        entering={SlideInDown.springify().damping(30)}
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('transactionDetails.title')}</Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <X size={24} color={tokens.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.summaryCard,
              summaryCardStyle === 'send' ? styles.summaryCardSend : styles.summaryCardReceive,
            ]}
          >
            <View style={styles.summaryIcon}>
              <SummaryIcon size={28} color={tokens.white} />
            </View>
            <Text style={styles.summaryAmount}>
              {amountSign}
              {mask(transaction.amount)} {currency}
            </Text>
            <Text style={styles.summaryType}>{summaryTypeLabel}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {i18n.t('transactionDetails.statusCompleted')}
              </Text>
            </View>
          </View>

          <Section title={i18n.t('transactionDetails.sectionGeneral')} icon={FileText} styles={styles} tokens={tokens}>
            <View style={styles.idRow}>
              <Text style={styles.detailLabel}>{i18n.t('transactionDetails.transactionId')}</Text>
              <PressableScale style={styles.copyButton} onPress={handleCopyId}>
                <View style={styles.copyButtonInner}>
                  {copied ? (
                    <>
                      <Check size={12} color={tokens.primary} />
                      <Text style={styles.copyButtonText}>
                        {i18n.t('transactionDetails.copied')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Copy size={12} color={tokens.primary} />
                      <Text style={styles.copyButtonText}>
                        {i18n.t('transactionDetails.copy')}
                      </Text>
                    </>
                  )}
                </View>
              </PressableScale>
            </View>
            <Text style={styles.idValue} selectable>
              {transaction.id}
            </Text>
            <DetailRow
              label={i18n.t('transactionDetails.date')}
              value={formatDateLong(transaction.timestamp, language)}
              styles={styles}
            />
            <DetailRow
              label={i18n.t('transactionDetails.time')}
              value={formatTimeWithSeconds(transaction.timestamp, language)}
              styles={styles}
            />
            <DetailRow
              label={i18n.t('transactionDetails.paymentMethod')}
              value={
                transaction.method === 'QR'
                  ? i18n.t('transactionDetails.methodQR')
                  : i18n.t('transactionDetails.methodManual')
              }
              styles={styles}
            />
          </Section>

          {showParticipants && (
            <Section title={i18n.t('transactionDetails.sectionParticipants')} icon={Users} styles={styles} tokens={tokens}>
              <DetailRow
                label={i18n.t('transactionDetails.senderName')}
                value={isSend ? i18n.t('ledger.you') : (transaction.sender ?? '')}
                styles={styles}
              />
              <DetailRow
                label={i18n.t('transactionDetails.receiverName')}
                value={isSend ? (transaction.receiver ?? '') : i18n.t('ledger.you')}
                styles={styles}
              />
            </Section>
          )}

          <Section title={i18n.t('transactionDetails.sectionDetails')} icon={List} styles={styles} tokens={tokens}>
            <DetailRow label={i18n.t('transactionDetails.note')} value={note} styles={styles} />
            <DetailRow
              label={i18n.t('transactionDetails.category')}
              value={categoryName ?? ''}
              styles={styles}
            />
          </Section>

          {transaction.invoiceImage && (
            <Section title={i18n.t('transactionDetails.paymentProof')} icon={ImageIcon} styles={styles} tokens={tokens}>
              <PressableScale
                style={[styles.paymentProofImage, { backgroundColor: tokens.borderLight }]}
                onPress={() => setShowImageViewer(true)}
                activeScale={0.98}
              >
                <Image
                  source={{ uri: transaction.invoiceImage }}
                  style={styles.paymentProofImageInner}
                  resizeMode="cover"
                  accessibilityLabel={i18n.t('transactionDetails.paymentProof')}
                />
              </PressableScale>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <PressableScale
                  style={[
                    styles.removeImageBtn,
                    { flex: 1, backgroundColor: tokens.primary10, borderColor: tokens.primary20 },
                  ]}
                  onPress={() => setShowImageViewer(true)}
                  activeScale={0.98}
                >
                  <ImageIcon size={18} color={tokens.primary} />
                  <Text style={[styles.removeImageText, { color: tokens.primary }]}>
                    {i18n.t('transactionDetails.viewReceipt')}
                  </Text>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.removeImageBtn,
                    { flex: 1, backgroundColor: tokens.dangerLight, borderColor: tokens.danger },
                  ]}
                  onPress={() => transaction?.id && removeTransactionImage(transaction.id)}
                  activeScale={0.98}
                >
                  <Trash2 size={18} color={tokens.danger} />
                  <Text style={[styles.removeImageText, { color: tokens.danger }]}>
                    {i18n.t('transactionDetails.removeImage')}
                  </Text>
                </PressableScale>
              </View>
            </Section>
          )}

          {transaction.invoiceImage && (
            <TransactionImageViewerModal
              visible={showImageViewer}
              uri={transaction.invoiceImage}
              onClose={() => setShowImageViewer(false)}
            />
          )}


          {showBalanceCard && (
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>
                  {i18n.t('transactionDetails.balanceBefore')}
                </Text>
                <Text style={styles.balanceValue}>
                  {mask(transaction.balanceBefore)} {currency}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>
                  {i18n.t('transactionDetails.balanceAfter')}
                </Text>
                <Text
                  style={[
                    styles.balanceValueAfter,
                    summaryCardStyle === 'send' ? styles.balanceValueSend : styles.balanceValueReceive,
                  ]}
                >
                  {mask(transaction.balanceAfter)} {currency}
                </Text>
              </View>
            </View>
          )}

          <PressableScale style={styles.closeFullButton} onPress={onClose}>
            <Text style={styles.closeFullButtonText}>{i18n.t('transactionDetails.close')}</Text>
          </PressableScale>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
