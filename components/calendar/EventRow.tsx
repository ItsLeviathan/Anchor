import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { CalendarEvent } from '../../types';

interface EventRowProps {
  event: CalendarEvent;
  onDelete: (event: CalendarEvent) => void;
}

export function EventRow({ event, onDelete }: EventRowProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const timeLabel = event.allDay
    ? 'All day'
    : `${new Date(event.startAt).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })} – ${new Date(event.endAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

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
      <View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: colors.accent, marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.textPrimary }]} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{timeLabel}</Text>
      </View>
      <Pressable accessibilityLabel="Delete event" onPress={() => onDelete(event)} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}
