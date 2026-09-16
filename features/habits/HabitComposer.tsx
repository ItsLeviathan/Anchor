import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { WeekdaySelector } from '../../components/habits/WeekdaySelector';
import { Button, FormSection, Input, Sheet } from '../../components/ui';
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

    try {
      await createHabit.mutateAsync({
        userId,
        name,
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : null,
      });

      router.back();
    } catch (err) {
      // Global mutation error handler already toasts; just keep the sheet
      // open (input preserved) and avoid an unhandled rejection.
      console.error('Failed to create habit', err);
    }
  }

  return (
    <Sheet>
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>New habit</Text>

      <Input autoFocus placeholder="e.g. Drink water, Read, Stretch" value={name} onChangeText={setName} />

      <FormSection label="Frequency" icon="repeat-outline">
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
      </FormSection>

      {frequency === 'weekly' ? (
        <FormSection label="Which days" icon="calendar-outline">
          <WeekdaySelector value={daysOfWeek} onChange={setDaysOfWeek} />
        </FormSection>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Add habit" onPress={handleSave} disabled={!canSave} loading={createHabit.isPending} />
      </View>
    </Sheet>
  );
}
