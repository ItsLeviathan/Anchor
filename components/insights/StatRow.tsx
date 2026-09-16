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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={[typography.body, { color: colors.textSecondary, flexShrink: 1, marginRight: spacing.sm }]}>
        {label}
      </Text>
      <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}
