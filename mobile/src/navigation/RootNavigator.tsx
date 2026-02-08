import React, { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../stores/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { QRScanScreen } from '../screens/QRScanScreen';
import { FreezeAmountScreen } from '../screens/FreezeAmountScreen';
import { UnfreezeAmountScreen } from '../screens/UnfreezeAmountScreen';
import { SpendFromFrozenScreen } from '../screens/SpendFromFrozenScreen';
import { AddWalletScreen } from '../screens/AddWalletScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { BusinessScanConfirmScreen } from '../screens/BusinessScanConfirmScreen';
import { BusinessModeScreen } from '../screens/BusinessModeScreen';
import { FamilyShareScreen } from '../screens/FamilyShareScreen';
import { LockScreen } from '../screens/LockScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';
import { VerifyPinScreen } from '../screens/VerifyPinScreen';
import { PayScreen } from '../screens/PayScreen';
import { ReceiveScreen } from '../screens/ReceiveScreen';
import { TransactionDetailsScreen } from '../screens/TransactionDetailsScreen';
import { DebtListScreen } from '../screens/DebtListScreen';
import { AddDebtScreen } from '../screens/AddDebtScreen';
import { DebtDetailsScreen } from '../screens/DebtDetailsScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const tokens = useTheme();
  const init = useAppStore((s) => s.init);
  const initialized = useAppStore((s) => s.initialized);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const overlay = useAppStore((s) => s.overlay);
  const selectedTransaction = useAppStore((s) => s.selectedTransaction);
  const selectedDebt = useAppStore((s) => s.selectedDebt);
  const isUnlocked = useAppStore((s) => s.isUnlocked);
  const authState = useAppStore((s) => s.authState);
  const setUnlocked = useAppStore((s) => s.setUnlocked);
  const lock = useAppStore((s) => s.lock);

  useEffect(() => {
    init();
  }, [init]);

  // Defer lock so that opening camera/gallery (brief background) doesn't force PIN on return.
  const LOCK_AFTER_BACKGROUND_MS = 5000;
  useEffect(() => {
    let lockTimer: ReturnType<typeof setTimeout> | null = null;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' && useAppStore.getState().authState?.hasPin) {
        lockTimer = setTimeout(() => {
          lockTimer = null;
          lock();
        }, LOCK_AFTER_BACKGROUND_MS);
      } else if (next === 'active' || next === 'inactive') {
        if (lockTimer) {
          clearTimeout(lockTimer);
          lockTimer = null;
        }
      }
    });
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
      sub.remove();
    };
  }, [lock]);

  if (!initialized) {
    return null;
  }

  if (!hasOnboarded) {
    return <OnboardingScreen />;
  }

  if (authState?.hasPin && !isUnlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  if (overlay === 'pinSetup') {
    return (
      <PinSetupScreen
        onComplete={() => {
          useAppStore.getState().setOverlay(null);
          useAppStore.getState().refreshAuthState();
        }}
        onCancel={() => useAppStore.getState().setOverlay(null)}
      />
    );
  }
  if (overlay === 'verifyPinEnableBiometric') {
    return (
      <VerifyPinScreen
        action="enableBiometric"
        onSuccess={() => {
          useAppStore.getState().setOverlay(null);
          useAppStore.getState().refreshAuthState();
        }}
        onCancel={() => useAppStore.getState().setOverlay(null)}
      />
    );
  }
  if (overlay === 'verifyPinDisablePin') {
    return (
      <VerifyPinScreen
        action="disablePin"
        onSuccess={() => {
          useAppStore.getState().setOverlay(null);
          useAppStore.getState().refreshAuthState();
        }}
        onCancel={() => useAppStore.getState().setOverlay(null)}
      />
    );
  }

  if (overlay === 'pay') {
    return <PayScreen />;
  }
  if (overlay === 'qrScan') {
    return <QRScanScreen />;
  }
  if (overlay === 'receive') {
    return <ReceiveScreen />;
  }
  if (overlay === 'freeze') {
    return <FreezeAmountScreen />;
  }
  if (overlay === 'unfreeze') {
    return <UnfreezeAmountScreen />;
  }
  if (overlay === 'spendFromFreeze') {
    return <SpendFromFrozenScreen />;
  }
  if (overlay === 'addWallet') {
    return <AddWalletScreen />;
  }
  if (overlay === 'transfer') {
    return <TransferScreen />;
  }
  if (overlay === 'businessScanConfirm') {
    return <BusinessScanConfirmScreen />;
  }
  if (overlay === 'businessMode') {
    return <BusinessModeScreen />;
  }
  if (overlay === 'familyShare') {
    return <FamilyShareScreen />;
  }
  if (overlay === 'debtList') {
    return <DebtListScreen />;
  }
  if (overlay === 'addDebt') {
    return <AddDebtScreen />;
  }
  if (overlay === 'debtDetails') {
    return <DebtDetailsScreen />;
  }
  if (selectedTransaction) {
    return (
      <TransactionDetailsScreen
        transaction={selectedTransaction}
        onClose={() => useAppStore.getState().setSelectedTransaction(null)}
      />
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { flex: 1, backgroundColor: tokens.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}
