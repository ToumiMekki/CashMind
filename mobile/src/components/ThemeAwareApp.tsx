import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { useTheme, useIsDark } from '../hooks/useTheme';
import { RootNavigator } from '../navigation/RootNavigator';

export function ThemeAwareApp() {
  const tokens = useTheme();
  const isDark = useIsDark();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={tokens.background}
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <RootNavigator />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
});
