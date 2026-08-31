import React from 'react';
import { Text, View } from 'react-native';

import { formatWorkload, type DailyBriefing } from '../../lib/insights/dailyBriefing';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { Card } from '../ui';

interface DailyBriefingCardProps {
  briefing: DailyBriefing;
}

export function DailyBriefingCard({ briefing }: DailyBriefingCardProps) {
  const { colors, spacing, typography } = useTheme();
  const workloadLabel = formatWorkload(briefing.estimatedWorkloadMinutes);

  const parts: string[] = [];
  if (briefing.importantTaskCount > 0) {
    parts.push(`${briefing.importantTaskCount} important ${briefing.importantTaskCount === 1 ? 'task' : 'tasks'}`);
  }
  if (briefing.appointmentCount > 0) {
    parts.push(`${briefing.appointmentCount} ${briefing.appointmentCount === 1 ? 'appointment' : 'appointments'}`);
  }
  if (briefing.upcomingBillCount > 0) {
    parts.push(`${briefing.upcomingBillCount} upcoming ${briefing.upcomingBillCount === 1 ? 'bill' : 'bills'}`);
  }
  if (briefing.habitCount > 0) {
    parts.push(`${briefing.habitCount} ${briefing.habitCount === 1 ? 'habit' : 'habits'}`);
  }

  if (parts.length === 0) return null;

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.caption, { color: colors.textTertiary }]}>TODAY YOU HAVE</Text>
      <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.xs }]}>{parts.join(' · ')}</Text>

      {briefing.mostImportantTask ? (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>MOST IMPORTANT</Text>
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 2 }]} numberOfLines={1}>
            {briefing.mostImportantTask.title}
          </Text>
        </View>
      ) : null}

      {workloadLabel ? (
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}>
          Estimated workload: {workloadLabel}
        </Text>
      ) : null}
    </Card>
  );
}
