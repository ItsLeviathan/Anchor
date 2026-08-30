import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BillListItem } from '../../../components/bills/BillListItem';
import { HabitListItem } from '../../../components/habits/HabitListItem';
import { NoteListItem } from '../../../components/notes/NoteListItem';
import { ShoppingItemRow } from '../../../components/shopping/ShoppingItemRow';
import { Card, EmptyState } from '../../../components/ui';
import { useBills, useDeleteBill, useMarkBillPaid } from '../../../features/bills/useBills';
import { useExpenses } from '../../../features/expenses/useExpenses';
import { useDeleteHabit, useHabits, useToggleHabitToday } from '../../../features/habits/useHabits';
import { useDeleteNote, useNotes, useToggleNotePinned } from '../../../features/notes/useNotes';
import {
  useClearCompletedItems,
  useRemoveShoppingItem,
  useShoppingList,
  useToggleShoppingItem,
} from '../../../features/shopping/useShoppingList';
import { computeMonthlySummary } from '../../../lib/expenses/summary';
import { useSession } from '../../../lib/supabase/useSession';
import { useTheme } from '../../../lib/theme/ThemeProvider';

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
      }}
    >
      <Text style={[typography.headline, { color: colors.textPrimary }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[typography.subhead, { color: colors.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

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

  const { data: notes = [], isLoading: isNotesLoading } = useNotes(userId);
  const togglePinned = useToggleNotePinned(userId);
  const deleteNote = useDeleteNote(userId);

  const { data: habits = [], isLoading: isHabitsLoading } = useHabits(userId);
  const toggleHabitToday = useToggleHabitToday(userId);
  const deleteHabit = useDeleteHabit(userId);

  const { data: shoppingList, isLoading: isShoppingLoading } = useShoppingList(userId);
  const toggleShoppingItem = useToggleShoppingItem(userId);
  const removeShoppingItem = useRemoveShoppingItem(userId);
  const clearCompleted = useClearCompletedItems(userId);

  const summary = useMemo(() => computeMonthlySummary(expenses), [expenses]);
  const upcomingBills = useMemo(
    () => bills.filter((bill) => bill.status === 'unpaid').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [bills]
  );
  const activeShoppingItems = shoppingList?.items.filter((item) => !item.isCompleted) ?? [];
  const completedShoppingItems = shoppingList?.items.filter((item) => item.isCompleted) ?? [];

  const isLoading =
    isSessionLoading || isExpensesLoading || isBillsLoading || isNotesLoading || isHabitsLoading || isShoppingLoading;
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
          {/* ---------- Money ---------- */}
          <SectionHeader title="Money" />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm }}>
            <Pressable onPress={() => router.push('/bill-new')} hitSlop={8}>
              <Text style={[typography.subhead, { color: colors.accent }]}>+ Bill</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/expense-new')} hitSlop={8}>
              <Text style={[typography.subhead, { color: colors.accent }]}>+ Expense</Text>
            </Pressable>
          </View>

          <Card style={{ marginBottom: spacing.md }}>
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
            <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
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

          {/* ---------- Habits ---------- */}
          <SectionHeader title="Habits" actionLabel="+ Habit" onAction={() => router.push('/habit-new')} />
          {habits.length === 0 ? (
            <EmptyState message="Start with one small habit." />
          ) : (
            <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
              {habits.map((habit) => (
                <HabitListItem
                  key={habit.id}
                  habit={habit}
                  onToggleToday={(h) => toggleHabitToday.mutate(h)}
                  onDelete={(h) => deleteHabit.mutate(h.id)}
                />
              ))}
            </View>
          )}

          {/* ---------- Shopping ---------- */}
          <SectionHeader title="Shopping" actionLabel="+ Item" onAction={() => router.push('/shopping-item-new')} />
          {activeShoppingItems.length === 0 && completedShoppingItems.length === 0 ? (
            <EmptyState message="Your shopping list is empty." />
          ) : (
            <Card style={{ marginBottom: spacing.lg }}>
              {activeShoppingItems.map((item) => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  onToggle={(i) => shoppingList && toggleShoppingItem.mutate({ list: shoppingList, itemId: i.id })}
                  onRemove={(i) => shoppingList && removeShoppingItem.mutate({ list: shoppingList, itemId: i.id })}
                />
              ))}
              {completedShoppingItems.length > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>
                      {completedShoppingItems.length} checked off
                    </Text>
                    <Pressable onPress={() => shoppingList && clearCompleted.mutate(shoppingList)} hitSlop={8}>
                      <Text style={[typography.caption, { color: colors.accent }]}>Clear</Text>
                    </Pressable>
                  </View>
                  {completedShoppingItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={(i) => shoppingList && toggleShoppingItem.mutate({ list: shoppingList, itemId: i.id })}
                      onRemove={(i) => shoppingList && removeShoppingItem.mutate({ list: shoppingList, itemId: i.id })}
                    />
                  ))}
                </>
              ) : null}
            </Card>
          )}

          {/* ---------- Notes ---------- */}
          <SectionHeader title="Notes" actionLabel="+ Note" onAction={() => router.push('/note-new')} />
          {notes.length === 0 ? (
            <EmptyState message="Your notes will live here." />
          ) : (
            <View style={{ gap: spacing.xs }}>
              {notes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  onTogglePin={(n) => togglePinned.mutate(n)}
                  onDelete={(n) => deleteNote.mutate(n.id)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
