import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { PressableScale } from '../components/ui/PressableScale';
import { getCategoriesForFlow } from '../repositories/categoriesRepository';
import { insertCategory } from '../repositories/categoriesRepository';
import { generateCategoryId } from '../utils/transactionId';
import { playSound } from '../services/soundManager';
import type { Category, CategoryType } from '../database/types';

const COLOR_PRESETS = ['#F97316', '#3B82F6', '#22C55E', '#EC4899', '#A855F7'];
const MOOD_COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];
const MAX_CUSTOM_CATEGORIES = 9;

function getMoodColorForIndex(index: number): string {
  return MOOD_COLORS[index % MOOD_COLORS.length];
}
interface CategorySplashScreenProps {
  visible: boolean;
  walletId: string;
  flowType: 'pay' | 'receive';
  onSelect: (categoryId: string | null) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function CategorySplashScreen({
  visible,
  walletId,
  flowType,
  onSelect,
  onSkip,
  onClose,
}: CategorySplashScreenProps) {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0]);
  const [newIcon, setNewIcon] = useState('📦');

  useEffect(() => {
    if (visible && walletId) {
      setLoading(true);
      getCategoriesForFlow(walletId, flowType).then((list) => {
        setCategories(list);
        setLoading(false);
      });
    }
  }, [visible, walletId, flowType]);

  const defaultCount = 5;
  const customCount = Math.max(0, categories.length - defaultCount);
  const canAddMore = customCount < MAX_CUSTOM_CATEGORIES;

  const handleAddCategory = async () => {
    const name = (newName || '').trim();
    if (!name) return;
    if (!canAddMore) return;
    const type: CategoryType = flowType === 'pay' ? 'pay' : 'receive';
    const cat: Category = {
      id: generateCategoryId(),
      name,
      icon: newIcon || '📦',
      color: getMoodColorForIndex(customCount),
      type,
      walletId,
    };
    await insertCategory(cat);
    setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    setShowQuickAdd(false);
    setNewName('');
    playSound('category_selected');
    onSelect(cat.id);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: tokens.background }]}>
        <View style={[styles.container, { backgroundColor: tokens.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: tokens.textPrimary }]}>
              {i18n.t('category.chooseCategory')}
            </Text>
            <View style={styles.headerActions}>
              <Pressable
                onPress={onSkip}
                style={styles.skipBtn}
                hitSlop={12}
                accessibilityLabel={i18n.t('category.skip')}
              >
                <Text style={[styles.skipText, { color: tokens.primary }]}>
                  {i18n.t('category.skip')}
                </Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <X size={24} color={tokens.textSecondary} />
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <Text style={{ color: tokens.textMuted }}>{i18n.t('category.loading')}</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.gridWrap}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeIn.duration(200)} style={styles.grid}>
                {categories.map((cat) => (
                  <PressableScale
                    key={cat.id}
                    onPress={() => {
                      playSound('category_selected');
                      onSelect(cat.id);
                    }}
                    style={[styles.gridItem, { backgroundColor: tokens.surface }]}
                    activeScale={0.95}
                  >
                    <Text style={styles.gridIcon}>{cat.icon}</Text>
                    <Text
                      style={[styles.gridLabel, { color: tokens.textPrimary }]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </PressableScale>
                ))}
                {canAddMore && (
                  <PressableScale
                    onPress={() => setShowQuickAdd(true)}
                    style={[styles.gridItemAdd, { borderColor: tokens.border }]}
                    activeScale={0.95}
                  >
                    <Plus size={28} color={tokens.textMuted} />
                    <Text style={[styles.addLabel, { color: tokens.textMuted }]}>
                      {i18n.t('category.add')}
                    </Text>
                  </PressableScale>
                )}
              </Animated.View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Quick Add Bottom Sheet */}
      <Modal transparent animationType="slide" visible={showQuickAdd}>
        <Pressable style={[styles.sheetOverlay, { backgroundColor: tokens.overlay }]} onPress={() => setShowQuickAdd(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetKeyboard}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[styles.sheet, { backgroundColor: tokens.background, paddingBottom: insets.bottom + 16 }]}
            >
              <View style={[styles.sheetHandle, { backgroundColor: tokens.textMuted }]} />
              <Text style={[styles.sheetTitle, { color: tokens.textPrimary }]}>
                {i18n.t('category.addCategory')}
              </Text>
              <TextInput
                style={[styles.sheetInput, { color: tokens.textPrimary, borderColor: tokens.border }]}
                value={newName}
                onChangeText={setNewName}
                placeholder={i18n.t('category.namePlaceholder')}
                placeholderTextColor={tokens.textMuted}
                autoFocus
                maxLength={32}
              />
              <View style={styles.colorRow}>
                {COLOR_PRESETS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setNewColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      newColor === c && styles.colorDotSelected,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.sheetActions}>
                <Pressable onPress={() => setShowQuickAdd(false)} style={styles.sheetBtn}>
                  <Text style={[styles.sheetBtnText, { color: tokens.textSecondary }]}>
                    {i18n.t('category.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAddCategory}
                  style={[styles.sheetBtnPrimary, { backgroundColor: tokens.primary }]}
                  disabled={!(newName || '').trim()}
                >
                  <Text style={[styles.sheetBtnPrimaryText, { color: tokens.white }]}>{i18n.t('category.save')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
  loading: {
    padding: 48,
    alignItems: 'center',
  },
  gridWrap: {
    padding: 16,
    paddingTop: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '30%',
    minWidth: 90,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gridIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  gridItemAdd: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    minHeight: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end' as const,
  },
  sheetKeyboard: {
    maxHeight: '70%',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  sheetBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sheetBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  sheetBtnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
