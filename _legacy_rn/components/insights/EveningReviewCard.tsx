import React from 'react';
import { Text, View } from 'react-native';

import type { EveningReview } from '../../lib/insights/eveningReview';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { Card, IconBadge } from '../ui';

interface EveningReviewCardProps {
  review: EveningReview;
}

export function EveningReviewCard({ review }: EveningReviewCardProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Card elevation="md" style={{ marginBottom: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconBadge name="moon-outline" size="sm" />
        <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: spacing.sm }]}>YOUR DAY</Text>
      </View>
      <View style={{ marginTop: spacing.xs, gap: 4 }}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>
          ✓ {review.tasksCompletedToday} {review.tasksCompletedToday === 1 ? 'task' : 'tasks'} completed
        </Text>
        <Text style={[typography.body, { color: colors.textPrimary }]}>
          ✓ {review.habitsCompletedToday} {review.habitsCompletedToday === 1 ? 'habit' : 'habits'} completed
        </Text>
        {review.stillPendingCount > 0 ? (
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            ○ {review.stillPendingCount} {review.stillPendingCount === 1 ? 'task' : 'tasks'} still open
          </Text>
        ) : null}
      </View>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        {review.tomorrowCount > 0
          ? `${review.tomorrowCount} ${review.tomorrowCount === 1 ? 'thing is' : 'things are'} scheduled tomorrow.`
          : 'Tomorrow looks clear.'}
      </Text>
    </Card>
  );
}
