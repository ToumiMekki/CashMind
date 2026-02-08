import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Wallet, BookOpen, BarChart3, Settings, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { LAYOUT } from '../theme';
import { WalletTabScreen } from '../screens/WalletTabScreen';
import { LedgerScreen } from '../screens/LedgerScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { FrozenScreen } from '../screens/FrozenScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_PADDING_TOP = 12;
const TAB_BAR_PADDING_BOTTOM = 8;

export function MainTabs() {
  const tokens = useTheme();
  const language = useAppStore((s) => s.language);
  const insets = useSafeAreaInsets();

  const tabBarHeight = LAYOUT.TAB_BAR_BASE_HEIGHT + insets.bottom;
  const tabBarPaddingBottom = TAB_BAR_PADDING_BOTTOM + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textMuted,
        // @ts-expect-error sceneContainerStyle exists at runtime; types may be incomplete
        sceneContainerStyle: {
          flex: 1,
          backgroundColor: tokens.background,
        },
        tabBarStyle: {
          backgroundColor: tokens.background,
          borderTopColor: tokens.border,
          borderTopWidth: 1,
          paddingTop: TAB_BAR_PADDING_TOP,
          paddingBottom: tabBarPaddingBottom,
          height: tabBarHeight,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tab.Screen
        name="Wallet"
        component={WalletTabScreen}
        options={{
          tabBarLabel: i18n.t('nav.wallet'),
          tabBarIcon: ({ focused, color, size }) => (
            <Wallet
              size={size}
              color={color}
              fill={focused ? tokens.primary : 'transparent'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Ledger"
        component={LedgerScreen}
        options={{
          tabBarLabel: i18n.t('nav.ledger'),
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: i18n.t('nav.stats'),
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Frozen"
        component={FrozenScreen}
        options={{
          tabBarLabel: i18n.t('nav.frozen'),
          tabBarIcon: ({ focused, color, size }) => (
            <Lock
              size={size}
              color={color}
              fill={focused ? tokens.primary : 'transparent'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: i18n.t('nav.settings'),
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
