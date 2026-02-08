/**
 * 40x40 rounded thumbnail for transaction payment proof.
 * RTL-aware, consistent across Ledger, TransactionDetails, Business screens.
 */
import React from 'react';
import { View, Image, StyleSheet, Pressable, I18nManager } from 'react-native';
import { radius } from '../theme';

const SIZE = 40;

interface TransactionImageThumbnailProps {
  uri: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function TransactionImageThumbnail({
  uri,
  onPress,
  accessibilityLabel = 'Payment proof image',
}: TransactionImageThumbnailProps) {
  const isRTL = I18nManager.isRTL;
  const content = (
    <Image
      source={{ uri }}
      style={styles.thumb}
      resizeMode="cover"
      accessibilityLabel={accessibilityLabel}
    />
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
        accessibilityRole="imagebutton"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.wrap}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumb: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.8 },
});
