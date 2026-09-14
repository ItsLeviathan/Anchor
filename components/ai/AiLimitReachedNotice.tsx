import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import { Button, Card } from '../ui';

interface AiLimitReachedNoticeProps {
  limit: number;
  onDismiss: () => void;
}

export function AiLimitReachedNotice({ limit, onDismiss }: AiLimitReachedNoticeProps) {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  function handleUpgrade() {
    onDismiss();
    router.push('/(paywall)');
  }

  return (
    <Card>
      <Text style={[typography.headline, { color: colors.textPrimary }]}>
        You've used your {limit} AI actions this month
      </Text>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        Your tasks, calendar, notes, and reminders are still fully available.
      </Text>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        Upgrade to Anchor Pro for expanded AI assistance.
      </Text>

      <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Maybe later" variant="secondary" onPress={onDismiss} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Upgrade to Pro" onPress={handleUpgrade} />
        </View>
      </View>
    </Card>
  );
}
