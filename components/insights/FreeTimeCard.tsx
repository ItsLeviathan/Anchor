import React from 'react';
import { Text } from 'react-native';

import type { FreeTimeSuggestion } from '../../lib/insights/freeTime';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { Card } from '../ui';

interface FreeTimeCardProps {
  suggestion: FreeTimeSuggestion;
}

function formatTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'this morning';
  if (hour < 17) return 'this afternoon';
  return 'this evening';
}

export function FreeTimeCard({ suggestion }: FreeTimeCardProps) {
  const { colors, spacing, typography } = useTheme();
  const { slot, task } = suggestion;
  const hours = Math.floor(slot.minutes / 60);
  const mins = slot.minutes % 60;
  const durationLabel = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins} minutes`;

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.body, { color: colors.textPrimary }]}>
        You have {durationLabel} free {formatTimeOfDay(slot.start)}. Want to work on{' '}
        <Text style={{ fontWeight: '600' }}>{task.title}</Text>?
      </Text>
    </Card>
  );
}
