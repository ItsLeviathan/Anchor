import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Note } from '../../types';

interface NoteListItemProps {
  note: Note;
  onTogglePin: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const NoteListItem = React.memo(function NoteListItem({ note, onTogglePin, onDelete }: NoteListItemProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          {note.title ? (
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
              {note.title}
            </Text>
          ) : null}
          <Text
            style={[typography.subhead, { color: colors.textSecondary, marginTop: note.title ? 2 : 0 }]}
            numberOfLines={2}
          >
            {note.content}
          </Text>
          {note.tags.length > 0 ? (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>
              {note.tags.map((tag) => `#${tag}`).join('  ')}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
              accessibilityRole="button"
              accessibilityLabel={note.isPinned ? 'Unpin note' : 'Pin note'}
              accessibilityHint={note.isPinned ? 'Removes the pin from this note' : 'Pins this note to the top'}
              onPress={() => onTogglePin(note)}
              hitSlop={8}
            >
            <Ionicons
              name={note.isPinned ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={note.isPinned ? colors.accent : colors.textTertiary}
            />
          </Pressable>
          <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete note"
              accessibilityHint="Permanently removes this note"
              onPress={() => onDelete(note)}
              hitSlop={8}
            >
            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});
