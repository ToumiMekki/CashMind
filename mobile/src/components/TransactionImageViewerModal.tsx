/**
 * Full-screen image viewer with zoom/pan. Dark mode ready.
 */
import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

interface TransactionImageViewerModalProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export function TransactionImageViewerModal({
  visible,
  uri,
  onClose,
}: TransactionImageViewerModalProps) {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.overlay,
          {
            backgroundColor: tokens.overlay,
            paddingTop: insets.top,
          },
        ]}
        onPress={onClose}
      >
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <X size={28} color={tokens.white} />
        </Pressable>
        <View style={[styles.imageWrap, { maxWidth: width, maxHeight: height - insets.top - insets.bottom - 60 }]}>
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Payment proof image"
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  imageWrap: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 200,
  },
});
