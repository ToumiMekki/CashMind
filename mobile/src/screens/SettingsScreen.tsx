import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
  Image,
  Switch,
} from 'react-native';
import {
  Globe,
  Trash2,
  Download,
  Shield,
  Database,
  WifiOff,
  AlertTriangle,
  User,
  Sun,
  Moon,
  Monitor,
  Calendar,
  Palette,
  Wallet,
  X,
  Fingerprint,
  Lock,
  Volume2,
  CreditCard,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { AppContainer } from '../components/ui/AppContainer';
import { PressableScale } from '../components/ui/PressableScale';
import { getDevice, setSenderName } from '../repositories/deviceRepository';
import { updateWallet } from '../repositories/walletsRepository';
import { formatNumber } from '../utils/format';
import type { Language } from '../database/types';
import type { Theme } from '../repositories/settingsRepository';
import type { ThemeTokens } from '../theme/tokens';
import { THEME_COLOR_PALETTES } from '../theme/colorPalettes';

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'settings.themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'settings.themeDark' },
  { value: 'system', icon: Monitor, labelKey: 'settings.themeSystem' },
];

function makeSettingsStyles(t: ThemeTokens) {
  return {
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingTop: 0, paddingBottom: 12 },
    title: { fontSize: 24, fontWeight: '700' as const, color: t.textPrimary, marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '500' as const, color: t.textPrimary },
    sectionTitleStandalone: { fontSize: 16, fontWeight: '500' as const, color: t.textPrimary, marginBottom: 12 },
    displayNameInput: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: t.textPrimary,
      borderWidth: 1,
      borderColor: t.border,
    },
    themeRow: { flexDirection: 'row' as const, gap: 8 },
    themeBtn: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      backgroundColor: t.surface,
      borderRadius: radius.md,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 2,
      borderColor: t.border,
    },
    themeBtnActive: { borderColor: t.primary, backgroundColor: t.primary10 },
    themeBtnText: { fontSize: 13, fontWeight: '500' as const, color: t.textSecondary },
    themeBtnTextActive: { color: t.primary, fontWeight: '600' as const },
    languageCard: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 8,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    languageButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
    languageButtonActive: { backgroundColor: t.primary },
    languageButtonText: { fontSize: 16, fontWeight: '500' as const, color: t.textSecondary },
    languageButtonTextActive: { color: t.white },
    exerciceYearRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 12 },
    exerciceYearBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: t.borderLight,
    },
    exerciceYearBtnActive: { backgroundColor: t.primary10 },
    exerciceYearText: { fontSize: 15, fontWeight: '500' as const, color: t.textPrimary },
    exerciceYearTextActive: { fontSize: 15, fontWeight: '600' as const, color: t.primary },
    exerciceActionRow: { flexDirection: 'row' as const, gap: 12, marginTop: 4 },
    exerciceActionBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center' as const,
      backgroundColor: t.borderLight,
    },
    exerciceActionBtnPrimary: { backgroundColor: t.primary },
    exerciceActionBtnDisabled: { opacity: 0.5 },
    exerciceActionText: { fontSize: 14, fontWeight: '600' as const, color: t.textPrimary },
    exerciceActionTextPrimary: { fontSize: 14, fontWeight: '600' as const, color: t.white },
    appColorDesc: { fontSize: 13, color: t.textSecondary, marginBottom: 12, lineHeight: 18 },
    colorGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
    colorChipWrap: { alignItems: 'center' as const, width: 56 },
    colorChip: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorChipSelected: { borderColor: t.primary },
    colorChipInner: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    colorChipLabel: { fontSize: 11, fontWeight: '500' as const, color: t.textSecondary, marginTop: 6, textAlign: 'center' as const },
    soundRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: t.surface,
      borderRadius: radius.md,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    soundVolumeRow: { flexDirection: 'row' as const, gap: 8, marginTop: 8 },
    soundVolumeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: t.borderLight,
      alignItems: 'center' as const,
    },
    soundVolumeBtnActive: { backgroundColor: t.primary10 },
    soundVolumeBtnText: { fontSize: 13, fontWeight: '500' as const, color: t.textSecondary },
    soundVolumeBtnTextActive: { fontSize: 13, fontWeight: '600' as const, color: t.primary },
    dataRow: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    dataRowLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    dataIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primary10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    dataIconDanger: { backgroundColor: t.dangerLight },
    dataRowText: { fontSize: 16, fontWeight: '500' as const, color: t.textPrimary },
    dataRowTextDanger: { fontSize: 16, fontWeight: '500' as const, color: t.danger },
    privacyCard: {
      backgroundColor: t.primary,
      borderRadius: radius.lg,
      padding: 24,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    privacyRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12, marginBottom: 16 },
    privacyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.white20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    privacyTitle: { fontSize: 16, fontWeight: '500' as const, color: t.white, marginBottom: 4 },
    privacyDesc: { fontSize: 14, color: t.primaryTint },
    appInfo: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 16,
      alignItems: 'center' as const,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    appLogo: {
      width: 72,
      height: 72,
      borderRadius: 36,
      overflow: 'hidden' as const,
      marginBottom: 12,
      backgroundColor: t.borderLight,
      borderWidth: 1,
      borderColor: t.border,
    },
    appLogoImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginLeft: -14,
      marginTop: -14,
    },
    appName: { fontSize: 18, fontWeight: '700' as const, color: t.textPrimary, marginBottom: 4 },
    appVersion: { fontSize: 14, color: t.textSecondary },
    toast: {
      position: 'absolute' as const,
      bottom: 100,
      left: 24,
      right: 24,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      backgroundColor: t.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: radius.full,
      alignSelf: 'center' as const,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    toastText: { fontSize: 14, fontWeight: '500' as const, color: t.white },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: t.overlay,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 24,
      zIndex: 100,
    },
    modal: {
      backgroundColor: t.surface,
      borderRadius: radius.lg,
      padding: 24,
      width: '100%' as const,
      maxWidth: 340,
    },
    modalIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.dangerLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      alignSelf: 'center' as const,
      marginBottom: 16,
    },
    modalTitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary, textAlign: 'center' as const, marginBottom: 8 },
    modalMessage: { fontSize: 14, color: t.textSecondary, textAlign: 'center' as const, marginBottom: 24 },
    modalButtons: { flexDirection: 'row' as const, gap: 12 },
    modalButtonCancel: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: t.borderLight,
      alignItems: 'center' as const,
    },
    modalButtonCancelText: { fontSize: 16, fontWeight: '500' as const, color: t.textSecondary },
    modalButtonConfirm: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: t.danger,
      alignItems: 'center' as const,
    },
    modalButtonConfirmText: { fontSize: 16, fontWeight: '500' as const, color: t.white },
    walletRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: t.surface,
      borderRadius: radius.md,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: t.border,
    },
    walletRowLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    walletIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primary10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    walletName: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary },
    walletMeta: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    walletDeleteBtn: { padding: 8 },
  };
}

