import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { IconBadge, Sheet } from '../../components/ui';
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
  /** Kept to two restrained hues (not a color per action) so the grid stays
   *  calm rather than turning into a rainbow — money-related actions are
   *  tinted with the same success green used for income elsewhere in the
   *  app, everything else uses the theme accent. */
  tone: 'accent' | 'money';
}

const OPTIONS: AddOption[] = [
  { key: 'task', label: 'Task', icon: 'checkbox-outline', tone: 'accent' },
  { key: 'event', label: 'Event', icon: 'calendar-outline', tone: 'accent' },
  { key: 'reminder', label: 'Reminder', icon: 'alarm-outline', tone: 'accent' },
  { key: 'note', label: 'Note', icon: 'document-text-outline', tone: 'accent' },
  { key: 'expense', label: 'Expense', icon: 'cash-outline', tone: 'money' },
  { key: 'bill', label: 'Bill', icon: 'receipt-outline', tone: 'money' },
  { key: 'habit', label: 'Habit', icon: 'repeat-outline', tone: 'accent' },
  { key: 'shopping', label: 'Shopping item', icon: 'cart-outline', tone: 'accent' },
  { key: 'document', label: 'Document', icon: 'folder-outline', tone: 'accent' },
  { key: 'brain-dump', label: 'Brain Dump', icon: 'flash-outline', tone: 'accent' },
];

const NUM_COLUMNS = 3;

export function AddSheet() {
  const router = useRouter();
  const { colors, spacing, radius, shadow, scheme, typography } = useTheme();

  function handleSelect(key: AddOptionKey) {
    if (key === 'task' || key === 'reminder') {
      // Anchor has no separate "reminder" entity — a reminder is a task
      // with a due date/time, which is exactly what the task composer
      // (and its reminder-notification scheduling) already handles.
      // Replace rather than push so we don't stack two modals on top of
      // each other - this reads as one continuous sheet to the user.
      router.replace('/task-new');
      return;
    }

    if (key === 'event') {
      router.replace('/event-new');
      return;
    }

    if (key === 'brain-dump') {
      router.replace('/brain-dump');
      return;
    }

    if (key === 'expense') {
      router.replace('/expense-new');
      return;
    }

    if (key === 'bill') {
      router.replace('/bill-new');
      return;
    }

    if (key === 'note') {
      router.replace('/note-new');
      return;
    }

    if (key === 'habit') {
      router.replace('/habit-new');
      return;
    }

    if (key === 'shopping') {
      router.replace('/shopping-item-new');
      return;
    }

    if (key === 'document') {
      router.replace('/document-new');
      return;
    }

    router.back();
  }

  return (
    <Sheet scroll={false}>
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        Add something
      </Text>
      <FlatList
        data={OPTIONS}
        keyExtractor={(item) => item.key}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={{ gap: spacing.sm }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => handleSelect(item.key)}
            style={({ pressed }) => [
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 92,
                gap: spacing.xs,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: scheme === 'dark' ? 1 : 0,
                borderColor: colors.border,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.xs,
                opacity: pressed ? 0.7 : 1,
                ...shadow.sm,
              },
            ]}
          >
            <IconBadge name={item.icon} color={item.tone === 'money' ? colors.success : colors.accent} size="md" />
            <Text
              style={[typography.caption, { color: colors.textPrimary, textAlign: 'center' }]}
              numberOfLines={2}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </Sheet>
  );
}
