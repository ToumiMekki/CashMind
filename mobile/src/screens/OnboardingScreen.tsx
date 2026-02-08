import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Shield, Smartphone, Lock, Wallet, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import type { ThemeTokens } from '../theme/tokens';

const QUICK_CURRENCIES = ['DZD', 'EUR', 'USD'] as const;

function makeOnboardingStyles(t: ThemeTokens) {
  return {
    container: {
      flex: 1,
      backgroundColor: t.background,
      maxWidth: 430,
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
    logoWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      overflow: 'hidden' as const,
      alignSelf: 'center' as const,
      marginBottom: 20,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      backgroundColor: t.borderLight,
      borderWidth: 1,
      borderColor: t.border,
    },
    logoInner: {
      width: 140,
      height: 140,
      marginLeft: -20,
      marginTop: -20,
    },
    logo: {
      width: 140,
      height: 140,
      borderRadius: 70,
    },
    title: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: '#1a1a1a',
      textAlign: 'center' as const,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center' as const,
      marginBottom: 32,
    },
    features: { gap: 14, marginBottom: 28 },
    featureRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: t.surface,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    featureIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: t.primary10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 14,
    },
    featureText: { flex: 1, fontSize: 15, color: t.textPrimary, fontWeight: '500' as const },
    privacyBox: {
      backgroundColor: t.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    privacyText: { fontSize: 13, color: t.textSecondary, textAlign: 'center' as const },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: t.textPrimary,
      marginBottom: 10,
      marginTop: 8,
    },
    input: {
      backgroundColor: t.surface,
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: t.textPrimary,
      marginBottom: 16,
    },
    currencyRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 12 },
    currencyChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center' as const,
      borderWidth: 2,
      borderColor: '#e5e5e5',
      backgroundColor: '#fff',
    },
    currencyChipActive: { borderColor: t.primary, backgroundColor: t.primary10 },
    currencyChipText: { fontSize: 14, fontWeight: '600' as const, color: '#333' },
    currencyChipTextActive: { color: t.primary },
    cta: {
      backgroundColor: t.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: 8,
    },
    ctaText: { fontSize: 17, fontWeight: '700' as const, color: t.white },
  };
}

export function OnboardingScreen() {
  const tokens = useTheme();
  const styles = useMemo(
    () => StyleSheet.create(makeOnboardingStyles(tokens) as Record<string, object>),
    [tokens]
  );
  const insets = useSafeAreaInsets();
  const completeOnboardingWithWallet = useAppStore((s) => s.completeOnboardingWithWallet);

  const [name, setName] = useState('Main');
  const [currency, setCurrency] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    try {
      await completeOnboardingWithWallet(
        (name || 'Main').trim() || 'Main',
        (currency || '').trim() || 'DZD'
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { Icon: Shield, text: i18n.t('onboarding.feature1') },
    { Icon: Smartphone, text: i18n.t('onboarding.feature2') },
    { Icon: Lock, text: i18n.t('onboarding.feature3') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <View style={styles.logoInner}>
              <Image
                source={require('../assets/logo_cash.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
          </View>
          <Text style={styles.title}>{i18n.t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{i18n.t('onboarding.subtitle')}</Text>

          <View style={styles.features}>
            {features.map(({ Icon, text }) => (
              <View key={text} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon size={20} color={tokens.primary} />
                </View>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>{i18n.t('onboarding.privacy')}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 4 }}>
            <Wallet size={20} color={tokens.primary} />
            <Text style={styles.sectionLabel}>{i18n.t('onboarding.createWallet')}</Text>
          </View>
          <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 6, fontSize: 13, fontWeight: '500' }]}>
            {i18n.t('onboarding.walletName')}
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={i18n.t('onboarding.walletNamePlaceholder')}
            placeholderTextColor="#999"
            autoCapitalize="words"
          />
          <Text style={[styles.sectionLabel, { marginTop: 0 }]}>{i18n.t('onboarding.currencyOrUnit')}</Text>
          <View style={styles.currencyRow}>
            {QUICK_CURRENCIES.map((c) => (
              <Pressable
                key={c}
                style={StyleSheet.flatten([styles.currencyChip, currency === c && styles.currencyChipActive].filter(Boolean)) as import('react-native').ViewStyle}
                onPress={() => setCurrency(c)}
              >
                <Text style={StyleSheet.flatten([styles.currencyChipText, currency === c && styles.currencyChipTextActive].filter(Boolean)) as import('react-native').TextStyle}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            placeholder={i18n.t('onboarding.currencyPlaceholder')}
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <PressableScale
            style={StyleSheet.flatten([styles.cta, { marginBottom: insets.bottom + 16 }]) as import('react-native').ViewStyle}
            onPress={handleGetStarted}
            disabled={loading}
          >
            <Text style={styles.ctaText}>
              {loading ? '...' : i18n.t('onboarding.button')}
            </Text>
            {!loading && <ChevronRight size={20} color="#fff" />}
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
