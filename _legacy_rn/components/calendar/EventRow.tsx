import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import { Card } from '../ui/Card';
import { IconBadge } from '../ui/IconBadge';
import type { CalendarEvent } from '../../types';

interface EventRowProps {
  event: CalendarEvent;
  onDelete: (event: CalendarEvent) => void;
}

export function EventRow({ event, onDelete }: EventRowProps) {
  const { colors, spacing, typography } = useTheme();

  const timeLabel = event.allDay
    ? 'All day'
    : `${new Date(event.startAt).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })} – ${new Date(event.endAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

  return (
    // Kept as its own floating card (not the grouped/inset ListSection
    // style used elsewhere) because this only ever renders inline with
    // TaskRow in the Calendar day agenda — the two need to read as
    // siblings in that mixed, swipeable-primary-action list.
    <Card elevation="sm" style={{ flexDirection: 'row', alignItems: 'center' }}>
      <IconBadge name={event.allDay ? 'calendar-outline' : 'time-outline'} color={colors.accent} size="sm" />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.body, { color: colors.textPrimary }]} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{timeLabel}</Text>
      </View>
      <Pressable accessibilityLabel="Delete event" onPress={() => onDelete(event)} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textTertiary} />
      </Pressable>
    </Card>
  );
}
