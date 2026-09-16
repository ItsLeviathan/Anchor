import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Expense } from '../../types';
import { Card, IconBadge } from '../ui';

interface ExpenseListItemProps {
  expense: Expense;
  onDelete: (expense: Expense) => void;
}

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ExpenseListItem = React.memo(function ExpenseListItem({ expense, onDelete }: ExpenseListItemProps) {
  const { colors, spacing, typography } = useTheme();
  const isIncome = expense.type === 'income';

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
      <IconBadge
        name={isIncome ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
        color={isIncome ? colors.success : colors.textSecondary}
        size="sm"
      />

      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.body, { color: colors.textPrimary }]} numberOfLines={1}>
          {expense.notes || expense.category}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {expense.category} · {formatDateLabel(expense.date)}
        </Text>
      </View>

      <Text
        style={[
          typography.headline,
          { color: isIncome ? colors.success : colors.textPrimary, marginRight: spacing.sm },
        ]}
      >
        {isIncome ? '+' : '-'}
        {expense.currency} {expense.amount.toFixed(2)}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete expense"
        accessibilityHint="Permanently removes this expense"
        onPress={() => onDelete(expense)}
        hitSlop={13}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
      </Pressable>
    </Card>
  );
});