export function SettingsScreen() {
  const tokens = useTheme();
  const styles = useMemo(() => StyleSheet.create(makeSettingsStyles(tokens) as Record<string, object>), [tokens]);

  const language = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const themeColor = useAppStore((s) => s.themeColor);
  const setThemeColor = useAppStore((s) => s.setThemeColor);
  const transactions = useAppStore((s) => s.transactions);
  const balance = useAppStore((s) => s.balance);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const resetData = useAppStore((s) => s.resetData);
  const currentExercice = useAppStore((s) => s.currentExercice);
  const exercices = useAppStore((s) => s.exercices);
  const setCurrentExercice = useAppStore((s) => s.setCurrentExercice);
  const closeExercice = useAppStore((s) => s.closeExercice);
  const openNewExercice = useAppStore((s) => s.openNewExercice);
  const isCurrentExerciceOpen = useAppStore((s) => s.isCurrentExerciceOpen);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const deleteWalletAndSwitch = useAppStore((s) => s.deleteWalletAndSwitch);
  const refreshWallets = useAppStore((s) => s.refreshWallets);
  const authState = useAppStore((s) => s.authState);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const refreshAuthState = useAppStore((s) => s.refreshAuthState);
  const soundSettings = useAppStore((s) => s.soundSettings);
  const setSoundSettings = useAppStore((s) => s.setSoundSettings);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCloseExerciceConfirm, setShowCloseExerciceConfirm] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [walletToDelete, setWalletToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingWalletTheme, setEditingWalletTheme] = useState<{ id: string; name: string; themeColorId?: string | null } | null>(null);

  useEffect(() => {
    getDevice().then((d) => setDisplayName(d.senderName));
  }, []);

  const handleDisplayNameBlur = () => {
    setSenderName(displayName);
  };

  const handleExport = async () => {
    const wallets = useAppStore.getState().wallets;
    const activeWalletId = useAppStore.getState().activeWalletId;
    const data = {
      exercice: currentExercice,
      wallets,
      activeWalletId,
      transactions,
      balance,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    const json = JSON.stringify(data, null, 2);
    const filename = `cashmind-export-${Date.now()}.json`;
    const path = `${RNFS.CachesDirectoryPath}/${filename}`;
    try {
      await RNFS.writeFile(path, json, 'utf8');
      await Share.open({
        url: Platform.OS === 'ios' ? `file://${path}` : path,
        type: 'application/json',
        filename,
      });
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 2000);
    } catch (e) {
      if ((e as { message?: string }).message !== 'User did not share') {
        Alert.alert('Error', (e as Error).message);
      }
    }
  };

  const handleReset = async () => {
    await resetData();
    setShowResetConfirm(false);
  };

  const handleCloseExerciceConfirm = async () => {
    setShowCloseExerciceConfirm(false);
    const result = await closeExercice();
    if (result.success) {
      Alert.alert(i18n.t('settings.exerciceCloseSuccess'), '');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleOpenNewExercice = async () => {
    const result = await openNewExercice();
    if (result.success) {
      Alert.alert(i18n.t('settings.exerciceOpenSuccess'), '');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDeleteWalletConfirm = async () => {
    if (!walletToDelete) return;
    const result = await deleteWalletAndSwitch(walletToDelete.id);
    setWalletToDelete(null);
    if (result.success === false) {
      Alert.alert('Error', result.error);
    }
  };

  const languages: Language[] = ['ar', 'fr', 'en'];
  const open = isCurrentExerciceOpen();

  return (
    <AppContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{i18n.t('settings.title')}</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sun size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.theme')}</Text>
          </View>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
              <Pressable
                key={value}
                style={[styles.themeBtn, theme === value && styles.themeBtnActive]}
                onPress={() => setTheme(value)}
              >
                <Icon size={18} color={theme === value ? tokens.primary : tokens.textSecondary} />
                <Text style={[styles.themeBtnText, theme === value && styles.themeBtnTextActive]}>
                  {i18n.t(labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.appColor')}</Text>
          </View>
          <Text style={styles.appColorDesc}>
            {i18n.t('settings.appColorDesc')}
          </Text>
          <View style={styles.colorGrid}>
            {THEME_COLOR_PALETTES.map((p) => {
              const selected = themeColor === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={styles.colorChipWrap}
                  onPress={() => setThemeColor(p.id)}
                >
                  <View
                    style={[
                      styles.colorChip,
                      selected && styles.colorChipSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.colorChipInner,
                        { backgroundColor: p.hex },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.colorChipLabel,
                      selected && { color: tokens.primary, fontWeight: '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {i18n.t(p.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.displayName')}</Text>
          </View>
          <TextInput
            style={styles.displayNameInput}
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={handleDisplayNameBlur}
            placeholder={i18n.t('settings.displayNamePlaceholder')}
            placeholderTextColor={tokens.textMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.language')}</Text>
          </View>
          <View style={styles.languageCard}>
            {languages.map((lang) => (
              <Pressable
                key={lang}
                style={[
                  styles.languageButton,
                  language === lang && styles.languageButtonActive,
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === lang && styles.languageButtonTextActive,
                  ]}
                >
                  {i18n.t(`settings.${lang}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.sounds')}</Text>
          </View>
          <Text style={[styles.sectionTitleStandalone, { marginBottom: 12 }]}>
            {i18n.t('settings.soundsDesc')}
          </Text>
          <View style={styles.soundRow}>
            <Text style={styles.dataRowText}>{i18n.t('settings.soundEffects')}</Text>
            <Switch
              value={soundSettings.soundsEnabled}
              onValueChange={(v) => setSoundSettings({ soundsEnabled: v })}
              trackColor={{ false: tokens.border, true: tokens.primary10 }}
              thumbColor={soundSettings.soundsEnabled ? tokens.primary : tokens.textMuted}
            />
          </View>
          {soundSettings.soundsEnabled && (
            <>
              <Text style={[styles.sectionTitleStandalone, { marginTop: 8, marginBottom: 8 }]}>
                {i18n.t('settings.soundVolume')}
              </Text>
              <View style={styles.soundVolumeRow}>
                {([{ v: 0.25, key: 'soundVolumeLow' }, { v: 0.5, key: 'soundVolumeMedium' }, { v: 0.75, key: 'soundVolumeHigh' }] as const).map(({ v, key }) => (
                  <Pressable
                    key={key}
                    style={[styles.soundVolumeBtn, Math.abs(soundSettings.soundVolume - v) < 0.15 && styles.soundVolumeBtnActive]}
                    onPress={() => setSoundSettings({ soundVolume: v })}
                  >
                    <Text style={[styles.soundVolumeBtnText, Math.abs(soundSettings.soundVolume - v) < 0.15 && styles.soundVolumeBtnTextActive]}>
                      {i18n.t(`settings.${key}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <View style={[styles.soundRow, { marginTop: 12 }]}>
            <Text style={styles.dataRowText}>{i18n.t('settings.muteInSilentMode')}</Text>
            <Switch
              value={soundSettings.muteInSilentMode}
              onValueChange={(v) => setSoundSettings({ muteInSilentMode: v })}
              trackColor={{ false: tokens.border, true: tokens.primary10 }}
              thumbColor={soundSettings.muteInSilentMode ? tokens.primary : tokens.textMuted}
            />
          </View>
          <View style={styles.soundRow}>
            <View>
              <Text style={styles.dataRowText}>{i18n.t('settings.amountInputSound')}</Text>
              <Text style={[styles.walletMeta, { marginTop: 2 }]}>{i18n.t('settings.amountInputSoundDesc')}</Text>
            </View>
            <Switch
              value={soundSettings.amountInputSound}
              onValueChange={(v) => setSoundSettings({ amountInputSound: v })}
              trackColor={{ false: tokens.border, true: tokens.primary10 }}
              thumbColor={soundSettings.amountInputSound ? tokens.primary : tokens.textMuted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.exercice')}</Text>
          </View>
          <Text style={[styles.sectionTitleStandalone, { marginBottom: 8 }]}>
            {i18n.t('settings.exerciceSelector')}
          </Text>
          <View style={styles.exerciceYearRow}>
            {exercices.map((e) => (
              <Pressable
                key={e.year}
                style={[
                  styles.exerciceYearBtn,
                  currentExercice === e.year && styles.exerciceYearBtnActive,
                ]}
                onPress={() => setCurrentExercice(e.year)}
              >
                <Text
                  style={[
                    styles.exerciceYearText,
                    currentExercice === e.year && styles.exerciceYearTextActive,
                  ]}
                >
                  {e.year} {e.status === 'closed' ? `(${i18n.t('settings.exerciceClosed')})` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.exerciceActionRow}>
            <Pressable
              style={[
                styles.exerciceActionBtn,
                open && styles.exerciceActionBtnPrimary,
                !open && styles.exerciceActionBtnDisabled,
              ]}
              onPress={() => (open ? setShowCloseExerciceConfirm(true) : null)}
              disabled={!open}
            >
              <Text
                style={[
                  styles.exerciceActionText,
                  open && styles.exerciceActionTextPrimary,
                ]}
              >
                {i18n.t('settings.exerciceClose')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.exerciceActionBtn}
              onPress={handleOpenNewExercice}
            >
              <Text style={styles.exerciceActionText}>
                {i18n.t('settings.exerciceOpenNew')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wallet size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.wallets')}</Text>
          </View>
          {wallets.map((w) => (
            <View key={w.id} style={styles.walletRow}>
              <View style={styles.walletRowLeft}>
                <View style={[styles.walletIcon, { backgroundColor: THEME_COLOR_PALETTES.find((p) => p.id === (w.themeColorId || 'blue'))?.light.primary10 ?? tokens.primary10 }]}>
                  <Wallet size={20} color={THEME_COLOR_PALETTES.find((p) => p.id === (w.themeColorId || 'blue'))?.hex ?? tokens.primary} />
                </View>
                <View>
                  <Text style={styles.walletName}>
                    {w.name}{activeWalletId === w.id ? ' • ' + i18n.t('settings.activeWallet') : ''}
                  </Text>
                  <Text style={styles.walletMeta}>
                    {w.currency} • {w.type === 'business' ? i18n.t('addWallet.business') : w.type === 'family' ? i18n.t('addWallet.family') : i18n.t('addWallet.personal')}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Pressable
                  onPress={() => setEditingWalletTheme({ id: w.id, name: w.name, themeColorId: w.themeColorId })}
                  style={{ padding: 8 }}
                >
                  <Palette size={20} color={tokens.textSecondary} />
                </Pressable>
                <Pressable
                  style={styles.walletDeleteBtn}
                  onPress={() => setWalletToDelete({ id: w.id, name: w.name })}
                >
                  <Trash2 size={20} color={tokens.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('settings.security')}</Text>
          </View>
          <Text style={[styles.sectionTitleStandalone, { marginBottom: 8 }]}>{i18n.t('settings.appLock')}</Text>
          <Text style={{ fontSize: 14, color: tokens.textSecondary, marginBottom: 12 }}>{i18n.t('settings.appLockDesc')}</Text>
          {authState?.hasPin ? (
            <>
              <PressableScale
                style={styles.dataRow}
                onPress={() => setOverlay('verifyPinDisablePin')}
              >
                <View style={styles.dataRowLeft}>
                  <View style={styles.dataIcon}>
                    <Lock size={20} color={tokens.primary} />
                  </View>
                  <Text style={styles.dataRowText}>{i18n.t('settings.disablePin')}</Text>
                </View>
              </PressableScale>
              {authState.biometricAvailable && (
                <>
                  {authState.biometricEnabled ? (
                    <PressableScale
                      style={styles.dataRow}
                      onPress={async () => {
                        const { disableBiometric } = await import('../services/authService');
                        await disableBiometric();
                        await refreshAuthState();
                      }}
                    >
                      <View style={styles.dataRowLeft}>
                        <View style={styles.dataIcon}>
                          <Fingerprint size={20} color={tokens.primary} />
                        </View>
                        <Text style={styles.dataRowText}>{i18n.t('settings.disableBiometricBtn')}</Text>
                      </View>
                    </PressableScale>
                  ) : (
                    <PressableScale
                      style={styles.dataRow}
                      onPress={() => setOverlay('verifyPinEnableBiometric')}
                    >
                      <View style={styles.dataRowLeft}>
                        <View style={styles.dataIcon}>
                          <Fingerprint size={20} color={tokens.primary} />
                        </View>
                        <Text style={styles.dataRowText}>{i18n.t('settings.enableBiometricBtn')}</Text>
                      </View>
                    </PressableScale>
                  )}
                  <Text style={{ fontSize: 12, color: tokens.textMuted, marginTop: 8 }}>{i18n.t('settings.biometricNote')}</Text>
                </>
              )}
            </>
          ) : (
            <PressableScale style={styles.dataRow} onPress={() => setOverlay('pinSetup')}>
              <View style={styles.dataRowLeft}>
                <View style={styles.dataIcon}>
                  <Lock size={20} color={tokens.primary} />
                </View>
                <Text style={styles.dataRowText}>{i18n.t('settings.enablePin')}</Text>
              </View>
            </PressableScale>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>{i18n.t('debt.title')}</Text>
          </View>
          <PressableScale
            style={styles.dataRow}
            onPress={() => setOverlay('debtList')}
            activeScale={0.98}
          >
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataIcon, { backgroundColor: tokens.primary10 }]}>
                <CreditCard size={20} color={tokens.primary} />
              </View>
              <Text style={styles.dataRowText}>{i18n.t('debt.title')}</Text>
            </View>
          </PressableScale>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitleStandalone}>
            {i18n.t('settings.data')}
          </Text>
          <PressableScale style={styles.dataRow} onPress={handleExport}>
            <View style={styles.dataRowLeft}>
              <View style={styles.dataIcon}>
                <Download size={20} color={tokens.primary} />
              </View>
              <Text style={styles.dataRowText}>
                {i18n.t('settings.exportData')}
              </Text>
            </View>
          </PressableScale>
          <PressableScale
            style={styles.dataRow}
            onPress={() => setShowResetConfirm(true)}
          >
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataIcon, styles.dataIconDanger]}>
                <Trash2 size={20} color={tokens.danger} />
              </View>
              <Text style={styles.dataRowTextDanger}>
                {i18n.t('settings.resetData')}
              </Text>
            </View>
          </PressableScale>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={tokens.textSecondary} />
            <Text style={styles.sectionTitle}>
              {i18n.t('settings.privacy')}
            </Text>
          </View>
          <View style={styles.privacyCard}>
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <WifiOff size={20} color={tokens.white} />
              </View>
              <View>
                <Text style={styles.privacyTitle}>
                  {i18n.t('settings.offlineMode')}
                </Text>
                <Text style={styles.privacyDesc}>
                  {i18n.t('settings.offlineDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Database size={20} color={tokens.white} />
              </View>
              <View>
                <Text style={styles.privacyTitle}>
                  {i18n.t('settings.localStorage')}
                </Text>
                <Text style={styles.privacyDesc}>
                  {i18n.t('settings.localDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Shield size={20} color={tokens.white} />
              </View>
              <View>
                <Text style={styles.privacyTitle}>
                  {i18n.t('settings.noServer')}
                </Text>
                <Text style={styles.privacyDesc}>
                  {i18n.t('settings.noServerDesc')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.appInfo}>
          <View style={styles.appLogo}>
            <Image
              source={require('../assets/logo_cash.png')}
              style={styles.appLogoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>CashMind</Text>
          <Text style={styles.appVersion}>
            {i18n.t('settings.version')} 1.0.0
          </Text>
        </View>
      </ScrollView>

      {showExportSuccess && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.toast}
        >
          <Download size={16} color={tokens.white} />
          <Text style={styles.toastText}>{i18n.t('settings.exported')}</Text>
        </Animated.View>
      )}

      {showResetConfirm && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowResetConfirm(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalIcon}>
              <AlertTriangle size={32} color={tokens.danger} />
            </View>
            <Text style={styles.modalTitle}>
              {i18n.t('settings.resetConfirmTitle')}
            </Text>
            <Text style={styles.modalMessage}>
              {i18n.t('settings.resetConfirmMessage')}
            </Text>
            <View style={styles.modalButtons}>
              <PressableScale
                style={styles.modalButtonCancel}
                onPress={() => setShowResetConfirm(false)}
              >
                <Text style={styles.modalButtonCancelText}>
                  {i18n.t('settings.cancel')}
                </Text>
              </PressableScale>
              <PressableScale
                style={styles.modalButtonConfirm}
                onPress={handleReset}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {i18n.t('settings.confirm')}
                </Text>
              </PressableScale>
            </View>
          </View>
        </Pressable>
      )}

      {editingWalletTheme && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditingWalletTheme(null)}
        >
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { marginBottom: 16 }]}>
              {i18n.t('addWallet.themeColor')} — {editingWalletTheme.name}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {THEME_COLOR_PALETTES.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={async () => {
                    await updateWallet(editingWalletTheme.id, {
                      themeColorId: p.id as ThemeColorId,
                    });
                    await refreshWallets();
                    setEditingWalletTheme(null);
                  }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: p.hex,
                    borderWidth: (editingWalletTheme.themeColorId || 'blue') === p.id ? 4 : 0,
                    borderColor: tokens.textPrimary,
                  }}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      )}

      {walletToDelete && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setWalletToDelete(null)}
        >
          <View style={styles.modal}>
            <View style={styles.modalIcon}>
              <AlertTriangle size={32} color={tokens.danger} />
            </View>
            <Text style={styles.modalTitle}>
              {i18n.t('settings.deleteWalletConfirmTitle')}
            </Text>
            <Text style={styles.modalMessage}>
              {i18n.t('settings.deleteWalletConfirmMessage')} “{walletToDelete.name}”
            </Text>
            <View style={styles.modalButtons}>
              <PressableScale
                style={styles.modalButtonCancel}
                onPress={() => setWalletToDelete(null)}
              >
                <Text style={styles.modalButtonCancelText}>
                  {i18n.t('settings.cancel')}
                </Text>
              </PressableScale>
              <PressableScale
                style={styles.modalButtonConfirm}
                onPress={handleDeleteWalletConfirm}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {i18n.t('settings.deleteConfirm')}
                </Text>
              </PressableScale>
            </View>
          </View>
        </Pressable>
      )}

      {showCloseExerciceConfirm && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCloseExerciceConfirm(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalIcon}>
              <AlertTriangle size={32} color={tokens.danger} />
            </View>
            <Text style={styles.modalTitle}>
              {i18n.t('settings.exerciceCloseConfirmTitle')}
            </Text>
            <Text style={styles.modalMessage}>
              {i18n.t('settings.exerciceCloseConfirmMessage')}
            </Text>
            <View style={styles.modalButtons}>
              <PressableScale
                style={styles.modalButtonCancel}
                onPress={() => setShowCloseExerciceConfirm(false)}
              >
                <Text style={styles.modalButtonCancelText}>
                  {i18n.t('settings.cancel')}
                </Text>
              </PressableScale>
              <PressableScale
                style={styles.modalButtonConfirm}
                onPress={handleCloseExerciceConfirm}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {i18n.t('settings.confirm')}
                </Text>
              </PressableScale>
            </View>
          </View>
        </Pressable>
      )}
    </AppContainer>
  );
}
