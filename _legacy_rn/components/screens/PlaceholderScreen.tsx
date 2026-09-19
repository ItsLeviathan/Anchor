import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../ui';
import { useTheme } from '../../lib/theme/ThemeProvider';

interface PlaceholderScreenProps {
  title: string;
  emptyMessage: string;
}

export function PlaceholderScreen({ title, emptyMessage }: PlaceholderScreenProps) {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg }}
    >
      <Text style={[typography.title, { color: colors.textPrimary }]}>{title}</Text>
      <EmptyState message={emptyMessage} />
    </ScrollView>
  );
}
