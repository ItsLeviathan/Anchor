import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

export function EmptyState({ message }: { message: string }) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl }}>
      <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
    </View>
  );
}
