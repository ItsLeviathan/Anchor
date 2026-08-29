import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BillListItem } from '../../../components/bills/BillListItem';
import { Card, EmptyState } from '../../../components/ui';
import { useBills, useDeleteBill, useMarkBillPaid } from '../../../features/bills/useBills';
import { useExpenses } from '../../../features/expenses/useExpenses';
import { computeMonthlySummary } from '../../../lib/expenses/summary';
import { useSession } from '../../../lib/supabase/useSession';
import { useTheme } from '../../../lib/theme/ThemeProvider';

export default function LifeScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { session, isLoading: isSessionLoading } = useSession();
  const userId = session?.user.id;

  const { data: expenses = [], isLoading: isExpensesLoading } = useExpenses(userId);
  const { data: bills = [], isLoading: isBillsLoading } = useBills(userId);
  const markBillPaid = useMarkBillPaid(userId);
  const deleteBill = useDeleteBill(userId);

  const summary = useMemo(() => computeMonthlySummary(expenses), [expenses]);

  const upcomingBills = useMemo(
    () => bills.filter((bill) => bill.status === 'unpaid').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [bills]
  );

  const isLoading = isSessionLoading || isExpensesLoading || isBillsLoading;
  const currency = expenses[0]?.currency ?? bills[0]?.currency ?? 'PHP';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
      }}
    >
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.lg }]}>Life</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <Text style={[typography.headline, { color: colors.textPrimary }]}>Money</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Pressable onPress={() => router.push('/bill-new')} hitSlop={8}>
                <Text style={[typography.subhead, { color: colors.accent }]}>+ Bill</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/expense-new')} hitSlop={8}>
                <Text style={[typography.subhead, { color: colors.accent }]}>+ Expense</Text>
              </Pressable>
            </View>
          </View>

          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>THIS MONTH</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <View>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>Income</Text>
                <Text style={[typography.headline, { color: colors.success }]}>
                  {currency} {summary.income.toFixed(2)}
                </Text>
              </View>
              <View>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>Expenses</Text>
                <Text style={[typography.headline, { color: colors.danger }]}>
                  {currency} {summary.expenses.toFixed(2)}
                </Text>
              </View>
              <View>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>Remaining</Text>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  {currency} {summary.remaining.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
            UPCOMING BILLS
          </Text>
          {upcomingBills.length === 0 ? (
            <EmptyState message="No bills due right now." />
          ) : (
            <View style={{ gap: spacing.xs }}>
              {upcomingBills.map((bill) => (
                <BillListItem
                  key={bill.id}
                  bill={bill}
                  onMarkPaid={(b) => markBillPaid.mutate(b)}
                  onDelete={(b) => deleteBill.mutate(b.id)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
