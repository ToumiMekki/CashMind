import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { maxAppWidth, LAYOUT } from '../../theme';

interface AppContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

/**
 * Global screen wrapper: exactly ONE SafeAreaView per screen.
 * - paddingTop: 0, paddingBottom: 0 (no manual top/bottom padding).
 * - Only horizontal padding unless noPadding.
 * - Tab bar handling is left to BottomTabNavigator; do not add paddingBottom for it.
 * - Background uses theme tokens (full dark mode support).
 */
export function AppContainer({
  children,
  style,
  noPadding,
}: AppContainerProps) {
  const tokens = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.background }]} edges={['top']}>
      <View
        style={[
          styles.inner,
          !noPadding && { paddingHorizontal: LAYOUT.PAGE_PADDING_HORIZONTAL },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  inner: {
    flex: 1,
    maxWidth: maxAppWidth,
    alignSelf: 'center',
    width: '100%',
  },
});
