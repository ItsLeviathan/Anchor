import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import { Button, Card } from '../ui';

const PRO_PERKS = [
  'Advanced AI Brain Dump & task extraction',
  'AI task breakdown and daily planning',
  'AI weekly reviews',
  'Advanced insights',
  'Multiple calendars',
  'Expanded document storage',
];

interface AiLimitReachedNoticeProps {
  limit: number;
  onDismiss: () => void;
}

export function AiLimitReachedNotice({ limit, onDismiss }: AiLimitReachedNoticeProps) {
  const { colors, spacing, typography } = useTheme();
  const [showPerks, setShowPerks] = useState(false);

  return (
    <Card>
      <Text style={[typography.headline, { color: colors.textPrimary }]}>
        You've used your {limit} AI actions this month
      </Text>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        Your tasks, calendar, notes, and reminders are still fully available. AI assistance picks back up next
        month.
      </Text>

      {showPerks ? (
        <View style={{ marginTop: spacing.md }}>
          {PRO_PERKS.map((perk) => (
            <Text key={perk} style={[typography.subhead, { color: colors.textSecondary, marginTop: 4 }]}>
              • {perk}
            </Text>
          ))}
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}>
            Anchor Pro isn't available to purchase yet in this build.
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Maybe later" variant="secondary" onPress={onDismiss} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={showPerks ? 'Hide details' : 'Explore Anchor Pro'}
            variant="ghost"
            onPress={() => setShowPerks((prev) => !prev)}
          />
        </View>
      </View>
    </Card>
  );
}
