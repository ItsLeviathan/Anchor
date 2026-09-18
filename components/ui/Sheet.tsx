import React from 'react';
import { ScrollView, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface SheetProps {
  children: React.ReactNode;
  /**
   * Whether the content area scrolls. Defaults to true so every composer
   * form stays reachable (Save button included) regardless of content
   * height or keyboard state. Set to false when a child already manages
   * its own scrolling (e.g. AddSheet's FlatList) - nesting a
   * same-orientation FlatList inside this ScrollView would trigger RN's
   * "VirtualizedLists should never be nested" warning and break it.
   */
  scroll?: boolean;
}

export function Sheet({ children, scroll = true }: SheetProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
      }}
    >
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: radius.full,
          backgroundColor: colors.border,
          alignSelf: 'center',
          marginTop: spacing.sm,
        }}
      />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ padding: spacing.lg, flex: 1 }}>{children}</View>
      )}
    </View>
  );
}
