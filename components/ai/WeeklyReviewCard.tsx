import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { Card } from '../ui';
import { useExpenses } from '../../features/expenses/useExpenses';
import { useHabits } from '../../features/habits/useHabits';
import { useTasks } from '../../features/tasks/useTasks';
import { computeWeeklyReview } from '../../lib/planning/weeklyReview';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';

type Status = 'idle' | 'done';

export function WeeklyReviewCard() {
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: tasks = [] } = useTasks(userId);
  const { data: habits = [] } = useHabits(userId);
  const { data: expenses = [] } = useExpenses(userId);

  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<string | null>(null);

  function handleReview() {
    const result = computeWeeklyReview(tasks, habits, expenses);
    setSummary(result.summary);
    setStatus('done');
  }

  if (status === 'done' && summary) {
    return (
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>Your week</Text>
        <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.xs }]}>{summary}</Text>
        <Pressable onPress={() => { setSummary(null); setStatus('idle'); }} style={{ marginTop: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textTertiary, textDecorationLine: 'underline' }]}>
            Refresh
          </Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <Pressable onPress={handleReview}>
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>Weekly review</Text>
        <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          A quiet look at how your week went.
        </Text>
      </Card>
    </Pressable>
  );
}
