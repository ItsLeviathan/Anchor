import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { MoneyCategorySelector } from '../../components/expenses/MoneyCategorySelector';
import { DueDatePicker } from '../../components/tasks/DueDatePicker';
import { RecurrenceSelector } from '../../components/tasks/RecurrenceSelector';
import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { MoneyCategory, RecurrenceRule } from '../../types';
import { useCreateBill } from './useBills';

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function BillComposer() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const createBill = useCreateBill(userId);

  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<MoneyCategory>('Bills');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);

  const amount = parseFloat(amountText.replace(/,/g, ''));
  const canSave = Boolean(userId) && name.trim().length > 0 && Number.isFinite(amount) && amount > 0 && !createBill.isPending;

  async function handleSave() {
    if (!userId || !canSave) return;

    await createBill.mutateAsync({
      userId,
      name,
      amount,
      category,
      dueDate: toDatePart(dueDate),
      recurrenceRule,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>Add bill</Text>

        <Input autoFocus placeholder="Bill name (e.g. Electricity)" value={name} onChangeText={setName} />

        <Input
          keyboardType="decimal-pad"
          placeholder="Amount"
          value={amountText}
          onChangeText={setAmountText}
          style={{ marginTop: spacing.md }}
        />

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          CATEGORY
        </Text>
        <MoneyCategorySelector value={category} onChange={setCategory} />

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          DUE
        </Text>
        <DueDatePicker dueDate={dueDate} onChange={(d) => d && setDueDate(d)} mode="date" label="Set due date" />

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          REPEAT
        </Text>
        <RecurrenceSelector value={recurrenceRule} onChange={setRecurrenceRule} />

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Add bill" onPress={handleSave} disabled={!canSave} loading={createBill.isPending} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
