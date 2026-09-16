import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Bill } from '../../types';
import { IconBadge } from '../ui';

interface BillListItemProps {
  bill: Bill;
  onMarkPaid: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}

function isBillOverdue(dueDate: string): boolean {
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const now = new Date();
  return due.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function formatDueLabel(dueDate: string, overdue: boolean): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return overdue ? `Overdue · ${label}` : `Due ${label}`;
}

export const BillListItem = React.memo(function BillListItem({ bill, onMarkPaid, onDelete }: BillListItemProps) {
  const { colors, spacing, typography } = useTheme();
  const isPaid = bill.status === 'paid';
  const overdue = !isPaid && isBillOverdue(bill.dueDate);
  const badgeColor = overdue ? colors.danger : isPaid ? colors.success : colors.accent;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 3,
        paddingHorizontal: spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isPaid }}
        accessibilityLabel={isPaid ? 'Paid' : 'Mark as paid'}
        accessibilityHint={isPaid ? 'This bill is already paid' : 'Records this bill as paid and logs an expense'}
        onPress={() => !isPaid && onMarkPaid(bill)}
        hitSlop={11}
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: isPaid ? colors.success : colors.border,
          backgroundColor: isPaid ? colors.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isPaid ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </Pressable>

      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text
          style={[
            typography.body,
            {
              color: isPaid ? colors.textTertiary : colors.textPrimary,
              textDecorationLine: isPaid ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {bill.name}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {formatDueLabel(bill.dueDate, overdue)}
        </Text>
      </View>

      <View style={{ marginHorizontal: spacing.sm }}>
        <IconBadge name="cash-outline" color={badgeColor} size="sm" />
      </View>

      <Text style={[typography.headline, { color: colors.textPrimary, marginRight: spacing.sm }]}>
        {bill.currency} {bill.amount.toFixed(2)}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete bill"
        accessibilityHint="Permanently removes this bill"
        onPress={() => onDelete(bill)}
        hitSlop={13}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
});
