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

  function handleSelect(key: AddOptionKey) {
    if (key === 'task') {
      // Replace rather than push so we don't stack two modals on top of
      // each other - this reads as one continuous sheet to the user.
      router.replace('/task-new');
      return;
    }

    // Every other type arrives in a later phase (Event/Reminder in the
    // Calendar slice, Expense/Bill/Document/Habit/Shopping in Phase 5,
    // Brain Dump in Phase 4). For now, just close.
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
