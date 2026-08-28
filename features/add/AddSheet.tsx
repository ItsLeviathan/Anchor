import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '../../components/ui';
import { useTheme } from '../../lib/theme/ThemeProvider';

type AddOptionKey =
  | 'task'
  | 'event'
  | 'reminder'
  | 'note'
  | 'expense'
  | 'bill'
  | 'habit'
  | 'shopping'
  | 'document'
  | 'brain-dump';

interface AddOption {
  key: AddOptionKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: AddOption[] = [
  { key: 'task', label: 'Task', icon: 'checkbox-outline' },
  { key: 'event', label: 'Event', icon: 'calendar-outline' },
  { key: 'reminder', label: 'Reminder', icon: 'alarm-outline' },
  { key: 'note', label: 'Note', icon: 'document-text-outline' },
  { key: 'expense', label: 'Expense', icon: 'cash-outline' },
  { key: 'bill', label: 'Bill', icon: 'receipt-outline' },
  { key: 'habit', label: 'Habit', icon: 'repeat-outline' },
  { key: 'shopping', label: 'Shopping item', icon: 'cart-outline' },
  { key: 'document', label: 'Document', icon: 'folder-outline' },
  { key: 'brain-dump', label: 'Brain Dump', icon: 'flash-outline' },
];

export function AddSheet() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();

  function handleSelect(_key: AddOptionKey) {
    // Real per-type creation flows arrive in Phase 2 (Task/Event/Reminder)
    // and Phase 5 (Expense/Bill/Document/Habit/Shopping) and Phase 4
    // (Brain Dump). For now this just proves the shell: tapping an option
    // closes the sheet rather than pretending to create something.
    router.back();
  }

  return (
    <Sheet>
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        Add something
      </Text>
      <FlatList
        data={OPTIONS}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item.key)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.md,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={colors.accent} />
            <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.md }]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
