import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { WeekdaySelector } from '../../components/habits/WeekdaySelector';
import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { HabitFrequency } from '../../types';
import { useCreateHabit } from './useHabits';

export function HabitComposer() {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const createHabit = useCreateHabit(userId);

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);

  const canSave = Boolean(userId) && name.trim().length > 0 && !createHabit.isPending;

  async function handleSave() {
    if (!userId || !canSave) return;

    await createHabit.mutateAsync({
      userId,
      name,
      frequency,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : null,
    });

    router.back();
  }

  return (
    <Sheet>
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>New habit</Text>

      <Input autoFocus placeholder="e.g. Drink water, Read, Stretch" value={name} onChangeText={setName} />

      <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
        FREQUENCY
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {(['daily', 'weekly'] as HabitFrequency[]).map((option) => {
          const selected = option === frequency;
          return (
            <Pressable
              key={option}
              onPress={() => setFrequency(option)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? colors.accentMuted : colors.surface,
              }}
            >
              <Text style={[typography.subhead, { color: selected ? colors.accent : colors.textSecondary }]}>
                {option === 'daily' ? 'Every day' : 'Specific days'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {frequency === 'weekly' ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
            WHICH DAYS
          </Text>
          <WeekdaySelector value={daysOfWeek} onChange={setDaysOfWeek} />
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Add habit" onPress={handleSave} disabled={!canSave} loading={createHabit.isPending} />
      </View>
    </Sheet>
  );
}
