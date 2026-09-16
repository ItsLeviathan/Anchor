import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, IconBadge } from '../../components/ui';
import { useEvents } from '../events/useEvents';
import { useHabits } from '../habits/useHabits';
import { computeDailyPlan } from '../../lib/planning/dailyPlan';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useTasks } from '../tasks/useTasks';

type Status = 'idle' | 'done';

interface DailyPlanCardProps {
  onFocusTask?: (taskId: string) => void;
}

export function DailyPlanCard({ onFocusTask }: DailyPlanCardProps) {
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: tasks = [] } = useTasks(userId);
  const { data: events = [] } = useEvents(userId);
  const { data: habits = [] } = useHabits(userId);

  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<string | null>(null);

  function handlePlan() {
    const result = computeDailyPlan(tasks, events, habits);
    setSummary(result.summary);
    setStatus('done');
    if (result.focusTaskId) onFocusTask?.(result.focusTaskId);
  }

  if (status === 'done' && summary) {
    return (
      <Card elevation="md" style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBadge name="sparkles-outline" size="sm" />
          <Text style={[typography.headline, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
            Today's plan
          </Text>
        </View>
        <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.xs }]}>{summary}</Text>
      </Card>
    );
  }

  return (
    <Pressable onPress={handlePlan}>
      <Card elevation="md" style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBadge name="sparkles-outline" size="sm" />
          <Text style={[typography.headline, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
            Plan my day
          </Text>
        </View>
        <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          See what to focus on, based on what's due and scheduled today.
        </Text>
      </Card>
    </Pressable>
  );
}
