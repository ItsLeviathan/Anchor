import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Bill } from '../../types';

interface BillListItemProps {
  bill: Bill;
  onMarkPaid: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}

function formatDueLabel(dueDate: string): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const now = new Date();
  const isOverdue = due.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return isOverdue ? `Overdue · ${label}` : `Due ${label}`;
}

export function BillListItem({ bill, onMarkPaid, onDelete }: BillListItemProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const isPaid = bill.status === 'paid';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isPaid }}
        accessibilityLabel={isPaid ? 'Paid' : 'Mark as paid'}
        onPress={() => !isPaid && onMarkPaid(bill)}
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
          {formatDueLabel(bill.dueDate)}
        </Text>
      </View>

      <Text style={[typography.headline, { color: colors.textPrimary, marginRight: spacing.sm }]}>
        {bill.currency} {bill.amount.toFixed(2)}
      </Text>

      <Pressable accessibilityLabel="Delete bill" onPress={() => onDelete(bill)} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}
