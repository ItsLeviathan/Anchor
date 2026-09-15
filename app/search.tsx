import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '../components/ui';
import { type SearchResultType, useSearch } from '../features/search/useSearch';
import { useSession } from '../lib/supabase/useSession';
import { useTheme } from '../lib/theme/ThemeProvider';

const TYPE_ICON: Record<SearchResultType, keyof typeof Ionicons.glyphMap> = {
  task: 'checkmark-circle-outline',
  note: 'document-text-outline',
  document: 'folder-open-outline',
  expense: 'cash-outline',
  habit: 'repeat-outline',
};

const TYPE_LABEL: Record<SearchResultType, string> = {
  task: 'Task',
  note: 'Note',
  document: 'Document',
  expense: 'Expense',
  habit: 'Habit',
};

export default function SearchScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { query, setQuery, results, isSearching } = useSearch(session?.user.id);

  return (
    <ErrorBoundary>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search bar */}
      <View
        style={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search tasks, notes, documents…"
          placeholderTextColor={colors.textTertiary}
          style={[typography.body, { flex: 1, color: colors.textPrimary }]}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Close search">
          <Text style={[typography.subhead, { color: colors.accent }]}>Cancel</Text>
        </Pressable>
      </View>

      {/* Results */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: spacing.sm }}
      >
        {isSearching ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : query.trim().length >= 2 && results.length === 0 ? (
          <Text
            style={[
              typography.subhead,
              {
                color: colors.textTertiary,
                textAlign: 'center',
                marginTop: spacing.xl,
                paddingHorizontal: spacing.lg,
              },
            ]}
          >
            Nothing found for "{query}"
          </Text>
        ) : (
          results.map((item) => (
            <Pressable
              key={`${item.type}-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${TYPE_LABEL[item.type]}: ${item.title}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                backgroundColor: pressed ? colors.surface : 'transparent',
                gap: spacing.md,
              })}
              onPress={() => router.back()}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: colors.accentMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={TYPE_ICON[item.type]} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.body, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  {TYPE_LABEL[item.type]} · {item.subtitle}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        {query.trim().length > 0 && query.trim().length < 2 ? (
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
            ]}
          >
            Keep typing…
          </Text>
        ) : null}
      </ScrollView>
    </View>
    </ErrorBoundary>
  );
}
