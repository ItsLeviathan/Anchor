import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { ExpenseTypeToggle } from '../../components/expenses/ExpenseTypeToggle';
import { MoneyCategorySelector } from '../../components/expenses/MoneyCategorySelector';
import { DueDatePicker } from '../../components/tasks/DueDatePicker';
import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { ExpenseType, MoneyCategory } from '../../types';
import { useCreateExpense } from './useExpenses';

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ExpenseComposer() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const createExpense = useCreateExpense(userId);

  const [type, setType] = useState<ExpenseType>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<MoneyCategory>('Other');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  const amount = parseFloat(amountText.replace(/,/g, ''));
  const canSave = Boolean(userId) && Number.isFinite(amount) && amount > 0 && !createExpense.isPending;

  async function handleSave() {
    if (!userId || !canSave) return;

    await createExpense.mutateAsync({
      userId,
      type,
      amount,
      category,
      date: toDatePart(date),
      notes: notes.trim() || null,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>
          Add expense
        </Text>

        <ExpenseTypeToggle value={type} onChange={setType} />

        <Input
          keyboardType="decimal-pad"
          placeholder="0.00"
          value={amountText}
          onChangeText={setAmountText}
          style={{ marginTop: spacing.md, ...typography.largeTitle }}
        />

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          CATEGORY
        </Text>
        <MoneyCategorySelector value={category} onChange={setCategory} />

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          DATE
        </Text>
        <DueDatePicker dueDate={date} onChange={(d) => d && setDate(d)} mode="date" label="Set date" />

        <View style={{ marginTop: spacing.md }}>
          <Input placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label={type === 'income' ? 'Add income' : 'Add expense'}
            onPress={handleSave}
            disabled={!canSave}
            loading={createExpense.isPending}
          />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
