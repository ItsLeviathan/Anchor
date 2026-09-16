import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Note } from '../../types';
import { Card, IconBadge } from '../ui';

interface NoteListItemProps {
  note: Note;
  /** Color of the note's category, when known. Falls back to the theme accent. */
  categoryColor?: string;
  onTogglePin: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const NoteListItem = React.memo(function NoteListItem({
  note,
  categoryColor,
  onTogglePin,
  onDelete,
}: NoteListItemProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <IconBadge name="document-text-outline" color={categoryColor} size="sm" />
        <View style={{ flex: 1, marginLeft: spacing.sm, marginRight: spacing.sm }}>
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
              hitSlop={13}
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
              hitSlop={13}
            >
            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
});
