import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AiLimitReachedNotice } from '../../components/ai/AiLimitReachedNotice';
import { Card } from '../../components/ui';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { AiLimitReachedError, requestDailyPlan } from './aiClient';

type Status = 'idle' | 'loading' | 'done' | 'limit_reached' | 'error';

interface DailyPlanCardProps {
  onFocusTask?: (taskId: string) => void;
}

export function DailyPlanCard({ onFocusTask }: DailyPlanCardProps) {
  const { colors, spacing, typography } = useTheme();
  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{ limit: number; used: number } | null>(null);

  async function handlePlan() {
    setStatus('loading');
    try {
      const response = await requestDailyPlan();
      setSummary(response.summary);
      setStatus('done');
      if (response.focusTaskId) onFocusTask?.(response.focusTaskId);
    } catch (err) {
      if (err instanceof AiLimitReachedError) {
        setLimitInfo({ limit: err.limit, used: err.used });
        setStatus('limit_reached');
      } else {
        console.error('Daily plan failed', err);
        setStatus('error');
      }
    }
  }

  if (status === 'limit_reached' && limitInfo) {
    return (
      <View style={{ marginBottom: spacing.lg }}>
        <AiLimitReachedNotice limit={limitInfo.limit} onDismiss={() => setStatus('idle')} />
      </View>
    );
  }

  if (status === 'loading') {
    return (
      <Card style={{ marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[typography.subhead, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
          Thinking about your day…
        </Text>
      </Card>
    );
  }

  if (status === 'done' && summary) {
    return (
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>Today's plan</Text>
        <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.xs }]}>{summary}</Text>
      </Card>
    );
  }

  return (
    <Pressable onPress={handlePlan}>
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>Plan my day</Text>
        <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {status === 'error'
            ? "Couldn't reach Anchor's planning assistant — tap to try again."
            : "Let Anchor suggest what to focus on, based on what's due and scheduled today."}
        </Text>
      </Card>
    </Pressable>
  );
}
