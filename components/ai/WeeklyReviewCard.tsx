import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AiLimitReachedNotice } from './AiLimitReachedNotice';
import { Card } from '../ui';
import { AiLimitReachedError, requestWeeklyReview } from '../../features/ai/aiClient';
import { useTheme } from '../../lib/theme/ThemeProvider';

type Status = 'idle' | 'loading' | 'done' | 'limit_reached' | 'error';

export function WeeklyReviewCard() {
  const { colors, spacing, typography } = useTheme();
  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{ limit: number; used: number } | null>(null);

  async function handleReview() {
    setStatus('loading');
    try {
      const response = await requestWeeklyReview();
      setSummary(response.summary);
      setStatus('done');
    } catch (err) {
      if (err instanceof AiLimitReachedError) {
        setLimitInfo({ limit: err.limit, used: err.used });
        setStatus('limit_reached');
      } else {
        console.error('Weekly review failed', err);
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
          Reviewing your week…
        </Text>
      </Card>
    );
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
          {status === 'error'
            ? "Couldn't load your review — tap to try again."
            : 'A quiet look at how your week went.'}
        </Text>
      </Card>
    </Pressable>
  );
}
