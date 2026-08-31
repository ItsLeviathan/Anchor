import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface StatRowProps {
  label: string;
  value: string;
}

export function StatRow({ label, value }: StatRowProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
      <Text style={[typography.body, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}
