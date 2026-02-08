import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeAwareApp } from './src/components/ThemeAwareApp';
import { useTheme } from './src/hooks/useTheme';

export default function App() {
  const tokens = useTheme();

  return (
    <GestureHandlerRootView style={[styles.flex, { backgroundColor: tokens.background }]}>
      <SafeAreaProvider>
        <NavigationContainer>
          <ThemeAwareApp />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
